import type { RouteObject } from 'react-router-dom';
import { PaginaBacterias } from './PaginaBacterias';
import { PaginaHistorial, RedireccionUltimo } from './PaginaHistorial';
import { PaginaResultado } from './PaginaResultado';

export const rutasResultado: RouteObject[] = [
  { path: '/resultado/ultimo', element: <RedireccionUltimo /> },
  { path: '/resultado/:id', element: <PaginaResultado /> },
  { path: '/resultados', element: <PaginaHistorial /> },
  { path: '/bacterias', element: <PaginaBacterias /> },
];
