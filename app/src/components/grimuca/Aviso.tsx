import type { ReactNode } from 'react';
import { unir } from './utilidades';

export type TonoAviso = 'info' | 'atencion' | 'error' | 'ok';

export interface PropsAviso {
  /** Texto del aviso. */
  children: ReactNode;
  /** Título corto en negrita. */
  titulo?: string;
  /** Color del borde y del fondo: info (azul), atencion (ámbar), error u ok. */
  tono?: TonoAviso;
  /** Rol para lectores de pantalla: note (por defecto), status o alert. */
  rol?: 'note' | 'status' | 'alert';
  /** Clases extra. */
  className?: string;
}

/** Aviso con borde izquierdo de 3px; azul por defecto. */
export function Aviso({ children, titulo, tono = 'info', rol = 'note', className }: PropsAviso) {
  return (
    <div className={unir('g-aviso', tono !== 'info' && `g-aviso--${tono}`, className)} role={rol}>
      {titulo && <p className="g-aviso__titulo">{titulo}</p>}
      <div className="g-aviso__texto">{children}</div>
    </div>
  );
}

/** Texto literal del aviso fijo de resultados. No se reescribe. */
export const TEXTO_AVISO_TIRA =
  'Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';

export interface PropsAvisoTira {
  /** Clases extra. */
  className?: string;
}

/** Aviso fijo de la pantalla de resultado, con su texto literal. */
export function AvisoTira({ className }: PropsAvisoTira) {
  return <Aviso className={unir('g-aviso--fijo', className)}>{TEXTO_AVISO_TIRA}</Aviso>;
}
