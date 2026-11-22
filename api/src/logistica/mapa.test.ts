import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { calcularMapa, type FilaHogarMapa, type FilaMedicionMapa } from './mapa';
import { URBANIZACIONES, buscarUrbanizacion, urbanizacionesDeZona, type Urbanizacion } from './urbanizaciones';
import { crearEntorno, perfilDePrueba, type Entorno } from '../rutas/ayudas-prueba';

const HOY = new Date('2026-11-21T12:00:00Z');
const haceDias = (d: number) => new Date(HOY.getTime() - d * 86_400_000).toISOString();

const LISTA: Urbanizacion[] = [
  { id: 'el-retobo', nombre: 'El Retobo', zona: 'Naguanagua', col: 2, fila: 1, verificada: false, lat: 10.276, lng: -68.032 },
  { id: 'la-begona', nombre: 'La Begoña', zona: 'Naguanagua', col: 3, fila: 1, verificada: true, lat: 10.26, lng: -68.022 },
  { id: 'trigal-norte', nombre: 'Trigal Norte', zona: 'Valencia norte', col: 1, fila: 5, verificada: true, lat: 10.228, lng: -67.997 },
  { id: 'yuma-i', nombre: 'Yuma I', zona: 'San Diego', col: 8, fila: 5, verificada: true, tienda: 'biglow', lat: 10.236, lng: -67.964 },
];

const hogar = (id: string, zona: string, urbanizacion: string | null): FilaHogarMapa => ({ id, zona, urbanizacion });
const medicion = (hogar_id: string, dias: number, semaforo: string, por: unknown): FilaMedicionMapa => ({
  hogar_id,
  fecha: haceDias(dias),
  semaforo,
  semaforo_por_parametro: por,
});

describe('cálculo del mapa por urbanización', () => {
  it('estado = peor nivel, alerta con 3 hogares en rojo de salud, sin clientes y sin medición', () => {
    const hogares = [
      hogar('a', 'Naguanagua', 'El Retobo'),
      hogar('b', 'Naguanagua', 'el retobo'), // sin importar mayúsculas
      hogar('c', 'Naguanagua', 'El Retobo'),
      hogar('d', 'Naguanagua', 'La Begona'), // sin acento
      hogar('e', 'Valencia norte', 'Trigal Norte'),
    ];
    const ultimas = [
      medicion('a', 1, 'rojo', { nitrato: 'rojo', dureza: 'amarillo' }),
      medicion('b', 2, 'rojo', { nitrato: 'rojo' }),
      medicion('c', 6, 'rojo', [{ clave: 'nitrito', nivel: 'rojo' }, { clave: 'nitrato', nivel: 'rojo' }]),
      medicion('d', 45, 'rojo', { plomo: 'rojo' }), // vieja: no cuenta
      medicion('e', 3, 'verde', { ph: 'verde' }),
    ];
    const mapa = calcularMapa(hogares, ultimas, new Map([['a', 2], ['e', 1]]), HOY, LISTA);
    const por = new Map(mapa.map((u) => [u.id, u]));

    expect(por.get('el-retobo')).toMatchObject({
      hogares: 3,
      hogares_con_medicion_30_dias: 3,
      hogares_en_rojo_7_dias: 3,
      estado: 'rojo',
      alerta: true,
      parametros: ['nitrato'],
      pedidos_pendientes: 2,
      en_tablero: true,
    });
    expect(por.get('la-begona')).toMatchObject({ hogares: 1, hogares_con_medicion_30_dias: 0, estado: 'sin_medicion', alerta: false });
    expect(por.get('trigal-norte')).toMatchObject({ estado: 'verde', parametros: [], pedidos_pendientes: 1 });
    expect(por.get('yuma-i')).toMatchObject({ hogares: 0, estado: 'sin_clientes', alerta: false, tienda: 'biglow' });
    expect(por.get('trigal-norte')).toMatchObject({ lat: 10.228, lng: -67.997 });
  });

  it('dos hogares en rojo no llegan a alerta; el amarillo no cuenta como rojo', () => {
    const mapa = calcularMapa(
      [hogar('a', 'Naguanagua', 'El Retobo'), hogar('b', 'Naguanagua', 'El Retobo'), hogar('c', 'Naguanagua', 'El Retobo')],
      [
        medicion('a', 1, 'rojo', { cobre: 'rojo' }),
        medicion('b', 1, 'rojo', { cobre: 'rojo' }),
        medicion('c', 1, 'amarillo', { cloro_libre: 'amarillo', cobre: 'amarillo' }),
      ],
      new Map(),
      HOY,
      LISTA,
    );
    expect(mapa[0]).toMatchObject({ estado: 'rojo', hogares_en_rojo_7_dias: 2, alerta: false, parametros: ['cobre'] });
  });

  it('el rojo de parámetros que no son de salud no suma para la alerta', () => {
    const ids = ['a', 'b', 'c'];
    const mapa = calcularMapa(
      ids.map((id) => hogar(id, 'Naguanagua', 'El Retobo')),
      ids.map((id) => medicion(id, 1, 'rojo', { dureza: 'rojo' })),
      new Map(),
      HOY,
      LISTA,
    );
    expect(mapa[0]).toMatchObject({ estado: 'rojo', hogares_en_rojo_7_dias: 0, alerta: false, parametros: ['dureza'] });
  });

  it('los hogares sin urbanización (o con una desconocida) van a "Otras de <zona>", fuera del tablero', () => {
    const mapa = calcularMapa(
      [
        hogar('a', 'Naguanagua', null),
        hogar('b', 'Naguanagua', 'Urbanización inventada'),
        hogar('c', 'Valencia sur', null),
        hogar('d', 'San Diego', 'El Retobo'), // urbanización de otra zona
      ],
      [medicion('a', 2, 'amarillo', { dureza: 'amarillo' })],
      new Map([['b', 1]]),
      HOY,
      LISTA,
    );
    expect(mapa).toHaveLength(LISTA.length + 3);
    const otras = mapa.filter((u) => !u.en_tablero);
    expect(otras.map((u) => u.nombre)).toEqual(['Otras de Naguanagua', 'Otras de San Diego', 'Otras de Valencia sur']);
    expect(otras[0]).toMatchObject({
      id: 'otras-naguanagua',
      col: null,
      fila: null,
      hogares: 2,
      estado: 'amarillo',
      pedidos_pendientes: 1,
    });
    expect(mapa.find((u) => u.id === 'el-retobo')).toMatchObject({ hogares: 0, estado: 'sin_clientes' });
  });
});

