import { Outlet, useLocation } from 'react-router-dom';
import { BarraInferior, Encabezado } from './components/grimuca';
import { hogarId } from './lib/sesion';

/**
 * Marco de las pantallas del cliente: encabezado azul arriba y barra de accesos abajo. Cada página pone su propio <main>.
 * En la portada sin hogar en sesión no va la barra de accesos: la portada pone su propia barra fija de compra.
 */
export function Marco() {
  const { pathname } = useLocation();
  const portadaDeVenta = pathname === '/' && !hogarId();
  return (
    <div className={portadaDeVenta ? 'g-pantalla' : 'g-pantalla g-pantalla--con-barra'}>
      <a className="g-pantalla__salto" href="#contenido">
        Saltar al contenido
      </a>
      <Encabezado variante="cliente" />
      <Outlet />
      {!portadaDeVenta && <BarraInferior />}
    </div>
  );
}
