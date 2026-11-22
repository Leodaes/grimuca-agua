// Aplica las migraciones de `db/migraciones` en orden y las anota en la tabla `migraciones`.
// Uso: `npm run migrar -w api` · con datos de demostración: `npm run migrar -w api -- --semilla`
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearBd, type Bd } from './bd';
import { cargarArchivoEntorno, cargarConfig, RAIZ_REPO } from './config';

export const DIR_DB = path.join(RAIZ_REPO, 'db');

export interface OpcionesMigrar {
  /** Carpeta `db/` (con `migraciones/`, `semilla_cartuchos.sql` y `semilla.sql`). */
  dirDb?: string;
  /** Carga también el catálogo y, si no hay hogares, los datos de demostración. */
  semilla?: boolean;
  avisar?: (mensaje: string) => void;
}

export interface ResultadoMigrar {
  /** Migraciones aplicadas en esta corrida. */
  aplicadas: string[];
  /** Semillas aplicadas en esta corrida. */
  semillas: string[];
}

/** Ejecuta un archivo SQL completo dentro de una transacción. */
async function ejecutarEnTransaccion(bd: Bd, sql: string, despues?: { texto: string; valores: unknown[] }) {
  const cliente = await bd.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(sql);
    if (despues) await cliente.query(despues.texto, despues.valores);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}

async function migracionesAplicadas(bd: Bd): Promise<Set<string>> {
  try {
    const { rows } = await bd.query('SELECT nombre FROM migraciones');
    return new Set(rows.map((fila) => String(fila.nombre)));
  } catch {
    // Primera corrida: la tabla todavía no existe.
    await bd.query(
      'CREATE TABLE migraciones (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())',
    );
    return new Set();
  }
}

async function contar(bd: Bd, tabla: 'hogares' | 'cartuchos'): Promise<number> {
  const { rows } = await bd.query(`SELECT count(*) AS total FROM ${tabla}`);
  return Number(rows[0].total);
}

export async function migrar(bd: Bd, opciones: OpcionesMigrar = {}): Promise<ResultadoMigrar> {
  const dirDb = opciones.dirDb ?? DIR_DB;
  const avisar = opciones.avisar ?? (() => {});
  const dirMigraciones = path.join(dirDb, 'migraciones');
  const resultado: ResultadoMigrar = { aplicadas: [], semillas: [] };

  const archivos = readdirSync(dirMigraciones)
    .filter((nombre) => /^\d+_.+\.sql$/.test(nombre))
    .sort();
  const yaAplicadas = await migracionesAplicadas(bd);

  for (const nombre of archivos) {
    if (yaAplicadas.has(nombre)) continue;
    const sql = readFileSync(path.join(dirMigraciones, nombre), 'utf8');
    try {
      await ejecutarEnTransaccion(bd, sql, {
        texto: 'INSERT INTO migraciones (nombre) VALUES ($1)',
        valores: [nombre],
      });
    } catch (error) {
      throw new Error(`La migración ${nombre} falló y no se aplicó: ${(error as Error).message}`);
    }
    resultado.aplicadas.push(nombre);
    avisar(`migración aplicada: ${nombre}`);
  }
  if (resultado.aplicadas.length === 0) avisar('migraciones: nada nuevo que aplicar');

  if (opciones.semilla) {
    // 1) Catálogo. El archivo actualiza los productos que ya existen, así que se puede repetir.
    const rutaCatalogo = path.join(dirDb, 'semilla_cartuchos.sql');
    if (existsSync(rutaCatalogo)) {
      try {
        await ejecutarEnTransaccion(bd, readFileSync(rutaCatalogo, 'utf8'));
        resultado.semillas.push('semilla_cartuchos.sql');
        avisar('catálogo cargado: semilla_cartuchos.sql');
      } catch (error) {
        if ((await contar(bd, 'cartuchos')) === 0) {
          throw new Error(`El catálogo (semilla_cartuchos.sql) no se pudo cargar: ${(error as Error).message}`);
        }
        avisar(`catálogo: no se pudo actualizar y se deja el que ya estaba (${(error as Error).message})`);
      }
    } else {
      avisar('catálogo: no existe db/semilla_cartuchos.sql; se omite');
    }

    // 2) Datos de demostración, solo si todavía no hay hogares.
    if ((await contar(bd, 'hogares')) === 0) {
      try {
        await ejecutarEnTransaccion(bd, readFileSync(path.join(dirDb, 'semilla.sql'), 'utf8'));
      } catch (error) {
        throw new Error(`Los datos de demostración (semilla.sql) no se cargaron: ${(error as Error).message}`);
      }
      resultado.semillas.push('semilla.sql');
      avisar('datos de demostración cargados: semilla.sql');
    } else {
      avisar('datos de demostración: ya hay hogares; no se toca nada');
    }
  }

  return resultado;
}

async function principal(): Promise<void> {
  cargarArchivoEntorno();
  const config = cargarConfig();
  if (!config.urlBd) {
    console.error('[migrar] Falta DATABASE_URL.');
    process.exit(1);
  }
  const bd = crearBd(config.urlBd);
  try {
    await migrar(bd, {
      semilla: process.argv.includes('--semilla'),
      avisar: (mensaje) => console.log(`[migrar] ${mensaje}`),
    });
    console.log('[migrar] listo');
  } catch (error) {
    console.error(`[migrar] ${(error as Error).message}`);
    process.exitCode = 1;
  } finally {
    await bd.end();
  }
}

const esEjecucionDirecta =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esEjecucionDirecta) void principal();
