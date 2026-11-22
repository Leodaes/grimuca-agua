// Cartuchos del catálogo compatibles con el filtro del hogar. Funciones puras: no tocan la base.
import type {
  Cartucho,
  CartuchoDelFiltro,
  FiltroHogar,
  FuncionCartucho,
  MedidaCartucho,
  ModeloFiltro,
  TipoFiltro,
} from '../tipos';
import { MEDIDAS_CARTUCHO } from '../tipos';

/** Lo mínimo que se necesita de una fila del catálogo (coincide con `CartuchoCatalogo` de rutas/datos.ts). */
export interface ProductoCatalogo extends Cartucho {
  recomendable: boolean;
}

export type FiltroParaCartuchos = Pick<FiltroHogar, 'tipo' | 'etapas' | 'medida' | 'modelo_codigo'>;

/** Máximo de cartuchos que se muestran para un filtro. */
export const MAXIMO_CARTUCHOS_FILTRO = 6;
const POR_FUNCION = 2;

/** Categorías de equipo completo que se ofrecen como "modelo" del filtro. */
const CATEGORIAS_EQUIPO = ['filtro', 'sistema_osmosis_inversa', 'suavizador', 'filtro_desbarrador'];

export const PARA_QUE: Readonly<Record<FuncionCartucho, string>> = {
  sedimentos: 'Pensado para retener tierra, óxido y partículas.',
  carbon: 'Pensado para reducir el cloro y mejorar el sabor y el olor.',
  resina: 'Pensado para reducir la dureza (el sarro).',
  membrana: 'Pensada para la filtración más fina del equipo.',
  minerales: 'Pensado para aportar minerales al agua ya filtrada.',
};

/** Funciones de cartucho que usa cada tipo de filtro, en el orden en que se muestran. */
const FUNCIONES_POR_TIPO: Readonly<Record<TipoFiltro, FuncionCartucho[]>> = {
  portafiltro_simple: ['sedimentos', 'carbon'],
  portafiltro_doble: ['sedimentos', 'carbon'],
  portafiltro_triple: ['sedimentos', 'carbon', 'resina', 'minerales'],
  ultrafiltracion: ['sedimentos', 'carbon', 'resina', 'membrana'],
  osmosis_inversa: ['sedimentos', 'carbon', 'membrana', 'minerales'],
  // Equipos de tanque: trabajan con medios filtrantes o resina a granel, no con cartuchos.
  desbarrador_tanque: [],
  suavizador: [],
  filtro_de_grifo_o_ducha: ['carbon', 'minerales'],
  otro: ['sedimentos', 'carbon'],
};

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function numero(texto: string): string {
  return String(Number(texto.replace(',', '.')));
}

/**
 * Medida "largo x diámetro" que trae el nombre (p. ej. `20" x 2.5"` → `20x2.5`). Tolera comillas, », espacios,
 * coma decimal y x/×. Devuelve el texto normalizado aunque no sea una medida estándar (p. ej. `10x2`); null si no trae.
 */
