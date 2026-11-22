// Componentes de Grimuca Agua. Requiere tokens.css cargado de forma global.
import './grimuca.css';

export { Aviso, AvisoTira, TEXTO_AVISO_TIRA } from './Aviso';
export type { PropsAviso, PropsAvisoTira, TonoAviso } from './Aviso';

export { BandaCifras } from './BandaCifras';
export type { CifraBanda, PropsBandaCifras } from './BandaCifras';

export { BarraInferior, WHATSAPP_MARCADOR } from './BarraInferior';
export type { PropsBarraInferior } from './BarraInferior';

export { Boton } from './Boton';
export type { PropsBoton, VarianteBoton } from './Boton';

export { CajonLista, ListaArticulos } from './CajonLista';
export type { ArticuloLista, PropsCajonLista, PropsListaArticulos } from './CajonLista';

export { Campo } from './Campo';
export type {
  OpcionCampo,
  PropsCampo,
  PropsCampoArea,
  PropsCampoEntrada,
  PropsCampoSelect,
} from './Campo';

export { Cargando } from './Cargando';
export type { PropsCargando } from './Cargando';

export { Casilla } from './Casilla';
export type { PropsCasilla } from './Casilla';

export { Chip } from './Chip';
export type { PropsChip } from './Chip';

export { Encabezado, LOGO_AZUL, LOGO_BLANCO } from './Encabezado';
export type { PropsEncabezado } from './Encabezado';

export { EstadoVacio } from './EstadoVacio';
export type { PropsEstadoVacio } from './EstadoVacio';

export { FilaParametro, ListaParametros } from './FilaParametro';
export type { PropsFilaParametro, PropsListaParametros } from './FilaParametro';

export { FilaPedido, ListaPedidos } from './FilaPedido';
export type { PropsFilaPedido, PropsListaPedidos } from './FilaPedido';

export { Icono } from './Icono';
export type { NombreIcono, PropsIcono } from './Icono';

export { Insignia } from './Insignia';
export type { PropsInsignia, TonoInsignia } from './Insignia';

export { Pantalla } from './Pantalla';
export type { PropsPantalla } from './Pantalla';

export { Pasos } from './Pasos';
export type { Paso, PropsPasos } from './Pasos';

export { PALABRA_SEMAFORO, Semaforo } from './Semaforo';
export type { NivelSemaforo, PropsSemaforo } from './Semaforo';

export { TarjetaProducto } from './TarjetaProducto';
export type { PropsTarjetaProducto } from './TarjetaProducto';

export { TarjetaTienda } from './TarjetaTienda';
export type { CifraTienda, PropsTarjetaTienda } from './TarjetaTienda';

export { Temporizador } from './Temporizador';
export type { FaseTemporizador, PropsTemporizador } from './Temporizador';

export { Toast } from './Toast';
export type { AccionToast, PropsToast } from './Toast';

export { formatoUsd, unir } from './utilidades';
