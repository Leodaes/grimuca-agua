import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RAIZ_REPO } from '../config';
import { evaluarAgua } from '../medicion';
import type { Cartucho, FiltroHogar, Nivel, ResultadoParametro, ValoresMedicion } from '../tipos';
import { adaptarSqlPgMem, crearBdDePrueba } from './ayudas-prueba';
import { cartuchosParaFiltro } from '../filtro';
import { listarCatalogo, sugerirConFiltro, type CartuchoCatalogo } from './datos';
import { conMotivos, gravedadPorClave, motivoDe, NOTA_LABORATORIO, PALABRAS_PROHIBIDAS, type ContextoMotivo, type HogarParaMotivo } from './motivos';

function producto(cambios: Partial<Cartucho>): Cartucho {
  return {
    codigo: 'P-1',
    nombre: 'Producto',
    marca: 'Oasis',
    precio_usd: null,
    corrige: [],
    es_ejemplo: false,
    foto_url: null,
    categoria: 'cartucho',
    url_producto: null,
    disponible: true,
    ...cambios,
  };
}

const NOMBRES: Record<string, string> = {
  nitrato: 'Nitrato',
  dureza: 'Dureza',
  cloro_libre: 'Cloro libre',
  plomo: 'Plomo',
  cobre: 'Cobre',
  hierro: 'Hierro',
  ph: 'pH',
};

function parametros(niveles: Record<string, Nivel>): ResultadoParametro[] {
  return Object.entries(niveles).map(([clave, nivel]) => ({
    clave: clave as ResultadoParametro['clave'],
    nombre: NOMBRES[clave] ?? clave,
    unidad: '',
    valor: 1,
    nivel,
    frase: '',
    orientativo: clave === 'plomo' || clave === 'cobre',
  }));
}

const hogarBase: HogarParaMotivo = {
  personas: 3,
  origen_agua: 'chorro',
  agua_turbia: false,
  tiene_filtro: false,
  mascotas: false,
  ultimo_cambio: null,
  filtro: null,
};

const filtroTriple: FiltroHogar = {
  tipo: 'portafiltro_triple',
  tipo_nombre: 'Portafiltro triple',
  etapas: 3,
  medida: '10x2.5',
  modelo_codigo: null,
  modelo_nombre: null,
  marca_visible: null,
  modelo_visible: null,
  confianza: null,
  origen: 'manual',
  observaciones: null,
};

function contexto(niveles: Record<string, Nivel>, hogar: Partial<HogarParaMotivo>, extra: Partial<ContextoMotivo> = {}): ContextoMotivo {
  return {
    porParametro: parametros(niveles),
    corrige: [...Object.keys(niveles).filter((c) => niveles[c] !== 'verde'), ...(hogar.agua_turbia ? ['sedimentos'] : [])],
    diasParaRecambio: null,
    hogar: { ...hogarBase, ...hogar },
    ...extra,
  };
}

function sinProhibidas(frase: string) {
  const texto = frase.toLowerCase();
  for (const palabra of PALABRAS_PROHIBIDAS) expect(texto, `"${palabra}" en: ${frase}`).not.toContain(palabra);
}

