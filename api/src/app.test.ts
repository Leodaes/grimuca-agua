import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Hogar, Medicion, Pedido, PruebaBacterias } from './tipos';
import { crearEntorno, formularioFoto, perfilDePrueba, type Entorno } from './rutas/ayudas-prueba';

const UUID_INEXISTENTE = '11111111-1111-4111-8111-111111111111';

let e: Entorno;

beforeAll(async () => {
  e = await crearEntorno();
});

afterAll(async () => {
  await e.app.close();
});

async function crearHogar(cambios: Record<string, unknown> = {}): Promise<Hogar> {
  const respuesta = await e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba(cambios) });
  expect(respuesta.statusCode).toBe(201);
  return respuesta.json();
}

describe('salud y catálogo', () => {
  it('GET /api/salud responde con la base viva', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/api/salud' });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ ok: true, bd: true, version: 'prueba' });
  });

  it('GET /api/tiendas trae las tres tiendas fijas', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/api/tiendas' });
    expect(respuesta.json().map((t: { id: string }) => t.id).sort()).toEqual(['biglow', 'cem', 'manongo']);
  });

  it('GET /api/cartuchos trae el catálogo con los campos nuevos y sin campos internos', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/api/cartuchos' });
    const cartuchos = respuesta.json();
    expect(cartuchos.length).toBeGreaterThan(5);
    const carbon = cartuchos.find((c: { codigo: string }) => c.codigo === 'PR-CARBON');
    expect(carbon).toEqual({
      codigo: 'PR-CARBON',
      nombre: 'Cartucho de carbón de prueba',
      marca: 'Marca de prueba',
      precio_usd: null,
      corrige: ['cloro_libre', 'sabor_olor'],
      es_ejemplo: false,
      foto_url: null,
      categoria: 'cartucho',
      url_producto: null,
      disponible: true,
    });
  });

  it('GET /api/config/tira devuelve la tira en uso', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/api/config/tira' });
    expect(respuesta.json().map((p: { clave: string }) => p.clave)).toEqual(['ph', 'nitrato', 'dureza', 'plomo']);
  });

  it('una ruta de /api que no existe responde 404 en JSON', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/api/no-existe' });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: 'Ruta no encontrada.' });
  });
});

