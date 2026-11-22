// "Por qué te lo recomendamos": frase personalizada de cada producto sugerido en una medición.
// Función pura y determinista (sin llamadas externas). Se arma con la evaluación, el perfil del hogar y el producto.
// Límites legales (docs/legal/puede-y-no-puede-decir.md): siempre "pensado para"; nunca "elimina", "quita",
// "corrige", "purifica", ni que el agua queda "apta", "segura" o "potable". Plomo y cobre llevan la nota de laboratorio.
import { esEquipo, etapasDelNombre, funcionDe, medidaDelNombre } from '../filtro';
import type {
  Cartucho,
  CartuchoSugerido,
  ClaveParametro,
  FiltroHogar,
  Hogar,
  MotivoAtendido,
  Nivel,
  ResultadoParametro,
} from '../tipos';

/** Lo que se necesita del hogar (todo opcional salvo lo básico, para tolerar datos viejos). */
export type HogarParaMotivo = Pick<Hogar, 'personas' | 'origen_agua' | 'agua_turbia' | 'tiene_filtro'> &
  Partial<Pick<Hogar, 'mascotas' | 'ultimo_cambio'>> & { filtro?: FiltroHogar | null };

export interface ContextoMotivo {
  /** Parámetros de la medición con su nivel. */
  porParametro: ResultadoParametro[];
  /** Claves que pide la evaluación (`evaluacion.corrige`). */
  corrige: string[];
  diasParaRecambio: number | null;
  hogar: HogarParaMotivo | null;
  /** Códigos compatibles con el filtro registrado del hogar. */
  compatibles?: ReadonlySet<string>;
}

/** Máximo de parámetros que se nombran en una frase. */
export const MAXIMO_PARAMETROS_FRASE = 3;

/** Palabras que nunca pueden salir en una frase (se prueban con todo el catálogo). */
export const PALABRAS_PROHIBIDAS = ['elimina', 'quita', 'corrige', 'purifica', 'apta', 'segura', 'seguro', 'potable'];

export const NOTA_LABORATORIO = 'La tira solo orienta: confirma con un laboratorio.';

const COLOR: Record<Nivel, string> = { rojo: 'Rojo', amarillo: 'Amarillo', verde: 'Verde', sin_dato: 'Sin lectura' };
const PESO_NIVEL: Record<Nivel, number> = { rojo: 0, amarillo: 1, verde: 2, sin_dato: 3 };
/** Dentro del mismo color, primero lo que más importa para la salud. */
const PRIORIDAD: ClaveParametro[] = ['plomo', 'cobre', 'nitrito', 'nitrato', 'cloro_libre', 'hierro', 'dureza', 'alcalinidad', 'ph'];

/** Parámetros de salud: a igual color van antes que los operativos (dureza, hierro, alcalinidad, pH). */
export const CLAVES_SALUD: readonly ClaveParametro[] = ['nitrato', 'nitrito', 'plomo', 'cobre', 'cloro_libre'];

/**
 * Gravedad de cada parámetro de la medición (mayor = más grave): rojo de salud 4, rojo operativo 3,
 * amarillo de salud 2, amarillo operativo 1; verde o sin lectura 0. Ordena los sugeridos y la frase de cada uno.
 */
export function gravedadPorClave(porParametro: ResultadoParametro[]): Record<string, number> {
  const gravedad: Record<string, number> = {};
  for (const p of porParametro) {
    const salud = CLAVES_SALUD.includes(p.clave) ? 1 : 0;
    const valor = p.nivel === 'rojo' ? 3 + salud : p.nivel === 'amarillo' ? 1 + salud : 0;
    gravedad[p.clave] = Math.max(gravedad[p.clave] ?? 0, valor);
  }
  return gravedad;
}

/** Explicación corta cuando la frase nombra un solo parámetro. */
const EXPLICACION: Partial<Record<ClaveParametro, string>> = {
  dureza: 'es el sarro que mancha la grifería',
  cloro_libre: 'es lo que cambia el sabor y el olor del agua',
  hierro: 'es lo que deja el agua amarilla y mancha la ropa',
  nitrato: 'es una casilla para vigilar',
  nitrito: 'es una casilla para vigilar',
  alcalinidad: 'tiene que ver con el sarro y la corrosión',
  ph: 'dice si el agua está ácida o alcalina',
};

const PARA_QUE_SIN_CASILLAS: Record<string, string> = {
  sedimentos: 'retener la tierra y el sedimento',
  sabor_olor: 'mejorar el sabor y el olor',
  bacterias: 'reducir bacterias según el fabricante',
};

