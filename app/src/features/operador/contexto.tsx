// Servicios que usa el panel (API, sesión y tiempo real) detrás de una interfaz:
// la app usa los de `lib/` y las pruebas inyectan dobles con <ProveedorServicios>.
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { AlertaZona, FilaInventario, Pedido, ResumenTienda, UrbanizacionMapa } from '../../lib/tipos';
import { serviciosReales } from './servicios';

export type EstadoConexion = 'conectando' | 'en_vivo' | 'reconectando';

export interface ManejadoresEnVivo {
  pedidoNuevo: (pedido: Pedido) => void;
  pedidoDespachado: (pedido: Pedido) => void;
  /** Cualquier otro cambio (mediciones): sirve para refrescar el resumen. */
  otroCambio: () => void;
  /** Lista completa de pendientes que llega por el sondeo de respaldo. */
  listaPedidos: (pedidos: Pedido[]) => void;
  conexion: (estado: EstadoConexion) => void;
  /** El servidor rechazó el token: hay que volver a pedir el PIN. */
  sinPermiso: () => void;
}

export interface ServiciosOperador {
  leerToken(): string | null;
  guardarToken(token: string | null): void;
  entrar(pin: string): Promise<string>;
  pedidosPendientes(token: string): Promise<Pedido[]>;
  despachar(token: string, id: number): Promise<Pedido>;
  resumen(token: string): Promise<ResumenTienda[]>;
  inventario(token: string): Promise<FilaInventario[]>;
  zonas(token: string): Promise<AlertaZona[]>;
  /** Mapa por urbanización. Opcional para que los dobles viejos de las pruebas sigan sirviendo. */
  mapa?(token: string): Promise<UrbanizacionMapa[]>;
  /** Devuelve la función para dejar de escuchar. */
  enVivo(token: string, manejadores: ManejadoresEnVivo): () => void;
}

const Contexto = createContext<ServiciosOperador>(serviciosReales);

export function ProveedorServicios({ servicios, children }: { servicios: ServiciosOperador; children: ReactNode }) {
  return <Contexto.Provider value={servicios}>{children}</Contexto.Provider>;
}

export function useServicios(): ServiciosOperador {
  return useContext(Contexto);
}

/** ¿El error es un 401 (token vencido o inválido)? */
export function esNoAutorizado(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { estado?: unknown; status?: unknown; codigo?: unknown };
  return e.estado === 401 || e.status === 401 || e.codigo === 401;
}

export function mensajeDe(error: unknown, porDefecto: string): string {
  if (typeof error === 'object' && error !== null && 'mensaje' in error) {
    const m = (error as { mensaje?: unknown }).mensaje;
    if (typeof m === 'string' && m) return m;
  }
  return porDefecto;
}