describe('hogares', () => {
  it('crea un hogar y le pone la tienda sugerida por zona', async () => {
    const hogar = await crearHogar({ zona: 'San Diego', direccion: '  Calle de prueba 1  ' });
    expect(hogar.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(hogar.tienda_id).toBe('biglow');
    expect(hogar.direccion).toBe('Calle de prueba 1');
    expect(hogar.fecha_ultimo_cambio).toBeNull();
    expect(new Date(hogar.consentimiento_fecha).getTime()).toBeGreaterThan(Date.now() - 60_000);

    const leido = await e.app.inject({ method: 'GET', url: `/api/hogares/${hogar.id}` });
    expect(leido.json()).toEqual(hogar);
  });

  it('rechaza el alta sin consentimiento', async () => {
    const contar = async () => {
      const { rows } = await e.bd.query("SELECT count(*) AS total FROM hogares WHERE nombre = 'Sin permiso'");
      return Number(rows[0].total);
    };
    for (const consentimiento of [false, undefined, 'true']) {
      const respuesta = await e.app.inject({
        method: 'POST',
        url: '/api/hogares',
        payload: perfilDePrueba({ nombre: 'Sin permiso', consentimiento }),
      });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json().error).toMatch(/aviso de privacidad/);
    }
    expect(await contar()).toBe(0);
    // Con el consentimiento sí se guarda (la consulta de arriba cuenta de verdad).
    await crearHogar({ nombre: 'Sin permiso' });
    expect(await contar()).toBe(1);
  });

  it('rechaza datos inválidos con un mensaje y el detalle por campo', async () => {
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/hogares',
      payload: perfilDePrueba({ origen_agua: 'rio', personas: 0 }),
    });
    expect(respuesta.statusCode).toBe(400);
    const cuerpo = respuesta.json();
    expect(typeof cuerpo.error).toBe('string');
    expect(cuerpo.detalle.map((d: { campo: string }) => d.campo).sort()).toEqual(['origen_agua', 'personas']);
  });

  it('guarda la fecha del último cambio como AAAA-MM-DD y la borra si ya no hay filtro', async () => {
    const hogar = await crearHogar({ tiene_filtro: true, etapas_filtro: 3, fecha_ultimo_cambio: '2026-08-15' });
    expect(hogar.fecha_ultimo_cambio).toBe('2026-08-15');
    expect(hogar.etapas_filtro).toBe(3);

    const cambio = await e.app.inject({
      method: 'PATCH',
      url: `/api/hogares/${hogar.id}`,
      payload: { direccion: 'Avenida de prueba 2', tienda_id: 'cem', personas: 6 },
    });
    expect(cambio.statusCode).toBe(200);
    expect(cambio.json()).toMatchObject({
      direccion: 'Avenida de prueba 2',
      tienda_id: 'cem',
      personas: 6,
      fecha_ultimo_cambio: '2026-08-15',
    });

    const sinFiltro = await e.app.inject({ method: 'PATCH', url: `/api/hogares/${hogar.id}`, payload: { tiene_filtro: false } });
    expect(sinFiltro.json()).toMatchObject({ tiene_filtro: false, etapas_filtro: null, fecha_ultimo_cambio: null });
  });

  it('PATCH rechaza una tienda que no existe y 404 si el hogar no existe', async () => {
    const hogar = await crearHogar();
    const mala = await e.app.inject({ method: 'PATCH', url: `/api/hogares/${hogar.id}`, payload: { tienda_id: 'otra' } });
    expect(mala.statusCode).toBe(400);
    const nadie = await e.app.inject({ method: 'PATCH', url: `/api/hogares/${UUID_INEXISTENTE}`, payload: { personas: 2 } });
    expect(nadie.statusCode).toBe(404);
    const idMalo = await e.app.inject({ method: 'GET', url: '/api/hogares/no-es-un-id' });
    expect(idMalo.statusCode).toBe(400);
  });
});

