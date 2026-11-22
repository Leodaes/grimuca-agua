// Tipos compartidos entre la API y el front.
// Fuente: docs/decisiones/contrato-api.md. Este archivo existe dos veces y las dos copias deben ser idénticas:
//   api/src/tipos.ts  y  app/src/lib/tipos.ts
// (una prueba de la API compara ambas). Si cambias una, copia el archivo completo a la otra.

export type Nivel = 'verde' | 'amarillo' | 'rojo' | 'sin_dato';

export type ClaveParametro =
  | 'alcalinidad'
  | 'dureza'
  | 'cobre'
  | 'nitrato'
  | 'cloro_libre'
  | 'plomo'
  | 'ph'
  | 'nitrito'
  | 'hierro';

export type OrigenAgua = 'chorro' | 'botellon' | 'filtro' | 'tanque' | 'pozo';

export const NIVELES: readonly Nivel[] = ['verde', 'amarillo', 'rojo', 'sin_dato'];

export const CLAVES_PARAMETRO: readonly ClaveParametro[] = [
  'alcalinidad',
  'dureza',
  'cobre',
  'nitrato',
  'cloro_libre',
  'plomo',
  'ph',
  'nitrito',
  'hierro',
];

export const ORIGENES_AGUA: readonly OrigenAgua[] = ['chorro', 'botellon', 'filtro', 'tanque', 'pozo'];

export const ZONAS: readonly string[] = ['Naguanagua', 'San Diego', 'Valencia norte', 'Valencia sur', 'Otra'];

export const IDS_TIENDA: readonly string[] = ['manongo', 'biglow', 'cem'];

/** Tienda sugerida por zona (supuesto hasta que Grimuca confirme). El resto de las zonas va a `manongo`. */
export const TIENDA_POR_ZONA: Readonly<Record<string, string>> = {
  Naguanagua: 'manongo',
  'San Diego': 'biglow',
  'Valencia norte': 'manongo',
};

export function tiendaSugerida(zona: string): string {
  return TIENDA_POR_ZONA[zona] ?? 'manongo';
}

export interface Tienda {
  id: string;
  nombre: string;
  horario: string;
  direccion: string | null;
}

/** GET /api/config/tira */
export interface ParametroTira {
  clave: ClaveParametro;
  nombre: string;
  unidad: string;
  /** Valores de cada casilla de la tabla de colores. */
  niveles: number[];
  /** Plomo y cobre: true. */
  orientativo: boolean;
}

export interface Hogar {
  id: string;
  nombre: string;
  zona: string;
  origen_agua: OrigenAgua;
  personas: number;
  tiene_filtro: boolean;
  etapas_filtro: number | null;
  /** AAAA-MM-DD */
  fecha_ultimo_cambio: string | null;
  agua_turbia: boolean;
  whatsapp: string;
  direccion: string | null;
  tienda_id: string | null;
  consentimiento_fecha: string;
}

/** Cuerpo de POST /api/hogares. `consentimiento` debe ser `true`. Sin `tienda_id`, el servidor pone la sugerida por zona. */
export interface EntradaHogar {
  nombre: string;
  zona: string;
  origen_agua: OrigenAgua;
  personas: number;
  tiene_filtro: boolean;
  etapas_filtro?: number | null;
  fecha_ultimo_cambio?: string | null;
  agua_turbia: boolean;
  whatsapp: string;
  direccion?: string | null;
  tienda_id?: string | null;
  consentimiento: true;
}

/** Cuerpo de PATCH /api/hogares/:id. */
export type CambiosHogar = Partial<Omit<EntradaHogar, 'consentimiento'>>;

/** Perfil que usa la evaluación del agua. */
export type PerfilHogar = Pick<
  Hogar,
  'origen_agua' | 'tiene_filtro' | 'etapas_filtro' | 'fecha_ultimo_cambio' | 'agua_turbia' | 'personas'
>;

/** null o ausente = casilla que falta. */
export type ValoresMedicion = Partial<Record<ClaveParametro, number | null>>;

export interface ResultadoParametro {
  clave: ClaveParametro;
  nombre: string;
  unidad: string;
  valor: number | null;
  nivel: Nivel;
  frase: string;
  orientativo: boolean;
}

export interface Evaluacion {
  /** El peor nivel entre los parámetros leídos. */
  semaforo: Nivel;
  porParametro: ResultadoParametro[];
  /** Frases simples, solo amarillos y rojos. */
  hallazgos: string[];
  /** Claves que un cartucho debe corregir: claves de parámetro + 'sedimentos' | 'sabor_olor' | 'bacterias'. */
  corrige: string[];
  /** Según la fecha del último cambio y el perfil; null si no hay filtro. */
  diasParaRecambio: number | null;
}

