// La tira en uso, como lista intercambiable.
//
// CÓMO CAMBIAR LA TIRA (domingo, con la tira real en la mano):
//   1. Mira el empaque: qué casillas trae y qué valores tiene cada una en la tabla de colores.
//   2. Edita SOLO la constante `tira` al final de este archivo:
//        - quitar una casilla: borra su línea;
//        - añadir una casilla: agrega `parametros.<clave>`;
//        - cambiar los valores de una casilla: `conNiveles(parametros.ph, [6, 7, 8, 9])`.
//   3. Nada más: el lector de fotos, la carga manual y la evaluación se arman a partir de `tira`.
//
// Los cortes del semáforo NO dependen de la tira: están en `umbrales.ts` como reglas por valor.

import type { ClaveParametro, ParametroTira } from '../../tipos';

/** Todos los parámetros que la app sabe evaluar, con los niveles de la tira de referencia W-8. */
export const parametros: Record<ClaveParametro, ParametroTira> = {
  alcalinidad: {
    clave: 'alcalinidad',
    nombre: 'Alcalinidad',
    unidad: 'mg/L',
    niveles: [0, 40, 80, 120, 180, 240],
    orientativo: false,
  },
  dureza: {
    clave: 'dureza',
    nombre: 'Dureza',
    unidad: 'mg/L',
    niveles: [0, 25, 50, 120, 250, 425],
    orientativo: false,
  },
  cobre: {
    clave: 'cobre',
    nombre: 'Cobre',
    unidad: 'mg/L',
    niveles: [0, 0.2, 0.5, 1, 2, 5],
    orientativo: true,
  },
  nitrato: {
    clave: 'nitrato',
    nombre: 'Nitrato',
    unidad: 'mg/L',
    // Por confirmar con el empaque: si la tira lee "como N" y no "como NO3", multiplicar por 4.43.
    niveles: [0, 10, 25, 50, 100, 250],
    orientativo: false,
  },
  cloro_libre: {
    clave: 'cloro_libre',
    nombre: 'Cloro libre',
    unidad: 'mg/L',
    niveles: [0, 0.5, 1, 3, 5, 10],
    orientativo: false,
  },
  plomo: {
    clave: 'plomo',
    nombre: 'Plomo',
    unidad: 'ppb',
    niveles: [0, 5, 15, 30, 50],
    orientativo: true,
  },
  ph: {
    clave: 'ph',
    nombre: 'pH',
    unidad: '',
    // Por confirmar con el empaque: el tramo alto (de 7.6 a 8.8) viene "según empaque".
    niveles: [6.2, 6.8, 7.2, 7.6, 8.4, 8.8],
    orientativo: false,
  },
  nitrito: {
    clave: 'nitrito',
    nombre: 'Nitrito',
    unidad: 'mg/L',
    // Por confirmar con el empaque: Tulio marcó estos niveles como "por confirmar".
    niveles: [0, 1, 5, 10, 20, 40],
    orientativo: false,
  },
  hierro: {
    clave: 'hierro',
    nombre: 'Hierro',
    unidad: 'mg/L',
    // Por confirmar con el empaque: las casillas de hierro varían mucho entre marcas.
    niveles: [0, 0.3, 1, 3, 5],
    orientativo: false,
  },
};

/** Copia un parámetro cambiándole los valores de sus casillas (de menor a mayor). */
export function conNiveles(parametro: ParametroTira, niveles: number[]): ParametroTira {
  return { ...parametro, niveles: [...niveles].sort((a, b) => a - b) };
}

/** Tira de referencia W-8: 8 casillas. */
export const tiraW8: ParametroTira[] = [
  parametros.alcalinidad,
  parametros.dureza,
  parametros.cobre,
  parametros.nitrato,
  parametros.cloro_libre,
  parametros.plomo,
  parametros.ph,
  parametros.nitrito,
];

/**
 * Tira de producción HORYZON 16 en 1, parcial: solo las casillas que la app evalúa.
 * Todos los niveles están por confirmar con el empaque.
 */
export const tiraHoryzon: ParametroTira[] = [
  parametros.ph,
  parametros.dureza,
  parametros.cloro_libre,
  parametros.nitrato,
  parametros.nitrito,
  parametros.plomo,
  parametros.cobre,
  parametros.alcalinidad,
  parametros.hierro,
];

/** ← LA TIRA EN USO. Es lo único que se toca para cambiar de tira. */
export const tira: ParametroTira[] = tiraW8;
