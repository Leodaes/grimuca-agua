import { afterEach, describe, expect, it } from 'vitest';
import {
  FACTOR_CALLE,
  calcularRutas,
  distanciaKm,
  haversineKm,
  ordenarParadas,
  ubicacionDelHogar,
  type PedidoParaRuta,
} from './rutas-despacho';
import type { Urbanizacion } from './urbanizaciones';
import { crearEntorno, insertarComercio, perfilDePrueba, PIN_LARA_PRUEBA, PIN_TECNICO_PRUEBA, type Entorno } from '../rutas/ayudas-prueba';
import type { RutasDespacho, ServicioConReporte } from '../tipos';

const u = (id: string, lat: number, lng: number): Urbanizacion => ({
  id,
  nombre: id.toUpperCase(),
  zona: 'Naguanagua',
  col: 0,
  fila: 0,
  verificada: true,
  lat,
  lng,
});

let siguiente = 1;
const pedido = (urbanizacion: string | null, cambios: Partial<PedidoParaRuta> = {}): PedidoParaRuta => {
  const id = siguiente++;
  return {
    id,
    tipo: 'sobre',
    tienda_id: 't1',
    hogar_id: `hogar-${id}`,
    hogar_nombre: `Hogar ${id}`,
    zona: 'Naguanagua',
    urbanizacion,
    detalle: 'Sobre de prueba de agua',
    ...cambios,
  };
};

describe('distancias', () => {
  it('haversine: 0,01° de latitud son unos 1,11 km; la distancia por calle lleva el factor 1,3', () => {
    const a = { lat: 10.2, lng: -68 };
    const b = { lat: 10.21, lng: -68 };
    expect(haversineKm(a, b)).toBeCloseTo(1.112, 2);
    expect(distanciaKm(a, b)).toBeCloseTo(1.112 * FACTOR_CALLE, 2);
  });

  it('el hogar queda cerca del centro de su urbanización y siempre en el mismo punto', () => {
    const centro = { lat: 10.25, lng: -68.01 };
    const uno = ubicacionDelHogar('hogar-abc', centro);
    expect(ubicacionDelHogar('hogar-abc', centro)).toEqual(uno);
    expect(ubicacionDelHogar('hogar-xyz', centro)).not.toEqual(uno);
    const metros = haversineKm(centro, uno) * 1000;
    expect(metros).toBeGreaterThan(30);
    expect(metros).toBeLessThan(170);
  });
});

describe('orden de las paradas', () => {
  it('vecino más cercano en un caso hecho a mano: sobre una línea, de la más cercana a la más lejana', () => {
    // Tienda en el origen y paradas al norte a 1, 3, 2 y 5 km (desordenadas).
    const tienda = { lat: 10, lng: -68 };
    const puntos = [
      { lat: 10.027, lng: -68 },
      { lat: 10.009, lng: -68 },
      { lat: 10.045, lng: -68 },
      { lat: 10.018, lng: -68 },
    ];
    expect(ordenarParadas(tienda, puntos)).toEqual([1, 3, 0, 2]);
  });

  it('2-opt deshace un cruce que deja el vecino más cercano', () => {
    // Cuatro esquinas de un cuadrado al norte de la tienda: el circuito no debe cruzarse.
    const tienda = { lat: 10, lng: -68 };
    const puntos = [
      { lat: 10.01, lng: -68.01 },
      { lat: 10.01, lng: -67.99 },
      { lat: 10.03, lng: -68.01 },
      { lat: 10.03, lng: -67.99 },
    ];
    const orden = ordenarParadas(tienda, puntos);
    const largo = (o: number[]) =>
      [tienda, ...o.map((i) => puntos[i]), tienda].reduce((n, p, i, l) => (i === 0 ? 0 : n + distanciaKm(l[i - 1], p)), 0);
    // El mejor circuito recorre el perímetro: 0 → 2 → 3 → 1 (o al revés).
    expect(largo(orden)).toBeCloseTo(largo([0, 2, 3, 1]), 6);
  });
});