describe('motivoDe', () => {
  it('ósmosis para un hogar sin filtro con nitrato en rojo y dureza en amarillo', () => {
    const osmosis = producto({ categoria: 'sistema_osmosis_inversa', nombre: 'Sistema de Ósmosis Inversa 5 Etapas', corrige: ['nitrato', 'dureza', 'sedimentos'] });
    const { motivo, atiende } = motivoDe(osmosis, contexto({ dureza: 'amarillo', nitrato: 'rojo', ph: 'verde' }, { personas: 5 }));
    expect(motivo).toBe(
      'Te recomendamos esta ósmosis inversa porque tu medición dio Nitrato en Rojo y Dureza en Amarillo. Está pensada para esas casillas. Son 5 en casa y todavía no tienen filtro. La tira solo orienta: confirma con un laboratorio.',
    );
    expect(atiende).toEqual([
      { clave: 'nitrato', nombre: 'Nitrato', nivel: 'rojo' },
      { clave: 'dureza', nombre: 'Dureza', nivel: 'amarillo' },
      { clave: 'sin_filtro', nombre: 'Sin filtro en casa', nivel: null },
    ]);
  });

  it('cartucho de sedimentos por agua turbia de tanque, de la medida del filtro', () => {
    const sedimentos = producto({ codigo: 'SED-10', nombre: 'Cartucho de Sedimentos PP 10" x 2.5"', corrige: ['sedimentos'] });
    const { motivo } = motivoDe(
      sedimentos,
      contexto({ ph: 'verde' }, { agua_turbia: true, origen_agua: 'tanque', tiene_filtro: true, filtro: filtroTriple, ultimo_cambio: 'menos_de_un_mes' }, {
        compatibles: new Set(['SED-10']),
        diasParaRecambio: 60,
      }),
    );
    expect(motivo).toBe(
      'Te recomendamos este cartucho de sedimentos porque nos dijiste que el agua sale turbia y viene de tanque. Está pensado para retener la tierra y el sedimento. Es de la medida de tu filtro (10 x 2.5).',
    );
  });

  it('suavizador con dureza en rojo explica qué es', () => {
    const suavizador = producto({ categoria: 'suavizador', nombre: 'Suavizador de agua', corrige: ['dureza'] });
    const { motivo } = motivoDe(suavizador, contexto({ dureza: 'rojo' }, { tiene_filtro: true }));
    expect(motivo).toBe(
      'Te recomendamos este suavizador porque tu medición dio Dureza en Rojo: es el sarro que mancha la grifería. Está pensado para esa casilla.',
    );
  });

  it('carbón con cloro en amarillo y recambio vencido al final', () => {
    const carbon = producto({ nombre: 'Cartucho de Carbón GAC 10" x 4.5"', corrige: ['cloro_libre', 'sabor_olor'] });
    const { motivo, atiende } = motivoDe(carbon, contexto({ cloro_libre: 'amarillo' }, { tiene_filtro: true, ultimo_cambio: 'mas_de_tres_meses' }));
    expect(motivo).toMatch(/^Te recomendamos este cartucho de carbón porque tu medición dio Cloro libre en Amarillo/);
    expect(motivo.endsWith('Ya te toca el cambio: el último fue hace más de tres meses.')).toBe(true);
    expect(atiende.map((a) => a.clave)).toEqual(['cloro_libre', 'recambio']);
  });

  it('plomo y cobre llevan la nota de laboratorio; nunca más de 3 parámetros', () => {
    const osmosis = producto({ categoria: 'sistema_osmosis_inversa', corrige: ['plomo', 'cobre', 'nitrato', 'dureza'] });
    const { motivo, atiende } = motivoDe(
      osmosis,
      contexto({ plomo: 'rojo', cobre: 'amarillo', nitrato: 'rojo', dureza: 'amarillo' }, { personas: 1, mascotas: true }),
    );
    expect(motivo).toContain(NOTA_LABORATORIO);
    expect(atiende.filter((a) => a.nivel !== null)).toHaveLength(3);
    expect(motivo).not.toContain('Dureza');
    expect(motivo).toContain('Eres una sola persona en casa, con mascotas, y todavía no tienes filtro.');
  });

  it('el cloro en cero (regla sin cloro) no se atribuye a un cartucho de carbón', () => {
    const carbon = producto({ nombre: 'Cartucho de Carbón', corrige: ['cloro_libre', 'sabor_olor'] });
    const ctx = contexto({ cloro_libre: 'amarillo' }, {});
    const { motivo } = motivoDe(carbon, { ...ctx, corrige: ['bacterias'] });
    expect(motivo).not.toContain('Amarillo');
  });

  it('no repite la misma frase en dos productos', () => {
    const a = producto({ codigo: 'A', nombre: 'Cartucho de Carbón A', corrige: ['cloro_libre'] });
    const b = producto({ codigo: 'B', nombre: 'Cartucho de Carbón B', corrige: ['cloro_libre'] });
    const c = producto({ codigo: 'C', nombre: 'Cartucho de Carbón C', corrige: ['cloro_libre'] });
    const d = producto({ codigo: 'D', nombre: 'Cartucho de Carbón D', corrige: ['cloro_libre'] });
    const frases = conMotivos([a, b, c, d], contexto({ cloro_libre: 'rojo' }, { tiene_filtro: true })).map((s) => s.motivo);
    expect(new Set(frases).size).toBe(4);
  });
});

