import { describe, expect, it } from 'vitest';
import { crearFrenoDeIntentos, crearToken, DURACION_TOKEN_MS, pinCorrecto, tokenValido } from './operador';

const SECRETO = 'secreto-de-prueba-para-tokens-1234';

describe('token del operador', () => {
  it('un token recién creado es válido con el mismo secreto', () => {
    const token = crearToken(SECRETO);
    expect(token).toMatch(/^\d+\.[\w-]{43}$/);
    expect(tokenValido(token, SECRETO)).toBe(true);
  });

  it('no vale con otro secreto, alterado o vencido', () => {
    const ahora = 1_800_000_000_000;
    const token = crearToken(SECRETO, ahora);
    expect(tokenValido(token, 'otro-secreto-distinto-987654321', ahora)).toBe(false);

    const [vencimiento, firma] = token.split('.');
    // Alargar el vencimiento sin volver a firmar no sirve.
    expect(tokenValido(`${Number(vencimiento) + 1000}.${firma}`, SECRETO, ahora)).toBe(false);
    expect(tokenValido(`${vencimiento}.${firma.slice(0, -1)}x`, SECRETO, ahora)).toBe(false);

    expect(tokenValido(token, SECRETO, ahora + DURACION_TOKEN_MS - 1)).toBe(true);
    expect(tokenValido(token, SECRETO, ahora + DURACION_TOKEN_MS + 1)).toBe(false);
  });

  it('rechaza cualquier cosa que no tenga forma de token', () => {
    for (const malo of [undefined, null, 42, '', 'abc', '.', '123.', '.abc', 'a.b.c', `${'9'.repeat(300)}.x`, ['a']]) {
      expect(tokenValido(malo, SECRETO)).toBe(false);
    }
  });
});

describe('PIN del operador', () => {
  it('compara el PIN completo', () => {
    expect(pinCorrecto('2468', '2468')).toBe(true);
    expect(pinCorrecto('246', '2468')).toBe(false);
    expect(pinCorrecto('24680', '2468')).toBe(false);
    expect(pinCorrecto('', '2468')).toBe(false);
  });

  it('sin PIN configurado nadie entra', () => {
    expect(pinCorrecto('', null)).toBe(false);
    expect(pinCorrecto('1234', null)).toBe(false);
  });
});

describe('freno de intentos', () => {
  it('bloquea al llegar al máximo y libera cuando pasa la ventana', () => {
    const freno = crearFrenoDeIntentos(3, 1_000);
    for (let i = 0; i < 3; i += 1) {
      expect(freno.bloqueado('a', 100 + i)).toBe(false);
      freno.anotarFallo('a', 100 + i);
    }
    expect(freno.bloqueado('a', 200)).toBe(true);
    expect(freno.bloqueado('b', 200)).toBe(false);
    expect(freno.bloqueado('a', 1_200)).toBe(false);
  });

  it('entrar bien limpia la cuenta', () => {
    const freno = crearFrenoDeIntentos(2, 1_000);
    freno.anotarFallo('a', 1);
    freno.anotarFallo('a', 2);
    freno.limpiar('a');
    expect(freno.bloqueado('a', 3)).toBe(false);
  });
});