describe('mediciones', () => {
  it('guarda una medición manual, la evalúa y avisa', async () => {
    const hogar = await crearHogar({ origen_agua: 'pozo', agua_turbia: true });
    const antes = e.emitidos.length;
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/mediciones/manual',
      payload: { hogar_id: hogar.id, valores: { ph: 7.2, nitrato: 50, dureza: null, inventado: 9 } },
    });
    expect(respuesta.statusCode).toBe(201);
    const medicion: Medicion = respuesta.json();
    expect(medicion.origen).toBe('manual');
    expect(medicion.hogar_id).toBe(hogar.id);
    expect(medicion.valores).toEqual({ ph: 7.2, nitrato: 50, dureza: null });
    expect(medicion.evaluacion.semaforo).toBe('rojo');
    expect(medicion.evaluacion.corrige).toEqual(['nitrato', 'sedimentos', 'bacterias']);
    expect(medicion.evaluacion.porParametro.find((p) => p.clave === 'dureza')?.nivel).toBe('sin_dato');

    // Sin filtro: primero filtros y ósmosis; nunca la lámpara UV, los repuestos ni lo agotado.
    expect(medicion.sugeridos.map((c) => c.codigo)).toEqual(['PR-OSMOSIS', 'PR-FILTRO', 'PR-SED']);

    const { rows } = await e.bd.query('SELECT semaforo, semaforo_por_parametro FROM mediciones WHERE id = $1', [medicion.id]);
    expect(rows[0].semaforo).toBe('rojo');
    expect(rows[0].semaforo_por_parametro).toEqual({ ph: 'verde', nitrato: 'rojo', dureza: 'sin_dato', plomo: 'sin_dato' });

    expect(e.emitidos.slice(antes)).toEqual([
      { tipo: 'medicion_nueva', datos: { hogar_id: hogar.id, zona: 'Naguanagua', semaforo: 'rojo' } },
    ]);

    const leida = await e.app.inject({ method: 'GET', url: `/api/mediciones/${medicion.id}` });
    expect(leida.json()).toEqual(medicion);
  });

  it('con filtro en casa sugiere primero los cartuchos de recambio y recalcula los días para el recambio', async () => {
    const hogar = await crearHogar({ tiene_filtro: true, etapas_filtro: 2, fecha_ultimo_cambio: '2026-09-01', agua_turbia: true });
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/mediciones/manual',
      payload: { hogar_id: hogar.id, valores: { nitrato: 100, dureza: 425 } },
    });
    const medicion: Medicion = respuesta.json();
    expect(medicion.sugeridos.map((c) => c.codigo)).toEqual(['PR-RESINA', 'PR-SED', 'PR-OSMOSIS', 'PR-FILTRO']);
    expect(medicion.evaluacion.diasParaRecambio).toBe(42);
  });

  it('lista las mediciones del hogar, la más reciente primero', async () => {
    const hogar = await crearHogar();
    const ids: string[] = [];
    for (const nitrato of [0, 10, 25]) {
      const r = await e.app.inject({ method: 'POST', url: '/api/mediciones/manual', payload: { hogar_id: hogar.id, valores: { nitrato } } });
      ids.push(r.json().id);
    }
    // Se separan las fechas para que el orden no dependa del reloj.
    await e.bd.query("UPDATE mediciones SET fecha = now() - interval '2 days' WHERE id = $1", [ids[0]]);
    await e.bd.query("UPDATE mediciones SET fecha = now() - interval '1 days' WHERE id = $1", [ids[1]]);
    const lista = await e.app.inject({ method: 'GET', url: `/api/hogares/${hogar.id}/mediciones` });
    expect(lista.json().map((m: Medicion) => m.id)).toEqual([ids[2], ids[1], ids[0]]);
  });

  it('rechaza una medición manual sin ningún valor o de un hogar que no existe', async () => {
    const hogar = await crearHogar();
    const vacia = await e.app.inject({ method: 'POST', url: '/api/mediciones/manual', payload: { hogar_id: hogar.id, valores: { ph: null } } });
    expect(vacia.statusCode).toBe(400);
    const nadie = await e.app.inject({ method: 'POST', url: '/api/mediciones/manual', payload: { hogar_id: UUID_INEXISTENTE, valores: { ph: 7 } } });
    expect(nadie.statusCode).toBe(404);
    const noHay = await e.app.inject({ method: 'GET', url: `/api/mediciones/${UUID_INEXISTENTE}` });
    expect(noHay.statusCode).toBe(404);
  });

  it('lee una foto de 2 MB y guarda la medición', async () => {
    const hogar = await crearHogar();
    const formulario = formularioFoto({ hogar_id: hogar.id }, { nombre: 'tira.jpg', tipo: 'image/jpeg', datos: Buffer.alloc(2 * 1024 * 1024, 7) });
    const respuesta = await e.app.inject({ method: 'POST', url: '/api/mediciones/foto', ...formulario });
    expect(respuesta.statusCode).toBe(200);
    const cuerpo = respuesta.json();
    expect(cuerpo.estado).toBe('ok');
    expect(cuerpo.medicion.origen).toBe('foto');
    expect(cuerpo.medicion.valores).toEqual({ ph: 7.2, nitrato: 10, dureza: 50, plomo: null });
    expect(e.medicion.fotos.at(-1)).toEqual({ bytes: 2 * 1024 * 1024, tipoMime: 'image/jpeg' });
  });

  it('la foto acepta el campo hogar_id después del archivo y rechaza lo que no es imagen', async () => {
    const hogar = await crearHogar();
    const limite = 'x-limite-de-prueba';
    const payload = Buffer.concat([
      Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="foto"; filename="t.png"\r\nContent-Type: image/png\r\n\r\n`),
      Buffer.from('datos-de-imagen'),
      Buffer.from(`\r\n--${limite}\r\nContent-Disposition: form-data; name="hogar_id"\r\n\r\n${hogar.id}\r\n--${limite}--\r\n`),
    ]);
    const despues = await e.app.inject({
      method: 'POST',
      url: '/api/mediciones/foto',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${limite}` },
    });
    expect(despues.json().estado).toBe('ok');

    const pdf = formularioFoto({ hogar_id: hogar.id }, { nombre: 'doc.pdf', tipo: 'application/pdf', datos: Buffer.from('x') });
    expect((await e.app.inject({ method: 'POST', url: '/api/mediciones/foto', ...pdf })).statusCode).toBe(415);

    const sinFoto = formularioFoto({ hogar_id: hogar.id });
    expect((await e.app.inject({ method: 'POST', url: '/api/mediciones/foto', ...sinFoto })).statusCode).toBe(400);

    const json = await e.app.inject({ method: 'POST', url: '/api/mediciones/foto', payload: { hogar_id: hogar.id } });
    expect(json.statusCode).toBe(415);
  });

  it('una foto de más de 8 MB se rechaza con 413', async () => {
    const hogar = await crearHogar();
    const formulario = formularioFoto({ hogar_id: hogar.id }, { nombre: 'grande.jpg', tipo: 'image/jpeg', datos: Buffer.alloc(8 * 1024 * 1024 + 10, 1) });
    const respuesta = await e.app.inject({ method: 'POST', url: '/api/mediciones/foto', ...formulario });
    expect(respuesta.statusCode).toBe(413);
    expect(respuesta.json().error).toMatch(/8 MB/);
  });
});

