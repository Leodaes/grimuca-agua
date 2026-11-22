import { expect, test } from '@playwright/test';
import {
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  SIN_PIN,
  SOLO_LECTURA,
  cabeceraOperador,
  crearHogar,
  crearPedido,
  entrarOperador,
  hogarInventado,
  medirManual,
  obtenerTira,
  planDeValores,
  primerCartucho,
} from './apoyo/datos';

/**
 * Contrato de la API (docs/decisiones/contrato-api.md), probado con `request`, sin navegador.
 * Corre una sola vez, en el proyecto `escritorio`.
 *
 * Lo mínimo que certifica:
 *   - crear hogar sin consentimiento → 4xx
 *   - medición manual devuelve evaluacion.porParametro
 *   - operador sin token → 401
 *   - config/tira devuelve parámetros
 * Lo demás (tiendas, cartuchos, pedidos, bacterias, despacho con PIN) cubre el resto del contrato.
 */

const CLAVES = ['alcalinidad', 'dureza', 'cobre', 'nitrato', 'cloro_libre', 'plomo', 'ph', 'nitrito', 'hierro'];
const NIVELES = ['verde', 'amarillo', 'rojo', 'sin_dato'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe('API · lectura', () => {
  test('GET /api/salud', async ({ request }) => {
    const respuesta = await request.get('/api/salud');
    expect(respuesta.status()).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ ok: true });
    expect(typeof cuerpo.bd).toBe('boolean');
    expect(typeof cuerpo.version).toBe('string');
  });

  test('GET /api/config/tira devuelve los parámetros de la tira', async ({ request }) => {
    const tira = await obtenerTira(request);
    expect(Array.isArray(tira), 'Debe ser un arreglo').toBe(true);
    expect(tira.length, 'La tira debe traer al menos un parámetro').toBeGreaterThan(0);
    for (const parametro of tira) {
      expect(CLAVES, `Clave desconocida: ${parametro.clave}`).toContain(parametro.clave);
      expect(typeof parametro.nombre).toBe('string');
      expect(parametro.nombre.length).toBeGreaterThan(0);
      expect(typeof parametro.unidad).toBe('string');
      expect(Array.isArray(parametro.niveles) && parametro.niveles.length > 0, `${parametro.clave} sin niveles`).toBe(true);
      expect(parametro.niveles.every((n) => typeof n === 'number'), `${parametro.clave}: niveles numéricos`).toBe(true);
      expect(typeof parametro.orientativo).toBe('boolean');
      if (parametro.clave === 'plomo' || parametro.clave === 'cobre') {
        expect(parametro.orientativo, `${parametro.clave} debe ser orientativo`).toBe(true);
      }
    }
    expect(new Set(tira.map((p) => p.clave)).size, 'Sin claves repetidas').toBe(tira.length);
  });

  test('GET /api/tiendas devuelve Mañongo, Big Low y CC CEM', async ({ request }) => {
    const respuesta = await request.get('/api/tiendas');
    expect(respuesta.status()).toBe(200);
    const tiendas = await respuesta.json();
    expect(tiendas.map((t: any) => t.id).sort()).toEqual(['biglow', 'cem', 'manongo']);
    for (const tienda of tiendas) {
      expect(typeof tienda.nombre).toBe('string');
      expect(typeof tienda.horario).toBe('string');
    }
  });

  test('GET /api/cartuchos devuelve el catálogo sin precios inventados ni marcas excluidas', async ({ request }) => {
    const respuesta = await request.get('/api/cartuchos');
    expect(respuesta.status()).toBe(200);
    const cartuchos = await respuesta.json();
    expect(Array.isArray(cartuchos) && cartuchos.length > 0, 'El catálogo no puede venir vacío').toBe(true);
    for (const cartucho of cartuchos) {
      expect(typeof cartucho.codigo).toBe('string');
      expect(typeof cartucho.nombre).toBe('string');
      expect(cartucho.precio_usd === null || typeof cartucho.precio_usd === 'number').toBe(true);
      expect(Array.isArray(cartucho.corrige)).toBe(true);
      expect(typeof cartucho.es_ejemplo).toBe('boolean');
      expect.soft(String(cartucho.marca), 'La línea Aqual no se usa').not.toMatch(/aqual/i);
    }
  });

  test('las rutas que no existen responden 404 con { error }', async ({ request }) => {
    const medicion = await request.get('/api/mediciones/00000000-0000-4000-8000-000000000000');
    expect(medicion.status()).toBe(404);
    expect(typeof (await medicion.json()).error).toBe('string');
    const hogar = await request.get('/api/hogares/00000000-0000-4000-8000-000000000000');
    expect(hogar.status()).toBe(404);
  });
});

