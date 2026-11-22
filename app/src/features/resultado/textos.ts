// Textos y utilidades compartidas de resultado y pedido.
// Los textos marcados LITERAL vienen de docs/legal/textos.md y no se reescriben.
import type { ClaveParametro, Nivel } from '../../lib/tipos';

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

/** Resumen en una frase según el peor nivel. Nunca dice que el agua está bien para tomar. */
export const RESUMEN_NIVEL: Record<Nivel, { titulo: string; frase: string }> = {
  verde: {
    titulo: 'Lo que midió la tira está en rango',
    frase: 'Todos los parámetros medidos están en rango.',
  },
  amarillo: {
    titulo: 'Hay casillas para vigilar',
    frase: 'Una o más casillas salieron cerca del límite. Abajo te decimos cuáles.',
  },
  rojo: {
    titulo: 'Hay casillas que atender',
    frase: 'Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué hacer.',
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

/** Enlace para cotizar un producto por WhatsApp con su nombre y código. Sin número, lleva a /tiendas. */
export function enlaceCotizar(nombre: string, codigo?: string | null): { interno: boolean; destino: string } {
  if (!WHATSAPP_TIENDA) return { interno: true, destino: '/tiendas' };
  const producto = codigo ? `${nombre} (código ${codigo})` : nombre;
  const texto = encodeURIComponent(`Hola, quiero cotizar: ${producto}`);
  return { interno: false, destino: `https://wa.me/${WHATSAPP_TIENDA}?text=${texto}` };
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
