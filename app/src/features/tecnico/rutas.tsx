import type { RouteObject } from 'react-router-dom';
import { PaginaTecnico } from './PaginaTecnico';

// Fuera del marco del cliente: /tecnico (una sola pantalla, pensada para teléfono).
export const rutasTecnico: RouteObject[] = [{ path: '/tecnico/*', element: <PaginaTecnico /> }];
