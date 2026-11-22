import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Icono } from './Icono';
import { formatoUsd, unir } from './utilidades';

export interface ArticuloLista {
  /** Identificador único (por ejemplo, el código del cartucho). */
  id: string;
  /** Nombre del producto. */
  nombre: string;
  /** Línea secundaria: marca, código o motivo. */
  detalle?: string;
  /** Cantidad pedida. */
  cantidad: number;
  /** Precio unitario en dólares, si se conoce. */
  precioUsd?: number | null;
}

export interface PropsListaArticulos {
  /** Artículos de la lista. */
  articulos: ArticuloLista[];
  /** Recibe el id y la cantidad nueva (entre 1 y `maximo`). */
  alCambiarCantidad?: (id: string, cantidad: number) => void;
  /** Recibe el id del artículo a quitar. */
  alQuitar?: (id: string) => void;
  /** Cantidad máxima por artículo (por defecto 9). */
  maximo?: number;
  /** Clases extra. */
  className?: string;
}

/** Lista de artículos con cantidad (− / +) y botón de quitar; se usa en el cajón y en `/lista`. */
export function ListaArticulos({
  articulos,
  alCambiarCantidad,
  alQuitar,
  maximo = 9,
  className,
}: PropsListaArticulos) {
  return (
    <ul className={unir('g-articulos', className)}>
      {articulos.map((articulo) => (
        <li className="g-articulo" key={articulo.id}>
          <div>
            <p className="g-articulo__nombre">{articulo.nombre}</p>
            {articulo.detalle && <p className="g-articulo__detalle">{articulo.detalle}</p>}
            {typeof articulo.precioUsd === 'number' && (
              <p className="g-articulo__detalle g-cifra">{formatoUsd(articulo.precioUsd)} c/u</p>
            )}
          </div>
          <div className="g-articulo__controles">
            {alCambiarCantidad ? (
              <div className="g-articulo__cantidad">
                <button
                  type="button"
                  className="g-boton-icono g-boton-icono--borde"
                  aria-label={`Quitar una unidad de ${articulo.nombre}`}
                  disabled={articulo.cantidad <= 1}
                  onClick={() => alCambiarCantidad(articulo.id, articulo.cantidad - 1)}
                >
                  <Icono nombre="menos" tamano={20} />
                </button>
                <span className="g-articulo__numero" aria-live="polite">
                  <span className="g-solo-lector">Cantidad: </span>
                  {articulo.cantidad}
                </span>
                <button
                  type="button"
                  className="g-boton-icono g-boton-icono--borde"
                  aria-label={`Agregar una unidad de ${articulo.nombre}`}
                  disabled={articulo.cantidad >= maximo}
                  onClick={() => alCambiarCantidad(articulo.id, articulo.cantidad + 1)}
                >
                  <Icono nombre="mas" tamano={20} />
                </button>
              </div>
            ) : (
              <span className="g-articulo__numero">× {articulo.cantidad}</span>
            )}
            {alQuitar && (
              <button
                type="button"
                className="g-boton-icono"
                aria-label={`Quitar ${articulo.nombre} de la lista`}
                onClick={() => alQuitar(articulo.id)}
              >
                <Icono nombre="basura" tamano={20} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface PropsCajonLista extends Omit<PropsListaArticulos, 'className'> {
  /** Abre o cierra el cajón. */
  abierto: boolean;
  /** Se llama al cerrar (botón, tecla Escape o toque fuera). */
  alCerrar: () => void;
  /** Título del cajón (por defecto "Mi lista"). */
  titulo?: string;
  /** Aviso debajo de los artículos. */
  aviso?: ReactNode;
  /** Pie fijo: aquí va el botón para seguir con el pedido. */
  pie?: ReactNode;
  /** Qué mostrar cuando no hay artículos. */
  vacio?: ReactNode;
}

/** Cajón lateral de Mi lista hecho con `dialog`; es la única pieza con sombra. */
export function CajonLista({
  abierto,
  alCerrar,
  titulo = 'Mi lista',
  articulos,
  alCambiarCantidad,
  alQuitar,
  maximo,
  aviso,
  pie,
  vacio,
}: PropsCajonLista) {
  const refDialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) {
      return;
    }
    if (abierto && !dialogo.open) {
      if (typeof dialogo.showModal === 'function') {
        dialogo.showModal();
      } else {
        dialogo.setAttribute('open', '');
      }
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  function alPulsarFondo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) {
      alCerrar();
    }
  }

  return (
    <dialog
      ref={refDialogo}
      className="g-cajon"
      aria-labelledby={idTitulo}
      onClose={alCerrar}
      onClick={alPulsarFondo}
    >
      <div className="g-cajon__panel">
        <div className="g-cajon__cabecera">
          <h2 className="g-h3" id={idTitulo}>
            {titulo}
          </h2>
          <button type="button" className="g-boton-icono" aria-label="Cerrar" onClick={alCerrar}>
            <Icono nombre="cerrar" />
          </button>
        </div>
        <div className="g-cajon__cuerpo">
          {articulos.length > 0 ? (
            <ListaArticulos
              articulos={articulos}
              alCambiarCantidad={alCambiarCantidad}
              alQuitar={alQuitar}
              maximo={maximo}
            />
          ) : (
            (vacio ?? <p className="g-apagado">Tu lista está vacía.</p>)
          )}
          {aviso}
        </div>
        {pie && <div className="g-cajon__pie">{pie}</div>}
      </div>
    </dialog>
  );
}
