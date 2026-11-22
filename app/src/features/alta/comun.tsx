import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Aviso, Boton } from '../../components/grimuca';

export const ZONAS = ['Naguanagua', 'San Diego', 'Valencia norte', 'Valencia sur', 'Otra'] as const;

export const ORIGENES = [
  { valor: 'chorro', etiqueta: 'Chorro', ayuda: 'Directo de la tubería.' },
  { valor: 'botellon', etiqueta: 'Botellón', ayuda: 'El que compran o rellenan.' },
  { valor: 'filtro', etiqueta: 'Filtro', ayuda: 'Pasa por un filtro antes de tomarla.' },
  { valor: 'tanque', etiqueta: 'Tanque', ayuda: 'Sale de un tanque de la casa o del edificio.' },
  { valor: 'pozo', etiqueta: 'Pozo', ayuda: 'Viene de un pozo.' },
] as const;

/** Tienda sugerida por zona (SUPUESTO del contrato hasta que Tulio confirme). */
export function tiendaSugerida(zona: string | null | undefined): string {
  if (zona === 'Naguanagua') return 'manongo';
  if (zona === 'San Diego') return 'biglow';
  return 'cem';
}

/** Mensaje legible de cualquier error (ErrorApi trae `mensaje`). */
export function mensajeDeError(error: unknown, porDefecto = 'Algo falló de nuestro lado. Intenta otra vez en un momento.'): string {
  if (error && typeof error === 'object' && 'mensaje' in error && typeof (error as { mensaje: unknown }).mensaje === 'string') {
    return (error as { mensaje: string }).mensaje;
  }
  if (error instanceof TypeError) return 'Se fue la señal. Revisa tu internet e intenta otra vez. Lo que llenaste no se pierde.';
  return porDefecto;
}

/** Carga datos con estados de carga y error, y una función para reintentar. */
export function useCarga<T>(cargar: () => Promise<T>, activo = true) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(activo);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    if (!activo) {
      setCargando(false);
      return;
    }
    let vigente = true;
    setCargando(true);
    setError(null);
    cargar()
      .then((valor) => {
        if (vigente) setDatos(valor);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDeError(e));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuelta, activo]);

  const reintentar = useCallback(() => setVuelta((n) => n + 1), []);
  return { datos, error, cargando, reintentar };
}

/** Error simple con botón de reintento. */
export function ErrorConReintento({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div className="g-pila">
      <Aviso tono="error" rol="alert">
        {mensaje}
      </Aviso>
      <Boton variante="secundario" onClick={onReintentar}>
        Intentar otra vez
      </Boton>
    </div>
  );
}

interface PropsOpcionesRadio {
  /** Pregunta del grupo (leyenda del fieldset). */
  pregunta: string;
  /** Nombre del grupo de radios. */
  nombre: string;
  opciones: ReadonlyArray<{ valor: string; etiqueta: string; ayuda?: string }>;
  valor: string;
  onCambio: (valor: string) => void;
  ayuda?: string;
  error?: string;
}

/** Grupo de opciones de una sola elección con radios grandes (44px mínimo). */
export function OpcionesRadio({ pregunta, nombre, opciones, valor, onCambio, ayuda, error }: PropsOpcionesRadio) {
  const idError = `${nombre}-error`;
  return (
    <fieldset className="g-grupo alta-grupo" aria-describedby={error ? idError : undefined}>
      <legend className="g-campo__etiqueta">{pregunta}</legend>
      {ayuda && <p className="g-campo__ayuda">{ayuda}</p>}
      <div className="alta-opciones">
        {opciones.map((opcion) => {
          const id = `${nombre}-${opcion.valor}`;
          const elegida = valor === opcion.valor;
          return (
            <label
              key={opcion.valor}
              htmlFor={id}
              className="alta-opcion"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 44,
                padding: '8px 12px',
                borderRadius: 2,
                border: `${elegida ? 2 : 1}px solid ${elegida ? 'var(--azul)' : 'var(--borde-control)'}`,
                background: elegida ? 'var(--azul-50)' : 'var(--fondo)',
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              <input
                id={id}
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={elegida}
                onChange={() => onCambio(opcion.valor)}
                aria-invalid={error ? true : undefined}
                style={{ width: 22, height: 22, accentColor: 'var(--azul)' }}
              />
              <span>
                <strong>{opcion.etiqueta}</strong>
                {opcion.ayuda && (
                  <span className="g-apagado" style={{ display: 'block', fontSize: '0.9em' }}>
                    {opcion.ayuda}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="g-campo__error" id={idError} role="alert">
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

/** Contenedor de página de alta: el layout general pone encabezado y barra. */
export function PaginaAlta({ children }: { children: ReactNode }) {
  return (
    <main id="contenido" className="g-pantalla__contenido" lang="es-VE" tabIndex={-1}>
      <div className="g-pila">{children}</div>
    </main>
  );
}