interface Sustantivo {
  texto: string;
  femenino: boolean;
}

/** "esta ósmosis inversa", "este cartucho de carbón"… */
export function sustantivoDe(producto: Cartucho): Sustantivo {
  const categoria = producto.categoria ?? '';
  const nombre = producto.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (categoria === 'sistema_osmosis_inversa') return { texto: 'esta ósmosis inversa', femenino: true };
  if (categoria === 'suavizador') return { texto: 'este suavizador', femenino: false };
  if (categoria === 'filtro_desbarrador') return { texto: 'este desbarrador', femenino: false };
  if (categoria === 'lampara_uv') return { texto: 'esta lámpara UV', femenino: true };
  if (categoria.startsWith('membrana')) return { texto: 'esta membrana', femenino: true };
  if (categoria === 'portafiltro') return { texto: 'este portafiltro', femenino: false };
  if (esEquipo(producto)) {
    if (/osmosis/.test(nombre)) return { texto: 'esta ósmosis inversa', femenino: true };
    return { texto: 'este filtro', femenino: false };
  }
  if (categoria === 'cartucho') {
    if (/^cartucho de ultrafiltracion/.test(nombre)) return { texto: 'este cartucho de ultrafiltración', femenino: false };
    const paraUf = /para ultrafiltracion/.test(nombre) ? ' para ultrafiltración' : '';
    const funcion = funcionDe(producto);
    const deQue: Partial<Record<string, string>> = {
      sedimentos: ' de sedimentos',
      carbon: ' de carbón',
      resina: ' de resina',
      minerales: ' de minerales',
    };
    return { texto: `este cartucho${(funcion && deQue[funcion]) || ''}${paraUf}`, femenino: false };
  }
  return { texto: 'este producto', femenino: false };
}

/** Recambio que va dentro de un filtro que ya existe (cartucho o membrana, no un equipo completo). */
function esRecambio(producto: Cartucho): boolean {
  const categoria = producto.categoria ?? '';
  if (categoria.startsWith('membrana')) return true;
  return categoria === 'cartucho' && !esEquipo(producto);
}

/** Equipo completo que se instala (filtro, ósmosis, suavizador, desbarrador). */
function esEquipoCompleto(producto: Cartucho): boolean {
  const categoria = producto.categoria ?? '';
  return (
    esEquipo(producto) ||
    ['sistema_osmosis_inversa', 'suavizador', 'filtro_desbarrador'].includes(categoria)
  );
}

