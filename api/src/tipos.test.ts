import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAIZ_REPO } from './config';
import { IDS_TIENDA, tiendaSugerida, ZONAS } from './tipos';

describe('tipos compartidos', () => {
  it('la copia del front es idéntica a la de la API', () => {
    const normalizar = (texto: string) => texto.replace(/\r\n/g, '\n');
    const api = normalizar(readFileSync(path.join(RAIZ_REPO, 'api/src/tipos.ts'), 'utf8'));
    const app = normalizar(readFileSync(path.join(RAIZ_REPO, 'app/src/lib/tipos.ts'), 'utf8'));
    expect(app).toBe(api);
  });

  it('cada zona tiene una tienda sugerida que existe', () => {
    expect(tiendaSugerida('Naguanagua')).toBe('manongo');
    expect(tiendaSugerida('San Diego')).toBe('biglow');
    expect(tiendaSugerida('Valencia norte')).toBe('cem');
    for (const zona of [...ZONAS, 'Zona que no existe']) {
      expect(IDS_TIENDA).toContain(tiendaSugerida(zona));
    }
  });
});
