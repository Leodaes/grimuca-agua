import { useRoutes, type RouteObject } from 'react-router-dom';
import { rutasAlta } from './features/alta/rutas';
import { rutasMedicion } from './features/medicion/rutas';
import { rutasResultado } from './features/resultado/rutas';
import { rutasPedido } from './features/pedido/rutas';
import { rutasOperador } from './features/operador/rutas';

const rutas: RouteObject[] = [
  ...rutasAlta,
  ...rutasMedicion,
  ...rutasResultado,
  ...rutasPedido,
  ...rutasOperador,
  { path: '*', element: <p style={{ padding: 24 }}>Página no encontrada.</p> },
];

export function App() {
  return useRoutes(rutas);
}
