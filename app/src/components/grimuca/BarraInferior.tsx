import { Link, useLocation } from 'react-router-dom';
import { Icono } from './Icono';
import type { NombreIcono } from './Icono';
import { unir } from './utilidades';

/** Enlace de WhatsApp con número marcador; se reemplaza cuando llegue el real. */
export const WHATSAPP_MARCADOR = 'https://wa.me/580000000000';

export interface PropsBarraInferior {
  /** Destino de "Resultados" (por defecto "/resultado/ultimo"). */
  rutaResultados?: string;
  /** Enlace wa.me de "WhatsApp" (por defecto, el número marcador). */
  enlaceWhatsApp?: string;
  /** Cantidad de artículos en Mi lista; con 0 no se muestra el contador. */
  cantidadLista?: number;
  /** Clases extra. */
  className?: string;
}

interface AccesoInterno {
  etiqueta: string;
  icono: NombreIcono;
  ruta: string;
  bases: string[];
}

/** Barra fija inferior del cliente con 5 accesos: Medir, Resultados, Tiendas, WhatsApp y Mi lista. */
export function BarraInferior({
  rutaResultados = '/resultado/ultimo',
  enlaceWhatsApp = WHATSAPP_MARCADOR,
  cantidadLista = 0,
  className,
}: PropsBarraInferior) {
  const { pathname } = useLocation();

  function estaActiva(bases: string[]): boolean {
    return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
  }

  const antes: AccesoInterno[] = [
    { etiqueta: 'Medir', icono: 'gota', ruta: '/medir', bases: ['/medir'] },
    {
      etiqueta: 'Resultados',
      icono: 'resultados',
      ruta: rutaResultados,
      bases: ['/resultado', '/bacterias'],
    },
    { etiqueta: 'Tiendas', icono: 'tienda', ruta: '/tiendas', bases: ['/tiendas'] },
  ];
  const listaActiva = estaActiva(['/lista', '/pedido']);

  return (
    <nav className={unir('g-barra-inferior', className)} aria-label="Navegación principal">
      <ul className="g-barra-inferior__lista">
        {antes.map((acceso) => (
          <li key={acceso.etiqueta}>
            <Link
              to={acceso.ruta}
              className="g-barra-inferior__acceso"
              aria-current={estaActiva(acceso.bases) ? 'page' : undefined}
            >
              <Icono nombre={acceso.icono} />
              <span>{acceso.etiqueta}</span>
            </Link>
          </li>
        ))}
        <li>
          <a
            href={enlaceWhatsApp}
            className="g-barra-inferior__acceso"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icono nombre="whatsapp" className="g-barra-inferior__wa" />
            <span>WhatsApp</span>
            <span className="g-solo-lector"> (abre en otra pestaña)</span>
          </a>
        </li>
        <li>
          <Link
            to="/lista"
            className="g-barra-inferior__acceso"
            aria-current={listaActiva ? 'page' : undefined}
          >
            <span className="g-barra-inferior__icono">
              <Icono nombre="lista" />
              {cantidadLista > 0 && (
                <span className="g-barra-inferior__contador" aria-hidden="true">
                  {cantidadLista}
                </span>
              )}
            </span>
            <span>Mi lista</span>
            {cantidadLista > 0 && (
              <span className="g-solo-lector">
                , {cantidadLista} {cantidadLista === 1 ? 'artículo' : 'artículos'}
              </span>
            )}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
