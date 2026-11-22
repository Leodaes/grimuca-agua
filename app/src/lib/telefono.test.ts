import { ERROR_TELEFONO_VE, formatearTelefono, normalizarTelefono, partirTelefono } from './telefono';

describe('normalizarTelefono (front)', () => {
  it.each(['0414-555-0199', '4145550199', '+58 414 5550199', '584145550199', '00584145550199'])('%s → +584145550199', (entrada) => {
    expect(normalizarTelefono(entrada)).toMatchObject({ ok: true, numero: '+584145550199' });
  });

  it('número inválido con mensaje claro', () => {
    expect(normalizarTelefono('0212-555-0199')).toEqual({ ok: false, error: ERROR_TELEFONO_VE });
    expect(ERROR_TELEFONO_VE).toBe('Revisa el número: debe ser un celular, por ejemplo 0414 555 01 99');
  });

  it('formatea para mostrar y separa el código', () => {
    expect(formatearTelefono('+584145550199')).toBe('0414 555 01 99');
    expect(partirTelefono('+584145550199')).toEqual({ codigo: '58', nacional: '0414 555 01 99' });
  });
});
