// Lee la foto de una tira con el servicio de visión.
// El servicio se configura SOLO por variables de entorno:
//   VISION_API_URL, VISION_API_KEY, VISION_MODELO
//   LECTOR_SIMULADO=1            → no llama a nadie: devuelve una lectura fija de ejemplo.
//   VISION_FORZAR_HERRAMIENTA=1  → (opcional) obliga al servicio a usar la herramienta; solo para
//                                  modelos que lo admiten. Por defecto se pide en el texto.
// Nunca adivina: ante la duda devuelve `no_legible` y la app ofrece la carga manual.

import { z } from 'zod';
import type { ClaveParametro, LecturaTira, ParametroTira, ValoresMedicion } from '../tipos';
import { tira } from './config/tira';

export type ResultadoLectura = LecturaTira;

export const TIEMPO_LIMITE_MS = 40_000;
export const MINIMO_LECTURAS = 3;
const NOMBRE_HERRAMIENTA = 'registrar_lectura';
/** Cabeceras adicionales que exija el servicio de visión, como JSON en VISION_CABECERAS (por ejemplo, la versión de su API). */
function cabecerasExtra(): Record<string, string> {
  try {
    const crudo = process.env.VISION_CABECERAS;
    return crudo ? (JSON.parse(crudo) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
// Margen para que el servicio pueda razonar antes de registrar la lectura sin quedarse corto.
const MAXIMO_TOKENS = 4096;
const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const MOTIVO_FALLO =
  'No pudimos leer la foto. Intenta de nuevo o carga los colores a mano.';
export const MOTIVO_NO_LEGIBLE =
  'No pudimos leer la tira. Repite la foto con buena luz, junto a la tabla de colores, o carga los colores a mano.';
export const MOTIVO_SIN_TABLA =
  'En la foto no se ve la tabla de colores. Pon la tira al lado de la tabla y repite la foto, o carga los colores a mano.';
export const MOTIVO_POCAS_CASILLAS =
  'Se ven muy pocas casillas en la foto. Repítela con buena luz, junto a la tabla de colores, o carga los colores a mano.';
export const MOTIVO_BORROSA =
  'La foto salió borrosa. Tómala otra vez con el teléfono quieto, o carga los colores a mano.';
export const MOTIVO_POCA_LUZ =
  'La foto salió con poca luz, sombras o reflejos. Tómala cerca de una ventana, o carga los colores a mano.';
export const MOTIVO_SIN_TIRA =
  'No vemos la tira en la foto. Ponla junto a la tabla de colores y repite la foto, o carga los colores a mano.';
export const MOTIVO_NO_ES_FOTO ='Ese archivo no es una foto. Usa JPG o PNG.';

// ── Lectura simulada (demo y pruebas sin red) ──

/** Valores de ejemplo: casi todo en rango, dureza en amarillo y cloro en rojo. */
const EJEMPLO: Record<ClaveParametro, number> = {
  alcalinidad: 80,
  dureza: 250,
  cobre: 0.2,
  nitrato: 10,
  cloro_libre: 5,
  plomo: 0,
  ph: 7.2,
  nitrito: 0,
  hierro: 0,
};

export function lecturaSimulada(tiraEnUso: ParametroTira[] = tira): ValoresMedicion {
  const valores: ValoresMedicion = {};
  for (const parametro of tiraEnUso) {
    valores[parametro.clave] = nivelMasCercano(EJEMPLO[parametro.clave], parametro.niveles, true);
  }
  return valores;
}

// ── Petición al servicio ──

function formatoNumero(n: number): string {
  return String(n);
}

export function construirInstrucciones(tiraEnUso: ParametroTira[] = tira): string {
  const lista = tiraEnUso
    .map((p) => {
      const unidad = p.unidad ? ` (${p.unidad})` : '';
      return `- ${p.clave} · ${p.nombre}${unidad}: ${p.niveles.map(formatoNumero).join(', ')}`;
    })
    .join('\n');

  return [
    'Eres un lector de tiras reactivas para medir el agua en casa.',
    'Recibes una foto en la que debe aparecer una tira ya mojada junto a la tabla de colores impresa que viene con ella.',
    '',
    'Tu trabajo: comparar el color de cada casilla de la tira con la fila que le corresponde en la tabla de colores impresa que aparece en la misma foto, y registrar el nivel que más se parece.',
    '',
    'Parámetros y niveles permitidos (clave · nombre: niveles):',
    lista,
    '',
    'Reglas:',
    '1. Compara siempre contra la tabla de colores que se ve en la foto, no contra lo que recuerdes de otras tiras.',
    '2. Devuelve una lectura por cada parámetro de la lista, con su clave exacta.',
    '3. En "valor" elige SOLO entre los niveles de la lista para ese parámetro. No inventes valores intermedios.',
    '4. Si el color queda entre dos niveles, elige el más alto.',
    '5. Si una casilla no se ve, está tapada, o la tira de la foto no trae ese parámetro, pon "valor": null. No adivines.',
    '6. En "confianza" di qué tan clara es la comparación: "alta", "media" o "baja".',
    '7. "tabla_visible" es true solo si la tabla de colores impresa se ve en la foto. "tira_visible" es true solo si se ve una tira reactiva con sus casillas de color (la tabla sola no cuenta como tira).',
    '8. Pon "legible": false si no hay una tira en la foto, si está borrosa o movida, si hay mala luz (oscura, con sombras fuertes o reflejos) o si no puedes comparar con la tabla. En ese caso escribe en "motivo" una sola frase corta y simple, en español y de tú, que diga qué corregir en la foto (por ejemplo: "La foto salió oscura. Tómala cerca de una ventana."), y deja "lecturas" vacía.',
    '9. No opines sobre el agua ni des consejos: solo registra la lectura.',
    '10. Si en una fila los valores impresos en la tabla de la foto no son los niveles de la lista (por ejemplo, la tabla es de otra marca), pon "valor": null en esa casilla. No conviertas ni redondees un valor impreso a un nivel de la lista.',
    '11. Si un reflejo, una sombra o algo encima lava o tapa el color de una casilla, pon "valor": null en esa casilla. No la leas como el nivel más claro.',
    '',
    `Responde siempre llamando una sola vez a la herramienta ${NOMBRE_HERRAMIENTA}. No escribas nada fuera de la herramienta.`,
  ].join('\n');
}

export function construirHerramienta(tiraEnUso: ParametroTira[] = tira) {
  return {
    name: NOMBRE_HERRAMIENTA,
    description:
      'Registra la lectura de la tira de la foto: si se pudo leer, si se ve la tabla de colores y el nivel de cada casilla. Úsala siempre, también cuando la foto no se pueda leer.',
    input_schema: {
      type: 'object',
      properties: {
        legible: {
          type: 'boolean',
          description: 'false si no hay tira, está borrosa, hay mala luz o no se puede comparar con la tabla.',
        },
        motivo: {
          type: 'string',
          description: 'Solo si legible es false: una frase corta y simple que diga qué corregir en la foto.',
        },
        tabla_visible: {
          type: 'boolean',
          description: 'true si la tabla de colores impresa se ve en la foto.',
        },
        tira_visible: {
          type: 'boolean',
          description: 'true si se ve una tira reactiva con sus casillas de color (la tabla sola no cuenta).',
        },
        lecturas: {
          type: 'array',
          description: 'Una lectura por cada parámetro de la lista.',
          items: {
            type: 'object',
            properties: {
              clave: { type: 'string', enum: tiraEnUso.map((p) => p.clave) },
              valor: {
                type: ['number', 'null'],
                description: 'Uno de los niveles permitidos para ese parámetro, o null si la casilla no se ve o no existe.',
              },
              confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
            },
            required: ['clave', 'valor', 'confianza'],
          },
        },
      },
      required: ['legible', 'tabla_visible', 'tira_visible', 'lecturas'],
    },
  };
}

export function construirPeticion(
  imagen: Buffer,
  tipoMime: string,
  modelo: string,
  tiraEnUso: ParametroTira[] = tira,
) {
  const forzar = process.env.VISION_FORZAR_HERRAMIENTA === '1';
  return {
    model: modelo,
    max_tokens: MAXIMO_TOKENS,
    system: construirInstrucciones(tiraEnUso),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipoMime, data: imagen.toString('base64') } },
          {
            type: 'text',
            text: `Lee esta tira comparándola con la tabla de colores de la foto y registra la lectura con la herramienta ${NOMBRE_HERRAMIENTA}.`,
          },
        ],
      },
    ],
    tools: [construirHerramienta(tiraEnUso)],
    tool_choice: forzar ? { type: 'tool', name: NOMBRE_HERRAMIENTA } : { type: 'auto' },
  };
}

