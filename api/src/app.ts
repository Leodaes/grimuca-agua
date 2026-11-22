// Arma la aplicación Fastify. `servidor.ts` la arranca con las dependencias reales;
// las pruebas la crean con una base en memoria y dobles, y la usan con `app.inject()`.
import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { Bd } from './bd';
import type { Config } from './config';
import { crearCanalLocal, type CanalEventos } from './eventos';
import { rutasBacterias } from './rutas/bacterias';
import { rutasCatalogo } from './rutas/catalogo';
import { ErrorHttp } from './rutas/errores';
import { rutasEventos } from './rutas/eventos';
import { rutasHogares } from './rutas/hogares';
import { rutasMediciones, TAMANO_MAXIMO_FOTO } from './rutas/mediciones';
import { rutasOperador } from './rutas/operador';
import { rutasPedidos } from './rutas/pedidos';
import type { Evaluacion, LecturaTira, ParametroTira, PerfilHogar, ValoresMedicion } from './tipos';

/** Lo que las rutas necesitan del módulo de medición (`api/src/medicion/index.ts`). */
export interface Medidor {
  tira: ParametroTira[];
  leerTira(imagen: Buffer, tipoMime: string): Promise<LecturaTira>;
  evaluarAgua(valores: ValoresMedicion, perfil?: PerfilHogar): Evaluacion;
  diasParaRecambio(perfil: PerfilHogar, hoy?: Date): number | null;
}

export type ConfigApp = Pick<Config, 'pinOperador' | 'secretoSesion' | 'version'> & {
  marcasExcluidas?: string[];
};

export interface Contexto {
  bd: Bd;
  config: ConfigApp;
  medicion: Medidor;
  eventos: CanalEventos;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Dependencias compartidas por todas las rutas. */
    contexto: Contexto;
    /** Atajo a `contexto.bd` (Pool de pg). */
    bd: Bd;
  }
}

export interface OpcionesApp {
  bd: Bd;
  config: ConfigApp;
  medicion: Medidor;
  /** Canal de tiempo real. Por defecto, uno en memoria. */
  eventos?: CanalEventos;
  /** Carpeta del front compilado. Si se pasa y existe, se sirve y cualquier ruta que no sea /api devuelve index.html. */
  dirEstaticos?: string;
  /** Registro de solicitudes en consola (apagado por defecto, para las pruebas). */
  registro?: boolean;
  /** Intenta cargar `rutas/logistica.ts` (resumen, inventario y zonas). Por defecto sí. */
  conLogistica?: boolean;
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: 'La solicitud no se entiende. Revisa los datos.',
  404: 'Ruta no encontrada.',
  406: 'Formato de respuesta no disponible.',
  413: 'El archivo o los datos son demasiado grandes.',
  415: 'Formato de datos no aceptado.',
  429: 'Demasiadas solicitudes. Espera un momento.',
};

/** Convierte los errores de validación en una lista corta y legible. */
function detalleDeZod(error: ZodError): Array<{ campo: string; mensaje: string }> {
  return error.issues.map((problema) => ({ campo: problema.path.join('.'), mensaje: problema.message }));
}

function mensajeDeZod(error: ZodError): string {
  const primero = error.issues[0];
  // Los mensajes escritos a mano en los esquemas terminan en punto y van tal cual; los automáticos, con uno genérico.
  if (primero && primero.message.endsWith('.')) return primero.message;
  const campo = primero?.path.join('.');
  return campo ? `Revisa el dato "${campo}".` : 'Revisa los datos enviados.';
}

/** Oculta el token del operador en la URL antes de escribirla en el registro. */
function urlSinToken(url: string | undefined): string {
  return (url ?? '').replace(/([?&]token=)[^&]*/g, '$1***');
}

