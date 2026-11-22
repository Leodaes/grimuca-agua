// Lee y valida las variables de entorno. Ver `.env.example` en la raíz del repositorio.
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Carpeta `api/` (este archivo vive en `api/src/`). */
export const RAIZ_API = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Raíz del repositorio. */
export const RAIZ_REPO = path.resolve(RAIZ_API, '..');

const textoOpcional = z
  .string()
  .optional()
  .transform((valor) => {
    const limpio = valor?.trim();
    return limpio ? limpio : undefined;
  });

const esquemaEntorno = z.object({
  PUERTO: z.coerce.number().int().min(1).max(65535).default(3070),
  DATABASE_URL: textoOpcional,
  PIN_OPERADOR: textoOpcional,
  PINES_COMERCIOS: textoOpcional,
  PIN_SUPERADMIN: textoOpcional,
  PIN_TECNICO: textoOpcional,
  SECRETO_SESION: textoOpcional,
  VISION_API_URL: textoOpcional,
  VISION_API_KEY: textoOpcional,
  VISION_MODELO: textoOpcional,
  LECTOR_SIMULADO: textoOpcional,
  MARCAS_EXCLUIDAS: textoOpcional,
  DIR_ESTATICOS: textoOpcional,
});

export interface Config {
  puerto: number;
  /** Cadena de conexión de Postgres. Obligatoria para arrancar el servidor y para migrar. */
  urlBd: string | null;
  /** PIN del panel del operador. Si falta, nadie puede entrar al panel. */
  pinOperador: string | null;
  /** PIN de cada comercio aliado (`PINES_COMERCIOS`, JSON `{"aliado-lara":"…"}`). `PIN_OPERADOR` es el de `grimuca`. */
  pinesComercios: Record<string, string>;
  /** PIN de la red (superadmin). Sin él, nadie entra a /red. */
  pinSuperadmin: string | null;
  /** PIN del técnico del comercio `grimuca`. Sin él, nadie entra a /tecnico. */
  pinTecnico: string | null;
  /** Secreto con el que se firman los tokens del operador. */
  secretoSesion: string;
  /** true si el secreto se generó al arrancar (los tokens dejan de valer al reiniciar). */
  secretoEfimero: boolean;
  /** Marcas que no se sugieren (en minúsculas). */
  marcasExcluidas: string[];
  /** Carpeta absoluta del front compilado. */
  dirEstaticos: string;
  /** true si la lectura de la tira va simulada (sin red). */
  lectorSimulado: boolean;
  version: string;
  /** Avisos de configuración para mostrar al arrancar. */
  avisos: string[];
}

export class ErrorConfig extends Error {}

/**
 * `PINES_COMERCIOS`: JSON `{ "<id del comercio>": "<PIN>" }`. Si no se entiende, se ignora con un aviso
 * (el servidor arranca igual y los aliados no pueden entrar). Las entradas vacías o no texto se descartan.
 */
export function leerPinesComercios(texto: string | undefined, avisos: string[] = []): Record<string, string> {
  if (!texto) return {};
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch {
    avisos.push('PINES_COMERCIOS no es un JSON válido: se ignora (solo entra Grimuca con PIN_OPERADOR).');
    return {};
  }
  if (typeof dato !== 'object' || dato === null || Array.isArray(dato)) {
    avisos.push('PINES_COMERCIOS debe ser un objeto {"id-del-comercio":"PIN"}: se ignora.');
    return {};
  }
  const pines: Record<string, string> = {};
  for (const [id, pin] of Object.entries(dato as Record<string, unknown>)) {
    if (typeof pin !== 'string' || !pin.trim() || !/^[a-z0-9-]{1,60}$/.test(id)) continue;
    pines[id] = pin.trim();
  }
  return pines;
}

export function cargarConfig(entorno: Record<string, string | undefined> = process.env): Config {
  const leido = esquemaEntorno.safeParse(entorno);
  if (!leido.success) {
    const detalle = leido.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ErrorConfig(`Variables de entorno inválidas. ${detalle}`);
  }
  const v = leido.data;
  const avisos: string[] = [];

  if (!v.PIN_OPERADOR) {
    avisos.push('Falta PIN_OPERADOR: el panel del operador queda cerrado hasta que se configure.');
  }

  let secretoSesion = v.SECRETO_SESION ?? '';
  let secretoEfimero = false;
  if (secretoSesion.length < 16) {
    avisos.push(
      'Falta SECRETO_SESION (mínimo 16 caracteres): se generó uno temporal y las sesiones del operador se cierran al reiniciar.',
    );
    secretoSesion = randomBytes(32).toString('hex');
    secretoEfimero = true;
  }

  const lectorSimulado = v.LECTOR_SIMULADO === '1' || !v.VISION_API_KEY;
  if (!lectorSimulado && (!v.VISION_API_URL || !v.VISION_MODELO)) {
    avisos.push('Faltan VISION_API_URL o VISION_MODELO: las fotos no se podrán leer (queda la carga manual).');
  }

  const marcasExcluidas = (v.MARCAS_EXCLUIDAS ?? '')
    .split(',')
    .map((marca) => marca.trim().toLowerCase())
    .filter(Boolean);

  const dirEstaticos = path.resolve(RAIZ_API, v.DIR_ESTATICOS ?? '../app/dist');

  const pinesComercios = leerPinesComercios(v.PINES_COMERCIOS, avisos);

  return {
    puerto: v.PUERTO,
    urlBd: v.DATABASE_URL ?? null,
    pinOperador: v.PIN_OPERADOR ?? null,
    pinesComercios,
    pinSuperadmin: v.PIN_SUPERADMIN ?? null,
    pinTecnico: v.PIN_TECNICO ?? null,
    secretoSesion,
    secretoEfimero,
    marcasExcluidas,
    dirEstaticos,
    lectorSimulado,
    version: entorno.npm_package_version?.trim() || '0.1.0',
    avisos,
  };
}

/**
 * En desarrollo carga `.env` de la raíz del repositorio si existe.
 * En el servidor las variables llegan por el archivo de entorno del contenedor y esto no hace nada.
 */
export function cargarArchivoEntorno(ruta: string = path.join(RAIZ_REPO, '.env')): boolean {
  if (!existsSync(ruta)) return false;
  try {
    process.loadEnvFile(ruta);
    return true;
  } catch {
    return false;
  }
}