// ── Validación de la respuesta ──

const esquemaRespuesta = z.object({
  content: z.array(z.object({ type: z.string() }).passthrough()),
});

const esquemaLectura = z.object({
  legible: z.boolean(),
  motivo: z.string().optional().nullable(),
  tabla_visible: z.boolean(),
  // Opcional para no romper con respuestas que no lo traigan; si llega en false, manda.
  tira_visible: z.boolean().optional().nullable(),
  lecturas: z.array(
    z.object({
      clave: z.string(),
      valor: z.number().finite().nullable(),
      confianza: z.enum(['alta', 'media', 'baja']),
    }),
  ),
});

/**
 * Ajusta un valor al nivel más cercano de la casilla (en un empate, al más alto).
 * Si queda claramente fuera de la tabla, devuelve null, salvo que se pida forzar el ajuste.
 */
export function nivelMasCercano(valor: number, niveles: number[], forzar = false): number | null {
  if (niveles.length === 0 || !Number.isFinite(valor)) return null;
  const ordenados = [...niveles].sort((a, b) => a - b);
  const ultimo = ordenados.length - 1;
  if (!forzar) {
    const margenBajo = ordenados.length > 1 ? (ordenados[1] - ordenados[0]) / 2 : 0;
    const margenAlto = ordenados.length > 1 ? (ordenados[ultimo] - ordenados[ultimo - 1]) / 2 : 0;
    if (valor < ordenados[0] - margenBajo || valor > ordenados[ultimo] + margenAlto) return null;
  }
  let mejor = ordenados[0];
  for (const nivel of ordenados) {
    if (Math.abs(nivel - valor) <= Math.abs(mejor - valor)) mejor = nivel;
  }
  return mejor;
}

