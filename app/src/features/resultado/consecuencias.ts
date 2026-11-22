// Contenido de "Tu conclusión", "Si no haces nada", "Qué hacer hoy" y la frase corta de cada casilla.
// Funciones puras: se arman con la evaluación de la medición y el perfil del hogar. Sin llamadas externas.
//
// Reglas (docs/legal/puede-y-no-puede-decir.md y docs/legal/consecuencias.md):
// - Información general con fuente, nunca un diagnóstico ni un efecto atado a la persona ("te vas a enfermar").
// - Nunca "potable", "segura" ni "apta" como afirmación. "Apta" solo en "no certifica que el agua sea apta".
// - Plomo y cobre: siempre "posible presencia"; se confirma con un laboratorio.
// - Ningún producto "elimina", "purifica" ni "protege": eso lo dice el bloque "Por qué te lo recomendamos" del servidor.
//
// Fuentes (todas consultadas el 22 nov 2026):
// [OMS-plomo]  OMS, nota descriptiva "Intoxicación por plomo y salud": https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health
// [EPA-plomo]  EPA, "Basic Information about Lead in Drinking Water": https://www.epa.gov/ground-water-and-drinking-water/basic-information-about-lead-drinking-water
// [EPA-NPDWR]  EPA, estándares primarios (cobre, plomo, nitrato, nitrito): https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations
// [EPA-hervir] EPA, preguntas frecuentes sobre nitratos, "Will boiling my water help?": https://www.epa.gov/faqs/search/topics/about-nitrates-341144/topics/asbestos-and-school-buildings-315213
// [EPA-sec]    EPA, estándares secundarios (pH, hierro, cobre): https://www.epa.gov/sdwa/secondary-drinking-water-standards-guidance-nuisance-chemicals
// [OMS-cobre]  OMS, ficha química del cobre (valor guía 2 mg/L por efectos gastrointestinales): https://www.who.int/docs/default-source/wash-documents/wash-chemicals/copper-chemical-fact-sheet.pdf
// [OMS-nitr]   OMS, ficha química de nitrato y nitrito (protege a los bebés alimentados con tetero): https://www.who.int/docs/default-source/wash-documents/wash-chemicals/nitrate-nitrite-chemical-fact-sheet.pdf
// [AUS-dureza] Guías australianas de agua de consumo (NHMRC), dureza: https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/hardness-as-calcium-carbonate
// [AUS-cloro]  Guías australianas (NHMRC), cloro: https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/chlorine
// [AUS-cobre]  Guías australianas (NHMRC), cobre (agua ácida en tuberías de cobre): https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/copper
// [agua.md]    docs/negocio/agua.md (cortes, filtros por etapa y frases aprobadas por el Asesor legal).
import type { ClaveParametro, FiltroHogar, Hogar, Nivel, ResultadoParametro, UltimoCambio } from '../../lib/tipos';

/** Lo que se usa del hogar. Todo opcional: la pantalla funciona sin perfil. */
export type PerfilConclusion = Partial<
  Pick<Hogar, 'personas' | 'mascotas' | 'origen_agua' | 'tiene_filtro' | 'etapas_filtro' | 'ultimo_cambio'>
> & { filtro?: Pick<FiltroHogar, 'tipo' | 'etapas'> | null };

export type ParametroLeido = Pick<ResultadoParametro, 'clave' | 'nombre' | 'nivel' | 'valor'>;

export interface EntradaConclusion {
  porParametro: ParametroLeido[];
  hogar?: PerfilConclusion | null;
  diasParaRecambio?: number | null;
}

/** Línea fija al final de "Si no haces nada". */
export const LINEA_FIJA_CONSECUENCIAS =
  'Esto es información general, no un diagnóstico. Si alguien en casa se siente mal, consulta a un médico.';

