import { unir } from './utilidades';

export interface CifraBanda {
  /** Número o valor destacado. */
  valor: string | number;
  /** Qué significa el número. */
  etiqueta: string;
  /** Aclaratoria corta debajo de la etiqueta. */
  detalle?: string;
}

export interface PropsBandaCifras {
  /** Cifras a mostrar (4 por fila en escritorio, 2 en teléfono). */
  cifras: CifraBanda[];
  /** Nombre de la banda para lectores de pantalla. */
  etiqueta?: string;
  /** Clases extra. */
  className?: string;
}

/** Banda azul con números amarillos, como la banda de confianza de grimuca.com. */
export function BandaCifras({ cifras, etiqueta = 'Cifras', className }: PropsBandaCifras) {
  return (
    <dl className={unir('g-banda-cifras', 'g-sobre-azul', className)} aria-label={etiqueta}>
      {cifras.map((cifra) => (
        <div className="g-banda-cifras__cifra" key={cifra.etiqueta}>
          <dt>
            {cifra.etiqueta}
            {cifra.detalle && <span className="g-banda-cifras__detalle">{cifra.detalle}</span>}
          </dt>
          <dd>{cifra.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
