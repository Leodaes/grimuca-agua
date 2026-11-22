import type { RouteObject } from 'react-router-dom';
import { PaginaFiltroManual } from './PaginaFiltroManual';
import { PaginaMiFiltro } from './PaginaMiFiltro';

export const rutasFiltro: RouteObject[] = [
  { path: '/mi-filtro', element: <PaginaMiFiltro /> },
  { path: '/mi-filtro/manual', element: <PaginaFiltroManual /> },
];