function unir(partes: string[]): string {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

function frasePensado(sustantivo: Sustantivo): string {
  return sustantivo.femenino ? 'Está pensada para' : 'Está pensado para';
}

const NUMERO_VASOS: Partial<Record<FiltroHogar['tipo'], number>> = {
  portafiltro_simple: 1,
  portafiltro_doble: 2,
  portafiltro_triple: 3,
};

const VASOS: Partial<Record<FiltroHogar['tipo'], string>> = {
  portafiltro_simple: 'un vaso',
  portafiltro_doble: '2 vasos',
  portafiltro_triple: '3 vasos',
};

/** "Es de la medida de tu filtro (10 x 2.5)." / "Es para tu filtro de 3 vasos." */
function fraseCompatible(producto: Cartucho, filtro: FiltroHogar): string | null {
  const nombre = producto.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const etapasProducto = etapasDelNombre(producto.nombre);
  const etapasFiltro = filtro.etapas ?? NUMERO_VASOS[filtro.tipo] ?? null;
  // No se afirma que va con el filtro si el nombre dice otra familia (otras etapas u otro tipo de equipo).
  if (etapasProducto !== null && etapasFiltro !== null && etapasProducto !== etapasFiltro) return null;
  if (/ultrafiltracion/.test(nombre) && filtro.tipo !== 'ultrafiltracion') return null;
  if (/osmosis/.test(nombre) && filtro.tipo !== 'osmosis_inversa') return null;
  const medida = medidaDelNombre(producto.nombre);
  if (filtro.medida && medida && medida !== filtro.medida) return null;
  if (filtro.medida && medida === filtro.medida) {
    return `Es de la medida de tu filtro (${filtro.medida.replace('x', ' x ')}).`;
  }
  const vasos = VASOS[filtro.tipo];
  if (vasos) return `Es para tu filtro de ${vasos}.`;
  if (filtro.etapas) return `Es para tu filtro de ${filtro.etapas} etapas.`;
  if (filtro.tipo === 'osmosis_inversa') return 'Es para tu equipo de ósmosis inversa.';
  if (filtro.tipo === 'ultrafiltracion') return 'Es para tu equipo de ultrafiltración.';
  return 'Va con el filtro que registraste.';
}

type Recambio = 'mas_de_tres_meses' | 'no_me_acuerdo' | 'vencido' | null;

function recambioDe(producto: Cartucho, contexto: ContextoMotivo): Recambio {
  const hogar = contexto.hogar;
  if (!hogar?.tiene_filtro || !esRecambio(producto)) return null;
  if (hogar.ultimo_cambio === 'mas_de_tres_meses') return 'mas_de_tres_meses';
  if (hogar.ultimo_cambio === 'no_me_acuerdo') return 'no_me_acuerdo';
  if (typeof contexto.diasParaRecambio === 'number' && contexto.diasParaRecambio <= 0) return 'vencido';
  return null;
}

const RAZON_RECAMBIO: Record<Exclude<Recambio, null>, { razon: string; oracion: string }> = {
  mas_de_tres_meses: {
    razon: 'ya te toca el cambio: el último fue hace más de tres meses',
    oracion: 'Ya te toca el cambio: el último fue hace más de tres meses.',
  },
  no_me_acuerdo: {
    razon: 'no recuerdas cuándo fue el último cambio y conviene revisarlo',
    oracion: 'Como no recuerdas el último cambio, conviene revisarlo.',
  },
  vencido: {
    razon: 'ya te toca cambiar el cartucho',
    oracion: 'Ya te toca cambiar el cartucho.',
  },
};

function razonTurbia(hogar: HogarParaMotivo): string {
  const origen = hogar.origen_agua === 'tanque' ? ' y viene de tanque' : hogar.origen_agua === 'pozo' ? ' y viene de pozo' : '';
  return `nos dijiste que el agua sale turbia${origen}`;
}

function oracionHogarSinFiltro(hogar: HogarParaMotivo): string {
  const mascotas = hogar.mascotas ? ', con mascotas,' : '';
  if (hogar.personas <= 1) return `Eres una sola persona en casa${mascotas} y todavía no tienes filtro.`;
  return `Son ${hogar.personas} en casa${mascotas} y todavía no tienen filtro.`;
}

/** Formas de decir qué dio la medición; se usa la siguiente solo si la frase saldría repetida. */
const VARIANTES_MEDICION = [
  (lista: string) => `tu medición dio ${lista}`,
  (lista: string) => `en tu medición salió ${lista}`,
  (lista: string) => `la tira marcó ${lista}`,
];

/** Parámetros de esta medición en amarillo o rojo que el producto atiende (más grave primero, máximo 3). */
export function parametrosAtendidos(producto: Cartucho, contexto: ContextoMotivo): ResultadoParametro[] {
  const pedidas = new Set(contexto.corrige);
  const gravedad = gravedadPorClave(contexto.porParametro);
  return contexto.porParametro
    .filter((p) => (p.nivel === 'rojo' || p.nivel === 'amarillo') && pedidas.has(p.clave) && producto.corrige.includes(p.clave))
    .sort(
      (a, b) =>
        (gravedad[b.clave] ?? 0) - (gravedad[a.clave] ?? 0) ||
        PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel] ||
        PRIORIDAD.indexOf(a.clave) - PRIORIDAD.indexOf(b.clave),
    )
    .slice(0, MAXIMO_PARAMETROS_FRASE);
}

