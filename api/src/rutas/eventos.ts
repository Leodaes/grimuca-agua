// GET /api/eventos?token=<token> · Eventos en vivo para el panel del comercio, la red y el técnico (SSE).
// Cada conexión recibe solo los eventos de su comercio; el superadmin recibe todos.
import type { FastifyInstance } from 'fastify';
import { aTextoSse } from '../eventos';
import type { EventoAgua } from '../tipos';
import { leerToken, type Sesion } from './operador';
import { COMERCIO_PRINCIPAL } from './plataforma';

/** ¿Este evento le llega a esta sesión? Los eventos sin comercio son de `grimuca`. */
export function eventoParaSesion(evento: EventoAgua, sesion: Sesion): boolean {
  if (sesion.rol === 'superadmin') return true;
  const comercio = evento.datos.comercio_id ?? COMERCIO_PRINCIPAL;
  return comercio === (sesion.comercio_id ?? COMERCIO_PRINCIPAL);
}

export const LATIDO_MS = 20_000;
export const REINTENTO_CLIENTE_MS = 3_000;

export async function rutasEventos(app: FastifyInstance): Promise<void> {
  const { config, eventos } = app.contexto;
  /** Funciones de cierre de las conexiones abiertas, para soltarlas al apagar el servidor. */
  const abiertas = new Set<() => void>();

  app.addHook('onClose', async () => {
    for (const cerrar of [...abiertas]) cerrar();
  });

  app.get('/eventos', async (req, reply) => {
    const token = (req.query as { token?: unknown } | undefined)?.token;
    const sesion = leerToken(token, config.secretoSesion);
    if (!sesion) {
      return reply.code(401).send({ error: 'Tu sesión de operador venció o no es válida. Vuelve a entrar con el PIN.' });
    }
    const leToca = (evento: EventoAgua) => eventoParaSesion(evento, sesion);

    // Desde aquí la respuesta se escribe a mano y queda abierta.
    reply.hijack();
    const salida = reply.raw;
    salida.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    salida.write(`retry: ${REINTENTO_CLIENTE_MS}\n\n`);
    salida.write(': conectado\n\n');

    let abierta = true;
    const dejarDeEscuchar = eventos.suscribir((evento) => {
      if (abierta && leToca(evento)) salida.write(aTextoSse(evento));
    });
    const latido = setInterval(() => {
      if (abierta) salida.write(': latido\n\n');
    }, LATIDO_MS);
    latido.unref?.();

    const cerrar = () => {
      if (!abierta) return;
      abierta = false;
      abiertas.delete(cerrar);
      clearInterval(latido);
      dejarDeEscuchar();
      if (!salida.writableEnded) salida.end();
    };
    abiertas.add(cerrar);
    // Se limpia cuando el navegador cierra la pestaña o se cae la conexión.
    salida.on('close', cerrar);
    salida.on('error', cerrar);
    req.raw.socket?.on('close', cerrar);
    return reply;
  });
}
