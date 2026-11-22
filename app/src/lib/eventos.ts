// Tiempo real para el panel del operador.
// Usa EventSource contra GET /api/eventos y, mientras esa conexión no esté viva,
// sondea GET /api/operador/pedidos cada 5 s para que la lista de despacho nunca se quede vieja.
import { api, BASE_API, ErrorApi } from './api';
import type { DatosMedicionNueva, Pedido } from './tipos';

export const INTERVALO_SONDEO_MS = 5_000;
/** Si el navegador da por cerrada la conexión en vivo, se vuelve a intentar cada tanto. */
export const REINTENTO_EN_VIVO_MS = 15_000;

export type EstadoConexion = 'conectando' | 'en_vivo' | 'reconectando';

/** Todos son opcionales. Cada evento acepta el nombre del contrato o su forma en camelCase. */
export interface ManejadoresEventos {
  pedido_nuevo?: (pedido: Pedido) => void;
  pedido_despachado?: (pedido: Pedido) => void;
  medicion_nueva?: (datos: DatosMedicionNueva) => void;
  pedidoNuevo?: (pedido: Pedido) => void;
  pedidoDespachado?: (pedido: Pedido) => void;
  medicionNueva?: (datos: DatosMedicionNueva) => void;
  /** Lista completa de pedidos pendientes, cada vez que llega por el sondeo de respaldo. */
  pedidos?: (pendientes: Pedido[]) => void;
  /** 'en_vivo' con la conexión abierta; 'reconectando' mientras se trabaja con el sondeo. */
  conexion?: (estado: EstadoConexion) => void;
  /** El servidor rechazó el token (401): hay que volver a pedir el PIN. Se deja de escuchar. */
  sinPermiso?: () => void;
}

/** Devuelve la función para dejar de escuchar (ciérrala al desmontar la pantalla). */
export function suscribirEventos(token: string, manejadores: ManejadoresEventos): () => void {
  let activo = true;
  let fuente: EventSource | null = null;
  let sondeo: ReturnType<typeof setInterval> | null = null;
  let reintento: ReturnType<typeof setTimeout> | null = null;
  let sondeando = false;
  let estado: EstadoConexion | null = null;
  /** Pendientes conocidos (por id). `null` hasta la primera lectura del sondeo. */
  let conocidos: Map<number, Pedido> | null = null;
  /** Ids que ya se avisaron como despachados, para no repetirlos. */
  const despachados = new Set<number>();

  const alNuevo = (pedido: Pedido) => (manejadores.pedido_nuevo ?? manejadores.pedidoNuevo)?.(pedido);
  const alDespachado = (pedido: Pedido) =>
    (manejadores.pedido_despachado ?? manejadores.pedidoDespachado)?.(pedido);
  const alMedir = (datos: DatosMedicionNueva) => (manejadores.medicion_nueva ?? manejadores.medicionNueva)?.(datos);

  function avisarEstado(nuevo: EstadoConexion) {
    if (estado === nuevo) return;
    estado = nuevo;
    manejadores.conexion?.(nuevo);
  }

  function recibirNuevo(pedido: Pedido) {
    if (conocidos?.has(pedido.id)) return;
    conocidos?.set(pedido.id, pedido);
    alNuevo(pedido);
  }

  function recibirDespachado(pedido: Pedido) {
    conocidos?.delete(pedido.id);
    if (despachados.has(pedido.id)) return;
    despachados.add(pedido.id);
    alDespachado(pedido);
  }

  async function sondear() {
    if (!activo || sondeando) return;
    sondeando = true;
    try {
      const pendientes = await api.operadorPedidos('pendiente', token);
      if (!activo) return;
      const ahora = new Map(pendientes.map((pedido) => [pedido.id, pedido] as const));
      if (conocidos) {
        const antes = conocidos;
        // Del más viejo al más nuevo, para que el último en avisarse sea el más reciente.
        for (const pedido of [...pendientes].reverse()) {
          if (!antes.has(pedido.id)) alNuevo(pedido);
        }
        for (const [id, pedido] of antes) {
          if (!ahora.has(id) && !despachados.has(id)) {
            despachados.add(id);
            alDespachado({ ...pedido, estado: 'despachado', fecha_despacho: new Date().toISOString() });
          }
        }
      }
      conocidos = ahora;
      manejadores.pedidos?.(pendientes);
    } catch (error) {
      if (activo && error instanceof ErrorApi && error.estado === 401) {
        detener();
        manejadores.sinPermiso?.();
      }
      // otros errores: se reintenta en la próxima vuelta
    } finally {
      sondeando = false;
    }
  }

  function iniciarSondeo() {
    if (!activo || sondeo) return;
    avisarEstado('reconectando');
    void sondear();
    sondeo = setInterval(() => void sondear(), INTERVALO_SONDEO_MS);
  }

  function detenerSondeo() {
    if (sondeo) clearInterval(sondeo);
    sondeo = null;
  }

  function leer<T>(evento: Event): T | null {
    try {
      return JSON.parse((evento as MessageEvent<string>).data) as T;
    } catch {
      return null;
    }
  }

  function abrirEnVivo() {
    if (!activo) return;
    if (typeof EventSource === 'undefined') {
      iniciarSondeo();
      return;
    }
    let nueva: EventSource;
    try {
      nueva = new EventSource(`${BASE_API}/eventos?token=${encodeURIComponent(token)}`);
    } catch {
      iniciarSondeo();
      return;
    }
    fuente = nueva;

    nueva.addEventListener('open', () => {
      if (!activo || fuente !== nueva) return;
      detenerSondeo();
      avisarEstado('en_vivo');
    });
    nueva.addEventListener('pedido_nuevo', (evento) => {
      const pedido = leer<Pedido>(evento);
      if (activo && pedido) recibirNuevo(pedido);
    });
    nueva.addEventListener('pedido_despachado', (evento) => {
      const pedido = leer<Pedido>(evento);
      if (activo && pedido) recibirDespachado(pedido);
    });
    nueva.addEventListener('medicion_nueva', (evento) => {
      const datos = leer<DatosMedicionNueva>(evento);
      if (activo && datos) alMedir(datos);
    });
    nueva.addEventListener('error', () => {
      if (!activo || fuente !== nueva) return;
      // Mientras el navegador reconecta solo, el sondeo mantiene la lista al día.
      iniciarSondeo();
      if (nueva.readyState === 2 /* CLOSED: el navegador ya no reintenta */) {
        nueva.close();
        fuente = null;
        if (!reintento) {
          reintento = setTimeout(() => {
            reintento = null;
            abrirEnVivo();
          }, REINTENTO_EN_VIVO_MS);
        }
      }
    });
  }

  function detener() {
    activo = false;
    detenerSondeo();
    if (reintento) clearTimeout(reintento);
    reintento = null;
    fuente?.close();
    fuente = null;
  }

  avisarEstado('conectando');
  abrirEnVivo();
  return detener;
}
