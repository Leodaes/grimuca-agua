// Inventario: stock de cada cartucho por tienda contra la demanda de los próximos 30 días.
import type { Pool } from 'pg';
import type { FilaInventario } from '../tipos';
import {
  hogarDeTiendas,
  leerHogaresDemanda,
  leerPedidosDemanda,
  leerTiendas,
  recambioEnVentana,
  tiendaDelHogar,
} from './demanda';
import type { FilaHogarDemanda, FilaPedidoDemanda, FilaTienda } from './demanda';

export interface FilaStock {
  tienda_id: string;
  cartucho_codigo: string;
  cantidad: number;
}

export interface FilaCartucho {
  codigo: string;
  nombre: string;
}

const clave = (tienda: string, cartucho: string) => `${tienda}|${cartucho}`;

/**
 * Regla de demanda a 30 días por (tienda, cartucho):
 *   1. Pedidos de cartucho pendientes: suman su `cantidad`.
 *   2. Cada hogar con recambio previsto en 30 días (incluye vencidos) demanda 1 unidad:
 *      del último cartucho que ese hogar pidió; si nunca pidió, del cartucho más pedido
 *      en su tienda (todos los pedidos de cartucho, por cantidad). Si la tienda no tiene
 *      pedidos de cartucho, ese recambio no se puede asignar y no suma.
 * faltante = max(0, demanda - stock). Orden: faltantes primero (mayor a menor), luego tienda y cartucho.
 */
export function calcularInventario(
  tiendas: FilaTienda[],
  cartuchos: FilaCartucho[],
  stock: FilaStock[],
  hogares: FilaHogarDemanda[],
  pedidos: FilaPedidoDemanda[],
  hoy: Date = new Date(),
): FilaInventario[] {
  const nombreTienda = new Map(tiendas.map((t) => [t.id, t.nombre]));
  const nombreCartucho = new Map(cartuchos.map((c) => [c.codigo, c.nombre]));
  const filas = new Map<string, FilaInventario>();

  const fila = (tienda: string, cartucho: string): FilaInventario => {
    const k = clave(tienda, cartucho);
    let f = filas.get(k);
    if (!f) {
      f = {
        tienda_id: tienda,
        tienda_nombre: nombreTienda.get(tienda) ?? tienda,
        cartucho_codigo: cartucho,
        cartucho_nombre: nombreCartucho.get(cartucho) ?? cartucho,
        stock: 0,
        demanda_30_dias: 0,
        faltante: 0,
      };
      filas.set(k, f);
    }
    return f;
  };

  for (const s of stock) fila(s.tienda_id, s.cartucho_codigo).stock += Number(s.cantidad) || 0;

  // Cartucho más pedido por tienda.
  const pedidosPorTienda = new Map<string, Map<string, number>>();
  for (const p of pedidos) {
    if (p.tipo !== 'cartucho' || !p.cartucho_codigo) continue;
    if (p.estado === 'pendiente') fila(p.tienda_id, p.cartucho_codigo).demanda_30_dias += p.cantidad;
    const conteo = pedidosPorTienda.get(p.tienda_id) ?? new Map<string, number>();
    conteo.set(p.cartucho_codigo, (conteo.get(p.cartucho_codigo) ?? 0) + p.cantidad);
    pedidosPorTienda.set(p.tienda_id, conteo);
  }
  const masPedido = new Map<string, string>();
  for (const [tienda, conteo] of pedidosPorTienda) {
    const [primero] = [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (primero) masPedido.set(tienda, primero[0]);
  }

  for (const hogar of hogares) {
    if (!recambioEnVentana(hogar, 30, hoy)) continue;
    const tienda = tiendaDelHogar(hogar);
    const cartucho = hogar.ultimo_cartucho ?? masPedido.get(tienda);
    if (!cartucho) continue;
    fila(tienda, cartucho).demanda_30_dias += 1;
  }

  const resultado = [...filas.values()].map((f) => ({
    ...f,
    faltante: Math.max(0, f.demanda_30_dias - f.stock),
  }));
  resultado.sort(
    (a, b) =>
      b.faltante - a.faltante ||
      a.tienda_nombre.localeCompare(b.tienda_nombre, 'es') ||
      a.cartucho_nombre.localeCompare(b.cartucho_nombre, 'es'),
  );
  return resultado;
}

/** Con `comercioId`, solo las existencias, hogares y pedidos de sus tiendas. */
export async function inventario(bd: Pool, hoy: Date = new Date(), comercioId?: string): Promise<FilaInventario[]> {
  const [tiendas, cartuchosRes, stockRes, todosLosHogares, todosLosPedidos] = await Promise.all([
    leerTiendas(bd, comercioId),
    bd.query<FilaCartucho>('SELECT codigo, nombre FROM cartuchos'),
    bd.query('SELECT tienda_id, cartucho_codigo, cantidad FROM stock'),
    leerHogaresDemanda(bd),
    leerPedidosDemanda(bd),
  ]);
  const propias = new Set(tiendas.map((t) => t.id));
  const deEste = (tienda: string) => !comercioId || propias.has(tienda);
  const stock: FilaStock[] = stockRes.rows
    .map((s) => ({
      tienda_id: String(s.tienda_id),
      cartucho_codigo: String(s.cartucho_codigo),
      cantidad: Number(s.cantidad),
    }))
    .filter((s) => deEste(s.tienda_id));
  const hogares = comercioId ? todosLosHogares.filter((h) => hogarDeTiendas(h, propias)) : todosLosHogares;
  const pedidos = todosLosPedidos.filter((p) => deEste(p.tienda_id));
  return calcularInventario(tiendas, cartuchosRes.rows, stock, hogares, pedidos, hoy);
}
