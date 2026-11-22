import { describe, expect, it } from 'vitest';
import { sugerirConFiltro, sugerirCartuchos } from '../rutas/datos';
import type { FiltroHogar } from '../tipos';
import {
  cartuchosParaFiltro,
  equiposDelCatalogo,
  etapasDelNombre,
  funcionDe,
  medidaDelNombre,
  tipoDelModelo,
  type ProductoCatalogo,
} from './compatibles';

function producto(codigo: string, nombre: string, categoria: string, corrige: string[], extra: Partial<ProductoCatalogo> = {}): ProductoCatalogo {
  return {
    codigo,
    nombre,
    marca: 'Oasis',
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

// Muestra del catálogo real (nombres tal cual vienen en db/semilla_cartuchos.sql).
const CATALOGO: ProductoCatalogo[] = [
  producto('OPW-20LLRFC', 'Cartucho para Filtro Reusable 20" x 2.5"', 'cartucho', ['sedimentos', 'cloro_libre', 'sabor_olor', 'dureza']),
  producto('OPW-20BBRFC', 'Cartucho para Filtro Reusable 20" x 4.5"', 'cartucho', ['sedimentos']),
  producto('OPW-PP20BFL02', 'Cartucho de Sedimentos 20" x 4.5" - 0.22 Micra', 'cartucho', ['sedimentos']),
  producto('OPW-PP20A022', 'Cartucho de Sedimentos 20" x 2.5" - 0.22 Micras', 'cartucho', ['sedimentos']),
  producto('OPW-RSSU5', 'Cartucho de Resina para Ultrafiltración - 5 Etapas', 'cartucho', ['dureza']),
  producto('OPW-GACSU5', 'Cartucho GAC para Ultrafiltración - 5 Etapas', 'cartucho', ['cloro_libre', 'sabor_olor']),
  producto('OPW-CTOSU5', 'Cartucho CTO para Ultrafiltración - 5 Etapas', 'cartucho', ['sedimentos', 'cloro_libre', 'sabor_olor']),
  producto('OPW-DI14RES', 'Cartucho con Resina Deionizador Rellenable', 'cartucho', ['dureza']),
  producto('OPW-ALMB-10A', 'Cartucho Enriquecedor de Minerales 20"', 'cartucho', ['cloro_libre', 'sabor_olor', 'dureza']),
  producto('OPW-UFSU5', 'Membrana UF para Equipos de 5 Etapas', 'membrana_ultrafiltracion', ['nitrato', 'dureza'], { recomendable: false }),
  producto('OPW-10AUFWMR', 'Membrana de Ultrafiltración UF Lavable 10" x 2.5"', 'membrana_ultrafiltracion', ['sedimentos'], { recomendable: false }),
  producto('TFC-2012-100G', 'Membrana de Ósmosis Inversa 100 GPD HID', 'membrana_osmosis', ['nitrato', 'dureza'], { recomendable: false }),
  producto('BW-4040', 'Membrana de Ósmosis Inversa 4040 BW FROTEC - Alta Presión', 'membrana_osmosis', ['nitrato'], { recomendable: false }),
  producto('OPW-6STUF10S', 'Filtro de Agua por Ultrafiltración UF de 6 Etapas - 10" x 2.5"', 'cartucho', ['sedimentos', 'cloro_libre']),
  producto('OPW-200GPD-8TN', 'Filtro de Agua por Ósmosis Inversa de 8 Etapas - 200 GPD', 'sistema_osmosis_inversa', ['nitrato', 'dureza']),
  producto('70L434', 'Tanque de Salmueras de 70 Litros con Válvula 434', 'suavizador', ['dureza']),
  producto('TUV-11W', 'Bombillo para Lámpara UV 11 W - Philips', 'filtro', [], { recomendable: false }),
  producto('EMUV-11W', 'Lámpara de Desinfección UV de 11 W - 1 GPM', 'lampara_uv', ['bacterias']),
  producto('UF5-EQUIPO', 'Filtro de Agua por Ultrafiltración UF de 5 Etapas', 'cartucho', ['sedimentos']),
];

function filtro(cambios: Partial<FiltroHogar>): FiltroHogar {
  return {
    tipo: 'portafiltro_triple',
    tipo_nombre: 'Portafiltro triple',
    etapas: 3,
    medida: null,
    modelo_codigo: null,
    modelo_nombre: null,
    marca_visible: null,
    modelo_visible: null,
    confianza: null,
    origen: 'manual',
    observaciones: null,
    ...cambios,
  };
}

describe('medidaDelNombre y ayudantes', () => {
  it('extrae la medida tolerando comillas, », espacios y x/×', () => {
    expect(medidaDelNombre('Cartucho para Filtro Reusable 20" x 2.5"')).toBe('20x2.5');
    expect(medidaDelNombre('Contenedor 20" x 4.5" con Cartucho PP de 5 Micras')).toBe('20x4.5');
    expect(medidaDelNombre('Cartucho 10»x2,5»')).toBe('10x2.5');
    expect(medidaDelNombre('Cartucho 10 × 4.5 pulgadas')).toBe('10x4.5');
    expect(medidaDelNombre('Cartucho Rellenable en Línea 10" x 2"')).toBe('10x2');
    expect(medidaDelNombre('Cartucho Enriquecedor de Minerales 20"')).toBeNull();
  });

  it('etapas, función y tipo desde el nombre', () => {
    expect(etapasDelNombre('Cartucho GAC para Ultrafiltración - 5 Etapas')).toBe(5);
    expect(etapasDelNombre('Cartucho de Sedimentos')).toBeNull();
    expect(funcionDe(CATALOGO[5])).toBe('carbon');
    expect(funcionDe(CATALOGO[4])).toBe('resina');
    expect(funcionDe(CATALOGO[2])).toBe('sedimentos');
    expect(funcionDe(CATALOGO[9])).toBe('membrana');
    expect(funcionDe(CATALOGO[8])).toBe('minerales');
    expect(tipoDelModelo(CATALOGO[13])).toBe('ultrafiltracion');
    expect(tipoDelModelo(CATALOGO[14])).toBe('osmosis_inversa');
    expect(tipoDelModelo(CATALOGO[15])).toBe('suavizador');
  });

  it('los equipos del catálogo no incluyen cartuchos sueltos ni repuestos de lámparas', () => {
    const codigos = equiposDelCatalogo(CATALOGO).map((e) => e.codigo);
    expect(codigos).toEqual(expect.arrayContaining(['OPW-6STUF10S', 'OPW-200GPD-8TN', '70L434', 'UF5-EQUIPO']));
    expect(codigos).not.toContain('OPW-20LLRFC');
    expect(codigos).not.toContain('TUV-11W');
    expect(codigos).not.toContain('EMUV-11W');
  });
});

describe('cartuchosParaFiltro', () => {
  it('respeta la medida del filtro cuando el nombre del cartucho la trae', () => {
    const lista = cartuchosParaFiltro(filtro({ medida: '20x4.5' }), CATALOGO);
    const codigos = lista.map((c) => c.codigo);
    expect(codigos).toContain('OPW-PP20BFL02');
    expect(codigos).toContain('OPW-20BBRFC');
    expect(codigos).not.toContain('OPW-PP20A022'); // 20x2.5
    expect(codigos).not.toContain('OPW-20LLRFC'); // 20x2.5
    expect(lista.length).toBeLessThanOrEqual(6);
    // Nunca equipos completos ni lámparas.
    expect(codigos).not.toContain('OPW-6STUF10S');
    expect(codigos).not.toContain('EMUV-11W');
    for (const c of lista) expect(c.para_que).toMatch(/^Pensad[oa] para/);
  });

  it('agrupa por función: uno o dos por cada una', () => {
    const lista = cartuchosParaFiltro(filtro({ medida: '20x2.5' }), CATALOGO);
    const porFuncion = new Map<string, number>();
    for (const c of lista) porFuncion.set(c.funcion, (porFuncion.get(c.funcion) ?? 0) + 1);
    for (const cuantos of porFuncion.values()) expect(cuantos).toBeLessThanOrEqual(2);
    expect(porFuncion.has('sedimentos')).toBe(true);
    expect(porFuncion.has('resina')).toBe(true);
  });

  it('con un modelo de 5 etapas prefiere esa familia y descarta otras', () => {
    const uf5 = cartuchosParaFiltro(filtro({ tipo: 'ultrafiltracion', etapas: 5, modelo_codigo: 'UF5-EQUIPO' }), CATALOGO);
    const carbon = uf5.filter((c) => c.funcion === 'carbon').map((c) => c.codigo);
    expect(carbon[0]).toMatch(/SU5$/);
    expect(uf5.find((c) => c.funcion === 'resina')?.codigo).toBe('OPW-RSSU5');
    expect(uf5.find((c) => c.funcion === 'membrana')?.codigo).toBe('OPW-UFSU5');

    const uf6 = cartuchosParaFiltro(filtro({ tipo: 'ultrafiltracion', etapas: 6, modelo_codigo: 'OPW-6STUF10S' }), CATALOGO);
    expect(uf6.map((c) => c.codigo).some((codigo) => codigo.endsWith('SU5'))).toBe(false);
    // La medida sale del nombre del modelo (10x2.5): membrana lavable de 10".
    expect(uf6.find((c) => c.funcion === 'membrana')?.codigo).toBe('OPW-10AUFWMR');
  });

  it('ósmosis: membranas domésticas, no industriales', () => {
    const lista = cartuchosParaFiltro(filtro({ tipo: 'osmosis_inversa', etapas: 5 }), CATALOGO);
    const codigos = lista.map((c) => c.codigo);
    expect(codigos).toContain('TFC-2012-100G');
    expect(codigos).not.toContain('BW-4040');
  });

  it('ordena primero lo que atiende la medición y lo marca', () => {
    const sin = cartuchosParaFiltro(filtro({ medida: '20x2.5' }), CATALOGO);
    expect(sin.every((c) => !c.atiende_medicion)).toBe(true);
    const con = cartuchosParaFiltro(filtro({ medida: '20x2.5' }), CATALOGO, ['dureza']);
    expect(con[0].atiende_medicion).toBe(true);
    expect(con[0].corrige).toContain('dureza');
    const primeroSinAtender = con.findIndex((c) => !c.atiende_medicion);
    if (primeroSinAtender >= 0) expect(con.slice(primeroSinAtender).every((c) => !c.atiende_medicion)).toBe(true);
  });

  it('equipos de tanque no usan cartuchos', () => {
    expect(cartuchosParaFiltro(filtro({ tipo: 'suavizador' }), CATALOGO)).toEqual([]);
    expect(cartuchosParaFiltro(filtro({ tipo: 'desbarrador_tanque' }), CATALOGO)).toEqual([]);
  });
});

describe('sugerirConFiltro', () => {
  it('pone primero los compatibles que atienden lo hallado y mantiene cubierto cada hallazgo', () => {
    const corrige = ['dureza', 'nitrato'];
    const base = sugerirCartuchos(CATALOGO, { corrige, tieneFiltro: true });
    const conFiltro = sugerirConFiltro(CATALOGO, { corrige, tieneFiltro: true }, filtro({ medida: '20x2.5' }));
    expect(conFiltro.length).toBeLessThanOrEqual(4);
    const compatibles = cartuchosParaFiltro(filtro({ medida: '20x2.5' }), CATALOGO, corrige).filter((c) => c.atiende_medicion);
    expect(conFiltro[0].codigo).toBe(compatibles[0].codigo);
    const cubreBase = new Set(base.flatMap((c) => c.corrige).filter((clave) => corrige.includes(clave)));
    const cubreFinal = new Set(conFiltro.flatMap((c) => c.corrige));
    for (const clave of cubreBase) expect(cubreFinal.has(clave)).toBe(true);
    expect(cubreFinal.has('nitrato')).toBe(true);
  });

  it('sin filtro es igual a sugerirCartuchos', () => {
    const criterio = { corrige: ['sedimentos'], tieneFiltro: true };
    expect(sugerirConFiltro(CATALOGO, criterio, null)).toEqual(sugerirCartuchos(CATALOGO, criterio));
  });
});
