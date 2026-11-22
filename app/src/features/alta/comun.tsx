import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Aviso, Boton } from '../../components/grimuca';
import './alta.css';

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
  return 'manongo';
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
  opciones: ReadonlyArray<{ valor: string; etiqueta: string; ayuda?: string; icono?: ReactNode }>;
  valor: string;
  onCambio: (valor: string) => void;
  ayuda?: string;
  error?: string;
  /** 2: tarjetas lado a lado (para Sí / No). Por defecto, una debajo de otra. */
  columnas?: 1 | 2;
  /** Agrega "(opcional)" a la pregunta. */
  opcional?: boolean;
  /**
   * El error se anuncia solo (role="alert"). En formularios con resumen de errores arriba
   * se apaga para no anunciar lo mismo dos veces.
   */
  anunciarError?: boolean;
}

/** Grupo de opciones de una sola elección: tarjetas grandes (48px) con radio nativo, icono opcional y foco visible. */
export function OpcionesRadio({
  pregunta,
  nombre,
  opciones,
  valor,
  onCambio,
  ayuda,
  error,
  columnas = 1,
  opcional = false,
  anunciarError = true,
}: PropsOpcionesRadio) {
  const idError = `${nombre}-error`;
  const idAyuda = `${nombre}-ayuda`;
  const descritoPor = [ayuda ? idAyuda : '', error ? idError : ''].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className="g-grupo alta-grupo" aria-describedby={descritoPor}>
      <legend className="g-campo__etiqueta">
        {pregunta}
        {opcional && <span className="g-campo__opcional"> (opcional)</span>}
      </legend>
      {ayuda && (
        <p className="g-campo__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      )}
      <div className={columnas === 2 ? 'alta-opciones alta-opciones--2' : 'alta-opciones'}>
        {opciones.map((opcion) => {
          const id = `${nombre}-${opcion.valor}`;
          const elegida = valor === opcion.valor;
          const clases = ['alta-opcion', elegida && 'alta-opcion--elegida', error && 'alta-opcion--error']
            .filter(Boolean)
            .join(' ');
          return (
            <label key={opcion.valor} htmlFor={id} className={clases}>
              <input
                id={id}
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={elegida}
                onChange={() => onCambio(opcion.valor)}
                aria-invalid={error ? true : undefined}
              />
              {opcion.icono && (
                <span className="alta-opcion__icono" aria-hidden="true">
                  {opcion.icono}
                </span>
              )}
              <span className="alta-opcion__texto">
                <strong>{opcion.etiqueta}</strong>
                {opcion.ayuda && <span className="alta-opcion__ayuda">{opcion.ayuda}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="g-campo__error" id={idError} role={anunciarError ? 'alert' : undefined}>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

/** "Atrás" arriba del indicador de pasos: enlace de 44px que vuelve al paso anterior sin perder lo escrito. */
export function Atras({ a, texto = 'Atrás' }: { a: string; texto?: string }) {
  return (
    <Link className="alta-atras" to={a}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" strokeLinecap="square" />
      </svg>
      {texto}
    </Link>
  );
}

interface PropsSelectorCantidad {
  id: string;
  name: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  valor: string;
  min: number;
  max: number;
  /** Nombre accesible de los botones: "Una persona menos" / "Una persona más". */
  textoMenos: string;
  textoMas: string;
  onCambio: (valor: string) => void;
  onBlur?: () => void;
}

/** Número con botones − y + de 44px: no hace falta teclear (aunque se puede). */
export function SelectorCantidad({
  id,
  name,
  etiqueta,
  ayuda,
  error,
  valor,
  min,
  max,
  textoMenos,
  textoMas,
  onCambio,
  onBlur,
}: PropsSelectorCantidad) {
  const numero = Number(valor);
  const valido = valor !== '' && Number.isFinite(numero);
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descritoPor = [ayuda ? idAyuda : '', error ? idError : ''].filter(Boolean).join(' ') || undefined;

  function mover(paso: number) {
    const base = valido ? Math.round(numero) : paso > 0 ? min - 1 : min + 1;
    onCambio(String(Math.min(max, Math.max(min, base + paso))));
  }

  return (
    <div className="g-campo">
      <label className="g-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="alta-contador">
        <button
          type="button"
          className="alta-contador__boton"
          aria-label={textoMenos}
          aria-controls={id}
          onClick={() => mover(-1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          id={id}
          name={name}
          className="g-control"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          autoComplete="off"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor}
        />
        <button
          type="button"
          className="alta-contador__boton"
          aria-label={textoMas}
          aria-controls={id}
          onClick={() => mover(1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>
      {ayuda && (
        <p className="g-campo__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p className="g-campo__error" id={idError}>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Resumen de errores arriba del formulario, con un enlace que lleva a cada campo. */
export function ResumenErrores({
  errores,
  alIr,
}: {
  errores: ReadonlyArray<{ clave: string; texto: string; destino: string }>;
  alIr: (clave: string) => void;
}) {
  if (errores.length === 0) return null;
  return (
    <div className="alta-resumen" role="alert">
      <p className="alta-resumen__titulo">
        {errores.length === 1 ? 'Falta un dato para seguir:' : `Faltan ${errores.length} datos para seguir:`}
      </p>
      <ul>
        {errores.map((e) => (
          <li key={e.clave}>
            <a
              href={`#${e.destino}`}
              onClick={(evento) => {
                evento.preventDefault();
                alIr(e.clave);
              }}
            >
              {e.texto}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Borrador en sessionStorage: lo escrito no se pierde al ir y volver. Nunca rompe si el almacenamiento falla. */
export function leerBorrador<T>(clave: string): Partial<T> | null {
  try {
    const crudo = window.sessionStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function guardarBorrador(clave: string, valor: unknown): void {
  try {
    window.sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible: se sigue sin borrador */
  }
}

export function borrarBorrador(clave: string): void {
  try {
    window.sessionStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}

/** Iconos de línea (24px, currentColor) para el origen del agua. */
export function IconoOrigen({ tipo }: { tipo: string }) {
  const trazos: Record<string, ReactNode> = {
    chorro: (
      <>
        <path d="M3 8h10a4 4 0 0 1 4 4v1" />
        <path d="M3 12h7" />
        <path d="M8 8V5M5 5h6" />
        <path d="M17 16.5c-1 1.3-1.6 2.2-1.6 2.9a1.6 1.6 0 0 0 3.2 0c0-.7-.6-1.6-1.6-2.9z" />
      </>
    ),
    botellon: (
      <>
        <path d="M10 2.5h4V6l2.5 2.5V20a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 20V8.5L10 6z" />
        <path d="M7.5 12h9M7.5 16.5h9" />
      </>
    ),
    filtro: (
      <>
        <path d="M5 3.5h14v3H5z" />
        <path d="M7 6.5h10V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        <path d="M10 10v7M14 10v7" />
      </>
    ),
    tanque: (
      <>
        <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
        <path d="M5 5.5V18c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5.5" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
      </>
    ),
    pozo: (
      <>
        <path d="M3.5 8L12 3.5 20.5 8" />
        <path d="M6 8v5M18 8v5M12 8v3" />
        <path d="M4 13h16v7.5H4z" />
        <path d="M4 17h16" />
      </>
    ),
  };
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {trazos[tipo] ?? null}
    </svg>
  );
}

/** "Mañongo" → "Grimuca Mañongo" (si el nombre ya trae la marca, queda igual). */
export function nombreConMarca(nombre: string): string {
  return /^grimuca\b/i.test(nombre.trim()) ? nombre.trim() : `Grimuca ${nombre.trim()}`;
}

/** Contenedor de página de alta: el layout general pone encabezado y barra. */
export function PaginaAlta({ children }: { children: ReactNode }) {
  return (
    <main id="contenido" className="g-pantalla__contenido" lang="es-VE" tabIndex={-1}>
      <div className="g-pila">{children}</div>
    </main>
  );
}
