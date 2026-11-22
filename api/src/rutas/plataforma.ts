// Plataforma de comercios (docs/decisiones/contrato-red.md): consultas y conversiones compartidas
// por las rutas del comercio, la red y el técnico.
import { aDia, aIso, aIsoONulo, aNumeroONulo, type Bd } from '../bd';
import { tiendaSugerida } from '../tipos';
import type { Comercio, EstadoMembresia, ServicioConReporte, Tienda } from '../tipos';
import { filaAPedido, filaATienda, listarCatalogo, SELECT_PEDIDO, type CartuchoCatalogo } from './datos';

type Fila = Record<string, unknown>;
type Consultable = Pick<Bd, 'query'>;

/** Comercio de los hogares sin tienda y de los tokens viejos sin rol. */
export const COMERCIO_PRINCIPAL = 'grimuca';

export function filaAComercio(fila: Fila): Comercio {
  return {
    id: String(fila.id),
    nombre: String(fila.nombre),
    tipo: fila.tipo === 'centro_llenado' ? 'centro_llenado' : 'ferreteria',
    estado_pais: String(fila.estado_pais),
    ciudad: String(fila.ciudad),
    plan: fila.plan === 'premium' ? 'premium' : 'basico',
    membresia_usd: aNumeroONulo(fila.membresia_usd),
    fecha_alta: aIso(fila.fecha_alta),
    fin_periodo_gratis: aDia(fila.fin_periodo_gratis),
    activo: Boolean(fila.activo),
    es_demostracion: Boolean(fila.es_demostracion),
  };
}

const COLUMNAS_COMERCIO =
  'id, nombre, tipo, estado_pais, ciudad, plan, membresia_usd, fecha_alta, fin_periodo_gratis, activo, es_demostracion';

export async function listarComercios(bd: Consultable): Promise<Comercio[]> {
  const { rows } = await bd.query(`SELECT ${COLUMNAS_COMERCIO} FROM comercios ORDER BY fecha_alta, id`);
  return rows.map(filaAComercio);
}

export async function buscarComercio(bd: Consultable, id: string): Promise<Comercio | null> {
  const { rows } = await bd.query(`SELECT ${COLUMNAS_COMERCIO} FROM comercios WHERE id = $1`, [id]);
  return rows[0] ? filaAComercio(rows[0]) : null;
}

export async function tiendasDeComercio(bd: Consultable, comercioId: string): Promise<Tienda[]> {
  const { rows } = await bd.query(
    'SELECT id, nombre, horario, direccion, comercio_id, urbanizacion FROM tiendas WHERE comercio_id = $1 ORDER BY nombre',
    [comercioId],
  );
  return rows.map(filaATienda);
}

/** Comercio dueño de una tienda (sin dato: el principal). */
export async function comercioDeTienda(bd: Consultable, tiendaId: string): Promise<string> {
  const { rows } = await bd.query('SELECT comercio_id FROM tiendas WHERE id = $1', [tiendaId]);
  const id = rows[0]?.comercio_id;
  return typeof id === 'string' && id ? id : COMERCIO_PRINCIPAL;
}

/** Un hogar pertenece al comercio de su tienda; sin tienda, a la sugerida por su zona (de Grimuca). */
export function comercioDeHogarCon(
  hogar: { tienda_id: string | null; zona: string },
  comercioPorTienda: Map<string, string>,
): string {
  const tienda = hogar.tienda_id ?? tiendaSugerida(hogar.zona);
  return comercioPorTienda.get(tienda) ?? COMERCIO_PRINCIPAL;
}

/** Comercio de un hogar: el de su tienda; sin tienda, el de la sugerida por su zona. */
export async function comercioDelHogar(bd: Consultable, hogar: { tienda_id: string | null; zona: string }): Promise<string> {
  return comercioDeTienda(bd, hogar.tienda_id ?? tiendaSugerida(hogar.zona));
}

/** Catálogo que ve el hogar: el general más los productos del comercio de su tienda. */
export async function catalogoDelHogar(
  bd: Consultable,
  hogar: { tienda_id: string | null; zona: string },
): Promise<CartuchoCatalogo[]> {
  return listarCatalogo(bd, await comercioDelHogar(bd, hogar));
}

export async function mapaComercioPorTienda(bd: Consultable): Promise<Map<string, string>> {
  const { rows } = await bd.query('SELECT id, comercio_id FROM tiendas');
  return new Map(rows.map((f) => [String(f.id), f.comercio_id ? String(f.comercio_id) : COMERCIO_PRINCIPAL]));
}

// ---------- Fechas ----------

/** AAAA-MM-DD de hoy en Venezuela (UTC-4, sin horario de verano). */
export function hoyEnVenezuela(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() - 4 * 3_600_000).toISOString().slice(0, 10);
}

