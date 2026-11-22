import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ErrorApi, MENSAJE_GENERICO, MENSAJE_SIN_CONEXION } from './api';
import { guardarTokenOperador, tokenOperador } from './sesion';

const pedir = vi.fn();

function responder(estado: number, cuerpo?: unknown) {
  pedir.mockResolvedValueOnce(
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
      status: estado,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/** [url, opciones] de la llamada n (por defecto, la última). */
function llamada(n = pedir.mock.calls.length - 1): [string, RequestInit] {
  return pedir.mock.calls[n] as [string, RequestInit];
}

beforeEach(() => {
  pedir.mockReset();
  vi.stubGlobal('fetch', pedir);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api: rutas del cliente', () => {
  it('crearHogar envía el perfil como JSON y devuelve el hogar', async () => {
    responder(201, { id: 'h-1', nombre: 'Hogar de prueba' });
    const datos = {
      nombre: 'Hogar de prueba',
      zona: 'Naguanagua',
      origen_agua: 'chorro' as const,
      personas: 3,
      tiene_filtro: false,
      agua_turbia: false,
      whatsapp: '04145550101',
      consentimiento: true as const,
    };
    const hogar = await api.crearHogar(datos);
    expect(hogar.id).toBe('h-1');
    const [url, opciones] = llamada();
    expect(url).toBe('/api/hogares');
    expect(opciones.method).toBe('POST');
    expect((opciones.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body as string)).toEqual(datos);
  });

  it('arma bien las rutas con identificadores', async () => {
    const casos: Array<[() => Promise<unknown>, string, string]> = [
      [() => api.obtenerHogar('h 1'), 'GET', '/api/hogares/h%201'],
      [() => api.actualizarHogar('h-1', { direccion: 'Calle de prueba' }), 'PATCH', '/api/hogares/h-1'],
      [() => api.tiendas(), 'GET', '/api/tiendas'],
      [() => api.cartuchos(), 'GET', '/api/cartuchos'],
      [() => api.configTira(), 'GET', '/api/config/tira'],
      [() => api.medicion('m-1'), 'GET', '/api/mediciones/m-1'],
      [() => api.medicionesDeHogar('h-1'), 'GET', '/api/hogares/h-1/mediciones'],
      [() => api.pedido(7), 'GET', '/api/pedidos/7'],
      [() => api.pedidosDeHogar('h-1'), 'GET', '/api/hogares/h-1/pedidos'],
      [() => api.iniciarBacterias('h-1'), 'POST', '/api/bacterias'],
      [() => api.reportarBacterias('h-1', 'cambio'), 'PUT', '/api/bacterias/h-1'],
      [() => api.operadorEntrar('2468'), 'POST', '/api/operador/entrar'],
    ];
    for (const [llamar, metodo, ruta] of casos) {
      responder(200, {});
      await llamar();
      const [url, opciones] = llamada();
      expect(url).toBe(ruta);
      expect(opciones.method).toBe(metodo);
    }
    expect(JSON.parse(llamada(casos.length - 2)[1].body as string)).toEqual({ resultado: 'cambio' });
    expect(JSON.parse(llamada(casos.length - 1)[1].body as string)).toEqual({ pin: '2468' });
  });

  it('medirManual acepta (hogarId, valores) o un objeto', async () => {
    responder(201, { id: 'm-1' });
    await api.medirManual('h-1', { ph: 7.2 });
    expect(JSON.parse(llamada()[1].body as string)).toEqual({ hogar_id: 'h-1', valores: { ph: 7.2 } });
    responder(201, { id: 'm-2' });
    await api.medirManual({ hogar_id: 'h-2', valores: { nitrato: 10 } });
    expect(JSON.parse(llamada()[1].body as string)).toEqual({ hogar_id: 'h-2', valores: { nitrato: 10 } });
    expect(llamada()[0]).toBe('/api/mediciones/manual');
  });

  it('medirConFoto envía un formulario con la foto y devuelve no_legible sin lanzar', async () => {
    responder(200, { estado: 'no_legible', motivo: 'La foto salió oscura.' });
    const foto = new File([new Uint8Array([1, 2, 3])], 'mi-tira.png', { type: 'image/png' });
    const resultado = await api.medirConFoto('h-1', foto);
    expect(resultado).toEqual({ estado: 'no_legible', motivo: 'La foto salió oscura.' });

    const [url, opciones] = llamada();
    expect(url).toBe('/api/mediciones/foto');
    expect(opciones.method).toBe('POST');
    const formulario = opciones.body as FormData;
    expect(formulario).toBeInstanceOf(FormData);
    expect(formulario.get('hogar_id')).toBe('h-1');
    expect((formulario.get('foto') as File).name).toBe('mi-tira.png');
    // El navegador pone el Content-Type con su separador: no se fija a mano.
    expect(opciones.headers as Record<string, string>).not.toHaveProperty('Content-Type');
  });

  it('bacterias devuelve null si el hogar no ha iniciado la prueba', async () => {
    responder(404, { error: 'La prueba de bacterias de este hogar no existe.' });
    expect(await api.bacterias('h-1')).toBeNull();
    responder(200, { id: 'b-1', resultado: 'pendiente', sugeridos: [] });
    expect((await api.bacterias('h-1'))?.resultado).toBe('pendiente');
    responder(500, { error: 'Algo falló de nuestro lado.' });
    await expect(api.bacterias('h-1')).rejects.toBeInstanceOf(ErrorApi);
  });
});

describe('api: errores', () => {
  it('lanza ErrorApi con el mensaje del servidor, el estado y el detalle', async () => {
    responder(400, { error: 'Hace falta aceptar el aviso de privacidad para continuar.', detalle: [{ campo: 'consentimiento' }] });
    const error = await api.tiendas().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({
      mensaje: 'Hace falta aceptar el aviso de privacidad para continuar.',
      message: 'Hace falta aceptar el aviso de privacidad para continuar.',
      estado: 400,
      detalle: [{ campo: 'consentimiento' }],
    });
  });

  it('usa un mensaje genérico si la respuesta de error no es JSON', async () => {
    pedir.mockResolvedValueOnce(new Response('<html>502 Bad Gateway</html>', { status: 502 }));
    await expect(api.tiendas()).rejects.toMatchObject({ mensaje: MENSAJE_GENERICO, estado: 502 });
  });

  it('sin conexión lanza ErrorApi con estado 0 y un mensaje legible', async () => {
    pedir.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api.tiendas()).rejects.toMatchObject({ mensaje: MENSAJE_SIN_CONEXION, estado: 0 });
  });
});

describe('api: operador', () => {
  it('usa el token guardado y lo manda como Bearer', async () => {
    guardarTokenOperador('111.guardado');
    responder(200, []);
    await api.operadorPedidos();
    expect(llamada()[0]).toBe('/api/operador/pedidos?estado=pendiente');
    expect((llamada()[1].headers as Record<string, string>).Authorization).toBe('Bearer 111.guardado');

    for (const llamar of [() => api.resumen(), () => api.inventario(), () => api.zonas(), () => api.despachar(5)]) {
      responder(200, []);
      await llamar();
      expect((llamada()[1].headers as Record<string, string>).Authorization).toBe('Bearer 111.guardado');
    }
    expect(llamada()[0]).toBe('/api/operador/pedidos/5/despachar');
    expect(llamada()[1].method).toBe('POST');
  });

  it('operadorPedidos acepta (estado, token) o (token, estado)', async () => {
    responder(200, []);
    await api.operadorPedidos('todos', '222.explicito');
    expect(llamada()[0]).toBe('/api/operador/pedidos?estado=todos');
    expect((llamada()[1].headers as Record<string, string>).Authorization).toBe('Bearer 222.explicito');

    responder(200, []);
    await api.operadorPedidos('333.primero', 'despachado');
    expect(llamada()[0]).toBe('/api/operador/pedidos?estado=despachado');
    expect((llamada()[1].headers as Record<string, string>).Authorization).toBe('Bearer 333.primero');
  });

  it('si el servidor rechaza el token (401) lo borra para volver a pedir el PIN', async () => {
    guardarTokenOperador('111.vencido');
    responder(401, { error: 'Tu sesión de operador venció o no es válida. Vuelve a entrar con el PIN.' });
    await expect(api.resumen()).rejects.toMatchObject({ estado: 401 });
    expect(tokenOperador()).toBeNull();
  });

  it('un PIN malo lanza 401 y no toca la sesión guardada', async () => {
    guardarTokenOperador('111.guardado');
    responder(401, { error: 'PIN incorrecto.' });
    await expect(api.operadorEntrar('0000')).rejects.toMatchObject({ mensaje: 'PIN incorrecto.', estado: 401 });
    expect(tokenOperador()).toBe('111.guardado');
  });
});
