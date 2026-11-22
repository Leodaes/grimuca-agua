// Tablero SVG de hexágonos por urbanización. Cada hexágono es un botón (teclado y lector de pantalla).
import type { KeyboardEvent } from 'react';
import type { UrbanizacionMapa } from '../../lib/tipos';
import {
  ANCHO_HEX,
  LETRA_ESTADO,
  RADIO,
  centroHex,
  etiquetaAccesible,
  etiquetaCorta,
  puntosHex,
  tamanoTablero,
  tonoClientes,
} from './mapaHex';

export type VistaMapa = 'calidad' | 'clientes';

interface Props {
  urbanizaciones: UrbanizacionMapa[];
  vista: VistaMapa;
  elegida: string | null;
  alElegir: (id: string) => void;
}

/** Dibujo del icono de tienda (mismo trazo que <Icono nombre="tienda">) en una caja de 24. */
export function TrazoTienda() {
  return (
    <>
      <path d="M4.5 4h15L21 9.5H3L4.5 4z" />
      <path d="M4.5 9.5V20h15V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  );
}

/** Dibujo del icono de alerta (mismo trazo que <Icono nombre="alerta">). */
export function TrazoAlerta() {
  return (
    <>
      <path d="M12 4L2.8 20h18.4L12 4z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  );
}

function claseHex(u: UrbanizacionMapa, vista: VistaMapa): string {
  if (u.estado === 'sin_clientes') return 'mapa-hex--vacio';
  if (vista === 'calidad') return `mapa-hex--${u.estado.replace('_', '-')}`;
  return `mapa-hex--azul-${tonoClientes(u.hogares) ?? 0}`;
}

export function MapaHexagonos({ urbanizaciones, vista, elegida, alElegir }: Props) {
  const celdas = urbanizaciones.filter((u) => u.en_tablero && u.col !== null && u.fila !== null) as Array<
    UrbanizacionMapa & { col: number; fila: number }
  >;
  const { ancho, alto } = tamanoTablero(celdas);

  // Rótulo de cada zona (o grupo, en Valencia norte): centrado sobre su grupo, encima de su primera fila.
  const porRotulo = new Map<string, typeof celdas>();
  for (const c of celdas) {
    const clave = c.grupo ?? c.zona;
    porRotulo.set(clave, [...(porRotulo.get(clave) ?? []), c]);
  }
  const rotulos = [...porRotulo.entries()].map(([texto, del]) => {
    const filaMin = Math.min(...del.map((c) => c.fila));
    const xs = del.map((c) => centroHex(c.col, c.fila).x);
    return { texto, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: centroHex(0, filaMin).y - RADIO - 8 };
  });

  function alTeclear(evento: KeyboardEvent, id: string) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      alElegir(id);
    }
  }

  return (
    <svg
      className="mapa-svg"
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho}
      height={alto}
      role="group"
      aria-label={vista === 'calidad' ? 'Mapa de resultados de la tira por urbanización' : 'Mapa de clientes por urbanización'}
    >
      {rotulos.map((r) => (
        <text key={r.texto} x={r.x} y={r.y} className="mapa-rotulo" textAnchor="middle" aria-hidden="true">
          {r.texto.toUpperCase()}
        </text>
      ))}
      {celdas.map((u) => {
        const { x, y } = centroHex(u.col, u.fila);
        const lineas = etiquetaCorta(u.nombre);
        const elegido = elegida === u.id;
        const letra = vista === 'calidad' ? LETRA_ESTADO[u.estado] : '';
        const conAlerta = vista === 'calidad' && u.alerta;
        return (
          <g
            key={u.id}
            role="button"
            tabIndex={0}
            aria-label={etiquetaAccesible(u)}
            aria-pressed={elegido}
            className={`mapa-hex ${claseHex(u, vista)}${conAlerta ? ' mapa-hex--alerta' : ''}${elegido ? ' mapa-hex--elegido' : ''}`}
            onClick={() => alElegir(u.id)}
            onFocus={() => alElegir(u.id)}
            onKeyDown={(e) => alTeclear(e, u.id)}
            data-id={u.id}
          >
            <title>{etiquetaAccesible(u)}</title>
            <polygon points={puntosHex(x, y)} className="mapa-hex__forma" />
            {conAlerta ? (
              <g transform={`translate(${x - 15} ${y - 31}) scale(0.5)`} className="mapa-hex__icono-alerta">
                <TrazoAlerta />
              </g>
            ) : null}
            {letra && (
              <text x={conAlerta ? x + 5 : x} y={y - 17} textAnchor="middle" className="mapa-hex__letra" aria-hidden="true">
                {letra}
              </text>
            )}
            {lineas.map((linea, i) => (
              <text
                key={i}
                x={x}
                y={y - (lineas.length === 1 ? 0 : 5) + i * 11}
                textAnchor="middle"
                className="mapa-hex__nombre"
                aria-hidden="true"
              >
                {linea}
              </text>
            ))}
            <text x={x} y={y + 24} textAnchor="middle" className="mapa-hex__numero" aria-hidden="true">
              {u.hogares}
            </text>
            {u.tiendas.length > 0 && (
              <g transform={`translate(${x + ANCHO_HEX / 2 - 22} ${y - RADIO + 6})`} className="mapa-hex__tienda" aria-hidden="true">
                <circle cx={9} cy={9} r={10} />
                <g transform="translate(2 2) scale(0.58)">
                  <TrazoTienda />
                </g>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
