// Tiempo real: las rutas publican eventos y este módulo los reparte a los clientes de GET /api/eventos (SSE).
// En producción el evento viaja por Postgres (NOTIFY agua_eventos) y vuelve por UNA sola conexión LISTEN,
// que se reconecta sola. En las pruebas se usa el canal local, sin base de datos.
import pg from 'pg';
import type { Bd } from './bd';
import { TIPOS_EVENTO, type EventoAgua } from './tipos';

export const CANAL_PG = 'agua_eventos';

export type Oyente = (evento: EventoAgua) => void;

export interface CanalEventos {
  /** Avisa a todos los suscriptores. Nunca lanza: un fallo aquí no debe tumbar la ruta que lo llamó. */
  publicar(evento: EventoAgua): Promise<void>;
  /** Devuelve la función para dejar de escuchar. */
  suscribir(oyente: Oyente): () => void;
  /** Cantidad de suscriptores (clientes SSE) activos. */
  suscriptores(): number;
  cerrar(): Promise<void>;
}

interface Registro {
  info(mensaje: string): void;
  error(mensaje: string): void;
}

const registroConsola: Registro = {
  info: (mensaje) => console.log(`[eventos] ${mensaje}`),
  error: (mensaje) => console.error(`[eventos] ${mensaje}`),
};

function esEvento(valor: unknown): valor is EventoAgua {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as { tipo?: unknown; datos?: unknown };
  return (
    typeof candidato.tipo === 'string' &&
    (TIPOS_EVENTO as readonly string[]).includes(candidato.tipo) &&
    typeof candidato.datos === 'object' &&
    candidato.datos !== null
  );
}

function crearReparto(registro: Registro) {
  const oyentes = new Set<Oyente>();
  return {
    oyentes,
    repartir(evento: EventoAgua) {
      for (const oyente of oyentes) {
        try {
          oyente(evento);
        } catch (error) {
          registro.error(`un suscriptor falló: ${(error as Error).message}`);
        }
      }
    },
    suscribir(oyente: Oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}

/** Canal en memoria: publicar reparte de una vez. Para pruebas y como respaldo sin base de datos. */
export function crearCanalLocal(registro: Registro = registroConsola): CanalEventos {
  const reparto = crearReparto(registro);
  return {
    async publicar(evento) {
      reparto.repartir(evento);
    },
    suscribir: reparto.suscribir,
    suscriptores: () => reparto.oyentes.size,
    async cerrar() {
      reparto.oyentes.clear();
    },
  };
}

/** Lo mínimo que se usa de un cliente de `pg` para escuchar (permite un doble en las pruebas). */
export interface ClienteEscucha {
  connect(): Promise<unknown>;
  query(texto: string): Promise<unknown>;
  end(): Promise<unknown>;
  on(evento: 'notification', manejador: (mensaje: { channel: string; payload?: string }) => void): unknown;
  on(evento: 'error', manejador: (error: Error) => void): unknown;
  on(evento: 'end', manejador: () => void): unknown;
  removeAllListeners(): unknown;
}

export interface OpcionesCanalPostgres {
  /** Pool con el que se envía el NOTIFY. */
  bd: Pick<Bd, 'query'>;
  /** Cadena de conexión para la conexión LISTEN (se ignora si se pasa `crearCliente`). */
  urlBd?: string;
  crearCliente?: () => ClienteEscucha;
  registro?: Registro;
  /** Espera inicial antes de reconectar; se duplica en cada intento hasta `esperaMaximaMs`. */
  esperaInicialMs?: number;
  esperaMaximaMs?: number;
}

export interface CanalPostgres extends CanalEventos {
  /** true mientras la conexión LISTEN está activa. */
  escuchando(): boolean;
  /** Abre la conexión LISTEN. Si falla, reintenta sola en segundo plano. */
  iniciar(): Promise<void>;
}

export function crearCanalPostgres(opciones: OpcionesCanalPostgres): CanalPostgres {
  const registro = opciones.registro ?? registroConsola;
  const esperaInicialMs = opciones.esperaInicialMs ?? 1_000;
  const esperaMaximaMs = opciones.esperaMaximaMs ?? 15_000;
  const crearCliente =
    opciones.crearCliente ??
    ((): ClienteEscucha =>
      new pg.Client({ connectionString: opciones.urlBd, keepAlive: true }) as unknown as ClienteEscucha);

  const reparto = crearReparto(registro);
  let cliente: ClienteEscucha | null = null;
  let conectado = false;
  let cerrado = false;
  let espera = esperaInicialMs;
  let temporizador: NodeJS.Timeout | null = null;

  function soltar(viejo: ClienteEscucha | null) {
    if (!viejo) return;
    viejo.removeAllListeners();
    // Evita un error sin manejar si la conexión vieja falla mientras se cierra.
    viejo.on('error', () => {});
    void viejo.end().catch(() => {});
  }

  function programarReconexion(motivo: string) {
    conectado = false;
    const viejo = cliente;
    cliente = null;
    soltar(viejo);
    if (cerrado || temporizador) return;
    registro.error(`conexión LISTEN caída (${motivo}); reintento en ${espera} ms`);
    temporizador = setTimeout(() => {
      temporizador = null;
      void conectar();
    }, espera);
    temporizador.unref?.();
    espera = Math.min(espera * 2, esperaMaximaMs);
  }

  async function conectar(): Promise<void> {
    if (cerrado || cliente) return;
    const nuevo = crearCliente();
    cliente = nuevo;
    nuevo.on('error', (error) => {
      if (cliente === nuevo) programarReconexion(error.message);
    });
    nuevo.on('end', () => {
      if (cliente === nuevo) programarReconexion('conexión cerrada');
    });
    nuevo.on('notification', (mensaje) => {
      if (mensaje.channel !== CANAL_PG || !mensaje.payload) return;
      try {
        const evento: unknown = JSON.parse(mensaje.payload);
        if (esEvento(evento)) reparto.repartir(evento);
      } catch {
        registro.error('llegó un aviso que no es JSON; se ignora');
      }
    });
    try {
      await nuevo.connect();
      await nuevo.query(`LISTEN ${CANAL_PG}`);
      if (cerrado || cliente !== nuevo) return;
      conectado = true;
      espera = esperaInicialMs;
      registro.info('escuchando avisos de la base de datos');
    } catch (error) {
      if (cliente === nuevo) programarReconexion((error as Error).message);
    }
  }

  return {
    iniciar: conectar,
    escuchando: () => conectado,
    async publicar(evento) {
      // Si la conexión LISTEN está caída, el aviso por Postgres no volvería: se reparte directo.
      if (!conectado) {
        reparto.repartir(evento);
        return;
      }
      try {
        await opciones.bd.query('SELECT pg_notify($1, $2)', [CANAL_PG, JSON.stringify(evento)]);
      } catch (error) {
        registro.error(`no se pudo enviar el aviso (${(error as Error).message}); se reparte directo`);
        reparto.repartir(evento);
      }
    },
    suscribir: reparto.suscribir,
    suscriptores: () => reparto.oyentes.size,
    async cerrar() {
      cerrado = true;
      conectado = false;
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      const viejo = cliente;
      cliente = null;
      if (viejo) {
        viejo.removeAllListeners();
        viejo.on('error', () => {});
        await viejo.end().catch(() => {});
      }
      reparto.oyentes.clear();
    },
  };
}

/** Texto de un evento en formato SSE. */
export function aTextoSse(evento: EventoAgua): string {
  return `event: ${evento.tipo}\ndata: ${JSON.stringify(evento.datos)}\n\n`;
}
