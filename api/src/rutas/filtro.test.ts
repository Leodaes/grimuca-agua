import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearBdDePrueba, crearEntorno, formularioFoto, insertarCartuchos, perfilDePrueba, type CartuchoDePrueba, type Entorno } from './ayudas-prueba';

const CATALOGO_FILTRO: CartuchoDePrueba[] = [
  { codigo: 'SED-10', nombre: 'Cartucho de Sedimentos 10" x 2.5" - 5 Micras', corrige: ['sedimentos'], categoria: 'cartucho' },
  { codigo: 'SED-20G', nombre: 'Cartucho de Sedimentos 20" x 4.5"', corrige: ['sedimentos'], categoria: 'cartucho' },
  { codigo: 'CTO-10', nombre: 'Cartucho CTO 10" x 2.5"', corrige: ['cloro_libre', 'sabor_olor'], categoria: 'cartucho' },
  { codigo: 'RES-10', nombre: 'Cartucho de Resina 10" x 2.5"', corrige: ['dureza'], categoria: 'cartucho' },
  { codigo: 'OSMO-8', nombre: 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 200 GPD', corrige: ['nitrato', 'dureza'], categoria: 'sistema_osmosis_inversa' },
  { codigo: 'UF-6', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"', corrige: ['sedimentos'], categoria: 'cartucho' },
];

const jpeg = { nombre: 'filtro.jpg', tipo: 'image/jpeg', datos: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]) };

