import type { RouteObject } from 'react-router-dom';
import { PanelOperador } from './PanelOperador';

// `/comercio` es la dirección principal del panel; `/operador` sigue funcionando igual.
// Cada una muestra el PIN o, con sesión, lleva a `<base>/despacho`.
// Subrutas: despacho, resumen, inventario, productos, rutas y zonas.
export const rutasOperador: RouteObject[] = [
  { path: '/comercio/*', element: <PanelOperador base="/comercio" /> },
  { path: '/operador/*', element: <PanelOperador base="/operador" /> },
];
