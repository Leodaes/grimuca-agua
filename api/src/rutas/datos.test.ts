import { describe, expect, it } from 'vitest';
import { aCartuchoPublico, filaACartucho, sugerirCartuchos, sugerirDesinfeccion, type CartuchoCatalogo } from './datos';

function cartucho(codigo: string, categoria: string | null, corrige: string[], extra: Partial<CartuchoCatalogo> = {}): CartuchoCatalogo {
  return {
    codigo,
    nombre: `Producto ${codigo}`,
    marca: 'Marca de prueba',
    precio_usd: null,
    corrige,
    es_ejemplo: false,
    foto_url: null,
    categoria,
    url_producto: null,
    disponible: true,
    recomendable: true,
    ...extra,
  };
}

const catalogo: CartuchoCatalogo[] = [
  cartucho('C-SED', 'cartucho', ['sedimentos']),
  cartucho('C-CTO', 'cartucho', ['sedimentos', 'cloro_libre', 'sabor_olor']),
  cartucho('F-2ET', 'filtro', ['sedimentos', 'cloro_libre']),
  cartucho('O-RO', 'sistema_osmosis_inversa', ['sedimentos', 'cloro_libre', 'nitrato', 'plomo']),
  cartucho('S-SUAV', 'suavizador', ['dureza']),
  cartucho('U-UV', 'lampara_uv', ['bacterias']),
  cartucho('R-ORING', 'repuesto', ['sedimentos'], { recomendable: false }),
  cartucho('C-AGOT', 'cartucho', ['sedimentos', 'cloro_libre', 'nitrato'], { disponible: false }),
  cartucho('X-OTRA', 'cartucho', ['sedimentos'], { marca: 'Otra Marca' }),
];

const codigos = (lista: Array<{ codigo: string }>) => lista.map((c) => c.codigo);

describe('sugerirCartuchos', () => {
  it('con filtro en casa van primero los cartuchos; después, por coincidencias y por código', () => {
    const sugeridos = sugerirCartuchos(catalogo, { corrige: ['sedimentos', 'cloro_libre'], tieneFiltro: true });
    expect(codigos(sugeridos)).toEqual(['C-CTO', 'C-SED', 'X-OTRA', 'F-2ET']);
  });

  it('sin filtro van primero los filtros y la ósmosis', () => {
    const sugeridos = sugerirCartuchos(catalogo, { corrige: ['sedimentos', 'cloro_libre'], tieneFiltro: false });
    expect(codigos(sugeridos)).toEqual(['F-2ET', 'O-RO', 'C-CTO', 'C-SED']);
  });

  it('nunca pasa de 4 ni incluye repuestos, agotados o equipos de desinfección', () => {
    const todo = ['sedimentos', 'cloro_libre', 'nitrato', 'plomo', 'dureza', 'bacterias', 'sabor_olor'];
    for (const tieneFiltro of [true, false]) {
      const sugeridos = sugerirCartuchos(catalogo, { corrige: todo, tieneFiltro });
      expect(sugeridos).toHaveLength(4);
      expect(codigos(sugeridos)).not.toContain('U-UV');
      expect(codigos(sugeridos)).not.toContain('R-ORING');
      expect(codigos(sugeridos)).not.toContain('C-AGOT');
    }
  });

  it('si lo único por corregir son bacterias, la tira no sugiere nada', () => {
    expect(sugerirCartuchos(catalogo, { corrige: ['bacterias'], tieneFiltro: false })).toEqual([]);
    expect(sugerirCartuchos(catalogo, { corrige: [], tieneFiltro: true })).toEqual([]);
  });

  it('respeta las marcas excluidas sin importar mayúsculas y no expone campos internos', () => {
    const sugeridos = sugerirCartuchos(catalogo, { corrige: ['sedimentos'], tieneFiltro: true, marcasExcluidas: ['otra marca'] });
    expect(codigos(sugeridos)).not.toContain('X-OTRA');
    expect(sugeridos[0]).not.toHaveProperty('recomendable');
  });

  it('a igualdad de criterio, los productos con foto van antes que los sin foto', () => {
    const conFoto = [
      cartucho('A-SINFOTO', 'cartucho', ['sedimentos']),
      cartucho('B-CONFOTO', 'cartucho', ['sedimentos'], { foto_url: 'https://grimuca.com/b.jpg' }),
    ];
    expect(codigos(sugerirCartuchos(conFoto, { corrige: ['sedimentos'], tieneFiltro: true }))).toEqual(['B-CONFOTO', 'A-SINFOTO']);
  });

  it('con gravedad, el primero atiende lo más grave aunque el hogar tenga filtro (nitrato rojo antes que dureza amarilla)', () => {
    const gravedad = { nitrato: 4, dureza: 1 };
    const sugeridos = sugerirCartuchos(catalogo, { corrige: ['nitrato', 'dureza', 'sedimentos'], tieneFiltro: true, gravedad });
    expect(codigos(sugeridos)[0]).toBe('O-RO');
    // Cada hallazgo sigue cubierto y no pasa de 4.
    expect(codigos(sugeridos)).toContain('S-SUAV');
    expect(sugeridos.length).toBeLessThanOrEqual(4);
  });

  it('con gravedad, a igual color va primero lo de salud (cloro libre antes que dureza)', () => {
    const gravedad = { cloro_libre: 2, dureza: 1 };
    const sugeridos = sugerirCartuchos(catalogo, { corrige: ['dureza', 'cloro_libre'], tieneFiltro: true, gravedad });
    expect(codigos(sugeridos)[0]).toBe('C-CTO');
    expect(codigos(sugeridos)).toContain('S-SUAV');
  });
});

describe('sugerirDesinfeccion', () => {
  it('solo trae equipos de desinfección disponibles', () => {
    const conAgotada = [...catalogo, cartucho('U-UV2', 'lampara_uv', ['bacterias'], { disponible: false })];
    expect(codigos(sugerirDesinfeccion(conAgotada))).toEqual(['U-UV']);
  });
});

describe('filaACartucho', () => {
  it('convierte la fila de la base y completa lo que falta', () => {
    const leido = filaACartucho({ codigo: 'A', nombre: 'a', marca: 'm', precio_usd: '12.50', corrige: null, es_ejemplo: false });
    expect(leido).toMatchObject({ precio_usd: 12.5, corrige: [], categoria: null, url_producto: null, disponible: true, recomendable: true });
    expect(aCartuchoPublico(leido)).not.toHaveProperty('recomendable');
  });
});
