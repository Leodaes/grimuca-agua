import type { RouteObject } from 'react-router-dom';
import { PaginaCentro } from './PaginaCentro';

/** Página pública de un centro de llenado: sus resultados, sin sesión. */
export const rutasCentros: RouteObject[] = [{ path: '/centros/:tiendaId', element: <PaginaCentro /> }];
