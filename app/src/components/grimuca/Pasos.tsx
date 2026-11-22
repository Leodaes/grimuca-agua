import type { ReactNode } from 'react';
import { Icono } from './Icono';
import { unir } from './utilidades';

export interface Paso {
  /** Título corto del paso. */
  titulo: string;
  /** Explicación en una o dos frases. */
  detalle?: ReactNode;
  /** Contenido extra (por ejemplo, el temporizador); con `actual` solo se ve en el paso en curso. */
  contenido?: ReactNode;
}

export interface PropsPasos {
  /** Pasos en orden. */
  pasos: Paso[];
  /** Índice (desde 0) del paso en curso; si falta, la lista es solo informativa. */
  actual?: number;
  /** Nombre de la lista para lectores de pantalla. */
  etiqueta?: string;
  /** Clases extra. */
  className?: string;
}

/** Pasos numerados, como "cómo comprar" en grimuca.com. */
export function Pasos({ pasos, actual, etiqueta = 'Pasos', className }: PropsPasos) {
  const conAvance = actual !== undefined;
  const indiceActual = actual ?? -1;

  return (
    <ol className={unir('g-pasos', className)} aria-label={etiqueta}>
      {pasos.map((paso, indice) => {
        const hecho = conAvance && indice < indiceActual;
        const enCurso = conAvance && indice === indiceActual;
        const pendiente = conAvance && indice > indiceActual;

        return (
          <li
            key={paso.titulo}
            className={unir('g-paso', hecho && 'g-paso--hecho', pendiente && 'g-paso--pendiente')}
            aria-current={enCurso ? 'step' : undefined}
          >
            <span className="g-paso__numero" aria-hidden="true">
              {hecho ? <Icono nombre="check" tamano={20} /> : indice + 1}
            </span>
            <div className="g-paso__cuerpo">
              <h3 className="g-paso__titulo">
                <span className="g-solo-lector">
                  Paso {indice + 1}
                  {hecho ? ', listo' : ''}:{' '}
                </span>
                {paso.titulo}
              </h3>
              {paso.detalle && <div className="g-paso__detalle">{paso.detalle}</div>}
              {paso.contenido && (!conAvance || enCurso) && paso.contenido}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
