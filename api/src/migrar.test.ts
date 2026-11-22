import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Bd } from './bd';
import { DIR_DB, migrar } from './migrar';
import {
  crearBdDePrueba,
  crearBdVacia,
  crearEntorno,
  insertarCartuchos,
  PIN_RED_PRUEBA,
  PIN_TECNICO_PRUEBA,
  type CartuchoDePrueba,
} from './rutas/ayudas-prueba';
import { buscarUrbanizacion } from './logistica/urbanizaciones';
import { CLAVES_PARAMETRO, NIVELES, type Evaluacion, type Medicion, type Pedido } from './tipos';

/** Códigos del catálogo que usa db/semilla.sql; aquí se crean con datos de prueba, sin leer el catálogo. */
const CODIGOS_DE_LA_SEMILLA: CartuchoDePrueba[] = [
  { codigo: 'OPW-PP20A022', nombre: 'Sedimentos 20 x 2.5 (prueba)', corrige: ['sedimentos'], categoria: 'cartucho' },
  { codigo: 'OPW-PP20BFL02', nombre: 'Sedimentos 20 x 4.5 (prueba)', corrige: ['sedimentos'], categoria: 'cartucho' },
  { codigo: 'OPW-GACSU5', nombre: 'GAC (prueba)', corrige: ['cloro_libre', 'sabor_olor'], categoria: 'cartucho' },
  { codigo: 'OPW-CTOSU5', nombre: 'CTO (prueba)', corrige: ['sedimentos', 'cloro_libre', 'sabor_olor'], categoria: 'cartucho' },
  { codigo: 'OPW-RSSU5', nombre: 'Resina (prueba)', corrige: ['dureza'], categoria: 'cartucho' },
  { codigo: 'OPW-100GPD-8TN', nombre: 'Ósmosis 100 (prueba)', corrige: ['nitrato', 'nitrito', 'plomo', 'cobre', 'dureza'], categoria: 'sistema_osmosis_inversa' },
  { codigo: 'OPW-200GPD-8TN', nombre: 'Ósmosis 200 (prueba)', corrige: ['nitrato', 'nitrito', 'plomo', 'cobre', 'dureza'], categoria: 'sistema_osmosis_inversa' },
  { codigo: 'OPW-6STUF10S', nombre: 'Ultrafiltración (prueba)', corrige: ['sedimentos', 'cloro_libre'], categoria: 'cartucho' },
  { codigo: 'EMUV-11W', nombre: 'Lámpara UV (prueba)', corrige: ['bacterias'], categoria: 'lampara_uv' },
];

const total = async (bd: Bd, tabla: string): Promise<number> => {
  const { rows } = await bd.query(`SELECT count(*) AS total FROM ${tabla}`);
  return Number(rows[0].total);
};