describe('lista de urbanizaciones', () => {
  it('ids únicos, en kebab sin acentos, y ninguna posición repetida', () => {
    const ids = URBANIZACIONES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const posiciones = URBANIZACIONES.map((u) => `${u.col},${u.fila}`);
    expect(new Set(posiciones).size).toBe(posiciones.length);
    expect(urbanizacionesDeZona('Valencia norte')).toHaveLength(29);
    expect(urbanizacionesDeZona('Naguanagua')).toHaveLength(20);
    expect(urbanizacionesDeZona('San Diego')).toHaveLength(21);
    expect(buscarUrbanizacion('Valle Verde')?.zona).toBe('San Diego');
    // Valencia norte se dibuja en 3 grupos.
    expect(new Set(urbanizacionesDeZona('Valencia norte').map((u) => u.grupo))).toEqual(
      new Set(['Trigal y este', 'Guaparo, Prebo y Camoruco', 'Oeste y Guataparo']),
    );
    expect(URBANIZACIONES.filter((u) => !u.verificada).map((u) => u.id).sort()).toEqual(
      ['campo-solo', 'el-retobo', 'la-entrada', 'paso-real', 'sabana-del-medio', 'terrazas-de-paramacay', 'trigal-centro', 'villas-de-san-diego'],
    );
  });

  it('cada urbanización tiene coordenada en Carabobo (las inferidas, marcadas aproximadas)', () => {
    for (const u of URBANIZACIONES) {
      expect(u.lat).toBeGreaterThan(10.17);
      expect(u.lat).toBeLessThan(10.31);
      expect(u.lng).toBeGreaterThan(-68.06);
      expect(u.lng).toBeLessThan(-67.93);
    }
    // Las que no tienen nodo propio en OSM.
    for (const id of ['el-retobo', 'trigal-centro', 'yuma', 'los-jarales', 'paso-real']) {
      expect(buscarUrbanizacion(id)?.coordenada_aproximada).toBe(true);
    }
    expect(buscarUrbanizacion('mañongo')?.coordenada_aproximada).toBeUndefined();
  });

  it('las tres tiendas quedan marcadas', () => {
    expect(URBANIZACIONES.filter((u) => u.tienda).map((u) => [u.id, u.tienda])).toEqual([
      ['manongo', 'manongo'],
      ['el-morro-ii', 'cem'],
      ['el-morro-i', 'biglow'],
    ]);
    expect(buscarUrbanizacion('MAÑONGO')?.id).toBe('manongo');
  });

  it('la copia del front es idéntica a la de la API', () => {
    const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(leer('../../../app/src/features/operador/urbanizaciones.ts')).toBe(leer('./urbanizaciones.ts'));
  });
});

describe('GET /api/operador/mapa', () => {
  let entorno: Entorno | undefined;
  afterEach(async () => {
    await entorno?.app.close();
    entorno = undefined;
  });

  it('exige token y cuenta el hogar en su urbanización', async () => {
    entorno = await crearEntorno({ conLogistica: true });
    const { app } = entorno;
    expect((await app.inject({ method: 'GET', url: '/api/operador/mapa' })).statusCode).toBe(401);

    const creado = await app.inject({
      method: 'POST',
      url: '/api/hogares',
      payload: perfilDePrueba({ urbanizacion: 'La Begoña' }),
    });
    expect(creado.statusCode).toBe(201);
    expect(creado.json().urbanizacion).toBe('La Begoña');
    expect(creado.json().mascotas).toBe(false);

    const res = await app.inject({ method: 'GET', url: '/api/operador/mapa', headers: await entorno.entrarComoOperador() });
    expect(res.statusCode).toBe(200);
    const mapa = res.json() as Array<{ id: string; hogares: number; estado: string }>;
    expect(mapa.filter((u) => u.hogares > 0)).toEqual([
      expect.objectContaining({ id: 'la-begona', hogares: 1, estado: 'sin_medicion' }),
    ]);

    const cambiado = await app.inject({
      method: 'PATCH',
      url: `/api/hogares/${creado.json().id}`,
      payload: { urbanizacion: '', mascotas: true },
    });
    expect(cambiado.json().urbanizacion).toBeNull();
    expect(cambiado.json().mascotas).toBe(true);
  });
});
