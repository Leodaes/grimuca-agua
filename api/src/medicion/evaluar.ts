// Convierte los valores de una medición en el semáforo, las frases y lo que hay que corregir.

import type {
  ClaveParametro,
  Evaluacion,
  PerfilHogar,
  Nivel,
  ParametroTira,
  ResultadoParametro,
  ValoresMedicion,
} from '../tipos';
import { parametros, tira } from './config/tira';
import {
  ajustesVidaUtil,
  cartuchosPorEtapas,
  CORRIGE_AGUA_TURBIA,
  CORRIGE_DESINFECCION,
  DIAS_POR_MES,
  ETAPAS_POR_DEFECTO,
  FRASE_SIN_DATO,
  ORIGENES_CON_DESINFECCION,
  reglaSinCloro,
  tramoDe,
  umbrales,
  vidaUtilMeses,
} from './config/umbrales';

export type PerfilAgua = PerfilHogar;

const GRAVEDAD: Record<Nivel, number> = { sin_dato: 0, verde: 1, amarillo: 2, rojo: 3 };
const TOLERANCIA = 1e-9;

function esNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

/**
 * Lleva una lectura a una casilla de la tira. Si cae entre dos casillas, toma la más alta.
 * Por debajo de la primera casilla queda en la primera; por encima de la última, en la última.
 */
export function ajustarACasilla(valor: number, niveles: number[]): number {
  if (niveles.length === 0) return valor;
  const ordenados = [...niveles].sort((a, b) => a - b);
  for (const nivel of ordenados) {
    if (valor <= nivel + TOLERANCIA) return nivel;
  }
  return ordenados[ordenados.length - 1];
}

/**
 * Evalúa una medición.
 * - Semáforo general = el peor nivel entre las casillas leídas; si no hay ninguna, `sin_dato`.
 * - Una casilla ausente o en `null` queda en `sin_dato`, nunca en verde.
 * - `corrige` suma lo que pide cada hallazgo y las reglas del perfil del hogar.
 */
export function evaluarAgua(valores: ValoresMedicion, perfil?: PerfilAgua, hoy: Date = new Date()): Evaluacion {
  // Casillas de la tira en uso, más cualquier otra que venga con valor (por ejemplo, hierro).
  const definiciones: ParametroTira[] = [...tira];
  for (const clave of Object.keys(valores) as ClaveParametro[]) {
    if (clave in umbrales && esNumero(valores[clave]) && !definiciones.some((p) => p.clave === clave)) {
      definiciones.push(parametros[clave]);
    }
  }
  const enLaTira = new Set(tira.map((p) => p.clave));

  const porParametro: ResultadoParametro[] = [];
  const corrige: string[] = [];
  const agregar = (claves: string[]) => {
    for (const clave of claves) if (!corrige.includes(clave)) corrige.push(clave);
  };

  for (const definicion of definiciones) {
    const base = {
      clave: definicion.clave,
      nombre: definicion.nombre,
      unidad: definicion.unidad,
      orientativo: definicion.orientativo,
    };
    const bruto = valores[definicion.clave];
    if (!esNumero(bruto)) {
      porParametro.push({ ...base, valor: null, nivel: 'sin_dato', frase: FRASE_SIN_DATO });
      continue;
    }

    const valor = enLaTira.has(definicion.clave) ? ajustarACasilla(bruto, definicion.niveles) : bruto;
    const tramo = tramoDe(definicion.clave, valor);
    let nivel: Nivel = tramo.nivel;
    let frase = tramo.frase;
    let aporta = tramo.corrige;

    if (
      definicion.clave === 'cloro_libre' &&
      valor === 0 &&
      reglaSinCloro.activa &&
      perfil &&
      !perfil.tiene_filtro &&
      reglaSinCloro.origenes.includes(perfil.origen_agua)
    ) {
      nivel = 'amarillo';
      frase = reglaSinCloro.frase;
      aporta = reglaSinCloro.corrige;
    }

    porParametro.push({ ...base, valor, nivel, frase });
    agregar(aporta);
  }

  if (perfil?.agua_turbia) agregar([CORRIGE_AGUA_TURBIA]);
  if (perfil && ORIGENES_CON_DESINFECCION.includes(perfil.origen_agua)) agregar([CORRIGE_DESINFECCION]);

  const semaforo = porParametro.reduce<Nivel>(
    (peor, p) => (GRAVEDAD[p.nivel] > GRAVEDAD[peor] ? p.nivel : peor),
    'sin_dato',
  );

  const hallazgos = [
    ...porParametro.filter((p) => p.nivel === 'rojo'),
    ...porParametro.filter((p) => p.nivel === 'amarillo'),
  ].map((p) => p.frase);

  return {
    semaforo,
    porParametro,
    hallazgos,
    corrige,
    diasParaRecambio: perfil ? diasParaRecambio(perfil, hoy) : null,
  };
}

/** Días calendario entre una fecha AAAA-MM-DD y hoy. `null` si la fecha no es válida. */
function diasDesde(fechaCruda: unknown, hoy: Date): number | null {
  // La base puede devolver la fecha como texto o como objeto Date.
  const fecha =
    fechaCruda instanceof Date && !Number.isNaN(fechaCruda.getTime())
      ? fechaCruda.toISOString()
      : String(fechaCruda);
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (!partes) return null;
  const inicio = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  if (Number.isNaN(inicio)) return null;
  const fin = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.floor((fin - inicio) / 86_400_000);
}

/**
 * Días que faltan para el próximo cambio de cartucho (orientativo).
 * Toma el cartucho que vence primero según las etapas del filtro, ajusta por agua turbia y
 * por cuántos viven en la casa, y resta los días desde el último cambio.
 * Negativo = recambio vencido. `null` si no hay filtro o no se sabe la fecha del último cambio.
 */
export function diasParaRecambio(
  perfil: Pick<PerfilAgua, 'tiene_filtro' | 'etapas_filtro' | 'fecha_ultimo_cambio' | 'agua_turbia' | 'personas'>,
  hoy: Date = new Date(),
): number | null {
  if (!perfil.tiene_filtro || !perfil.fecha_ultimo_cambio) return null;
  const transcurridos = diasDesde(perfil.fecha_ultimo_cambio, hoy);
  if (transcurridos === null) return null;

  const etapasDeclaradas = esNumero(perfil.etapas_filtro) && perfil.etapas_filtro >= 1 ? perfil.etapas_filtro : ETAPAS_POR_DEFECTO;
  const etapas = Math.min(Math.round(etapasDeclaradas), 5);
  const cartuchos = cartuchosPorEtapas[etapas] ?? cartuchosPorEtapas[ETAPAS_POR_DEFECTO];

  const factorPersonas =
    perfil.personas >= ajustesVidaUtil.personasDesde ? ajustesVidaUtil.factorMuchasPersonas : 1;

  const vidaMasCorta = Math.min(
    ...cartuchos.map((tipo) => {
      let dias = vidaUtilMeses[tipo] * DIAS_POR_MES * factorPersonas;
      if (tipo === 'sedimentos' && perfil.agua_turbia) dias *= ajustesVidaUtil.sedimentosConAguaTurbia;
      return dias;
    }),
  );

  return Math.round(vidaMasCorta) - transcurridos;
}
