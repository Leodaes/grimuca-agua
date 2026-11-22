import type { ReactNode } from 'react';
import { Semaforo } from './Semaforo';
import type { NivelSemaforo } from './Semaforo';
import { unir } from './utilidades';

export interface PropsListaParametros {
  /** Filas de parámetro. */
  children: ReactNode;
  /** Clases extra. */
  className?: string;
}

/** Lista que contiene las filas de parámetro del resultado. */
export function ListaParametros({ children, className }: PropsListaParametros) {
  return <ul className={unir('g-lista-parametros', className)}>{children}</ul>;
}

export interface PropsFilaParametro {
  /** Nombre del parámetro en palabras simples: "Cloro", "Dureza". */
  nombre: string;
  /** Valor leído; si falta se muestra "No se pudo leer". */
  valor?: string | number | null;
  /** Unidad que acompaña al valor. */
  unidad?: string;
  /** Nivel del semáforo para este parámetro. */
  nivel: NivelSemaforo;
  /** Frase simple que explica qué significa. */
  frase?: string;
  /** Agrega la nota de resultado orientativo (plomo y cobre). */
  orientativo?: boolean;
  /** Clases extra. */
  className?: string;
}

/** Fila del resultado: nombre, valor, semáforo y una frase. Va dentro de `ListaParametros`. */
export function FilaParametro({
  nombre,
  valor,
  unidad,
  nivel,
  frase,
  orientativo = false,
  className,
}: PropsFilaParametro) {
  const hayValor = valor !== undefined && valor !== null && valor !== '';
  const textoValor = hayValor ? `${valor}${unidad ? ` ${unidad}` : ''}` : 'No se pudo leer';

  return (
    <li className={unir('g-fila-parametro', className)}>
      <div>
        <p className="g-fila-parametro__nombre">{nombre}</p>
        <p className="g-fila-parametro__valor">{textoValor}</p>
      </div>
      <Semaforo nivel={nivel} />
      {frase && <p className="g-fila-parametro__frase">{frase}</p>}
      {orientativo && (
        <p className="g-fila-parametro__nota">
          Resultado orientativo: posible presencia. Confirma con un laboratorio.
        </p>
      )}
    </li>
  );
}
