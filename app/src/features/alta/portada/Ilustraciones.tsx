/**
 * Ilustraciones propias de Grimuca Agua en SVG: líneas rectas, paleta de la marca y los tres colores del semáforo.
 * Son decorativas (aria-hidden): el texto que las acompaña dice lo mismo.
 */

const AZUL = '#12437f';
const AZUL_900 = '#092240';
const AMARILLO = '#fbe919';
const PAPEL = '#f6f6f6';
const LINEA = '#e0e0e0';
const ROJO = '#b42318';
const VERDE = '#166534';
const AMBAR = '#e0a100';
const TURQUESA = '#53b4ba';

/** Colores de las casillas de la tira (orden fijo para que se vea igual en todas las piezas). */
const CASILLAS = [ROJO, AMBAR, VERDE, TURQUESA, AMARILLO, AZUL, '#e8826a', '#7fb88f'];

const FUENTE_TITULO = '"Archivo Variable", "Arial Narrow", sans-serif';

interface PropsDibujo {
  className?: string;
}

/** Tira de medición vertical con sus casillas de colores. */
function Tira({ x, y, alto = 190 }: { x: number; y: number; alto?: number }) {
  const paso = (alto - 20) / CASILLAS.length;
  return (
    <g>
      <rect x={x} y={y} width={20} height={alto} fill="#ffffff" stroke={AZUL_900} strokeWidth={1.5} />
      {CASILLAS.map((color, i) => (
        <rect key={i} x={x + 3} y={y + 10 + i * paso} width={14} height={Math.min(14, paso - 4)} fill={color} />
      ))}
    </g>
  );
}

/** Código QR esquemático (no se puede escanear: es un dibujo). */
function Qr({ x, y, lado }: { x: number; y: number; lado: number }) {
  const c = lado / 7;
  const celdas = [
    [3, 0], [4, 1], [3, 2], [4, 3], [0, 3], [2, 4], [3, 4], [5, 4], [6, 3],
    [4, 5], [6, 5], [3, 6], [5, 6], [6, 6],
  ];
  const ojo = (ox: number, oy: number) => (
    <g>
      <rect x={x + ox * c} y={y + oy * c} width={c * 3} height={c * 3} fill={AZUL_900} />
      <rect x={x + ox * c + c * 0.6} y={y + oy * c + c * 0.6} width={c * 1.8} height={c * 1.8} fill="#ffffff" />
      <rect x={x + ox * c + c} y={y + oy * c + c} width={c} height={c} fill={AZUL_900} />
    </g>
  );
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={lado + 6} height={lado + 6} fill="#ffffff" />
      {ojo(0, 0)}
      {ojo(4, 0)}
      {ojo(0, 4)}
      {celdas.map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={x + cx * c} y={y + cy * c} width={c} height={c} fill={AZUL_900} />
      ))}
    </g>
  );
}

/** El sobre de $9 con todo lo que trae: tira, frasco de bacterias, tabla de colores y QR. */
export function IlustracionSobre({ className, conPrecio = true }: PropsDibujo & { conPrecio?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 240"
      width={360}
      height={240}
      role="img"
      aria-label="El sobre de medición con la tira, el frasco de la prueba de bacterias, la tabla de colores y el código QR."
    >
      {/* Sobre */}
      <rect x={14} y={58} width={196} height={150} fill="#ffffff" stroke={AZUL} strokeWidth={2.5} />
      <polyline points="14,58 112,124 210,58" fill="none" stroke={AZUL} strokeWidth={2.5} strokeLinejoin="miter" />
      <rect x={14} y={176} width={196} height={32} fill={AZUL} />
      <rect x={26} y={190} width={18} height={3} fill={AMARILLO} />
      <rect x={50} y={190} width={90} height={3} fill="#ffffff" opacity={0.7} />
      <Qr x={30} y={122} lado={42} />
      {/* Gota sobre el sobre */}
      <path d="M170 128c8 10 13 16 13 23a13 13 0 0 1-26 0c0-7 5-13 13-23z" fill="none" stroke={AZUL} strokeWidth={2.5} />
      {conPrecio && (
        <g>
          <rect x={142} y={30} width={76} height={46} fill={AMARILLO} />
          <text
            x={180}
            y={64}
            textAnchor="middle"
            fontFamily={FUENTE_TITULO}
            fontWeight={800}
            fontSize={30}
            fill={AZUL_900}
          >
            $9
          </text>
        </g>
      )}
      {/* Tira */}
      <Tira x={232} y={24} alto={192} />
      {/* Tabla de colores */}
      <rect x={268} y={24} width={78} height={70} fill="#ffffff" stroke={AZUL_900} strokeWidth={1.5} />
      {CASILLAS.slice(0, 4).map((color, i) => (
        <g key={color}>
          <rect x={276 + i * 17} y={34} width={12} height={12} fill={color} />
          <rect x={276 + i * 17} y={52} width={12} height={12} fill={color} opacity={0.65} />
          <rect x={276 + i * 17} y={70} width={12} height={12} fill={color} opacity={0.35} />
        </g>
      ))}
      {/* Frasco de la prueba de bacterias */}
      <rect x={284} y={110} width={42} height={16} fill={AZUL} />
      <rect x={288} y={126} width={34} height={90} fill="#ffffff" stroke={AZUL_900} strokeWidth={1.5} />
      <rect x={289} y={170} width={32} height={45} fill="#fff4d6" />
      <line x1={293} y1={150} x2={317} y2={150} stroke={LINEA} strokeWidth={2} />
    </svg>
  );
}

