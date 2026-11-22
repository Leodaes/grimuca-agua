import type { ReactNode } from 'react';
import { unir } from './utilidades';

export type TonoInsignia = 'ok' | 'error' | 'aviso' | 'azul' | 'oscuro' | 'neutro';

export interface PropsInsignia {
  /** Texto corto de la insignia. */
  children: ReactNode;
  /** Color: ok (verde), error (rojo), aviso (ámbar), azul, oscuro o neutro. */
  tono?: TonoInsignia;
  /** Muestra un punto de estado antes del texto. */
  punto?: boolean;
  /** Clases extra. */
  className?: string;
}

/** Etiqueta pequeña de estado: "Simulación", "Nuevo", "En vivo", "Faltan 4". */
export function Insignia({ children, tono = 'neutro', punto = false, className }: PropsInsignia) {
  return (
    <span className={unir('g-insignia', `g-insignia--${tono}`, className)}>
      {punto && <span className="g-insignia__punto" aria-hidden="true" />}
      {children}
    </span>
  );
}
