// Alertas por zona: hogares cuya última medición de los últimos 7 días salió en rojo en un parámetro de salud.
import type { Pool } from 'pg';
import type { AlertaZona, ClaveParametro } from '../tipos';

/** Solo estos parámetros cuentan para la alerta (los demás son de sabor, dureza o comodidad). */
export const PARAMETROS_SALUD: readonly ClaveParametro[] = ['cobre', 'nitrato', 'nitrito', 'plomo', 'cloro_libre'];
export const MINIMO_HOGARES_ALERTA = 3;
export const DIAS_ALERTA = 7;
const MS_DIA = 24 * 60 * 60 * 1000;

export interface FilaUltimaMedicion {
  hogar_id: string;
  zona: string;
  /** Fecha de la ÚLTIMA medición del hogar. */
  fecha: string | Date;
  /** `{ cobre: 'rojo', ... }` o arreglo `[{ clave, nivel }]`; se aceptan ambas formas. */
  semaforo_por_parametro: unknown;
}

/** Parámetros de salud en rojo dentro de `semaforo_por_parametro`. */
export function parametrosSaludEnRojo(semaforo: unknown): ClaveParametro[] {
  let valor = semaforo;
  if (typeof valor === 'string') {
    try {
      valor = JSON.parse(valor);
    } catch {
      return [];
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
  return PARAMETROS_SALUD.filter((clave) => niveles.get(clave) === 'rojo');
}

/**
 * `zonas`: todas las zonas a listar (aunque tengan 0 hogares en rojo).
 * `ultimas`: la última medición de cada hogar (una fila por hogar).
 * Orden: más hogares en rojo primero.
 */
export function calcularAlertas(
  zonas: string[],
  ultimas: FilaUltimaMedicion[],
  hoy: Date = new Date(),
): AlertaZona[] {
  const desde = hoy.getTime() - DIAS_ALERTA * MS_DIA;
  const porZona = new Map<string, { hogares: Set<string>; conteo: Map<string, number> }>();
  for (const zona of zonas) porZona.set(zona, { hogares: new Set(), conteo: new Map() });

  for (const m of ultimas) {
    const fecha = new Date(m.fecha).getTime();
    if (Number.isNaN(fecha) || fecha < desde) continue;
    const rojos = parametrosSaludEnRojo(m.semaforo_por_parametro);
    if (rojos.length === 0) continue;
    const z = porZona.get(m.zona) ?? { hogares: new Set<string>(), conteo: new Map<string, number>() };
    porZona.set(m.zona, z);
    z.hogares.add(m.hogar_id);
    for (const p of rojos) z.conteo.set(p, (z.conteo.get(p) ?? 0) + 1);
  }

  const resultado: AlertaZona[] = [...porZona.entries()].map(([zona, z]) => {
    const conteos = [...z.conteo.entries()];
    const maximo = Math.max(0, ...conteos.map(([, n]) => n));
    return {
      zona,
      hogares_en_rojo_7_dias: z.hogares.size,
      alerta: z.hogares.size >= MINIMO_HOGARES_ALERTA,
      // Los que más se repiten (empates incluidos), en el orden de PARAMETROS_SALUD.
      parametros: PARAMETROS_SALUD.filter((p) => maximo > 0 && z.conteo.get(p) === maximo),
    };
  });
  resultado.sort((a, b) => b.hogares_en_rojo_7_dias - a.hogares_en_rojo_7_dias || a.zona.localeCompare(b.zona, 'es'));
  return resultado;
}

export async function alertasZona(bd: Pool, hoy: Date = new Date()): Promise<AlertaZona[]> {
  const [zonasRes, ultimasRes] = await Promise.all([
    bd.query<{ zona: string }>('SELECT DISTINCT zona FROM hogares'),
    bd.query(
      `SELECT DISTINCT ON (m.hogar_id) m.hogar_id, h.zona, m.fecha, m.semaforo_por_parametro
         FROM mediciones m
         JOIN hogares h ON h.id = m.hogar_id
        ORDER BY m.hogar_id, m.fecha DESC`,
    ),
  ]);
  const ultimas: FilaUltimaMedicion[] = ultimasRes.rows.map((f) => ({
    hogar_id: String(f.hogar_id),
    zona: String(f.zona),
    fecha: f.fecha,
    semaforo_por_parametro: f.semaforo_por_parametro,
  }));
  return calcularAlertas(
    zonasRes.rows.map((z) => z.zona),
    ultimas,
    hoy,
  );
}