/**
 * Acepta el valor solo si es uno de los niveles de la casilla (con un margen para decimales:
 * el 10 % del salto al nivel vecino más cercano). Un valor que no es un nivel suele venir de una
 * tabla de otra marca o de una interpolación: ajustarlo podría cambiar el color del semáforo
 * (por ejemplo, un 40 de otra tabla ajustado a 50 pasa a rojo), así que queda en null.
 */
export function nivelExacto(valor: number, niveles: number[]): number | null {
  const cercano = nivelMasCercano(valor, niveles);
  if (cercano === null) return null;
  const ordenados = [...niveles].sort((a, b) => a - b);
  const i = ordenados.indexOf(cercano);
  const saltos = [ordenados[i] - ordenados[i - 1], ordenados[i + 1] - ordenados[i]].filter(
    (s) => Number.isFinite(s) && s > 0,
  );
  const margen = saltos.length > 0 ? Math.min(...saltos) * 0.1 : 1e-9;
  return Math.abs(valor - cercano) <= margen ? cercano : null;
}

const NIEGA = '(no hay|no veo|no se ve|no se ven|no aparece|no encuentro|sin|falta|ninguna)';
const SIN_TIRA = new RegExp(`${NIEGA}( una| la| ninguna)? tira|solo (se ve |aparece |hay )?(la )?tabla|no es una tira|nada que ver`);
const SIN_TABLA = new RegExp(`${NIEGA}( una| la)? (tabla|carta de colores|referencia)`);

/**
 * Lo que escribe el servicio nunca llega al cliente: se usa solo para elegir uno de los
 * motivos fijos de la app, escritos en lenguaje simple. Se busca primero qué falta (la tira
 * o la tabla) y después cómo salió la foto, porque "solo se ve la tabla" habla de la tira.
 */
function motivoSimple(motivo: string | null | undefined): string {
  const texto = (motivo ?? '').toLowerCase();
  if (SIN_TIRA.test(texto)) return MOTIVO_SIN_TIRA;
  if (SIN_TABLA.test(texto)) return MOTIVO_SIN_TABLA;
  if (/borros|movid|enfo/.test(texto)) return MOTIVO_BORROSA;
  if (/oscur|luz|sombra|reflej|brillo/.test(texto)) return MOTIVO_POCA_LUZ;
  if (/tabla|carta de colores|referencia/.test(texto)) return MOTIVO_SIN_TABLA;
  return MOTIVO_NO_LEGIBLE;
}