describe('cálculo de las rutas', () => {
  const lista = [u('a', 10.01, -68), u('b', 10.02, -68.005), u('c', 10.03, -67.99), u('d', 10.005, -68.02)];
  const tiendas = [
    { id: 't1', nombre: 'Tienda Uno' },
    { id: 't2', nombre: 'Tienda Aliada' },
  ];
  const ubicaciones = { t1: { lat: 10, lng: -68 } };

  it('una parada por urbanización, en orden, y la ruta agrupada nunca es más larga que los viajes sueltos', () => {
    const pedidos = [
      pedido('a'),
      pedido('A', { tipo: 'cartucho', detalle: 'Cartucho X' }),
      pedido('b'),
      pedido('c', { tipo: 'servicio', detalle: 'Servicio técnico' }),
      pedido('d'),
      pedido('d'),
      pedido(null), // sin urbanización: no entra
      pedido('no-existe'),
    ];
    const { rutas, totales } = calcularRutas(tiendas, pedidos, ubicaciones, lista);
    const r = rutas[0];
    expect(r.paradas).toHaveLength(4);
    expect(r.paradas.map((p) => p.orden)).toEqual([1, 2, 3, 4]);
    expect(r.paradas.find((p) => p.urbanizacion === 'A')?.pedidos).toHaveLength(2);
    expect(r.entregas).toBe(6);
    expect(r.sin_ubicacion).toBe(2);
    expect(r.distancia_ruta_km).toBeGreaterThan(0);
    expect(r.distancia_ruta_km).toBeLessThanOrEqual(r.distancia_viajes_sueltos_km);
    expect(r.ahorro_km).toBeCloseTo(r.distancia_viajes_sueltos_km - r.distancia_ruta_km, 0);
    expect(r.ahorro_porcentaje).toBeGreaterThan(0);
    // Un decimal.
    expect(Number.isInteger(r.distancia_ruta_km * 10)).toBe(true);
    expect(totales).toMatchObject({ entregas: 6, paradas: 4 });
    // La tienda sin coordenada devuelve su ruta vacía con el motivo.
    expect(rutas[1]).toMatchObject({ tienda_id: 't2', origen: null, paradas: [], entregas: 0 });
    expect(rutas[1].motivo).toMatch(/ubicación/);
  });

  it('en muchos casos al azar (con semilla fija) la ruta nunca supera los viajes sueltos', () => {
    let s = 42;
    const azar = () => {
      s = (s * 1103515245 + 12345) % 2 ** 31;
      return s / 2 ** 31;
    };
    for (let caso = 0; caso < 60; caso++) {
      const urbs = Array.from({ length: 1 + Math.floor(azar() * 7) }, (_, i) => u(`u${i}`, 10 + azar() * 0.1, -68 + azar() * 0.1));
      const pedidos = Array.from({ length: 1 + Math.floor(azar() * 12) }, () => pedido(urbs[Math.floor(azar() * urbs.length)].id));
      const { rutas } = calcularRutas([tiendas[0]], pedidos, ubicaciones, urbs);
      expect(rutas[0].distancia_ruta_km).toBeLessThanOrEqual(rutas[0].distancia_viajes_sueltos_km);
    }
  });

  it('es determinista', () => {
    const pedidos = [pedido('a'), pedido('b'), pedido('c'), pedido('d')];
    expect(calcularRutas(tiendas, pedidos, ubicaciones, lista)).toEqual(calcularRutas(tiendas, [...pedidos].reverse(), ubicaciones, lista));
  });
});

