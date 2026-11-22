import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icono } from './Icono';
import { unir } from './utilidades';

export interface PropsCasilla
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** Texto de la casilla; puede llevar enlaces (por ejemplo, al aviso de privacidad). */
  children: ReactNode;
  /** Mensaje de error debajo de la casilla. */
  error?: string;
}

/** Casilla de verificación nativa con etiqueta pulsable y zona táctil de 44px. */
export function Casilla({ children, error, id, className, ...resto }: PropsCasilla) {
  const idAutomatico = useId();
  const idFinal = id ?? idAutomatico;
  const idError = `${idFinal}-error`;

  return (
    <div className={unir('g-casilla', className)}>
      <div className="g-casilla__fila">
        <input
          {...resto}
          id={idFinal}
          type="checkbox"
          className="g-casilla__control"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
        />
        <label className="g-casilla__etiqueta" htmlFor={idFinal}>
          {children}
        </label>
      </div>
      {error && (
        <p className="g-campo__error" id={idError}>
          <Icono nombre="alerta" tamano={18} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
