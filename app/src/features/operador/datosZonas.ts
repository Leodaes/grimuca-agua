// Zonas y nombres de parámetros que usa el panel del operador.
export const ZONAS_OPERADOR = ['Naguanagua', 'San Diego', 'Valencia norte', 'Valencia sur', 'Otra'] as const;

/** Tienda sugerida por zona (mismo supuesto del contrato). */
const TIENDA_POR_ZONA: Record<string, string> = {
  Naguanagua: 'manongo',
  'San Diego': 'biglow',
  'Valencia norte': 'cem',
};

export function tiendaDeZona(zona: string): string {
  return TIENDA_POR_ZONA[zona] ?? 'cem';
}

const NOMBRES_PARAMETRO: Record<string, string> = {
  cobre: 'cobre (posible presencia, confirma con un laboratorio)',
  plomo: 'plomo (posible presencia, confirma con un laboratorio)',
  nitrato: 'nitrato',
  nitrito: 'nitrito',
  cloro_libre: 'cloro libre',
  dureza: 'dureza (sarro)',
  alcalinidad: 'alcalinidad',
  ph: 'pH (acidez)',
  hierro: 'hierro (color u óxido)',
};

export function nombreParametro(clave: string): string {
  return NOMBRES_PARAMETRO[clave] ?? clave.replace(/_/g, ' ');
}