describe('mediciones por foto que no se pueden leer', () => {
  it('responde 200 con no_legible y no guarda nada, también si el lector falla', async () => {
    let modo: 'no_legible' | 'falla' | 'vacia' = 'no_legible';
    const entorno = await crearEntorno({
      lectura: async () => {
        if (modo === 'falla') throw new Error('sin red');
        if (modo === 'vacia') return { estado: 'ok', valores: { ph: null } };
        return { estado: 'no_legible', motivo: 'La foto salió oscura.' };
      },
    });
    try {
      const alta = await entorno.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba() });
      const hogarId = alta.json().id;
      const enviar = () =>
        entorno.app.inject({
          method: 'POST',
          url: '/api/mediciones/foto',
          ...formularioFoto({ hogar_id: hogarId }, { nombre: 't.webp', tipo: 'image/webp', datos: Buffer.from('abc') }),
        });

      const oscura = await enviar();
      expect(oscura.statusCode).toBe(200);
      expect(oscura.json()).toEqual({ estado: 'no_legible', motivo: 'La foto salió oscura.' });

      for (modo of ['falla', 'vacia'] as const) {
        const respuesta = await enviar();
        expect(respuesta.statusCode).toBe(200);
        expect(respuesta.json().estado).toBe('no_legible');
        expect(respuesta.json().motivo.length).toBeGreaterThan(10);
      }
      const { rows } = await entorno.bd.query('SELECT count(*) AS total FROM mediciones');
      expect(Number(rows[0].total)).toBe(0);
      expect(entorno.emitidos).toEqual([]);
    } finally {
      await entorno.app.close();
    }
  });
});

