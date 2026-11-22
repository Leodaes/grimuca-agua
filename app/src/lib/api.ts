// Cliente HTTP del front: una función por ruta de la API (docs/decisiones/contrato-api.md).
// Todas devuelven datos tipados y, si algo falla, lanzan `ErrorApi` con un `mensaje` que se puede mostrar tal cual.
import { EVENTO_PERFIL_PERDIDO, MENSAJE_PERFIL_PERDIDO } from './avisosSesion';
import {
  guardarHogarId,
  guardarTokenOperador,
  guardarTokenRed,
  guardarTokenTecnico,
  hogarId as hogarEnSesion,
  tokenOperador,
  tokenRed,
  tokenTecnico,
  vaciarLista,
} from './sesion';
import type {
  CentroCercano,
  CentroPublico,
  DetalleCentro,
  EntradaMedicionCentro,
  MedicionCentro,
  PanelCentro,
} from './tipos';
import type {
  ComercioEnRed,
  EntradaComercio,
  EntradaConComercio,
  EntradaProducto,
  FiltroServicios,
  ProductoComercio,
  ResumenRed,
  RutasDespacho,
  ServicioConReporte,
  Yo,
} from './tipos';
import type {
  AlertaZona,
  CambiosHogar,
  Cartucho,
  EntradaHogar,
  EntradaPedido,
  FilaInventario,
  Hogar,
  Medicion,
  ParametroTira,
  Pedido,
  PruebaBacterias,
  ResultadoFoto,
  ResumenTienda,
  Salud,
  Tienda,
  UrbanizacionMapa,
  ValoresMedicion,
} from './tipos';
import type { EntradaFiltro, ModeloFiltro, RespuestaFiltro, ResultadoFotoFiltro } from './tipos';

export const BASE_API = '/api';

export const MENSAJE_SIN_CONEXION = 'No pudimos conectar. Revisa tu internet e intenta de nuevo.';
export const MENSAJE_GENERICO = 'Algo salió mal. Intenta de nuevo en un momento.';

/** Lo que responde la API (404) cuando el hogar no está en la base: `noEncontrado('El hogar')`. */
export const MENSAJE_HOGAR_INEXISTENTE = 'El hogar no existe.';
export { EVENTO_PERFIL_PERDIDO, MENSAJE_PERFIL_PERDIDO };

export class ErrorApi extends Error {
  /** Texto legible para mostrar a la persona. */
  readonly mensaje: string;
  /** Código HTTP; 0 si no hubo respuesta (sin conexión). */
  readonly estado: number;
  readonly detalle?: unknown;

  constructor(mensaje: string, estado: number, detalle?: unknown) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.mensaje = mensaje;
    this.estado = estado;
    this.detalle = detalle;
  }
}

export type FiltroPedidos = 'pendiente' | 'despachado' | 'todos';
const FILTROS: readonly string[] = ['pendiente', 'despachado', 'todos'];

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  /** Objeto que se envía como JSON. */
  cuerpo?: unknown;
  /** Formulario con archivos (no se envía como JSON). */
  formulario?: FormData;
  /** Token del operador. */
  token?: string | null;
}

