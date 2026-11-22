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
  /** Tipo de pedido. 'servicio' = servicio técnico en la casa: se cierra con "Atendido". */
  tipo: 'sobre' | 'cartucho' | 'servicio';
  /** Qué se despacha: "Sobre de medición", el nombre del cartucho o el servicio ("Cambio de cartucho"). */
  descripcion: string;
  /** Fecha preferida ya formateada (solo servicios): "lunes, 23 de noviembre · En la tarde". */
  fechaPreferida?: string;
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
  fechaPreferida,
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
  const esServicio = tipo === 'servicio';
  const cierre = esServicio ? 'Atendido' : 'Despachado';
  const textoModalidad = esServicio
    ? `Visita${direccion ? `: ${direccion}` : ''}`
    : modalidad === 'retiro'
      ? 'Retiro en tienda'
      : `Envío${direccion ? `: ${direccion}` : ''}`;
  const insignia =
    tipo === 'sobre' ? (
      <Insignia tono="oscuro">Sobre</Insignia>
    ) : esServicio ? (
      <Insignia tono="aviso">Servicio técnico</Insignia>
    ) : (
      <Insignia tono="neutro">Cartucho</Insignia>
    );

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
        {insignia}
        <span>{descripcion}</span>
      </div>
      <span className="g-fila-pedido__hora">{hora}</span>
      <div className="g-fila-pedido__detalle">
        <span className="g-fila-pedido__dato">
          <Icono nombre="ubicacion" tamano={18} />
          {zona}
        </span>
        <span className="g-fila-pedido__dato">
          <Icono nombre={esServicio ? 'ubicacion' : modalidad === 'retiro' ? 'tienda' : 'camion'} tamano={18} />
          {textoModalidad}
        </span>
        {esServicio && fechaPreferida && (
          <span className="g-fila-pedido__dato">
            <Icono nombre="reloj" tamano={18} />
            Fecha preferida: {fechaPreferida}
          </span>
        )}
      </div>
      {despachado ? (
        <Insignia tono="ok" punto>
          {cierre}
        </Insignia>
      ) : (
        alDespachar && (
          <Boton
            variante="secundario"
            cargando={despachando}
            onClick={alDespachar}
            aria-label={`Marcar como ${cierre.toLowerCase()}: ${descripcion}, ${zona}`}
          >
            {cierre}
          </Boton>
        )
      )}
    </li>
  );
}
