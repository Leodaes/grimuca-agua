import { unir } from './utilidades';

export interface PropsCargando {
  /** Texto que acompaña (por defecto "Cargando…"). */
  texto?: string;
  /** Giro con texto, o bloques grises que parpadean en lugar del contenido. */
  variante?: 'giro' | 'esqueleto';
  /** Con esqueleto: cuántas líneas dibujar (por defecto 3). */
  lineas?: number;
  /** Con giro: ocupa media pantalla y centra el contenido. */
  pantalla?: boolean;
  /** Clases extra. */
  className?: string;
}

/** Estado de carga: giro con texto o esqueleto. */
export function Cargando({
  texto = 'Cargando…',
  variante = 'giro',
  lineas = 3,
  pantalla = false,
  className,
}: PropsCargando) {
  if (variante === 'esqueleto') {
    return (
      <div className={unir('g-esqueleto', className)} role="status">
        <span className="g-solo-lector">{texto}</span>
        {Array.from({ length: Math.max(1, lineas) }, (_, indice) => (
          <div className="g-esqueleto__linea" key={indice} aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <div className={unir('g-cargando', pantalla && 'g-cargando--pantalla', className)} role="status">
      <span className="g-giro" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
