import type { ReactNode } from 'react';
import { Icono } from './Icono';
import { Insignia } from './Insignia';
import { unir } from './utilidades';

export interface CifraTienda {
  /** Qué significa el número. */
  etiqueta: string;
  /** Número o valor. */
  valor: string | number;
  /** Con "error" el número va en rojo (por ejemplo, faltantes). */
  tono?: 'normal' | 'error';
}

export interface PropsTarjetaTienda {
  /** Nombre de la tienda: Mañongo, Big Low, CC CEM. */
  nombre: string;
  /** Horario en texto. */
  horario?: string;
  /** Dirección en texto. */
  direccion?: string;
  /** Muestra la insignia Abierta o Cerrada. */
  abierta?: boolean;
  /** Cifras de la tienda (panel del operador). */
  cifras?: CifraTienda[];
  /** Contenido a la derecha del nombre: insignia "Más cercana", contador de pendientes. */
  extra?: ReactNode;
  /** Botones o enlaces al pie. */
  acciones?: ReactNode;
  /** Contenido libre dentro de la tarjeta (por ejemplo, la lista de pedidos). */
  children?: ReactNode;
  /** Resalta la tienda elegida. */
  seleccionada?: boolean;
  /** Clases extra. */
  className?: string;
}

/** Tarjeta de tienda: sirve para el cliente (datos) y para el operador (cifras y pedidos). */
export function TarjetaTienda({
  nombre,
  horario,
  direccion,
  abierta,
  cifras = [],
  extra,
  acciones,
  children,
  seleccionada = false,
  className,
}: PropsTarjetaTienda) {
  return (
    <section
      className={unir(
        'g-tarjeta-tienda',
        seleccionada && 'g-tarjeta-tienda--seleccionada',
        className,
      )}
      aria-label={`Tienda ${nombre}`}
    >
      <div className="g-tarjeta-tienda__cabecera">
        <h3 className="g-h3">{nombre}</h3>
        {extra}
        {abierta !== undefined && (
          <Insignia tono={abierta ? 'ok' : 'error'} punto>
            {abierta ? 'Abierta' : 'Cerrada'}
          </Insignia>
        )}
      </div>
      {direccion && (
        <p className="g-tarjeta-tienda__dato">
          <Icono nombre="ubicacion" tamano={18} />
          <span>{direccion}</span>
        </p>
      )}
      {horario && (
        <p className="g-tarjeta-tienda__dato">
          <Icono nombre="reloj" tamano={18} />
          <span>{horario}</span>
        </p>
      )}
      {cifras.length > 0 && (
        <dl className="g-tarjeta-tienda__cifras">
          {cifras.map((cifra) => (
            <div
              key={cifra.etiqueta}
              className={unir(
                'g-tarjeta-tienda__cifra',
                cifra.tono === 'error' && 'g-tarjeta-tienda__cifra--error',
              )}
            >
              <dt>{cifra.etiqueta}</dt>
              <dd>{cifra.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
      {acciones && <div className="g-tarjeta-tienda__acciones">{acciones}</div>}
    </section>
  );
}
