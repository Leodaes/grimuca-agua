import type { RouteObject } from 'react-router-dom';
import { PaginaExperto } from './PaginaExperto';
import { PaginaTutorial } from './PaginaTutorial';
import { PaginaTutoriales } from './PaginaTutoriales';

export const rutasTutoriales: RouteObject[] = [
  { path: '/tutoriales', element: <PaginaTutoriales /> },
  { path: '/tutoriales/:id', element: <PaginaTutorial /> },
  { path: '/experto', element: <PaginaExperto /> },
];