describe('pedidos', () => {
  it('crea el pedido del sobre con pago simulado y emite pedido_nuevo', async () => {
    const hogar = await crearHogar({ nombre: 'Casa del sobre', direccion: 'Calle de prueba 9' });
    const antes = e.emitidos.length;
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/pedidos',
      // `pago` no lo decide el cliente: se ignora lo que mande.
      payload: { hogar_id: hogar.id, tipo: 'sobre', modalidad: 'envio', direccion: null, tienda_id: 'manongo', pago: 'no_aplica' },
    });
    expect(respuesta.statusCode).toBe(201);
    const pedido: Pedido = respuesta.json();
    expect(pedido).toMatchObject({
      hogar_id: hogar.id,
      tipo: 'sobre',
      cartucho_codigo: null,
      cantidad: 1,
      modalidad: 'envio',
      direccion: 'Calle de prueba 9', // sin dirección en el pedido se usa la del hogar
      pago: 'simulado',
      tienda_id: 'manongo',
      estado: 'pendiente',
      fecha_despacho: null,
    });
    expect(typeof pedido.id).toBe('number');
    expect(pedido).not.toHaveProperty('hogar_nombre');

    const nuevos = e.emitidos.slice(antes);
    expect(nuevos).toHaveLength(1);
    expect(nuevos[0].tipo).toBe('pedido_nuevo');
    expect(nuevos[0].datos).toMatchObject({ id: pedido.id, hogar_nombre: 'Casa del sobre', zona: 'Naguanagua', cartucho_nombre: null });

    const leido = await e.app.inject({ method: 'GET', url: `/api/pedidos/${pedido.id}` });
    expect(leido.json()).toEqual(pedido);
  });

  it('crea el pedido de un cartucho sin cobro', async () => {
    const hogar = await crearHogar();
    const respuesta = await e.app.inject({
      method: 'POST',
      url: '/api/pedidos',
      payload: { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: 'PR-SED', cantidad: 2, modalidad: 'retiro', direccion: 'no hace falta', tienda_id: 'cem' },
    });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({
      tipo: 'cartucho',
      cartucho_codigo: 'PR-SED',
      cartucho_nombre: 'Cartucho de sedimentos de prueba',
      cantidad: 2,
      modalidad: 'retiro',
      direccion: null,
      pago: 'no_aplica',
      tienda_id: 'cem',
      estado: 'pendiente',
    });

    const lista = await e.app.inject({ method: 'GET', url: `/api/hogares/${hogar.id}/pedidos` });
    expect(lista.json()).toHaveLength(1);
  });

  it('rechaza pedidos incompletos o con datos que no existen', async () => {
    const hogar = await crearHogar();
    const base = { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: 'PR-SED', modalidad: 'retiro', tienda_id: 'cem' };
    const casos: Array<[Record<string, unknown>, number]> = [
      [{ ...base, cartucho_codigo: undefined }, 400],
      [{ ...base, cartucho_codigo: 'NO-EXISTE' }, 400],
      [{ ...base, tienda_id: 'otra' }, 400],
      [{ ...base, modalidad: 'envio' }, 400], // envío sin dirección en el pedido ni en el hogar
      [{ ...base, cantidad: 0 }, 400],
      [{ ...base, hogar_id: UUID_INEXISTENTE }, 404],
    ];
    for (const [payload, estado] of casos) {
      const respuesta = await e.app.inject({ method: 'POST', url: '/api/pedidos', payload });
      expect(respuesta.statusCode, JSON.stringify(payload)).toBe(estado);
      expect(typeof respuesta.json().error).toBe('string');
    }
    expect((await e.app.inject({ method: 'GET', url: '/api/pedidos/999999' })).statusCode).toBe(404);
  });
});

