import { useRoutes, type RouteObject } from 'react-router-dom';
import { Marco } from './Marco';
import { rutasAlta } from './features/alta/rutas';
import { rutasMedicion } from './features/medicion/rutas';
import { rutasResultado } from './features/resultado/rutas';
import { rutasPedido } from './features/pedido/rutas';
import { rutasOperador } from './features/operador/rutas';

function NoEncontrada() {
  return (
    <main id="contenido" className="g-pantalla__contenido">
      <h1 className="g-h1">Página no encontrada</h1>
      <p>
        <a href="/">Volver al inicio</a>
      </p>
    </main>
  );
}

const rutas: RouteObject[] = [
  ...rutasOperador,
  {
    element: <Marco />,
    children: [...rutasAlta, ...rutasMedicion, ...rutasResultado, ...rutasPedido, { path: '*', element: <NoEncontrada /> }],
  },
];

export function App() {
  return useRoutes(rutas);
}
