// Mapa de hexágonos por urbanización (pestaña Zonas del operador): calidad del agua y dónde hay clientes.
// `calcularMapa` es puro (se prueba sin base); `mapaUrbanizaciones` solo hace las consultas.
import type { Pool } from 'pg';
import { CLAVES_PARAMETRO, type EstadoUrbanizacion, type UrbanizacionMapa } from '../tipos';
import { DIAS_ALERTA, MINIMO_HOGARES_ALERTA, parametrosSaludEnRojo } from './alertas';
import { hogarDeTiendas, leerTiendas } from './demanda';
import { URBANIZACIONES, normalizarNombre, type Urbanizacion } from './urbanizaciones';

export const DIAS_MEDICION_RECIENTE = 30;
const MS_DIA = 24 * 60 * 60 * 1000;
type NivelColor = 'verde' | 'amarillo' | 'rojo';
const ORDEN_NIVEL: Record<NivelColor, number> = { verde: 1, amarillo: 2, rojo: 3 };

export interface FilaHogarMapa {
  id: string;
  zona: string;
  urbanizacion: string | null;
}

export interface FilaMedicionMapa {
  hogar_id: string;
  /** Fecha de la ÚLTIMA medición del hogar. */
  fecha: string | Date;
  /** Semáforo general de la medición. */
  semaforo: unknown;
  semaforo_por_parametro: unknown;
}

/** `{ clave: nivel }` a partir de cualquiera de las dos formas que guarda la base. */
function nivelesPorParametro(semaforo: unknown): Map<string, unknown> {
  let valor = semaforo;
  if (typeof valor === 'string') {
    try {
      valor = JSON.parse(valor);
    } catch {
      return new Map();
    }
  }
  const niveles = new Map<string, unknown>();
  if (Array.isArray(valor)) {
    for (const item of valor) {
      if (item && typeof item === 'object' && 'clave' in item) {
        niveles.set(String((item as { clave: unknown }).clave), (item as { nivel?: unknown }).nivel);
      }
    }
  } else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) niveles.set(k, v);
  }
  return niveles;
}

function esNivelColor(valor: unknown): valor is NivelColor {
  return valor === 'verde' || valor === 'amarillo' || valor === 'rojo';
}

/** Peor nivel de una medición: el semáforo general y el de cada parámetro. */
function peorNivel(m: FilaMedicionMapa, niveles: Map<string, unknown>): NivelColor | null {
  let peor: NivelColor | null = esNivelColor(m.semaforo) ? m.semaforo : null;
  for (const v of niveles.values()) {
    if (esNivelColor(v) && (peor === null || ORDEN_NIVEL[v] > ORDEN_NIVEL[peor])) peor = v;
  }
  return peor;
}

function kebab(texto: string): string {
  return normalizarNombre(texto).replace(/ /g, '-');
}

interface Acumulado {
  base: Omit<UrbanizacionMapa, 'hogares' | 'hogares_con_medicion_30_dias' | 'hogares_en_rojo_7_dias' | 'estado' | 'alerta' | 'parametros' | 'pedidos_pendientes'>;
  hogares: string[];
}

/**
 * Una entrada por urbanización de `urbanizaciones` (aunque no tenga hogares) y, al final, una
 * "Otras de <zona>" por cada zona con hogares sin urbanización o con una que no está en la lista.
 *
 * - `estado`: peor nivel entre las últimas mediciones (de los últimos 30 días) de sus hogares;
 *   `sin_medicion` si tiene hogares pero ninguno midió en 30 días; `sin_clientes` si no tiene hogares.
 * - `hogares_en_rojo_7_dias` / `alerta`: como la alerta por zona (solo parámetros de salud, 3 o más hogares).
 * - `parametros`: los que más se repiten en amarillo o rojo (empates incluidos, en el orden de la tira).
 */
