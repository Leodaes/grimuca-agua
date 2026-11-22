import { ROTULO_VIDEO } from './contenido';

/** Bloque 16:9 que imita la miniatura de un video (no hay video real todavía). */
export function Miniatura({ minutos, grande = false }: { minutos: number; grande?: boolean }) {
  const lado = grande ? 72 : 48;
  return (
    <div
      role="img"
      aria-label={grande ? `${ROTULO_VIDEO}. Duración: ${minutos} min.` : `Video de ${minutos} min`}
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        width: '100%',
        background: 'var(--azul-900)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <svg width={lado} height={lado} viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="23" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M19 15l15 9-15 9z" fill="currentColor" />
      </svg>
      <span
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 8px',
          borderRadius: 2,
          fontSize: '0.875rem',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {minutos} min
      </span>
      {grande && (
        <span
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            background: 'rgba(0,0,0,0.6)',
            padding: '2px 8px',
            borderRadius: 2,
            fontSize: '0.875rem',
          }}
        >
          {ROTULO_VIDEO}
        </span>
      )}
    </div>
  );
}
