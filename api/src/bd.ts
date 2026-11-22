// Conexión a Postgres y utilidades para leer filas.
import pg from 'pg';
import type { Pool } from 'pg';

export type Bd = Pool;

// Las columnas `date` se devuelven como texto 'AAAA-MM-DD' (sin convertirlas a Date con zona horaria).
const OID_DATE = 1082;
pg.types.setTypeParser(OID_DATE, (valor: string) => valor);

export function crearBd(urlBd: string): Bd {
  const bd = new pg.Pool({
    connectionString: urlBd,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  // Un error en una conexión inactiva no debe tumbar el proceso.
  bd.on('error', (error) => {
    console.error('[bd] error en una conexión inactiva:', error.message);
  });
  return bd;
}

export async function bdResponde(bd: Bd): Promise<boolean> {
  try {
    await bd.query('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}

/** Marca de tiempo a texto ISO. */
export function aIso(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString();
  return new Date(String(valor)).toISOString();
}

export function aIsoONulo(valor: unknown): string | null {
  return valor === null || valor === undefined ? null : aIso(valor);
}

/** Columna `date` a 'AAAA-MM-DD'. */
export function aDia(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

export function aNumeroONulo(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/** Columna `jsonb`: el controlador ya la entrega como objeto; se tolera texto. */
export function aJson<T>(valor: unknown): T {
  return (typeof valor === 'string' ? JSON.parse(valor) : valor) as T;
}

/** Código de error de Postgres (por ejemplo '23505' para duplicados), si lo hay. */
export function codigoPg(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const codigo = (error as { code?: unknown }).code;
    return typeof codigo === 'string' ? codigo : undefined;
  }
  return undefined;
}