test.describe('API · operador sin permiso', () => {
  const rutasProtegidas: Array<[string, string]> = [
    ['GET', '/api/operador/pedidos?estado=pendiente'],
    ['GET', '/api/operador/resumen'],
    ['GET', '/api/operador/inventario'],
    ['GET', '/api/operador/zonas'],
    ['POST', '/api/operador/pedidos/1/despachar'],
  ];

  for (const [metodo, ruta] of rutasProtegidas) {
    test(`${metodo} ${ruta} sin token → 401`, async ({ request }) => {
      const sinToken = await request.fetch(ruta, { method: metodo });
      expect(sinToken.status(), 'Sin cabecera Authorization').toBe(401);
      const tokenFalso = await request.fetch(ruta, { method: metodo, headers: { Authorization: 'Bearer token-inventado' } });
      expect(tokenFalso.status(), 'Con un token inventado').toBe(401);
    });
  }

  test('POST /api/operador/entrar con un PIN equivocado → 401', async ({ request }) => {
    const respuesta = await request.post('/api/operador/entrar', { data: { pin: 'pin-equivocado-de-prueba' } });
    expect(respuesta.status()).toBe(401);
    expect(await respuesta.text(), 'Un rechazo no puede traer token').not.toMatch(/"token"/);
  });

  test('GET /api/eventos sin token no abre el canal en vivo', async ({ request }) => {
    const respuesta = await request.get('/api/eventos', { timeout: 10_000 });
    expect([400, 401, 403]).toContain(respuesta.status());
  });
});

