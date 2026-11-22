// Datos del comercio que entró al panel: dirección base (/comercio u /operador), su ficha y sus tiendas.
// Fuera del panel (pruebas de una pestaña sola) vale el comercio Grimuca con sus tres tiendas.
import { createContext, useContext } from 'react';
import type { Comercio } from '../../lib/tipos';
import { TIENDAS_OPERADOR } from './estadoPedidos';

export interface TiendaPanel {
  id: string;
  nombre: string;
}

export interface DatosPanel {
  /** '/comercio' u '/operador'. */
  base: string;
  token: string | null;
  comercio: Comercio | null;
  tiendas: readonly TiendaPanel[];
}

const POR_DEFECTO: DatosPanel = { base: '/operador', token: null, comercio: null, tiendas: TIENDAS_OPERADOR };

export const ContextoPanel = createContext<DatosPanel>(POR_DEFECTO);

export function usePanel(): DatosPanel {
  return useContext(ContextoPanel);
}

export function nombreDeTienda(tiendas: readonly TiendaPanel[], id: string): string {
  return tiendas.find((t) => t.id === id)?.nombre ?? id;
}

export const NOMBRE_PLAN: Record<string, string> = { basico: 'Plan Básico', premium: 'Plan Premium' };
