import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { conNiveles, parametros, tira } from './config/tira';
import { evaluarAgua } from './evaluar';
import {
  construirInstrucciones,
  leerTira,
  MOTIVO_FALLO,
  MOTIVO_NO_ES_FOTO,
  MOTIVO_POCA_LUZ,
  MOTIVO_POCAS_CASILLAS,
  MOTIVO_SIN_TABLA,
  nivelMasCercano,
  TIEMPO_LIMITE_MS,
} from './lector';

const foto = Buffer.from('foto-de-prueba');
const URL_PRUEBA = 'https://vision.prueba.test/v1/mensajes';

type Lectura = { clave: string; valor: number | null; confianza: 'alta' | 'media' | 'baja' };

function respuestaCon(input: unknown, estado = 200) {
  return new Response(
    JSON.stringify({
      content: [
        { type: 'text', text: 'Registro la lectura.' },
        { type: 'tool_use', id: 'uso_1', name: 'registrar_lectura', input },
      ],
      stop_reason: 'tool_use',
    }),
    { status: estado, headers: { 'content-type': 'application/json' } },
  );
}

const lecturasBuenas: Lectura[] = [
  { clave: 'alcalinidad', valor: 80, confianza: 'alta' },
  { clave: 'dureza', valor: 250, confianza: 'alta' },
  { clave: 'cobre', valor: 0, confianza: 'media' },
  { clave: 'nitrato', valor: 10, confianza: 'alta' },
  { clave: 'cloro_libre', valor: 0.52, confianza: 'alta' }, // fuera de la lista: se ajusta a 0.5
  { clave: 'plomo', valor: 5, confianza: 'baja' }, // confianza baja: se descarta
  { clave: 'ph', valor: 7.2, confianza: 'alta' },
  { clave: 'nitrito', valor: null, confianza: 'alta' }, // casilla que no se ve
];

