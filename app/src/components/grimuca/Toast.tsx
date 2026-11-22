import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface AccionToast {
  /** Texto de la acción: "Ver mi lista", "Ver despacho". */
  etiqueta: string;
  /** Qué hacer al pulsarla. */
  alPulsar: () => void;
}

export interface PropsToast {
  /** Mensaje corto. */
  mensaje: ReactNode;
  /** Muestra u oculta el mensaje. */
  visible: boolean;
  /** Se llama cuando vence el tiempo; debe poner `visible` en falso. */
  alCerrar?: () => void;
  /** Acción opcional en amarillo. */
  accion?: AccionToast;
  /** Milisegundos antes de cerrarse solo (por defecto 5000; 0 para no cerrar). */
  duracionMs?: number;
}

/** Mensaje breve centrado abajo; dentro de `Pantalla` queda por encima de la barra inferior. */
export function Toast({ mensaje, visible, alCerrar, accion, duracionMs = 5000 }: PropsToast) {
  const refCerrar = useRef(alCerrar);
  useEffect(() => {
    refCerrar.current = alCerrar;
  });

  useEffect(() => {
    if (!visible || duracionMs <= 0) {
      return undefined;
    }
    const espera = window.setTimeout(() => refCerrar.current?.(), duracionMs);
    return () => window.clearTimeout(espera);
  }, [visible, duracionMs, mensaje]);

  return (
    <div className="g-toast-zona" role="status" aria-live="polite">
      {visible && (
        <div className="g-toast">
          <span className="g-toast__mensaje">{mensaje}</span>
          {accion && (
            <button type="button" className="g-toast__accion" onClick={accion.alPulsar}>
              {accion.etiqueta}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
