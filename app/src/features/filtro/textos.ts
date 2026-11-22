// Textos y utilidades del filtro del hogar.
import type { FiltroHogar, MedidaCartucho, TipoFiltro } from '../../lib/tipos';

/** Texto fijo de prudencia junto a la identificación. */
export const PRUDENCIA =
  'Identificación orientativa a partir de la foto. Confirma el modelo y la medida en la tienda antes de comprar.';

export const AYUDA_FOTO = 'Que se vea el filtro completo y, si tiene, la etiqueta.';

/** Opciones de la carga manual: una frase que ayude a reconocer el equipo. */
export const OPCIONES_TIPO: ReadonlyArray<{ valor: TipoFiltro; etiqueta: string; ayuda?: string }> = [
  { valor: 'portafiltro_simple', etiqueta: 'Un vaso', ayuda: 'Portafiltro simple.' },
  { valor: 'portafiltro_doble', etiqueta: 'Dos vasos', ayuda: 'Portafiltro doble.' },
  { valor: 'portafiltro_triple', etiqueta: 'Tres vasos', ayuda: 'Portafiltro triple.' },
  { valor: 'osmosis_inversa', etiqueta: 'Ósmosis inversa (con tanque)', ayuda: 'Varios cartuchos y un tanque redondo.' },
  { valor: 'ultrafiltracion', etiqueta: 'Ultrafiltración (sin tanque, varios cartuchos)' },
  { valor: 'desbarrador_tanque', etiqueta: 'Tanque grande para toda la casa', ayuda: 'Alto, con una válvula arriba.' },
  { valor: 'otro', etiqueta: 'No sé' },
];

export const OPCIONES_MEDIDA: ReadonlyArray<{ valor: MedidaCartucho | ''; etiqueta: string; ayuda?: string }> = [
  { valor: '10x2.5', etiqueta: 'Corto y delgado', ayuda: '10" x 2.5"' },
  { valor: '10x4.5', etiqueta: 'Corto y grueso', ayuda: '10" x 4.5"' },
  { valor: '20x2.5', etiqueta: 'Largo y delgado', ayuda: '20" x 2.5"' },
  { valor: '20x4.5', etiqueta: 'Largo y grueso', ayuda: '20" x 4.5"' },
  { valor: '', etiqueta: 'No sé' },
];

/** "10x2.5" → `Corto y delgado (10" x 2.5")`. */
export function textoMedida(medida: MedidaCartucho | null): string | null {
  if (!medida) return null;
  const opcion = OPCIONES_MEDIDA.find((o) => o.valor === medida);
  const [largo, ancho] = medida.split('x');
  return `${opcion?.etiqueta ?? ''} (${largo}" x ${ancho}")`.trim();
}

/** "Portafiltro triple, 10" x 2.5"" (para la línea del resultado). */
export function resumenFiltro(filtro: FiltroHogar): string {
  if (!filtro.medida) return filtro.tipo_nombre;
  const [largo, ancho] = filtro.medida.split('x');
  return `${filtro.tipo_nombre}, ${largo}" x ${ancho}"`;
}

/** Solo rutas internas de la app; cualquier otra cosa vuelve al inicio. */
export function destinoSeguro(sigue: string | null): string {
  if (!sigue || !sigue.startsWith('/') || sigue.startsWith('//') || sigue.includes('\\')) return '/';
  return sigue;
}
