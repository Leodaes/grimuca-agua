import { Boton } from './Boton';
import { Icono } from './Icono';
import { Insignia } from './Insignia';
import { formatoUsd, unir } from './utilidades';

export interface PropsTarjetaProducto {
  /** Nombre del producto. */
  nombre: string;
  /** Código del producto. */
  codigo?: string;
  /** Marca del producto. */
  marca?: string;
  /** Precio en dólares; si falta se muestra "Cotizar por WhatsApp". */
  precioUsd?: number | null;
  /** Por qué se sugiere, en una frase: "Para bajar el cloro". */
  motivo?: string;
  /** Qué corrige: se muestra como etiquetas ("Cloro", "Dureza"). */
  corrige?: string[];
  /** Dirección de la foto; si falta se muestra un dibujo. */
  imagen?: string;
  /** Marca el producto como dato de ejemplo (catálogo provisional). */
  esEjemplo?: boolean;
  /** Producto principal: su botón es el único de color acción en la pantalla. */
  destacado?: boolean;
  /** El producto ya está en Mi lista. */
  enLista?: boolean;
  /** Muestra el botón en espera. */
  cargando?: boolean;
  /** Acción de "Agregar a mi lista". */
  alAgregar?: () => void;
  /** Acción de "Quitar de mi lista" (solo si `enLista`). */
  alQuitar?: () => void;
  /** Clases extra. */
  className?: string;
}

/** Tarjeta del producto sugerido: foto, nombre, motivo, precio y botón de Mi lista. */
export function TarjetaProducto({
  nombre,
  codigo,
  marca,
  precioUsd,
  motivo,
  corrige = [],
  imagen,
  esEjemplo = false,
  destacado = false,
  enLista = false,
  cargando = false,
  alAgregar,
  alQuitar,
  className,
}: PropsTarjetaProducto) {
  const lineaCodigo = [marca, codigo].filter(Boolean).join(' · ');
  const textoPrecio = typeof precioUsd === 'number' ? formatoUsd(precioUsd) : 'Cotizar por WhatsApp';

  return (
    <article
      className={unir(
        'g-tarjeta-producto',
        destacado && 'g-tarjeta-producto--destacado',
        className,
      )}
    >
      <div className="g-tarjeta-producto__foto">
        {imagen ? (
          <img src={imagen} alt="" loading="lazy" />
        ) : (
          <Icono nombre="cartucho" tamano={40} titulo="Foto no disponible" />
        )}
      </div>
      <div className="g-tarjeta-producto__cuerpo">
        <h3 className="g-tarjeta-producto__nombre">{nombre}</h3>
        {lineaCodigo && <p className="g-tarjeta-producto__codigo">{lineaCodigo}</p>}
        {motivo && <p className="g-tarjeta-producto__motivo">{motivo}</p>}
        <p className="g-tarjeta-producto__precio">{textoPrecio}</p>
        {(corrige.length > 0 || esEjemplo || enLista) && (
          <div className="g-tarjeta-producto__etiquetas">
            {enLista && (
              <Insignia tono="ok" punto>
                En tu lista
              </Insignia>
            )}
            {corrige.map((etiqueta) => (
              <Insignia key={etiqueta}>{etiqueta}</Insignia>
            ))}
            {esEjemplo && <Insignia tono="aviso">Ejemplo</Insignia>}
          </div>
        )}
      </div>
      {(alAgregar || alQuitar) && (
        <div className="g-tarjeta-producto__acciones">
          {!enLista && alAgregar && (
            <Boton
              variante={destacado ? 'primario' : 'secundario'}
              anchoCompleto
              cargando={cargando}
              icono={<Icono nombre="mas" tamano={20} />}
              onClick={alAgregar}
            >
              Agregar a mi lista
            </Boton>
          )}
          {enLista && alQuitar && (
            <Boton variante="secundario" anchoCompleto cargando={cargando} onClick={alQuitar}>
              Quitar de mi lista
            </Boton>
          )}
        </div>
      )}
    </article>
  );
}
