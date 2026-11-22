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
// latitud y longitud del documento, que también va en `lat` y `lng` para el mapa real). Naguanagua arriba (norte), Valencia norte abajo en 3 grupos
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
  /** Ids de las tiendas que quedan en esa urbanización, si hay alguna. */
  tiendas?: readonly string[];
  /** Centro aproximado de la urbanización (OpenStreetMap, 3 decimales). */
  lat: number;
  lng: number;
  /** true = sin nodo propio en OSM: posición inferida de sus vecinas, por confirmar. */
  coordenada_aproximada?: boolean;
}

/** Punto en el mapa real (grados decimales). */
export interface Coordenada {
  lat: number;
  lng: number;
}

/**
 * Tiendas de Grimuca en el mapa de Carabobo. Todas aproximadas: Mañongo es la coordenada de la zona
 * (Av. Salvador Feo La Cruz). Big Low y CC CEM quedan en Castillito, San Diego (OpenStreetMap, 2026-11-22):
 * Big Low en el C.C. Big Low Center, diagonal al terminal de pasajeros; CC CEM en el C.C. CEM I, Av. Don Julio
 * Centeno, frente al Big Low. Las tiendas de los comercios aliados (otros estados) no van en este mapa.
 */
export const UBICACION_TIENDAS: Readonly<Record<string, Coordenada & { coordenada_aproximada: true }>> = {
  manongo: { lat: 10.234, lng: -68.0, coordenada_aproximada: true },
  // Aproximada, Castillito.
  biglow: { lat: 10.1926, lng: -67.9654, coordenada_aproximada: true },
  // Aproximada, Castillito.
  cem: { lat: 10.1918, lng: -67.9648, coordenada_aproximada: true },
};

const N = 'Naguanagua' as const;
const S = 'San Diego' as const;
const V = 'Valencia norte' as const;
const TRIGAL = 'Trigal y este';
const CENTRO = 'Guaparo, Prebo y Camoruco';
const OESTE = 'Oeste y Guataparo';

