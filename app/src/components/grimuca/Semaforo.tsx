import { Icono } from './Icono';
import type { NombreIcono } from './Icono';
import { unir } from './utilidades';

export type NivelSemaforo = 'verde' | 'amarillo' | 'rojo' | 'sin_dato';

/** Palabra que acompaña a cada color; se cambia aquí y cambia en toda la app. */
export const PALABRA_SEMAFORO: Record<NivelSemaforo, string> = {
  verde: 'En rango',
  amarillo: 'Para vigilar',
  rojo: 'Fuera de rango',
  sin_dato: 'Sin lectura',
};

const ICONO_SEMAFORO: Record<NivelSemaforo, NombreIcono> = {
  verde: 'checkCirculo',
  amarillo: 'alerta',
  rojo: 'alto',
  sin_dato: 'sinDato',
};

export interface PropsSemaforo {
  /** Nivel del semáforo. */
  nivel: NivelSemaforo;
  /** Palabra distinta a la habitual para este nivel. */
  palabra?: string;
  /** Tamaño: normal (filas) o grande (resumen general). */
  tamano?: 'normal' | 'grande';
  /** Clases extra. */
  className?: string;
}

/** Semáforo accesible: color, icono con forma propia y palabra, nunca solo color. */
export function Semaforo({ nivel, palabra, tamano = 'normal', className }: PropsSemaforo) {
  return (
    <span
      className={unir(
        'g-semaforo',
        `g-semaforo--${nivel}`,
        tamano === 'grande' && 'g-semaforo--grande',
        className,
      )}
    >
      <Icono nombre={ICONO_SEMAFORO[nivel]} tamano={tamano === 'grande' ? 28 : 20} />
      <span>{palabra ?? PALABRA_SEMAFORO[nivel]}</span>
    </span>
  );
}