describe('migrar', () => {
  it('aplica las migraciones en orden, las registra y no las repite', async () => {
    const bd = crearBdVacia();
    const primera = await migrar(bd);
    expect(primera.aplicadas[0]).toBe('001_inicial.sql');
    expect(primera.aplicadas).toEqual([...primera.aplicadas].sort());
    expect(primera.semillas).toEqual([]);

    const { rows } = await bd.query('SELECT nombre FROM migraciones ORDER BY nombre');
    expect(rows.map((fila) => fila.nombre)).toEqual(primera.aplicadas);
    expect(await total(bd, 'tiendas')).toBe(3);
    const tiendas = await bd.query('SELECT id, horario, direccion FROM tiendas ORDER BY id');
    expect(tiendas.rows.map((fila) => fila.id)).toEqual(['biglow', 'cem', 'manongo']);
    for (const fila of tiendas.rows) {
      expect(fila.horario).toMatch(/Lunes a viernes/);
      expect(fila.direccion).toBeTruthy();
    }
    // Las columnas del catálogo real existen.
    await bd.query('SELECT categoria, recomendable, url_producto, disponible FROM cartuchos');

    const segunda = await migrar(bd);
    expect(segunda.aplicadas).toEqual([]);
    expect(await total(bd, 'tiendas')).toBe(3);
  });

  describe('con --semilla', () => {
    let dir: string;

    beforeAll(() => {
      dir = mkdtempSync(path.join(tmpdir(), 'agua-db-'));
      cpSync(path.join(DIR_DB, 'migraciones'), path.join(dir, 'migraciones'), { recursive: true });
      writeFileSync(
        path.join(dir, 'semilla_cartuchos.sql'),
        `INSERT INTO cartuchos (codigo, nombre, marca, corrige, es_ejemplo) VALUES ('PR-1', 'Cartucho de prueba', 'Prueba', ARRAY['sedimentos'], false)
         ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;`,
      );
      writeFileSync(
        path.join(dir, 'semilla.sql'),
        `INSERT INTO hogares (id, nombre, zona, origen_agua, personas, whatsapp, tienda_id)
           VALUES ('00000000-0000-4000-8000-000000000001', 'Hogar de prueba', 'Naguanagua', 'chorro', 3, '0414-555-0101', 'manongo');
         INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES ('manongo', 'PR-1', 4);`,
      );
    });

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('carga primero el catálogo y después los datos de demostración, una sola vez', async () => {
      const bd = crearBdVacia();
      const avisos: string[] = [];
      const primera = await migrar(bd, { dirDb: dir, semilla: true, avisar: (m) => avisos.push(m) });
      // El stock de semilla.sql apunta al catálogo: solo funciona si el catálogo entró antes.
      expect(primera.semillas).toEqual(['semilla_cartuchos.sql', 'semilla.sql']);
      expect(await total(bd, 'hogares')).toBe(1);
      expect(await total(bd, 'stock')).toBe(1);

      const segunda = await migrar(bd, { dirDb: dir, semilla: true, avisar: (m) => avisos.push(m) });
      expect(segunda.aplicadas).toEqual([]);
      expect(segunda.semillas).not.toContain('semilla.sql');
      expect(await total(bd, 'hogares')).toBe(1);
      expect(await total(bd, 'cartuchos')).toBe(1);
      expect(avisos.some((m) => m.includes('ya hay hogares'))).toBe(true);
    });

    it('si la semilla falla no deja datos a medias', async () => {
      const roto = mkdtempSync(path.join(tmpdir(), 'agua-db-rota-'));
      try {
        cpSync(dir, roto, { recursive: true });
        writeFileSync(
          path.join(roto, 'semilla.sql'),
          `INSERT INTO hogares (id, nombre, zona, origen_agua, personas, whatsapp)
             VALUES ('00000000-0000-4000-8000-000000000002', 'Hogar de prueba', 'Naguanagua', 'chorro', 3, '0414-555-0102');
           INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES ('manongo', 'NO-EXISTE', 4);`,
        );
        const bd = crearBdVacia();
        await expect(migrar(bd, { dirDb: roto, semilla: true })).rejects.toThrow(/semilla\.sql/);
        expect(await total(bd, 'hogares')).toBe(0);
      } finally {
        rmSync(roto, { recursive: true, force: true });
      }
    });
  });
});

