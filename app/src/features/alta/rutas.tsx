import type { RouteObject } from 'react-router-dom';
import { Bienvenida } from './Bienvenida';
import { Envio } from './Envio';
import { Privacidad, Terminos } from './Legales';
import { Pago } from './Pago';
import { Perfil } from './Perfil';
import { Tiendas } from './Tiendas';

export const rutasAlta: RouteObject[] = [
  { path: '/', element: <Bienvenida /> },
  { path: '/perfil', element: <Perfil /> },
  { path: '/envio', element: <Envio /> },
  { path: '/pago', element: <Pago /> },
  { path: '/tiendas', element: <Tiendas /> },
  { path: '/privacidad', element: <Privacidad /> },
  { path: '/terminos', element: <Terminos /> },
];
