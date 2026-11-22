// Modelos del catálogo para la carga manual del filtro: a qué tipo pertenece cada uno,
// un nombre corto legible, una línea de detalle y un orden de menor a mayor.
import type { ModeloFiltro, TipoFiltro } from '../../lib/tipos';

/** La API hoy trae codigo, nombre y categoria; si algún día trae marca o foto, se muestran. */
export type ModeloCatalogo = ModeloFiltro & { marca?: string | null; foto_url?: string | null };

export interface ModeloLegible {
  codigo: string;
  /** "Ósmosis inversa 8 etapas". */
  nombreCorto: string;
  /** "200 GPD · OPW-200GPD-8TN". */
  detalle: string;
  foto: string | null;
  /** Para ordenar de menor a mayor capacidad o medida. */
  orden: number;
}

const MEDIDA = /(\d+(?:[.,]\d+)?)\s*["”]\s*x\s*(\d+(?:[.,]\d+)?)\s*["”]/i;
const GPD = /(\d+(?:[.,]\d+)?)\s*GPD\b/i;
const LITROS_HORA = /(\d+(?:[.,]\d+)?)\s*L\/h\b/i;
const LITROS = /(?:de\s+)?(\d+(?:[.,]\d+)?)\s*Litros\b/i;
const ETAPAS = /(\d+)\s*(?:Etapas|Cartuchos)\b/i;

function numero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

/** Capacidad en GPD o L/h, si el nombre la trae. */
function capacidad(nombre: string): { gpd: number | null; lh: number | null } {
  const g = nombre.match(GPD);
  const l = nombre.match(LITROS_HORA);
  return { gpd: g ? numero(g[1]) : null, lh: l ? numero(l[1]) : null };
}

/** Equipos de capacidad comercial (1200 GPD, 2000 L/h): no son de casa y no se ofrecen aquí. */
export function esComercial(m: ModeloFiltro): boolean {
  const { gpd, lh } = capacidad(m.nombre);
  return (gpd !== null && gpd >= 1000) || (lh !== null && lh >= 1000);
}

/** Tipo de filtro (de la carga manual) al que corresponde un modelo del catálogo, o null si no encaja. */
export function tipoDeModelo(m: ModeloFiltro): TipoFiltro | null {
  const nombre = m.nombre;
  const categoria = m.categoria ?? '';
  if (categoria === 'sistema_osmosis_inversa' || /[óo]smosis/i.test(nombre) || GPD.test(nombre)) return 'osmosis_inversa';
  if (/ultrafiltraci[óo]n|\bUF\b/i.test(nombre)) return 'ultrafiltracion';
  if (categoria === 'filtro_desbarrador' || categoria === 'suavizador' || /tanque|desbarrador|salmuera/i.test(nombre)) {
    return 'desbarrador_tanque';
  }
  const etapas = nombre.match(ETAPAS);
  if (etapas) {
    const n = Number(etapas[1]);
    if (n === 1) return 'portafiltro_simple';
    if (n === 2) return 'portafiltro_doble';
    if (n === 3) return 'portafiltro_triple';
  }
  return null;
}

/** Siglas (FRP, UF, UV) se quedan en mayúsculas; lo demás, en minúscula salvo la primera palabra. */
function frase(texto: string): string {
  const palabras = texto.split(' ').filter(Boolean);
  return palabras
    .map((p, i) => {
      if (/^\(?[A-ZÁÉÍÓÚÑ]{2,}\)?[,.]?$/.test(p) || /\d/.test(p)) return p;
      if (i === 0) return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      return p.toLowerCase();
    })
    .join(' ');
}

/** Nombre del catálogo → nombre corto (sin "Filtro de Agua por", "Filtro tipo", medidas ni capacidad). */
export function nombreCorto(nombre: string): string {
  let texto = nombre
    .replace(/^filtro\s+de\s+agua\s+por\s+/i, '')
    .replace(/^filtro\s+de\s+agua\s+/i, '')
    .replace(/^filtro\s+tipo\s+/i, '')
    .replace(/^filtro\s+(?=desbarrador)/i, '')
    .replace(new RegExp(MEDIDA.source, 'gi'), '')
    .replace(new RegExp(GPD.source, 'gi'), '')
    .replace(new RegExp(LITROS_HORA.source, 'gi'), '')
    .replace(new RegExp(LITROS.source, 'gi'), '')
    .replace(/\bde\s+(?=\d+\s*(?:etapas|cartuchos)\b)/gi, '')
    .replace(/\(\s*(sin [^)]*)\)/gi, '$1')
    .replace(/\s*[-–,]\s*$/g, '')
    .replace(/\s+[-–]\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  texto = texto
    .replace(/^de\s+/i, '')
    .replace(/[\s,–-]+$/, '')
    .replace(/\s+acuarios\b/i, ' para acuarios');
  if (/^\d/.test(texto)) texto = `Filtro de ${texto}`;
  return frase(texto);
}

/** "200 GPD · Oasis · OPW-200GPD-8TN" (capacidad o medida, marca si viene, código). */
export function detalleModelo(m: ModeloCatalogo): string {
  const partes: string[] = [];
  const g = m.nombre.match(GPD);
  const l = m.nombre.match(LITROS_HORA);
  const litros = m.nombre.match(LITROS);
  const medida = m.nombre.match(MEDIDA);
  if (g) partes.push(`${g[1]} GPD`);
  if (l) partes.push(`${l[1]} L/h`);
  if (litros) partes.push(`${litros[1]} litros`);
  if (medida) partes.push(`${medida[1]}" x ${medida[2]}"`);
  if (m.marca) partes.push(m.marca);
  partes.push(m.codigo);
  return partes.join(' · ');
}

function claveOrden(nombre: string): number {
  const { gpd, lh } = capacidad(nombre);
  if (gpd !== null) return gpd;
  if (lh !== null) return lh;
  const litros = nombre.match(LITROS);
  if (litros) return numero(litros[1]);
  const medida = nombre.match(MEDIDA);
  if (medida) return numero(medida[1]) * 1000 + numero(medida[2]);
  const etapas = nombre.match(ETAPAS);
  if (etapas) return Number(etapas[1]);
  return Number.MAX_SAFE_INTEGER;
}

/** Modelos del tipo elegido, de casa, legibles y de menor a mayor. "No sé" (otro) no tiene modelos. */
export function modelosDelTipo(modelos: readonly ModeloCatalogo[], tipo: string): ModeloLegible[] {
  if (!tipo || tipo === 'otro') return [];
  return modelos
    .filter((m) => !esComercial(m) && tipoDeModelo(m) === tipo)
    .map((m) => ({
      codigo: m.codigo,
      nombreCorto: nombreCorto(m.nombre),
      detalle: detalleModelo(m),
      foto: m.foto_url ?? null,
      orden: claveOrden(m.nombre),
    }))
    .sort((a, b) => a.orden - b.orden || a.nombreCorto.localeCompare(b.nombreCorto, 'es'));
}
