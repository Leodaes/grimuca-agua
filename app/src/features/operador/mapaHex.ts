// Geometría y textos del tablero de hexágonos (punta arriba, filas impares desplazadas medio hexágono).
import type { EstadoUrbanizacion, UrbanizacionMapa } from '../../lib/tipos';

/** Radio del hexágono (centro a vértice), en unidades del viewBox. */
export const RADIO = 38;
export const ANCHO_HEX = Math.sqrt(3) * RADIO;
export const PASO_FILA = 1.5 * RADIO;
export const MARGEN_X = 12;
/** Espacio arriba para el rótulo de Naguanagua. */
export const MARGEN_Y = 34;

export function centroHex(col: number, fila: number): { x: number; y: number } {
  return {
    x: MARGEN_X + ANCHO_HEX / 2 + col * ANCHO_HEX + (fila % 2 === 1 ? ANCHO_HEX / 2 : 0),
    y: MARGEN_Y + RADIO + fila * PASO_FILA,
  };
}

/** Puntos del polígono (un poco más chico que la celda para dejar una línea de separación). */
export function puntosHex(x: number, y: number, r = RADIO - 2): string {
  const puntos: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angulo = (Math.PI / 180) * (60 * i - 90);
    puntos.push(`${(x + r * Math.cos(angulo)).toFixed(1)},${(y + r * Math.sin(angulo)).toFixed(1)}`);
  }
  return puntos.join(' ');
}

export function tamanoTablero(celdas: Array<{ col: number; fila: number }>): { ancho: number; alto: number } {
  const maxCol = Math.max(0, ...celdas.map((c) => c.col));
  const maxFila = Math.max(0, ...celdas.map((c) => c.fila));
  return {
    ancho: Math.ceil(MARGEN_X * 2 + (maxCol + 1.5) * ANCHO_HEX),
    alto: Math.ceil(MARGEN_Y + 2 * RADIO + maxFila * PASO_FILA + 8),
  };
}

/** Etiquetas cortas a mano para los nombres largos (2 líneas). */
const ETIQUETAS: Record<string, [string, string]> = {
  'Terrazas de Paramacay': ['Terrazas', 'Paramacay'],
  'Ciudad Jardín Mañongo': ['C. Jardín', 'Mañongo'],
  'Colinas de Girardot': ['Colinas', 'Girardot'],
  'Altos de Guataparo': ['Altos', 'Guataparo'],
  'Valle de Camoruco': ['Valle de', 'Camoruco'],
  'Lomas de la Hacienda': ['Lomas', 'Hacienda'],
  'Pueblo de San Diego': ['Pueblo', 'San Diego'],
  'Villas de San Diego': ['Villas', 'San Diego'],
  'Sabana del Medio': ['Sabana', 'del Medio'],
  'Lomas del Este': ['Lomas', 'del Este'],
};

const MAX_LINEA = 10;

/** Nombre abreviado en 1 o 2 líneas para que quepa dentro del hexágono. */
export function etiquetaCorta(nombre: string): string[] {
  const fija = ETIQUETAS[nombre];
  if (fija) return fija;
  if (nombre.length <= MAX_LINEA) return [nombre];
  const palabras = nombre.split(' ');
  let primera = palabras.shift() ?? '';
  while (palabras.length > 1 && `${primera} ${palabras[0]}`.length <= MAX_LINEA) primera += ` ${palabras.shift()}`;
  let segunda = palabras.join(' ');
  if (segunda.length > MAX_LINEA + 2) segunda = `${segunda.slice(0, MAX_LINEA)}…`;
  return segunda ? [primera, segunda] : [primera];
}

export const NOMBRE_ESTADO: Record<EstadoUrbanizacion, string> = {
  rojo: 'rojo',
  amarillo: 'amarillo',
  verde: 'verde',
  sin_medicion: 'sin medición reciente',
  sin_clientes: 'sin clientes (por captar)',
};

/** Letra que acompaña al color (el estado nunca depende solo del color). */
export const LETRA_ESTADO: Record<EstadoUrbanizacion, string> = {
  rojo: 'R',
  amarillo: 'A',
  verde: 'V',
  sin_medicion: '–',
  sin_clientes: '',
};

/** Tono de azul (0 a 3) según la cantidad de hogares; null si no hay clientes. */
export function tonoClientes(hogares: number): 0 | 1 | 2 | 3 | null {
  if (hogares <= 0) return null;
  if (hogares === 1) return 0;
  if (hogares <= 2) return 1;
  if (hogares <= 4) return 2;
  return 3;
}

export const RANGOS_CLIENTES = ['1 hogar', '2 hogares', '3 a 4 hogares', '5 o más'];

export function etiquetaAccesible(u: UrbanizacionMapa): string {
  const hogares = `${u.hogares} ${u.hogares === 1 ? 'hogar' : 'hogares'}`;
  const partes = [u.nombre, hogares, `estado ${NOMBRE_ESTADO[u.estado]}`];
  if (u.alerta) partes.push('en alerta');
  if (u.tienda) partes.push('aquí queda una tienda');
  return partes.join(', ');
}
