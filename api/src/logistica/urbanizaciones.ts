// Urbanizaciones del mapa de hexágonos del operador (pestaña Zonas) y del campo "Urbanización" del perfil.
//
// ESTE ES EL ARCHIVO FUENTE: para corregir un nombre, una posición o agregar una urbanización, edita aquí
// y copia el archivo tal cual en app/src/features/operador/urbanizaciones.ts (las dos copias se mantienen
// iguales; una prueba lo verifica).
//
// Lista y posiciones por validar con el equipo de Grimuca. Base: docs/negocio/urbanizaciones-verificadas.md
// (OpenStreetMap, 2026-11-21). `verificada: false` = nombre sin fuente fiable, por confirmar con vecinos;
// en el mapa se ve igual, el dato queda para corregir después.
//
// Rejilla hexagonal con punta arriba: `col` crece hacia el este (derecha) y `fila` hacia el sur (abajo);
// las filas impares van desplazadas medio hexágono a la derecha. La posición es aproximada (sale de la
// latitud y longitud del documento). Naguanagua arriba (norte), Valencia norte abajo en 3 grupos
// (oeste, centro, Trigal al este) y San Diego a la derecha (este), con espacio entre zonas y grupos.

export interface Urbanizacion {
  /** kebab-case sin acentos; no cambiarlo una vez en uso. */
  id: string;
  nombre: string;
  zona: 'Naguanagua' | 'San Diego' | 'Valencia norte';
  /** Grupo dentro de la zona, solo para el rótulo del mapa (Valencia norte se dibuja en 3 grupos). */
  grupo?: string;
  col: number;
  fila: number;
  /** false = por confirmar (sin fuente fiable). */
  verificada: boolean;
  /** Id de la tienda que queda en esa urbanización, si hay una. */
  tienda?: string;
}

const N = 'Naguanagua' as const;
const S = 'San Diego' as const;
const V = 'Valencia norte' as const;
const TRIGAL = 'Trigal y este';
const CENTRO = 'Guaparo, Prebo y Camoruco';
const OESTE = 'Oeste y Guataparo';

