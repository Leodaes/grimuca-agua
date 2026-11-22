import type { ReactNode } from 'react';
import type { TipoFiltro } from '../../lib/tipos';

// Dibujos de línea para elegir el tipo de filtro: lo que importa es contar los vasos y ver si hay tanque.
// Usan currentColor (el azul de la opción) y un relleno suave para el agua.

const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const AGUA = 'rgba(26, 143, 184, 0.18)';

/** Un vaso de portafiltro: cabezal arriba y vaso transparente con su cartucho adentro. */
function Vaso({ x, alto = 34, ancho = 14 }: { x: number; alto?: number; ancho?: number }) {
  const y = 14;
  return (
    <g>
      <rect x={x - 2} y={y - 5} width={ancho + 4} height={6} rx={1.5} {...TRAZO} />
      <rect x={x} y={y + 1} width={ancho} height={alto} rx={4} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <line x1={x + ancho / 2} y1={y + 5} x2={x + ancho / 2} y2={y + alto - 4} {...TRAZO} strokeDasharray="2 3" />
    </g>
  );
}

/** Tubería de entrada y salida sobre los cabezales. */
function Tubo({ desde, hasta }: { desde: number; hasta: number }) {
  return <path d={`M${desde} 11 H${hasta}`} {...TRAZO} />;
}

function Lienzo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" aria-hidden="true" focusable="false" data-dibujo={titulo}>
      {children}
    </svg>
  );
}

const DIBUJOS: Partial<Record<TipoFiltro, () => ReactNode>> = {
  portafiltro_simple: () => (
    <Lienzo titulo="Un vaso">
      <Tubo desde={14} hasta={58} />
      <Vaso x={29} />
    </Lienzo>
  ),
  portafiltro_doble: () => (
    <Lienzo titulo="Dos vasos">
      <Tubo desde={8} hasta={64} />
      <Vaso x={18} />
      <Vaso x={40} />
    </Lienzo>
  ),
  portafiltro_triple: () => (
    <Lienzo titulo="Tres vasos">
      <Tubo desde={3} hasta={69} />
      <Vaso x={8} />
      <Vaso x={29} />
      <Vaso x={50} />
    </Lienzo>
  ),
  osmosis_inversa: () => (
    <Lienzo titulo="Ósmosis inversa: cartuchos y un tanque redondo">
      {/* Cartuchos acostados en un soporte y, al lado, el tanque presurizado. */}
      <rect x={4} y={8} width={38} height={7} rx={3.5} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <rect x={4} y={19} width={38} height={7} rx={3.5} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <rect x={4} y={30} width={38} height={7} rx={3.5} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <path d="M4 44 H42" {...TRAZO} />
      <rect x={48} y={18} width={20} height={30} rx={10} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <path d="M58 18 V13" {...TRAZO} />
      <path d="M42 22 C46 22 46 13 58 13" {...TRAZO} />
    </Lienzo>
  ),
  ultrafiltracion: () => (
    <Lienzo titulo="Ultrafiltración: varios cartuchos delgados, sin tanque">
      <Tubo desde={4} hasta={68} />
      {[8, 20, 32, 44, 56].map((x) => (
        <Vaso key={x} x={x} ancho={8} alto={36} />
      ))}
    </Lienzo>
  ),
  desbarrador_tanque: () => (
    <Lienzo titulo="Tanque grande para toda la casa, con válvula arriba">
      <rect x={24} y={4} width={24} height={9} rx={2} {...TRAZO} />
      <path d="M16 8 H24 M48 8 H56" {...TRAZO} />
      <rect x={26} y={13} width={20} height={40} rx={8} fill={AGUA} stroke="currentColor" strokeWidth={2} />
      <path d="M30 22 H42 M30 30 H42" {...TRAZO} strokeDasharray="2 3" />
    </Lienzo>
  ),
  otro: () => (
    <Lienzo titulo="No sé">
      <circle cx={36} cy={28} r={18} {...TRAZO} />
      <path d="M30 23 C30 15 42 15 42 23 C42 28 36 28 36 33" {...TRAZO} />
      <circle cx={36} cy={39} r={1.6} fill="currentColor" />
    </Lienzo>
  ),
};

/** Ilustración del tipo de filtro (decorativa dentro de la opción: el texto ya dice lo mismo). */
export function IlustracionFiltro({ tipo }: { tipo: TipoFiltro }) {
  const dibujo = DIBUJOS[tipo];
  return dibujo ? <>{dibujo()}</> : null;
}
