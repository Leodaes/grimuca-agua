// Cortes del semáforo, frases y qué corrige cada hallazgo.
// Fuente: docs/negocio/agua.md (secciones 1, 2, 3 y 6), con las frases de la revisión 2 del Asesor legal.
// Las frases se pegan literal: si cambian en agua.md, se cambian aquí.
//
// Los cortes son reglas POR VALOR, así que sirven para cualquier tira.
// Reglas de lectura:
//   1. Lectura entre dos casillas → se toma la más alta (prudencia).
//   2. Casilla ausente o no leída → `sin_dato`, nunca verde.
//   3. Plomo y cobre son orientativos: "posible presencia, confirma con un laboratorio".

import type { ClaveParametro, Nivel } from '../../tipos';

export interface Tramo {
  /** Límite superior del tramo. El último tramo no lleva límite. */
  hasta?: number;
  /** true: el límite entra en este tramo (valor ≤ hasta). false u omitido: valor < hasta. */
  incluye?: boolean;
  nivel: Exclude<Nivel, 'sin_dato'>;
  frase: string;
  /** Claves que un cartucho o equipo debería corregir cuando la lectura cae en este tramo. */
  corrige: string[];
}

export interface Umbral {
  /** salud = hay valor guía sanitario. operativo = sabor, tuberías y equipos. */
  tipo: 'salud' | 'operativo';
  /** Tramos de menor a mayor. La lectura cae en el primero cuyo límite la cubre. */
  tramos: Tramo[];
}

export const FRASE_VERDE = 'Esta medida salió dentro de lo esperado.';
export const FRASE_SIN_DATO = 'No hay dato de esta casilla: la tira no la trae o no se pudo leer.';

const verde = (hasta: number, incluye = false, frase = FRASE_VERDE): Tramo => ({
  hasta,
  incluye,
  nivel: 'verde',
  frase,
  corrige: [],
});

export const umbrales: Record<ClaveParametro, Umbral> = {
  // <40 amarillo; 40 a 180 verde; >180 amarillo. Nunca rojo. (Cortes: verificar.)
  alcalinidad: {
    tipo: 'operativo',
    tramos: [
      {
        hasta: 40,
        nivel: 'amarillo',
        frase: 'Tu agua tiene poca defensa y puede ponerse agresiva con las tuberías.',
        corrige: ['alcalinidad'],
      },
      verde(180, true),
      {
        nivel: 'amarillo',
        frase: 'Tu agua viene cargada de minerales. Puede dejar sabor y sarro.',
        corrige: ['alcalinidad'],
      },
    ],
  },

  // ≤180 verde; >180 a 300 amarillo; >300 rojo. (Corte de 300: verificar.)
  dureza: {
    tipo: 'operativo',
    tramos: [
      verde(180, true),
      {
        hasta: 300,
        incluye: true,
        nivel: 'amarillo',
        frase:
          'Tu agua es dura. Deja sarro en la ducha, las ollas y el calentador, y le acorta la vida a tus equipos.',
        corrige: ['dureza'],
      },
      {
        nivel: 'rojo',
        frase:
          'Tu agua es muy dura. Vas a ver sarro por todos lados y tus equipos van a sufrir. Aquí conviene un ablandador.',
        corrige: ['dureza'],
      },
    ],
  },

  // <1 verde; 1 a 1.3 amarillo; >1.3 rojo. Orientativo.
  cobre: {
    tipo: 'salud',
    tramos: [
      verde(1),
      {
        hasta: 1.3,
        incluye: true,
        nivel: 'amarillo',
        frase: 'Posible presencia de cobre. Una tira casera no lo confirma. Confirma con un laboratorio.',
        corrige: ['cobre'],
      },
      {
        nivel: 'rojo',
        frase:
          'Posible presencia de cobre. Una tira casera no lo confirma. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar y cocinar. Hervirla no quita el cobre.',
        corrige: ['cobre'],
      },
    ],
  },

  // <25 verde; 25 a <50 amarillo; ≥50 rojo (como NO3).
  nitrato: {
    tipo: 'salud',
    tramos: [
      verde(25),
      {
        hasta: 50,
        nivel: 'amarillo',
        frase:
          'La tira marca nitratos en nivel medio. Pasa mucho con pozos y tanques. Repite la prueba y no lo pierdas de vista.',
        corrige: ['nitrato'],
      },
      {
        nivel: 'rojo',
        frase:
          'La tira marca nitratos altos. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar, cocinar y preparar teteros. Hervirla no quita los nitratos.',
        corrige: ['nitrato'],
      },
    ],
  },

  // <3 verde; 3 a 4 amarillo; >4 rojo. (Corte de 3: verificar.)
  cloro_libre: {
    tipo: 'salud',
    tramos: [
      verde(3),
      {
        hasta: 4,
        incluye: true,
        nivel: 'amarillo',
        frase: 'Tu agua trae bastante cloro. Se nota en el olor y el sabor. Un filtro de carbón está pensado para reducirlo.',
        corrige: ['cloro_libre', 'sabor_olor'],
      },
      {
        nivel: 'rojo',
        frase:
          'El cloro salió muy alto. Si acabas de clorar el tanque, espera unas horas y repite la prueba. Si sigue igual, por precaución usa otra agua para tomar mientras lo revisas. Un filtro de carbón está pensado para reducir el cloro.',
        corrige: ['cloro_libre', 'sabor_olor'],
      },
    ],
  },

  // 0 verde; >0 a 10 amarillo; >10 rojo. Orientativo.
  plomo: {
    tipo: 'salud',
    tramos: [
      verde(0, true, 'La tira no marcó presencia de plomo. Una tira casera puede no detectar cantidades bajas.'),
      {
        hasta: 10,
        incluye: true,
        nivel: 'amarillo',
        frase:
          'Posible presencia de plomo. Una tira casera no lo confirma. Confirma con un laboratorio.',
        corrige: ['plomo'],
      },
      {
        nivel: 'rojo',
        frase:
          'Posible presencia de plomo. Una tira casera no lo confirma. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar y cocinar. Hervirla no quita el plomo.',
        corrige: ['plomo'],
      },
    ],
  },

  // <6.5 amarillo; 6.5 a 8.5 verde; >8.5 amarillo. Sin rojo en el rango de la tira.
  ph: {
    tipo: 'operativo',
    tramos: [
      {
        hasta: 6.5,
        nivel: 'amarillo',
        frase: 'Tu agua salió algo ácida. Puede desgastar tuberías y griferías.',
        corrige: ['ph'],
      },
      verde(8.5, true),
      {
        nivel: 'amarillo',
        frase: 'Tu agua salió algo alcalina. Puede saber raro, sentirse jabonosa y dejar sarro.',
        corrige: ['ph'],
      },
    ],
  },

  // <1 verde; 1 a 3 amarillo; >3 rojo (como NO2).
  nitrito: {
    tipo: 'salud',
    tramos: [
      verde(1),
      {
        hasta: 3,
        incluye: true,
        nivel: 'amarillo',
        frase:
          'La tira marca nitritos. Repite la prueba y haz también la de bacterias del sobre.',
        corrige: ['nitrito'],
      },
      {
        nivel: 'rojo',
        frase:
          'La tira marca nitritos altos. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar, cocinar y preparar teteros. Hervirla no quita los nitritos.',
        corrige: ['nitrito'],
      },
    ],
  },

  // ≤0.3 verde; >0.3 a <3 amarillo; ≥3 rojo. (Corte de 3: verificar.)
  hierro: {
    tipo: 'operativo',
    tramos: [
      verde(0.3, true),
      {
        hasta: 3,
        nivel: 'amarillo',
        frase: 'Tu agua trae hierro. Mancha de marrón la ropa, la poceta y el lavamanos, y da sabor a metal.',
        corrige: ['hierro'],
      },
      {
        nivel: 'rojo',
        frase:
          'Tu agua trae mucho hierro. Vas a ver manchas marrones y sabor fuerte a metal. Hace falta un filtro para hierro antes que cualquier otro.',
        corrige: ['hierro'],
      },
    ],
  },
};

