// Centros de llenado con resultados públicos (docs/negocio/idea-centros-de-llenado.md).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CentroCercano, ComercioEnRed, DetalleCentro, Hogar, MedicionCentro, PanelCentro, ResumenRed } from '../tipos';
import { crearEntorno, perfilDePrueba, PIN_RED_PRUEBA, PIN_TECNICO_PRUEBA, SECRETO_PRUEBA, type Entorno } from './ayudas-prueba';
import { rangoDeReferencia } from './centros';
import { crearTokenConRol } from './operador';

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

let e: Entorno;
let tokenRed: string;
let tokenTecnico: string;
let naranjal: ComercioEnRed;
let tulipan: ComercioEnRed;

async function entrar(url: string, pin: string): Promise<string> {
  const res = await e.app.inject({ method: 'POST', url, payload: { pin } });
  expect(res.statusCode).toBe(200);
  return res.json().token as string;
}

async function altaCentro(nombre: string, tienda: string, urbanizacion: string, ciudad: string): Promise<ComercioEnRed> {
  const res = await e.app.inject({
    method: 'POST',
    url: '/api/red/comercios',
    headers: bearer(tokenRed),
    payload: {
      nombre,
      estado_pais: 'Carabobo',
      ciudad,
      plan: 'basico',
      meses_gratis: 1,
      tienda_nombre: tienda,
      tipo: 'centro_llenado',
      urbanizacion,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json();
}

async function idTienda(comercioId: string): Promise<string> {
  const { rows } = await e.bd.query('SELECT id FROM tiendas WHERE comercio_id = $1', [comercioId]);
  return String(rows[0].id);
}

async function medir(tiendaId: string, valores: Record<string, number | null>, token = tokenTecnico) {
  return e.app.inject({
    method: 'POST',
    url: `/api/tecnico/centros/${tiendaId}/mediciones`,
    headers: bearer(token),
    payload: { valores, nota: 'Muestra del grifo de despacho.' },
  });
}

async function crearCliente(cambios: Record<string, unknown>): Promise<Hogar> {
  const res = await e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba(cambios) });
  expect(res.statusCode).toBe(201);
  return res.json();
}

beforeAll(async () => {
  e = await crearEntorno();
  tokenRed = await entrar('/api/red/entrar', PIN_RED_PRUEBA);
  tokenTecnico = await entrar('/api/tecnico/entrar', PIN_TECNICO_PRUEBA);
  naranjal = await altaCentro('Llenadora El Naranjal', 'Local El Naranjal', 'El Naranjal', 'Naguanagua');
  tulipan = await altaCentro('Agua El Tulipán', 'Local El Tulipán', 'el tulipan', 'San Diego');
});

afterAll(async () => {
  await e.app.close();
});

describe('alta de un centro de llenado en /red', () => {
  it('guarda el tipo y la urbanización (con el nombre de la lista)', async () => {
    expect(naranjal).toMatchObject({ tipo: 'centro_llenado', ultima_medicion_centro: null, tiendas: 1 });
    const { rows } = await e.bd.query('SELECT urbanizacion FROM tiendas WHERE comercio_id = $1', [tulipan.id]);
    expect(rows[0].urbanizacion).toBe('El Tulipán');
  });

  it('exige una urbanización de la lista para un centro, no para una ferretería', async () => {
    const base = { nombre: 'Sin lugar', estado_pais: 'Carabobo', ciudad: 'Valencia', plan: 'basico', meses_gratis: 0, tienda_nombre: 'Local' };
    const sin = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenRed), payload: { ...base, tipo: 'centro_llenado' } });
    expect(sin.statusCode).toBe(400);
    const inventada = await e.app.inject({
      method: 'POST',
      url: '/api/red/comercios',
      headers: bearer(tokenRed),
      payload: { ...base, tipo: 'centro_llenado', urbanizacion: 'Urbanización que no existe' },
    });
    expect(inventada.statusCode).toBe(400);
    const ferreteria = await e.app.inject({ method: 'POST', url: '/api/red/comercios', headers: bearer(tokenRed), payload: base });
    expect(ferreteria.statusCode).toBe(201);
    expect(ferreteria.json()).toMatchObject({ tipo: 'ferreteria' });
    expect(ferreteria.json()).not.toHaveProperty('ultima_medicion_centro');
  });
});

