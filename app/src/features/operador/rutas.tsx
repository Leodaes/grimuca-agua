import type { RouteObject } from 'react-router-dom';
import { PanelOperador } from './PanelOperador';

// `/operador` muestra el PIN o, con sesión, lleva a `/operador/despacho`.
// Subrutas: /operador/despacho, /operador/resumen, /operador/inventario, /operador/zonas.
export const rutasOperador: RouteObject[] = [{ path: '/operador/*', element: <PanelOperador /> }];