/** `precio_usd` null → la tarjeta dice "Cotizar", nunca un precio inventado. */
export interface Cartucho {
  codigo: string;
  nombre: string;
  marca: string;
  precio_usd: number | null;
  corrige: string[];
  es_ejemplo: boolean;
  foto_url: string | null;
  /** 'cartucho', 'filtro', 'sistema_osmosis_inversa', 'lampara_uv', 'repuesto'… */
  categoria: string | null;
  /** Enlace público del producto en grimuca.com. */
  url_producto: string | null;
  disponible: boolean;
}

export interface Medicion {
  id: string;
  hogar_id: string;
  fecha: string;
  origen: 'foto' | 'manual';
  valores: ValoresMedicion;
  evaluacion: Evaluacion;
  sugeridos: Cartucho[];
}

/** Lo que devuelve la lectura de la tira (módulo de medición). */
export type LecturaTira =
  | { estado: 'ok'; valores: ValoresMedicion }
  | { estado: 'no_legible'; motivo: string };

/** Respuesta de POST /api/mediciones/foto (200 en ambos casos). */
export type ResultadoFoto =
  | { estado: 'ok'; medicion: Medicion }
  | { estado: 'no_legible'; motivo: string };

export type TipoPedido = 'sobre' | 'cartucho';
export type Modalidad = 'retiro' | 'envio';
export type EstadoPedido = 'pendiente' | 'despachado';

export interface Pedido {
  id: number;
  hogar_id: string;
  tipo: TipoPedido;
  cartucho_codigo: string | null;
  cantidad: number;
  modalidad: Modalidad;
  direccion: string | null;
  pago: 'simulado' | 'no_aplica';
  tienda_id: string;
  estado: EstadoPedido;
  fecha: string;
  fecha_despacho: string | null;
  /** Solo en respuestas del operador y en los eventos. */
  hogar_nombre?: string;
  /** Solo en respuestas del operador y en los eventos. */
  zona?: string;
  cartucho_nombre?: string | null;
}

/** Cuerpo de POST /api/pedidos. El servidor decide `pago`. */
export interface EntradaPedido {
  hogar_id: string;
  tipo: TipoPedido;
  cartucho_codigo?: string | null;
  cantidad?: number;
  modalidad: Modalidad;
  direccion?: string | null;
  tienda_id: string;
}

export interface PruebaBacterias {
  id: string;
  hogar_id: string;
  fecha_inicio: string;
  fecha_reporte: string | null;
  resultado: 'cambio' | 'sin_cambio' | 'pendiente';
  /** Equipos de desinfección sugeridos. Vacío salvo que `resultado` sea 'cambio'. */
  sugeridos: Cartucho[];
}

/** Elemento de "Mi lista" (localStorage, clave `agua.lista`). */
export interface ItemLista {
  codigo: string;
  nombre: string;
  cantidad: number;
}

// --- Logística (rutas del operador) ---

export interface ResumenTienda {
  tienda_id: string;
  nombre: string;
  hogares: number;
  pedidos_pendientes: number;
  sobres_pendientes: number;
  recambios_7_dias: number;
  recambios_30_dias: number;
}

/** `faltante` > 0 va en rojo. */
export interface FilaInventario {
  tienda_id: string;
  tienda_nombre: string;
  cartucho_codigo: string;
  cartucho_nombre: string;
  stock: number;
  demanda_30_dias: number;
  faltante: number;
}

/** `alerta` = 3 o más hogares en rojo en 7 días. */
export interface AlertaZona {
  zona: string;
  hogares_en_rojo_7_dias: number;
  alerta: boolean;
  parametros: string[];
}

// --- Tiempo real (GET /api/eventos, SSE) ---

export interface DatosMedicionNueva {
  hogar_id: string;
  zona: string;
  semaforo: Nivel;
}

export type EventoAgua =
  | { tipo: 'pedido_nuevo'; datos: Pedido }
  | { tipo: 'pedido_despachado'; datos: Pedido }
  | { tipo: 'medicion_nueva'; datos: DatosMedicionNueva };

export type TipoEvento = EventoAgua['tipo'];

export const TIPOS_EVENTO: readonly TipoEvento[] = ['pedido_nuevo', 'pedido_despachado', 'medicion_nueva'];

// --- Otros ---

export interface Salud {
  ok: true;
  bd: boolean;
  version: string;
}

export interface CuerpoError {
  error: string;
  detalle?: unknown;
}
