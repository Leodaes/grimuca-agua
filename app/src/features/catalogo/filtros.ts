// Grupos y filtros del catálogo de la tienda. Lógica pura, sin React.
import type { Cartucho } from '../../lib/tipos';

export type GrupoTipo =
  | 'todos'
  | 'cartuchos'
  | 'filtros'
  | 'osmosis'
  | 'ultrafiltracion'
  | 'desbarradores'
  | 'suavizadores'
  | 'lamparas'
  | 'membranas'
  | 'otros';

export type GrupoPara = 'todos' | 'sedimentos' | 'cloro' | 'dureza' | 'nitrato' | 'plomo';

export const GRUPOS_TIPO: ReadonlyArray<{ valor: GrupoTipo; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'cartuchos', etiqueta: 'Cartuchos' },
  { valor: 'filtros', etiqueta: 'Filtros' },
  { valor: 'osmosis', etiqueta: 'Ósmosis inversa' },
  { valor: 'ultrafiltracion', etiqueta: 'Ultrafiltración' },
  { valor: 'desbarradores', etiqueta: 'Desbarradores' },
  { valor: 'suavizadores', etiqueta: 'Suavizadores' },
  { valor: 'lamparas', etiqueta: 'Lámparas UV' },
  { valor: 'membranas', etiqueta: 'Membranas' },
  { valor: 'otros', etiqueta: 'Repuestos y otros' },
];

export const GRUPOS_PARA: ReadonlyArray<{ valor: GrupoPara; etiqueta: string; claves: string[] }> = [
  { valor: 'todos', etiqueta: 'Todos', claves: [] },
  { valor: 'sedimentos', etiqueta: 'Sedimentos', claves: ['sedimentos', 'hierro'] },
  { valor: 'cloro', etiqueta: 'Cloro y sabor', claves: ['cloro_libre', 'sabor_olor'] },
  { valor: 'dureza', etiqueta: 'Dureza', claves: ['dureza', 'alcalinidad'] },
  { valor: 'nitrato', etiqueta: 'Nitrato y nitrito', claves: ['nitrato', 'nitrito'] },
  { valor: 'plomo', etiqueta: 'Plomo y cobre', claves: ['plomo', 'cobre'] },
];

/** Línea fija de las lámparas UV (texto aprobado por la revisión legal). */
export const LINEA_LAMPARA_UV =
  'Opción para consultar en tienda. No significa que el agua quede apta para tomar.';

/** Lleva la categoría real del catálogo a uno de los grupos visibles. Lo que no encaja va a "otros". */
export function grupoDeCategoria(categoria: string | null): Exclude<GrupoTipo, 'todos'> {
  const c = (categoria ?? '').toLowerCase();
  if (c === 'cartucho') return 'cartuchos';
  if (c === 'lampara_uv') return 'lamparas';
  if (c.includes('desbarrador')) return 'desbarradores';
  if (c.includes('suavizador')) return 'suavizadores';
  if (c.includes('ultrafiltracion')) return 'ultrafiltracion';
  if (c.includes('membrana')) return 'membranas';
  if (c.startsWith('sistema_osmosis')) return 'osmosis';
  if (c === 'filtro' || c === 'portafiltro') return 'filtros';
  return 'otros';
}

/** Lee `?tipo=`: acepta el grupo ("cartuchos") o la categoría real ("filtro_desbarrador"). */
export function leerTipo(valor: string | null): GrupoTipo {
  if (!valor) return 'todos';
  const directo = GRUPOS_TIPO.find((g) => g.valor === valor);
  if (directo) return directo.valor;
  return grupoDeCategoria(valor);
}

/** Lee `?para=`: acepta el grupo ("cloro") o una clave de `corrige` ("cloro_libre"). */
export function leerPara(valor: string | null): GrupoPara {
  if (!valor) return 'todos';
  const grupo = GRUPOS_PARA.find((g) => g.valor === valor || g.claves.includes(valor));
  return grupo?.valor ?? 'todos';
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrarCatalogo(
  productos: Cartucho[],
  { tipo, para, busqueda }: { tipo: GrupoTipo; para: GrupoPara; busqueda: string },
): Cartucho[] {
  const texto = normalizar(busqueda);
  const claves = GRUPOS_PARA.find((g) => g.valor === para)?.claves ?? [];
  const orden = GRUPOS_TIPO.map((g) => g.valor as string);
  // Primero lo de uso en casa (cartuchos y filtros), en el mismo orden de los grupos; dentro de cada grupo, por nombre.
  const peso = (p: Cartucho) => {
    const i = orden.indexOf(grupoDeCategoria(p.categoria));
    return i < 0 ? orden.length : i;
  };
  return productos
    .filter((p) => {
    if (tipo !== 'todos' && grupoDeCategoria(p.categoria) !== tipo) return false;
    if (claves.length > 0 && !p.corrige.some((c) => claves.includes(c))) return false;
    if (texto && !normalizar(p.nombre).includes(texto) && !normalizar(p.codigo).includes(texto)) return false;
    return true;
    })
    .sort((a, b) => peso(a) - peso(b) || a.nombre.localeCompare(b.nombre, 'es'));
}
