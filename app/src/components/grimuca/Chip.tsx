import type { MouseEventHandler, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { unir } from './utilidades';

export interface PropsChip {
  /** Texto del chip. */
  children: ReactNode;
  /** Marca el chip como elegido (solo cuando es botón). */
  activo?: boolean;
  /** Ruta interna: el chip pasa a ser un enlace que se marca solo cuando la ruta coincide. */
  a?: string;
  /** Con `a`: exige coincidencia exacta de la ruta. */
  exacto?: boolean;
  /** Acción al pulsar. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Bloquea el chip (solo cuando es botón). */
  disabled?: boolean;
  /** Clases extra. */
  className?: string;
}

/** Chip de filtro, de opción o de pestaña: 44px, radio 2px, azul cuando está activo. */
export function Chip({
  children,
  activo = false,
  a,
  exacto = false,
  onClick,
  disabled = false,
  className,
}: PropsChip) {
  const clases = unir('g-chip', className);

  if (a) {
    return (
      <NavLink to={a} end={exacto} className={clases} onClick={onClick}>
        {children}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={clases}
      aria-pressed={activo}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