export const URBANIZACIONES: readonly Urbanizacion[] = [
  // --- Naguanagua (filas 0 a 5) ---
  { id: 'carialinda', nombre: 'Carialinda', zona: N, col: 2, fila: 0, verificada: true, lat: 10.302, lng: -68.037 },
  { id: 'colinas-de-girardot', nombre: 'Colinas de Girardot', zona: N, col: 3, fila: 0, verificada: true, lat: 10.293, lng: -68.028 },
  { id: 'terrazas-de-paramacay', nombre: 'Terrazas de Paramacay', zona: N, col: 4, fila: 0, verificada: false, lat: 10.290, lng: -68.035, coordenada_aproximada: true },
  { id: 'la-entrada', nombre: 'La Entrada', zona: N, col: 3, fila: 1, verificada: false, lat: 10.300, lng: -68.022, coordenada_aproximada: true },
  { id: 'barbula', nombre: 'Bárbula', zona: N, col: 4, fila: 1, verificada: true, lat: 10.286, lng: -68.017 },
  { id: 'gonzalez-plaza', nombre: 'González Plaza', zona: N, col: 6, fila: 1, verificada: true, lat: 10.285, lng: -68.001 },
  { id: 'el-retobo', nombre: 'El Retobo', zona: N, col: 2, fila: 2, verificada: false, lat: 10.276, lng: -68.032, coordenada_aproximada: true },
  { id: 'el-naranjal', nombre: 'El Naranjal', zona: N, col: 3, fila: 2, verificada: true, lat: 10.268, lng: -68.027 },
  { id: 'la-campina', nombre: 'La Campiña', zona: N, col: 4, fila: 2, verificada: true, lat: 10.268, lng: -68.018 },
  { id: 'el-guayabal', nombre: 'El Guayabal', zona: N, col: 5, fila: 2, verificada: true, lat: 10.263, lng: -68.008 },
  { id: 'la-begona', nombre: 'La Begoña', zona: N, col: 2, fila: 3, verificada: true, lat: 10.260, lng: -68.022 },
  // Grafía a confirmar: OSM y Wikipedia escriben "Caprenco".
  { id: 'capremco', nombre: 'Capremco', zona: N, col: 3, fila: 3, verificada: true, lat: 10.255, lng: -68.019 },
  { id: 'los-guayabitos', nombre: 'Los Guayabitos', zona: N, col: 4, fila: 3, verificada: true, lat: 10.260, lng: -68.008 },
  { id: 'tazajal', nombre: 'Tazajal', zona: N, col: 5, fila: 3, verificada: true, lat: 10.254, lng: -68.000 },
  { id: 'el-rincon', nombre: 'El Rincón', zona: N, col: 6, fila: 3, verificada: true, lat: 10.249, lng: -67.998 },
  { id: 'la-granja', nombre: 'La Granja', zona: N, col: 4, fila: 4, verificada: true, lat: 10.243, lng: -68.011 },
  { id: 'las-quintas', nombre: 'Las Quintas', zona: N, col: 5, fila: 4, verificada: true, lat: 10.245, lng: -68.007 },
  { id: 'palma-real', nombre: 'Palma Real', zona: N, col: 6, fila: 4, verificada: true, lat: 10.244, lng: -67.997 },
  { id: 'ciudad-jardin-manongo', nombre: 'Ciudad Jardín Mañongo', zona: N, col: 7, fila: 4, verificada: true, lat: 10.239, lng: -67.996 },
  { id: 'manongo', nombre: 'Mañongo', zona: N, col: 7, fila: 5, verificada: true, tiendas: ['manongo'], lat: 10.234, lng: -67.998 },

  // --- Valencia norte, grupo oeste y Guataparo (columnas 0 y 1, filas 7 a 11) ---
  { id: 'prebo-iii', nombre: 'Prebo III', zona: V, grupo: OESTE, col: 1, fila: 7, verificada: true, lat: 10.214, lng: -68.032 },
  { id: 'el-parral', nombre: 'El Parral', zona: V, grupo: OESTE, col: 0, fila: 8, verificada: true, lat: 10.205, lng: -68.033 },
  { id: 'sabana-larga', nombre: 'Sabana Larga', zona: V, grupo: OESTE, col: 1, fila: 8, verificada: true, lat: 10.206, lng: -68.022 },
  { id: 'valle-de-camoruco', nombre: 'Valle de Camoruco', zona: V, grupo: OESTE, col: 0, fila: 9, verificada: true, lat: 10.202, lng: -68.026 },
  { id: 'los-mangos', nombre: 'Los Mangos', zona: V, grupo: OESTE, col: 1, fila: 9, verificada: true, lat: 10.198, lng: -68.023 },
  { id: 'el-bosque', nombre: 'El Bosque', zona: V, grupo: OESTE, col: 1, fila: 10, verificada: true, lat: 10.192, lng: -68.023 },
  { id: 'altos-de-guataparo', nombre: 'Altos de Guataparo', zona: V, grupo: OESTE, col: 0, fila: 11, verificada: true, lat: 10.181, lng: -68.046 },

  // --- Valencia norte, grupo Guaparo, Prebo y Camoruco (columnas 3 a 5) ---
  { id: 'guaparo', nombre: 'Guaparo', zona: V, grupo: CENTRO, col: 3, fila: 7, verificada: true, lat: 10.228, lng: -68.016 },
  { id: 'el-recreo', nombre: 'El Recreo', zona: V, grupo: CENTRO, col: 4, fila: 7, verificada: true, lat: 10.226, lng: -68.009 },
  { id: 'la-alegria', nombre: 'La Alegría', zona: V, grupo: CENTRO, col: 3, fila: 8, verificada: true, lat: 10.222, lng: -68.011 },
  { id: 'majay', nombre: 'Majay', zona: V, grupo: CENTRO, col: 4, fila: 8, verificada: true, lat: 10.221, lng: -68.009 },
  { id: 'la-vina', nombre: 'La Viña', zona: V, grupo: CENTRO, col: 3, fila: 9, verificada: true, lat: 10.216, lng: -68.019 },
  { id: 'el-vinedo', nombre: 'El Viñedo', zona: V, grupo: CENTRO, col: 4, fila: 9, verificada: true, lat: 10.213, lng: -68.013 },
  { id: 'la-ceiba', nombre: 'La Ceiba', zona: V, grupo: CENTRO, col: 5, fila: 9, verificada: true, lat: 10.214, lng: -68.010 },
  { id: 'prebo-ii', nombre: 'Prebo II', zona: V, grupo: CENTRO, col: 3, fila: 10, verificada: true, lat: 10.210, lng: -68.023 },
  { id: 'prebo-i', nombre: 'Prebo I', zona: V, grupo: CENTRO, col: 4, fila: 10, verificada: true, lat: 10.208, lng: -68.015 },
  { id: 'camoruco', nombre: 'Camoruco', zona: V, grupo: CENTRO, col: 5, fila: 10, verificada: true, lat: 10.209, lng: -68.011 },
  { id: 'agua-blanca', nombre: 'Agua Blanca', zona: V, grupo: CENTRO, col: 3, fila: 11, verificada: true, lat: 10.199, lng: -68.015 },
  { id: 'los-nisperos', nombre: 'Los Nísperos', zona: V, grupo: CENTRO, col: 4, fila: 11, verificada: true, lat: 10.195, lng: -68.013 },
  { id: 'los-colorados', nombre: 'Los Colorados', zona: V, grupo: CENTRO, col: 5, fila: 11, verificada: true, lat: 10.192, lng: -68.009 },

  // --- Valencia norte, grupo Trigal y este (columnas 7 y 8) ---
  { id: 'las-clavellinas', nombre: 'Las Clavellinas', zona: V, grupo: TRIGAL, col: 7, fila: 7, verificada: true, lat: 10.225, lng: -68.002 },
  { id: 'trigal-norte', nombre: 'Trigal Norte', zona: V, grupo: TRIGAL, col: 8, fila: 7, verificada: true, lat: 10.228, lng: -67.997 },
  // Sin polígono propio en OSM; existe en el uso local.
  { id: 'trigal-centro', nombre: 'Trigal Centro', zona: V, grupo: TRIGAL, col: 8, fila: 8, verificada: false, lat: 10.217, lng: -67.995, coordenada_aproximada: true },
  { id: 'las-acacias', nombre: 'Las Acacias', zona: V, grupo: TRIGAL, col: 7, fila: 9, verificada: true, lat: 10.205, lng: -68.005 },
  { id: 'trigal-sur', nombre: 'Trigal Sur', zona: V, grupo: TRIGAL, col: 8, fila: 9, verificada: true, lat: 10.213, lng: -67.992 },
  { id: 'kerdell', nombre: 'Kerdell', zona: V, grupo: TRIGAL, col: 7, fila: 10, verificada: true, lat: 10.201, lng: -68.004 },
  { id: 'la-trigalena', nombre: 'La Trigaleña', zona: V, grupo: TRIGAL, col: 8, fila: 10, verificada: true, lat: 10.208, lng: -67.995 },
  { id: 'las-chimeneas', nombre: 'Las Chimeneas', zona: V, grupo: TRIGAL, col: 7, fila: 11, verificada: true, lat: 10.203, lng: -67.998 },
  { id: 'lomas-del-este', nombre: 'Lomas del Este', zona: V, grupo: TRIGAL, col: 8, fila: 11, verificada: true, lat: 10.193, lng: -67.995 },

  // --- San Diego (columnas 9 a 14, filas 1 a 9) ---
  { id: 'la-cumaca', nombre: 'La Cumaca', zona: S, col: 14, fila: 1, verificada: true, lat: 10.286, lng: -67.943 },
  { id: 'lomas-de-la-hacienda', nombre: 'Lomas de la Hacienda', zona: S, col: 9, fila: 2, verificada: true, lat: 10.268, lng: -67.984 },
  { id: 'el-tulipan', nombre: 'El Tulipán', zona: S, col: 12, fila: 2, verificada: true, lat: 10.270, lng: -67.960 },
  { id: 'bosqueserino', nombre: 'Bosqueserino', zona: S, col: 11, fila: 3, verificada: true, lat: 10.260, lng: -67.965 },
  { id: 'el-remanso', nombre: 'El Remanso', zona: S, col: 12, fila: 3, verificada: true, lat: 10.263, lng: -67.961 },
  { id: 'sabana-del-medio', nombre: 'Sabana del Medio', zona: S, col: 14, fila: 3, verificada: false, lat: 10.262, lng: -67.945, coordenada_aproximada: true },
  { id: 'parqueserino', nombre: 'Parqueserino', zona: S, col: 11, fila: 4, verificada: true, lat: 10.256, lng: -67.966 },
  { id: 'monteserino', nombre: 'Monteserino', zona: S, col: 12, fila: 4, verificada: true, lat: 10.255, lng: -67.961 },
  { id: 'pueblo-de-san-diego', nombre: 'Pueblo de San Diego', zona: S, col: 13, fila: 4, verificada: true, lat: 10.256, lng: -67.954 },
  { id: 'las-morochas', nombre: 'Las Morochas', zona: S, col: 14, fila: 4, verificada: true, lat: 10.255, lng: -67.944 },
  { id: 'yuma', nombre: 'Yuma', zona: S, col: 11, fila: 5, verificada: true, lat: 10.236, lng: -67.964, coordenada_aproximada: true },
  { id: 'valle-de-oro', nombre: 'Valle de Oro', zona: S, col: 12, fila: 5, verificada: true, lat: 10.235, lng: -67.959 },
  { id: 'campo-solo', nombre: 'Campo Solo', zona: S, col: 14, fila: 5, verificada: false, lat: 10.245, lng: -67.945, coordenada_aproximada: true },
  { id: 'la-esmeralda', nombre: 'La Esmeralda', zona: S, col: 10, fila: 6, verificada: true, lat: 10.229, lng: -67.971 },
  { id: 'valle-verde', nombre: 'Valle Verde', zona: S, col: 11, fila: 6, verificada: true, lat: 10.228, lng: -67.962 },
  { id: 'paso-real', nombre: 'Paso Real', zona: S, col: 13, fila: 6, verificada: false, lat: 10.232, lng: -67.950, coordenada_aproximada: true },
  { id: 'el-morro-ii', nombre: 'El Morro II', zona: S, col: 10, fila: 7, verificada: true, lat: 10.218, lng: -67.969 },
  { id: 'el-morro-i', nombre: 'El Morro I', zona: S, col: 11, fila: 7, verificada: true, lat: 10.219, lng: -67.961 },
  { id: 'villas-de-san-diego', nombre: 'Villas de San Diego', zona: S, col: 12, fila: 7, verificada: false, lat: 10.222, lng: -67.955, coordenada_aproximada: true },
  { id: 'los-magallanes', nombre: 'Los Magallanes', zona: S, col: 10, fila: 8, verificada: true, lat: 10.212, lng: -67.969 },
  // Los Jarales es más zona comercial que residencial; por confirmar si lleva hexágono propio.
  { id: 'los-jarales', nombre: 'Los Jarales', zona: S, col: 11, fila: 8, verificada: true, lat: 10.210, lng: -67.963, coordenada_aproximada: true },
  // Parque Comercial Industrial Castillito (OpenStreetMap, 2026-11-22), al sur de El Morro, Los Magallanes y
  // Los Jarales. Ahí quedan las tiendas Big Low (C.C. Big Low Center) y CC CEM (C.C. CEM I).
  { id: 'castillito', nombre: 'Castillito', zona: S, col: 10, fila: 9, verificada: true, tiendas: ['biglow', 'cem'], lat: 10.1927, lng: -67.9607 },
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
