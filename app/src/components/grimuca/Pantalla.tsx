import type { ReactNode } from 'react';
import { BarraInferior } from './BarraInferior';
import type { PropsBarraInferior } from './BarraInferior';
import { Encabezado } from './Encabezado';
import { unir } from './utilidades';

export interface PropsPantalla {
  /** Contenido de la pantalla. */
  children: ReactNode;
  /** cliente: columna de 480px; operador: hasta 1440px y sin barra inferior. */
  ancho?: 'cliente' | 'operador';
  /** Encabezado propio; si falta se usa el encabezado azul con el logo. */
  encabezado?: ReactNode;
  /** Muestra la barra inferior (por defecto sí en cliente, nunca en operador). */
  conBarra?: boolean;
  /** Props de la barra inferior: contador de Mi lista, enlace de WhatsApp. */
  barra?: PropsBarraInferior;
  /** Clases extra para el contenido. */
  className?: string;
}

/** Marco de pantalla: enlace de salto, encabezado, contenido y barra inferior. */
export function Pantalla({
  children,
  ancho = 'cliente',
  encabezado,
  conBarra,
  barra,
  className,
}: PropsPantalla) {
  const esOperador = ancho === 'operador';
  const mostrarBarra = !esOperador && (conBarra ?? true);

  return (
    <div
      className={unir(
        'g-pantalla',
        esOperador && 'g-pantalla--operador',
        mostrarBarra && 'g-pantalla--con-barra',
      )}
    >
      <a className="g-pantalla__salto" href="#contenido">
        Saltar al contenido
      </a>
      {encabezado ?? <Encabezado variante={esOperador ? 'operador' : 'cliente'} />}
      <main id="contenido" className={unir('g-pantalla__contenido', className)} tabIndex={-1}>
        {children}
      </main>
      {mostrarBarra && <BarraInferior {...barra} />}
    </div>
  );
}