test.describe('API · escritura', () => {
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);

  test('POST /api/hogares sin consentimiento → 4xx', async ({ request }) => {
    const { consentimiento, ...sinCasilla } = hogarInventado();
    const sinCampo = await request.post('/api/hogares', { data: sinCasilla });
    expect(sinCampo.status(), 'Sin el campo consentimiento').toBeGreaterThanOrEqual(400);
    expect(sinCampo.status()).toBeLessThan(500);
    expect(typeof (await sinCampo.json()).error, 'El error viene como { error }').toBe('string');

    const enFalso = await request.post('/api/hogares', { data: { ...sinCasilla, consentimiento: false } });
    expect(enFalso.status(), 'Con consentimiento: false').toBeGreaterThanOrEqual(400);
    expect(enFalso.status()).toBeLessThan(500);
  });

  test('POST /api/hogares con datos incompletos → 4xx', async ({ request }) => {
    const respuesta = await request.post('/api/hogares', { data: { consentimiento: true } });
    expect(respuesta.status()).toBeGreaterThanOrEqual(400);
    expect(respuesta.status()).toBeLessThan(500);
  });

  test('POST /api/hogares con consentimiento crea el hogar y se puede leer y actualizar', async ({ request }) => {
    const hogar = await crearHogar(request);
    expect(hogar.id).toMatch(UUID);
    expect(hogar.nombre).toMatch(/^Prueba Calidad /);
    expect(Boolean(hogar.consentimiento_fecha), 'Guarda la fecha del consentimiento').toBe(true);

    const leido = await request.get(`/api/hogares/${hogar.id}`);
    expect(leido.status()).toBe(200);
    expect((await leido.json()).id).toBe(hogar.id);

    const actualizado = await request.patch(`/api/hogares/${hogar.id}`, { data: { direccion: 'Calle Cambiada 00', tienda_id: 'cem' } });
    expect(actualizado.status()).toBe(200);
    expect(await actualizado.json()).toMatchObject({ direccion: 'Calle Cambiada 00', tienda_id: 'cem' });
  });

  test('POST /api/mediciones/manual devuelve evaluacion.porParametro con una casilla en rojo', async ({ request }) => {
    const hogar = await crearHogar(request);
    const plan = planDeValores(await obtenerTira(request));
    expect(plan.claveRoja, 'La tira debe tener una casilla que pueda dar rojo').toBeTruthy();

    const medicion = await medirManual(request, hogar.id, plan.valores);
    expect(medicion.hogar_id).toBe(hogar.id);
    expect(medicion.origen).toBe('manual');
    expect(Array.isArray(medicion.evaluacion?.porParametro), 'evaluacion.porParametro es un arreglo').toBe(true);
    expect(medicion.evaluacion.porParametro.length).toBeGreaterThan(0);
    for (const resultado of medicion.evaluacion.porParametro) {
      expect(CLAVES).toContain(resultado.clave);
      expect(NIVELES).toContain(resultado.nivel);
      expect(typeof resultado.nombre).toBe('string');
      expect(typeof resultado.frase).toBe('string');
      expect(typeof resultado.orientativo).toBe('boolean');
    }
    const roja = medicion.evaluacion.porParametro.find((p: any) => p.clave === plan.claveRoja);
    expect(roja?.nivel, `${plan.claveRoja} = ${plan.valores[plan.claveRoja!]} debe dar rojo`).toBe('rojo');
    expect(medicion.evaluacion.semaforo, 'El semáforo general es el peor nivel').toBe('rojo');
    expect(Array.isArray(medicion.evaluacion.hallazgos) && medicion.evaluacion.hallazgos.length > 0, 'Hay hallazgos').toBe(true);
    expect(Array.isArray(medicion.evaluacion.corrige)).toBe(true);
    expect(Array.isArray(medicion.sugeridos), 'Trae los cartuchos sugeridos').toBe(true);
    expect.soft(medicion.sugeridos.length, 'Con un rojo debe sugerir al menos un producto').toBeGreaterThan(0);
    expect(JSON.stringify(medicion), 'Ninguna frase dice la palabra prohibida').not.toMatch(/potable/i);

    const porId = await request.get(`/api/mediciones/${medicion.id}`);
    expect(porId.status()).toBe(200);
    expect((await porId.json()).evaluacion.semaforo).toBe('rojo');

    const historial = await (await request.get(`/api/hogares/${hogar.id}/mediciones`)).json();
    expect(historial[0].id, 'La más reciente va primero').toBe(medicion.id);
  });

  test('la medición manual tolera casillas que faltan', async ({ request }) => {
    const hogar = await crearHogar(request);
    const tira = await obtenerTira(request);
    const plan = planDeValores(tira);
    const [unaClave] = Object.keys(plan.valores);
    const valores: Record<string, number | null> = { [unaClave]: plan.valores[unaClave] };
    for (const parametro of tira.slice(1, 3)) if (parametro.clave !== unaClave) valores[parametro.clave] = null;

    const medicion = await medirManual(request, hogar.id, valores);
    const leida = medicion.evaluacion.porParametro.find((p: any) => p.clave === unaClave);
    expect(leida, 'La casilla enviada viene evaluada').toBeTruthy();
    expect(leida.nivel).not.toBe('sin_dato');
    for (const resultado of medicion.evaluacion.porParametro) {
      if (resultado.clave !== unaClave) expect(resultado.nivel, `${resultado.clave} no se envió`).toBe('sin_dato');
    }
  });

  test('POST /api/mediciones/manual con un hogar que no existe o sin valores → 4xx', async ({ request }) => {
    const sinHogar = await request.post('/api/mediciones/manual', {
      data: { hogar_id: '00000000-0000-4000-8000-000000000000', valores: { nitrato: 50 } },
    });
    expect(sinHogar.status()).toBeGreaterThanOrEqual(400);
    expect(sinHogar.status()).toBeLessThan(500);
    const sinValores = await request.post('/api/mediciones/manual', { data: {} });
    expect(sinValores.status()).toBeGreaterThanOrEqual(400);
    expect(sinValores.status()).toBeLessThan(500);
  });

  test('POST /api/pedidos: el servidor decide el pago (sobre = simulado, cartucho = no aplica)', async ({ request }) => {
    const hogar = await crearHogar(request);
    const sobre = await crearPedido(request, {
      hogar_id: hogar.id, tipo: 'sobre', modalidad: 'envio', direccion: hogar.direccion, tienda_id: 'manongo',
    });
    expect(sobre).toMatchObject({ tipo: 'sobre', pago: 'simulado', estado: 'pendiente', tienda_id: 'manongo', cartucho_codigo: null });
    expect(typeof sobre.id).toBe('number');

    const cartucho = await primerCartucho(request);
    expect(cartucho, 'Hace falta un cartucho en el catálogo').toBeTruthy();
    const reposicion = await crearPedido(request, {
      hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: cartucho!.codigo, cantidad: 2, modalidad: 'retiro', tienda_id: 'manongo',
    });
    expect(reposicion).toMatchObject({ tipo: 'cartucho', pago: 'no_aplica', estado: 'pendiente', cantidad: 2, modalidad: 'retiro' });

    const leido = await request.get(`/api/pedidos/${reposicion.id}`);
    expect(leido.status()).toBe(200);
    const delHogar = await (await request.get(`/api/hogares/${hogar.id}/pedidos`)).json();
    expect(delHogar.map((p: any) => p.id).sort()).toEqual([sobre.id, reposicion.id].sort());

    // Nadie puede marcar un pago distinto desde el navegador.
    const tramposo = await request.post('/api/pedidos', {
      data: { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: cartucho!.codigo, modalidad: 'retiro', tienda_id: 'manongo', pago: 'simulado', estado: 'despachado' },
    });
    if (tramposo.status() === 201) {
      expect(await tramposo.json()).toMatchObject({ pago: 'no_aplica', estado: 'pendiente' });
    } else {
      expect(tramposo.status()).toBeGreaterThanOrEqual(400);
      expect(tramposo.status()).toBeLessThan(500);
    }

    const invalido = await request.post('/api/pedidos', { data: { hogar_id: hogar.id, tipo: 'regalo', modalidad: 'retiro', tienda_id: 'manongo' } });
    expect(invalido.status()).toBeGreaterThanOrEqual(400);
    expect(invalido.status()).toBeLessThan(500);
  });

  test('prueba de bacterias: 404 antes de empezar, inicio idempotente y reporte', async ({ request }) => {
    const hogar = await crearHogar(request);
    expect((await request.get(`/api/bacterias/${hogar.id}`)).status(), 'Sin prueba iniciada').toBe(404);

    const inicio = await request.post('/api/bacterias', { data: { hogar_id: hogar.id } });
    expect(inicio.ok()).toBe(true);
    const prueba = await inicio.json();
    expect(prueba).toMatchObject({ hogar_id: hogar.id, resultado: 'pendiente' });

    const otraVez = await (await request.post('/api/bacterias', { data: { hogar_id: hogar.id } })).json();
    expect(otraVez.id, 'Iniciar dos veces devuelve la misma prueba').toBe(prueba.id);
    expect(otraVez.fecha_inicio).toBe(prueba.fecha_inicio);

    const invalido = await request.put(`/api/bacterias/${hogar.id}`, { data: { resultado: 'limpia' } });
    expect(invalido.status()).toBeGreaterThanOrEqual(400);
    expect(invalido.status()).toBeLessThan(500);

    const reporte = await request.put(`/api/bacterias/${hogar.id}`, { data: { resultado: 'sin_cambio' } });
    expect(reporte.ok()).toBe(true);
    const reportada = await reporte.json();
    expect(reportada.resultado).toBe('sin_cambio');
    expect(Boolean(reportada.fecha_reporte)).toBe(true);
  });
});

