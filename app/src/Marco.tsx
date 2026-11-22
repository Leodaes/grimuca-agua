import { Outlet } from 'react-router-dom';
import { BarraInferior, Encabezado } from './components/grimuca';

/** Marco de las pantallas del cliente: encabezado azul arriba y barra de accesos abajo. Cada página pone su propio <main>. */
export function Marco() {
  return (
    <div className="g-pantalla g-pantalla--con-barra">
      <a className="g-pantalla__salto" href="#contenido">
        Saltar al contenido
      </a>
      <Encabezado variante="cliente" />
      <Outlet />
      <BarraInferior />
    </div>
  );
}