export function calcularMapa(
  hogares: FilaHogarMapa[],
  ultimas: FilaMedicionMapa[],
  pendientesPorHogar: Map<string, number>,
  hoy: Date = new Date(),
  urbanizaciones: readonly Urbanizacion[] = URBANIZACIONES,
): UrbanizacionMapa[] {
  const grupos = new Map<string, Acumulado>();
  for (const u of urbanizaciones) {
    grupos.set(u.id, {
      base: {
        id: u.id,
        nombre: u.nombre,
        zona: u.zona,
        col: u.col,
        fila: u.fila,
        en_tablero: true,
        grupo: u.grupo ?? null,
        verificada: u.verificada,
        tiendas: [...(u.tiendas ?? [])],
        lat: u.lat,
        lng: u.lng,
      },
      hogares: [],
    });
  }
  const otras = new Map<string, Acumulado>();

  for (const h of hogares) {
    const u = buscarUrbanizacionEn(urbanizaciones, h.urbanizacion);
    // Si la urbanización es de otra zona que la del hogar, manda la zona del hogar.
    if (u && u.zona === h.zona) {
      grupos.get(u.id)!.hogares.push(h.id);
      continue;
    }
    let grupo = otras.get(h.zona);
    if (!grupo) {
      grupo = {
        base: {
          id: `otras-${kebab(h.zona)}`,
          nombre: `Otras de ${h.zona}`,
          zona: h.zona,
          col: null,
          fila: null,
          en_tablero: false,
          grupo: null,
          verificada: true,
          tiendas: [],
          lat: null,
          lng: null,
        },
        hogares: [],
      };
      otras.set(h.zona, grupo);
    }
    grupo.hogares.push(h.id);
  }

  const ultimaPorHogar = new Map(ultimas.map((m) => [m.hogar_id, m]));
  const desdeReciente = hoy.getTime() - DIAS_MEDICION_RECIENTE * MS_DIA;
  const desdeAlerta = hoy.getTime() - DIAS_ALERTA * MS_DIA;

  const cerrar = ({ base, hogares: ids }: Acumulado): UrbanizacionMapa => {
    let conMedicion = 0;
    let enRojo = 0;
    let peor: NivelColor | null = null;
    const conteo = new Map<string, number>();
    let pedidos = 0;
    for (const id of ids) {
      pedidos += pendientesPorHogar.get(id) ?? 0;
      const m = ultimaPorHogar.get(id);
      if (!m) continue;
      const fecha = new Date(m.fecha).getTime();
      if (Number.isNaN(fecha) || fecha < desdeReciente) continue;
      conMedicion += 1;
      const niveles = nivelesPorParametro(m.semaforo_por_parametro);
      const nivel = peorNivel(m, niveles);
      if (nivel && (peor === null || ORDEN_NIVEL[nivel] > ORDEN_NIVEL[peor])) peor = nivel;
      for (const [clave, v] of niveles) {
        if (v === 'amarillo' || v === 'rojo') conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
      }
      if (fecha >= desdeAlerta && parametrosSaludEnRojo(m.semaforo_por_parametro).length > 0) enRojo += 1;
    }
    const maximo = Math.max(0, ...conteo.values());
    const claves = [...conteo.keys()];
    const orden = (c: string) => {
      const i = (CLAVES_PARAMETRO as readonly string[]).indexOf(c);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const estado: EstadoUrbanizacion = ids.length === 0 ? 'sin_clientes' : (peor ?? 'sin_medicion');
    return {
      ...base,
      hogares: ids.length,
      hogares_con_medicion_30_dias: conMedicion,
      hogares_en_rojo_7_dias: enRojo,
      estado,
      alerta: enRojo >= MINIMO_HOGARES_ALERTA,
      parametros: maximo > 0 ? claves.filter((c) => conteo.get(c) === maximo).sort((a, b) => orden(a) - orden(b)) : [],
      pedidos_pendientes: pedidos,
    };
  };

  const tablero = [...grupos.values()].map(cerrar);
  const resto = [...otras.values()].map(cerrar).sort((a, b) => a.zona.localeCompare(b.zona, 'es'));
  return [...tablero, ...resto];
}

/** Como `buscarUrbanizacion`, pero sobre la lista recibida (las pruebas usan listas cortas). */
function buscarUrbanizacionEn(lista: readonly Urbanizacion[], texto: string | null): Urbanizacion | undefined {
  if (!texto) return undefined;
  const clave = normalizarNombre(texto);
  return lista.find((u) => normalizarNombre(u.nombre) === clave || u.id === texto.trim());
}

/** Con `comercioId`, solo los hogares que atienden sus tiendas. */
export async function mapaUrbanizaciones(bd: Pool, hoy: Date = new Date(), comercioId?: string): Promise<UrbanizacionMapa[]> {
  const [hogaresRes, ultimasRes, pedidosRes, propias] = await Promise.all([
    bd.query('SELECT id, zona, urbanizacion, tienda_id FROM hogares'),
    bd.query(
      `SELECT DISTINCT ON (hogar_id) hogar_id, fecha, semaforo, semaforo_por_parametro
         FROM mediciones
        ORDER BY hogar_id, fecha DESC`,
    ),
    bd.query(`SELECT hogar_id, count(*) AS n FROM pedidos WHERE estado = 'pendiente' GROUP BY hogar_id`),
    comercioId ? leerTiendas(bd, comercioId) : Promise.resolve(null),
  ]);
  const tiendas = propias ? new Set(propias.map((t) => t.id)) : null;
  const hogares: FilaHogarMapa[] = hogaresRes.rows
    .filter(
      (f) =>
        !tiendas ||
        hogarDeTiendas({ tienda_id: (f.tienda_id as string | null) ?? null, zona: String(f.zona) }, tiendas),
    )
    .map((f) => ({
      id: String(f.id),
      zona: String(f.zona),
      urbanizacion: (f.urbanizacion as string | null) ?? null,
    }));
  const ultimas: FilaMedicionMapa[] = ultimasRes.rows.map((f) => ({
    hogar_id: String(f.hogar_id),
    fecha: f.fecha,
    semaforo: f.semaforo,
    semaforo_por_parametro: f.semaforo_por_parametro,
  }));
  const pendientes = new Map<string, number>(pedidosRes.rows.map((f) => [String(f.hogar_id), Number(f.n)]));
  return calcularMapa(hogares, ultimas, pendientes, hoy);
}