describe('prueba de bacterias', () => {
  it('se inicia una sola vez y solo sugiere desinfección si el frasco cambió de color', async () => {
    const hogar = await crearHogar();
    expect((await e.app.inject({ method: 'GET', url: `/api/bacterias/${hogar.id}` })).statusCode).toBe(404);

    const inicio = await e.app.inject({ method: 'POST', url: '/api/bacterias', payload: { hogar_id: hogar.id } });
    expect(inicio.statusCode).toBe(201);
    const prueba: PruebaBacterias = inicio.json();
    expect(prueba).toMatchObject({ hogar_id: hogar.id, resultado: 'pendiente', fecha_reporte: null, sugeridos: [] });

    const otraVez = await e.app.inject({ method: 'POST', url: '/api/bacterias', payload: { hogar_id: hogar.id } });
    expect(otraVez.statusCode).toBe(200);
    expect(otraVez.json()).toEqual(prueba);

    const igual = await e.app.inject({ method: 'PUT', url: `/api/bacterias/${hogar.id}`, payload: { resultado: 'sin_cambio' } });
    expect(igual.json()).toMatchObject({ id: prueba.id, resultado: 'sin_cambio', sugeridos: [] });
    expect(igual.json().fecha_reporte).not.toBeNull();

    const cambio = await e.app.inject({ method: 'PUT', url: `/api/bacterias/${hogar.id}`, payload: { resultado: 'cambio' } });
    expect(cambio.json().resultado).toBe('cambio');
    expect(cambio.json().sugeridos.map((c: { codigo: string }) => c.codigo)).toEqual(['PR-UV']);

    const leida = await e.app.inject({ method: 'GET', url: `/api/bacterias/${hogar.id}` });
    expect(leida.json()).toEqual(cambio.json());
  });

  it('valida el resultado y responde 404 si no hay prueba o no hay hogar', async () => {
    const hogar = await crearHogar();
    expect((await e.app.inject({ method: 'PUT', url: `/api/bacterias/${hogar.id}`, payload: { resultado: 'cambio' } })).statusCode).toBe(404);
    expect((await e.app.inject({ method: 'POST', url: '/api/bacterias', payload: { hogar_id: UUID_INEXISTENTE } })).statusCode).toBe(404);
    await e.app.inject({ method: 'POST', url: '/api/bacterias', payload: { hogar_id: hogar.id } });
    expect((await e.app.inject({ method: 'PUT', url: `/api/bacterias/${hogar.id}`, payload: { resultado: 'pendiente' } })).statusCode).toBe(400);
  });
});

