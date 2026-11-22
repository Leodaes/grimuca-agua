import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icono } from './Icono';
import { unir } from './utilidades';

/** Ruta pública del logo blanco (para fondo azul). */
export const LOGO_BLANCO = '/marca/logo-horizontal-blanco.png';
/** Ruta pública del logo azul (para fondo claro). */
export const LOGO_AZUL = '/marca/logo-horizontal-azul.png';

export interface PropsEncabezado {
  /** cliente (56px) u operador (64px, logo más grande). */
  variante?: 'cliente' | 'operador';
  /** A dónde lleva el logo (por defecto "/"). */
  rutaInicio?: string;
  /** Si se indica, muestra la flecha de volver hacia esa ruta. */
  rutaAtras?: string;
  /** Título corto junto al logo: "Panel de despacho". */
  titulo?: string;
  /** Contenido a la derecha: insignia de conexión, botón Salir. */
  acciones?: ReactNode;
  /** Franja inferior, por ejemplo las pestañas del operador dentro de `g-pestanas`. */
  children?: ReactNode;
  /** Clases extra. */
  className?: string;
}

/** Encabezado azul con el logo blanco de Grimuca; queda pegado arriba. */
export function Encabezado({
  variante = 'cliente',
  rutaInicio = '/',
  rutaAtras,
  titulo,
  acciones,
  children,
  className,
}: PropsEncabezado) {
  return (
    <header className={unir('g-encabezado', `g-encabezado--${variante}`, className)}>
      <div className="g-encabezado__barra g-sobre-azul">
        {rutaAtras && (
          <Link to={rutaAtras} className="g-encabezado__atras" aria-label="Volver">
            <Icono nombre="atras" />
          </Link>
        )}
        <Link to={rutaInicio} className="g-encabezado__logo" aria-label="Grimuca Agua, ir al inicio">
          <img src={LOGO_BLANCO} alt="Grimuca" />
        </Link>
        {titulo && <span className="g-encabezado__titulo">{titulo}</span>}
        {acciones && <div className="g-encabezado__acciones">{acciones}</div>}
      </div>
      {children}
    </header>
  );
}