/** Suma meses de calendario a un día AAAA-MM-DD (el 31 de enero + 1 mes = último día de febrero). */
export function sumarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  const destino = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(d, ultimo));
  return destino.toISOString().slice(0, 10);
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

/**
 * - `periodo_gratis`: tiene fin de periodo gratis y hoy no lo pasó (cuenta los días que quedan, hoy incluido como 0).
 * - `vencida`: el periodo gratis ya pasó (en la demo no hay cobro que lo renueve) o el comercio está inactivo.
 * - `activa`: activo y sin periodo gratis (Grimuca, que opera la red).
 */
export function estadoMembresia(
  comercio: Pick<Comercio, 'activo' | 'fin_periodo_gratis'>,
  hoy: string = hoyEnVenezuela(),
): { estado_membresia: EstadoMembresia; dias_gratis_restantes: number | null } {
  if (!comercio.activo) return { estado_membresia: 'vencida', dias_gratis_restantes: null };
  if (comercio.fin_periodo_gratis) {
    const quedan = diasEntre(hoy, comercio.fin_periodo_gratis);
    return quedan >= 0
      ? { estado_membresia: 'periodo_gratis', dias_gratis_restantes: quedan }
      : { estado_membresia: 'vencida', dias_gratis_restantes: null };
  }
  return { estado_membresia: 'activa', dias_gratis_restantes: null };
}

// ---------- Identificadores ----------

/** "Ferretería El Tornillo, C.A." → "ferreteria-el-tornillo-c-a" (sin acentos, máximo `largo`). */
export function aKebab(texto: string, largo = 40): string {
  const limpio = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, largo)
    .replace(/-+$/g, '');
  return limpio || 'comercio';
}

/** Primer identificador libre: `base`, `base-2`, `base-3`… */
export async function idLibre(bd: Consultable, tabla: 'comercios' | 'tiendas', base: string, largo = 40): Promise<string> {
  const { rows } = await bd.query(`SELECT id FROM ${tabla}`);
  const usados = new Set(rows.map((f) => String(f.id)));
  if (!usados.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const sufijo = `-${n}`;
    const candidato = `${base.slice(0, largo - sufijo.length).replace(/-+$/g, '')}${sufijo}`;
    if (!usados.has(candidato)) return candidato;
  }
}

// ---------- Servicios técnicos con su reporte ----------

const SELECT_SERVICIO = SELECT_PEDIDO.replace(
  'FROM pedidos p',
  `, r.pedido_id AS reporte_pedido_id, r.fecha_visita AS reporte_fecha_visita, r.nota AS reporte_nota,
         r.foto_tipo AS reporte_foto_tipo
    FROM pedidos p`,
).concat('\n    LEFT JOIN reportes_servicio r ON r.pedido_id = p.id');

export function filaAServicio(fila: Fila): ServicioConReporte {
  const pedido = filaAPedido(fila, true);
  const hayReporte = fila.reporte_pedido_id !== null && fila.reporte_pedido_id !== undefined;
  return {
    ...pedido,
    reporte: hayReporte
      ? {
          fecha_visita: aIsoONulo(fila.reporte_fecha_visita) ?? aIso(new Date()),
          nota: (fila.reporte_nota as string | null) ?? null,
          tiene_foto: typeof fila.reporte_foto_tipo === 'string' && fila.reporte_foto_tipo.length > 0,
        }
      : null,
  };
}

/** Servicios técnicos de un comercio. `estado`: pendiente, atendido (= despachado) o todos. */
export async function serviciosDeComercio(
  bd: Consultable,
  comercioId: string,
  estado: 'pendiente' | 'atendido' | 'todos',
): Promise<ServicioConReporte[]> {
  const valores: unknown[] = [comercioId];
  let filtro = '';
  if (estado !== 'todos') {
    valores.push(estado === 'atendido' ? 'despachado' : 'pendiente');
    filtro = ' AND p.estado = $2';
  }
  const orden =
    estado === 'pendiente'
      ? 'ORDER BY p.fecha_preferida ASC, p.fecha ASC, p.id ASC'
      : 'ORDER BY p.fecha_despacho DESC, p.id DESC';
  const { rows } = await bd.query(
    `${SELECT_SERVICIO} WHERE p.tipo = 'servicio' AND t.comercio_id = $1${filtro} ${orden}`,
    valores,
  );
  return rows.map(filaAServicio);
}

export async function buscarServicio(bd: Consultable, id: number): Promise<ServicioConReporte | null> {
  const { rows } = await bd.query(`${SELECT_SERVICIO} WHERE p.id = $1 AND p.tipo = 'servicio'`, [id]);
  return rows[0] ? filaAServicio(rows[0]) : null;
}
