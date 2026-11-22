// Panel del comercio (antes "del operador"): entrada con PIN, lista de despacho y botón "despachado".
// Tokens firmados con HMAC-SHA256 y SECRETO_SESION:
//   - viejo (sin rol):  `<vencimiento>.<firma>`           → se trata como comercio `grimuca`.
//   - con rol:          `<rol>.<comercio>.<vencimiento>.<firma>` (el superadmin lleva `-` como comercio).
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { RolPlataforma } from '../tipos';
import { buscarPedido, pedidosDelOperador } from './datos';
import { ErrorHttp, noEncontrado } from './errores';
import { buscarComercio, COMERCIO_PRINCIPAL, serviciosDeComercio, tiendasDeComercio } from './plataforma';

/** Duración de la sesión: cubre todo el fin de semana de la demo. */
export const DURACION_TOKEN_MS = 3 * 24 * 60 * 60 * 1000;

export const MENSAJE_SIN_SESION = 'Tu sesión de operador venció o no es válida. Vuelve a entrar con el PIN.';
const MENSAJE_OTRO_ROL = 'Esta sesión no tiene permiso para esta sección. Entra con el PIN que corresponde.';

/** Lo que lleva el token. `comercio_id` es null solo para el superadmin. */
export interface Sesion {
  rol: RolPlataforma;
  comercio_id: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Sesión leída del token (la llenan `exigirOperador` y `exigirRol`). */
    sesion?: Sesion;
  }
}

const ROLES: readonly RolPlataforma[] = ['comercio', 'superadmin', 'tecnico'];
const PATRON_COMERCIO = /^[a-z0-9-]{1,60}$/;

function firmar(secreto: string, vencimiento: string): string {
  return createHmac('sha256', secreto).update(`operador.${vencimiento}`).digest('base64url');
}

function firmarConRol(secreto: string, rol: string, comercio: string, vencimiento: string): string {
  return createHmac('sha256', secreto).update(`plataforma.${rol}.${comercio}.${vencimiento}`).digest('base64url');
}