/** Id de hogar que lleva la petición: en la ruta (`/hogares/:id…`, `/bacterias/:id`), en `?hogar_id=`, en el cuerpo o en el formulario. */
function hogarDeLaPeticion(ruta: string, opciones: Opciones): string | null {
  const decodificar = (texto: string) => {
    try {
      return decodeURIComponent(texto);
    } catch {
      return texto;
    }
  };
  const enRuta = /^\/(?:hogares|bacterias)\/([^/?#]+)/.exec(ruta);
  if (enRuta) return decodificar(enRuta[1]);
  const enConsulta = /[?&]hogar_id=([^&#]+)/.exec(ruta);
  if (enConsulta) return decodificar(enConsulta[1]);
  const cuerpo = opciones.cuerpo;
  if (typeof cuerpo === 'object' && cuerpo !== null) {
    const valor = (cuerpo as { hogar_id?: unknown }).hogar_id;
    if (typeof valor === 'string') return valor;
  }
  const delFormulario = opciones.formulario?.get('hogar_id');
  return typeof delFormulario === 'string' ? delFormulario : null;
}

/**
 * Si la API dice que el hogar de esta sesión no existe (se reinició la demostración, se borró la base…),
 * lo olvida junto con "Mi lista" y avisa con `EVENTO_PERFIL_PERDIDO`. Devuelve `true` si fue así.
 */
function olvidarSiElHogarYaNoExiste(ruta: string, opciones: Opciones, estado: number, mensaje: string): boolean {
  if (estado !== 404) return false;
  const delHogar = mensaje === MENSAJE_HOGAR_INEXISTENTE || /^\/hogares\/[^/?#]+$/.test(ruta);
  if (!delHogar) return false;
  const enSesion = hogarEnSesion();
  if (!enSesion || hogarDeLaPeticion(ruta, opciones) !== enSesion) return false;
  guardarHogarId(null);
  vaciarLista();
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_PERFIL_PERDIDO));
  } catch {
    // sin window (pruebas fuera del navegador)
  }
  return true;
}

async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  let cuerpo: BodyInit | undefined;
  if (opciones.formulario) {
    cuerpo = opciones.formulario; // el navegador pone el Content-Type con su separador
  } else if (opciones.cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(opciones.cuerpo);
  }
  if (opciones.token) cabeceras.Authorization = `Bearer ${opciones.token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_API}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: cabeceras,
      body: cuerpo,
    });
  } catch {
    throw new ErrorApi(MENSAJE_SIN_CONEXION, 0);
  }

  let dato: unknown = null;
  try {
    const texto = await respuesta.text();
    dato = texto ? JSON.parse(texto) : null;
  } catch {
    dato = null;
  }

  if (!respuesta.ok) {
    const cuerpoError = (dato ?? {}) as { error?: unknown; detalle?: unknown };
    const mensaje =
      typeof cuerpoError.error === 'string' && cuerpoError.error ? cuerpoError.error : MENSAJE_GENERICO;
    if (olvidarSiElHogarYaNoExiste(ruta, opciones, respuesta.status, mensaje)) {
      throw new ErrorApi(MENSAJE_PERFIL_PERDIDO, respuesta.status, cuerpoError.detalle);
    }
    throw new ErrorApi(mensaje, respuesta.status, cuerpoError.detalle);
  }
  return dato as T;
}

/** Rutas del operador: usan el token guardado si no se pasa uno, y lo borran si el servidor lo rechaza. */
async function pedirComoOperador<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const token = opciones.token ?? tokenOperador();
  try {
    return await pedir<T>(ruta, { ...opciones, token });
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) guardarTokenOperador(null);
    throw error;
  }
}

/** Igual que `pedirComoOperador`, con el token de la red (superadmin). */
async function pedirComoRed<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const token = opciones.token ?? tokenRed();
  try {
    return await pedir<T>(ruta, { ...opciones, token });
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) guardarTokenRed(null);
    throw error;
  }
}

/** Igual que `pedirComoOperador`, con el token del técnico. */
async function pedirComoTecnico<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const token = opciones.token ?? tokenTecnico();
  try {
    return await pedir<T>(ruta, { ...opciones, token });
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) guardarTokenTecnico(null);
    throw error;
  }
}

const id = (valor: string | number) => encodeURIComponent(String(valor));

/**
 * URL de la foto del reporte de un servicio (para `<img src>`): lleva el token en la consulta.
 * Sin `token`, usa el del técnico, el del comercio o el de la red, en ese orden.
 */
function urlFotoServicio(pedidoId: number | string, token?: string | null): string {
  const elegido = token ?? tokenTecnico() ?? tokenOperador() ?? tokenRed() ?? '';
  return `${BASE_API}/servicios/${id(pedidoId)}/foto?token=${encodeURIComponent(elegido)}`;
}

function medirManual(hogarId: string, valores: ValoresMedicion): Promise<Medicion>;
function medirManual(datos: { hogar_id: string; valores: ValoresMedicion }): Promise<Medicion>;
function medirManual(
  primero: string | { hogar_id: string; valores: ValoresMedicion },
  valores?: ValoresMedicion,
): Promise<Medicion> {
  const cuerpo = typeof primero === 'string' ? { hogar_id: primero, valores: valores ?? {} } : primero;
  return pedir<Medicion>('/mediciones/manual', { metodo: 'POST', cuerpo });
}

function operadorPedidos(estado?: FiltroPedidos, token?: string): Promise<Pedido[]>;
function operadorPedidos(token: string, estado?: FiltroPedidos): Promise<Pedido[]>;
function operadorPedidos(a?: string, b?: string): Promise<Pedido[]> {
  // Acepta (estado, token) o (token, estado).
  const estado = [a, b].find((valor) => valor !== undefined && FILTROS.includes(valor)) ?? 'pendiente';
  const token = [a, b].find((valor) => valor !== undefined && !FILTROS.includes(valor));
  return pedirComoOperador<Pedido[]>(`/operador/pedidos?estado=${estado}`, { token });
}

export const api = {
  salud: () => pedir<Salud>('/salud'),

  // --- Catálogo y configuración ---
  tiendas: () => pedir<Tienda[]>('/tiendas'),
  /** Con `hogarId`, el catálogo general más los productos del comercio de su tienda; sin él, solo el general. */
  cartuchos: (hogarId?: string | null) =>
    pedir<Cartucho[]>(hogarId ? `/cartuchos?hogar_id=${encodeURIComponent(hogarId)}` : '/cartuchos'),
  configTira: () => pedir<ParametroTira[]>('/config/tira'),

  // --- Hogar ---
  /** `datos.consentimiento` debe ser `true`. No guarda el id: llama a `guardarHogarId(hogar.id)`. */
  crearHogar: (datos: EntradaHogar) => pedir<Hogar>('/hogares', { metodo: 'POST', cuerpo: datos }),
  obtenerHogar: (hogarId: string) => pedir<Hogar>(`/hogares/${id(hogarId)}`),
  actualizarHogar: (hogarId: string, cambios: CambiosHogar) =>
    pedir<Hogar>(`/hogares/${id(hogarId)}`, { metodo: 'PATCH', cuerpo: cambios }),

  // --- Mediciones ---
  /** Sube la foto de la tira. Responde `{ estado: 'ok', medicion }` o `{ estado: 'no_legible', motivo }` (no lanza en ese caso). */
  medirConFoto: (hogarId: string, archivo: Blob) => {
    const formulario = new FormData();
    formulario.append('hogar_id', hogarId);
    const nombre = archivo instanceof File && archivo.name ? archivo.name : 'tira.jpg';
    formulario.append('foto', archivo, nombre);
    return pedir<ResultadoFoto>('/mediciones/foto', { metodo: 'POST', formulario });
  },
  /** `medirManual(hogarId, valores)` o `medirManual({ hogar_id, valores })`. */
  medirManual,
  medicion: (medicionId: string) => pedir<Medicion>(`/mediciones/${id(medicionId)}`),
  /** Más reciente primero. */
  medicionesDeHogar: (hogarId: string) => pedir<Medicion[]>(`/hogares/${id(hogarId)}/mediciones`),

  // --- Filtro del hogar ---
  /** Sube la foto del filtro. Responde `{ estado: 'ok', filtro, cartuchos }` o `{ estado: 'no_identificado', motivo }`. */
  identificarFiltro: (hogarId: string, archivo: Blob) => {
    const formulario = new FormData();
    const nombre = archivo instanceof File && archivo.name ? archivo.name : 'filtro.jpg';
    formulario.append('foto', archivo, nombre);
    return pedir<ResultadoFotoFiltro>(`/hogares/${id(hogarId)}/filtro/foto`, { metodo: 'POST', formulario });
  },
  guardarFiltro: (hogarId: string, datos: EntradaFiltro) =>
    pedir<RespuestaFiltro>(`/hogares/${id(hogarId)}/filtro`, { metodo: 'PUT', cuerpo: datos }),
  filtroDeHogar: (hogarId: string) => pedir<RespuestaFiltro>(`/hogares/${id(hogarId)}/filtro`),
  modelosDeFiltro: () => pedir<ModeloFiltro[]>('/filtros/modelos'),

  // --- Pedidos ---
  crearPedido: (datos: EntradaPedido) => pedir<Pedido>('/pedidos', { metodo: 'POST', cuerpo: datos }),
  pedido: (pedidoId: number | string) => pedir<Pedido>(`/pedidos/${id(pedidoId)}`),
  pedidosDeHogar: (hogarId: string) => pedir<Pedido[]>(`/hogares/${id(hogarId)}/pedidos`),

  // --- Prueba de bacterias ---
  /** Devuelve `null` si el hogar todavía no inició la prueba. */
  bacterias: async (hogarId: string): Promise<PruebaBacterias | null> => {
    try {
      return await pedir<PruebaBacterias>(`/bacterias/${id(hogarId)}`);
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 404) return null;
      throw error;
    }
  },
  /** Inicia la prueba (si ya existía, devuelve la misma). */
  iniciarBacterias: (hogarId: string) =>
    pedir<PruebaBacterias>('/bacterias', { metodo: 'POST', cuerpo: { hogar_id: hogarId } }),
  reportarBacterias: (hogarId: string, resultado: 'cambio' | 'sin_cambio') =>
    pedir<PruebaBacterias>(`/bacterias/${id(hogarId)}`, { metodo: 'PUT', cuerpo: { resultado } }),

  // --- Operador ---
  /** Con PIN malo lanza `ErrorApi` con `estado` 401. No guarda el token: llama a `guardarTokenOperador(token)`. */
  operadorEntrar: (pin: string) =>
    pedir<EntradaConComercio>('/operador/entrar', { metodo: 'POST', cuerpo: { pin } }),
  /** `operadorPedidos(estado = 'pendiente', token = tokenOperador())`. Trae `hogar_nombre`, `zona` y `cartucho_nombre`. */
  operadorPedidos,
  despachar: (pedidoId: number | string, token?: string) =>
    pedirComoOperador<Pedido>(`/operador/pedidos/${id(pedidoId)}/despachar`, { metodo: 'POST', token }),
  resumen: (token?: string) => pedirComoOperador<ResumenTienda[]>('/operador/resumen', { token }),
  inventario: (token?: string) => pedirComoOperador<FilaInventario[]>('/operador/inventario', { token }),
  zonas: (token?: string) => pedirComoOperador<AlertaZona[]>('/operador/zonas', { token }),
  /** Mapa de hexágonos: una entrada por urbanización, más las "Otras de <zona>" (`en_tablero: false`). */
  mapa: (token?: string) => pedirComoOperador<UrbanizacionMapa[]>('/operador/mapa', { token }),
  /** Rutas de despacho: una por tienda del comercio, con las entregas pendientes agrupadas por urbanización. */
  rutas: (token?: string) => pedirComoOperador<RutasDespacho>('/operador/rutas', { token }),

  // --- Plataforma: comercio ---
  /** Respuesta completa de la entrada del comercio (`operadorEntrar` sigue sirviendo y trae los mismos campos). */
  comercioEntrar: (pin: string) =>
    pedir<EntradaConComercio>('/operador/entrar', { metodo: 'POST', cuerpo: { pin } }),
  /** Comercio y tiendas del token del operador. */
  yo: (token?: string) => pedirComoOperador<Yo>('/operador/yo', { token }),
  productosComercio: (token?: string) => pedirComoOperador<ProductoComercio[]>('/operador/productos', { token }),
  crearProducto: (datos: EntradaProducto, token?: string) =>
    pedirComoOperador<ProductoComercio>('/operador/productos', { metodo: 'POST', cuerpo: datos, token }),
  /** Servicios atendidos de las tiendas del comercio, con su reporte. */
  reportes: (token?: string) => pedirComoOperador<ServicioConReporte[]>('/operador/reportes', { token }),

  // --- Plataforma: red (superadmin) ---
  /** No guarda el token: llama a `guardarTokenRed(token)`. */
  redEntrar: (pin: string) =>
    pedir<{ token: string; rol: 'superadmin' }>('/red/entrar', { metodo: 'POST', cuerpo: { pin } }),
  redResumen: (token?: string) => pedirComoRed<ResumenRed>('/red/resumen', { token }),
  crearComercio: (datos: EntradaComercio, token?: string) =>
    pedirComoRed<ComercioEnRed>('/red/comercios', { metodo: 'POST', cuerpo: datos, token }),

  // --- Plataforma: técnico ---
  /** No guarda el token: llama a `guardarTokenTecnico(token)`. */
  tecnicoEntrar: (pin: string) =>
    pedir<EntradaConComercio>('/tecnico/entrar', { metodo: 'POST', cuerpo: { pin } }),
  tecnicoServicios: (estado: FiltroServicios = 'pendiente', token?: string) =>
    pedirComoTecnico<ServicioConReporte[]>(`/tecnico/servicios?estado=${estado}`, { token }),
  /** "Ya fui": foto opcional (jpeg/png/webp, máx. 8 MB) y nota. */
  atenderServicio: (pedidoId: number | string, datos: { foto?: Blob | null; nota?: string | null }, token?: string) => {
    const formulario = new FormData();
    if (datos.nota) formulario.append('nota', datos.nota);
    if (datos.foto) {
      const nombre = datos.foto instanceof File && datos.foto.name ? datos.foto.name : 'servicio.jpg';
      formulario.append('foto', datos.foto, nombre);
    }
    return pedirComoTecnico<ServicioConReporte>(`/tecnico/servicios/${id(pedidoId)}/atender`, {
      metodo: 'POST',
      formulario,
      token,
    });
  },
  urlFotoServicio,

  // --- Centros de llenado con resultados públicos ---
  /**
   * El más cercano primero. Con `hogarId`, desde la urbanización de ese cliente; si no, desde `urbanizacion` y `zona`
   * (sin urbanización: primero los de la zona, con `distancia_km` null).
   */
  centrosCercanos: (consulta: { hogarId?: string | null; zona?: string | null; urbanizacion?: string | null } = {}) => {
    const partes: string[] = [];
    if (consulta.hogarId) partes.push(`hogar_id=${encodeURIComponent(consulta.hogarId)}`);
    if (consulta.zona) partes.push(`zona=${encodeURIComponent(consulta.zona)}`);
    if (consulta.urbanizacion) partes.push(`urbanizacion=${encodeURIComponent(consulta.urbanizacion)}`);
    return pedir<CentroCercano[]>(`/centros${partes.length ? `?${partes.join('&')}` : ''}`);
  },
  /** Página pública del centro: su medición más reciente y todo el historial. */
  centro: (tiendaId: string) => pedir<DetalleCentro>(`/centros/${id(tiendaId)}`),
  /** Técnico de Grimuca: centros a medir (los que no tienen medición vigente primero). */
  tecnicoCentros: (token?: string) => pedirComoTecnico<CentroPublico[]>('/tecnico/centros', { token }),
  /** Técnico de Grimuca: publica una medición del grifo de despacho (al menos una casilla). */
  medirCentro: (tiendaId: string, datos: EntradaMedicionCentro, token?: string) =>
    pedirComoTecnico<MedicionCentro>(`/tecnico/centros/${id(tiendaId)}/mediciones`, { metodo: 'POST', cuerpo: datos, token }),
  /** Técnico de Grimuca: resultado del frasco a las 48 horas (una sola vez; repetir responde 409). */
  frascoCentro: (medicionId: number | string, resultado: 'cambio' | 'sin_cambio', token?: string) =>
    pedirComoTecnico<MedicionCentro>(`/tecnico/centros/mediciones/${id(medicionId)}/bacterias`, {
      metodo: 'POST',
      cuerpo: { resultado },
      token,
    }),
  /** Comercio que es centro de llenado: sus locales con el historial y cuántos clientes lo tienen como el más cercano. */
  panelCentro: (token?: string) => pedirComoOperador<PanelCentro>('/operador/centro', { token }),
};

export type Api = typeof api;
