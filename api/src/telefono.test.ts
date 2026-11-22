import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ERROR_TELEFONO_OTRO,
  ERROR_TELEFONO_VE,
  formatearTelefono,
  normalizarTelefono,
  partirTelefono,
} from './telefono';

const numero = (entrada: string, codigo?: string) => {
  const r = normalizarTelefono(entrada, codigo);
  return r.ok ? r.numero : r.error;
};

describe('normalizarTelefono', () => {
  it.each([
    '0414-555-0199',
    '4145550199',
    '+58 414 5550199',
    '584145550199',
    '00584145550199',
    '(0414) 555.01.99',
    '+58 0414 555 01 99',
  ])('%s → +584145550199', (entrada) => {
    expect(numero(entrada)).toBe('+584145550199');
  });

  it('rechaza números que no son celulares de Venezuela', () => {
    expect(numero('0241-555-0199')).toBe(ERROR_TELEFONO_VE);
    expect(numero('0414-555')).toBe(ERROR_TELEFONO_VE);
    expect(numero('hola')).toBe(ERROR_TELEFONO_VE);
    expect(normalizarTelefono('').ok).toBe(false);
  });

  it('otros países: entre 7 y 12 dígitos, sin duplicar el código', () => {
    expect(numero('300 123 4567', '57')).toBe('+573001234567');
    expect(numero('+57 300 123 4567', '57')).toBe('+573001234567');
    expect(numero('+57 300 123 4567')).toBe('+573001234567');
    expect(numero('123', '34')).toBe(ERROR_TELEFONO_OTRO);
  });
});

describe('formato para mostrar', () => {
  it('formatea y separa los números guardados, también los de formato viejo', () => {
    expect(formatearTelefono('+584145550199')).toBe('0414 555 01 99');
    expect(formatearTelefono('0414-555-0199')).toBe('0414 555 01 99');
    expect(formatearTelefono('cualquier cosa')).toBe('cualquier cosa');
    expect(partirTelefono('+573001234567')).toEqual({ codigo: '57', nacional: '3001234567' });
    expect(partirTelefono('raro')).toEqual({ codigo: '58', nacional: 'raro' });
  });
});

it('la copia del front es idéntica', () => {
  const api = readFileSync(fileURLToPath(new URL('./telefono.ts', import.meta.url)), 'utf8');
  const app = readFileSync(fileURLToPath(new URL('../../app/src/lib/telefono.ts', import.meta.url)), 'utf8');
  expect(app).toBe(api);
});
