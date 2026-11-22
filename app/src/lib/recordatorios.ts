// Recordatorios de calendario (próxima medición y cambio de cartucho). Código puro: sin red ni DOM.
// La app NO envía mensajes: el recordatorio queda en el calendario de la persona (Google Calendar o .ics).
// Sin datos personales en el evento: solo el título, la fecha y el enlace a la app.
import type { Hogar } from './tipos';

export interface EventoRecordatorio {
  titulo: string;
  descripcion: string;
  /** Día del evento (día completo), AAAA-MM-DD. */
  fecha: string;
  /** Enlace a la app. */
  url: string;
}

export const NOMBRE_ARCHIVO_ICS = 'recordatorio-grimuca-agua.ics';
export const TEXTO_PRUDENCIA_RECORDATORIO =
  'Te lo recordamos en tu calendario y por WhatsApp (en la demo, el WhatsApp es simulado).';

export const URL_MEDIR = 'https://agua.oydo.app/medir';
export const URL_TUTORIALES = 'https://agua.oydo.app/tutoriales';
export const TITULO_MEDICION = 'Medir el agua de mi casa (Grimuca Agua)';
export const TITULO_CAMBIO = 'Cambiar el cartucho de mi filtro (Grimuca Agua)';
export const DIAS_ENTRE_MEDICIONES = 90;

// ---------- Fechas (AAAA-MM-DD, sin husos horarios) ----------

const RE_DIA = /^(\d{4})-(\d{2})-(\d{2})/;
const dos = (n: number) => String(n).padStart(2, '0');

function aUtc(fecha: string): number | null {
  const partes = RE_DIA.exec(fecha);
  if (!partes) return null;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const ms = Date.UTC(anio, mes - 1, dia);
  const control = new Date(ms);
  if (control.getUTCMonth() !== mes - 1 || control.getUTCDate() !== dia) return null;
  return ms;
}

function deUtc(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
}

/** true si es un día real con formato AAAA-MM-DD. */
export function esDiaValido(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && aUtc(fecha) !== null;
}