describe('rutas del filtro del hogar', () => {
  let entorno: Entorno;
  let hogarId: string;

  beforeAll(async () => {
    const bd = await crearBdDePrueba();
    await insertarCartuchos(bd, CATALOGO_FILTRO);
    entorno = await crearEntorno({ bd });
  }, 60_000);

  afterAll(async () => {
    await entorno.app.close();
  });

  beforeEach(async () => {
    const creado = await entorno.app.inject({
      method: 'POST',
      url: '/api/hogares',
      payload: perfilDePrueba({ tiene_filtro: true, fecha_ultimo_cambio: '2026-09-01' }),
    });
    hogarId = creado.json().id;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('GET sin filtro registrado → filtro null', async () => {
    const respuesta = await entorno.app.inject({ method: 'GET', url: `/api/hogares/${hogarId}/filtro` });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ filtro: null, cartuchos: [] });
  });

  it('foto → identifica (modo simulado), guarda en el hogar y devuelve cartuchos compatibles', async () => {
    vi.stubEnv('LECTOR_SIMULADO', '1');
    const formulario = formularioFoto({}, jpeg);
    const respuesta = await entorno.app.inject({
      method: 'POST',
      url: `/api/hogares/${hogarId}/filtro/foto`,
      ...formulario,
    });
    expect(respuesta.statusCode).toBe(200);
    const cuerpo = respuesta.json();
    expect(cuerpo.estado).toBe('ok');
    expect(cuerpo.filtro).toMatchObject({
      tipo: 'portafiltro_triple',
      tipo_nombre: 'Portafiltro triple',
      etapas: 3,
      medida: '10x2.5',
      origen: 'foto',
    });
    const codigos = cuerpo.cartuchos.map((c: { codigo: string }) => c.codigo);
    expect(codigos).toEqual(expect.arrayContaining(['SED-10', 'CTO-10', 'RES-10']));
    expect(codigos).not.toContain('SED-20G');

    const hogar = (await entorno.app.inject({ method: 'GET', url: `/api/hogares/${hogarId}` })).json();
    expect(hogar.etapas_filtro).toBe(3);
    expect(hogar.filtro.medida).toBe('10x2.5');
    const { rows } = await entorno.bd.query('SELECT filtro_origen, filtro_detalle FROM hogares WHERE id = $1', [hogarId]);
    expect(rows[0].filtro_origen).toBe('foto');
  });

  it('foto que no muestra un filtro → no_identificado (200) y no guarda', async () => {
    vi.stubEnv('LECTOR_SIMULADO', '0');
    vi.stubEnv('VISION_API_URL', 'https://vision.prueba.test/v1');
    vi.stubEnv('VISION_API_KEY', 'clave');
    vi.stubEnv('VISION_MODELO', 'modelo');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ content: [{ type: 'tool_use', name: 'registrar_filtro', input: { es_filtro: false, motivo: 'Es un gato.', confianza: 'alta' } }] }),
          { status: 200 },
        ),
      ),
    );
    const respuesta = await entorno.app.inject({ method: 'POST', url: `/api/hogares/${hogarId}/filtro/foto`, ...formularioFoto({}, jpeg) });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().estado).toBe('no_identificado');
    expect(respuesta.json().motivo).toMatch(/filtro/);
    const despues = await entorno.app.inject({ method: 'GET', url: `/api/hogares/${hogarId}/filtro` });
    expect(despues.json().filtro).toBeNull();
  });

  it('foto: valida el formulario y el tipo de archivo', async () => {
    const sinFoto = await entorno.app.inject({ method: 'POST', url: `/api/hogares/${hogarId}/filtro/foto`, ...formularioFoto({ x: '1' }) });
    expect(sinFoto.statusCode).toBe(400);
    const pdf = await entorno.app.inject({
      method: 'POST',
      url: `/api/hogares/${hogarId}/filtro/foto`,
      ...formularioFoto({}, { nombre: 'a.pdf', tipo: 'application/pdf', datos: Buffer.from('pdf') }),
    });
    expect(pdf.statusCode).toBe(415);
  });

  it('PUT manual con modelo del catálogo: completa medida y etapas desde el nombre', async () => {
    const respuesta = await entorno.app.inject({
      method: 'PUT',
      url: `/api/hogares/${hogarId}/filtro`,
      payload: { tipo: 'ultrafiltracion', modelo_codigo: 'UF-6' },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().filtro).toMatchObject({
      tipo: 'ultrafiltracion',
      tipo_nombre: 'Ultrafiltración',
      etapas: 6,
      medida: '10x2.5',
      modelo_codigo: 'UF-6',
      modelo_nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"',
      origen: 'manual',
    });

    const invalido = await entorno.app.inject({
      method: 'PUT',
      url: `/api/hogares/${hogarId}/filtro`,
      payload: { tipo: 'otro', modelo_codigo: 'SED-10' },
    });
    expect(invalido.statusCode).toBe(400);
    const tipoMalo = await entorno.app.inject({ method: 'PUT', url: `/api/hogares/${hogarId}/filtro`, payload: { tipo: 'nave' } });
    expect(tipoMalo.statusCode).toBe(400);
  });

  it('PUT que solo confirma lo de la foto conserva el origen foto; si corrige pasa a manual', async () => {
    vi.stubEnv('LECTOR_SIMULADO', '1');
    await entorno.app.inject({ method: 'POST', url: `/api/hogares/${hogarId}/filtro/foto`, ...formularioFoto({}, jpeg) });
    const confirma = await entorno.app.inject({
      method: 'PUT',
      url: `/api/hogares/${hogarId}/filtro`,
      payload: { tipo: 'portafiltro_triple', etapas: 3, medida: '10x2.5', modelo_codigo: null },
    });
    expect(confirma.json().filtro.origen).toBe('foto');
    expect(confirma.json().filtro.confianza).toBe('media');
    const corrige = await entorno.app.inject({
      method: 'PUT',
      url: `/api/hogares/${hogarId}/filtro`,
      payload: { tipo: 'portafiltro_doble', etapas: 2, medida: '20x4.5' },
    });
    expect(corrige.json().filtro).toMatchObject({ origen: 'manual', tipo: 'portafiltro_doble', medida: '20x4.5' });
    expect(corrige.json().cartuchos.map((c: { codigo: string }) => c.codigo)).toContain('SED-20G');
  });

  it('GET /filtros/modelos lista solo equipos', async () => {
    const respuesta = await entorno.app.inject({ method: 'GET', url: '/api/filtros/modelos' });
    expect(respuesta.statusCode).toBe(200);
    const codigos = respuesta.json().map((m: { codigo: string }) => m.codigo);
    expect(codigos.sort()).toEqual(['OSMO-8', 'UF-6']);
  });

  it('la medición pone primero los cartuchos del filtro que atienden lo hallado', async () => {
    await entorno.app.inject({
      method: 'PUT',
      url: `/api/hogares/${hogarId}/filtro`,
      payload: { tipo: 'portafiltro_triple', etapas: 3, medida: '10x2.5' },
    });
    const medicion = await entorno.app.inject({
      method: 'POST',
      url: '/api/mediciones/manual',
      payload: { hogar_id: hogarId, valores: { dureza: 250, nitrato: 50 } },
    });
    expect(medicion.statusCode).toBe(201);
    const sugeridos = medicion.json().sugeridos.map((c: { codigo: string }) => c.codigo);
    expect(sugeridos[0]).toBe('RES-10');
    // El nitrato en rojo sigue cubierto por algún producto.
    expect(sugeridos).toContain('OSMO-8');
  });

  it('hogar que no existe → 404', async () => {
    const respuesta = await entorno.app.inject({ method: 'GET', url: '/api/hogares/7f3c2a8e-0000-4000-8000-000000000000/filtro' });
    expect(respuesta.statusCode).toBe(404);
  });
});
