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
  /** Comercio dueño de la tienda (plataforma). */
  comercio_id?: string;
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
  /** Nombre de la urbanización (lista en urbanizaciones.ts, junto al mapa); null si no se indicó. */
  urbanizacion: string | null;
  /** ¿Hay mascotas en casa? */
  mascotas: boolean;
  /** Respuesta a "¿Cuándo cambiaste el cartucho por última vez?"; null si no hay filtro o no se preguntó. */
  ultimo_cambio: UltimoCambio | null;
  consentimiento_fecha: string;
  /** Filtro registrado (por foto o a mano); null si no hay o aún no se identificó. */
  filtro?: FiltroHogar | null;
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
  urbanizacion?: string | null;
  mascotas?: boolean;
  /** Si viene, el servidor deriva `fecha_ultimo_cambio` (menos de un mes: hoy − 15 días; más de tres meses: hoy − 100; no me acuerdo: null). */
  ultimo_cambio?: UltimoCambio | null;
  consentimiento: true;
}

/** Cuerpo de PATCH /api/hogares/:id. */
export type CambiosHogar = Partial<Omit<EntradaHogar, 'consentimiento'>>;

/** Respuesta cerrada del perfil sobre el último cambio de cartucho. */
export type UltimoCambio = 'menos_de_un_mes' | 'mas_de_tres_meses' | 'no_me_acuerdo';
export const ULTIMOS_CAMBIOS: readonly UltimoCambio[] = ['menos_de_un_mes', 'mas_de_tres_meses', 'no_me_acuerdo'];

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

/** Parámetro (o razón del perfil) que atiende un producto sugerido. */
export interface MotivoAtendido {
  /** Clave de parámetro o razón del perfil: 'sedimentos', 'recambio', 'filtro'… */
  clave: string;
  /** Nombre visible: "Nitrato", "Agua turbia", "Recambio"… */
  nombre: string;
  /** Color del parámetro en esta medición; null en las razones del perfil. */
  nivel: Nivel | null;
}

/** Producto sugerido para una medición, con la frase de "Por qué te lo recomendamos". */
export interface CartuchoSugerido extends Cartucho {
  motivo: string;
  atiende: MotivoAtendido[];
}

export interface Medicion {
  id: string;
  hogar_id: string;
  fecha: string;
  origen: 'foto' | 'manual';
  valores: ValoresMedicion;
  evaluacion: Evaluacion;
  sugeridos: CartuchoSugerido[];
}

/** Lo que devuelve la lectura de la tira (módulo de medición). */
export type LecturaTira =
  | { estado: 'ok'; valores: ValoresMedicion }
  | { estado: 'no_legible'; motivo: string };

/** Respuesta de POST /api/mediciones/foto (200 en ambos casos). */
export type ResultadoFoto =
  | { estado: 'ok'; medicion: Medicion }
  | { estado: 'no_legible'; motivo: string };

// ---------- Filtro del hogar (identificado por foto o cargado a mano) ----------

export type TipoFiltro =
  | 'portafiltro_simple'
  | 'portafiltro_doble'
  | 'portafiltro_triple'
  | 'ultrafiltracion'
  | 'osmosis_inversa'
  | 'desbarrador_tanque'
  | 'suavizador'
  | 'filtro_de_grifo_o_ducha'
  | 'otro';

export const TIPOS_FILTRO: readonly TipoFiltro[] = [
  'portafiltro_simple',
  'portafiltro_doble',
  'portafiltro_triple',
  'ultrafiltracion',
  'osmosis_inversa',
  'desbarrador_tanque',
  'suavizador',
  'filtro_de_grifo_o_ducha',
  'otro',
];

export const NOMBRES_TIPO_FILTRO: Readonly<Record<TipoFiltro, string>> = {
  portafiltro_simple: 'Portafiltro simple',
  portafiltro_doble: 'Portafiltro doble',
  portafiltro_triple: 'Portafiltro triple',
  ultrafiltracion: 'Ultrafiltración',
  osmosis_inversa: 'Ósmosis inversa',
  desbarrador_tanque: 'Filtro de tanque para toda la casa',
  suavizador: 'Suavizador',
  filtro_de_grifo_o_ducha: 'Filtro de grifo o ducha',
  otro: 'Otro filtro',
};

