import './portada.css';

export interface PropsIndicadorPasos {
  /** Paso actual, desde 1. */
  actual: number;
  /** Total de pasos del camino. */
  total: number;
  /** Nombre corto del paso actual: "tu casa". */
  nombre: string;
}

/** Línea discreta sobre el título: "Paso 1 de 3: tu casa", con una barra de segmentos. */
export function IndicadorPasos({ actual, total, nombre }: PropsIndicadorPasos) {
  return (
    <nav className="p-indicador" aria-label="Avance">
      <p className="p-indicador__texto">
        Paso {actual} de {total}: {nombre}
      </p>
      <ol className="p-indicador__segmentos">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={i + 1 <= actual ? 'p-indicador__segmento p-indicador__segmento--hecho' : 'p-indicador__segmento'}
            aria-current={i + 1 === actual ? 'step' : undefined}
          >
            <span className="g-solo-lector">Paso {i + 1}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