/** Convierte la respuesta cruda del servicio en el resultado de la lectura. */
export function interpretarRespuesta(cuerpo: unknown, tiraEnUso: ParametroTira[] = tira): ResultadoLectura {
  const respuesta = esquemaRespuesta.safeParse(cuerpo);
  if (!respuesta.success) return { estado: 'no_legible', motivo: MOTIVO_FALLO };

  const bloque = respuesta.data.content.find((b) => b.type === 'tool_use' && b.name === NOMBRE_HERRAMIENTA);
  if (!bloque) return { estado: 'no_legible', motivo: MOTIVO_FALLO };

  const lectura = esquemaLectura.safeParse(bloque.input);
  if (!lectura.success) return { estado: 'no_legible', motivo: MOTIVO_FALLO };

  const { legible, tabla_visible, tira_visible } = lectura.data;
  const porTexto = motivoSimple(lectura.data.motivo);
  // Sin tira no hay nada que leer, diga lo que diga el resto de la respuesta. Si la causa es
  // la luz o el foco, se dice eso, que es lo que hay que corregir.
  if (tira_visible === false) {
    const foto = porTexto === MOTIVO_POCA_LUZ || porTexto === MOTIVO_BORROSA;
    return { estado: 'no_legible', motivo: foto ? porTexto : MOTIVO_SIN_TIRA };
  }
  if (!legible) return { estado: 'no_legible', motivo: porTexto };
  if (!tabla_visible) return { estado: 'no_legible', motivo: MOTIVO_SIN_TABLA };

  const valores: ValoresMedicion = {};
  let validas = 0;
  for (const parametro of tiraEnUso) {
    // Las claves que no están en la tira configurada se ignoran.
    const leidas = lectura.data.lecturas.filter((l) => l.clave === parametro.clave);
    let valor: number | null = null;
    // Una casilla leída dos veces con valores distintos es una contradicción: queda sin lectura.
    const distintas = new Set(leidas.map((l) => l.valor));
    const leida = distintas.size === 1 ? leidas[0] : undefined;
    if (leida && leida.valor !== null && !leidas.some((l) => l.confianza === 'baja')) {
      valor = nivelExacto(leida.valor, parametro.niveles);
    }
    valores[parametro.clave] = valor;
    if (valor !== null) validas += 1;
  }

  if (validas < Math.min(MINIMO_LECTURAS, tiraEnUso.length)) {
    return { estado: 'no_legible', motivo: MOTIVO_POCAS_CASILLAS };
  }
  return { estado: 'ok', valores };
}

// ── Función principal ──

export async function leerTira(
  imagen: Buffer,
  tipoMime: string,
  tiraEnUso: ParametroTira[] = tira,
): Promise<ResultadoLectura> {
  const clave = process.env.VISION_API_KEY;
  if (process.env.LECTOR_SIMULADO === '1' || !clave) {
    return { estado: 'ok', valores: lecturaSimulada(tiraEnUso) };
  }

  const tipo = tipoMime.toLowerCase().split(';')[0].trim();
  if (!TIPOS_ADMITIDOS.includes(tipo)) return { estado: 'no_legible', motivo: MOTIVO_NO_ES_FOTO };

  const url = process.env.VISION_API_URL;
  const modelo = process.env.VISION_MODELO;
  if (!url || !modelo) {
    console.warn('[medicion] Faltan VISION_API_URL o VISION_MODELO: no se puede leer la foto.');
    return { estado: 'no_legible', motivo: MOTIVO_FALLO };
  }

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': clave,
        ...cabecerasExtra(),
        'content-type': 'application/json',
      },
      body: JSON.stringify(construirPeticion(imagen, tipo, modelo, tiraEnUso)),
      signal: control.signal,
    });
    if (!respuesta.ok) {
      console.warn(`[medicion] El servicio de visión respondió ${respuesta.status}.`);
      return { estado: 'no_legible', motivo: MOTIVO_FALLO };
    }
    return interpretarRespuesta(await respuesta.json(), tiraEnUso);
  } catch (error) {
    const causa = control.signal.aborted ? 'tiempo agotado' : error instanceof Error ? error.name : 'error';
    console.warn(`[medicion] No se pudo leer la foto (${causa}).`);
    return { estado: 'no_legible', motivo: MOTIVO_FALLO };
  } finally {
    clearTimeout(reloj);
  }
}
