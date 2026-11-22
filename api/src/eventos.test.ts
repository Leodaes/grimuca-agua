import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aTextoSse, CANAL_PG, crearCanalLocal, crearCanalPostgres, type ClienteEscucha } from './eventos';
import type { EventoAgua } from './tipos';

const silencio = { info: () => {}, error: () => {} };

const evento: EventoAgua = {
  tipo: 'medicion_nueva',
  datos: { hogar_id: '00000000-0000-4000-8000-000000000001', zona: 'Naguanagua', semaforo: 'rojo' },
};

/** Doble de un cliente de pg: registra lo que se le pide y deja simular avisos y caídas. */
class ClienteFalso extends EventEmitter {
  consultas: string[] = [];
  cerrado = false;
  constructor(private readonly fallaAlConectar = false) {
    super();
  }
  async connect() {
    if (this.fallaAlConectar) throw new Error('base apagada');
  }
  async query(texto: string) {
    this.consultas.push(texto);
  }
  async end() {
    this.cerrado = true;
  }
}

describe('canal local', () => {
  it('reparte a todos los suscriptores y deja de hacerlo al darse de baja', async () => {
    const canal = crearCanalLocal(silencio);
    const a: EventoAgua[] = [];
    const b: EventoAgua[] = [];
    const bajaA = canal.suscribir((ev) => a.push(ev));
    canal.suscribir((ev) => b.push(ev));
    expect(canal.suscriptores()).toBe(2);

    await canal.publicar(evento);
    bajaA();
    await canal.publicar(evento);

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(2);
    expect(canal.suscriptores()).toBe(1);
  });

  it('un suscriptor que falla no afecta a los demás', async () => {
    const canal = crearCanalLocal(silencio);
    const recibidos: EventoAgua[] = [];
    canal.suscribir(() => {
      throw new Error('cliente roto');
    });
    canal.suscribir((ev) => recibidos.push(ev));
    await expect(canal.publicar(evento)).resolves.toBeUndefined();
    expect(recibidos).toEqual([evento]);
  });
});

describe('canal de Postgres (LISTEN/NOTIFY)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function montar(opciones: { fallos?: number } = {}) {
    const clientes: ClienteFalso[] = [];
    const notificados: Array<[string, unknown[]]> = [];
    let fallosPendientes = opciones.fallos ?? 0;
    const bd = {
      query: vi.fn(async (texto: string, valores: unknown[]) => {
        notificados.push([texto, valores]);
        return { rows: [] };
      }),
    };
    const canal = crearCanalPostgres({
      bd: bd as never,
      registro: silencio,
      esperaInicialMs: 100,
      esperaMaximaMs: 400,
      crearCliente: () => {
        const cliente = new ClienteFalso(fallosPendientes-- > 0);
        clientes.push(cliente);
        return cliente as unknown as ClienteEscucha;
      },
    });
    return { canal, clientes, notificados, bd };
  }

  it('abre UNA conexión, hace LISTEN y reparte los avisos que llegan', async () => {
    const { canal, clientes } = montar();
    const recibidos: EventoAgua[] = [];
    canal.suscribir((ev) => recibidos.push(ev));

    await canal.iniciar();
    await canal.iniciar(); // repetir no abre otra conexión
    expect(clientes).toHaveLength(1);
    expect(clientes[0].consultas).toEqual([`LISTEN ${CANAL_PG}`]);
    expect(canal.escuchando()).toBe(true);

    clientes[0].emit('notification', { channel: CANAL_PG, payload: JSON.stringify(evento) });
    clientes[0].emit('notification', { channel: 'otro_canal', payload: JSON.stringify(evento) });
    clientes[0].emit('notification', { channel: CANAL_PG, payload: 'esto no es json' });
    clientes[0].emit('notification', { channel: CANAL_PG, payload: JSON.stringify({ tipo: 'inventado', datos: {} }) });
    expect(recibidos).toEqual([evento]);
    await canal.cerrar();
  });

  it('publicar envía NOTIFY por la base cuando la conexión está viva', async () => {
    const { canal, notificados } = montar();
    const recibidos: EventoAgua[] = [];
    canal.suscribir((ev) => recibidos.push(ev));
    await canal.iniciar();

    await canal.publicar(evento);
    expect(notificados).toEqual([['SELECT pg_notify($1, $2)', [CANAL_PG, JSON.stringify(evento)]]]);
    // No se reparte dos veces: el aviso vuelve por la conexión LISTEN.
    expect(recibidos).toEqual([]);
    await canal.cerrar();
  });

  it('si la conexión LISTEN está caída o el NOTIFY falla, reparte directo', async () => {
    const { canal, bd, notificados } = montar();
    const recibidos: EventoAgua[] = [];
    canal.suscribir((ev) => recibidos.push(ev));

    await canal.publicar(evento); // todavía sin iniciar
    expect(notificados).toEqual([]);
    expect(recibidos).toHaveLength(1);

    await canal.iniciar();
    bd.query.mockRejectedValueOnce(new Error('sin conexión'));
    await expect(canal.publicar(evento)).resolves.toBeUndefined();
    expect(recibidos).toHaveLength(2);
    await canal.cerrar();
  });

  it('se reconecta sola cuando la conexión se cae, con espera creciente', async () => {
    const { canal, clientes } = montar();
    const recibidos: EventoAgua[] = [];
    canal.suscribir((ev) => recibidos.push(ev));
    await canal.iniciar();

    clientes[0].emit('error', new Error('se cayó la base'));
    expect(canal.escuchando()).toBe(false);
    expect(clientes[0].cerrado).toBe(true);
    expect(clientes).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(clientes).toHaveLength(2);
    expect(canal.escuchando()).toBe(true);
    expect(clientes[1].consultas).toEqual([`LISTEN ${CANAL_PG}`]);

    // Los avisos de la conexión vieja ya no cuentan; los de la nueva sí.
    clientes[0].emit('notification', { channel: CANAL_PG, payload: JSON.stringify(evento) });
    expect(recibidos).toEqual([]);
    clientes[1].emit('notification', { channel: CANAL_PG, payload: JSON.stringify(evento) });
    expect(recibidos).toEqual([evento]);

    clientes[1].emit('end');
    await vi.advanceTimersByTimeAsync(100);
    expect(clientes).toHaveLength(3);
    await canal.cerrar();
  });

  it('si la base no está lista al arrancar, insiste hasta conectar', async () => {
    const { canal, clientes } = montar({ fallos: 2 });
    await canal.iniciar();
    expect(canal.escuchando()).toBe(false);
    await vi.advanceTimersByTimeAsync(100); // segundo intento, también falla
    expect(clientes).toHaveLength(2);
    expect(canal.escuchando()).toBe(false);
    await vi.advanceTimersByTimeAsync(200); // tercer intento
    expect(clientes).toHaveLength(3);
    expect(canal.escuchando()).toBe(true);
    await canal.cerrar();
  });

  it('al cerrar suelta la conexión y no vuelve a conectar', async () => {
    const { canal, clientes } = montar();
    await canal.iniciar();
    await canal.cerrar();
    expect(clientes[0].cerrado).toBe(true);
    clientes[0].emit('end');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(clientes).toHaveLength(1);
    expect(canal.suscriptores()).toBe(0);
  });
});

describe('formato SSE', () => {
  it('escribe el nombre del evento y los datos en una sola línea', () => {
    expect(aTextoSse(evento)).toBe(`event: medicion_nueva\ndata: ${JSON.stringify(evento.datos)}\n\n`);
  });
});
