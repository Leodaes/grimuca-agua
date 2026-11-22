// Textos y utilidades compartidas de resultado y pedido.
// Los textos marcados LITERAL vienen de docs/legal/textos.md y no se reescriben.
import type { ClaveParametro, Nivel, ResultadoParametro, UltimoCambio } from '../../lib/tipos';

/** Número público de WhatsApp de las tiendas (solo dígitos, con código de país). Vacío → se enlaza a /tiendas. */
export const WHATSAPP_TIENDA: string = '584144409396';

/** El mismo número, escrito para leerlo en pantalla. */
export const WHATSAPP_TIENDA_VISIBLE = '+58 414-4409396';

/** Palabra visible de cada nivel del semáforo: el color tal cual (Tulio). */
export const PALABRA_NIVEL: Record<Nivel, string> = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
  sin_dato: 'Sin lectura',
};

/** Qué mide cada indicador, en una frase fija (texto de Tulio, con ajuste legal en cobre y plomo). */
export const QUE_MIDE: Record<ClaveParametro, string> = {
  cloro_libre: 'Es lo que se usa para desinfectar el agua. Si hay mucho, cambia el sabor y el olor.',
  ph: 'Dice si el agua está ácida o alcalina. Si se sale del rango, daña las tuberías y cambia el sabor.',
  dureza: 'Es el sarro. Mancha la grifería, tapa la ducha y gasta los equipos.',
  alcalinidad: 'Muestra qué tan estable es el agua. Si está fuera de rango, se forma sarro o corrosión.',
  hierro: 'Es lo que deja el agua amarilla y mancha la ropa y el baño.',
  cobre: 'Vienen de las tuberías viejas. Con esto no se juega.',
  plomo: 'Vienen de las tuberías viejas. Con esto no se juega.',
  nitrato: 'Vienen de la tierra, de abonos o del pozo séptico. Es una señal de alerta de contaminación.',
  nitrito: 'Vienen de la tierra, de abonos o del pozo séptico. Es una señal de alerta de contaminación.',
};

/** Pie del resultado, debajo del aviso fijo. */
export const PIE_ORIENTACION =
  'Esta prueba es una orientación, no un análisis de laboratorio, y no certifica que el agua sea apta para tomar.';

/** Explicación bajo el título de la prueba de bacterias. */
export const BACTERIAS_EXPLICACION = 'El resultado sale en 48 horas.';

