import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { unir } from './utilidades';

export type VarianteBoton = 'primario' | 'secundario' | 'sobreAzul';

export interface PropsBoton extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Estilo: primario (el único CTA de la pantalla), secundario o sobreAzul. */
  variante?: VarianteBoton;
  /** Muestra el giro y bloquea el botón mientras se espera. */
  cargando?: boolean;
  /** Texto que reemplaza al contenido mientras carga. */
  textoCargando?: string;
  /** Ocupa todo el ancho disponible. */
  anchoCompleto?: boolean;
  /** Icono a la izquierda del texto. */
  icono?: ReactNode;
  /** Ruta interna: el botón se dibuja como enlace de la app. */
  a?: string;
  /** Enlace externo: se abre en otra pestaña. */
  href?: string;
  /** Acción al pulsar (sirve para botón y para enlace). */
  onClick?: MouseEventHandler<HTMLElement>;
}

/** Botón de Grimuca: 44px mínimo, radio 2px, tres variantes. */
export function Boton({
  variante = 'primario',
  cargando = false,
  textoCargando,
  anchoCompleto = false,
  icono,
  a,
  href,
  onClick,
  className,
  children,
  disabled,
  type = 'button',
  ...resto
}: PropsBoton) {
  const clases = unir(
    'g-boton',
    `g-boton--${variante}`,
    anchoCompleto && 'g-boton--ancho',
    cargando && 'g-boton--cargando',
    className,
  );
  const inactivo = Boolean(disabled) || cargando;
  const contenido = (
    <>
      {cargando ? <span className="g-giro" aria-hidden="true" /> : icono}
      <span>{cargando && textoCargando ? textoCargando : children}</span>
    </>
  );

  if (a && !inactivo) {
    return (
      <Link to={a} className={clases} onClick={onClick} aria-label={resto['aria-label']}>
        {contenido}
      </Link>
    );
  }

  if (href && !inactivo) {
    return (
      <a
        href={href}
        className={clases}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={resto['aria-label']}
      >
        {contenido}
      </a>
    );
  }

  return (
    <button
      {...resto}
      type={type}
      className={clases}
      disabled={inactivo}
      aria-busy={cargando || undefined}
      onClick={onClick}
    >
      {contenido}
    </button>
  );
}
