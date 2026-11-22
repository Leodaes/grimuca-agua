// Eventos en vivo para la red y el técnico: solo EventSource contra GET /api/eventos.
// (El respaldo por sondeo de `lib/eventos.ts` usa las rutas del comercio y no sirve con estos tokens;
// aquí cada pantalla refresca su lista por su cuenta cada tanto.)
import { BASE_API } from '../../lib/api';
import type { DatosMedicionNueva, Pedido } from '../../lib/tipos';

export interface ManejadoresRed {
  pedidoNuevo?: (pedido: Pedido) => void;
  pedidoDespachado?: (pedido: Pedido) => void;
  medicionNueva?: (datos: DatosMedicionNueva) => void;
  conexion?: (enVivo: boolean) => void;
}

const REINTENTO_MS = 15_000;

/** Devuelve la función para dejar de escuchar. Sin EventSource (pruebas) no hace nada. */
export function escucharEventos(token: string, m: ManejadoresRed): () => void {
  let activo = true;
  let fuente: EventSource | null = null;
  let reintento: ReturnType<typeof setTimeout> | null = null;

  function leer<T>(evento: Event): T | null {
    try {
      return JSON.parse((evento as MessageEvent<string>).data) as T;
    } catch {
      return null;
    }
  }

  function abrir() {
    if (!activo || typeof EventSource === 'undefined') return;
    let nueva: EventSource;
    try {
      nueva = new EventSource(`${BASE_API}/eventos?token=${encodeURIComponent(token)}`);
    } catch {
      return;
    }
    fuente = nueva;
    nueva.addEventListener('open', () => activo && m.conexion?.(true));
    nueva.addEventListener('pedido_nuevo', (e) => {
      const p = leer<Pedido>(e);
      if (activo && p) m.pedidoNuevo?.(p);
    });
    nueva.addEventListener('pedido_despachado', (e) => {
      const p = leer<Pedido>(e);
      if (activo && p) m.pedidoDespachado?.(p);
    });
    nueva.addEventListener('medicion_nueva', (e) => {
      const d = leer<DatosMedicionNueva>(e);
      if (activo && d) m.medicionNueva?.(d);
    });
    nueva.addEventListener('error', () => {
      if (!activo || fuente !== nueva) return;
      m.conexion?.(false);
      if (nueva.readyState === 2) {
        nueva.close();
        fuente = null;
        if (!reintento) {
          reintento = setTimeout(() => {
            reintento = null;
            abrir();
          }, REINTENTO_MS);
        }
      }
    });
  }

  abrir();
  return () => {
    activo = false;
    if (reintento) clearTimeout(reintento);
    fuente?.close();
    fuente = null;
  };
}