/** Botellón de agua, en línea; toma el color del texto. */
export function IconoBotellon({ className, tamano = 40 }: PropsDibujo & { tamano?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 56"
      width={tamano}
      height={(tamano * 56) / 40}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 3h10v6H15z" />
      <path d="M16 9v4c0 3-11 5-11 12v24c0 2 1.5 4 4 4h22c2.5 0 4-2 4-4V25c0-7-11-9-11-12V9" />
      <path d="M5 32h30M5 42h30" />
    </svg>
  );
}

/** Portafiltro con su cartucho y las esquinas de una cámara: "tómale una foto a tu filtro". */
export function IlustracionFiltro({ className }: PropsDibujo) {
  return (
    <svg className={className} viewBox="0 0 160 180" width={160} height={180} aria-hidden="true" focusable="false">
      {/* Esquinas del visor de la cámara */}
      <g fill="none" stroke={AMARILLO} strokeWidth={4}>
        <path d="M8 34V8h26M126 8h26v26M152 146v26h-26M34 172H8v-26" />
      </g>
      {/* Cabezal y tubos */}
      <rect x={30} y={36} width={100} height={18} fill={AZUL} />
      <rect x={14} y={40} width={16} height={8} fill={AZUL} />
      <rect x={130} y={40} width={16} height={8} fill={AZUL} />
      {/* Vaso */}
      <path d="M46 54h68v92c0 6-4 10-10 10H56c-6 0-10-4-10-10z" fill="#ffffff" stroke={AZUL} strokeWidth={3} />
      {/* Cartucho */}
      <rect x={64} y={64} width={32} height={82} fill={PAPEL} stroke={AZUL_900} strokeWidth={2} strokeDasharray="5 4" />
      <path d="M64 84h32M64 104h32M64 124h32" stroke={AZUL_900} strokeWidth={1.5} />
    </svg>
  );
}

/** Tres pasos: sobre, foto de la tira y semáforo del resultado. Cada uno con su número. */
export function DibujoPaso({ paso }: { paso: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 96 72" width={96} height={72} aria-hidden="true" focusable="false">
      {paso === 1 && (
        <g>
          <rect x={10} y={16} width={64} height={46} fill="#ffffff" stroke={AZUL} strokeWidth={2.5} />
          <polyline points="10,16 42,40 74,16" fill="none" stroke={AZUL} strokeWidth={2.5} />
          <rect x={10} y={52} width={64} height={10} fill={AZUL} />
          <rect x={60} y={6} width={30} height={20} fill={AMARILLO} />
          <text x={75} y={21} textAnchor="middle" fontFamily={FUENTE_TITULO} fontWeight={800} fontSize={14} fill={AZUL_900}>
            $9
          </text>
        </g>
      )}
      {paso === 2 && (
        <g>
          <rect x={22} y={4} width={42} height={66} fill="#ffffff" stroke={AZUL} strokeWidth={2.5} />
          <rect x={22} y={4} width={42} height={8} fill={AZUL} />
          <rect x={36} y={18} width={12} height={46} fill="#ffffff" stroke={AZUL_900} strokeWidth={1.2} />
          {CASILLAS.slice(0, 5).map((color, i) => (
            <rect key={color} x={38} y={21 + i * 8.5} width={8} height={6} fill={color} />
          ))}
          <path d="M70 26h20v18H70z" fill="none" stroke={AZUL} strokeWidth={2.5} />
          <circle cx={80} cy={35} r={4} fill="none" stroke={AZUL} strokeWidth={2.5} />
        </g>
      )}
      {paso === 3 && (
        <g>
          <rect x={26} y={4} width={44} height={66} fill={AZUL_900} />
          <circle cx={48} cy={18} r={8} fill={ROJO} />
          <circle cx={48} cy={37} r={8} fill={AMBAR} />
          <circle cx={48} cy={56} r={8} fill={VERDE} />
          <path d="M44.5 14.5l7 7M51.5 14.5l-7 7" stroke="#ffffff" strokeWidth={2} />
          <path d="M48 33v4M48 40v.5" stroke={AZUL_900} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M44 56l3 3 5-6" stroke="#ffffff" strokeWidth={2} fill="none" />
        </g>
      )}
    </svg>
  );
}