describe('GET /api/operador/rutas', () => {
  let entorno: Entorno | undefined;
  afterEach(async () => {
    await entorno?.app.close();
    entorno = undefined;
  });

  const alta = async (e: Entorno, cambios: Record<string, unknown>) =>
    (await e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba(cambios) })).json().id as string;
  const pedir = async (e: Entorno, cuerpo: Record<string, unknown>) => {
    const res = await e.app.inject({ method: 'POST', url: '/api/pedidos', payload: cuerpo });
    expect(res.statusCode).toBe(201);
    return res.json().id as number;
  };

  it('solo entran los de envío de las tiendas del comercio; uno de otro comercio no los ve', async () => {
    entorno = await crearEntorno({ conLogistica: true });
    const e = entorno;
    await insertarComercio(e.bd, { id: 'aliado-lara', nombre: 'Aliado Lara', estado: 'Lara', ciudad: 'Barquisimeto', tienda: 'lara-1' });
    expect((await e.app.inject({ method: 'GET', url: '/api/operador/rutas' })).statusCode).toBe(401);

    const begona = await alta(e, { urbanizacion: 'La Begoña', tienda_id: 'manongo' });
    const quintas = await alta(e, { urbanizacion: 'Las Quintas', tienda_id: 'manongo' });
    const sinUrb = await alta(e, { tienda_id: 'manongo' });
    const lara = await alta(e, { zona: 'Otra', tienda_id: 'lara-1' });
    const envio = { tipo: 'sobre', modalidad: 'envio', direccion: 'Calle 1 (prueba)' };
    const p1 = await pedir(e, { ...envio, hogar_id: begona, tienda_id: 'manongo' });
    const p2 = await pedir(e, { ...envio, hogar_id: quintas, tienda_id: 'manongo' });
    const retiro = await pedir(e, { hogar_id: quintas, tipo: 'sobre', modalidad: 'retiro', tienda_id: 'manongo' });
    await pedir(e, { ...envio, hogar_id: sinUrb, tienda_id: 'manongo' });
    const deLara = await pedir(e, { ...envio, hogar_id: lara, tienda_id: 'lara-1' });

    const res = await e.app.inject({ method: 'GET', url: '/api/operador/rutas', headers: await e.entrarComoOperador() });
    expect(res.statusCode).toBe(200);
    const datos: RutasDespacho = res.json();
    expect(datos.rutas.map((r) => r.tienda_id).sort()).toEqual(['biglow', 'cem', 'manongo']);
    const manongo = datos.rutas.find((r) => r.tienda_id === 'manongo')!;
    const ids = manongo.paradas.flatMap((p) => p.pedidos.map((x) => x.id));
    expect(ids.sort()).toEqual([p1, p2].sort());
    expect(ids).not.toContain(retiro);
    expect(manongo.sin_ubicacion).toBe(1);
    expect(manongo.origen).toEqual({ lat: 10.234, lng: -68 });
    expect(manongo.paradas[0]).toMatchObject({ orden: 1, pedidos: [expect.objectContaining({ tipo: 'sobre', detalle: 'Sobre de prueba de agua' })] });
    expect(datos.totales).toMatchObject({ entregas: 2, paradas: 2 });
    expect(JSON.stringify(datos)).not.toContain(String(deLara) + ',"tipo"');

    // El aliado solo ve su tienda, sin coordenada: ruta vacía con motivo.
    const tokenLara = (await e.app.inject({ method: 'POST', url: '/api/operador/entrar', payload: { pin: PIN_LARA_PRUEBA } })).json().token;
    const deAliado: RutasDespacho = (
      await e.app.inject({ method: 'GET', url: '/api/operador/rutas', headers: { authorization: `Bearer ${tokenLara}` } })
    ).json();
    expect(deAliado.rutas).toHaveLength(1);
    expect(deAliado.rutas[0]).toMatchObject({ tienda_id: 'lara-1', paradas: [], entregas: 0, sin_ubicacion: 1, origen: null });
    expect(deAliado.rutas[0].motivo).toBeTruthy();
    expect(deAliado.totales.entregas).toBe(0);
  });

  it('el técnico ve el número de parada de cada servicio pendiente, en el orden de la ruta', async () => {
    entorno = await crearEntorno({ conLogistica: true });
    const e = entorno;
    const servicio = (hogar: string) => ({
      hogar_id: hogar,
      tipo: 'servicio',
      servicio: 'cambio_cartucho',
      modalidad: 'envio',
      direccion: 'Calle 2 (prueba)',
      tienda_id: 'manongo',
      fecha_preferida: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      momento: 'manana',
    });
    // Bárbula queda más lejos de Mañongo que Las Quintas, pero se pide primero.
    const lejos = await pedir(e, servicio(await alta(e, { urbanizacion: 'Bárbula', tienda_id: 'manongo', tiene_filtro: true, etapas_filtro: 3 })));
    const cerca = await pedir(e, servicio(await alta(e, { urbanizacion: 'Las Quintas', tienda_id: 'manongo', tiene_filtro: true, etapas_filtro: 3 })));
    const sinUbicacion = await pedir(e, servicio(await alta(e, { tienda_id: 'manongo', tiene_filtro: true, etapas_filtro: 3 })));

    const token = (await e.app.inject({ method: 'POST', url: '/api/tecnico/entrar', payload: { pin: PIN_TECNICO_PRUEBA } })).json().token;
    const res = await e.app.inject({ method: 'GET', url: '/api/tecnico/servicios', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    const lista: ServicioConReporte[] = res.json();
    expect(lista.map((s) => [s.id, s.orden_ruta])).toEqual([
      [cerca, 1],
      [lejos, 2],
      [sinUbicacion, null],
    ]);
    expect(lista[0]).toHaveProperty('reporte', null);
  });
});
