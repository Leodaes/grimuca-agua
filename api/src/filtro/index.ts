// Filtro del hogar: identificación por foto, cartuchos compatibles y conversión de la fila del hogar.
import { aJson } from '../bd';
import {
  MEDIDAS_CARTUCHO,
  NOMBRES_TIPO_FILTRO,
  TIPOS_FILTRO,
  type ConfianzaFiltro,
  type FiltroHogar,
  type MedidaCartucho,
  type TipoFiltro,
} from '../tipos';

export { identificarFiltro, FILTRO_SIMULADO } from './identificar';
export type { FiltroIdentificado, ResultadoIdentificacion } from './identificar';
export {
  cartuchosParaFiltro,
  equiposDelCatalogo,
  esEquipo,
  etapasDelNombre,
  funcionDe,
  medidaDelNombre,
  medidaEstandar,
  tipoDelModelo,
  MAXIMO_CARTUCHOS_FILTRO,
} from './compatibles';
export type { ProductoCatalogo, FiltroParaCartuchos } from './compatibles';

/** Lo que se guarda en `hogares.filtro_detalle`. */
export interface DetalleFiltro {
  modelo_nombre?: string | null;
  marca_visible?: string | null;
  modelo_visible?: string | null;
  confianza?: ConfianzaFiltro | null;
  observaciones?: string | null;
}

/** Arma el `FiltroHogar` desde la fila de `hogares`; null si no tiene filtro o aún no se registró. */
export function filaAFiltro(fila: Record<string, unknown>): FiltroHogar | null {
  if (!fila.tiene_filtro) return null;
  const tipo = fila.filtro_tipo as string | null | undefined;
  if (!tipo || !(TIPOS_FILTRO as readonly string[]).includes(tipo)) return null;
  const detalle = aJson<DetalleFiltro | null>(fila.filtro_detalle) ?? {};
  const medida = fila.filtro_medida as string | null | undefined;
  const etapas = fila.etapas_filtro;
  return {
    tipo: tipo as TipoFiltro,
    tipo_nombre: NOMBRES_TIPO_FILTRO[tipo as TipoFiltro],
    etapas: etapas === null || etapas === undefined ? null : Number(etapas),
    medida: medida && (MEDIDAS_CARTUCHO as readonly string[]).includes(medida) ? (medida as MedidaCartucho) : null,
    modelo_codigo: (fila.filtro_modelo_codigo as string | null | undefined) ?? null,
    modelo_nombre: detalle.modelo_nombre ?? null,
    marca_visible: detalle.marca_visible ?? null,
    modelo_visible: detalle.modelo_visible ?? null,
    confianza: detalle.confianza ?? null,
    origen: fila.filtro_origen === 'foto' ? 'foto' : 'manual',
    observaciones: detalle.observaciones ?? null,
  };
}
