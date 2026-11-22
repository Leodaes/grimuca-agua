import { AYUDA_FOTO } from './textos';

/** Ejemplo visual de cómo tomar la foto del filtro: equipo completo dentro del cuadro y la etiqueta a la vista. */
export function EjemploFoto() {
  return (
    <figure className="alta-ejemplo">
      <svg
        viewBox="0 0 280 196"
        role="img"
        aria-label="Ejemplo de foto: el filtro completo dentro del cuadro, con la etiqueta a la vista"
        style={{ fontFamily: 'var(--f-texto)' }}
      >
        {/* Esquinas del visor de la cámara */}
        <g fill="none" stroke="var(--tinta-2)" strokeWidth="3">
          <path d="M16 36V16h20M244 16h20v20M264 140v20h-20M36 160H16v-20" />
        </g>
        {/* Tubería de entrada y salida */}
        <path d="M24 44h32M224 44h32" stroke="var(--azul)" strokeWidth="6" />
        {/* Cabezal */}
        <rect x="56" y="34" width="168" height="20" fill="var(--azul)" />
        {/* Tres vasos */}
        <g fill="var(--azul-50)" stroke="var(--azul)" strokeWidth="2.5">
          <path d="M64 54h44v84a8 8 0 0 1-8 8H72a8 8 0 0 1-8-8z" />
          <path d="M118 54h44v84a8 8 0 0 1-8 8h-28a8 8 0 0 1-8-8z" />
          <path d="M172 54h44v84a8 8 0 0 1-8 8h-28a8 8 0 0 1-8-8z" />
        </g>
        {/* Etiqueta en el vaso del medio */}
        <rect x="124" y="74" width="32" height="40" fill="var(--fondo)" stroke="var(--tinta)" strokeWidth="2" />
        <path d="M130 84h20M130 93h20M130 102h12" stroke="var(--tinta)" strokeWidth="2" />
        {/* Llamadas */}
        <path d="M156 94h66v70" fill="none" stroke="var(--ok)" strokeWidth="2" strokeDasharray="4 3" />
        <g fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinecap="square">
          <path d="M24 179l5 5 9-10" />
          <path d="M150 179l5 5 9-10" />
        </g>
        <g fill="var(--tinta)" fontSize="13" fontWeight="600">
          <text x="44" y="186">Filtro completo</text>
          <text x="170" y="186">Etiqueta visible</text>
        </g>
      </svg>
      <figcaption>{AYUDA_FOTO}</figcaption>
    </figure>
  );
}