/** Devuelve el tramo en el que cae un valor. */
export function tramoDe(clave: ClaveParametro, valor: number): Tramo {
  const { tramos } = umbrales[clave];
  for (const tramo of tramos) {
    if (tramo.hasta === undefined) return tramo;
    if (tramo.incluye ? valor <= tramo.hasta : valor < tramo.hasta) return tramo;
  }
  return tramos[tramos.length - 1];
}

// ── Reglas de perfil del hogar (agua.md, sección 3) ──

/**
 * Regla opcional de agua.md: cloro en 0 con agua de chorro, tanque o pozo y sin filtro
 * pasa a amarillo ("sin cloro"). Con filtro o botellón, 0 es lo esperado.
 * Para apagarla, pon `activa: false`.
 */
export const reglaSinCloro = {
  activa: true,
  origenes: ['chorro', 'tanque', 'pozo'] as string[],
  frase:
    'La tira no marcó cloro. Si tu agua viene de tanque o pozo, vale la pena hacer la prueba de bacterias del sobre.',
  corrige: ['bacterias'],
};

/** Agua turbia o amarilla → primero un cartucho de sedimentos. */
export const CORRIGE_AGUA_TURBIA = 'sedimentos';
/** Pozo o tanque → sugerencia de desinfección (lavado y cloración del tanque, lámpara UV). */
export const ORIGENES_CON_DESINFECCION = ['pozo', 'tanque'] as string[];
export const CORRIGE_DESINFECCION = 'bacterias';

// ── Vida útil orientativa de cartuchos (agua.md, sección 6) ──
// El dato del fabricante, cuando llegue el catálogo, manda sobre esta tabla.

export const vidaUtilMeses = {
  sedimentos: 3,
  carbon_granular: 6,
  carbon_bloque: 6,
  membrana_osmosis: 24,
  post_carbon: 12,
} as const;

export type TipoCartucho = keyof typeof vidaUtilMeses;

/**
 * Qué cartuchos lleva un filtro según sus etapas. SUPUESTO (verificar con Tulio):
 * 1 etapa = carbón en bloque; 2 = sedimentos + carbón; 3 = sedimentos + dos de carbón;
 * 4 = suma la membrana; 5 o más = ósmosis completa.
 */
export const cartuchosPorEtapas: Record<number, TipoCartucho[]> = {
  1: ['carbon_bloque'],
  2: ['sedimentos', 'carbon_bloque'],
  3: ['sedimentos', 'carbon_granular', 'carbon_bloque'],
  4: ['sedimentos', 'carbon_granular', 'carbon_bloque', 'membrana_osmosis'],
  5: ['sedimentos', 'carbon_granular', 'carbon_bloque', 'membrana_osmosis', 'post_carbon'],
};

/** Si el hogar no sabe cuántas etapas tiene su filtro, se asume la base de 2. */
export const ETAPAS_POR_DEFECTO = 2;

/** Ajustes de vida útil. Todos SUPUESTOS (verificar con Tulio). */
export const ajustesVidaUtil = {
  /** Agua turbia o amarilla: el de sedimentos dura la mitad. */
  sedimentosConAguaTurbia: 0.5,
  /** Con 5 o más personas en casa, todos los cartuchos duran × 0.75. */
  personasDesde: 5,
  factorMuchasPersonas: 0.75,
};

export const DIAS_POR_MES = 30;
