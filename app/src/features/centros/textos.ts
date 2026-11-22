// Textos de los centros de llenado con resultados públicos (docs/negocio/idea-centros-de-llenado.md).
// Regla de Leonardo: se publica todo y Grimuca no dice si el agua es buena o mala. Reglas de Legal
// (docs/legal/puede-y-no-puede-decir.md): nunca "verificado", "certificado", "potable", "segura", "apta"
// ni "agua de calidad".
import type { CasillaCentro, MedicionCentro, Nivel, ResultadoBacteriasCentro } from '../../lib/tipos';
import { DIAS_VIGENCIA_MEDICION_CENTRO } from '../../lib/tipos';

export const NOMBRE_CENTRO = 'Centro con resultados públicos';

export const AVISO_CENTRO = 'Medición orientativa con tira, no es un análisis de laboratorio.';

export const TEXTO_VENCIDA = `Medición vencida: tiene más de ${DIAS_VIGENCIA_MEDICION_CENTRO} días.`;

export const TEXTO_SIN_CENTROS = 'Todavía no hay centros con resultados públicos cerca de ti.';

export const TEXTO_DEMOSTRACION = 'Comercio de demostración';

/** Etiqueta de cada casilla frente a la referencia (las mismas del resultado del hogar). */
export const ETIQUETA_NIVEL_CENTRO: Record<Nivel, string> = {
  verde: 'En rango',
  amarillo: 'Para vigilar',
  rojo: 'Fuera de rango',
  sin_dato: 'Sin dato',
};

export const TEXTO_FRASCO: Record<ResultadoBacteriasCentro, string> = {
  cambio: 'El frasco cambió de color: posible presencia de bacterias coliformes en la muestra.',
  sin_cambio: 'La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua.',
  pendiente: 'El frasco se lee a las 48 horas.',
};

/** 7.2 → "7,2" (decimales con coma, como en Venezuela). */
export function numero(valor: number): string {
  return valor.toLocaleString('es-VE', { maximumFractionDigits: 2 });
}

/** "de 6,5 a 8,5", "hasta 10", "desde 0,2" o null si la referencia no tiene límites. */
export function textoReferencia(casilla: Pick<CasillaCentro, 'referencia_desde' | 'referencia_hasta' | 'unidad'>): string | null {
  const { referencia_desde: desde, referencia_hasta: hasta, unidad } = casilla;
  const conUnidad = (texto: string) => (unidad ? `${texto} ${unidad}` : texto);
  if (desde !== null && hasta !== null) return conUnidad(`de ${numero(desde)} a ${numero(hasta)}`);
  if (hasta !== null) return conUnidad(`hasta ${numero(hasta)}`);
  if (desde !== null) return conUnidad(`desde ${numero(desde)}`);
  return null;
}

/** "Valor: 7,2 mg/L" o "Sin lectura". */
export function textoValor(casilla: Pick<CasillaCentro, 'valor' | 'unidad'>): string {
  if (casilla.valor === null) return 'Sin lectura';
  return casilla.unidad ? `${numero(casilla.valor)} ${casilla.unidad}` : numero(casilla.valor);
}

/** "6 de 8 casillas en rango" (el conteo publicado). */
export function textoConteo(medicion: Pick<MedicionCentro, 'casillas_en_rango' | 'casillas_leidas'>): string {
  const { casillas_en_rango: enRango, casillas_leidas: leidas } = medicion;
  return `${enRango} de ${leidas} ${leidas === 1 ? 'casilla' : 'casillas'} en rango`;
}

/** 2,4 → "a unos 2,4 km". */
export function textoDistancia(km: number): string {
  return `a unos ${numero(km)} km`;
}

/** Fecha corta en español de Venezuela: "12 de noviembre de 2026". */
export function fechaCentro(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
}
