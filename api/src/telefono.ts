// Normalización del número de WhatsApp a formato internacional sin espacios (+584145550199).
// Este archivo existe dos veces y las dos copias deben ser idénticas:
//   app/src/lib/telefono.ts  y  api/src/telefono.ts
// El front lo usa al salir del campo y al guardar; la API, en el esquema de POST/PATCH /api/hogares.

export interface CodigoPais {
  /** Solo dígitos, sin "+". */
  codigo: string;
  etiqueta: string;
}

export const CODIGO_PAIS_POR_DEFECTO = '58';

export const CODIGOS_PAIS: readonly CodigoPais[] = [
  { codigo: '58', etiqueta: '+58 Venezuela' },
  { codigo: '57', etiqueta: '+57 Colombia' },
  { codigo: '1', etiqueta: '+1 EE. UU./Canadá' },
  { codigo: '34', etiqueta: '+34 España' },
  { codigo: '507', etiqueta: '+507 Panamá' },
  { codigo: '56', etiqueta: '+56 Chile' },
  { codigo: '51', etiqueta: '+51 Perú' },
  { codigo: '593', etiqueta: '+593 Ecuador' },
  { codigo: '52', etiqueta: '+52 México' },
  { codigo: '54', etiqueta: '+54 Argentina' },
];

/** Prefijos de celular en Venezuela (sin el 0). */
export const PREFIJOS_CELULAR_VE: readonly string[] = ['412', '414', '416', '422', '424', '426'];

export const ERROR_TELEFONO_VE = 'Revisa el número: debe ser un celular, por ejemplo 0414 555 01 99';
export const ERROR_TELEFONO_OTRO = 'Revisa el número: debe tener entre 7 y 12 dígitos.';
export const ERROR_TELEFONO_VACIO = 'Escribe tu número de WhatsApp.';
export const ERROR_TELEFONO_CODIGO = 'Revisa el código de país del número.';

export type ResultadoTelefono = { ok: true; numero: string; codigo: string; nacional: string } | { ok: false; error: string };

const CODIGOS_POR_LARGO = [...CODIGOS_PAIS].sort((a, b) => b.codigo.length - a.codigo.length);

function nacionalValido(codigo: string, nacional: string): boolean {
  if (codigo === '58') return nacional.length === 10 && PREFIJOS_CELULAR_VE.includes(nacional.slice(0, 3));
  return /^\d{7,12}$/.test(nacional);
}

function errorDe(codigo: string): string {
  return codigo === '58' ? ERROR_TELEFONO_VE : ERROR_TELEFONO_OTRO;
}

function sinCeroInicial(texto: string): string {
  return texto.startsWith('0') ? texto.slice(1) : texto;
}

/**
 * Normaliza un número de WhatsApp. Quita espacios, guiones, puntos y paréntesis; quita el 0 inicial del número
 * nacional (0414… → 414…); si el número ya trae el código (+58, 58 o 0058) no lo duplica.
 * `codigoPais` es el código elegido en el selector (solo dígitos; por defecto 58).
 */
export function normalizarTelefono(entrada: string, codigoPais: string = CODIGO_PAIS_POR_DEFECTO): ResultadoTelefono {
  const codigoElegido = String(codigoPais).replace(/\D/g, '') || CODIGO_PAIS_POR_DEFECTO;
  const limpio = String(entrada ?? '').replace(/[\s\-.() ]/g, '');
  if (!limpio) return { ok: false, error: ERROR_TELEFONO_VACIO };

  const internacional = limpio.startsWith('+') || limpio.startsWith('00');
  const digitos = (limpio.startsWith('+') ? limpio.slice(1) : limpio.startsWith('00') ? limpio.slice(2) : limpio);
  if (!/^\d+$/.test(digitos)) return { ok: false, error: errorDe(codigoElegido) };

  let codigo = codigoElegido;
  let nacional: string;
  if (internacional) {
    // Primero el código elegido; si no coincide, cualquiera de la lista (el más largo gana).
    const encontrado = digitos.startsWith(codigoElegido)
      ? codigoElegido
      : CODIGOS_POR_LARGO.find((c) => digitos.startsWith(c.codigo))?.codigo;
    if (!encontrado) return { ok: false, error: ERROR_TELEFONO_CODIGO };
    codigo = encontrado;
    nacional = sinCeroInicial(digitos.slice(codigo.length));
  } else {
    nacional = sinCeroInicial(digitos);
    // "584145550199": trae el código sin "+". Se quita solo si así queda un número válido y sin quitarlo no.
    if (!nacionalValido(codigo, nacional) && digitos.startsWith(codigo)) {
      const sinCodigo = sinCeroInicial(digitos.slice(codigo.length));
      if (nacionalValido(codigo, sinCodigo)) nacional = sinCodigo;
    }
  }

  if (!nacionalValido(codigo, nacional)) return { ok: false, error: errorDe(codigo) };
  return { ok: true, numero: `+${codigo}${nacional}`, codigo, nacional };
}

/**
 * Separa un número guardado en código y número nacional para mostrarlo en el formulario.
 * Tolera los formatos viejos ("0414-555-0199"): si no se puede normalizar, lo devuelve tal cual con el código 58.
 */
export function partirTelefono(guardado: string | null | undefined): { codigo: string; nacional: string } {
  const texto = String(guardado ?? '').trim();
  if (!texto) return { codigo: CODIGO_PAIS_POR_DEFECTO, nacional: '' };
  const resultado = normalizarTelefono(texto);
  if (!resultado.ok) return { codigo: CODIGO_PAIS_POR_DEFECTO, nacional: texto };
  return { codigo: resultado.codigo, nacional: formatearNacional(resultado.codigo, resultado.nacional) };
}

/** "4145550199" (+58) → "0414 555 01 99". Otros países: los dígitos tal cual. */
export function formatearNacional(codigo: string, nacional: string): string {
  const digitos = nacional.replace(/\D/g, '');
  if (codigo === '58' && digitos.length === 10) {
    return `0${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6, 8)} ${digitos.slice(8)}`;
  }
  return digitos;
}

/** Número guardado → texto legible: "+584145550199" → "0414 555 01 99"; otros: "+57 3001234567". */
export function formatearTelefono(guardado: string | null | undefined): string {
  const texto = String(guardado ?? '').trim();
  if (!texto) return '';
  const resultado = normalizarTelefono(texto);
  if (!resultado.ok) return texto;
  if (resultado.codigo === '58') return formatearNacional('58', resultado.nacional);
  return `+${resultado.codigo} ${resultado.nacional}`;
}