/** Largo x diámetro del cartucho, en pulgadas. */
export type MedidaCartucho = '10x2.5' | '10x4.5' | '20x2.5' | '20x4.5';
export const MEDIDAS_CARTUCHO: readonly MedidaCartucho[] = ['10x2.5', '10x4.5', '20x2.5', '20x4.5'];

export type ConfianzaFiltro = 'alta' | 'media' | 'baja';

export interface FiltroHogar {
  tipo: TipoFiltro;
  /** Texto legible: "Portafiltro triple", "Ósmosis inversa"… */
  tipo_nombre: string;
  etapas: number | null;
  medida: MedidaCartucho | null;
  /** Código del catálogo; null si no se identificó un modelo exacto. */
  modelo_codigo: string | null;
  modelo_nombre: string | null;
  /** Marca y modelo que se leen en la etiqueta de la foto (sin confirmar). */
  marca_visible: string | null;
  modelo_visible: string | null;
  /** Solo si vino de una foto. */
  confianza: ConfianzaFiltro | null;
  origen: 'foto' | 'manual';
  observaciones: string | null;
}

/** Función del cartucho dentro del filtro. */
export type FuncionCartucho = 'sedimentos' | 'carbon' | 'resina' | 'membrana' | 'minerales';

export interface CartuchoDelFiltro extends Cartucho {
  funcion: FuncionCartucho;
  /** Para qué sirve, en palabras simples ("Pensado para…"). */
  para_que: string;
  /** true si atiende algo de lo que midió la tira del hogar. */
  atiende_medicion: boolean;
}

/** GET /api/hogares/:id/filtro y PUT /api/hogares/:id/filtro. */
export interface RespuestaFiltro {
  filtro: FiltroHogar | null;
  cartuchos: CartuchoDelFiltro[];
}

/** POST /api/hogares/:id/filtro/foto (200 en ambos casos). Solo identifica: no guarda en el hogar. */
export type ResultadoFotoFiltro =
  | { estado: 'ok'; filtro: FiltroHogar; cartuchos: CartuchoDelFiltro[] }
  | { estado: 'no_identificado'; motivo: string };

/** Cuerpo de PUT /api/hogares/:id/filtro. Con `origen: 'foto'` confirma lo identificado en la foto. */
export interface EntradaFiltro {
  tipo: TipoFiltro;
  etapas?: number | null;
  medida?: MedidaCartucho | null;
  modelo_codigo?: string | null;
  origen?: 'foto' | 'manual';
  detalle?: {
    marca_visible?: string | null;
    modelo_visible?: string | null;
    confianza?: ConfianzaFiltro | null;
    observaciones?: string | null;
  } | null;
}

/** GET /api/filtros/modelos: equipos del catálogo para el selector manual. */
export interface ModeloFiltro {
  codigo: string;
  nombre: string;
  categoria: string | null;
}

export type TipoPedido = 'sobre' | 'cartucho' | 'servicio';
export type Modalidad = 'retiro' | 'envio';
/** En los pedidos de servicio, 'despachado' se muestra como "Atendido". */
export type EstadoPedido = 'pendiente' | 'despachado';

/** Servicio técnico que se pide con "Contrata a un experto". */
export type ServicioTecnico = 'cambio_cartucho' | 'instalacion_filtro';
export const SERVICIOS_TECNICOS: readonly ServicioTecnico[] = ['cambio_cartucho', 'instalacion_filtro'];

/** Momento del día preferido para el servicio técnico. */
export type MomentoDia = 'manana' | 'tarde';
export const MOMENTOS_DIA: readonly MomentoDia[] = ['manana', 'tarde'];

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
  /** Solo en pedidos de servicio; null en los demás. */
  servicio: ServicioTecnico | null;
  /** AAAA-MM-DD. Solo en pedidos de servicio. */
  fecha_preferida: string | null;
  /** Solo en pedidos de servicio. */
  momento: MomentoDia | null;
  /** Nota opcional del cliente (servicio). */
  nota: string | null;
  /** Solo en respuestas del operador y en los eventos. */
  hogar_nombre?: string;
  /** Solo en respuestas del operador y en los eventos. */
  zona?: string;
  cartucho_nombre?: string | null;
  /** Nombre de la tienda que atiende el pedido. */
  tienda_nombre?: string;
  /** Nombre del comercio dueño de esa tienda. */
  comercio_nombre?: string;
  /** Id del comercio dueño de esa tienda. */
  comercio_id?: string;
}

