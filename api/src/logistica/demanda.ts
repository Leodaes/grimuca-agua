// Demanda por tienda: hogares, pedidos pendientes y recambios de cartucho previstos.
// El cálculo puro (funciones que reciben filas) va separado de la consulta para probarlo sin base.
import type { Pool } from 'pg';
import { tiendaSugerida } from '../tipos';
import type { ResumenTienda } from '../tipos';

/** Vida útil por defecto de un cartucho cuando no hay dato del cartucho del hogar. */
export const VIDA_UTIL_POR_DEFECTO_DIAS = 180;
const MS_DIA = 24 * 60 * 60 * 1000;

export interface FilaTienda {
  id: string;
  nombre: string;
}

export interface FilaHogarDemanda {
  id: string;
  zona: string;
  tienda_id: string | null;
  tiene_filtro: boolean;
  /** 'AAAA-MM-DD' o null si no se acuerda. */
  fecha_ultimo_cambio: string | null;
  /** Vida útil del último cartucho que pidió el hogar, si se conoce. */
  vida_util_meses: number | null;
  /** Último cartucho que pidió el hogar (para el inventario). */
  ultimo_cartucho: string | null;
}

export interface FilaPedidoDemanda {
  tienda_id: string;
  tipo: 'sobre' | 'cartucho';
  estado: 'pendiente' | 'despachado';
  cartucho_codigo: string | null;
  cantidad: number;
}

/** Tienda que atiende al hogar: la que eligió o, si no eligió, la sugerida por su zona. */
export function tiendaDelHogar(hogar: Pick<FilaHogarDemanda, 'tienda_id' | 'zona'>): string {
  return hogar.tienda_id ?? tiendaSugerida(hogar.zona);
}

function inicioDelDia(fecha: Date): number {
  return Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
}

/** Fecha prevista del recambio en milisegundos (UTC, inicio del día) o null si no se puede prever. */
export function fechaRecambio(hogar: FilaHogarDemanda): number | null {
  if (!hogar.tiene_filtro || !hogar.fecha_ultimo_cambio) return null;
  const base = Date.parse(`${String(hogar.fecha_ultimo_cambio).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(base)) return null;
  const vidaDias =
    hogar.vida_util_meses && hogar.vida_util_meses > 0
      ? hogar.vida_util_meses * 30
      : VIDA_UTIL_POR_DEFECTO_DIAS;
  return base + vidaDias * MS_DIA;
}

/**
 * ¿El recambio cae dentro de los próximos `dias`? Los ya vencidos cuentan (en cualquier ventana).
 * Un hogar sin filtro o sin fecha del último cambio no cuenta: no hay forma de preverlo.
 */
export function recambioEnVentana(hogar: FilaHogarDemanda, dias: number, hoy: Date = new Date()): boolean {
  const fecha = fechaRecambio(hogar);
  if (fecha === null) return false;
  return fecha <= inicioDelDia(hoy) + dias * MS_DIA;
}

export function calcularResumen(
  tiendas: FilaTienda[],
  hogares: FilaHogarDemanda[],
  pedidos: FilaPedidoDemanda[],
  hoy: Date = new Date(),
): ResumenTienda[] {
  const porTienda = new Map<string, ResumenTienda>();
  for (const tienda of tiendas) {
    porTienda.set(tienda.id, {
      tienda_id: tienda.id,
      nombre: tienda.nombre,
      hogares: 0,
      pedidos_pendientes: 0,
      sobres_pendientes: 0,
      recambios_7_dias: 0,
      recambios_30_dias: 0,
    });
  }
  for (const hogar of hogares) {
    const fila = porTienda.get(tiendaDelHogar(hogar));
    if (!fila) continue;
    fila.hogares += 1;
    if (recambioEnVentana(hogar, 7, hoy)) fila.recambios_7_dias += 1;
    if (recambioEnVentana(hogar, 30, hoy)) fila.recambios_30_dias += 1;
  }
  for (const pedido of pedidos) {
    if (pedido.estado !== 'pendiente') continue;
    const fila = porTienda.get(pedido.tienda_id);
    if (!fila) continue;
    fila.pedidos_pendientes += 1;
    if (pedido.tipo === 'sobre') fila.sobres_pendientes += 1;
  }
  return [...porTienda.values()];
}

// --- Consultas ---

export async function leerTiendas(bd: Pool): Promise<FilaTienda[]> {
  const { rows } = await bd.query<FilaTienda>('SELECT id, nombre FROM tiendas ORDER BY nombre');
  return rows;
}

/** Hogares con la vida útil y el código del último cartucho que pidieron (si pidieron alguno). */
export async function leerHogaresDemanda(bd: Pool): Promise<FilaHogarDemanda[]> {
  const [hogaresRes, cartuchosRes] = await Promise.all([
    bd.query('SELECT id, zona, tienda_id, tiene_filtro, fecha_ultimo_cambio FROM hogares'),
    // Pedidos de cartucho del más viejo al más nuevo: el último que se lee por hogar es el más reciente.
    bd.query(
      `SELECT p.hogar_id, p.cartucho_codigo, c.vida_util_meses
         FROM pedidos p
         JOIN cartuchos c ON c.codigo = p.cartucho_codigo
        WHERE p.tipo = $1
        ORDER BY p.fecha ASC, p.id ASC`,
      ['cartucho'],
    ),
  ]);
  const ultimo = new Map<string, { cartucho_codigo: string; vida_util_meses: unknown }>();
  for (const f of cartuchosRes.rows) ultimo.set(String(f.hogar_id), f);
  const rows = hogaresRes.rows.map((h) => {
    const u = ultimo.get(String(h.id));
    return { ...h, vida_util_meses: u?.vida_util_meses ?? null, ultimo_cartucho: u?.cartucho_codigo ?? null };
  });
  return rows.map((fila) => ({
    id: String(fila.id),
    zona: String(fila.zona),
    tienda_id: fila.tienda_id ?? null,
    tiene_filtro: Boolean(fila.tiene_filtro),
    fecha_ultimo_cambio:
      fila.fecha_ultimo_cambio instanceof Date
        ? fila.fecha_ultimo_cambio.toISOString().slice(0, 10)
        : (fila.fecha_ultimo_cambio ?? null),
    vida_util_meses: fila.vida_util_meses === null || fila.vida_util_meses === undefined ? null : Number(fila.vida_util_meses),
    ultimo_cartucho: fila.ultimo_cartucho ?? null,
  }));
}

export async function leerPedidosDemanda(bd: Pool): Promise<FilaPedidoDemanda[]> {
  const { rows } = await bd.query(
    'SELECT tienda_id, tipo, estado, cartucho_codigo, cantidad FROM pedidos',
  );
  return rows.map((fila) => ({
    tienda_id: String(fila.tienda_id),
    tipo: fila.tipo,
    estado: fila.estado,
    cartucho_codigo: fila.cartucho_codigo ?? null,
    cantidad: Number(fila.cantidad ?? 1),
  }));
}

export async function resumenPorTienda(bd: Pool, hoy: Date = new Date()): Promise<ResumenTienda[]> {
  const [tiendas, hogares, pedidos] = await Promise.all([
    leerTiendas(bd),
    leerHogaresDemanda(bd),
    leerPedidosDemanda(bd),
  ]);
  return calcularResumen(tiendas, hogares, pedidos, hoy);
}