describe('leerTira', () => {
  const fetchSimulado = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSimulado);
    vi.stubEnv('LECTOR_SIMULADO', '0');
    vi.stubEnv('VISION_API_URL', URL_PRUEBA);
    vi.stubEnv('VISION_API_KEY', 'clave-de-prueba');
    vi.stubEnv('VISION_MODELO', 'modelo-de-prueba');
    vi.stubEnv('VISION_CABECERAS', JSON.stringify({ 'servicio-version': '1' }));
    vi.stubEnv('VISION_FORZAR_HERRAMIENTA', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchSimulado.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('respuesta buena: devuelve los valores, ajusta al nivel más cercano y descarta lo dudoso', async () => {
    fetchSimulado.mockResolvedValueOnce(respuestaCon({ legible: true, tabla_visible: true, lecturas: lecturasBuenas }));

    const r = await leerTira(foto, 'image/jpeg');

    expect(r).toEqual({
      estado: 'ok',
      valores: {
        alcalinidad: 80,
        dureza: 250,
        cobre: 0,
        nitrato: 10,
        cloro_libre: 0.5,
        plomo: null,
        ph: 7.2,
        nitrito: null,
      },
    });
    // Lo que no se leyó queda sin dato al evaluar, nunca en verde.
    if (r.estado === 'ok') {
      const e = evaluarAgua(r.valores);
      expect(e.porParametro.find((p) => p.clave === 'plomo')!.nivel).toBe('sin_dato');
    }
  });

  it('arma la petición con el formato acordado y la configuración del entorno', async () => {
    fetchSimulado.mockResolvedValueOnce(respuestaCon({ legible: true, tabla_visible: true, lecturas: lecturasBuenas }));

    await leerTira(foto, 'image/png');

    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe(URL_PRUEBA);
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['x-api-key']).toBe('clave-de-prueba');
    expect(opciones.headers['content-type']).toBe('application/json');
    expect(Object.keys(opciones.headers).some((c) => c.endsWith('-version'))).toBe(true);

    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.model).toBe('modelo-de-prueba');
    expect(cuerpo.max_tokens).toBeGreaterThanOrEqual(1024);
    expect(cuerpo.messages[0].role).toBe('user');
    expect(cuerpo.messages[0].content[0]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: foto.toString('base64') },
    });
    expect(cuerpo.messages[0].content[1].type).toBe('text');
    expect(cuerpo.tools).toHaveLength(1);
    expect(cuerpo.tools[0].name).toBe('registrar_lectura');
    expect(cuerpo.tools[0].input_schema.required).toEqual(['legible', 'tabla_visible', 'lecturas']);
    expect(cuerpo.tools[0].input_schema.properties.lecturas.items.properties.clave.enum).toEqual(
      tira.map((p) => p.clave),
    );
    expect(cuerpo.tool_choice).toEqual({ type: 'auto' });
    // Las instrucciones salen de la tira: cada parámetro con sus niveles.
    for (const p of tira) {
      expect(cuerpo.system).toContain(`- ${p.clave} · ${p.nombre}`);
      expect(cuerpo.system).toContain(p.niveles.join(', '));
    }
  });

  it('puede obligar el uso de la herramienta si el entorno lo pide', async () => {
    vi.stubEnv('VISION_FORZAR_HERRAMIENTA', '1');
    fetchSimulado.mockResolvedValueOnce(respuestaCon({ legible: true, tabla_visible: true, lecturas: lecturasBuenas }));
    await leerTira(foto, 'image/jpeg');
    const cuerpo = JSON.parse(fetchSimulado.mock.calls[0][1].body);
    expect(cuerpo.tool_choice).toEqual({ type: 'tool', name: 'registrar_lectura' });
  });

  it('no legible: devuelve un motivo fijo en lenguaje simple, no el texto del servicio', async () => {
    fetchSimulado.mockResolvedValueOnce(
      respuestaCon({ legible: false, motivo: 'La imagen está muy oscura.', tabla_visible: true, lecturas: [] }),
    );
    expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_POCA_LUZ });
  });

  it('si no se ve la tabla de colores, no compara: no legible', async () => {
    fetchSimulado.mockResolvedValueOnce(respuestaCon({ legible: true, tabla_visible: false, lecturas: lecturasBuenas }));
    expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_SIN_TABLA });
  });

  it('menos de 3 lecturas válidas: no legible', async () => {
    const pocas: Lectura[] = [
      { clave: 'dureza', valor: 50, confianza: 'alta' },
      { clave: 'ph', valor: 7.2, confianza: 'alta' },
      { clave: 'cobre', valor: 0, confianza: 'baja' },
      { clave: 'nitrato', valor: 9999, confianza: 'alta' }, // fuera de la tabla
    ];
    fetchSimulado.mockResolvedValueOnce(respuestaCon({ legible: true, tabla_visible: true, lecturas: pocas }));
    expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_POCAS_CASILLAS });
  });

  it('respuesta mal formada: no legible con el motivo general', async () => {
    const malas = [
      new Response('esto no es JSON', { status: 200 }),
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'No usé la herramienta.' }] }), { status: 200 }),
      respuestaCon({ legible: 'sí', lecturas: 'ninguna' }),
      respuestaCon({ legible: true, tabla_visible: true, lecturas: [{ clave: 'ph', valor: 'siete', confianza: 'alta' }] }),
    ];
    for (const mala of malas) {
      fetchSimulado.mockResolvedValueOnce(mala);
      expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_FALLO });
    }
  });

  it('error del servicio o de red: no legible con el motivo general', async () => {
    fetchSimulado.mockResolvedValueOnce(new Response('{"error":"saturado"}', { status: 529 }));
    expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_FALLO });

    fetchSimulado.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await leerTira(foto, 'image/jpeg')).toEqual({ estado: 'no_legible', motivo: MOTIVO_FALLO });
  });

  it('tiempo agotado a los 40 segundos: corta la llamada y devuelve no legible', async () => {
    vi.useFakeTimers();
    let abortada = false;
    fetchSimulado.mockImplementationOnce(
      (_url: string, opciones: { signal: AbortSignal }) =>
        new Promise((_resolver, rechazar) => {
          opciones.signal.addEventListener('abort', () => {
            abortada = true;
            rechazar(new DOMException('La operación fue cancelada.', 'AbortError'));
          });
        }),
    );

    const pendiente = leerTira(foto, 'image/jpeg');
    await vi.advanceTimersByTimeAsync(TIEMPO_LIMITE_MS - 1);
    expect(abortada).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(await pendiente).toEqual({ estado: 'no_legible', motivo: MOTIVO_FALLO });
    expect(abortada).toBe(true);
  });

  it('un archivo que no es foto no se envía al servicio', async () => {
    expect(await leerTira(foto, 'application/pdf')).toEqual({ estado: 'no_legible', motivo: MOTIVO_NO_ES_FOTO });
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('lector simulado: lectura fija de ejemplo, con un amarillo y un rojo, sin tocar la red', async () => {
    vi.stubEnv('LECTOR_SIMULADO', '1');
    const r = await leerTira(foto, 'image/jpeg');
    expect(fetchSimulado).not.toHaveBeenCalled();
    expect(r.estado).toBe('ok');
    if (r.estado !== 'ok') return;
    expect(Object.keys(r.valores)).toEqual(tira.map((p) => p.clave));
    const niveles = evaluarAgua(r.valores).porParametro.map((p) => p.nivel);
    expect(niveles.filter((n) => n === 'rojo')).toHaveLength(1);
    expect(niveles).toContain('amarillo');
    expect(await leerTira(foto, 'image/jpeg')).toEqual(r);
  });

  it('sin clave del servicio también usa la lectura simulada', async () => {
    vi.stubEnv('VISION_API_KEY', '');
    const r = await leerTira(foto, 'image/jpeg');
    expect(r.estado).toBe('ok');
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('con otra tira (menos casillas, otros niveles) las instrucciones y la lectura cambian solas', async () => {
    const otraTira = [conNiveles(parametros.ph, [6, 7, 8]), parametros.cloro_libre];
    expect(construirInstrucciones(otraTira)).toContain('- ph · pH: 6, 7, 8');
    expect(construirInstrucciones(otraTira)).not.toContain('plomo');

    fetchSimulado.mockResolvedValueOnce(
      respuestaCon({
        legible: true,
        tabla_visible: true,
        lecturas: [
          { clave: 'ph', valor: 7, confianza: 'alta' },
          { clave: 'cloro_libre', valor: 1, confianza: 'alta' },
          { clave: 'plomo', valor: 50, confianza: 'alta' }, // no está en esta tira: se ignora
        ],
      }),
    );
    expect(await leerTira(foto, 'image/jpeg', otraTira)).toEqual({
      estado: 'ok',
      valores: { ph: 7, cloro_libre: 1 },
    });
  });
});

describe('nivelMasCercano', () => {
  it('ajusta al nivel más cercano y, en un empate, al más alto', () => {
    expect(nivelMasCercano(0.52, [0, 0.5, 1, 3])).toBe(0.5);
    expect(nivelMasCercano(2, [0, 0.5, 1, 3])).toBe(3);
    expect(nivelMasCercano(7.5, [6.2, 6.8, 7.2, 7.6])).toBe(7.6);
  });

  it('devuelve null si el valor queda claramente fuera de la tabla', () => {
    expect(nivelMasCercano(9999, [0, 10, 25, 50])).toBeNull();
    expect(nivelMasCercano(-20, [0, 10, 25, 50])).toBeNull();
    expect(nivelMasCercano(Number.NaN, [0, 10])).toBeNull();
  });
});