describe('db/semilla.sql (datos de demostración)', () => {
  let bd: Bd;
  const sql = readFileSync(path.join(DIR_DB, 'semilla.sql'), 'utf8');

  beforeAll(async () => {
    bd = await crearBdDePrueba();
    await insertarCartuchos(bd, CODIGOS_DE_LA_SEMILLA);
    await bd.query(sql);
  });

  it('carga 7 tiendas (5 de ferreterías y 2 centros de llenado), 60 hogares de Grimuca en sus tres zonas y 10 de los dos aliados', async () => {
    expect(await total(bd, 'tiendas')).toBe(7);
    const { rows } = await bd.query('SELECT zona, count(*) AS total FROM hogares GROUP BY zona ORDER BY zona');
    expect(rows.map((fila) => [fila.zona, Number(fila.total)])).toEqual([
      ['Barquisimeto', 6],
      ['Maracay', 4],
      ['Naguanagua', 20],
      ['San Diego', 20],
      ['Valencia norte', 20],
    ]);
  });

  it('trae los comercios de la red: Grimuca, dos aliados y dos centros de llenado rotulados como de demostración', async () => {
    const { rows } = await bd.query('SELECT id, nombre, tipo, plan, membresia_usd, es_demostracion FROM comercios ORDER BY id');
    expect(rows.map((fila) => fila.id)).toEqual([
      'aliado-aragua',
      'aliado-lara',
      'centro-demo-naguanagua',
      'centro-demo-san-diego',
      'grimuca',
    ]);
    for (const fila of rows) {
      expect(fila.membresia_usd).toBeNull();
      expect(fila.tipo).toBe(fila.id.startsWith('centro-demo') ? 'centro_llenado' : 'ferreteria');
      if (fila.id === 'grimuca') expect(fila.es_demostracion).toBe(false);
      else expect(fila.nombre.endsWith('(comercio de demostración)')).toBe(true);
    }
    const tiendas = await bd.query('SELECT comercio_id, count(*) AS total FROM tiendas GROUP BY comercio_id ORDER BY comercio_id');
    expect(tiendas.rows.map((fila) => [fila.comercio_id, Number(fila.total)])).toEqual([
      ['aliado-aragua', 1],
      ['aliado-lara', 1],
      ['centro-demo-naguanagua', 1],
      ['centro-demo-san-diego', 1],
      ['grimuca', 3],
    ]);
    // Los centros publican todo: también la medición de El Tulipán con la dureza fuera de rango.
    const mediciones = await bd.query('SELECT tienda_id, count(*) AS total FROM mediciones_centro GROUP BY tienda_id ORDER BY tienda_id');
    expect(mediciones.rows.map((fila) => [fila.tienda_id, Number(fila.total)])).toEqual([
      ['llenado-el-naranjal', 3],
      ['llenado-el-tulipan', 2],
    ]);
    const stockLara = await bd.query("SELECT count(*) AS total FROM stock WHERE tienda_id = 'lara-centro'");
    expect(Number(stockLara.rows[0].total)).toBe(6);
    const pendientesLara = await bd.query("SELECT count(*) AS total FROM pedidos WHERE tienda_id = 'lara-centro' AND estado = 'pendiente'");
    expect(Number(pendientesLara.rows[0].total)).toBe(3);
  });

  it('trae 3 servicios técnicos pendientes y 1 atendido con reporte sin foto, todos de Grimuca', async () => {
    const { rows } = await bd.query(
      `SELECT p.estado, p.servicio, p.fecha_preferida, t.comercio_id, r.nota, r.foto
         FROM pedidos p JOIN tiendas t ON t.id = p.tienda_id LEFT JOIN reportes_servicio r ON r.pedido_id = p.id
        WHERE p.tipo = 'servicio'`,
    );
    expect(rows.filter((fila) => fila.estado === 'pendiente')).toHaveLength(3);
    const atendidos = rows.filter((fila) => fila.estado === 'despachado');
    expect(atendidos).toHaveLength(1);
    expect(atendidos[0].nota).toBeTruthy();
    expect(atendidos[0].foto).toBeNull();
    for (const fila of rows) {
      expect(fila.comercio_id).toBe('grimuca');
      expect(fila.servicio).toBeTruthy();
      expect(fila.fecha_preferida).toBeTruthy();
    }
  });

  it('cada hogar tiene urbanización de la lista (28 a 32 distintas) y cerca de la mitad tiene mascotas', async () => {
    // Los hogares de Grimuca (los de los aliados no tienen urbanización de la lista de Valencia).
    const { rows } = await bd.query(
      "SELECT h.zona, h.urbanizacion, h.mascotas FROM hogares h JOIN tiendas t ON t.id = h.tienda_id WHERE t.comercio_id = 'grimuca'",
    );
    expect(rows).toHaveLength(60);
    const distintas = new Set(rows.map((fila) => fila.urbanizacion));
    expect(distintas.size).toBeGreaterThanOrEqual(28);
    expect(distintas.size).toBeLessThanOrEqual(32);
    for (const fila of rows) expect(buscarUrbanizacion(fila.urbanizacion)?.zona).toBe(fila.zona);
    const conMascotas = rows.filter((fila) => fila.mascotas === true).length;
    expect(conMascotas).toBeGreaterThanOrEqual(24);
    expect(conMascotas).toBeLessThanOrEqual(36);
  });

  it('todos los datos personales son inventados y están marcados como de prueba', async () => {
    const { rows } = await bd.query('SELECT nombre, whatsapp, direccion FROM hogares');
    expect(rows).toHaveLength(70);
    for (const fila of rows) {
      expect(fila.nombre).toMatch(/^\p{Lu}\p{Ll}+ \p{Lu}\.$/u); // nombre de pila + inicial
      expect(fila.whatsapp).toMatch(/^0414-555-0[12]\d\d$/);
      expect(fila.direccion).toMatch(/\(dato de prueba\)$/);
    }
    expect(new Set(rows.map((fila) => fila.whatsapp)).size).toBe(70);
  });

  it('cada hogar tiene de 1 a 4 mediciones con la forma del contrato', async () => {
    const porHogar = await bd.query('SELECT hogar_id, count(*) AS total FROM mediciones GROUP BY hogar_id');
    expect(porHogar.rows).toHaveLength(70);
    for (const fila of porHogar.rows) {
      expect(Number(fila.total)).toBeGreaterThanOrEqual(1);
      expect(Number(fila.total)).toBeLessThanOrEqual(4);
    }

    const { rows } = await bd.query('SELECT * FROM mediciones');
    for (const fila of rows) {
      const evaluacion = fila.evaluacion as Evaluacion;
      expect(NIVELES).toContain(fila.semaforo);
      expect(evaluacion.semaforo).toBe(fila.semaforo);
      expect(Array.isArray(evaluacion.hallazgos)).toBe(true);
      expect(Array.isArray(evaluacion.corrige)).toBe(true);
      expect(evaluacion).toHaveProperty('diasParaRecambio');
      expect(evaluacion.porParametro.length).toBeGreaterThan(0);
      for (const parametro of evaluacion.porParametro) {
        expect(CLAVES_PARAMETRO).toContain(parametro.clave);
        expect(NIVELES).toContain(parametro.nivel);
        expect(typeof parametro.frase).toBe('string');
        expect(typeof parametro.orientativo).toBe('boolean');
        expect(fila.semaforo_por_parametro[parametro.clave]).toBe(parametro.nivel);
        const valor = (fila.valores as Record<string, number | null>)[parametro.clave];
        expect(parametro.valor).toBe(valor ?? null);
        if (valor === null || valor === undefined) expect(parametro.nivel).toBe('sin_dato');
      }
      expect(Object.keys(fila.valores).every((clave) => (CLAVES_PARAMETRO as readonly string[]).includes(clave))).toBe(true);
    }
  });

  it('una misma zona tiene 3 o más hogares en rojo en los últimos 7 días', async () => {
    const { rows } = await bd.query(
      `SELECT m.hogar_id, h.zona, m.fecha, m.semaforo, m.semaforo_por_parametro
         FROM mediciones m JOIN hogares h ON h.id = m.hogar_id
        ORDER BY m.fecha DESC`,
    );
    // Última medición de cada hogar.
    const ultima = new Map<string, (typeof rows)[number]>();
    for (const fila of rows) if (!ultima.has(String(fila.hogar_id))) ultima.set(String(fila.hogar_id), fila);

    const desde = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const deSalud = ['cobre', 'nitrato', 'nitrito', 'plomo', 'cloro_libre'];
    const porZona = new Map<string, number>();
    for (const fila of ultima.values()) {
      const rojoDeSalud = deSalud.some((clave) => fila.semaforo_por_parametro[clave] === 'rojo');
      if (new Date(fila.fecha).getTime() >= desde && rojoDeSalud) {
        porZona.set(fila.zona, (porZona.get(fila.zona) ?? 0) + 1);
      }
    }
    expect(porZona.get('Naguanagua')).toBeGreaterThanOrEqual(3);
    // Las otras zonas no llegan a la alerta: así se nota la diferencia en el panel.
    expect(porZona.get('San Diego') ?? 0).toBeLessThan(3);
    expect(porZona.get('Valencia norte') ?? 0).toBeLessThan(3);
  });

  it('trae stock en las tres tiendas de Grimuca (con faltantes) y de 8 a 18 pedidos pendientes mezclados (con envíos para las rutas)', async () => {
    const DE_GRIMUCA = "tienda_id IN ('manongo', 'biglow', 'cem')";
    const stock = await bd.query(`SELECT tienda_id, cantidad FROM stock WHERE ${DE_GRIMUCA}`);
    expect(new Set(stock.rows.map((fila) => fila.tienda_id)).size).toBe(3);
    // Las tres tiendas tienen hogares y pedidos pendientes: ninguna queda vacía en el panel.
    const hogaresPorTienda = await bd.query(`SELECT tienda_id, count(*) AS total FROM hogares WHERE ${DE_GRIMUCA} GROUP BY tienda_id`);
    expect(hogaresPorTienda.rows).toHaveLength(3);
    const pendientesPorTienda = await bd.query(
      `SELECT tienda_id, count(*) AS total FROM pedidos WHERE estado = 'pendiente' AND ${DE_GRIMUCA} GROUP BY tienda_id`,
    );
    expect(pendientesPorTienda.rows).toHaveLength(3);
    expect(stock.rows.some((fila) => Number(fila.cantidad) === 0)).toBe(true);
    expect(stock.rows.some((fila) => Number(fila.cantidad) > 0)).toBe(true);

    const pendientes = await bd.query(
      `SELECT tipo, pago, cartucho_codigo, modalidad, direccion FROM pedidos WHERE estado = 'pendiente' AND tipo <> 'servicio' AND ${DE_GRIMUCA}`,
    );
    expect(pendientes.rows.length).toBeGreaterThanOrEqual(8);
    expect(pendientes.rows.length).toBeLessThanOrEqual(18);
    // Rutas de despacho: 12 o más con envío (8 de Mañongo y 4 de San Diego).
    expect(pendientes.rows.filter((fila) => fila.modalidad === 'envio').length).toBeGreaterThanOrEqual(12);
    expect(pendientes.rows.some((fila) => fila.tipo === 'sobre')).toBe(true);
    expect(pendientes.rows.some((fila) => fila.tipo === 'cartucho')).toBe(true);
    for (const fila of pendientes.rows) {
      expect(fila.pago).toBe(fila.tipo === 'sobre' ? 'simulado' : 'no_aplica');
      expect(fila.cartucho_codigo === null).toBe(fila.tipo === 'sobre');
      if (fila.modalidad === 'envio') expect(fila.direccion).toBeTruthy();
    }
  });

  it('la API responde sobre la semilla: despacho del operador y resultado de un hogar', { timeout: 30_000 }, async () => {
    const entorno = await crearEntorno({ bd, conLogistica: true });
    try {
      const cabeceras = await entorno.entrarComoOperador();
      const pendientes = await entorno.app.inject({ method: 'GET', url: '/api/operador/pedidos', headers: cabeceras });
      const lista: Pedido[] = pendientes.json();
      expect(lista.length).toBeGreaterThanOrEqual(6);
      // El más reciente primero; los de cartucho traen el nombre del producto.
      expect(new Date(lista[0].fecha).getTime()).toBeGreaterThanOrEqual(new Date(lista.at(-1)!.fecha).getTime());
      expect(lista.every((p) => p.hogar_nombre && p.zona)).toBe(true);
      expect(lista.filter((p) => p.tipo === 'cartucho').every((p) => p.cartucho_nombre)).toBe(true);

      const mediciones = await entorno.app.inject({ method: 'GET', url: '/api/hogares/00000000-0000-4000-8000-000000000001/mediciones' });
      const deAna: Medicion[] = mediciones.json();
      expect(deAna).toHaveLength(2);
      expect(deAna[0].evaluacion.semaforo).toBe('rojo');
      expect(deAna[0].evaluacion.corrige).toContain('nitrato');
      // Sin filtro en casa: se sugiere primero un equipo, y nunca la lámpara UV desde la tira.
      expect(deAna[0].sugeridos[0].categoria).toBe('sistema_osmosis_inversa');
      expect(deAna[0].sugeridos.some((c) => c.categoria === 'lampara_uv')).toBe(false);
      expect(deAna[0].sugeridos.length).toBeLessThanOrEqual(4);

      const bacterias = await entorno.app.inject({ method: 'GET', url: '/api/bacterias/00000000-0000-4000-8000-000000000002' });
      expect(bacterias.json()).toMatchObject({ resultado: 'cambio' });
      expect(bacterias.json().sugeridos.map((c: { codigo: string }) => c.codigo)).toEqual(['EMUV-11W']);

      // La red sobre la semilla: Grimuca activa, Lara en periodo gratis y Aragua vencida.
      const red = await entorno.app.inject({ method: 'POST', url: '/api/red/entrar', payload: { pin: PIN_RED_PRUEBA } });
      const resumen = await entorno.app.inject({
        method: 'GET',
        url: '/api/red/resumen',
        headers: { authorization: `Bearer ${red.json().token}` },
      });
      const estados = Object.fromEntries(
        (resumen.json().comercios as Array<{ id: string; estado_membresia: string; hogares: number }>).map((c) => [
          c.id,
          [c.estado_membresia, c.hogares],
        ]),
      );
      expect(estados).toEqual({
        grimuca: ['activa', 60],
        'aliado-lara': ['periodo_gratis', 6],
        'aliado-aragua': ['vencida', 4],
        'centro-demo-naguanagua': ['activa', 0],
        'centro-demo-san-diego': ['periodo_gratis', 0],
      });
      // Grimuca es el comercio más antiguo de la red (no aparece como recién dado de alta).
      const altas = Object.fromEntries(
        (resumen.json().comercios as Array<{ id: string; fecha_alta: string }>).map((c) => [c.id, Date.parse(c.fecha_alta)]),
      );
      expect(Date.now() - altas.grimuca).toBeGreaterThan(300 * 86_400_000);
      expect(altas.grimuca).toBeLessThan(Math.min(altas['aliado-lara'], altas['aliado-aragua']));
      // Grimuca no ve los pedidos del aliado de Lara.
      expect(lista.every((p) => p.comercio_nombre === 'Grimuca')).toBe(true);
      // El técnico tiene sus 3 servicios pendientes.
      const tecnico = await entorno.app.inject({ method: 'POST', url: '/api/tecnico/entrar', payload: { pin: PIN_TECNICO_PRUEBA } });
      const servicios = await entorno.app.inject({
        method: 'GET',
        url: '/api/tecnico/servicios',
        headers: { authorization: `Bearer ${tecnico.json().token}` },
      });
      expect(servicios.json()).toHaveLength(3);
      expect(servicios.json().every((s: { orden_ruta: number | null }) => typeof s.orden_ruta === 'number')).toBe(true);
      // Rutas de despacho: 12 envíos y 3 servicios en las tres tiendas; la ruta ahorra frente a los viajes sueltos.
      const rutas = await entorno.app.inject({ method: 'GET', url: '/api/operador/rutas', headers: cabeceras });
      const { totales } = rutas.json();
      expect(totales.entregas).toBe(15);
      expect(totales.distancia_ruta_km).toBeLessThan(totales.distancia_viajes_sueltos_km);
    } finally {
      await entorno.app.close();
    }
  });
});
