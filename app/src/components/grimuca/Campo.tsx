import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Icono } from './Icono';
import { unir } from './utilidades';

export interface OpcionCampo {
  /** Valor que se envía. */
  valor: string;
  /** Texto que ve la persona. */
  etiqueta: string;
}

interface PropsComunesCampo {
  /** Texto de la etiqueta, siempre visible. */
  etiqueta: string;
  /** Ayuda corta debajo del control. */
  ayuda?: string;
  /** Mensaje de error; si existe, el control se marca como inválido. */
  error?: string;
  /** Agrega "(opcional)" junto a la etiqueta. */
  opcional?: boolean;
  /** Clases extra para el contenedor. */
  className?: string;
}

export type PropsCampoEntrada = PropsComunesCampo &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    /** Tipo de control (por defecto, una entrada de una línea). */
    como?: 'input';
  };

export type PropsCampoSelect = PropsComunesCampo &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> & {
    /** Tipo de control: lista desplegable. */
    como: 'select';
    /** Opciones de la lista. */
    opciones: OpcionCampo[];
    /** Primera opción vacía, por ejemplo "Elige tu zona". */
    marcador?: string;
  };

export type PropsCampoArea = PropsComunesCampo &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
    /** Tipo de control: texto de varias líneas. */
    como: 'textarea';
  };

export type PropsCampo = PropsCampoEntrada | PropsCampoSelect | PropsCampoArea;

/** Etiqueta + control (input, select o textarea) + ayuda + error. */
export function Campo(props: PropsCampo) {
  const idAutomatico = useId();
  const id = props.id ?? idAutomatico;
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descritoPor =
    [props.ayuda ? idAyuda : '', props.error ? idError : ''].filter(Boolean).join(' ') || undefined;
  const invalido = props.error ? true : undefined;

  let control: ReactNode;
  if (props.como === 'select') {
    const { como, etiqueta, ayuda, error, opcional, className, opciones, marcador, ...resto } = props;
    control = (
      <select
        {...resto}
        id={id}
        className="g-control"
        aria-invalid={invalido}
        aria-describedby={descritoPor}
      >
        {marcador !== undefined && <option value="">{marcador}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    );
  } else if (props.como === 'textarea') {
    const { como, etiqueta, ayuda, error, opcional, className, ...resto } = props;
    control = (
      <textarea
        {...resto}
        id={id}
        className="g-control g-control--area"
        aria-invalid={invalido}
        aria-describedby={descritoPor}
      />
    );
  } else {
    const { como, etiqueta, ayuda, error, opcional, className, ...resto } = props;
    control = (
      <input
        {...resto}
        id={id}
        className="g-control"
        aria-invalid={invalido}
        aria-describedby={descritoPor}
      />
    );
  }

  return (
    <div className={unir('g-campo', props.className)}>
      <label className="g-campo__etiqueta" htmlFor={id}>
        {props.etiqueta}
        {props.opcional && <span className="g-campo__opcional"> (opcional)</span>}
      </label>
      {control}
      {props.ayuda && (
        <p className="g-campo__ayuda" id={idAyuda}>
          {props.ayuda}
        </p>
      )}
      {props.error && (
        <p className="g-campo__error" id={idError}>
          <Icono nombre="alerta" tamano={18} />
          <span>{props.error}</span>
        </p>
      )}
    </div>
  );
}
