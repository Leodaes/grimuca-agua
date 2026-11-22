// Identifica el filtro del hogar a partir de una foto: tipo, etapas, medida de los cartuchos y, si se ve claro,
// el modelo exacto del catálogo. Nunca adivina: ante la duda devuelve `no_identificado` y la app ofrece la carga a mano.
import { z } from 'zod';
import {
  MEDIDAS_CARTUCHO,
  TIPOS_FILTRO,
  type ConfianzaFiltro,
  type MedidaCartucho,
  type ModeloFiltro,
  type TipoFiltro,
} from '../tipos';
import { llamarVision, TIPOS_ADMITIDOS, visionSimulada, type Herramienta } from './vision';

export const NOMBRE_HERRAMIENTA = 'registrar_filtro';

export const MOTIVO_FALLO = 'No pudimos mirar la foto. Intenta de nuevo o carga tu filtro a mano.';
export const MOTIVO_NO_ES_FILTRO =
  'No vemos un filtro de agua en la foto. Tómale una foto al filtro completo, o cárgalo a mano.';
export const MOTIVO_BORROSA = 'La foto salió borrosa. Tómala otra vez con el teléfono quieto, o carga tu filtro a mano.';
export const MOTIVO_POCA_LUZ = 'La foto salió con poca luz. Tómala con más luz, o carga tu filtro a mano.';
export const MOTIVO_LEJOS = 'El filtro se ve muy lejos o cortado. Acércate para que se vea completo, o cárgalo a mano.';
export const MOTIVO_NO_ES_FOTO = 'Ese archivo no es una foto. Usa JPG o PNG.';

export interface FiltroIdentificado {
  tipo: TipoFiltro;
  etapas: number | null;
  medida: MedidaCartucho | null;
  marca_visible: string | null;
  modelo_visible: string | null;
  /** Solo un código que exista en el catálogo recibido; si no, null. */
  codigo_catalogo: string | null;
  confianza: ConfianzaFiltro;
  observaciones: string | null;
}

export type ResultadoIdentificacion =
  | { estado: 'ok'; filtro: FiltroIdentificado }
  | { estado: 'no_identificado'; motivo: string };

/** Ejemplo fijo del modo simulado (demo y pruebas sin red). */
export const FILTRO_SIMULADO: FiltroIdentificado = {
  tipo: 'portafiltro_triple',
  etapas: 3,
  medida: '10x2.5',
  marca_visible: null,
  modelo_visible: null,
  codigo_catalogo: null,
  confianza: 'media',
  observaciones: 'Se ven tres vasos en línea, de 10 pulgadas y delgados.',
};

// ── Petición ──