/** Frase y lista de lo que atiende un producto. `variante` cambia la forma de la primera oración. */
export function motivoDe(
  producto: Cartucho,
  contexto: ContextoMotivo,
  variante = 0,
): { motivo: string; atiende: MotivoAtendido[] } {
  const hogar = contexto.hogar;
  const sustantivo = sustantivoDe(producto);
  const parametros = parametrosAtendidos(producto, contexto);
  const atiende: MotivoAtendido[] = parametros.map((p) => ({ clave: p.clave, nombre: p.nombre, nivel: p.nivel }));

  const turbia = Boolean(hogar?.agua_turbia && producto.corrige.includes('sedimentos') && contexto.corrige.includes('sedimentos'));
  const recambio = recambioDe(producto, contexto);
  const fraseFiltro =
    hogar?.tiene_filtro && hogar.filtro && contexto.compatibles?.has(producto.codigo) && esRecambio(producto)
      ? fraseCompatible(producto, hogar.filtro)
      : null;
  const compatible = fraseFiltro !== null;
  const sinFiltro = Boolean(hogar && !hogar.tiene_filtro && esEquipoCompleto(producto));

  if (turbia) atiende.push({ clave: 'sedimentos', nombre: 'Agua turbia', nivel: null });
  if (recambio) atiende.push({ clave: 'recambio', nombre: 'Toca el cambio', nivel: null });
  if (sinFiltro) atiende.push({ clave: 'sin_filtro', nombre: 'Sin filtro en casa', nivel: null });
  if (compatible) atiende.push({ clave: 'filtro', nombre: 'Tu filtro', nivel: null });

  const oraciones: string[] = [];
  const hogarAlFinal: string[] = [];

  if (parametros.length > 0) {
    const lista = unir(parametros.map((p) => `${p.nombre} en ${COLOR[p.nivel]}`));
    const decir = VARIANTES_MEDICION[variante % VARIANTES_MEDICION.length];
    const explicacion = parametros.length === 1 ? EXPLICACION[parametros[0].clave] : undefined;
    oraciones.push(`Te recomendamos ${sustantivo.texto} porque ${decir(lista)}${explicacion ? `: ${explicacion}` : ''}.`);
    oraciones.push(`${frasePensado(sustantivo)} ${parametros.length === 1 ? 'esa casilla' : 'esas casillas'}.`);
    if (turbia && hogar) hogarAlFinal.push('También nos dijiste que el agua sale turbia.');
    if (recambio) hogarAlFinal.push(RAZON_RECAMBIO[recambio].oracion);
  } else {
    const razones: string[] = [];
    if (turbia && hogar) razones.push(razonTurbia(hogar));
    if (recambio) razones.push(RAZON_RECAMBIO[recambio].razon);
    const paraQue = unir(
      producto.corrige
        .filter((clave) => contexto.corrige.includes(clave) && PARA_QUE_SIN_CASILLAS[clave])
        .map((clave) => PARA_QUE_SIN_CASILLAS[clave]),
    );
    if (razones.length > 0) {
      oraciones.push(`Te recomendamos ${sustantivo.texto} porque ${unir(razones)}.`);
      oraciones.push(`${frasePensado(sustantivo)} ${paraQue || 'lo que pide tu medición'}.`);
    } else {
      oraciones.push(
        `Te recomendamos ${sustantivo.texto} porque está ${sustantivo.femenino ? 'pensada' : 'pensado'} para ${paraQue || 'lo que pide tu medición'}.`,
      );
    }
  }

  if (sinFiltro && hogar) hogarAlFinal.push(oracionHogarSinFiltro(hogar));
  if (fraseFiltro) hogarAlFinal.push(fraseFiltro);

  // Lo del hogar que más pesa va al final; máximo dos oraciones de hogar.
  oraciones.push(...hogarAlFinal.slice(-2));
  if (parametros.some((p) => ['plomo', 'cobre', 'nitrato', 'nitrito'].includes(p.clave))) oraciones.push(NOTA_LABORATORIO);

  return { motivo: oraciones.join(' '), atiende };
}

/** "Es la de 8 etapas y 110 GPD." / "Es la de 20\" x 2.5\"." a partir del nombre; null si el nombre no trae nada útil. */
export function detalleDelNombre(producto: Cartucho): string | null {
  const partes: string[] = [];
  const etapas = etapasDelNombre(producto.nombre);
  if (etapas) partes.push(`${etapas} etapas`);
  const gpd = producto.nombre.match(/(d{2,4})s*GPD/i);
  if (gpd) partes.push(`${gpd[1]} GPD`);
  const medida = medidaDelNombre(producto.nombre);
  if (medida) partes.push(medida.replace('x', ' x '));
  if (partes.length === 0) return null;
  const { femenino } = sustantivoDe(producto);
  return `Esta opción es ${femenino ? 'la' : 'el'} de ${unir(partes)}.`;
}

/** Agrega `motivo` y `atiende` a cada sugerido, sin repetir la misma frase en dos productos. */
export function conMotivos(sugeridos: Cartucho[], contexto: ContextoMotivo): CartuchoSugerido[] {
  const usadas = new Set<string>();
  return sugeridos.map((producto) => {
    let resultado = motivoDe(producto, contexto, 0);
    const detalle = detalleDelNombre(producto);
    for (let variante = 0; usadas.has(resultado.motivo) && variante < VARIANTES_MEDICION.length; variante += 1) {
      const base = motivoDe(producto, contexto, variante);
      resultado = base;
      if (usadas.has(base.motivo) && detalle) resultado = { ...base, motivo: `${base.motivo} ${detalle}` };
    }
    if (usadas.has(resultado.motivo)) {
      resultado = { ...resultado, motivo: `${resultado.motivo} Es otra opción (código ${producto.codigo}).` };
    }
    usadas.add(resultado.motivo);
    return { ...producto, ...resultado };
  });
}
