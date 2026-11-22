import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModeloFiltro } from '../tipos';
import {
  construirInstrucciones,
  FILTRO_SIMULADO,
  identificarFiltro,
  MOTIVO_BORROSA,
  MOTIVO_FALLO,
  MOTIVO_NO_ES_FILTRO,
  MOTIVO_NO_ES_FOTO,
} from './identificar';

const foto = Buffer.from('foto-de-prueba');
const EQUIPOS: ModeloFiltro[] = [
  { codigo: 'OPW-6STUF10S', nombre: 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"', categoria: 'cartucho' },
  { codigo: 'OPW-200GPD-8TN', nombre: 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 200 GPD', categoria: 'sistema_osmosis_inversa' },
];

function respuestaCon(input: unknown, estado = 200) {
  return new Response(
    JSON.stringify({ content: [{ type: 'tool_use', id: 'uso_1', name: 'registrar_filtro', input }] }),
    { status: estado, headers: { 'content-type': 'application/json' } },
  );
}

describe('identificarFiltro', () => {
  const fetchSimulado = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSimulado);
    vi.stubEnv('LECTOR_SIMULADO', '0');
    vi.stubEnv('VISION_API_URL', 'https://vision.prueba.test/v1/mensajes');
    vi.stubEnv('VISION_API_KEY', 'clave-de-prueba');
    vi.stubEnv('VISION_MODELO', 'modelo-de-prueba');
    vi.stubEnv('VISION_CABECERAS', JSON.stringify({ 'servicio-version': '1' }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchSimulado.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('identifica el filtro y elige el código del catálogo', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaCon({
        es_filtro: true,
        tipo: 'ultrafiltracion',
        etapas: 6,
        medida: '10x2.5',
        marca_visible: 'Oasis',
        modelo_visible: null,
        codigo_catalogo: 'OPW-6STUF10S',
        confianza: 'alta',
        observaciones: 'Se ven seis cartuchos en un soporte.',
      }),
    );
    const resultado = await identificarFiltro(foto, 'image/jpeg', EQUIPOS);
    expect(resultado).toEqual({
      estado: 'ok',
      filtro: {
        tipo: 'ultrafiltracion',
        etapas: 6,
        medida: '10x2.5',
        marca_visible: 'Oasis',
        modelo_visible: null,
        codigo_catalogo: 'OPW-6STUF10S',
        confianza: 'alta',
        observaciones: 'Se ven seis cartuchos en un soporte.',
      },
    });
    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe('https://vision.prueba.test/v1/mensajes');
    expect(opciones.headers['x-api-key']).toBe('clave-de-prueba');
    expect(opciones.headers['servicio-version']).toBe('1');
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.model).toBe('modelo-de-prueba');
    expect(cuerpo.system).toContain('OPW-200GPD-8TN');
    expect(cuerpo.tools[0].name).toBe('registrar_filtro');
    expect(cuerpo.messages[0].content[0].source.media_type).toBe('image/jpeg');
  });

  it('si no es un filtro devuelve no_identificado con un motivo simple', async () => {
    fetchSimulado.mockResolvedValue(respuestaCon({ es_filtro: false, motivo: 'La foto está borrosa', confianza: 'baja' }));
    expect(await identificarFiltro(foto, 'image/png', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_BORROSA });

    fetchSimulado.mockResolvedValue(respuestaCon({ es_filtro: false, motivo: 'Es una planta.', confianza: 'alta' }));
    expect(await identificarFiltro(foto, 'image/png', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_NO_ES_FILTRO });
  });

  it('respuesta mal formada, error del servicio o tiempo agotado → no_identificado', async () => {
    fetchSimulado.mockResolvedValue(respuestaCon({ tipo: 'ultrafiltracion' }));
    expect(await identificarFiltro(foto, 'image/jpeg', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_FALLO });

    fetchSimulado.mockResolvedValue(new Response('{"nada":1}', { status: 200 }));
    expect(await identificarFiltro(foto, 'image/jpeg', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_FALLO });

    fetchSimulado.mockResolvedValue(respuestaCon({}, 500));
    expect(await identificarFiltro(foto, 'image/jpeg', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_FALLO });

    fetchSimulado.mockRejectedValue(Object.assign(new Error('abortado'), { name: 'AbortError' }));
    expect(await identificarFiltro(foto, 'image/jpeg', EQUIPOS)).toEqual({ estado: 'no_identificado', motivo: MOTIVO_FALLO });
  });

  it('un código que no existe en el catálogo queda en null; datos raros se limpian', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaCon({
        es_filtro: true,
        tipo: 'aspiradora',
        etapas: 40,
        medida: '30x9',
        codigo_catalogo: 'INVENTADO-1',
        confianza: 'media',
        observaciones: 'Este filtro elimina todo y deja el agua segura.',
      }),
    );
    const resultado = await identificarFiltro(foto, 'image/jpeg', EQUIPOS);
    expect(resultado.estado).toBe('ok');
    if (resultado.estado !== 'ok') return;
    expect(resultado.filtro.codigo_catalogo).toBeNull();
    expect(resultado.filtro.tipo).toBe('otro');
    expect(resultado.filtro.etapas).toBeNull();
    expect(resultado.filtro.medida).toBeNull();
    expect(resultado.filtro.observaciones).toBeNull();
  });

  it('archivo que no es imagen → no_identificado sin llamar al servicio', async () => {
    expect(await identificarFiltro(foto, 'application/pdf', EQUIPOS)).toEqual({
      estado: 'no_identificado',
      motivo: MOTIVO_NO_ES_FOTO,
    });
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('modo simulado: portafiltro triple 10x2.5 sin llamar a nadie', async () => {
    vi.stubEnv('LECTOR_SIMULADO', '1');
    const resultado = await identificarFiltro(foto, 'image/jpeg', EQUIPOS);
    expect(resultado).toEqual({ estado: 'ok', filtro: FILTRO_SIMULADO });
    expect(FILTRO_SIMULADO).toMatchObject({ tipo: 'portafiltro_triple', medida: '10x2.5', etapas: 3 });
    expect(fetchSimulado).not.toHaveBeenCalled();

    vi.stubEnv('LECTOR_SIMULADO', '0');
    vi.stubEnv('VISION_API_KEY', '');
    expect((await identificarFiltro(foto, 'image/jpeg', EQUIPOS)).estado).toBe('ok');
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('las instrucciones no mencionan palabras prohibidas', () => {
    const texto = construirInstrucciones(EQUIPOS).toLowerCase();
    expect(texto).not.toMatch(/potable|segura|apta/);
  });
});