/** Parámetros de salud (docs/negocio/agua.md, columna "tipo"). */
export const CLAVES_SALUD: readonly ClaveParametro[] = ['plomo', 'cobre', 'nitrito', 'nitrato', 'cloro_libre'];
/** Metales y nitrógeno: lo que se confirma en laboratorio y lo que hervir no arregla. */
const METALES: readonly ClaveParametro[] = ['plomo', 'cobre'];
const NITROGENO: readonly ClaveParametro[] = ['nitrito', 'nitrato'];
/** Lo que un filtro de 1 a 3 etapas (sedimentos y carbón) no está pensado para atender ([agua.md] §6). */
const NO_ATIENDE_FILTRO_BASICO: readonly ClaveParametro[] = ['nitrito', 'nitrato', 'dureza'];
/** Dentro del mismo color, primero lo que más importa para la salud (mismo orden que api/src/rutas/motivos.ts). */
const PRIORIDAD: readonly ClaveParametro[] = [
  'plomo',
  'cobre',
  'nitrito',
  'nitrato',
  'cloro_libre',
  'hierro',
  'dureza',
  'alcalinidad',
  'ph',
];

/** Nombre en minúscula para las oraciones ("plomo, cobre y nitrito"). */
const NOMBRE_EN_FRASE: Record<ClaveParametro, string> = {
  plomo: 'plomo',
  cobre: 'cobre',
  nitrito: 'nitrito',
  nitrato: 'nitrato',
  cloro_libre: 'cloro',
  hierro: 'hierro',
  dureza: 'dureza',
  alcalinidad: 'alcalinidad',
  ph: 'pH',
};

/** "el plomo", "el nitrito"… para "hervir no quita el plomo ni el cobre". */
const CON_ARTICULO: Partial<Record<ClaveParametro, string>> = {
  plomo: 'el plomo',
  cobre: 'el cobre',
  nitrito: 'el nitrito',
  nitrato: 'el nitrato',
};

const esSalud = (clave: ClaveParametro) => CLAVES_SALUD.includes(clave);

/** Gravedad: rojo de salud 4, rojo operativo 3, amarillo de salud 2, amarillo operativo 1; lo demás 0. */
export function gravedad(p: Pick<ParametroLeido, 'clave' | 'nivel'>): number {
  const salud = esSalud(p.clave) ? 1 : 0;
  if (p.nivel === 'rojo') return 3 + salud;
  if (p.nivel === 'amarillo') return 1 + salud;
  return 0;
}

/** Casillas en rojo o amarillo, de la más grave a la menos grave. */
export function ordenarPorGravedad<T extends Pick<ParametroLeido, 'clave' | 'nivel'>>(porParametro: T[]): T[] {
  return porParametro
    .filter((p) => p.nivel === 'rojo' || p.nivel === 'amarillo')
    .sort((a, b) => gravedad(b) - gravedad(a) || PRIORIDAD.indexOf(a.clave) - PRIORIDAD.indexOf(b.clave));
}

/** "a", "a y b", "a, b y c". */
function enumerar(palabras: string[], conector = 'y'): string {
  if (palabras.length <= 1) return palabras.join('');
  return `${palabras.slice(0, -1).join(', ')} ${conector} ${palabras[palabras.length - 1]}`;
}

const nombres = (lista: ParametroLeido[]) => enumerar(lista.map((p) => NOMBRE_EN_FRASE[p.clave]));
const mayuscula = (texto: string) => (texto ? `${texto.charAt(0).toUpperCase()}${texto.slice(1)}` : texto);

/** pH o alcalinidad: ¿salió por debajo o por encima del rango? (cortes de [agua.md] §1). */
function haciaAbajo(p: ParametroLeido): boolean | null {
  if (typeof p.valor !== 'number') return null;
  if (p.clave === 'ph') return p.valor < 6.5;
  if (p.clave === 'alcalinidad') return p.valor < 40;
  return null;
}

// ---------- Frase corta de cada casilla (la fila de "Tu agua, casilla por casilla") ----------

