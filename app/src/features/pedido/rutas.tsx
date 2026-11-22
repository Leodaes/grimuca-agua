import type { RouteObject } from 'react-router-dom';
import { PaginaLista } from './PaginaLista';
import { PaginaPedido } from './PaginaPedido';

export const rutasPedido: RouteObject[] = [
  { path: '/lista', element: <PaginaLista /> },
  { path: '/pedido/:id', element: <PaginaPedido /> },
];