/** Fecha local de hoy como AAAA-MM-DD. */
export function hoyLocal(ahora: Date = new Date()): string {
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

/** Suma (o resta) días a un AAAA-MM-DD. */
export function sumarDias(fecha: string, dias: number): string {
  const ms = aUtc(fecha);
  if (ms === null) throw new Error(`Fecha inválida: ${fecha}`);
  return deUtc(ms + Math.round(dias) * 86_400_000);
}

/** Lleva una fecha de la API (AAAA-MM-DD o ISO con hora) al día local AAAA-MM-DD. */
export function diaDe(fecha: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return esDiaValido(fecha) ? fecha : null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return RE_DIA.test(fecha) && aUtc(fecha) !== null ? fecha.slice(0, 10) : null;
  return hoyLocal(d);
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** "22 de febrero de 2027". */
export function fechaCorta(fecha: string): string {
  const ms = aUtc(fecha);
  if (ms === null) return fecha;
  const d = new Date(ms);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** "el lunes 22 de febrero de 2027". */
export function fechaEnPalabras(fecha: string): string {
  const ms = aUtc(fecha);
  if (ms === null) return fecha;
  return `el ${DIAS_SEMANA[new Date(ms).getUTCDay()]} ${fechaCorta(fecha)}`;
}

// ---------- Cálculos ----------

/** Próxima medición: última medición + 90 días (sin medición, hoy + 90). Nunca antes de hoy. */
export function fechaProximaMedicion(ultimaMedicion: string | null | undefined, hoy: string = hoyLocal()): string {
  const ultima = ultimaMedicion ? diaDe(ultimaMedicion) : null;
  const calculada = sumarDias(ultima ?? hoy, DIAS_ENTRE_MEDICIONES);
  return calculada < hoy ? hoy : calculada;
}

// Vida útil orientativa: la MISMA tabla que usa la API (api/src/medicion/config/umbrales.ts, `diasParaRecambio`).
// Si cambian allá, cambiar aquí.
const VIDA_UTIL_MESES = {
  sedimentos: 3,
  carbon_granular: 6,
  carbon_bloque: 6,
  membrana_osmosis: 24,
  post_carbon: 12,
} as const;
type TipoCartucho = keyof typeof VIDA_UTIL_MESES;
const CARTUCHOS_POR_ETAPAS: Record<number, TipoCartucho[]> = {
  1: ['carbon_bloque'],
  2: ['sedimentos', 'carbon_bloque'],
  3: ['sedimentos', 'carbon_granular', 'carbon_bloque'],
  4: ['sedimentos', 'carbon_granular', 'carbon_bloque', 'membrana_osmosis'],
  5: ['sedimentos', 'carbon_granular', 'carbon_bloque', 'membrana_osmosis', 'post_carbon'],
};
const ETAPAS_POR_DEFECTO = 2;
const DIAS_POR_MES = 30;

export type PerfilVidaUtil = Partial<Pick<Hogar, 'etapas_filtro' | 'agua_turbia' | 'personas'>>;

/** Días que dura el cartucho que vence primero (3 meses = 90 días con el filtro de 2 etapas por defecto). */
export function vidaUtilDias(perfil: PerfilVidaUtil = {}): number {
  const declaradas =
    typeof perfil.etapas_filtro === 'number' && Number.isFinite(perfil.etapas_filtro) && perfil.etapas_filtro >= 1
      ? perfil.etapas_filtro
      : ETAPAS_POR_DEFECTO;
  const etapas = Math.min(Math.round(declaradas), 5);
  const cartuchos = CARTUCHOS_POR_ETAPAS[etapas] ?? CARTUCHOS_POR_ETAPAS[ETAPAS_POR_DEFECTO];
  const factorPersonas = (perfil.personas ?? 0) >= 5 ? 0.75 : 1;
  const vida = Math.min(
    ...cartuchos.map((tipo) => {
      let dias = VIDA_UTIL_MESES[tipo] * DIAS_POR_MES * factorPersonas;
      if (tipo === 'sedimentos' && perfil.agua_turbia) dias *= 0.5;
      return dias;
    }),
  );
  return Math.round(vida);
}

/**
 * Próximo cambio de cartucho: fecha del último cambio + vida útil. Nunca antes de hoy (si ya venció, toca hoy).
 * `null` si no se sabe cuándo fue el último cambio (hay que registrarlo primero).
 */
export function fechaProximoCambio(
  hogar: (PerfilVidaUtil & { fecha_ultimo_cambio?: string | null }) | null | undefined,
  hoy: string = hoyLocal(),
): string | null {
  const ultimo = hogar?.fecha_ultimo_cambio ? diaDe(hogar.fecha_ultimo_cambio) : null;
  if (!ultimo) return null;
  const calculada = sumarDias(ultimo, vidaUtilDias(hogar ?? {}));
  return calculada < hoy ? hoy : calculada;
}

export function eventoProximaMedicion(ultimaMedicion: string | null | undefined, hoy?: string): EventoRecordatorio {
  return {
    titulo: TITULO_MEDICION,
    descripcion: 'Toca medir otra vez el agua de la casa con la tira. Abre la app y sigue los pasos.',
    fecha: fechaProximaMedicion(ultimaMedicion, hoy),
    url: URL_MEDIR,
  };
}

export function eventoCambioCartucho(
  hogar: (PerfilVidaUtil & { fecha_ultimo_cambio?: string | null }) | null | undefined,
  hoy?: string,
): EventoRecordatorio | null {
  const fecha = fechaProximoCambio(hogar, hoy);
  if (!fecha) return null;
  return {
    titulo: TITULO_CAMBIO,
    descripcion:
      'Según la fecha del último cambio, ya toca cambiar el cartucho del filtro (orientativo). En la app están las guías paso a paso.',
    fecha,
    url: URL_TUTORIALES,
  };
}

// ---------- Google Calendar ----------

const compacta = (fecha: string) => fecha.replace(/-/g, '');

/** Enlace de Google Calendar para un evento de día completo (el fin es el día siguiente, exclusivo). */
export function enlaceGoogleCalendar(evento: EventoRecordatorio): string {
  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.titulo,
    dates: `${compacta(evento.fecha)}/${compacta(sumarDias(evento.fecha, 1))}`,
    details: `${evento.descripcion}\n\n${evento.url}`,
  });
  return `https://calendar.google.com/calendar/render?${parametros.toString()}`;
}

// ---------- .ics (RFC 5545) ----------

function escaparTexto(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Dobla las líneas de más de 75 bytes (UTF-8) con CRLF + espacio, sin partir caracteres. */
function doblar(linea: string): string {
  const partes: string[] = [];
  let actual = '';
  let bytes = 0;
  for (const caracter of linea) {
    const tamano = new TextEncoder().encode(caracter).length;
    const limite = partes.length === 0 ? 75 : 74; // las continuaciones llevan un espacio al inicio
    if (bytes + tamano > limite) {
      partes.push(actual);
      actual = '';
      bytes = 0;
    }
    actual += caracter;
    bytes += tamano;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

function sello(ahora: Date): string {
  return ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Contenido del archivo .ics: evento de día completo con alarma un día antes. */
export function archivoIcs(evento: EventoRecordatorio, ahora: Date = new Date()): string {
  const dtstamp = sello(ahora);
  const tipo = evento.titulo === TITULO_CAMBIO ? 'cambio-cartucho' : evento.titulo === TITULO_MEDICION ? 'medicion' : 'recordatorio';
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grimuca Agua//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${tipo}-${compacta(evento.fecha)}-${dtstamp}@agua.oydo.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${compacta(evento.fecha)}`,
    `DTEND;VALUE=DATE:${compacta(sumarDias(evento.fecha, 1))}`,
    `SUMMARY:${escaparTexto(evento.titulo)}`,
    `DESCRIPTION:${escaparTexto(`${evento.descripcion}\n\n${evento.url}`)}`,
    `URL:${evento.url}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escaparTexto(evento.titulo)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lineas.map(doblar).join('\r\n')}\r\n`;
}

/** URL descargable del .ics (Blob; si el navegador no tiene `createObjectURL`, un data: URI). */
export function urlArchivoIcs(evento: EventoRecordatorio, ahora?: Date): { url: string; liberar: () => void } {
  const contenido = archivoIcs(evento, ahora);
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined') {
      const url = URL.createObjectURL(new Blob([contenido], { type: 'text/calendar;charset=utf-8' }));
      return { url, liberar: () => URL.revokeObjectURL(url) };
    }
  } catch {
    // seguimos con el data: URI
  }
  return { url: `data:text/calendar;charset=utf-8,${encodeURIComponent(contenido)}`, liberar: () => undefined };
}

// ---------- WhatsApp simulado de la tienda (en la demo no se envía nada real) ----------

const saludo = (nombre?: string | null) => (nombre?.trim() ? `Hola, ${nombre.trim()}. ` : 'Hola. ');

/** "Hola, Ana. Listo: te escribiremos el lunes 22 de febrero de 2027 para recordarte tu próxima medición." */
export function mensajeRecordatorioMedicion(nombre: string | null | undefined, fecha: string): string {
  return `${saludo(nombre)}Listo: te escribiremos ${fechaEnPalabras(fecha)} para recordarte tu próxima medición.`;
}

/** "Hola, Ana. Listo: te escribiremos el … para recordarte el cambio de cartucho." */
export function mensajeRecordatorioCambio(nombre: string | null | undefined, fecha: string): string {
  return `${saludo(nombre)}Listo: te escribiremos ${fechaEnPalabras(fecha)} para recordarte el cambio de cartucho.`;
}

/** "Registramos el cambio de cartucho del 22 de noviembre de 2026. Te avisamos cuando toque el próximo." */
export function mensajeCambioRegistrado(fecha: string): string {
  return `Registramos el cambio de cartucho del ${fechaCorta(fecha)}. Te avisamos cuando toque el próximo.`;
}

const NOMBRES_TIENDA: Readonly<Record<string, string>> = { manongo: 'Mañongo', biglow: 'Big Low', cem: 'CC CEM' };

/** Quién "escribe" el WhatsApp simulado: la tienda del hogar ("Grimuca Mañongo") o "Grimuca Agua". */
export function remitenteTienda(tiendaId: string | null | undefined): string {
  const nombre = tiendaId ? NOMBRES_TIENDA[tiendaId] : undefined;
  return nombre ? `Grimuca ${nombre}` : 'Grimuca Agua';
}