async function registrarLogistica(app: FastifyInstance, bd: Bd): Promise<void> {
  // El especificador va en una variable para que la compilación no exija que el archivo exista.
  const modulo = './rutas/logistica';
  let cargado: Record<string, unknown>;
  try {
    cargado = (await import(modulo)) as Record<string, unknown>;
  } catch (error) {
    const texto = String((error as Error)?.message ?? error);
    if (/logistica/.test(texto) && /(Cannot find|Failed to (load|resolve)|ERR_MODULE_NOT_FOUND|no such file)/i.test(texto)) {
      app.log.info('rutas de logística: todavía no existen (resumen, inventario y zonas responden 404)');
    } else {
      app.log.error({ err: error }, 'rutas de logística: no se pudieron cargar');
    }
    return;
  }
  const complemento = cargado.rutasLogistica ?? cargado.default;
  if (typeof complemento !== 'function') {
    app.log.error('rutas de logística: el módulo debe exportar `rutasLogistica` (o un export por defecto)');
    return;
  }
  await app.register(complemento as (instancia: FastifyInstance, opciones: { bd: Bd }) => Promise<void>, {
    prefix: '/api',
    bd,
  });
}

export async function crearApp(opciones: OpcionesApp): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opciones.registro
      ? {
          level: 'info',
          serializers: {
            req: (req: { method?: string; url?: string }) => ({ method: req.method, url: urlSinToken(req.url) }),
          },
        }
      : false,
    // La app solo se alcanza a través del servidor web del host: la dirección del cliente viene en X-Forwarded-For.
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    // Al apagar se cortan las conexiones abiertas (los clientes SSE no terminan solos).
    forceCloseConnections: true,
  });

  const contexto: Contexto = {
    bd: opciones.bd,
    config: opciones.config,
    medicion: opciones.medicion,
    eventos: opciones.eventos ?? crearCanalLocal(),
  };
  app.decorate('contexto', contexto);
  app.decorate('bd', opciones.bd);

  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
  });

  app.setErrorHandler((error: FastifyError | ErrorHttp | ZodError, req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: mensajeDeZod(error), detalle: detalleDeZod(error) });
    }
    if (error instanceof ErrorHttp) {
      const cuerpo: { error: string; detalle?: unknown } = { error: error.message };
      if (error.detalle !== undefined) cuerpo.detalle = error.detalle;
      return reply.code(error.estado).send(cuerpo);
    }
    const estado = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (estado >= 400 && estado < 500) {
      const esFotoGrande = error.code === 'FST_REQ_FILE_TOO_LARGE';
      return reply.code(estado).send({
        error: esFotoGrande
          ? 'La foto pesa más de 8 MB. Toma otra o bájale la calidad.'
          : (MENSAJES_POR_ESTADO[estado] ?? 'No se pudo procesar la solicitud.'),
      });
    }
    req.log.error({ err: error }, 'error sin manejar');
    return reply.code(500).send({ error: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.' });
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: TAMANO_MAXIMO_FOTO, files: 1, fields: 5, fieldSize: 1_000 },
  });

  for (const rutas of [rutasCatalogo, rutasHogares, rutasMediciones, rutasPedidos, rutasBacterias, rutasOperador, rutasEventos]) {
    await app.register(rutas, { prefix: '/api' });
  }
  if (opciones.conLogistica !== false) await registrarLogistica(app, opciones.bd);

  const dirEstaticos = opciones.dirEstaticos;
  const hayFront = Boolean(dirEstaticos && existsSync(path.join(dirEstaticos, 'index.html')));
  if (dirEstaticos && hayFront) {
    await app.register(fastifyStatic, {
      root: dirEstaticos,
      // Los archivos de /assets llevan huella en el nombre; el resto se revalida siempre.
      cacheControl: false,
      setHeaders(respuesta, ruta) {
        const conHuella = ruta.replace(/\\/g, '/').includes('/assets/');
        respuesta.setHeader('Cache-Control', conHuella ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
  } else if (dirEstaticos) {
    app.log.warn(`no hay front compilado en ${dirEstaticos}: solo responde /api`);
  }

  app.setNotFoundHandler((req, reply) => {
    const ruta = req.url.split('?')[0];
    const esApi = ruta === '/api' || ruta.startsWith('/api/');
    const esNavegacion = (req.method === 'GET' || req.method === 'HEAD') && !/\.[a-z0-9]{1,8}$/i.test(ruta);
    if (hayFront && !esApi && esNavegacion) {
      // Aplicación de una sola página: el front resuelve la ruta.
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    }
    return reply.code(404).send({ error: esApi ? 'Ruta no encontrada.' : 'No encontrado.' });
  });

  return app;
}
