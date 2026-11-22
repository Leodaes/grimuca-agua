import type { RouteObject } from 'react-router-dom';
import { PaginaModulos } from './PaginaModulos';
import { PaginaRed } from './PaginaRed';

// Fuera del marco del cliente: /red (superadmin) y /modulos (portada de la demo).
export const rutasRed: RouteObject[] = [
  { path: '/red/*', element: <PaginaRed /> },
  { path: '/modulos', element: <PaginaModulos /> },
];