describe('mediciones del técnico de Grimuca', () => {
  let primera: MedicionCentro;

  it('publica la medición con cada casilla, su referencia y el conteo en rango', async () => {
    const res = await medir(await idTienda(naranjal.id), { ph: 7.2, nitrato: 10, dureza: 50, plomo: null });
    expect(res.statusCode).toBe(201);
    primera = res.json();
    expect(primera).toMatchObject({ bacterias: 'pendiente', casillas_leidas: 3, casillas_en_rango: 3, medido_por: 'Técnico de Grimuca' });
    const dureza = primera.casillas.find((c) => c.clave === 'dureza');
    expect(dureza).toMatchObject({ valor: 50, nivel: 'verde', unidad: 'mg/L' });
    expect(primera.casillas.find((c) => c.clave === 'plomo')).toMatchObject({ valor: null, nivel: 'sin_dato', orientativo: true });
    // Lo publicado no lleva frases pensadas para el hogar.
    expect(dureza).not.toHaveProperty('frase');
  });

  it('también publica lo que sale fuera de rango, sin borrar la medición anterior', async () => {
    const tienda = await idTienda(naranjal.id);
    const res = await medir(tienda, { ph: 7.2, nitrato: 50, dureza: 425, plomo: 0 });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ casillas_leidas: 4, casillas_en_rango: 2 });

    // La página pública no pide sesión y trae todo el historial, la más reciente primero.
    const publico = await e.app.inject({ method: 'GET', url: `/api/centros/${tienda}` });
    expect(publico.statusCode).toBe(200);
    const detalle: DetalleCentro = publico.json();
    expect(detalle.historial).toHaveLength(2);
    expect(detalle.ultima?.casillas.find((c) => c.clave === 'nitrato')?.nivel).toBe('rojo');
    expect(detalle.historial[1].id).toBe(primera.id);
    expect(detalle).toMatchObject({ zona: 'Naguanagua', urbanizacion: 'El Naranjal', vencida: false });
  });

  it('el frasco se anota una sola vez', async () => {
    const url = `/api/tecnico/centros/mediciones/${primera.id}/bacterias`;
    const bien = await e.app.inject({ method: 'POST', url, headers: bearer(tokenTecnico), payload: { resultado: 'sin_cambio' } });
    expect(bien.statusCode).toBe(200);
    expect(bien.json()).toMatchObject({ bacterias: 'sin_cambio' });
    expect(bien.json().fecha_bacterias).toBeTruthy();
    const otra = await e.app.inject({ method: 'POST', url, headers: bearer(tokenTecnico), payload: { resultado: 'cambio' } });
    expect(otra.statusCode).toBe(409);
  });

  it('pide al menos una casilla y solo deja medir al técnico', async () => {
    const tienda = await idTienda(tulipan.id);
    expect((await medir(tienda, { ph: null })).statusCode).toBe(400);
    const comercio = crearTokenConRol(SECRETO_PRUEBA, { rol: 'comercio', comercio_id: 'grimuca' });
    expect((await medir(tienda, { ph: 7 }, comercio)).statusCode).toBe(403);
    expect((await medir('no-existe', { ph: 7 })).statusCode).toBe(404);
  });

  it('la lista del técnico pone primero los centros sin medición vigente', async () => {
    const res = await e.app.inject({ method: 'GET', url: '/api/tecnico/centros', headers: bearer(tokenTecnico) });
    expect(res.statusCode).toBe(200);
    const lista: CentroCercano[] = res.json();
    expect(lista[0]).toMatchObject({ comercio_id: tulipan.id, ultima: null, vencida: true });
  });

  it('la red ve la fecha de la última medición del centro', async () => {
    const res = await e.app.inject({ method: 'GET', url: '/api/red/resumen', headers: bearer(tokenRed) });
    const resumen: ResumenRed = res.json();
    const centro = resumen.comercios.find((c) => c.id === naranjal.id);
    expect(centro?.ultima_medicion_centro).toBeTruthy();
    expect(resumen.comercios.find((c) => c.id === 'grimuca')).toMatchObject({ tipo: 'ferreteria' });
  });
});