/**
 * Cuerpo de POST /api/pedidos. El servidor decide `pago`.
 * Con `tipo: 'servicio'` van `servicio` y `fecha_preferida` (obligatorios), `momento` y `nota`; la modalidad es 'envio'.
 */
export interface EntradaPedido {
  hogar_id: string;
  tipo: TipoPedido;
  cartucho_codigo?: string | null;
  cantidad?: number;
  modalidad: Modalidad;
  direccion?: string | null;
  tienda_id: string;
  servicio?: ServicioTecnico | null;
  fecha_preferida?: string | null;
  momento?: MomentoDia | null;
  nota?: string | null;
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

/** Estado de una urbanización en el mapa del operador. */
export type EstadoUrbanizacion = 'rojo' | 'amarillo' | 'verde' | 'sin_medicion' | 'sin_clientes';

/**
 * GET /api/operador/mapa: una entrada por urbanización de la lista, más una "Otras de <zona>"
 * por zona con hogares sin urbanización conocida (`en_tablero: false`, `col`/`fila` en null).
 */
export interface UrbanizacionMapa {
  id: string;
  nombre: string;
  zona: string;
  col: number | null;
  fila: number | null;
  en_tablero: boolean;
  /** Grupo dentro de la zona para el rótulo del mapa (Valencia norte tiene 3); null si no aplica. */
  grupo: string | null;
  /** false = urbanización por confirmar. */
  verificada: boolean;
  /** Ids de las tiendas que quedan en esa urbanización (no la que despacha); vacío si no hay. */
  tiendas: string[];
  /** Centro aproximado de la urbanización para el mapa real; null en las "Otras de <zona>". */
  lat: number | null;
  lng: number | null;
  hogares: number;
  hogares_con_medicion_30_dias: number;
  /** Solo parámetros de salud: cobre, nitrato, nitrito, plomo, cloro_libre. */
  hogares_en_rojo_7_dias: number;
  estado: EstadoUrbanizacion;
  /** 3 o más hogares en rojo en 7 días. */
  alerta: boolean;
  /** Los parámetros que más se repiten en amarillo o rojo. */
  parametros: string[];
  pedidos_pendientes: number;
}

// --- Tiempo real (GET /api/eventos, SSE) ---

export interface DatosMedicionNueva {
  hogar_id: string;
  zona: string;
  semaforo: Nivel;
  /** Comercio al que pertenece el hogar (para repartir el evento solo a ese comercio). */
  comercio_id?: string;
}

export type EventoAgua =
  | { tipo: 'pedido_nuevo'; datos: Pedido }
  | { tipo: 'pedido_despachado'; datos: Pedido }
  | { tipo: 'medicion_nueva'; datos: DatosMedicionNueva };

export type TipoEvento = EventoAgua['tipo'];

export const TIPOS_EVENTO: readonly TipoEvento[] = ['pedido_nuevo', 'pedido_despachado', 'medicion_nueva'];

// --- Plataforma: red de comercios (docs/decisiones/contrato-red.md) ---

export type RolPlataforma = 'comercio' | 'superadmin' | 'tecnico';
export type PlanComercio = 'basico' | 'premium';
export const PLANES_COMERCIO: readonly PlanComercio[] = ['basico', 'premium'];
export type EstadoMembresia = 'periodo_gratis' | 'activa' | 'vencida';

export interface Comercio {
  id: string;
  nombre: string;
  estado_pais: string;
  ciudad: string;
  plan: PlanComercio;
  /** Nulo en la demo: el precio todavía no está fijado. */
  membresia_usd: number | null;
  fecha_alta: string;
  /** AAAA-MM-DD */
  fin_periodo_gratis: string | null;
  activo: boolean;
  es_demostracion: boolean;
}

export interface ComercioEnRed extends Comercio {
  tiendas: number;
  hogares: number;
  mediciones_mes: number;
  pedidos_pendientes: number;
  pedidos_mes: number;
  productos_propios: number;
  estado_membresia: EstadoMembresia;
  /** Solo en periodo gratis; null en los demás estados. */
  dias_gratis_restantes: number | null;
}

export interface ResumenRed {
  comercios: ComercioEnRed[];
  totales: {
    comercios: number;
    estados_cubiertos: number;
    tiendas: number;
    hogares: number;
    mediciones_mes: number;
    pedidos_mes: number;
    pedidos_pendientes: number;
  };
}

/** Cuerpo de POST /api/red/comercios. `meses_gratis` de 0 a 3. */
export interface EntradaComercio {
  nombre: string;
  estado_pais: string;
  ciudad: string;
  plan: PlanComercio;
  meses_gratis: number;
  tienda_nombre: string;
  tienda_direccion?: string | null;
}

/** Respuesta de POST /api/operador/entrar y POST /api/tecnico/entrar. */
export interface EntradaConComercio {
  token: string;
  rol: RolPlataforma;
  comercio: Comercio;
}

/** GET /api/operador/yo */
export interface Yo {
  rol: RolPlataforma;
  comercio: Comercio;
  tiendas: Tienda[];
}

export interface ExistenciaTienda {
  tienda_id: string;
  tienda_nombre: string;
  cantidad: number;
}

/** GET /api/operador/productos: catálogo general + los propios del comercio. */
export interface ProductoComercio extends Cartucho {
  propio: boolean;
  existencias: ExistenciaTienda[];
}

/** Cuerpo de POST /api/operador/productos. */
export interface EntradaProducto {
  codigo: string;
  nombre: string;
  categoria: string;
  corrige: string[];
  foto_url?: string | null;
  /** tienda_id → cantidad (solo tiendas del comercio). */
  existencias: Record<string, number>;
}

export interface ReporteServicio {
  fecha_visita: string;
  nota: string | null;
  tiene_foto: boolean;
}

/** En el contrato se llama `ServicioTecnico` (ese nombre ya es la unión de arriba): un pedido de servicio con su reporte. */
export interface ServicioConReporte extends Pedido {
  reporte: ReporteServicio | null;
  /** Solo en GET /api/tecnico/servicios: número de parada en la ruta de su tienda (null si el hogar no tiene ubicación). */
  orden_ruta?: number | null;
  /** Solo en GET /api/tecnico/servicios: centro de la urbanización de esa parada (para "Cómo llegar"). */
  destino_ruta?: { lat: number; lng: number } | null;
}

export type FiltroServicios = 'pendiente' | 'atendido' | 'todos';

// --- Rutas de despacho (GET /api/operador/rutas) ---
// Distancias APROXIMADAS: línea recta (haversine) por un factor de calle de 1,3, en km con un decimal.

export interface PedidoEnParada {
  id: number;
  tipo: 'sobre' | 'cartucho' | 'servicio';
  hogar_nombre: string;
  /** Qué se lleva: "Sobre de prueba", el nombre del cartucho o el servicio técnico. */
  detalle: string;
}

export interface ParadaRuta {
  /** 1, 2, 3… en el orden de la ruta. */
  orden: number;
  urbanizacion: string;
  lat: number;
  lng: number;
  pedidos: PedidoEnParada[];
  distancia_desde_anterior_km: number;
}

export interface RutaTienda {
  tienda_id: string;
  tienda_nombre: string;
  /** Ubicación de la tienda; null si la tienda no tiene coordenada (comercios aliados). */
  origen: { lat: number; lng: number } | null;
  paradas: ParadaRuta[];
  entregas: number;
  /** Ida y vuelta: tienda → paradas en orden → tienda. */
  distancia_ruta_km: number;
  /** Ida y vuelta tienda ↔ hogar por cada pedido. */
  distancia_viajes_sueltos_km: number;
  ahorro_km: number;
  ahorro_porcentaje: number;
  /** Pedidos que no entran a la ruta porque el hogar no tiene urbanización conocida. */
  sin_ubicacion: number;
  /** Por qué la ruta viene vacía (tienda sin coordenada), si aplica. */
  motivo?: string;
}

export interface RutasDespacho {
  rutas: RutaTienda[];
  totales: {
    entregas: number;
    paradas: number;
    distancia_ruta_km: number;
    distancia_viajes_sueltos_km: number;
    ahorro_km: number;
    ahorro_porcentaje: number;
  };
}

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