export function construirInstrucciones(equipos: ModeloFiltro[]): string {
  const lista = equipos.length
    ? equipos.map((e) => `- ${e.codigo} · ${e.nombre}`).join('\n')
    : '(no hay equipos en el catálogo)';
  return [
    'Miras fotos que toma un cliente de su equipo de tratamiento de agua doméstico (en la cocina, bajo el fregadero, en la entrada de la casa o junto al tanque).',
    'Tu trabajo: decir qué tipo de equipo es, cuántas etapas tiene, la medida de sus cartuchos y, solo si coincide de forma clara, cuál equipo del catálogo es.',
    '',
    'Tipos posibles ("tipo"):',
    '- portafiltro_simple: un solo vaso o contenedor con un cartucho.',
    '- portafiltro_doble: dos vasos en línea.',
    '- portafiltro_triple: tres vasos en línea.',
    '- ultrafiltracion: varios cartuchos (a veces horizontales o en un mueble) y sin tanque de presión.',
    '- osmosis_inversa: varios cartuchos, una carcasa alargada para la membrana y un tanque de presión (metálico o plástico, redondo).',
    '- desbarrador_tanque: tanque alto de fibra de vidrio con válvula arriba, para toda la casa.',
    '- suavizador: tanque alto con válvula y un tanque de salmuera (sal) al lado.',
    '- filtro_de_grifo_o_ducha: un filtro pequeño que va en el grifo, en la ducha o en una jarra.',
    '- otro: es un equipo de agua pero no encaja en ninguno.',
    '',
    'Equipos del catálogo (código · nombre):',
    lista,
    '',
    'Reglas:',
    '1. "es_filtro" es false si en la foto no hay un equipo de tratamiento de agua, si está borrosa, muy oscura o el equipo no se ve. En ese caso escribe en "motivo" una frase corta y simple que diga qué corregir (por ejemplo: "La foto salió oscura.").',
    '2. "etapas": cuenta los vasos o cartuchos que se ven. En ósmosis inversa cuenta también la membrana y los postfiltros visibles. Si no se pueden contar, null.',
    '3. "medida": estímala por proporción. Largo: 10 pulgadas (corto, más o menos como una botella de refresco de 1 litro) o 20 pulgadas (largo, el doble). Diámetro: 2.5 (delgado, "slim") o 4.5 (grueso, "big blue"). Valores: "10x2.5", "10x4.5", "20x2.5", "20x4.5" o null si no se puede estimar.',
    '4. "marca_visible" y "modelo_visible": SOLO lo que se lee en una etiqueta de la foto. Si no se lee, null. No los deduzcas por la forma.',
    '5. "codigo_catalogo": elige SOLO un código de la lista de arriba y solo si el equipo de la foto coincide de forma clara (por la etiqueta o por la forma y el número de etapas). Si dudas, null.',
    '6. "confianza": "alta", "media" o "baja", según qué tan claro se ve.',
    '7. "observaciones": una sola frase simple de lo que se ve (por ejemplo: "Se ven tres vasos transparentes en línea."). No opines sobre el agua ni sobre la salud.',
    '8. No adivines: si dudas entre dos tipos, elige "otro" y baja la confianza.',
    '',
    `Responde siempre llamando una sola vez a la herramienta ${NOMBRE_HERRAMIENTA}. No escribas nada fuera de la herramienta.`,
  ].join('\n');
}

export function construirHerramienta(equipos: ModeloFiltro[]): Herramienta {
  return {
    name: NOMBRE_HERRAMIENTA,
    description:
      'Registra el equipo de agua de la foto: si es un filtro, su tipo, etapas, medida, lo que se lee en la etiqueta y, si coincide de forma clara, el código del catálogo. Úsala siempre, también cuando no se vea un filtro.',
    input_schema: {
      type: 'object',
      properties: {
        es_filtro: { type: 'boolean', description: 'false si no hay un equipo de agua en la foto o no se ve bien.' },
        motivo: { type: ['string', 'null'], description: 'Solo si es_filtro es false: qué corregir en la foto.' },
        tipo: { type: ['string', 'null'], enum: [...TIPOS_FILTRO, null] },
        etapas: { type: ['integer', 'null'], description: 'Vasos o cartuchos visibles.' },
        medida: { type: ['string', 'null'], enum: [...MEDIDAS_CARTUCHO, null] },
        marca_visible: { type: ['string', 'null'] },
        modelo_visible: { type: ['string', 'null'] },
        codigo_catalogo: {
          type: ['string', 'null'],
          enum: [...equipos.map((e) => e.codigo), null],
          description: 'Solo de la lista del catálogo y si coincide de forma clara; si no, null.',
        },
        confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
        observaciones: { type: 'string', description: 'Una frase simple de lo que se ve.' },
      },
      required: ['es_filtro', 'confianza'],
    },
  };
}

// ── Validación ──

const textoONulo = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    const limpio = (v ?? '').trim();
    return limpio ? limpio.slice(0, 80) : null;
  });

const esquemaEntrada = z.object({
  es_filtro: z.boolean(),
  motivo: z.string().nullable().optional(),
  tipo: z.string().nullable().optional(),
  etapas: z.number().nullable().optional(),
  medida: z.string().nullable().optional(),
  marca_visible: textoONulo,
  modelo_visible: textoONulo,
  codigo_catalogo: z.string().nullable().optional(),
  confianza: z.enum(['alta', 'media', 'baja']),
  observaciones: z.string().nullable().optional(),
});