function iguales(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Se compara contra sí mismo cuando el largo no coincide para no filtrar el largo por tiempo.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Token viejo, sin rol (equivale a comercio `grimuca`). Se conserva para las sesiones abiertas y las pruebas. */
export function crearToken(secreto: string, ahora: number = Date.now()): string {
  const vencimiento = String(ahora + DURACION_TOKEN_MS);
  return `${vencimiento}.${firmar(secreto, vencimiento)}`;
}

/** Token con rol y comercio. */
export function crearTokenConRol(secreto: string, sesion: Sesion, ahora: number = Date.now()): string {
  const vencimiento = String(ahora + DURACION_TOKEN_MS);
  const comercio = sesion.comercio_id ?? '-';
  return `${sesion.rol}.${comercio}.${vencimiento}.${firmarConRol(secreto, sesion.rol, comercio, vencimiento)}`;
}

/** Lee y verifica un token. Devuelve la sesión, o null si no vale. */
export function leerToken(token: unknown, secreto: string, ahora: number = Date.now()): Sesion | null {
  if (typeof token !== 'string' || token.length > 200) return null;
  const partes = token.split('.');
  if (partes.length === 2) {
    const [vencimiento, firma] = partes;
    if (!vencimiento || !firma || !/^\d{1,16}$/.test(vencimiento)) return null;
    if (!iguales(firma, firmar(secreto, vencimiento))) return null;
    return Number(vencimiento) > ahora ? { rol: 'comercio', comercio_id: COMERCIO_PRINCIPAL } : null;
  }
  if (partes.length === 4) {
    const [rol, comercio, vencimiento, firma] = partes;
    if (!(ROLES as readonly string[]).includes(rol) || !firma || !/^\d{1,16}$/.test(vencimiento)) return null;
    if (comercio !== '-' && !PATRON_COMERCIO.test(comercio)) return null;
    if (!iguales(firma, firmarConRol(secreto, rol, comercio, vencimiento))) return null;
    if (Number(vencimiento) <= ahora) return null;
    const sesion: Sesion = { rol: rol as RolPlataforma, comercio_id: comercio === '-' ? null : comercio };
    // El superadmin no tiene comercio; los demás roles sí.
    if ((sesion.rol === 'superadmin') !== (sesion.comercio_id === null)) return null;
    return sesion;
  }
  return null;
}

export function tokenValido(token: unknown, secreto: string, ahora: number = Date.now()): boolean {
  return leerToken(token, secreto, ahora) !== null;
}

export function pinCorrecto(pin: string, pinOperador: string | null | undefined): boolean {
  if (!pinOperador) return false; // sin PIN configurado nadie entra
  // Se comparan los resúmenes para que el tiempo no dependa del largo del PIN.
  const resumen = (texto: string) => createHmac('sha256', 'pin').update(texto).digest('hex');
  return iguales(resumen(pin), resumen(pinOperador));
}

/**
 * Busca a qué comercio corresponde un PIN: `PIN_OPERADOR` es `grimuca`; `PINES_COMERCIOS`, los aliados.
 * Compara contra todos (en tiempo constante cada uno) para que el tiempo no diga cuál coincidió.
 */
export function comercioDelPin(
  pin: string,
  pinOperador: string | null | undefined,
  pinesComercios: Record<string, string> | undefined,
): string | null {
  let encontrado: string | null = null;
  const candidatos: Array<[string, string | null | undefined]> = [
    [COMERCIO_PRINCIPAL, pinOperador],
    ...Object.entries(pinesComercios ?? {}).filter(([id]) => id !== COMERCIO_PRINCIPAL),
  ];
  for (const [id, esperado] of candidatos) {
    if (pinCorrecto(pin, esperado) && encontrado === null) encontrado = id;
  }
  return encontrado;
}

export function tokenDeCabecera(req: FastifyRequest): string | null {
  const cabecera = req.headers.authorization;
  if (typeof cabecera !== 'string') return null;
  const partes = /^Bearer\s+(.+)$/i.exec(cabecera.trim());
  return partes ? partes[1].trim() : null;
}

/** `preHandler` que exige un token con alguno de los roles dados (cabecera `Authorization: Bearer`). */
export function exigirRol(...roles: RolPlataforma[]) {
  return async function (req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | undefined> {
    const sesion = leerToken(tokenDeCabecera(req), req.server.contexto.config.secretoSesion);
    if (!sesion) return reply.code(401).send({ error: MENSAJE_SIN_SESION });
    if (!roles.includes(sesion.rol)) return reply.code(403).send({ error: MENSAJE_OTRO_ROL });
    req.sesion = sesion;
    return undefined;
  };
}

/**
 * `preHandler` para las rutas del comercio: exige `Authorization: Bearer <token>` con rol comercio.
 * Uso: `app.get('/operador/algo', { preHandler: exigirOperador }, manejador)`; luego `comercioDe(req)`.
 */
export const exigirOperador = exigirRol('comercio');

/** Comercio de la sesión (después de `exigirOperador` o `exigirRol('tecnico')`). */
export function comercioDe(req: FastifyRequest): string {
  return req.sesion?.comercio_id ?? COMERCIO_PRINCIPAL;
}

/** Freno simple contra adivinar el PIN: máximo de intentos fallidos por dirección en una ventana de tiempo. */
export function crearFrenoDeIntentos(maximo = 8, ventanaMs = 5 * 60 * 1000) {
  const fallos = new Map<string, number[]>();
  const recientes = (clave: string, ahora: number) => (fallos.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  return {
    bloqueado(clave: string, ahora: number = Date.now()): boolean {
      return recientes(clave, ahora).length >= maximo;
    },
    anotarFallo(clave: string, ahora: number = Date.now()): void {
      if (fallos.size > 5_000) fallos.clear(); // tope de memoria
      fallos.set(clave, [...recientes(clave, ahora), ahora]);
    },
    limpiar(clave: string): void {
      fallos.delete(clave);
    },
  };
}

type Freno = ReturnType<typeof crearFrenoDeIntentos>;
const frenos = new WeakMap<object, { porDireccion: Freno; general: Freno }>();

/**
 * Una sola cuenta de intentos por aplicación para las tres entradas (comercio, red y técnico):
 * el mismo límite de siempre (8 por dirección y 40 en total cada 5 minutos), sin multiplicarlo por tres.
 */
export function frenoDeEntrada(app: FastifyInstance) {
  let freno = frenos.get(app.contexto);
  if (!freno) {
    freno = { porDireccion: crearFrenoDeIntentos(), general: crearFrenoDeIntentos(40) };
    frenos.set(app.contexto, freno);
  }
  const { porDireccion, general } = freno;
  return {
    revisar(ip: string): void {
      if (porDireccion.bloqueado(ip) || general.bloqueado('todos')) {
        throw new ErrorHttp(429, 'Demasiados intentos. Espera unos minutos y prueba otra vez.');
      }
    },
    fallo(ip: string): void {
      porDireccion.anotarFallo(ip);
      general.anotarFallo('todos');
    },
    exito(ip: string): void {
      porDireccion.limpiar(ip);
    },
  };
}

export const esquemaEntrar = z.object({ pin: z.string().min(1).max(64) });
const esquemaFiltro = z.object({ estado: z.enum(['pendiente', 'despachado', 'todos']).default('pendiente') });
const esquemaIdPedido = z.object({ id: z.coerce.number().int().positive().max(2_147_483_647) });

export async function rutasOperador(app: FastifyInstance): Promise<void> {
  const { bd, config, eventos } = app.contexto;
  const freno = frenoDeEntrada(app);

  app.post('/operador/entrar', async (req, reply) => {
    const { pin } = esquemaEntrar.parse(req.body);
    freno.revisar(req.ip);
    const comercioId = comercioDelPin(pin, config.pinOperador, config.pinesComercios);
    const comercio = comercioId ? await buscarComercio(bd, comercioId) : null;
    if (!comercio || !comercio.activo) {
      freno.fallo(req.ip);
      return reply.code(401).send({ error: 'PIN incorrecto.' });
    }
    freno.exito(req.ip);
    return {
      token: crearTokenConRol(config.secretoSesion, { rol: 'comercio', comercio_id: comercio.id }),
      rol: 'comercio' as const,
      comercio,
    };
  });

  app.get('/operador/yo', { preHandler: exigirOperador }, async (req) => {
    const comercio = await buscarComercio(bd, comercioDe(req));
    if (!comercio) throw noEncontrado('El comercio');
    return { rol: 'comercio' as const, comercio, tiendas: await tiendasDeComercio(bd, comercio.id) };
  });

  app.get('/operador/pedidos', { preHandler: exigirOperador }, async (req) => {
    const { estado } = esquemaFiltro.parse(req.query);
    return pedidosDelOperador(bd, estado, comercioDe(req));
  });

  app.post('/operador/pedidos/:id/despachar', { preHandler: exigirOperador }, async (req) => {
    const { id } = esquemaIdPedido.parse(req.params);
    const antes = await buscarPedido(bd, id, true);
    // Un comercio no ve ni toca los pedidos de otro: para él no existen.
    if (!antes || (antes.comercio_id ?? COMERCIO_PRINCIPAL) !== comercioDe(req)) throw noEncontrado('El pedido');
    const { rows } = await bd.query(
      "UPDATE pedidos SET estado = 'despachado', fecha_despacho = now() WHERE id = $1 AND estado = 'pendiente' RETURNING id",
      [id],
    );
    const pedido = await buscarPedido(bd, id, true);
    if (!pedido) throw noEncontrado('El pedido');
    // Si ya estaba despachado se devuelve tal cual, sin repetir el aviso.
    if (rows.length > 0) await eventos.publicar({ tipo: 'pedido_despachado', datos: pedido });
    return pedido;
  });

  // Servicios atendidos de las tiendas del comercio, con el reporte del técnico (si lo dejó).
  app.get('/operador/reportes', { preHandler: exigirOperador }, async (req) =>
    serviciosDeComercio(bd, comercioDe(req), 'atendido'),
  );
}
