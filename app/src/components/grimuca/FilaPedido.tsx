import type { ReactNode } from 'react';
import { Boton } from './Boton';
import { Icono } from './Icono';
import { Insignia } from './Insignia';
import { unir } from './utilidades';

export interface PropsListaPedidos {
  /** Filas de pedido. */
  children: ReactNode;
  /** Nombre de la lista para lectores de pantalla. */
  etiqueta?: string;
  /** Clases extra. */
  className?: string;
}

/** Lista que contiene las filas de pedido de una tienda. */
export function ListaPedidos({ children, etiqueta = 'Pedidos', className }: PropsListaPedidos) {
  return (
    <ul className={unir('g-lista-pedidos', className)} aria-label={etiqueta}>
      {children}
    </ul>
  );
}

export interface PropsFilaPedido {
  /** Tipo de pedido. */
  tipo: 'sobre' | 'cartucho';
  /** Qué se despacha: "Sobre de medición" o el nombre del cartucho. */
  descripcion: string;
  /** Zona del hogar. */
  zona: string;
  /** Cómo se entrega. */
  modalidad: 'retiro' | 'envio';
  /** Dirección de entrega (solo en envíos). */
  direccion?: string;
  /** Hora ya formateada: "9:42 a. m.". */
  hora: string;
  /** Estado del pedido. */
  estado?: 'pendiente' | 'despachado';
  /** Pedido recién llegado: se resalta y lleva la insignia "Nuevo". */
  nuevo?: boolean;
  /** Muestra el botón en espera mientras se guarda. */
  despachando?: boolean;
  /** Acción del botón "Despachado". */
  alDespachar?: () => void;
  /** Clases extra. */
  className?: string;
}

/** Fila de la lista de despacho del operador. Va dentro de `ListaPedidos`. */
export function FilaPedido({
  tipo,
  descripcion,
  zona,
  modalidad,
  direccion,
  hora,
  estado = 'pendiente',
  nuevo = false,
  despachando = false,
  alDespachar,
  className,
}: PropsFilaPedido) {
  const despachado = estado === 'despachado';
  const esNuevo = nuevo && !despachado;
  const textoModalidad =
    modalidad === 'retiro' ? 'Retiro en tienda' : `Envío${direccion ? `: ${direccion}` : ''}`;

  return (
    <li
      className={unir(
        'g-fila-pedido',
        esNuevo && 'g-fila-pedido--nuevo',
        despachado && 'g-fila-pedido--despachado',
        className,
      )}
    >
      <div className="g-fila-pedido__que">
        {esNuevo && <Insignia tono="azul">Nuevo</Insignia>}
        <Insignia tono={tipo === 'sobre' ? 'oscuro' : 'neutro'}>
          {tipo === 'sobre' ? 'Sobre' : 'Cartucho'}
        </Insignia>
        <span>{descripcion}</span>
      </div>
      <span className="g-fila-pedido__hora">{hora}</span>
      <div className="g-fila-pedido__detalle">
        <span className="g-fila-pedido__dato">
          <Icono nombre="ubicacion" tamano={18} />
          {zona}
        </span>
        <span className="g-fila-pedido__dato">
          <Icono nombre={modalidad === 'retiro' ? 'tienda' : 'camion'} tamano={18} />
          {textoModalidad}
        </span>
      </div>
      {despachado ? (
        <Insignia tono="ok" punto>
          Despachado
        </Insignia>
      ) : (
        alDespachar && (
          <Boton
            variante="secundario"
            cargando={despachando}
            onClick={alDespachar}
            aria-label={`Marcar como despachado: ${descripcion}, ${zona}`}
          >
            Despachado
          </Boton>
        )
      )}
    </li>
  );
}