function motivoSimple(motivo: string | null | undefined): string {
  const texto = (motivo ?? '').toLowerCase();
  if (/borros|movid|enfo|nitid/.test(texto)) return MOTIVO_BORROSA;
  if (/oscur|luz|sombra|reflej|brillo/.test(texto)) return MOTIVO_POCA_LUZ;
  if (/lejos|cortad|parcial|incomplet/.test(texto)) return MOTIVO_LEJOS;
  return MOTIVO_NO_ES_FILTRO;
}

/** Lo que escribe el servicio solo llega al cliente si es una frase corta y sin promesas sobre el agua. */
function observacionSegura(texto: string | null | undefined): string | null {
  const limpio = (texto ?? '').trim().replace(/\s+/g, ' ');
  if (!limpio || limpio.length > 200) return null;
  if (/potab|segur|apta|apto|elimin|purific|sano|salud|contamin|bacteri/i.test(limpio)) return null;
  return limpio;
}

/** Convierte la entrada de la herramienta en el resultado. `codigos` son los códigos válidos del catálogo. */
export function interpretarEntrada(entrada: unknown, codigos: ReadonlySet<string>): ResultadoIdentificacion {
  const leida = esquemaEntrada.safeParse(entrada);
  if (!leida.success) return { estado: 'no_identificado', motivo: MOTIVO_FALLO };
  const datos = leida.data;
  if (!datos.es_filtro) return { estado: 'no_identificado', motivo: motivoSimple(datos.motivo) };

  const tipo = (TIPOS_FILTRO as readonly string[]).includes(datos.tipo ?? '') ? (datos.tipo as TipoFiltro) : 'otro';
  const etapas =
    typeof datos.etapas === 'number' && Number.isInteger(datos.etapas) && datos.etapas >= 1 && datos.etapas <= 12
      ? datos.etapas
      : null;
  const medida = (MEDIDAS_CARTUCHO as readonly string[]).includes(datos.medida ?? '')
    ? (datos.medida as MedidaCartucho)
    : null;
  const codigo = datos.codigo_catalogo && codigos.has(datos.codigo_catalogo) ? datos.codigo_catalogo : null;

  return {
    estado: 'ok',
    filtro: {
      tipo,
      etapas,
      medida,
      marca_visible: datos.marca_visible,
      modelo_visible: datos.modelo_visible,
      codigo_catalogo: codigo,
      confianza: datos.confianza,
      observaciones: observacionSegura(datos.observaciones),
    },
  };
}

// ── Función principal ──

/**
 * `catalogo`: equipos que se pueden elegir como modelo exacto (código, nombre y categoría).
 * Nunca lanza: errores, respuestas mal formadas o tiempo agotado → `no_identificado`.
 */
export async function identificarFiltro(
  imagen: Buffer,
  tipoMime: string,
  catalogo: ModeloFiltro[],
): Promise<ResultadoIdentificacion> {
  if (visionSimulada()) return { estado: 'ok', filtro: { ...FILTRO_SIMULADO } };

  const tipo = tipoMime.toLowerCase().split(';')[0].trim();
  if (!TIPOS_ADMITIDOS.includes(tipo)) return { estado: 'no_identificado', motivo: MOTIVO_NO_ES_FOTO };

  const respuesta = await llamarVision({
    instrucciones: construirInstrucciones(catalogo),
    texto: `Mira este equipo de agua y regístralo con la herramienta ${NOMBRE_HERRAMIENTA}.`,
    imagen,
    tipoMime: tipo,
    herramienta: construirHerramienta(catalogo),
  });
  if (respuesta.estado !== 'ok') {
    console.warn(`[filtro] No se pudo identificar el filtro (${respuesta.causa}).`);
    return { estado: 'no_identificado', motivo: MOTIVO_FALLO };
  }
  return interpretarEntrada(respuesta.entrada, new Set(catalogo.map((e) => e.codigo)));
}