describe('el centro más cercano al cliente', () => {
  it('ordena por distancia desde la urbanización del cliente', async () => {
    const begona = await crearCliente({ zona: 'Naguanagua', urbanizacion: 'La Begoña' });
    const res = await e.app.inject({ method: 'GET', url: `/api/centros?hogar_id=${begona.id}` });
    expect(res.statusCode).toBe(200);
    const lista: CentroCercano[] = res.json();
    expect(lista.map((c) => c.comercio_id)).toEqual([naranjal.id, tulipan.id]);
    expect(lista[0].distancia_km).toBeGreaterThan(0);
    expect(lista[0].distancia_km!).toBeLessThan(lista[1].distancia_km!);
    expect(lista[0]).not.toHaveProperty('historial');

    const bosque = await e.app.inject({ method: 'GET', url: '/api/centros?zona=San%20Diego&urbanizacion=Bosqueserino' });
    expect(bosque.json()[0].comercio_id).toBe(tulipan.id);
  });

  it('sin urbanización pone primero los de su zona, sin distancia', async () => {
    const res = await e.app.inject({ method: 'GET', url: '/api/centros?zona=San%20Diego' });
    const lista: CentroCercano[] = res.json();
    expect(lista[0]).toMatchObject({ comercio_id: tulipan.id, distancia_km: null });
  });

  it('el panel del centro cuenta a cuántos clientes les queda más cerca', async () => {
    const token = crearTokenConRol(SECRETO_PRUEBA, { rol: 'comercio', comercio_id: naranjal.id });
    const res = await e.app.inject({ method: 'GET', url: '/api/operador/centro', headers: bearer(token) });
    expect(res.statusCode).toBe(200);
    const panel: PanelCentro = res.json();
    expect(panel.centros).toHaveLength(1);
    expect(panel.centros[0].clientes_cercanos).toBeGreaterThanOrEqual(1);
    expect(panel.centros[0].historial).toHaveLength(2);

    const ferreteria = crearTokenConRol(SECRETO_PRUEBA, { rol: 'comercio', comercio_id: 'grimuca' });
    const otra = await e.app.inject({ method: 'GET', url: '/api/operador/centro', headers: bearer(ferreteria) });
    expect(otra.statusCode).toBe(404);
  });
});

describe('cliente hogar o negocio', () => {
  it('guarda el tipo de cliente y el rubro solo para negocios', async () => {
    const negocio = await crearCliente({ tipo_cliente: 'negocio', rubro: 'Restaurante', nombre: 'Arepera de prueba' });
    expect(negocio).toMatchObject({ tipo_cliente: 'negocio', rubro: 'Restaurante' });
    const hogar = await crearCliente({ rubro: 'No aplica' });
    expect(hogar).toMatchObject({ tipo_cliente: 'hogar', rubro: null });

    const cambio = await e.app.inject({ method: 'PATCH', url: `/api/hogares/${negocio.id}`, payload: { tipo_cliente: 'hogar' } });
    expect(cambio.json()).toMatchObject({ tipo_cliente: 'hogar', rubro: null });
    const malo = await e.app.inject({ method: 'POST', url: '/api/hogares', payload: perfilDePrueba({ tipo_cliente: 'empresa' }) });
    expect(malo.statusCode).toBe(400);
  });
});

describe('rango de referencia', () => {
  it('toma el tramo en rango de umbrales.ts', () => {
    const ph = rangoDeReferencia('ph');
    expect(ph.desde).not.toBeNull();
    expect(ph.hasta).not.toBeNull();
    expect(ph.desde!).toBeLessThan(ph.hasta!);
    expect(rangoDeReferencia('nitrato').desde).toBeNull();
  });
});
