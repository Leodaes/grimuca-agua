// Logística del panel de tiendas: resumen, inventario y alertas por zona.
export {
  VIDA_UTIL_POR_DEFECTO_DIAS,
  calcularResumen,
  fechaRecambio,
  recambioEnVentana,
  resumenPorTienda,
  tiendaDelHogar,
} from './demanda';
export type { FilaHogarDemanda, FilaPedidoDemanda, FilaTienda } from './demanda';
export { calcularInventario, inventario } from './inventario';
export type { FilaCartucho, FilaStock } from './inventario';
export {
  DIAS_ALERTA,
  MINIMO_HOGARES_ALERTA,
  PARAMETROS_SALUD,
  alertasZona,
  calcularAlertas,
  parametrosSaludEnRojo,
} from './alertas';
export type { FilaUltimaMedicion } from './alertas';