describe('operador', () => {
  it('PIN malo → 401; sin token no se listan ni se despachan pedidos', async () => {
    const malo = await e.app.inject({ method: 'POST', url: '/api/operador/entrar', payload: { pin: '0000' } });
    expect(malo.statusCode).toBe(401);
    expect(malo.json()).toEqual({ error: 'PIN incorrecto.' });

    expect((await e.app.inject({ method: 'GET', url: '/api/operador/pedidos' })).statusCode).toBe(401);
    const tokenFalso = { authorization: 'Bearer 99999999999999.firma-inventada' };
    expect((await e.app.inject({ method: 'GET', url: '/api/operador/pedidos', headers: tokenFalso })).statusCode).toBe(401);
    expect((await e.app.inject({ method: 'POST', url: '/api/operador/pedidos/1/despachar' })).statusCode).toBe(401);
  });

  it('entra, lista los pendientes con el detalle del hogar y despacha (con aviso)', async () => {
    const hogar = await crearHogar({ nombre: 'Casa por despachar', zona: 'Valencia norte' });
    const creado = await e.app.inject({
      method: 'POST',
      url: '/api/pedidos',
      payload: { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: 'PR-CARBON', modalidad: 'retiro', tienda_id: 'cem' },
    });
    const pedidoId: number = creado.json().id;

    const cabeceras = await e.entrarComoOperador();
    expect(cabeceras.authorization.length).toBeGreaterThan(30);

    const pendientes = await e.app.inject({ method: 'GET', url: '/api/operador/pedidos?estado=pendiente', headers: cabeceras });
    expect(pendientes.statusCode).toBe(200);
    const fila = pendientes.json().find((p: Pedido) => p.id === pedidoId);
    expect(fila).toMatchObject({
      hogar_nombre: 'Casa por despachar',
      zona: 'Valencia norte',
      cartucho_nombre: 'Cartucho de carbón de prueba',
      estado: 'pendiente',
    });
    // El más nuevo va primero.
    expect(pendientes.json()[0].id).toBe(pedidoId);

    const antes = e.emitidos.length;
    const despacho = await e.app.inject({ method: 'POST', url: `/api/operador/pedidos/${pedidoId}/despachar`, headers: cabeceras });
    expect(despacho.statusCode).toBe(200);
    expect(despacho.json()).toMatchObject({ id: pedidoId, estado: 'despachado', hogar_nombre: 'Casa por despachar' });
    expect(despacho.json().fecha_despacho).not.toBeNull();
    expect(e.emitidos.slice(antes).map((ev) => ev.tipo)).toEqual(['pedido_despachado']);

    // Repetir el despacho no cambia nada ni vuelve a avisar.
    const repetido = await e.app.inject({ method: 'POST', url: `/api/operador/pedidos/${pedidoId}/despachar`, headers: cabeceras });
    expect(repetido.json().fecha_despacho).toBe(despacho.json().fecha_despacho);
    expect(e.emitidos.length).toBe(antes + 1);

    const quedan = await e.app.inject({ method: 'GET', url: '/api/operador/pedidos', headers: cabeceras });
    expect(quedan.json().some((p: Pedido) => p.id === pedidoId)).toBe(false);
    const despachados = await e.app.inject({ method: 'GET', url: '/api/operador/pedidos?estado=despachado', headers: cabeceras });
    expect(despachados.json().some((p: Pedido) => p.id === pedidoId)).toBe(true);
    const todos = await e.app.inject({ method: 'GET', url: '/api/operador/pedidos?estado=todos', headers: cabeceras });
    expect(todos.json().length).toBeGreaterThanOrEqual(quedan.json().length + 1);

    expect((await e.app.inject({ method: 'POST', url: '/api/operador/pedidos/999999/despachar', headers: cabeceras })).statusCode).toBe(404);
    expect((await e.app.inject({ method: 'GET', url: '/api/operador/pedidos?estado=raro', headers: cabeceras })).statusCode).toBe(400);
  });

  it('sin PIN configurado nadie entra, y tras muchos intentos fallidos se frena', async () => {
    const entorno = await crearEntorno({ config: { pinOperador: null, secretoSesion: 'otro-secreto-de-prueba-123456', version: 'prueba' } });
    try {
      const intentar = (pin: string) => entorno.app.inject({ method: 'POST', url: '/api/operador/entrar', payload: { pin } });
      expect((await intentar('')).statusCode).toBe(400);
      for (let i = 0; i < 8; i += 1) expect((await intentar('1234')).statusCode).toBe(401);
      expect((await intentar('1234')).statusCode).toBe(429);
    } finally {
      await entorno.app.close();
    }
  });
});