test.describe('API · operador con PIN', () => {
  test.skip(() => !PIN_OPERADOR, SIN_PIN);

  test('con el PIN se obtiene un token y se leen resumen, inventario y zonas', async ({ request }) => {
    const token = await entrarOperador(request);
    const cabeceras = cabeceraOperador(token);

    const resumen = await request.get('/api/operador/resumen', { headers: cabeceras });
    expect(resumen.status()).toBe(200);
    const tiendas = await resumen.json();
    expect(tiendas.map((t: any) => t.tienda_id).sort()).toEqual(['biglow', 'cem', 'manongo']);
    for (const tienda of tiendas) {
      for (const campo of ['hogares', 'pedidos_pendientes', 'sobres_pendientes', 'recambios_7_dias', 'recambios_30_dias']) {
        expect(typeof tienda[campo], `resumen.${campo}`).toBe('number');
      }
    }

    const inventario = await request.get('/api/operador/inventario', { headers: cabeceras });
    expect(inventario.status()).toBe(200);
    for (const fila of await inventario.json()) {
      expect(typeof fila.stock).toBe('number');
      expect(typeof fila.demanda_30_dias).toBe('number');
      expect(typeof fila.faltante).toBe('number');
    }

    const zonas = await request.get('/api/operador/zonas', { headers: cabeceras });
    expect(zonas.status()).toBe(200);
    for (const zona of await zonas.json()) {
      expect(typeof zona.hogares_en_rojo_7_dias).toBe('number');
      expect(zona.alerta, 'Alerta = 3 o más hogares en rojo').toBe(zona.hogares_en_rojo_7_dias >= 3);
    }
  });

  test('un pedido nuevo sale en pendientes y deja de salir al despacharlo', async ({ request }) => {
    test.skip(SOLO_LECTURA, AVISO_SOLO_LECTURA);
    const token = await entrarOperador(request);
    const cabeceras = cabeceraOperador(token);
    const hogar = await crearHogar(request);
    const pedido = await crearPedido(request, {
      hogar_id: hogar.id, tipo: 'sobre', modalidad: 'envio', direccion: hogar.direccion, tienda_id: 'biglow',
    });

    const pendientes = await (await request.get('/api/operador/pedidos?estado=pendiente', { headers: cabeceras })).json();
    const enLista = pendientes.find((p: any) => p.id === pedido.id);
    expect(enLista, 'El pedido nuevo está en pendientes').toBeTruthy();
    expect(enLista).toMatchObject({ hogar_nombre: hogar.nombre, zona: hogar.zona, tipo: 'sobre' });

    const despacho = await request.post(`/api/operador/pedidos/${pedido.id}/despachar`, { headers: cabeceras });
    expect(despacho.status()).toBe(200);
    const despachado = await despacho.json();
    expect(despachado.estado).toBe('despachado');
    expect(Boolean(despachado.fecha_despacho)).toBe(true);

    const despues = await (await request.get('/api/operador/pedidos?estado=pendiente', { headers: cabeceras })).json();
    expect(despues.some((p: any) => p.id === pedido.id), 'Ya no está en pendientes').toBe(false);
    const hechos = await (await request.get('/api/operador/pedidos?estado=despachado', { headers: cabeceras })).json();
    expect(hechos.some((p: any) => p.id === pedido.id), 'Está en despachados').toBe(true);
  });
});