/** Recordatorio de recambio del cartucho dentro de la app. */
export function textoRecambio(dias: number): string {
  if (dias <= 0) return 'Ya te toca cambiar el cartucho';
  return `Te toca cambiar el cartucho en ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export const RECAMBIO_YA_TOCA = 'Ya te toca cambiar el cartucho.';
export const RECAMBIO_NO_RECUERDA = 'Como no recuerdas el último cambio, conviene revisarlo.';

/**
 * Aviso de recambio según la respuesta del perfil ("¿Cuándo cambiaste el cartucho por última vez?"):
 * más de tres meses → "Ya te toca…"; no me acuerdo → "Como no recuerdas…"; menos de un mes → sin aviso
 * (salvo que ya hayan pasado los días del cartucho). Sin respuesta, se usan los días calculados.
 */
export function avisoDeRecambio(
  dias: number | null | undefined,
  ultimoCambio: UltimoCambio | null | undefined,
): { texto: string; atencion: boolean } | null {
  const hayDias = typeof dias === 'number';
  if (ultimoCambio === 'no_me_acuerdo') return { texto: RECAMBIO_NO_RECUERDA, atencion: true };
  if (ultimoCambio === 'mas_de_tres_meses') return { texto: RECAMBIO_YA_TOCA, atencion: true };
  if (ultimoCambio === 'menos_de_un_mes') {
    return hayDias && dias <= 0 ? { texto: RECAMBIO_YA_TOCA, atencion: true } : null;
  }
  if (!hayDias) return null;
  return { texto: `${textoRecambio(dias)}.`, atencion: dias <= 0 };
}

/** Resumen en una frase según el peor nivel. Nunca dice que el agua está bien para tomar. */
export const RESUMEN_NIVEL: Record<Nivel, { titulo: string; frase: string }> = {
  verde: {
    titulo: 'Lo que midió la tira está en rango',
    frase: 'Todos los parámetros medidos están en rango.',
  },
  amarillo: {
    titulo: 'Hay casillas para vigilar',
    frase: 'Una o más casillas salieron cerca del límite. Abajo te decimos cuáles y qué opciones hay en la tienda.',
  },
  rojo: {
    titulo: 'Hay casillas que atender',
    frase: 'Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué opciones hay en la tienda.',
  },
  sin_dato: {
    titulo: 'No pudimos leer las casillas',
    frase: 'Repite la medición o anota los colores a mano.',
  },
};

/** LITERAL (legal d). */
export const AVISO_FIJO =
  'Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';

/** LITERAL (legal e). */
export const BACTERIAS_TITULO = 'Reporta tu prueba de bacterias a las 48 horas';
export const BACTERIAS_ANTES =
  'Reporta solo cuando hayan pasado 48 horas completas desde que llenaste el frasco.';
export const BACTERIAS_CAMBIO =
  'El frasco cambió de color. Eso indica posible presencia de bacterias coliformes en la muestra. Es una prueba casera orientativa, no un análisis de laboratorio. Por precaución, hierve el agua antes de tomarla y confirma el resultado con un laboratorio. Si alguien en casa se siente mal, consulta a un médico.';
export const BACTERIAS_SIN_CAMBIO =
  'El frasco no cambió de color. La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua ni significa que sea apta para tomar: es una prueba casera orientativa, depende de cómo se tomó la muestra y no detecta virus, parásitos ni otros contaminantes. Si quieres certeza, pide un análisis de laboratorio.';

/** LITERAL (legal, extras). */
export const SUGERIDO_EJEMPLO = 'Sugerido según tu resultado. Producto y precio de ejemplo.';

export const TEXTO_SIN_COBRO = 'No se cobra nada ahora. La tienda te contactará para confirmar.';

const PALABRAS_CORRIGE: Record<string, string> = {
  alcalinidad: 'alcalinidad',
  dureza: 'dureza (cal)',
  cobre: 'cobre',
  nitrato: 'nitrato',
  cloro_libre: 'cloro',
  plomo: 'plomo',
  ph: 'pH',
  nitrito: 'nitrito',
  hierro: 'hierro',
  sedimentos: 'tierra y sedimentos',
  sabor_olor: 'mal sabor u olor',
  bacterias: 'bacterias',
};

/** Convierte las claves de `corrige` en palabras simples: "cloro, sabor y olor". */
export function traducirCorrige(claves: string[]): string {
  const palabras = claves.map((clave) => PALABRAS_CORRIGE[clave] ?? clave.replace(/_/g, ' '));
  if (palabras.length <= 1) return palabras.join('');
  return `${palabras.slice(0, -1).join(', ')} y ${palabras[palabras.length - 1]}`;
}

/** Línea bajo "Cotizar por WhatsApp" (Marketing, cambio 2). */
export const TEXTO_PRECIO_WHATSAPP = 'El precio te lo confirma la tienda por WhatsApp, sin compromiso.';

/** Enlace de WhatsApp de las tiendas con un mensaje ya escrito. Sin número, lleva a /tiendas. */
export function enlaceWhatsApp(mensaje: string): { interno: boolean; destino: string } {
  if (!WHATSAPP_TIENDA) return { interno: true, destino: '/tiendas' };
  return { interno: false, destino: `https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(mensaje)}` };
}

/** Mensaje corto para cotizar un producto (sin datos del hogar): lo usa el catálogo. */
export function mensajeCotizarSimple(nombre: string, codigo?: string | null): string {
  const producto = codigo ? `${nombre} (código ${codigo})` : nombre;
  return `Hola, quiero cotizar: ${producto}`;
}

/** Enlace para cotizar un producto por WhatsApp con su nombre y código. Sin número, lleva a /tiendas. */
export function enlaceCotizar(nombre: string, codigo?: string | null): { interno: boolean; destino: string } {
  return enlaceWhatsApp(mensajeCotizarSimple(nombre, codigo));
}

// ---------- Mensajes de WhatsApp con datos del hogar (Marketing, cambios 1, 3, 5 y 12) ----------
// El cliente los ve y los puede editar antes de enviarlos. Si falta un dato, esa parte se omite:
// nunca quedan huecos ni "undefined".

/** Lo que se sabe del hogar y de la medición para armar el mensaje. Todo es opcional. */
export interface DatosMensaje {
  nombre?: string | null;
  zona?: string | null;
  /** Fecha de la medición (ISO). */
  fecha?: string | null;
  personas?: number | null;
  /** null o ausente = no se sabe si hay filtro. */
  tieneFiltro?: boolean | null;
  etapas?: number | null;
  /** Nombre visible de la tienda asignada ("Mañongo"). */
  tienda?: string | null;
  ultimoCambio?: UltimoCambio | null;
  /** AAAA-MM-DD */
  fechaUltimoCambio?: string | null;
  porParametro?: ResultadoParametro[] | null;
}

const recortado = (texto: string | null | undefined) => (typeof texto === 'string' ? texto.trim() : '');

/** Une oraciones descartando las vacías. */
function oraciones(...partes: Array<string | null | undefined | false>): string {
  return partes
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim())
    .join(' ');
}

/** "Hola, soy Ana, de Naguanagua." / "Hola, soy Ana." / "Hola." */
function saludo(datos: DatosMensaje): string {
  const nombre = recortado(datos.nombre);
  const zona = recortado(datos.zona);
  return `Hola${nombre ? `, soy ${nombre}` : ''}${zona ? `, de ${zona}` : ''}.`;
}

/** Fecha sin hora ("22 de noviembre de 2026"); vacío si no hay o no es válida. */
function fechaLegible(iso: string | null | undefined): string {
  if (!iso) return '';
  const valor = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso;
  if (Number.isNaN(new Date(valor).getTime())) return '';
  return formatearFecha(valor);
}

/**
 * "Casillas para vigilar o atender: Cloro: Amarillo, Dureza: Rojo." (plomo y cobre con "(orientativo)").
 * Todo en verde: "Todas las casillas medidas salieron en Verde." Sin lecturas: vacío.
 */
export function resumenMedicion(porParametro: ResultadoParametro[] | null | undefined): string {
  const lista = porParametro ?? [];
  const fuera = lista.filter((p) => p.nivel === 'amarillo' || p.nivel === 'rojo');
  if (fuera.length > 0) {
    const casillas = fuera
      .map((p) => `${p.nombre}: ${PALABRA_NIVEL[p.nivel]}${p.clave === 'plomo' || p.clave === 'cobre' ? ' (orientativo)' : ''}`)
      .join(', ');
    return `Casillas para vigilar o atender: ${casillas}.`;
  }
  if (lista.some((p) => p.nivel === 'verde')) return 'Todas las casillas medidas salieron en Verde.';
  return '';
}

/** " y tenemos un filtro de 3 etapas" / " y todavía no tenemos filtro" / "" si no se sabe. */
function colaFiltro(datos: DatosMensaje): string {
  if (datos.tieneFiltro === true) return datos.etapas ? ` y tenemos un filtro de ${datos.etapas} etapas` : ' y tenemos un filtro';
  if (datos.tieneFiltro === false) return ' y todavía no tenemos filtro';
  return '';
}

function oracionPersonas(datos: DatosMensaje, cola: string): string {
  const personas = typeof datos.personas === 'number' && datos.personas > 0 ? datos.personas : null;
  if (personas === 1) return `En casa vive 1 persona${cola}.`;
  if (personas) return `Somos ${personas} en casa${cola}.`;
  if (!cola) return '';
  const sinY = cola.replace(/^ y /, '');
  return `${sinY.charAt(0).toUpperCase()}${sinY.slice(1)}.`;
}

function nombreTienda(tienda: string | null | undefined): string {
  const nombre = recortado(tienda);
  if (!nombre) return 'su tienda más cercana';
  return /^grimuca\b/i.test(nombre) ? nombre : `Grimuca ${nombre}`;
}

/** Cambio 1: mensaje de "Cotizar por WhatsApp" en la tarjeta de producto del resultado. */
export function mensajeCotizar(datos: DatosMensaje, producto: { nombre: string; codigo?: string | null }): string {
  const fecha = fechaLegible(datos.fecha);
  const nombreProducto = producto.codigo ? `${producto.nombre} (código ${producto.codigo})` : producto.nombre;
  return oraciones(
    saludo(datos),
    fecha && `Medí mi agua con el sobre de Grimuca Agua el ${fecha}.`,
    resumenMedicion(datos.porParametro),
    oracionPersonas(datos, colaFiltro(datos)),
    `Quiero cotizar: ${nombreProducto}.`,
    `¿Tienen en ${nombreTienda(datos.tienda)}?`,
  );
}

const TEXTO_ULTIMO_CAMBIO: Record<UltimoCambio, string> = {
  menos_de_un_mes: 'y el último cambio de cartucho fue hace menos de un mes',
  mas_de_tres_meses: 'y el último cambio de cartucho fue hace más de tres meses',
  no_me_acuerdo: 'y no me acuerdo cuándo fue el último cambio de cartucho',
};

/** "Mi medición del 22 de noviembre de 2026: …" (sin fecha: "Mi medición: …"; sin resumen: vacío). */
function oracionMedicion(datos: DatosMensaje): string {
  const resumen = resumenMedicion(datos.porParametro);
  if (!resumen) return '';
  const fecha = fechaLegible(datos.fecha);
  return `Mi medición${fecha ? ` del ${fecha}` : ''}: ${resumen}`;
}

/** Cambio 3: "Cotizar el recambio de mi filtro por WhatsApp". */
export function mensajeRecambio(datos: DatosMensaje): string {
  const filtro = datos.etapas ? `Tengo un filtro de ${datos.etapas} etapas` : 'Tengo un filtro';
  const fechaCambio = fechaLegible(datos.fechaUltimoCambio);
  const cambio = datos.ultimoCambio
    ? TEXTO_ULTIMO_CAMBIO[datos.ultimoCambio]
    : fechaCambio
      ? `y el último cambio de cartucho fue el ${fechaCambio}`
      : TEXTO_ULTIMO_CAMBIO.no_me_acuerdo;
  return oraciones(saludo(datos), `${filtro} ${cambio}.`, oracionMedicion(datos), 'Quiero cotizar el recambio.');
}

/** Cambio 5: "Preguntar por filtros por WhatsApp" (hogar sin filtro). */
export function mensajePreguntarFiltros(datos: DatosMensaje): string {
  return oraciones(
    saludo(datos),
    oracionPersonas(datos, ' y no tenemos filtro'),
    oracionMedicion(datos),
    '¿Qué filtros tienen y cuánto cuestan?',
  );
}

/** Cambio 12: tarjeta de la lámpara UV cuando el frasco cambió de color. */
export function mensajeBacteriasUV(datos: DatosMensaje): string {
  return oraciones(saludo(datos), 'Mi prueba de bacterias cambió de color a las 48 horas.', 'Quiero consultar la lámpara UV.');
}

/** Datos del mensaje a partir del hogar (tolera datos que falten). */
export function datosDelHogar(
  hogar: {
    nombre?: string | null;
    zona?: string | null;
    personas?: number | null;
    tiene_filtro?: boolean | null;
    etapas_filtro?: number | null;
    filtro?: { etapas: number | null } | null;
    ultimo_cambio?: UltimoCambio | null;
    fecha_ultimo_cambio?: string | null;
  } | null,
  extra: Pick<DatosMensaje, 'fecha' | 'porParametro' | 'tienda'> = {},
): DatosMensaje {
  return {
    nombre: hogar?.nombre ?? null,
    zona: hogar?.zona && hogar.zona !== 'Otra' ? hogar.zona : null,
    personas: hogar?.personas ?? null,
    tieneFiltro: hogar ? (hogar.tiene_filtro ?? null) : null,
    etapas: hogar?.etapas_filtro ?? hogar?.filtro?.etapas ?? null,
    ultimoCambio: hogar?.ultimo_cambio ?? null,
    fechaUltimoCambio: hogar?.fecha_ultimo_cambio ?? null,
    ...extra,
  };
}

/** Fecha legible en español: "21 de noviembre de 2026". */
export function formatearFecha(iso: string, conHora = false): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(conHora ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

/** Mensaje legible de un error cualquiera. */
export function mensajeError(error: unknown): string {
  if (error && typeof error === 'object' && 'mensaje' in error) {
    const mensaje = (error as { mensaje?: unknown }).mensaje;
    if (typeof mensaje === 'string' && mensaje) return mensaje;
  }
  return 'Algo falló de nuestro lado. Intenta otra vez en un momento.';
}
