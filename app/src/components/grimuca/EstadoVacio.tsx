import type { ReactNode } from 'react';
import { Icono } from './Icono';
import type { NombreIcono } from './Icono';
import { unir } from './utilidades';

export interface PropsEstadoVacio {
  /** Qué pasa, en pocas palabras. */
  titulo: string;
  /** Explicación corta de qué hacer. */
  children?: ReactNode;
  /** Icono a mostrar (por defecto, info o alerta según el tono). */
  icono?: NombreIcono;
  /** Botón o enlace para salir del estado: "Medir ahora", "Reintentar". */
  accion?: ReactNode;
  /** vacio: no hay datos todavía; error: algo falló. */
  tono?: 'vacio' | 'error';
  /** Clases extra. */
  className?: string;
}

/** Bloque para estados sin datos o con error, con una sola salida clara. */
export function EstadoVacio({
  titulo,
  children,
  icono,
  accion,
  tono = 'vacio',
  className,
}: PropsEstadoVacio) {
  const esError = tono === 'error';

  return (
    <div
      className={unir('g-estado-vacio', esError && 'g-estado-vacio--error', className)}
      role={esError ? 'alert' : undefined}
    >
      <Icono
        className="g-estado-vacio__icono"
        nombre={icono ?? (esError ? 'alerta' : 'info')}
        tamano={40}
      />
      <h2 className="g-estado-vacio__titulo">{titulo}</h2>
      {children && <div className="g-estado-vacio__texto">{children}</div>}
      {accion}
    </div>
  );
}
