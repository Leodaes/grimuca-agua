// Estado de los pedidos pendientes del despacho. Clave por `id`: un pedido que llega por evento
// y otra vez por recarga o sondeo nunca se duplica.
import type { Pedido } from '../../lib/tipos';

export const TIENDAS_OPERADOR = [
  { id: 'manongo', nombre: 'Mañongo' },
  { id: 'biglow', nombre: 'Big Low' },
  { id: 'cem', nombre: 'CC CEM' },
] as const;

export function nombreTienda(id: string): string {
  return TIENDAS_OPERADOR.find((t) => t.id === id)?.nombre ?? id;
}

export interface EstadoPedidos {
  /** Pendientes por id. */
  porId: Record<number, Pedido>;
  /** Ids recién llegados por evento (resaltados). */
  nuevos: Record<number, true>;
  /** Ids despachados de forma optimista mientras el servidor confirma. */
  ocultos: Record<number, true>;
}

export type AccionPedidos =
  | { tipo: 'cargar'; pedidos: Pedido[] }
  | { tipo: 'llego'; pedido: Pedido }
  | { tipo: 'despachado'; id: number }
  | { tipo: 'ocultar'; id: number }
  | { tipo: 'mostrar'; id: number }
  | { tipo: 'quitarNuevo'; id: number };

export const ESTADO_INICIAL: EstadoPedidos = { porId: {}, nuevos: {}, ocultos: {} };

function sin<T>(registro: Record<number, T>, id: number): Record<number, T> {
  if (!(id in registro)) return registro;
  const copia = { ...registro };
  delete copia[id];
  return copia;
}

export function reducirPedidos(estado: EstadoPedidos, accion: AccionPedidos): EstadoPedidos {
  switch (accion.tipo) {
    case 'cargar': {
      // La lista del servidor manda; se conservan las marcas de "nuevo" de los que siguen pendientes.
      const porId: Record<number, Pedido> = {};
      for (const p of accion.pedidos) if (p.estado === 'pendiente') porId[p.id] = p;
      const nuevos: Record<number, true> = {};
      for (const id of Object.keys(estado.nuevos).map(Number)) if (porId[id]) nuevos[id] = true;
      return { ...estado, porId, nuevos };
    }
    case 'llego': {
      const p = accion.pedido;
      if (p.estado !== 'pendiente') return reducirPedidos(estado, { tipo: 'despachado', id: p.id });
      const yaEstaba = Boolean(estado.porId[p.id]);
      return {
        ...estado,
        porId: { ...estado.porId, [p.id]: { ...estado.porId[p.id], ...p } },
        nuevos: yaEstaba ? estado.nuevos : { ...estado.nuevos, [p.id]: true },
      };
    }
    case 'despachado':
      return {
        porId: sin(estado.porId, accion.id),
        nuevos: sin(estado.nuevos, accion.id),
        ocultos: sin(estado.ocultos, accion.id),
      };
    case 'ocultar':
      return { ...estado, ocultos: { ...estado.ocultos, [accion.id]: true } };
    case 'mostrar':
      return { ...estado, ocultos: sin(estado.ocultos, accion.id) };
    case 'quitarNuevo':
      return { ...estado, nuevos: sin(estado.nuevos, accion.id) };
    default:
      return estado;
  }
}

/** Pendientes visibles, del más nuevo al más viejo. */
export function pendientesVisibles(estado: EstadoPedidos): Pedido[] {
  return Object.values(estado.porId)
    .filter((p) => !estado.ocultos[p.id])
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha) || b.id - a.id);
}

const formatoHora = new Intl.DateTimeFormat('es-VE', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Caracas',
});

export function horaDe(fecha: string): string {
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? '' : formatoHora.format(d);
}