/** Una frase corta por casilla: el hallazgo. El texto largo va dentro de "Qué mide y por qué importa". */
export function fraseCorta(p: ParametroLeido): string {
  if (p.nivel === 'sin_dato') return 'No se pudo leer: repite la foto o cárgala a mano.';
  if (p.nivel === 'verde') {
    // Plomo en verde: frase aprobada ([agua.md] §2, excepción).
    return p.clave === 'plomo' ? 'La tira no marcó presencia de plomo.' : 'Dentro de lo esperado.';
  }
  const rojo = p.nivel === 'rojo';
  switch (p.clave) {
    case 'plomo':
    case 'cobre':
      // Legal: "posible presencia; confirma con un laboratorio".
      return 'Posible presencia. Confírmalo con un laboratorio.';
    case 'nitrato':
      return rojo ? 'Nivel alto. Confírmalo con un laboratorio.' : 'Nivel medio. Repite la prueba.';
    case 'nitrito':
      return rojo ? 'Nivel alto. Confírmalo con un laboratorio.' : 'La tira marca nitritos. Repite la prueba.';
    case 'cloro_libre':
      return rojo ? 'Muy alto. Repite la prueba en unas horas.' : 'Bastante cloro: se nota en el olor y el sabor.';
    case 'dureza':
      return rojo ? 'Muy dura: mucho sarro.' : 'Agua dura: deja sarro.';
    case 'hierro':
      return rojo ? 'Mucho hierro: manchas y sabor a metal.' : 'Trae hierro: mancha y da sabor a metal.';
    case 'ph':
      return haciaAbajo(p) === false ? 'Algo alcalina: puede dejar sarro.' : 'Algo ácida: desgasta las tuberías.';
    case 'alcalinidad':
      return haciaAbajo(p) === false ? 'Alta: ayuda a que se forme sarro.' : 'Baja: agresiva con las tuberías.';
    default:
      return 'Para vigilar.';
  }
}

// ---------- "Si no haces nada" ----------

export interface Consecuencia {
  clave: ClaveParametro;
  nombre: string;
  nivel: Nivel;
  /** La consecuencia general conocida, prudente. */
  texto: string;
  /** Fuente corta que se muestra entre paréntesis; null si no hay una fuente oficial (ver consecuencias.md). */
  fuente: string | null;
  /** Línea extra (plomo y cobre: posible presencia). */
  nota?: string;
}

const NOTA_POSIBLE_PRESENCIA = 'La tira solo marca una posible presencia: por eso el primer paso es confirmarlo.';

function consecuenciaDe(p: ParametroLeido): Omit<Consecuencia, 'clave' | 'nombre' | 'nivel'> {
  switch (p.clave) {
    case 'plomo':
      // [OMS-plomo]: "se almacena en los dientes y los huesos, donde se acumula con el tiempo"; dañino sobre todo
      // para niños pequeños y mujeres en edad fértil. [EPA-plomo]: niños pequeños, bebés y fetos, los más vulnerables.
      return {
        texto:
          'Si hay plomo y se sigue tomando esa agua por meses, se va acumulando en el cuerpo. Los niños pequeños y las embarazadas son los más sensibles.',
        fuente: 'OMS, EPA',
        nota: NOTA_POSIBLE_PRESENCIA,
      };
    case 'cobre':
      // [OMS-cobre]: valor guía de 2 mg/L para evitar efectos gastrointestinales. [EPA-NPDWR]: "Gastrointestinal
      // distress"; fuente: "Corrosion of household plumbing systems".
      return {
        texto: 'En exceso puede causar malestar de estómago. Suele venir de tuberías que se están desgastando.',
        fuente: 'OMS, EPA',
        nota: NOTA_POSIBLE_PRESENCIA,
      };
    case 'nitrito':
    case 'nitrato':
      // [EPA-NPDWR]: bebés menores de seis meses que toman agua por encima del límite pueden enfermar gravemente;
      // fuentes: abonos, pozos sépticos y aguas negras. [OMS-nitr]: el valor guía protege a los bebés de tetero.
      return {
        texto:
          'En niveles altos es un riesgo sobre todo para bebés menores de 6 meses, si se usa para preparar teteros. Suele venir de abonos o de pozos sépticos.',
        fuente: 'OMS, EPA',
      };
    case 'cloro_libre':
      // [AUS-cloro]: umbral de olor de unos 0,6 mg/L; hay quien lo nota desde 0,2 mg/L. Sin afirmar nada de salud.
      return {
        texto:
          'Cambia el sabor y el olor del agua: mucha gente lo nota desde niveles bajos. Si acabas de clorar el tanque, repite la prueba en unas horas.',
        fuente: 'guías de agua de Australia',
      };
    case 'dureza':
      // [AUS-dureza]: sobre 200 mg/L, sarro excesivo en tuberías y conexiones; puede tapar válvulas del calentador.
      return {
        texto: 'El sarro se pega en tuberías, llaves y calentadores, y puede llegar a tapar duchas y válvulas.',
        fuente: 'guías de agua de Australia',
      };
    case 'ph':
      // [EPA-sec]: pH bajo, "bitter metallic taste; corrosion"; pH alto, "slippery feel; soda taste; deposits".
      // [AUS-cobre]: el agua ácida en tuberías de cobre sube mucho el cobre del agua.
      return haciaAbajo(p) === false
        ? { texto: 'Un agua muy alcalina deja depósitos de sarro y puede saber a soda.', fuente: 'EPA' }
        : {
            texto: 'Un agua ácida desgasta las tuberías y puede arrastrar metales de ellas; también da sabor metálico.',
            fuente: 'EPA',
          };
    case 'hierro':
      // [EPA-sec]: "rusty color; sediment; metallic taste; reddish or orange staining".
      return {
        texto: 'Da color de óxido, deja sedimento, mancha de rojo o naranja la ropa y los sanitarios, y da sabor metálico.',
        fuente: 'EPA',
      };
    case 'alcalinidad':
      // Ni la OMS ni la EPA fijan valor ([agua.md] §1): frase operativa, sin fuente entre paréntesis.
      return haciaAbajo(p) === false
        ? { texto: 'Una alcalinidad alta ayuda a que se forme sarro en tuberías y equipos.', fuente: null }
        : { texto: 'Con poca alcalinidad, el agua se vuelve agresiva con las tuberías y la grifería.', fuente: null };
    default:
      return { texto: '', fuente: null };
  }
}

