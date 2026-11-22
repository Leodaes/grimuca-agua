import { useSearchParams } from 'react-router-dom';
import { hogarId } from '../../lib/sesion';
import { PortadaVenta } from './portada/PortadaVenta';
import { Tablero } from './portada/Tablero';

export { LEMA, PROMESA } from './portada/Banners';

/**
 * Portada (/).
 * Sin hogar en este teléfono: página de venta del sobre de $9 (con ?sobre=1, llegada desde el QR del sobre,
 * el botón principal pasa a ser "Ya tengo mi sobre").
 * Con hogar: tablero corto con el último resultado y los accesos.
 */
export function Bienvenida() {
  const id = hogarId();
  const [parametros] = useSearchParams();
  if (id) return <Tablero id={id} />;
  return <PortadaVenta desdeSobre={parametros.get('sobre') === '1'} />;
}
