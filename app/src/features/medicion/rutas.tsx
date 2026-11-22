import type { RouteObject } from 'react-router-dom';
import { PaginaManual } from './PaginaManual';
import { PaginaMedir } from './PaginaMedir';

export const rutasMedicion: RouteObject[] = [
  { path: '/medir', element: <PaginaMedir /> },
  { path: '/medir/manual', element: <PaginaManual /> },
];