describe('frases con el catálogo real (db/semilla_cartuchos.sql)', () => {
  async function catalogoReal(): Promise<CartuchoCatalogo[]> {
    const bd = await crearBdDePrueba();
    const sql = readFileSync(path.join(RAIZ_REPO, 'db/semilla_cartuchos.sql'), 'utf8');
    await bd.query(adaptarSqlPgMem(sql));
    return listarCatalogo(bd);
  }

  const MEDICIONES: ValoresMedicion[] = [
    { nitrato: 50, dureza: 425, cloro_libre: 1, ph: 7.2 },
    { cloro_libre: 10, dureza: 250, plomo: 50, cobre: 3 },
    { hierro: 5, ph: 8.8, alcalinidad: 240, nitrito: 10 },
    { cloro_libre: 0, dureza: 0, ph: 7.2 },
  ];
  const HOGARES: HogarParaMotivo[] = [
    { ...hogarBase, personas: 5 },
    { ...hogarBase, agua_turbia: true, origen_agua: 'tanque', tiene_filtro: true, filtro: filtroTriple, ultimo_cambio: 'mas_de_tres_meses' },
    { ...hogarBase, origen_agua: 'pozo', tiene_filtro: true, ultimo_cambio: 'no_me_acuerdo', mascotas: true },
    { ...hogarBase, personas: 1, tiene_filtro: true, filtro: { ...filtroTriple, tipo: 'osmosis_inversa', medida: null, etapas: 5 } },
  ];

  it('ninguna frase usa palabras prohibidas, todas dicen "pensado para" y no se repiten', async () => {
    const catalogo = await catalogoReal();
    expect(catalogo.length).toBeGreaterThan(50);
    let total = 0;
    for (const valores of MEDICIONES) {
      for (const hogar of HOGARES) {
        const evaluacion = evaluarAgua(valores, { ...hogar, etapas_filtro: null, fecha_ultimo_cambio: null });
        const filtro = hogar.tiene_filtro ? (hogar.filtro ?? null) : null;
        const ctx: ContextoMotivo = {
          porParametro: evaluacion.porParametro,
          corrige: evaluacion.corrige,
          diasParaRecambio: evaluacion.diasParaRecambio,
          hogar,
          compatibles: filtro ? new Set(cartuchosParaFiltro(filtro, catalogo, evaluacion.corrige).map((c) => c.codigo)) : undefined,
        };
        const sugeridos = conMotivos(
          sugerirConFiltro(catalogo, { corrige: evaluacion.corrige, tieneFiltro: hogar.tiene_filtro }, filtro),
          ctx,
        );
        expect(new Set(sugeridos.map((s) => s.motivo)).size).toBe(sugeridos.length);
        const conGravedad = sugerirConFiltro(
          catalogo,
          { corrige: evaluacion.corrige, tieneFiltro: hogar.tiene_filtro, gravedad: gravedadPorClave(evaluacion.porParametro) },
          filtro,
        );
        expect(conGravedad.length).toBeLessThanOrEqual(4);
        // Con gravedad, todo hallazgo que ya quedaba cubierto sigue cubierto.
        for (const clave of evaluacion.corrige.filter((c) => sugeridos.some((s) => s.corrige.includes(c)))) {
          expect(conGravedad.some((s) => s.corrige.includes(clave)), clave).toBe(true);
        }
        // Además, la frase de cada producto del catálogo, aunque no salga sugerido.
        const todas = [...sugeridos, ...catalogo.map((p) => ({ ...p, ...motivoDe(p, ctx) }))];
        for (const s of todas) {
          total += 1;
          sinProhibidas(s.motivo);
          expect(s.motivo).toMatch(/pensad[oa] para/i);
          expect(s.motivo).not.toMatch(/undefined|null|NaN/);
          expect(s.atiende.filter((a) => a.nivel !== null).length).toBeLessThanOrEqual(3);
          if (s.atiende.some((a) => a.clave === 'plomo' || a.clave === 'cobre')) expect(s.motivo).toContain(NOTA_LABORATORIO);
        }
      }
    }
    expect(total).toBeGreaterThan(1000);
  });

  it('nitrato en rojo y dureza en amarillo: el primero atiende el nitrato y su frase lo nombra primero', async () => {
    const catalogo = await catalogoReal();
    for (const hogar of [HOGARES[0], { ...HOGARES[1], agua_turbia: false }]) {
      const evaluacion = evaluarAgua({ nitrato: 50, dureza: 250, cloro_libre: 1, ph: 7.2 }, { ...hogar, etapas_filtro: null, fecha_ultimo_cambio: null });
      const nivel = (clave: string) => evaluacion.porParametro.find((p) => p.clave === clave)?.nivel;
      expect(nivel('nitrato')).toBe('rojo');
      expect(nivel('dureza')).toBe('amarillo');
      const filtro = hogar.tiene_filtro ? (hogar.filtro ?? null) : null;
      const sugeridos = conMotivos(
        sugerirConFiltro(
          catalogo,
          { corrige: evaluacion.corrige, tieneFiltro: hogar.tiene_filtro, gravedad: gravedadPorClave(evaluacion.porParametro) },
          filtro,
        ),
        {
          porParametro: evaluacion.porParametro,
          corrige: evaluacion.corrige,
          diasParaRecambio: evaluacion.diasParaRecambio,
          hogar,
          compatibles: filtro ? new Set(cartuchosParaFiltro(filtro, catalogo, evaluacion.corrige).map((c) => c.codigo)) : undefined,
        },
      );
      const [primero] = sugeridos;
      expect(primero.corrige).toContain('nitrato');
      expect(primero.atiende[0]).toMatchObject({ clave: 'nitrato', nivel: 'rojo' });
      expect(primero.motivo).toMatch(/^Te recomendamos [^.]+ porque (tu medición dio|en tu medición salió|la tira marcó) Nitrato en Rojo/);
      // Cada hallazgo sigue atendido por algún sugerido.
      expect(sugeridos.some((s) => s.corrige.includes('dureza'))).toBe(true);
    }
  });
});