export function medidaDelNombre(nombre: string): string | null {
  const coincidencia = nombre.match(
    /(\d{1,2}(?:[.,]\d+)?)\s*(?:["“”″'’»«]|pulg(?:adas)?\.?)?\s*[x×]\s*(\d{1,2}(?:[.,]\d+)?)(?!\d)/i,
  );
  if (!coincidencia) return null;
  return `${numero(coincidencia[1])}x${numero(coincidencia[2])}`;
}

/** Medida estándar de cartucho que trae el nombre, o null. */
export function medidaEstandar(nombre: string): MedidaCartucho | null {
  const medida = medidaDelNombre(nombre);
  return medida && (MEDIDAS_CARTUCHO as readonly string[]).includes(medida) ? (medida as MedidaCartucho) : null;
}

/** "5 Etapas" → 5. */
export function etapasDelNombre(nombre: string): number | null {
  const coincidencia = sinAcentos(nombre).match(/(\d{1,2})\s*etapas?\b/);
  return coincidencia ? Number(coincidencia[1]) : null;
}

function gpdDelNombre(nombre: string): number | null {
  const coincidencia = nombre.match(/(\d{2,4})\s*GPD/i);
  return coincidencia ? Number(coincidencia[1]) : null;
}

/** Equipo completo (no un cartucho de recambio): lo que se puede elegir como "modelo" del filtro. */
export function esEquipo(producto: Pick<Cartucho, 'nombre' | 'categoria'>): boolean {
  const nombre = sinAcentos(producto.nombre);
  if (producto.categoria === 'cartucho') return nombre.startsWith('filtro de agua');
  if (producto.categoria === 'filtro') return nombre.startsWith('filtro');
  return producto.categoria !== null && CATEGORIAS_EQUIPO.includes(producto.categoria);
}

export function equiposDelCatalogo(catalogo: ProductoCatalogo[]): ModeloFiltro[] {
  return catalogo
    .filter(esEquipo)
    .map((producto) => ({ codigo: producto.codigo, nombre: producto.nombre, categoria: producto.categoria }));
}

/** Tipo de filtro que corresponde a un equipo del catálogo. */
export function tipoDelModelo(producto: Pick<Cartucho, 'nombre' | 'categoria'>): TipoFiltro {
  const nombre = sinAcentos(producto.nombre);
  if (producto.categoria === 'sistema_osmosis_inversa' || /osmosis/.test(nombre)) return 'osmosis_inversa';
  if (producto.categoria === 'suavizador') return 'suavizador';
  if (producto.categoria === 'filtro_desbarrador') return 'desbarrador_tanque';
  if (/ultrafiltracion|\buf\b/.test(nombre)) return 'ultrafiltracion';
  const etapas = etapasDelNombre(producto.nombre);
  if (etapas === 1) return 'portafiltro_simple';
  if (etapas === 2) return 'portafiltro_doble';
  if (etapas === 3) return 'portafiltro_triple';
  return 'otro';
}

/** Función de un cartucho o membrana según su nombre, su categoría y lo que corrige. */
export function funcionDe(producto: Pick<Cartucho, 'nombre' | 'categoria' | 'corrige'>): FuncionCartucho | null {
  const nombre = sinAcentos(producto.nombre);
  if (producto.categoria?.startsWith('membrana') || /membrana/.test(nombre)) return 'membrana';
  if (/mineral|alcalin/.test(nombre)) return 'minerales';
  if (/resina|deioniz|suaviz/.test(nombre)) return 'resina';
  if (/\bgac\b|\bcto\b|carbon/.test(nombre)) return 'carbon';
  if (/ultrafiltracion|\buf\b/.test(nombre)) return 'membrana';
  if (/sediment|\bpp\b|micra|reusable|rellenable|polipropileno/.test(nombre)) return 'sedimentos';
  if (producto.corrige.includes('dureza')) return 'resina';
  if (producto.corrige.includes('cloro_libre') || producto.corrige.includes('sabor_olor')) return 'carbon';
  if (producto.corrige.includes('sedimentos')) return 'sedimentos';
  return null;
}

/** Recambio que se compra suelto: cartuchos y membranas (no equipos completos, repuestos ni lámparas). */
function esRecambio(producto: ProductoCatalogo): boolean {
  if (!producto.disponible) return false;
  if (producto.categoria === 'cartucho') return producto.recomendable && !esEquipo(producto);
  if (producto.categoria?.startsWith('membrana')) return !/^set\b/i.test(producto.nombre);
  return false;
}

/** La membrana que va con el tipo de equipo: ósmosis (domésticas, no industriales 4040/8040) o ultrafiltración. */
function membranaSirve(producto: ProductoCatalogo, tipo: TipoFiltro): boolean {
  const esOsmosis = producto.categoria === 'membrana_osmosis' || /osmosis/.test(sinAcentos(producto.nombre));
  if (tipo === 'osmosis_inversa') return esOsmosis && !/\b(4040|8040)/.test(producto.nombre);
  if (tipo === 'ultrafiltracion') return !esOsmosis;
  return false;
}

function publico(producto: ProductoCatalogo): Cartucho {
  const { recomendable: _interno, ...resto } = producto;
  return resto;
}

/** Largo de una medida "largo x diámetro" (`10x2.5` → `10`). */
function largoDe(medida: string): string {
  return medida.split('x')[0];
}

/**
 * Cartuchos del catálogo para ese filtro, agrupados por función (sedimentos, carbón, resina, membrana, minerales),
 * hasta dos por función y seis en total. La medida ordena, no excluye: primero la misma medida, después el mismo
 * largo (10" o 20") y después los demás de esa función, marcados con `confirmar_medida`.
 * Un cartucho "para ultrafiltración" u "ósmosis" en otro tipo de equipo solo entra si no hay otro de esa función.
 * Con un modelo exacto de N etapas se prefieren (y se exigen, si traen familia) los cartuchos de esa familia.
 * Con `corrige` (de la última medición) van primero los que atienden esos hallazgos.
 */
export function cartuchosParaFiltro(
  filtro: FiltroParaCartuchos,
  catalogo: ProductoCatalogo[],
  corrige: string[] = [],
): CartuchoDelFiltro[] {
  const funciones = FUNCIONES_POR_TIPO[filtro.tipo] ?? [];
  if (funciones.length === 0) return [];

  const modelo = filtro.modelo_codigo ? catalogo.find((p) => p.codigo === filtro.modelo_codigo) : undefined;
  const medida = filtro.medida ?? (modelo ? medidaEstandar(modelo.nombre) : null);
  const familia =
    (modelo ? etapasDelNombre(modelo.nombre) : null) ?? (filtro.tipo === 'ultrafiltracion' ? filtro.etapas : null);
  const gpd = modelo ? gpdDelNombre(modelo.nombre) : null;
  const pedidas = new Set(corrige);

  const candidatos = catalogo
    .filter(esRecambio)
    .map((producto) => ({ producto, funcion: funcionDe(producto) }))
    .filter((par): par is { producto: ProductoCatalogo; funcion: FuncionCartucho } =>
      par.funcion !== null && funciones.includes(par.funcion),
    )
    .filter((par) => par.funcion !== 'membrana' || membranaSirve(par.producto, filtro.tipo))
    .filter((par) => {
      const suya = etapasDelNombre(par.producto.nombre);
      return familia === null || suya === null || suya === familia;
    })
    .map((par) => {
      const nombre = sinAcentos(par.producto.nombre);
      const aciertos = par.producto.corrige.filter((clave) => pedidas.has(clave)).length;
      const suFamilia = etapasDelNombre(par.producto.nombre);
      const suMedida = medidaDelNombre(par.producto.nombre);
      // Un cartucho "para ultrafiltración" o "para ósmosis" es de otro tipo de equipo (misma regla que la frase del porqué).
      const otroEquipo =
        (/ultrafiltracion/.test(nombre) && filtro.tipo !== 'ultrafiltracion') ||
        (/osmosis/.test(nombre) && filtro.tipo !== 'osmosis_inversa');
      // Menor es mejor: misma medida, mismo largo, los demás.
      const porMedida = !medida ? 0 : suMedida === medida ? 0 : suMedida && largoDe(suMedida) === largoDe(medida) ? 1 : 2;
      return {
        ...par,
        aciertos,
        otroEquipo,
        porMedida,
        confirmar: otroEquipo || porMedida > 0,
        porFamilia: familia !== null && suFamilia === familia ? 0 : suFamilia === null ? 1 : 2,
        porGpd: gpd !== null && gpdDelNombre(par.producto.nombre) === gpd ? 0 : 1,
      };
    })
    .sort(
      (a, b) =>
        a.porMedida - b.porMedida ||
        Number(b.aciertos > 0) - Number(a.aciertos > 0) ||
        a.porFamilia - b.porFamilia ||
        a.porGpd - b.porGpd ||
        b.aciertos - a.aciertos ||
        // A igualdad de criterio, primero los que tienen foto.
        Number(!a.producto.foto_url) - Number(!b.producto.foto_url) ||
        (a.producto.codigo < b.producto.codigo ? -1 : a.producto.codigo > b.producto.codigo ? 1 : 0),
    );

  // Primera vuelta: el mejor de cada función; segunda: el segundo de cada una.
  const elegidos: typeof candidatos = [];
  for (let vuelta = 0; vuelta < POR_FUNCION; vuelta += 1) {
    for (const funcion of funciones) {
      const todos = candidatos.filter((par) => par.funcion === funcion);
      const propios = todos.filter((par) => !par.otroEquipo);
      // Los de otro tipo de equipo, solo si no hay otro de esta función: nunca se deja una función vacía.
      const deEsta = propios.length > 0 ? propios : todos;
      if (deEsta[vuelta]) elegidos.push(deEsta[vuelta]);
    }
  }
  const ordenados = elegidos
    .map((par, indice) => ({ par, indice }))
    .sort((a, b) => Number(b.par.aciertos > 0) - Number(a.par.aciertos > 0) || a.indice - b.indice)
    .slice(0, MAXIMO_CARTUCHOS_FILTRO);

  return ordenados.map(({ par }) => ({
    ...publico(par.producto),
    funcion: par.funcion,
    para_que: PARA_QUE[par.funcion],
    atiende_medicion: par.aciertos > 0,
    confirmar_medida: par.confirmar,
  }));
}
