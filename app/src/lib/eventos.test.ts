import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERVALO_SONDEO_MS, REINTENTO_EN_VIVO_MS, suscribirEventos } from './eventos';
import type { Pedido } from './tipos';

/** Doble de EventSource: guarda las instancias y deja simular lo que haría el navegador. */
class FuenteFalsa {
  static instancias: FuenteFalsa[] = [];
  readyState = 0;
  cerrada = false;
  private oyentes = new Map<string, Array<(evento: Event) => void>>();

  constructor(public url: string) {
    FuenteFalsa.instancias.push(this);
  }
  addEventListener(tipo: string, oyente: (evento: Event) => void) {
    this.oyentes.set(tipo, [...(this.oyentes.get(tipo) ?? []), oyente]);
  }
  close() {
    this.cerrada = true;
    this.readyState = 2;
  }
  emitir(tipo: string, datos?: unknown) {
    const evento = datos === undefined ? new Event(tipo) : new MessageEvent(tipo, { data: JSON.stringify(datos) });
    for (const oyente of this.oyentes.get(tipo) ?? []) oyente(evento);
  }
  abrir() {
    this.readyState = 1;
    this.emitir('open');
  }
  fallar(definitivo = false) {
    this.readyState = definitivo ? 2 : 0;
    this.emitir('error');
  }
}

const pedido = (id: number, extra: Partial<Pedido> = {}): Pedido => ({
  id,
  hogar_id: 'h-1',
  tipo: 'sobre',
  cartucho_codigo: null,
  cantidad: 1,
  modalidad: 'retiro',
  direccion: null,
  pago: 'simulado',
  tienda_id: 'manongo',
  estado: 'pendiente',
  fecha: '2026-11-22T10:00:00.000Z',
  fecha_despacho: null,
  servicio: null,
  fecha_preferida: null,
  momento: null,
  nota: null,
  hogar_nombre: 'Hogar de prueba',
  zona: 'Naguanagua',
  cartucho_nombre: null,
  ...extra,
});

const pedir = vi.fn();
/** Lo que responderá el sondeo de pedidos pendientes. */
let pendientes: Pedido[] = [];
let estadoSondeo = 200;

