import type { ReactNode } from 'react';
import { unir } from './utilidades';

export type NombreIcono =
  | 'gota'
  | 'resultados'
  | 'tienda'
  | 'whatsapp'
  | 'lista'
  | 'check'
  | 'checkCirculo'
  | 'alerta'
  | 'alto'
  | 'sinDato'
  | 'info'
  | 'cerrar'
  | 'atras'
  | 'adelante'
  | 'mas'
  | 'menos'
  | 'camara'
  | 'reloj'
  | 'basura'
  | 'camion'
  | 'ubicacion'
  | 'sobre'
  | 'cartucho';

const TRAZOS: Record<NombreIcono, ReactNode> = {
  gota: <path d="M12 3c3.5 4.2 6 7.3 6 10.5a6 6 0 0 1-12 0C6 10.3 8.5 7.2 12 3z" />,
  resultados: (
    <>
      <path d="M9 3.5h6v3H9z" />
      <path d="M9 5H5.5v15.5h13V5H15" />
      <path d="M8.5 13l2.2 2.2 4.8-4.8" />
    </>
  ),
  tienda: (
    <>
      <path d="M4.5 4h15L21 9.5H3L4.5 4z" />
      <path d="M4.5 9.5V20h15V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M9.2 8.4c-.4 1.2.3 2.9 1.7 4.3s3.1 2.1 4.3 1.7" />
    </>
  ),
  lista: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCirculo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.7 2.7L16 9.5" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4L2.8 20h18.4L12 4z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  ),
  alto: (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3L8.3 3z" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  sinDato: (
    <>
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <path d="M9 12h6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  atras: <path d="M15 5l-7 7 7 7" />,
  adelante: <path d="M9 5l7 7-7 7" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  camara: (
    <>
      <path d="M4 8h3.2l1.5-2.5h6.6L16.8 8H20v11H4V8z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  basura: (
    <>
      <path d="M5 7h14M10 4h4" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  camion: (
    <>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  sobre: (
    <>
      <path d="M3.5 6.5h17v11h-17z" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),
  cartucho: (
    <>
      <path d="M8 3h8v3H8z" />
      <path d="M9 6v13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6" />
      <path d="M9 10h6M9 14h6" />
    </>
  ),
};

export interface PropsIcono {
  /** Nombre del dibujo. */
  nombre: NombreIcono;
  /** Lado en píxeles (por defecto 24). */
  tamano?: number;
  /** Texto alternativo; si falta, el icono es decorativo. */
  titulo?: string;
  /** Clases extra. */
  className?: string;
}

/** Icono de línea que toma el color del texto. */
export function Icono({ nombre, tamano = 24, titulo, className }: PropsIcono) {
  return (
    <svg
      className={unir('g-icono', className)}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