describe('eventos en vivo (SSE)', () => {
  it('rechaza sin token', async () => {
    expect((await e.app.inject({ method: 'GET', url: '/api/eventos' })).statusCode).toBe(401);
    expect((await e.app.inject({ method: 'GET', url: '/api/eventos?token=malo' })).statusCode).toBe(401);
  });

  it('un pedido nuevo le llega al panel conectado, con las cabeceras de SSE', async () => {
    const entorno = await crearEntorno();
    const direccion = await entorno.app.listen({ host: '127.0.0.1', port: 0 });
    const corte = new AbortController();
    try {
      const { authorization } = await entorno.entrarComoOperador();
      const token = authorization.replace('Bearer ', '');
      const respuesta = await fetch(`${direccion}/api/eventos?token=${encodeURIComponent(token)}`, { signal: corte.signal });
      expect(respuesta.status).toBe(200);
      expect(respuesta.headers.get('content-type')).toMatch(/^text\/event-stream/);
      expect(respuesta.headers.get('cache-control')).toBe('no-cache, no-transform');
      expect(respuesta.headers.get('x-accel-buffering')).toBe('no');

      const lector = respuesta.body!.getReader();
      const decodificador = new TextDecoder();
      let recibido = '';
      const leerHasta = async (marca: string) => {
        const limite = Date.now() + 5_000;
        while (!recibido.includes(marca)) {
          if (Date.now() > limite) throw new Error(`no llegó "${marca}"; recibido: ${recibido}`);
          const { value, done } = await lector.read();
          if (done) break;
          recibido += decodificador.decode(value, { stream: true });
        }
      };
      await leerHasta(': conectado');
      expect(recibido).toContain('retry: 3000\n\n');
      expect(entorno.eventos.suscriptores()).toBe(2); // el panel y el registro de la prueba

      const alta = await entorno.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba({ nombre: 'Casa en vivo' }) });
      const pedido = await entorno.app.inject({
        method: 'POST',
        url: '/api/pedidos',
        payload: { hogar_id: alta.json().id, tipo: 'sobre', modalidad: 'retiro', tienda_id: 'manongo' },
      });
      await leerHasta('\n\n' + 'event: pedido_nuevo');
      await leerHasta(`"id":${pedido.json().id}`);
      const bloque = recibido.slice(recibido.indexOf('event: pedido_nuevo'));
      const datos = JSON.parse(bloque.split('\n')[1].replace(/^data: /, ''));
      expect(datos).toMatchObject({ id: pedido.json().id, tipo: 'sobre', hogar_nombre: 'Casa en vivo', zona: 'Naguanagua' });

      // Al cerrar el navegador se suelta la suscripción.
      corte.abort();
      const limite = Date.now() + 3_000;
      while (entorno.eventos.suscriptores() > 1 && Date.now() < limite) await new Promise((r) => setTimeout(r, 20));
      expect(entorno.eventos.suscriptores()).toBe(1);
    } finally {
      corte.abort();
      await entorno.app.close();
    }
  });
});

describe('front compilado', () => {
  let dir: string;
  let conFront: Entorno;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'agua-front-'));
    mkdirSync(path.join(dir, 'assets'));
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>Grimuca Agua</title>');
    writeFileSync(path.join(dir, 'assets', 'app-abc123.js'), 'console.log(1)');
    conFront = await crearEntorno({ dirEstaticos: dir });
  });

  afterAll(async () => {
    await conFront.app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('sirve index.html en la raíz y en cualquier ruta del front', async () => {
    for (const url of ['/', '/perfil', '/resultado/abc', '/operador?x=1']) {
      const respuesta = await conFront.app.inject({ method: 'GET', url });
      expect(respuesta.statusCode, url).toBe(200);
      expect(respuesta.headers['content-type']).toMatch(/text\/html/);
      expect(respuesta.body).toContain('Grimuca Agua');
      expect(respuesta.headers['cache-control']).toBe('no-cache');
    }
  });

  it('sirve los archivos con huella con caché larga y no disfraza lo que falta', async () => {
    const js = await conFront.app.inject({ method: 'GET', url: '/assets/app-abc123.js' });
    expect(js.statusCode).toBe(200);
    expect(js.headers['cache-control']).toMatch(/immutable/);
    expect((await conFront.app.inject({ method: 'GET', url: '/assets/no-existe.js' })).statusCode).toBe(404);
    const api = await conFront.app.inject({ method: 'GET', url: '/api/no-existe' });
    expect(api.statusCode).toBe(404);
    expect(api.headers['content-type']).toMatch(/application\/json/);
    expect((await conFront.app.inject({ method: 'GET', url: '/api/salud' })).json().ok).toBe(true);
  });

  it('sin front compilado solo responde /api', async () => {
    const respuesta = await e.app.inject({ method: 'GET', url: '/perfil' });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: 'No encontrado.' });
  });
});