beforeEach(() => {
  vi.useFakeTimers();
  FuenteFalsa.instancias = [];
  pendientes = [];
  estadoSondeo = 200;
  pedir.mockReset();
  pedir.mockImplementation(async () =>
    new Response(JSON.stringify(estadoSondeo === 200 ? pendientes : { error: 'Sesión vencida.' }), { status: estadoSondeo }),
  );
  vi.stubGlobal('fetch', pedir);
  vi.stubGlobal('EventSource', FuenteFalsa);
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('suscribirEventos: conexión en vivo', () => {
  it('abre el EventSource con el token y reparte cada evento a su manejador', () => {
    const m = { pedido_nuevo: vi.fn(), pedido_despachado: vi.fn(), medicion_nueva: vi.fn(), conexion: vi.fn() };
    const cancelar = suscribirEventos('123.firma+rara', m);
    const fuente = FuenteFalsa.instancias[0];
    expect(fuente.url).toBe('/api/eventos?token=123.firma%2Brara');
    expect(m.conexion).toHaveBeenLastCalledWith('conectando');

    fuente.abrir();
    expect(m.conexion).toHaveBeenLastCalledWith('en_vivo');

    fuente.emitir('pedido_nuevo', pedido(1));
    fuente.emitir('pedido_despachado', pedido(1, { estado: 'despachado' }));
    fuente.emitir('medicion_nueva', { hogar_id: 'h-1', zona: 'Naguanagua', semaforo: 'rojo' });
    expect(m.pedido_nuevo).toHaveBeenCalledWith(pedido(1));
    expect(m.pedido_despachado).toHaveBeenCalledWith(pedido(1, { estado: 'despachado' }));
    expect(m.medicion_nueva).toHaveBeenCalledWith({ hogar_id: 'h-1', zona: 'Naguanagua', semaforo: 'rojo' });
    // Con la conexión viva no hace falta sondear.
    expect(pedir).not.toHaveBeenCalled();

    cancelar();
    expect(fuente.cerrada).toBe(true);
    fuente.emitir('pedido_nuevo', pedido(2));
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(1);
  });

  it('acepta los manejadores en camelCase', () => {
    const m = { pedidoNuevo: vi.fn(), pedidoDespachado: vi.fn(), medicionNueva: vi.fn() };
    const cancelar = suscribirEventos('t', m);
    const fuente = FuenteFalsa.instancias[0];
    fuente.abrir();
    fuente.emitir('pedido_nuevo', pedido(1));
    fuente.emitir('pedido_despachado', pedido(1));
    fuente.emitir('medicion_nueva', { hogar_id: 'h-1', zona: 'San Diego', semaforo: 'verde' });
    expect(m.pedidoNuevo).toHaveBeenCalledTimes(1);
    expect(m.pedidoDespachado).toHaveBeenCalledTimes(1);
    expect(m.medicionNueva).toHaveBeenCalledTimes(1);
    cancelar();
  });
});

describe('suscribirEventos: respaldo con sondeo', () => {
  it('si la conexión falla, sondea cada 5 s y avisa de pedidos nuevos y despachados', async () => {
    const m = { pedido_nuevo: vi.fn(), pedido_despachado: vi.fn(), pedidos: vi.fn(), conexion: vi.fn() };
    pendientes = [pedido(1)];
    const cancelar = suscribirEventos('tok', m);
    FuenteFalsa.instancias[0].fallar();
    expect(m.conexion).toHaveBeenLastCalledWith('reconectando');

    // La primera lectura solo fija el punto de partida y entrega la lista completa.
    await vi.advanceTimersByTimeAsync(0);
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir.mock.calls[0][0]).toBe('/api/operador/pedidos?estado=pendiente');
    expect((pedir.mock.calls[0][1].headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(m.pedidos).toHaveBeenLastCalledWith([pedido(1)]);
    expect(m.pedido_nuevo).not.toHaveBeenCalled();

    pendientes = [pedido(2), pedido(1)];
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS);
    expect(pedir).toHaveBeenCalledTimes(2);
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(1);
    expect(m.pedido_nuevo).toHaveBeenCalledWith(pedido(2));

    pendientes = [pedido(2)];
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS);
    expect(m.pedido_despachado).toHaveBeenCalledTimes(1);
    expect(m.pedido_despachado.mock.calls[0][0]).toMatchObject({ id: 1, estado: 'despachado' });
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(1);

    cancelar();
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS * 3);
    expect(pedir).toHaveBeenCalledTimes(3);
  });

  it('cuando la conexión en vivo vuelve, deja de sondear y no repite avisos', async () => {
    const m = { pedido_nuevo: vi.fn(), pedido_despachado: vi.fn(), conexion: vi.fn() };
    pendientes = [pedido(1)];
    const cancelar = suscribirEventos('tok', m);
    const fuente = FuenteFalsa.instancias[0];
    fuente.fallar();
    await vi.advanceTimersByTimeAsync(0);
    pendientes = [pedido(2), pedido(1)];
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS);
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(1);

    fuente.abrir();
    expect(m.conexion).toHaveBeenLastCalledWith('en_vivo');
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS * 3);
    expect(pedir).toHaveBeenCalledTimes(2);

    // El pedido 2 ya se avisó por el sondeo: si llega también en vivo, no se repite.
    fuente.emitir('pedido_nuevo', pedido(2));
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(1);
    fuente.emitir('pedido_nuevo', pedido(3));
    expect(m.pedido_nuevo).toHaveBeenCalledTimes(2);
    fuente.emitir('pedido_despachado', pedido(1, { estado: 'despachado' }));
    fuente.emitir('pedido_despachado', pedido(1, { estado: 'despachado' }));
    expect(m.pedido_despachado).toHaveBeenCalledTimes(1);
    cancelar();
  });

  it('sin EventSource en el navegador trabaja solo con el sondeo', async () => {
    vi.stubGlobal('EventSource', undefined);
    const m = { pedidos: vi.fn(), conexion: vi.fn() };
    const cancelar = suscribirEventos('tok', m);
    await vi.advanceTimersByTimeAsync(0);
    expect(m.conexion).toHaveBeenLastCalledWith('reconectando');
    expect(m.pedidos).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS);
    expect(m.pedidos).toHaveBeenCalledTimes(2);
    cancelar();
  });

  it('si el navegador da por cerrada la conexión, la vuelve a abrir más tarde', async () => {
    const cancelar = suscribirEventos('tok', {});
    FuenteFalsa.instancias[0].fallar(true);
    expect(FuenteFalsa.instancias).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(REINTENTO_EN_VIVO_MS);
    expect(FuenteFalsa.instancias).toHaveLength(2);
    cancelar();
    expect(FuenteFalsa.instancias[1].cerrada).toBe(true);
  });

  it('un fallo de red en el sondeo no rompe nada y se reintenta', async () => {
    const m = { pedidos: vi.fn() };
    const cancelar = suscribirEventos('tok', m);
    pedir.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    FuenteFalsa.instancias[0].fallar();
    await vi.advanceTimersByTimeAsync(0);
    expect(m.pedidos).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS);
    expect(m.pedidos).toHaveBeenCalledTimes(1);
    cancelar();
  });

  it('si el servidor rechaza el token, avisa una vez y deja de insistir', async () => {
    const m = { sinPermiso: vi.fn(), pedidos: vi.fn() };
    estadoSondeo = 401;
    suscribirEventos('tok-vencido', m);
    FuenteFalsa.instancias[0].fallar();
    await vi.advanceTimersByTimeAsync(0);
    expect(m.sinPermiso).toHaveBeenCalledTimes(1);
    expect(FuenteFalsa.instancias[0].cerrada).toBe(true);
    await vi.advanceTimersByTimeAsync(INTERVALO_SONDEO_MS * 3 + REINTENTO_EN_VIVO_MS);
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(m.pedidos).not.toHaveBeenCalled();
  });
});