export const URBANIZACIONES: readonly Urbanizacion[] = [
  // --- Naguanagua (filas 0 a 5) ---
  { id: 'carialinda', nombre: 'Carialinda', zona: N, col: 2, fila: 0, verificada: true },
  { id: 'colinas-de-girardot', nombre: 'Colinas de Girardot', zona: N, col: 3, fila: 0, verificada: true },
  { id: 'terrazas-de-paramacay', nombre: 'Terrazas de Paramacay', zona: N, col: 4, fila: 0, verificada: false },
  { id: 'la-entrada', nombre: 'La Entrada', zona: N, col: 3, fila: 1, verificada: false },
  { id: 'barbula', nombre: 'Bárbula', zona: N, col: 4, fila: 1, verificada: true },
  { id: 'gonzalez-plaza', nombre: 'González Plaza', zona: N, col: 6, fila: 1, verificada: true },
  { id: 'el-retobo', nombre: 'El Retobo', zona: N, col: 2, fila: 2, verificada: false },
  { id: 'el-naranjal', nombre: 'El Naranjal', zona: N, col: 3, fila: 2, verificada: true },
  { id: 'la-campina', nombre: 'La Campiña', zona: N, col: 4, fila: 2, verificada: true },
  { id: 'el-guayabal', nombre: 'El Guayabal', zona: N, col: 5, fila: 2, verificada: true },
  { id: 'la-begona', nombre: 'La Begoña', zona: N, col: 2, fila: 3, verificada: true },
  // Grafía a confirmar: OSM y Wikipedia escriben "Caprenco".
  { id: 'capremco', nombre: 'Capremco', zona: N, col: 3, fila: 3, verificada: true },
  { id: 'los-guayabitos', nombre: 'Los Guayabitos', zona: N, col: 4, fila: 3, verificada: true },
  { id: 'tazajal', nombre: 'Tazajal', zona: N, col: 5, fila: 3, verificada: true },
  { id: 'el-rincon', nombre: 'El Rincón', zona: N, col: 6, fila: 3, verificada: true },
  { id: 'la-granja', nombre: 'La Granja', zona: N, col: 4, fila: 4, verificada: true },
  { id: 'las-quintas', nombre: 'Las Quintas', zona: N, col: 5, fila: 4, verificada: true },
  { id: 'palma-real', nombre: 'Palma Real', zona: N, col: 6, fila: 4, verificada: true },
  { id: 'ciudad-jardin-manongo', nombre: 'Ciudad Jardín Mañongo', zona: N, col: 7, fila: 4, verificada: true },
  { id: 'manongo', nombre: 'Mañongo', zona: N, col: 7, fila: 5, verificada: true, tienda: 'manongo' },

  // --- Valencia norte, grupo oeste y Guataparo (columnas 0 y 1, filas 7 a 11) ---
  { id: 'prebo-iii', nombre: 'Prebo III', zona: V, grupo: OESTE, col: 1, fila: 7, verificada: true },
  { id: 'el-parral', nombre: 'El Parral', zona: V, grupo: OESTE, col: 0, fila: 8, verificada: true },
  { id: 'sabana-larga', nombre: 'Sabana Larga', zona: V, grupo: OESTE, col: 1, fila: 8, verificada: true },
  { id: 'valle-de-camoruco', nombre: 'Valle de Camoruco', zona: V, grupo: OESTE, col: 0, fila: 9, verificada: true },
  { id: 'los-mangos', nombre: 'Los Mangos', zona: V, grupo: OESTE, col: 1, fila: 9, verificada: true },
  { id: 'el-bosque', nombre: 'El Bosque', zona: V, grupo: OESTE, col: 1, fila: 10, verificada: true },
  { id: 'altos-de-guataparo', nombre: 'Altos de Guataparo', zona: V, grupo: OESTE, col: 0, fila: 11, verificada: true },

  // --- Valencia norte, grupo Guaparo, Prebo y Camoruco (columnas 3 a 5) ---
  { id: 'guaparo', nombre: 'Guaparo', zona: V, grupo: CENTRO, col: 3, fila: 7, verificada: true },
  { id: 'el-recreo', nombre: 'El Recreo', zona: V, grupo: CENTRO, col: 4, fila: 7, verificada: true },
  { id: 'la-alegria', nombre: 'La Alegría', zona: V, grupo: CENTRO, col: 3, fila: 8, verificada: true },
  { id: 'majay', nombre: 'Majay', zona: V, grupo: CENTRO, col: 4, fila: 8, verificada: true },
  { id: 'la-vina', nombre: 'La Viña', zona: V, grupo: CENTRO, col: 3, fila: 9, verificada: true },
  { id: 'el-vinedo', nombre: 'El Viñedo', zona: V, grupo: CENTRO, col: 4, fila: 9, verificada: true },
  { id: 'la-ceiba', nombre: 'La Ceiba', zona: V, grupo: CENTRO, col: 5, fila: 9, verificada: true },
  { id: 'prebo-ii', nombre: 'Prebo II', zona: V, grupo: CENTRO, col: 3, fila: 10, verificada: true },
  { id: 'prebo-i', nombre: 'Prebo I', zona: V, grupo: CENTRO, col: 4, fila: 10, verificada: true },
  { id: 'camoruco', nombre: 'Camoruco', zona: V, grupo: CENTRO, col: 5, fila: 10, verificada: true },
  { id: 'agua-blanca', nombre: 'Agua Blanca', zona: V, grupo: CENTRO, col: 3, fila: 11, verificada: true },
  { id: 'los-nisperos', nombre: 'Los Nísperos', zona: V, grupo: CENTRO, col: 4, fila: 11, verificada: true },
  { id: 'los-colorados', nombre: 'Los Colorados', zona: V, grupo: CENTRO, col: 5, fila: 11, verificada: true },

  // --- Valencia norte, grupo Trigal y este (columnas 7 y 8) ---
  { id: 'las-clavellinas', nombre: 'Las Clavellinas', zona: V, grupo: TRIGAL, col: 7, fila: 7, verificada: true },
  { id: 'trigal-norte', nombre: 'Trigal Norte', zona: V, grupo: TRIGAL, col: 8, fila: 7, verificada: true },
  // Sin polígono propio en OSM; existe en el uso local.
  { id: 'trigal-centro', nombre: 'Trigal Centro', zona: V, grupo: TRIGAL, col: 8, fila: 8, verificada: false },
  { id: 'las-acacias', nombre: 'Las Acacias', zona: V, grupo: TRIGAL, col: 7, fila: 9, verificada: true },
  { id: 'trigal-sur', nombre: 'Trigal Sur', zona: V, grupo: TRIGAL, col: 8, fila: 9, verificada: true },
  { id: 'kerdell', nombre: 'Kerdell', zona: V, grupo: TRIGAL, col: 7, fila: 10, verificada: true },
  { id: 'la-trigalena', nombre: 'La Trigaleña', zona: V, grupo: TRIGAL, col: 8, fila: 10, verificada: true },
  { id: 'las-chimeneas', nombre: 'Las Chimeneas', zona: V, grupo: TRIGAL, col: 7, fila: 11, verificada: true },
  { id: 'lomas-del-este', nombre: 'Lomas del Este', zona: V, grupo: TRIGAL, col: 8, fila: 11, verificada: true },

  // --- San Diego (columnas 9 a 14, filas 1 a 8) ---
  { id: 'la-cumaca', nombre: 'La Cumaca', zona: S, col: 14, fila: 1, verificada: true },
  { id: 'lomas-de-la-hacienda', nombre: 'Lomas de la Hacienda', zona: S, col: 9, fila: 2, verificada: true },
  { id: 'el-tulipan', nombre: 'El Tulipán', zona: S, col: 12, fila: 2, verificada: true },
  { id: 'bosqueserino', nombre: 'Bosqueserino', zona: S, col: 11, fila: 3, verificada: true },
  { id: 'el-remanso', nombre: 'El Remanso', zona: S, col: 12, fila: 3, verificada: true },
  { id: 'sabana-del-medio', nombre: 'Sabana del Medio', zona: S, col: 14, fila: 3, verificada: false },
  { id: 'parqueserino', nombre: 'Parqueserino', zona: S, col: 11, fila: 4, verificada: true },
  { id: 'monteserino', nombre: 'Monteserino', zona: S, col: 12, fila: 4, verificada: true },
  { id: 'pueblo-de-san-diego', nombre: 'Pueblo de San Diego', zona: S, col: 13, fila: 4, verificada: true },
  { id: 'las-morochas', nombre: 'Las Morochas', zona: S, col: 14, fila: 4, verificada: true },
  { id: 'yuma', nombre: 'Yuma', zona: S, col: 11, fila: 5, verificada: true },
  { id: 'valle-de-oro', nombre: 'Valle de Oro', zona: S, col: 12, fila: 5, verificada: true },
  { id: 'campo-solo', nombre: 'Campo Solo', zona: S, col: 14, fila: 5, verificada: false },
  { id: 'la-esmeralda', nombre: 'La Esmeralda', zona: S, col: 10, fila: 6, verificada: true },
  { id: 'valle-verde', nombre: 'Valle Verde', zona: S, col: 11, fila: 6, verificada: true },
  { id: 'paso-real', nombre: 'Paso Real', zona: S, col: 13, fila: 6, verificada: false },
  // Tiendas Big Low y CC CEM: zona industrial al sur de El Morro, ubicación aproximada.
  { id: 'el-morro-ii', nombre: 'El Morro II', zona: S, col: 10, fila: 7, verificada: true, tienda: 'cem' },
  { id: 'el-morro-i', nombre: 'El Morro I', zona: S, col: 11, fila: 7, verificada: true, tienda: 'biglow' },
  { id: 'villas-de-san-diego', nombre: 'Villas de San Diego', zona: S, col: 12, fila: 7, verificada: false },
  { id: 'los-magallanes', nombre: 'Los Magallanes', zona: S, col: 10, fila: 8, verificada: true },
  // Los Jarales es más zona comercial que residencial; por confirmar si lleva hexágono propio.
  { id: 'los-jarales', nombre: 'Los Jarales', zona: S, col: 11, fila: 8, verificada: true },
];

/** Minúsculas, sin acentos ni signos: para comparar lo que escribió el cliente con la lista. */
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Busca por nombre (sin importar acentos ni mayúsculas) o por id. */
export function buscarUrbanizacion(texto: string | null | undefined): Urbanizacion | undefined {
  if (!texto) return undefined;
  const clave = normalizarNombre(texto);
  return URBANIZACIONES.find((u) => normalizarNombre(u.nombre) === clave || u.id === texto.trim());
}

/** Urbanizaciones de una zona en orden alfabético (vacío si la zona no tiene lista). */
export function urbanizacionesDeZona(zona: string): Urbanizacion[] {
  return URBANIZACIONES.filter((u) => u.zona === zona).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
