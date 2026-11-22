// Panel del operador: entrada con PIN, lista de despacho y botón "despachado".
// El token es `<vencimiento>.<firma>`: la firma es un HMAC-SHA256 con SECRETO_SESION.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { buscarPedido, pedidosDelOperador } from './datos';
import { ErrorHttp, noEncontrado } from './errores';

/** Duración de la sesión del operador: cubre todo el fin de semana de la demo. */
export const DURACION_TOKEN_MS = 3 * 24 * 60 * 60 * 1000;

const MENSAJE_SIN_SESION = 'Tu sesión de operador venció o no es válida. Vuelve a entrar con el PIN.';

function firmar(secreto: string, vencimiento: string): string {
  return createHmac('sha256', secreto).update(`operador.${vencimiento}`).digest('base64url');
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

export function crearToken(secreto: string, ahora: number = Date.now()): string {
  const vencimiento = String(ahora + DURACION_TOKEN_MS);
  return `${vencimiento}.${firmar(secreto, vencimiento)}`;
}

export function tokenValido(token: unknown, secreto: string, ahora: number = Date.now()): boolean {
  if (typeof token !== 'string' || token.length > 200) return false;
  const [vencimiento, firma, ...resto] = token.split('.');
  if (!vencimiento || !firma || resto.length > 0 || !/^\d{1,16}$/.test(vencimiento)) return false;
  if (!iguales(firma, firmar(secreto, vencimiento))) return false;
  return Number(vencimiento) > ahora;
}

export function pinCorrecto(pin: string, pinOperador: string | null): boolean {
  if (!pinOperador) return false; // sin PIN configurado nadie entra
  // Se comparan los resúmenes para que el tiempo no dependa del largo del PIN.
  const resumen = (texto: string) => createHmac('sha256', 'pin').update(texto).digest('hex');
  return iguales(resumen(pin), resumen(pinOperador));
}

function tokenDeCabecera(req: FastifyRequest): string | null {
  const cabecera = req.headers.authorization;
  if (typeof cabecera !== 'string') return null;
  const partes = /^Bearer\s+(.+)$/i.exec(cabecera.trim());
  return partes ? partes[1].trim() : null;
}

/**
 * `preHandler` para las rutas del operador: exige `Authorization: Bearer <token>`.
 * Uso: `app.get('/operador/algo', { preHandler: exigirOperador }, manejador)`.
 */
export async function exigirOperador(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | undefined> {
  const secreto = req.server.contexto.config.secretoSesion;
  if (!tokenValido(tokenDeCabecera(req), secreto)) {
    return reply.code(401).send({ error: MENSAJE_SIN_SESION });
  }
  return undefined;
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

const esquemaEntrar = z.object({ pin: z.string().min(1).max(64) });
const esquemaFiltro = z.object({ estado: z.enum(['pendiente', 'despachado', 'todos']).default('pendiente') });
const esquemaIdPedido = z.object({ id: z.coerce.number().int().positive().max(2_147_483_647) });

export async function rutasOperador(app: FastifyInstance): Promise<void> {
  const { bd, config, eventos } = app.contexto;
  const freno = crearFrenoDeIntentos();
  // Tope general, por si alguien reparte los intentos entre muchas direcciones.
  const frenoGeneral = crearFrenoDeIntentos(40);

  app.post('/operador/entrar', async (req, reply) => {
    const { pin } = esquemaEntrar.parse(req.body);
    if (freno.bloqueado(req.ip) || frenoGeneral.bloqueado('todos')) {
      throw new ErrorHttp(429, 'Demasiados intentos. Espera unos minutos y prueba otra vez.');
    }
    if (!pinCorrecto(pin, config.pinOperador)) {
      freno.anotarFallo(req.ip);
      frenoGeneral.anotarFallo('todos');
      return reply.code(401).send({ error: 'PIN incorrecto.' });
    }
    freno.limpiar(req.ip);
    return { token: crearToken(config.secretoSesion) };
  });

  app.get('/operador/pedidos', { preHandler: exigirOperador }, async (req) => {
    const { estado } = esquemaFiltro.parse(req.query);
    return pedidosDelOperador(bd, estado);
  });

  app.post('/operador/pedidos/:id/despachar', { preHandler: exigirOperador }, async (req) => {
    const { id } = esquemaIdPedido.parse(req.params);
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
}
