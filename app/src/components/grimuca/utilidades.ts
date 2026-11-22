/** Une nombres de clase y descarta los valores vacíos. */
export function unir(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ');
}

/** Da formato de dinero en dólares con coma decimal: 9 → "$9,00". */
export function formatoUsd(monto: number): string {
  return `$${monto.toFixed(2).replace('.', ',')}`;
}