/** Una línea por cada casilla en rojo o amarillo, de la más grave a la menos grave. */
export function siNoHacesNada(porParametro: ParametroLeido[]): Consecuencia[] {
  return ordenarPorGravedad(porParametro).map((p) => ({
    clave: p.clave,
    nombre: p.nombre,
    nivel: p.nivel,
    ...consecuenciaDe(p),
  }));
}

// ---------- Recambio, en minúscula para meterlo dentro de una oración ----------

/** "te toca cambiar el cartucho en 30 días" / "ya te toca cambiar el cartucho" / null si no hay nada que decir. */
export function recambioEnFrase(dias: number | null | undefined, ultimoCambio: UltimoCambio | null | undefined): string | null {
  if (ultimoCambio === 'no_me_acuerdo') return 'como no recuerdas el último cambio, conviene revisar el cartucho';
  if (ultimoCambio === 'mas_de_tres_meses') return 'ya te toca cambiar el cartucho';
  const hayDias = typeof dias === 'number';
  if (ultimoCambio === 'menos_de_un_mes' && !(hayDias && dias <= 0)) return null;
  if (!hayDias) return null;
  if (dias <= 0) return 'ya te toca cambiar el cartucho';
  return `te toca cambiar el cartucho en ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// ---------- "Tu conclusión" ----------

function oracionCasa(hogar: PerfilConclusion | null | undefined): string {
  const personas = typeof hogar?.personas === 'number' && hogar.personas > 0 ? hogar.personas : null;
  const mascotas = hogar?.mascotas === true;
  if (personas && personas > 1) {
    return mascotas
      ? `Son ${personas} en casa y tienen mascotas: ellas también toman de esa agua.`
      : `Son ${personas} en casa: la precaución es para todos.`;
  }
  if (mascotas) {
    return personas === 1
      ? 'Vives con mascotas: ellas también toman de esa agua.'
      : 'Tienen mascotas: ellas también toman de esa agua.';
  }
  return '';
}

function oracionSinLectura(n: number): string {
  if (n <= 0) return '';
  return n === 1
    ? '1 casilla no se pudo leer: repite la foto o cárgala a mano para completar tu resultado.'
    : `${n} casillas no se pudieron leer: repite la foto o cárgalas a mano para completar tu resultado.`;
}

/** Hallazgo operativo de una sola casilla en amarillo, con su efecto ("sarro", "desgasta…"). */
function operativoEnAmarillo(p: ParametroLeido): { hallazgo: string; efecto: string } {
  switch (p.clave) {
    case 'dureza':
      return { hallazgo: 'Tu agua tiene sarro (dureza en Amarillo)', efecto: 'desgasta la grifería y los equipos' };
    case 'hierro':
      return { hallazgo: 'Tu agua trae hierro (hierro en Amarillo)', efecto: 'mancha la ropa y los sanitarios' };
    case 'ph':
      return haciaAbajo(p) === false
        ? { hallazgo: 'Tu agua salió algo alcalina (pH en Amarillo)', efecto: 'puede dejar sarro' }
        : { hallazgo: 'Tu agua salió algo ácida (pH en Amarillo)', efecto: 'desgasta las tuberías' };
    case 'alcalinidad':
    default:
      return haciaAbajo(p) === false
        ? { hallazgo: 'La alcalinidad salió alta (Amarillo)', efecto: 'ayuda a que se forme sarro' }
        : { hallazgo: 'La alcalinidad salió baja (Amarillo)', efecto: 'hace el agua más agresiva con las tuberías' };
  }
}

/** Efecto de una casilla operativa en rojo, como oración completa. */
const OPERATIVO_EN_ROJO: Partial<Record<ClaveParametro, string>> = {
  dureza: 'El sarro desgasta la grifería, el calentador y los equipos de la casa.',
  hierro: 'Mancha la ropa y los sanitarios y da sabor a metal.',
};

/**
 * "Tu conclusión": 2 o 3 oraciones (una más si hay casillas sin lectura). Nunca dice que el agua es apta,
 * segura ni que tiene plomo: solo lo que marcó la tira, lo primero que conviene hacer y a quién toca en casa.
 */
export function armarConclusion({ porParametro, hogar, diasParaRecambio }: EntradaConclusion): string {
  const graves = ordenarPorGravedad(porParametro);
  const rojos = graves.filter((p) => p.nivel === 'rojo');
  const amarillos = graves.filter((p) => p.nivel === 'amarillo');
  const sinLectura = porParametro.filter((p) => p.nivel === 'sin_dato').length;
  const leidas = porParametro.length - sinLectura;
  const recambio = hogar?.tiene_filtro === false ? null : recambioEnFrase(diasParaRecambio, hogar?.ultimo_cambio);
  const partes: string[] = [];

  if (leidas === 0) {
    return 'No pudimos leer las casillas: repite la foto o carga los colores a mano.';
  }

  if (rojos.length > 0) {
    partes.push(`Tu agua necesita atención en ${rojos.length} ${rojos.length === 1 ? 'cosa' : 'cosas'}: ${nombres(rojos)}.`);
    const rojoMetalONitrogeno = rojos.some((p) => METALES.includes(p.clave) || NITROGENO.includes(p.clave));
    const rojoSalud = rojos.some((p) => esSalud(p.clave));
    if (rojoMetalONitrogeno) {
      partes.push('Lo primero es no usarla para tomar ni cocinar mientras la confirmas con un laboratorio.');
    } else if (rojoSalud) {
      partes.push('Lo primero es repetir la prueba: si acabas de clorar el tanque, espera unas horas.');
    } else {
      partes.push(OPERATIVO_EN_ROJO[rojos[0].clave] ?? 'Conviene atenderlo antes de que desgaste las tuberías y los equipos.');
    }
    if (rojoSalud) partes.push(oracionCasa(hogar));
  } else if (amarillos.length > 0) {
    const deSalud = amarillos.filter((p) => esSalud(p.clave));
    if (deSalud.length > 0) {
      const n = amarillos.length;
      partes.push(`No salió nada en rojo, pero hay ${n} ${n === 1 ? 'casilla' : 'casillas'} para vigilar: ${nombres(amarillos)}.`);
      partes.push(
        deSalud.some((p) => METALES.includes(p.clave) || NITROGENO.includes(p.clave))
          ? 'Confírmalo con un laboratorio antes de sacar conclusiones y vuelve a medir.'
          : 'Si acabas de clorar el tanque, repite la prueba en unas horas.',
      );
    } else if (amarillos.length === 1) {
      const { hallazgo, efecto } = operativoEnAmarillo(amarillos[0]);
      partes.push('No salió nada en rojo.');
      partes.push(`${hallazgo}: no es urgente, pero ${efecto}.`);
    } else {
      partes.push(`No salió nada en rojo. Hay ${amarillos.length} casillas para vigilar: ${nombres(amarillos)}.`);
      partes.push('No es urgente, pero con el tiempo desgastan la grifería, las tuberías y los equipos.');
    }
    if (recambio) partes.push(`${mayuscula(recambio)}.`);
  } else {
    partes.push('Lo que midió tu tira está en rango.');
    partes.push(
      'Esto no certifica que el agua sea apta para tomar: la tira no mide bacterias ni todo lo que puede traer el agua.',
    );
    partes.push(recambio ? `Vuelve a medir en 3 meses; ${recambio}.` : 'Vuelve a medir en 3 meses o antes si el agua cambia de olor, color o sabor.');
  }

  partes.push(oracionSinLectura(sinLectura));
  return partes.filter(Boolean).join(' ');
}

// ---------- "Qué hacer hoy" ----------

export type IdPaso =
  | 'proteger'
  | 'repetir_cloro'
  | 'repetir'
  | 'confirmar'
  | 'revisar_filtro'
  | 'preguntar_tienda'
  | 'solucion'
  | 'completar'
  | 'volver_a_medir'
  | 'recambio'
  | 'sin_filtro'
  | 'productos';

export interface PasoHoy {
  id: IdPaso;
  titulo: string;
  detalle: string;
}

export interface EntradaPasos extends EntradaConclusion {
  /** ¿Hay un producto recomendado para mostrar en el paso 3? */
  hayRecomendado: boolean;
}

/** "hervir no quita el plomo ni el cobre, y el nitrito se concentra (EPA)". */
function fraseHervir(marcados: ParametroLeido[]): string {
  const metales = marcados.filter((p) => METALES.includes(p.clave)).map((p) => CON_ARTICULO[p.clave] ?? '');
  const nitrogeno = marcados.filter((p) => NITROGENO.includes(p.clave)).map((p) => CON_ARTICULO[p.clave] ?? '');
  // [EPA-plomo]: "boiling water does not remove lead". [EPA-hervir]: hervir no baja el nitrato; lo empeora,
  // porque se evapora el agua y el nitrato se queda. El cobre: texto aprobado "Hervirla no quita el cobre" (revisión 2).
  const verbo = nitrogeno.length === 1 ? 'se concentra' : 'se concentran';
  if (metales.length > 0 && nitrogeno.length > 0) {
    return `No sirve hervirla: hervir no quita ${enumerar(metales, 'ni')}, y ${enumerar(nitrogeno)} ${verbo} (EPA).`;
  }
  if (metales.length > 0) return `No sirve hervirla: hervir no quita ${enumerar(metales, 'ni')} (EPA).`;
  return `No sirve hervirla: al hervir, ${enumerar(nitrogeno)} ${verbo} (EPA).`;
}

function esOsmosis(hogar: PerfilConclusion | null | undefined): boolean {
  return hogar?.filtro?.tipo === 'osmosis_inversa' || (hogar?.etapas_filtro ?? hogar?.filtro?.etapas ?? 0) >= 5;
}

/** Nota del paso 3 según el filtro que tiene la casa ([agua.md] §6). */
function notaFiltro(hogar: PerfilConclusion | null | undefined, marcados: ParametroLeido[]): string {
  if (hogar?.tiene_filtro !== true) return '';
  const etapas = hogar.etapas_filtro ?? hogar.filtro?.etapas ?? null;
  if (esOsmosis(hogar)) {
    const pesados = marcados.filter((p) => [...METALES, ...NITROGENO, 'dureza'].includes(p.clave));
    return pesados.length > 0
      ? 'Si tu ósmosis ya filtra esa agua y sale así, lo más probable es que toque el recambio de cartuchos o de la membrana.'
      : '';
  }
  const noAtiende = marcados.filter((p) => NO_ATIENDE_FILTRO_BASICO.includes(p.clave));
  if (noAtiende.length === 0 || !etapas || etapas > 3) return '';
  return `Un filtro de ${etapas} ${etapas === 1 ? 'etapa' : 'etapas'} de sedimentos y carbón no está pensado para ${nombres(noAtiende)}.`;
}

const unir = (...partes: string[]) => partes.filter(Boolean).join(' ');

/** Tres pasos numerados según el caso. El paso "solucion" lo completa la pantalla con el primer producto. */
export function pasosQueHacerHoy({ porParametro, hogar, diasParaRecambio, hayRecomendado }: EntradaPasos): PasoHoy[] {
  const marcados = ordenarPorGravedad(porParametro);
  const sinLectura = porParametro.some((p) => p.nivel === 'sin_dato');
  const recambio = hogar?.tiene_filtro === false ? null : recambioEnFrase(diasParaRecambio, hogar?.ultimo_cambio);
  const tieneFiltro = hogar?.tiene_filtro === true;

  if (marcados.length === 0) {
    const primero: PasoHoy = sinLectura
      ? {
          id: 'completar',
          titulo: 'Completa tu resultado',
          detalle: 'Repite la foto o carga a mano las casillas que no se pudieron leer. Después, vuelve a medir en 3 meses.',
        }
      : {
          id: 'volver_a_medir',
          titulo: 'Vuelve a medir en 3 meses',
          detalle: 'O antes, si cambias de fuente, después de lavar el tanque o si el agua cambia de olor, color o sabor.',
        };
    const segundo: PasoHoy =
      hogar?.tiene_filtro === false
        ? {
            id: 'sin_filtro',
            titulo: 'Pregunta por un filtro',
            detalle: 'Pregunta en tu tienda Grimuca qué filtro se ajusta a tu casa y a cuántos son.',
          }
        : {
            id: 'recambio',
            titulo: 'Revisa el recambio de tu filtro',
            detalle: recambio
              ? `${mayuscula(recambio)}.`
              : 'Anota cuándo cambiaste el cartucho por última vez: así sabes cuándo toca el siguiente.',
          };
    return [
      primero,
      segundo,
      { id: 'productos', titulo: 'Mira los productos', detalle: 'Cartuchos, filtros y repuestos de la tienda, con su precio por WhatsApp.' },
    ];
  }

  const rojos = marcados.filter((p) => p.nivel === 'rojo');
  const rojoMetalONitrogeno = rojos.filter((p) => METALES.includes(p.clave) || NITROGENO.includes(p.clave));
  const rojoCloro = rojos.some((p) => p.clave === 'cloro_libre');
  const hayNitrogeno = rojoMetalONitrogeno.some((p) => NITROGENO.includes(p.clave));

  let primero: PasoHoy;
  if (rojoMetalONitrogeno.length > 0) {
    primero = {
      id: 'proteger',
      titulo: 'Protege a tu familia hoy',
      detalle: unir(
        `Usa agua de botellón para tomar, cocinar${hayNitrogeno ? ' y preparar teteros' : ''} mientras confirmas.`,
        hogar?.mascotas === true ? 'Dales esa misma agua a tus mascotas.' : '',
        fraseHervir(rojoMetalONitrogeno),
      ),
    };
  } else if (rojoCloro) {
    primero = {
      id: 'repetir_cloro',
      titulo: 'Repite la prueba',
      detalle:
        'Si acabas de clorar el tanque, espera unas horas y mide otra vez. Si sigue igual, por precaución usa otra agua para tomar mientras lo revisas.',
    };
  } else {
    primero = {
      id: 'repetir',
      titulo: 'Repite la medición',
      detalle: 'Mide otra vez con una tira nueva, con buena luz y leyendo a tiempo, para ver si se repite.',
    };
  }

  const aConfirmar = marcados.filter((p) => METALES.includes(p.clave) || NITROGENO.includes(p.clave));
  let segundo: PasoHoy;
  if (aConfirmar.length > 0) {
    segundo = {
      id: 'confirmar',
      titulo: 'Confírmalo con un laboratorio',
      detalle: `La tira casera orienta, no confirma: un análisis de laboratorio dice cuánto ${aConfirmar.length === 1 ? 'hay' : 'hay de cada uno'}. Pregunta en tu tienda Grimuca por dónde hacerlo.`,
    };
  } else if (tieneFiltro) {
    segundo = {
      id: 'revisar_filtro',
      titulo: 'Revisa tu filtro',
      detalle: recambio
        ? `${mayuscula(recambio)}.`
        : 'Anota cuándo cambiaste el cartucho por última vez: así sabes cuándo toca el siguiente.',
    };
  } else {
    segundo = {
      id: 'preguntar_tienda',
      titulo: 'Pregunta en tu tienda',
      detalle: 'Lleva tu resultado a tu tienda Grimuca o escríbeles por WhatsApp: te dicen qué opción hay para tu casa.',
    };
  }

  const tercero: PasoHoy = {
    id: 'solucion',
    titulo: 'Elige la opción para tu casa',
    detalle: unir(
      notaFiltro(hogar, marcados),
      hayRecomendado
        ? 'Lo que te recomendamos según tu resultado y lo que nos contaste de tu casa:'
        : 'Pregunta en tu tienda Grimuca qué filtro o cartucho se ajusta a lo que salió.',
    ),
  };

  return [primero, segundo, tercero];
}
