// Genera db/semilla.sql: datos de demostración INVENTADOS (ninguna persona, teléfono ni dirección real).
// Las evaluaciones se calculan con el mismo módulo que usa la API, para que la semilla tenga la forma real.
// Uso (desde la raíz del repositorio): npx tsx db/generar_semilla.ts
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluarAgua } from '../api/src/medicion/index';
import { calcularMapa, type FilaMedicionMapa } from '../api/src/logistica/mapa';
import { calcularRutas, detalleDePedido, type PedidoParaRuta } from '../api/src/logistica/rutas-despacho';
import { buscarUrbanizacion, URBANIZACIONES } from '../api/src/logistica/urbanizaciones';
import type { Nivel, OrigenAgua, PerfilHogar, ValoresMedicion } from '../api/src/tipos';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const HOY = new Date();

// ---------- Lecturas tipo (valores de casillas de la tira de referencia) ----------

const BIEN: ValoresMedicion = {
  alcalinidad: 80, dureza: 50, cobre: 0, nitrato: 0, cloro_libre: 0.5, plomo: 0, ph: 7.2, nitrito: 0,
};
const lectura = (cambios: ValoresMedicion): ValoresMedicion => ({ ...BIEN, ...cambios });

const LECTURAS = {
  bien: BIEN,
  bien_2: lectura({ alcalinidad: 120, dureza: 120, nitrato: 10, cloro_libre: 1 }),
  faltan_casillas: lectura({ plomo: null, cobre: null, nitrito: null }),
  dura: lectura({ dureza: 250, alcalinidad: 180 }),
  muy_dura: lectura({ dureza: 425, alcalinidad: 240 }),
  cloro_alto: lectura({ cloro_libre: 3 }),
  nitrato_medio: lectura({ nitrato: 25, cloro_libre: 0 }),
  nitrato_rojo: lectura({ nitrato: 50, nitrito: 1, cloro_libre: 0 }),
  nitrito_medio: lectura({ nitrito: 1, cloro_libre: 0 }),
  nitrito_rojo: lectura({ nitrito: 5, nitrato: 25, cloro_libre: 0 }),
  plomo_medio: lectura({ plomo: 5 }),
  plomo_rojo: lectura({ plomo: 15, ph: 6.2 }),
  cobre_rojo: lectura({ cobre: 2, ph: 6.2, alcalinidad: 0 }),
  acida: lectura({ ph: 6.2, alcalinidad: 0 }),
  alcalina: lectura({ ph: 8.8, alcalinidad: 240 }),
} satisfies Record<string, ValoresMedicion>;

type NombreLectura = keyof typeof LECTURAS;
/** [hace cuántos días, qué lectura, cómo se cargó] */
type Paso = [number, NombreLectura, 'foto' | 'manual'];

interface HogarSemilla {
  nombre: string;
  zona: string;
  /** Nombre tal cual en api/src/logistica/urbanizaciones.ts. */
  urbanizacion: string;
  /** Tienda que eligió el hogar (no siempre es la sugerida por su zona). */
  tienda: string;
  origen: OrigenAgua;
  personas: number;
  /** 0 = sin filtro */
  etapas: number;
  /** Días desde el último cambio de cartucho (null = no tiene filtro o no se acuerda). */
  diasCambio: number | null;
  turbia: boolean;
  serie: Paso[];
  /** Código del cartucho de su último cambio, si lo pidió por la app (queda como pedido despachado). */
  ultimoCartucho: string | null;
}

const h = (
  nombre: string, zona: string, urbanizacion: string, tienda: string, origen: OrigenAgua, personas: number, etapas: number,
  diasCambio: number | null, turbia: boolean, serie: Paso[], ultimoCartucho: string | null = null,
): HogarSemilla => ({ nombre, zona, urbanizacion, tienda, origen, personas, etapas, diasCambio, turbia, serie, ultimoCartucho });

const MAN = 'manongo';
const BIG = 'biglow';
const CEM = 'cem';

const N = 'Naguanagua';
const S = 'San Diego';
const V = 'Valencia norte';

// Historia del mapa por urbanización (pestaña Zonas del operador):
// - Foco con alerta en dos urbanizaciones vecinas de Naguanagua con pozos: La Begoña y El Naranjal
//   (3 o más hogares cada una en rojo por nitrato o nitrito en los últimos 7 días).
// - En rojo sin llegar a alerta: Las Quintas (plomo) y El Morro I (cobre).
// - Amarillo por dureza o cloro: Yuma, La Esmeralda, Prebo I, Camoruco, La Viña, Bárbula, Capremco...
// - Verde: Trigal Norte, El Viñedo, Mañongo, Kerdell, Valle de Oro...
// - Con hogares pero sin medición reciente: Palma Real, Los Guayabitos, La Cumaca, Las Chimeneas.
// - El resto de las urbanizaciones de la lista queda sin clientes (zonas por captar).
// El nombre de la urbanización debe existir en api/src/logistica/urbanizaciones.ts (se comprueba abajo).
const HOGARES: HogarSemilla[] = [
  // Naguanagua
  h('Ana P.', N, 'La Begoña', MAN, 'pozo', 4, 0, null, true, [[34, 'nitrato_medio', 'manual'], [3, 'nitrato_rojo', 'foto']]),
  h('Luis M.', N, 'La Begoña', MAN, 'tanque', 5, 2, 176, false, [[60, 'bien', 'foto'], [28, 'nitrato_medio', 'foto'], [2, 'nitrato_rojo', 'foto']], 'OPW-PP20A022'),
  h('Carmen R.', N, 'Las Quintas', MAN, 'chorro', 3, 0, null, false, [[5, 'plomo_rojo', 'foto']]),
  h('José G.', N, 'El Naranjal', MAN, 'pozo', 6, 3, 190, true, [[45, 'nitrito_medio', 'manual'], [4, 'nitrito_rojo', 'foto']], 'OPW-CTOSU5'),
  h('María T.', N, 'Mañongo', MAN, 'chorro', 2, 3, 40, false, [[70, 'cloro_alto', 'foto'], [10, 'bien', 'foto']]),
  h('Pedro L.', N, 'Mañongo', MAN, 'botellon', 4, 0, null, false, [[15, 'bien_2', 'foto']]),
  h('Rosa D.', N, 'El Naranjal', MAN, 'tanque', 3, 0, null, true, [[50, 'dura', 'manual'], [20, 'dura', 'foto'], [6, 'nitrato_rojo', 'foto']]),
  h('Carlos V.', N, 'La Granja', MAN, 'filtro', 4, 5, 86, false, [[80, 'bien', 'foto'], [40, 'bien_2', 'foto'], [9, 'faltan_casillas', 'foto']]),
  h('Elena S.', N, 'Las Quintas', MAN, 'chorro', 1, 0, null, false, [[22, 'cloro_alto', 'manual']]),
  h('Miguel A.', N, 'Tazajal', MAN, 'chorro', 5, 2, 95, false, [[30, 'plomo_medio', 'foto'], [8, 'bien', 'foto']]),

  // San Diego
  h('Laura B.', S, 'Yuma', BIG, 'chorro', 4, 3, 178, false, [[65, 'dura', 'foto'], [12, 'muy_dura', 'foto']], 'OPW-GACSU5'),
  h('Jorge C.', S, 'Yuma', BIG, 'pozo', 5, 0, null, true, [[40, 'muy_dura', 'manual'], [3, 'muy_dura', 'foto']]),
  h('Daniela F.', S, 'El Morro I', BIG, 'tanque', 3, 0, null, false, [[6, 'cobre_rojo', 'foto']]),
  h('Andrés H.', S, 'Pueblo de San Diego', BIG, 'botellon', 2, 0, null, false, [[18, 'bien', 'foto']]),
  h('Patricia N.', S, 'La Esmeralda', BIG, 'filtro', 4, 5, 70, false, [[90, 'bien', 'foto'], [55, 'bien_2', 'foto'], [25, 'dura', 'foto'], [4, 'dura', 'foto']]),
  h('Rafael O.', S, 'El Morro II', CEM, 'chorro', 6, 2, 152, false, [[33, 'cloro_alto', 'foto'], [7, 'bien', 'foto']], 'OPW-PP20BFL02'),
  h('Gabriela Q.', S, 'Monteserino', CEM, 'chorro', 3, 0, null, false, [[11, 'acida', 'manual']]),
  h('Héctor Z.', S, 'Valle de Oro', CEM, 'tanque', 4, 3, 20, false, [[48, 'nitrato_medio', 'foto'], [16, 'bien_2', 'foto']]),
  h('Mariana E.', S, 'El Remanso', CEM, 'botellon', 2, 0, null, false, [[27, 'faltan_casillas', 'manual']]),
  h('Ricardo J.', S, 'Valle Verde', CEM, 'pozo', 7, 4, 88, true, [[75, 'nitrato_medio', 'foto'], [35, 'nitrato_medio', 'foto'], [5, 'nitrato_medio', 'foto']]),

  // Valencia norte
  h('Sofía K.', V, 'Trigal Norte', MAN, 'chorro', 3, 3, 65, false, [[21, 'plomo_rojo', 'foto'], [2, 'bien', 'foto']]),
  h('Alberto U.', V, 'Prebo I', MAN, 'chorro', 4, 0, null, false, [[14, 'cloro_alto', 'foto']]),
  h('Valentina I.', V, 'El Viñedo', MAN, 'botellon', 1, 0, null, false, [[9, 'bien', 'manual']]),
  h('Fernando Y.', V, 'Trigal Norte', MAN, 'filtro', 5, 5, 174, false, [[85, 'bien', 'foto'], [44, 'bien_2', 'foto'], [13, 'bien', 'foto']], 'OPW-RSSU5'),
  h('Isabel W.', V, 'La Viña', MAN, 'tanque', 4, 0, null, true, [[30, 'dura', 'foto'], [6, 'dura', 'foto']]),
  h('Tomás X.', V, 'Trigal Sur', MAN, 'chorro', 2, 2, 10, false, [[19, 'bien_2', 'foto']]),
  h('Adriana P.', V, 'El Viñedo', BIG, 'chorro', 3, 0, null, false, [[26, 'alcalina', 'manual'], [4, 'bien', 'foto']]),
  h('Manuel R.', V, 'Guaparo', BIG, 'pozo', 6, 3, 165, false, [[58, 'nitrato_medio', 'foto'], [17, 'bien', 'foto']], 'OPW-GACSU5'),
  h('Beatriz G.', V, 'Kerdell', CEM, 'botellon', 2, 0, null, false, [[8, 'bien', 'foto']]),
  h('Óscar M.', V, 'Prebo I', CEM, 'chorro', 4, 1, 130, false, [[36, 'cloro_alto', 'foto'], [1, 'cloro_alto', 'foto']]),

  // Segunda tanda (31 a 60): más hogares para el mapa por urbanización.
  // Naguanagua
  h('Gustavo T.', N, 'La Begoña', MAN, 'pozo', 5, 0, null, true, [[2, 'nitrato_rojo', 'foto']]),
  h('Paola R.', N, 'El Naranjal', MAN, 'pozo', 4, 0, null, false, [[38, 'nitrito_medio', 'manual'], [5, 'nitrito_rojo', 'foto']]),
  h('Ramón V.', N, 'La Begoña', MAN, 'tanque', 3, 2, 60, false, [[4, 'nitrato_medio', 'foto']]),
  h('Yolanda C.', N, 'Capremco', MAN, 'chorro', 4, 0, null, false, [[9, 'dura', 'foto']]),
  h('Ernesto B.', N, 'Palma Real', MAN, 'botellon', 2, 0, null, false, [[45, 'bien', 'manual']]),
  h('Lucía M.', N, 'Bárbula', MAN, 'chorro', 3, 0, null, false, [[6, 'cloro_alto', 'foto']]),
  h('Wilmer D.', N, 'Bárbula', MAN, 'tanque', 5, 3, 120, false, [[12, 'bien', 'foto']]),
  h('Marisol F.', N, 'La Granja', MAN, 'chorro', 2, 0, null, false, [[11, 'bien_2', 'foto']]),
  h('Nelson G.', N, 'Los Guayabitos', MAN, 'pozo', 6, 0, null, true, [[40, 'bien', 'manual']]),
  h('Carolina S.', N, 'Mañongo', MAN, 'filtro', 3, 5, 30, false, [[3, 'bien', 'foto']]),
  // San Diego
  h('Alejandro P.', S, 'Yuma', BIG, 'chorro', 4, 0, null, false, [[6, 'dura', 'foto']]),
  h('Yusmary L.', S, 'El Morro I', BIG, 'botellon', 2, 0, null, false, [[5, 'bien', 'foto']]),
  h('Enrique A.', S, 'Pueblo de San Diego', BIG, 'chorro', 5, 2, 75, false, [[10, 'bien_2', 'foto']]),
  h('Gloria N.', S, 'La Cumaca', BIG, 'pozo', 4, 0, null, true, [[50, 'dura', 'manual']]),
  h('Simón E.', S, 'El Morro II', CEM, 'chorro', 3, 0, null, false, [[3, 'cloro_alto', 'foto']]),
  h('Teresa O.', S, 'Monteserino', CEM, 'botellon', 2, 0, null, false, [[9, 'bien', 'foto']]),
  h('Jesús H.', S, 'Valle de Oro', CEM, 'chorro', 6, 3, 100, false, [[13, 'bien', 'foto']]),
  h('Mónica Z.', S, 'Valle Verde', BIG, 'tanque', 3, 0, null, false, [[8, 'alcalina', 'foto']]),
  h('Douglas K.', S, 'La Esmeralda', CEM, 'chorro', 4, 0, null, false, [[14, 'dura', 'foto']]),
  h('Rebeca U.', S, 'El Remanso', BIG, 'filtro', 2, 5, 50, false, [[20, 'bien_2', 'foto']]),
  // Valencia norte
  h('Orlando J.', V, 'Trigal Norte', MAN, 'chorro', 4, 0, null, false, [[6, 'bien', 'foto']]),
  h('Natalia W.', V, 'Trigal Norte', CEM, 'botellon', 2, 0, null, false, [[3, 'bien_2', 'foto']]),
  h('Arturo Y.', V, 'El Viñedo', MAN, 'chorro', 5, 2, 45, false, [[15, 'bien', 'foto']]),
  h('Milagros I.', V, 'Camoruco', CEM, 'tanque', 3, 0, null, false, [[7, 'dura', 'foto']]),
  h('Freddy Q.', V, 'Las Chimeneas', MAN, 'chorro', 4, 0, null, false, [[60, 'bien', 'manual']]),
  h('Susana X.', V, 'La Trigaleña', MAN, 'filtro', 3, 5, 25, false, [[5, 'bien', 'foto']]),
  h('Ángel D.', V, 'Altos de Guataparo', CEM, 'pozo', 6, 0, null, true, [[10, 'dura', 'foto']]),
  h('Diana B.', V, 'Kerdell', CEM, 'chorro', 2, 0, null, false, [[12, 'bien', 'foto']]),
  h('Víctor C.', V, 'Camoruco', MAN, 'chorro', 4, 0, null, false, [[2, 'cloro_alto', 'foto']]),
  h('Irene F.', V, 'Guaparo', MAN, 'botellon', 3, 0, null, false, [[18, 'bien_2', 'foto']]),
];

// ---------- Red de comercios (docs/decisiones/contrato-red.md) ----------
// Dos aliados INVENTADOS y rotulados "(comercio de demostración)". Sus hogares (61 a 70) no tienen urbanización
// de la lista de Valencia: en su mapa salen como "Otras de <zona>".
const LARA = 'lara-centro';
const ARAGUA = 'aragua-centro';
const BQTO = 'Barquisimeto';
const MCY = 'Maracay';

/** Grimuca entró a la red hace 400 días: es el comercio más antiguo (en /red no debe verse como el más nuevo). */
const DIAS_ALTA_GRIMUCA = 400;

/** Comercios: [id, nombre, estado, ciudad, plan, alta hace cuántos días, fin del periodo gratis (SQL)]. */
const COMERCIOS_ALIADOS: Array<[string, string, string, string, 'basico' | 'premium', number, string]> = [
  // Alta hace 20 días con 3 meses gratis: el periodo sigue vigente.
  ['aliado-lara', 'Aliado Lara (comercio de demostración)', 'Lara', 'Barquisimeto', 'basico', 20, "(now() + interval '70 days')::date"],
  // Alta hace 100 días con 3 meses gratis: el periodo venció hace 10 días.
  ['aliado-aragua', 'Aliado Aragua (comercio de demostración)', 'Aragua', 'Maracay', 'basico', 100, "(now() - interval '10 days')::date"],
];

/** Tiendas de los aliados: [id, nombre, horario, dirección, comercio]. */
const TIENDAS_ALIADAS: Array<[string, string, string, string, string]> = [
  [LARA, 'Aliado Lara · Centro', 'Lunes a sábado de 8:00 a.m. a 5:00 p.m.', 'Calle 1, local 1, Barquisimeto (dato de prueba)', 'aliado-lara'],
  [ARAGUA, 'Aliado Aragua · Centro', 'Lunes a sábado de 8:00 a.m. a 5:00 p.m.', 'Calle 2, local 3, Maracay (dato de prueba)', 'aliado-aragua'],
];

/** Producto cargado por el aliado de Lara (aparece en su pestaña Productos como propio). */
const PRODUCTO_PROPIO_LARA = {
  codigo: 'ALIADO-LARA-SED10',
  nombre: 'Cartucho de sedimentos 10 pulgadas (producto de demostración)',
  categoria: 'cartucho',
  corrige: ['sedimentos'],
};

const HOGARES_ALIADOS: HogarSemilla[] = [
  // Aliado Lara: 6 hogares en Barquisimeto.
  h('Yelitza R.', BQTO, '', LARA, 'chorro', 4, 0, null, false, [[6, 'dura', 'foto']]),
  h('Henry P.', BQTO, '', LARA, 'tanque', 5, 2, 95, true, [[12, 'bien_2', 'foto'], [3, 'cloro_alto', 'foto']]),
  h('Zuleima T.', BQTO, '', LARA, 'pozo', 3, 0, null, false, [[9, 'nitrato_medio', 'manual']]),
  h('Edgar M.', BQTO, '', LARA, 'botellon', 2, 0, null, false, [[15, 'bien', 'foto']]),
  h('Norelys C.', BQTO, '', LARA, 'chorro', 4, 3, 40, false, [[4, 'bien', 'foto']]),
  h('Javier S.', BQTO, '', LARA, 'filtro', 3, 5, 60, false, [[20, 'bien_2', 'foto']]),
  // Aliado Aragua: 4 hogares en Maracay.
  h('Xiomara L.', MCY, '', ARAGUA, 'chorro', 3, 0, null, false, [[25, 'cloro_alto', 'foto']]),
  h('Richard A.', MCY, '', ARAGUA, 'tanque', 5, 0, null, true, [[40, 'dura', 'manual']]),
  h('Deisy V.', MCY, '', ARAGUA, 'chorro', 2, 2, 120, false, [[18, 'bien', 'foto']]),
  h('Luis F.', MCY, '', ARAGUA, 'botellon', 4, 0, null, false, [[50, 'bien_2', 'foto']]),
];

/** Pedidos pendientes del aliado de Lara: [n.º de hogar, tipo, código, cantidad, modalidad, hace cuántas horas]. */
const PENDIENTES_LARA: Array<[number, 'sobre' | 'cartucho', string | null, number, 'retiro' | 'envio', number]> = [
  [61, 'sobre', null, 1, 'envio', 6],
  [62, 'cartucho', 'OPW-GACSU5', 1, 'retiro', 10],
  [65, 'cartucho', PRODUCTO_PROPIO_LARA.codigo, 2, 'retiro', 3],
];

/**
 * Servicios técnicos de Grimuca: [n.º de hogar, servicio, en cuántos días (fecha preferida), momento, nota,
 * atendido hace cuántos días (null = pendiente), nota del técnico].
 */
const SERVICIOS: Array<
  [number, 'cambio_cartucho' | 'instalacion_filtro', number, 'manana' | 'tarde', string | null, number | null, string | null]
> = [
  [2, 'cambio_cartucho', 1, 'manana', 'El filtro está debajo del fregadero. (dato de prueba)', null, null],
  [12, 'instalacion_filtro', 2, 'tarde', null, null, null],
  [24, 'cambio_cartucho', 3, 'manana', 'Llamar antes de llegar. (dato de prueba)', null, null],
  [8, 'cambio_cartucho', -2, 'tarde', null, 1, 'Se cambiaron los cartuchos de sedimentos y carbón; sin fugas. (dato de prueba)'],
];

// Todos los códigos de este archivo existen en el catálogo (db/semilla_cartuchos.sql).

/** Pedidos pendientes: [n.º de hogar, tipo, código, cantidad, modalidad, hace cuántas horas] */
// Rutas de despacho (pestaña "Rutas"): 8 envíos de Mañongo en 6 urbanizaciones de Naguanagua y Valencia norte
// (Mañongo, Las Quintas, La Begoña, El Naranjal, Trigal Norte y Trigal Sur) y 4 de las tiendas de San Diego.
// Los de retiro no entran a la ruta.
const PENDIENTES: Array<[number, 'sobre' | 'cartucho', string | null, number, 'retiro' | 'envio', number]> = [
  // Mañongo, con envío
  [6, 'sobre', null, 1, 'envio', 2],
  [40, 'cartucho', 'OPW-PP20BFL02', 1, 'envio', 7],
  [3, 'cartucho', 'OPW-100GPD-8TN', 1, 'envio', 20],
  [9, 'sobre', null, 1, 'envio', 9],
  [33, 'sobre', null, 1, 'envio', 4],
  [4, 'cartucho', 'OPW-CTOSU5', 1, 'envio', 18],
  [21, 'cartucho', 'OPW-GACSU5', 1, 'envio', 15],
  [26, 'sobre', null, 1, 'envio', 11],
  // Big Low y CC CEM, con envío
  [14, 'sobre', null, 1, 'envio', 5],
  [13, 'cartucho', 'OPW-PP20A022', 1, 'envio', 14],
  [16, 'sobre', null, 1, 'envio', 6],
  [18, 'cartucho', 'OPW-RSSU5', 1, 'envio', 22],
  // Retiro en tienda
  [1, 'cartucho', 'OPW-PP20A022', 2, 'retiro', 3],
  [12, 'cartucho', 'OPW-RSSU5', 1, 'retiro', 8],
  [19, 'sobre', null, 1, 'retiro', 26],
  [41, 'cartucho', 'OPW-RSSU5', 1, 'retiro', 12],
];

/** Existencias por tienda. Los ceros y los números bajos son los faltantes que debe mostrar el inventario. */
const STOCK: Record<string, Record<string, number>> = {
  manongo: {
    'OPW-PP20A022': 1, 'OPW-PP20BFL02': 6, 'OPW-GACSU5': 4, 'OPW-CTOSU5': 0, 'OPW-RSSU5': 5,
    'OPW-100GPD-8TN': 0, 'OPW-200GPD-8TN': 2, 'OPW-6STUF10S': 3, 'EMUV-11W': 2,
  },
  biglow: {
    'OPW-PP20A022': 8, 'OPW-PP20BFL02': 0, 'OPW-GACSU5': 5, 'OPW-CTOSU5': 7, 'OPW-RSSU5': 0,
    'OPW-100GPD-8TN': 1, 'OPW-200GPD-8TN': 1, 'OPW-6STUF10S': 2, 'EMUV-11W': 0,
  },
  cem: {
    'OPW-PP20A022': 10, 'OPW-PP20BFL02': 4, 'OPW-GACSU5': 6, 'OPW-CTOSU5': 0, 'OPW-RSSU5': 3,
    'OPW-100GPD-8TN': 2, 'OPW-200GPD-8TN': 0, 'OPW-6STUF10S': 4, 'EMUV-11W': 3,
  },
  // Aliados (comercios de demostración): 6 productos en Lara (uno propio) y 4 en Aragua.
  [LARA]: {
    'OPW-PP20A022': 4, 'OPW-GACSU5': 0, 'OPW-RSSU5': 3, 'OPW-100GPD-8TN': 1, 'OPW-6STUF10S': 2,
    [PRODUCTO_PROPIO_LARA.codigo]: 5,
  },
  [ARAGUA]: { 'OPW-PP20A022': 2, 'OPW-CTOSU5': 3, 'OPW-RSSU5': 0, 'EMUV-11W': 1 },
};

/** Tiendas: [id, nombre, horario, dirección]. Datos públicos de grimuca.com (los mismos de db/migraciones/003_tiendas.sql). */
const HORARIO = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.';
const TIENDAS: Array<[string, string, string, string]> = [
  ['manongo', 'Mañongo', HORARIO, 'C.C. Profesional Paseo Orquídea, local A-3, Av. Salvador Feo La Cruz, Naguanagua'],
  ['biglow', 'Big Low', HORARIO, 'C.C. Big Low Center, nivel 1, nave F, locales 1-3 y 35-37, calle 101, San Diego'],
  ['cem', 'CC CEM', HORARIO, 'C.C. CEM I, nivel 1, local 06, Av. Don Julio Centeno, San Diego'],
];

/** Pruebas de bacterias: [n.º de hogar, iniciada hace cuántos días, reportada hace cuántos días o null, resultado] */
const BACTERIAS: Array<[number, number, number | null, 'pendiente' | 'cambio' | 'sin_cambio']> = [
  [1, 1, null, 'pendiente'],
  [2, 5, 3, 'cambio'],
  [13, 6, 4, 'sin_cambio'],
  [21, 2, null, 'pendiente'],
  [32, 3, null, 'pendiente'],
];

// ---------- Utilidades SQL ----------

const txt = (valor: string | null) => (valor === null ? 'NULL' : `'${valor.replace(/'/g, "''")}'`);
const json = (valor: unknown) => `${txt(JSON.stringify(valor))}::jsonb`;
const hace = (dias: number, horas = 0) =>
  `now() - interval '${dias} days${horas ? ` ${horas} hours` : ''}'`;
const haceHoras = (horas: number) => `now() - interval '${horas} hours'`;
const dos = (n: number) => String(n).padStart(2, '0');
const idHogar = (n: number) => `00000000-0000-4000-8000-0000000000${dos(n)}`;
const idMedicion = (n: number, m: number) => `00000000-0000-4000-8100-00000000${dos(n)}${dos(m)}`;
const idBacterias = (n: number) => `00000000-0000-4000-8200-0000000000${dos(n)}`;

function diaHace(dias: number): string {
  const fecha = new Date(Date.UTC(HOY.getFullYear(), HOY.getMonth(), HOY.getDate()) - dias * 86_400_000);
  return fecha.toISOString().slice(0, 10);
}

/** Cerca de la mitad de los hogares tiene mascotas. */
const mascotasDe = (n: number) => n % 2 === 1;

function direccionDe(n: number): string {
  return n % 3 === 0
    ? `Avenida ${(n % 7) + 1}, edificio ${'ABCDEFG'[n % 7]}, apartamento ${(n % 9) + 1} (dato de prueba)`
    : `Calle ${(n % 12) + 1}, casa ${n + 4} (dato de prueba)`;
}

// ---------- Armado ----------

const filasHogares: string[] = [];
const filasMediciones: string[] = [];
const filasPedidos: string[] = [];
const rojosRecientesPorZona = new Map<string, number>();
let totalMediciones = 0;
const ultimasParaMapa: FilaMedicionMapa[] = [];

const TODOS_LOS_HOGARES = [...HOGARES, ...HOGARES_ALIADOS];

TODOS_LOS_HOGARES.forEach((hogar, indice) => {
  const n = indice + 1;
  const id = idHogar(n);
  const tieneFiltro = hogar.etapas > 0;
  const tienda = hogar.tienda;
  const direccion = direccionDe(n);
  const masVieja = Math.max(...hogar.serie.map((paso) => paso[0]));
  const diasSobre = masVieja + 4; // el sobre se pidió unos días antes de la primera medición

  filasHogares.push(
    `  (${txt(id)}, ${txt(hogar.nombre)}, ${txt(hogar.zona)}, ${txt(hogar.origen)}, ${hogar.personas}, ${tieneFiltro}, ` +
      `${tieneFiltro ? hogar.etapas : 'NULL'}, ${hogar.diasCambio === null ? 'NULL' : `(${hace(hogar.diasCambio)})::date`}, ` +
      `${hogar.turbia}, ${txt(n <= 60 ? `0414-555-01${dos(n)}` : `0414-555-02${dos(n)}`)}, ${txt(direccion)}, ${txt(tienda)}, ` +
      `${txt(hogar.urbanizacion || null)}, ` +
      `${mascotasDe(n)}, ${hace(diasSobre, 1)})`,
  );

  const perfil: PerfilHogar = {
    origen_agua: hogar.origen,
    tiene_filtro: tieneFiltro,
    etapas_filtro: tieneFiltro ? hogar.etapas : null,
    fecha_ultimo_cambio: hogar.diasCambio === null ? null : diaHace(hogar.diasCambio),
    agua_turbia: hogar.turbia,
    personas: hogar.personas,
  };

  let ultimoNivel: Nivel = 'sin_dato';
  let ultimoDias = Infinity;
  let ultimaParaMapa: FilaMedicionMapa | null = null;
  hogar.serie.forEach(([dias, nombre, origen], m) => {
    const valores = LECTURAS[nombre];
    const evaluacion = evaluarAgua(valores, perfil, HOY);
    const porParametro = Object.fromEntries(evaluacion.porParametro.map((p) => [p.clave, p.nivel]));
    const horas = ((n * 7 + m * 5) % 10) + 1;
    filasMediciones.push(
      `  (${txt(idMedicion(n, m + 1))}, ${txt(id)}, ${hace(dias, horas)}, ${txt(origen)}, ${json(valores)}, ` +
        `${txt(evaluacion.semaforo)}, ${json(porParametro)},\n   ${json(evaluacion)})`,
    );
    totalMediciones += 1;
    if (dias < ultimoDias) {
      ultimoDias = dias;
      ultimoNivel = evaluacion.semaforo;
      ultimaParaMapa = {
        hogar_id: id,
        fecha: new Date(HOY.getTime() - dias * 86_400_000 - horas * 3_600_000),
        semaforo: evaluacion.semaforo,
        semaforo_por_parametro: porParametro,
      };
    }
  });
  if (ultimaParaMapa && n <= HOGARES.length) ultimasParaMapa.push(ultimaParaMapa);
  if (ultimoNivel === 'rojo' && ultimoDias < 7 && n <= HOGARES.length) {
    rojosRecientesPorZona.set(hogar.zona, (rojosRecientesPorZona.get(hogar.zona) ?? 0) + 1);
  }

  // Historial: el sobre que recibió y, si tiene filtro, el cartucho de su último cambio.
  filasPedidos.push(
    `  (${txt(id)}, 'sobre', NULL, 1, 'envio', ${txt(direccion)}, 'simulado', ${txt(tienda)}, 'despachado', ` +
      `${hace(diasSobre)}, ${hace(diasSobre - 1)})`,
  );
  if (tieneFiltro && hogar.diasCambio !== null && hogar.ultimoCartucho) {
    filasPedidos.push(
      `  (${txt(id)}, 'cartucho', ${txt(hogar.ultimoCartucho)}, 1, 'retiro', NULL, 'no_aplica', ${txt(tienda)}, 'despachado', ` +
        `${hace(hogar.diasCambio, 3)}, ${hace(hogar.diasCambio)})`,
    );
  }
});

// Los pendientes van al final, del más viejo al más nuevo, para que sus números de pedido sean los más altos.
for (const [n, tipo, codigo, cantidad, modalidad, horas] of [...PENDIENTES].sort((a, b) => b[5] - a[5])) {
  const hogar = HOGARES[n - 1];
  filasPedidos.push(
    `  (${txt(idHogar(n))}, ${txt(tipo)}, ${txt(codigo)}, ${cantidad}, ${txt(modalidad)}, ` +
      `${modalidad === 'envio' ? txt(direccionDe(n)) : 'NULL'}, ${txt(tipo === 'sobre' ? 'simulado' : 'no_aplica')}, ` +
      `${txt(hogar.tienda)}, 'pendiente', ${haceHoras(horas)}, NULL)`,
  );
}

// Pendientes del aliado de Lara (después de los de Grimuca).
for (const [n, tipo, codigo, cantidad, modalidad, horas] of [...PENDIENTES_LARA].sort((a, b) => b[5] - a[5])) {
  const hogar = TODOS_LOS_HOGARES[n - 1];
  filasPedidos.push(
    `  (${txt(idHogar(n))}, ${txt(tipo)}, ${txt(codigo)}, ${cantidad}, ${txt(modalidad)}, ` +
      `${modalidad === 'envio' ? txt(direccionDe(n)) : 'NULL'}, ${txt(tipo === 'sobre' ? 'simulado' : 'no_aplica')}, ` +
      `${txt(hogar.tienda)}, 'pendiente', ${haceHoras(horas)}, NULL)`,
  );
}

// Servicios técnicos de Grimuca: 3 pendientes y 1 atendido con su reporte (sin foto).
const filasServicios = SERVICIOS.map(([n, servicio, enDias, momento, nota, atendidoHace]) => {
  const hogar = TODOS_LOS_HOGARES[n - 1];
  const fechaPreferida = enDias >= 0 ? `(now() + interval '${enDias} days')::date` : `(${hace(-enDias)})::date`;
  const fecha = atendidoHace === null ? haceHoras(5 + n) : hace(atendidoHace + 3);
  return (
    `  (${txt(idHogar(n))}, 'servicio', NULL, 1, 'envio', ${txt(direccionDe(n))}, 'no_aplica', ${txt(hogar.tienda)}, ` +
    `${atendidoHace === null ? "'pendiente'" : "'despachado'"}, ${fecha}, ${atendidoHace === null ? 'NULL' : hace(atendidoHace)}, ` +
    `${txt(servicio)}, ${fechaPreferida}, ${txt(momento)}, ${txt(nota)})`
  );
});
const filasReportes = SERVICIOS.filter((s) => s[5] !== null).map(
  ([n, , , , , atendidoHace, notaTecnico]) =>
    `INSERT INTO reportes_servicio (pedido_id, fecha_visita, nota)\n` +
    `  SELECT id, ${hace(atendidoHace as number)}, ${txt(notaTecnico)} FROM pedidos\n` +
    `   WHERE hogar_id = ${txt(idHogar(n))} AND tipo = 'servicio' AND estado = 'despachado';`,
);

const filasStock = Object.entries(STOCK).flatMap(([tienda, existencias]) =>
  Object.entries(existencias).map(([codigo, cantidad]) => `  (${txt(tienda)}, ${txt(codigo)}, ${cantidad})`),
);

const filasBacterias = BACTERIAS.map(
  ([n, inicio, reporte, resultado]) =>
    `  (${txt(idBacterias(n))}, ${txt(idHogar(n))}, ${hace(inicio)}, ${reporte === null ? 'NULL' : hace(reporte)}, ${txt(resultado)})`,
);

// ---------- Comprobaciones antes de escribir ----------

if (HOGARES.length !== 60) throw new Error('La semilla debe tener 60 hogares de Grimuca.');
if (HOGARES_ALIADOS.filter((x) => x.tienda === LARA).length !== 6) throw new Error('El aliado de Lara lleva 6 hogares.');
if (HOGARES_ALIADOS.filter((x) => x.tienda === ARAGUA).length !== 4) throw new Error('El aliado de Aragua lleva 4 hogares.');
if (SERVICIOS.filter((x) => x[5] === null).length !== 3) throw new Error('Van 3 servicios técnicos pendientes.');
for (const hogar of HOGARES) {
  const u = buscarUrbanizacion(hogar.urbanizacion);
  if (!u || u.nombre !== hogar.urbanizacion || u.zona !== hogar.zona) {
    throw new Error(`Urbanización desconocida o de otra zona: ${hogar.urbanizacion} (${hogar.zona}).`);
  }
}
// El mapa debe contar la historia de arriba (mismo cálculo que GET /api/operador/mapa).
const mapa = calcularMapa(
  HOGARES.map((hogar, i) => ({ id: idHogar(i + 1), zona: hogar.zona, urbanizacion: hogar.urbanizacion })),
  ultimasParaMapa,
  new Map(),
  HOY,
);
const conClientes = mapa.filter((u) => u.en_tablero && u.hogares > 0);
const enAlerta = mapa.filter((u) => u.alerta).map((u) => u.nombre).sort((x, y) => x.localeCompare(y, 'es'));
const sinMedicion = mapa.filter((u) => u.estado === 'sin_medicion').map((u) => u.nombre);
if (conClientes.length < 28 || conClientes.length > 32) {
  throw new Error(`Hay ${conClientes.length} urbanizaciones con clientes (se esperan 28 a 32).`);
}
if (enAlerta.join('|') !== 'El Naranjal|La Begoña') throw new Error(`Urbanizaciones en alerta inesperadas: ${enAlerta.join(', ')}`);
if (sinMedicion.length < 3 || sinMedicion.length > 4) throw new Error(`Sin medición reciente: ${sinMedicion.join(', ')}`);
// Rutas de despacho (mismo cálculo que GET /api/operador/rutas). Los ids son de mentira: solo sirven para contar.
const paraRuta: PedidoParaRuta[] = [
  ...PENDIENTES.filter((p) => p[4] === 'envio').map(([n, tipo, codigo, cantidad]) => ({ n, tipo, codigo, cantidad })),
  ...SERVICIOS.filter((s) => s[5] === null).map(([n]) => ({ n, tipo: 'servicio' as const, codigo: null, cantidad: 1 })),
].map(({ n, tipo, codigo, cantidad }, i) => {
  const hogar = HOGARES[n - 1];
  return {
    id: i + 1,
    tipo,
    tienda_id: hogar.tienda,
    hogar_id: idHogar(n),
    hogar_nombre: hogar.nombre,
    zona: hogar.zona,
    urbanizacion: hogar.urbanizacion,
    detalle: detalleDePedido({ tipo, cantidad, cartucho_codigo: codigo }),
  };
});
const envioDe = (tiendas: string[]) => PENDIENTES.filter((p) => p[4] === 'envio' && tiendas.includes(HOGARES[p[0] - 1].tienda));
const urbanizacionesManongo = new Set(envioDe([MAN]).map((p) => HOGARES[p[0] - 1].urbanizacion));
if (envioDe([MAN]).length < 8 || urbanizacionesManongo.size < 5 || urbanizacionesManongo.size > 6) {
  throw new Error('Mañongo lleva 8 o más envíos pendientes en 5 o 6 urbanizaciones.');
}
if (envioDe([BIG, CEM]).length < 4) throw new Error('Las tiendas de San Diego llevan 4 o más envíos pendientes.');
const rutas = calcularRutas(TIENDAS.map(([id, nombre]) => ({ id, nombre })), paraRuta);
if (rutas.totales.distancia_ruta_km > rutas.totales.distancia_viajes_sueltos_km) {
  throw new Error('La ruta salió más larga que los viajes sueltos.');
}
const resumenRutas = rutas.rutas.map((r) => `${r.tienda_nombre}: ${r.entregas} entregas en ${r.paradas.length} paradas`).join('; ');

if (TODOS_LOS_HOGARES.some((hogar) => hogar.serie.length < 1 || hogar.serie.length > 4)) {
  throw new Error('Cada hogar lleva de 1 a 4 mediciones.');
}
if ((rojosRecientesPorZona.get(N) ?? 0) < 3) {
  throw new Error('Naguanagua debe tener 3 o más hogares en rojo en los últimos 7 días.');
}

const sql = `-- Datos de demostración de Grimuca Agua. TODO ES INVENTADO: nombres, teléfonos (0414-555-01xx) y direcciones
-- son de prueba y no corresponden a ninguna persona real.
-- Generado por db/generar_semilla.ts (no editar a mano; cambia el generador y vuelve a correrlo).
-- Requiere el catálogo cargado antes (db/semilla_cartuchos.sql): el stock y los pedidos usan sus códigos.
-- Lo aplica \`npm run migrar -w api -- --semilla\`, solo si la tabla hogares está vacía.
-- Las fechas son relativas a now(): la semilla siempre queda "reciente".
-- Contenido: 3 comercios (Grimuca y 2 aliados "de demostración"), 5 tiendas, ${TODOS_LOS_HOGARES.length} hogares
-- (${HOGARES.length} de Grimuca), ${totalMediciones} mediciones, ${filasPedidos.length + filasServicios.length} pedidos
-- (${PENDIENTES.length} pendientes de Grimuca, ${PENDIENTES_LARA.length} del aliado de Lara y ${filasServicios.length} servicios técnicos),
-- ${filasStock.length} filas de stock y ${filasBacterias.length} pruebas de bacterias.
-- Los PIN de cada comercio, del técnico y de la red van en el entorno del servidor, nunca aquí.

-- Tiendas (identificadores fijos; las migraciones ya las crean con su horario y dirección).
INSERT INTO tiendas (id, nombre, horario, direccion) VALUES
${TIENDAS.map((tienda) => `  (${tienda.map(txt).join(', ')})`).join(',\n')}
ON CONFLICT (id) DO NOTHING;
UPDATE tiendas SET comercio_id = 'grimuca' WHERE comercio_id IS NULL;

-- Grimuca es el comercio más antiguo de la red (la migración 008 lo crea con la fecha del día en que corre).
UPDATE comercios SET fecha_alta = ${hace(DIAS_ALTA_GRIMUCA)} WHERE id = 'grimuca';

-- Comercios aliados INVENTADOS (comercio de demostración). Grimuca ya lo crea la migración 008.
-- membresia_usd va nulo: el precio de la membresía todavía no está fijado.
INSERT INTO comercios (id, nombre, estado_pais, ciudad, plan, membresia_usd, fecha_alta, fin_periodo_gratis, activo, es_demostracion) VALUES
${COMERCIOS_ALIADOS.map(([id, nombre, estado, ciudad, plan, alta, fin]) => `  (${txt(id)}, ${txt(nombre)}, ${txt(estado)}, ${txt(ciudad)}, ${txt(plan)}, NULL, ${hace(alta)}, ${fin}, true, true)`).join(',\n')}
ON CONFLICT (id) DO NOTHING;

INSERT INTO tiendas (id, nombre, horario, direccion, comercio_id) VALUES
${TIENDAS_ALIADAS.map((tienda) => `  (${tienda.map(txt).join(', ')})`).join(',\n')}
ON CONFLICT (id) DO NOTHING;

-- Producto propio del aliado de Lara (cargado por el comercio; entra al catálogo y a los sugeridos).
INSERT INTO cartuchos (codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, vida_util_meses, categoria, recomendable, url_producto, disponible, comercio_id) VALUES
  (${txt(PRODUCTO_PROPIO_LARA.codigo)}, ${txt(PRODUCTO_PROPIO_LARA.nombre)}, ${txt(COMERCIOS_ALIADOS[0][1])}, NULL, ARRAY[${PRODUCTO_PROPIO_LARA.corrige.map((c) => txt(c)).join(', ')}], false, NULL, 6, ${txt(PRODUCTO_PROPIO_LARA.categoria)}, true, NULL, true, 'aliado-lara')
ON CONFLICT (codigo) DO NOTHING;

-- Hogares inventados: 20 en Naguanagua, 20 en San Diego y 20 en Valencia norte, repartidos entre las tres tiendas
-- y en ${conClientes.length} urbanizaciones (de ${URBANIZACIONES.length} de la lista; el resto queda "por captar").
-- Urbanizaciones en alerta: ${enAlerta.join(', ')}. Sin medición reciente: ${sinMedicion.join(', ')}.
INSERT INTO hogares (id, nombre, zona, origen_agua, personas, tiene_filtro, etapas_filtro, fecha_ultimo_cambio, agua_turbia, whatsapp, direccion, tienda_id, urbanizacion, mascotas, consentimiento_fecha) VALUES
${filasHogares.join(',\n')};

-- Mediciones. Naguanagua tiene ${rojosRecientesPorZona.get(N)} hogares en rojo en los últimos 7 días (dispara la alerta de zona).
INSERT INTO mediciones (id, hogar_id, fecha, origen, valores, semaforo, semaforo_por_parametro, evaluacion) VALUES
${filasMediciones.join(',\n')};

-- Existencias por tienda (con faltantes a propósito).
INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES
${filasStock.join(',\n')};

-- Pedidos: historial despachado y, al final, los ${PENDIENTES.length} pendientes (sobres y cartuchos).
INSERT INTO pedidos (hogar_id, tipo, cartucho_codigo, cantidad, modalidad, direccion, pago, tienda_id, estado, fecha, fecha_despacho) VALUES
${filasPedidos.join(',\n')};

-- Servicios técnicos de Grimuca ("Contrata a un experto"): 3 pendientes para el técnico y 1 atendido.
INSERT INTO pedidos (hogar_id, tipo, cartucho_codigo, cantidad, modalidad, direccion, pago, tienda_id, estado, fecha, fecha_despacho, servicio, fecha_preferida, momento, nota) VALUES
${filasServicios.join(',\n')};

-- Reporte del servicio atendido (sin foto).
${filasReportes.join('\n')}

-- Pruebas de bacterias.
INSERT INTO pruebas_bacterias (id, hogar_id, fecha_inicio, fecha_reporte, resultado) VALUES
${filasBacterias.join(',\n')};
`;

const destino = path.join(AQUI, 'semilla.sql');
writeFileSync(destino, sql);
console.log(
  `semilla.sql: ${HOGARES.length} hogares, ${totalMediciones} mediciones, ${filasPedidos.length} pedidos ` +
    `(${PENDIENTES.length} pendientes), ${filasStock.length} filas de stock. ` +
    `Rojos recientes por zona: ${JSON.stringify(Object.fromEntries(rojosRecientesPorZona))}. ` +
    `Urbanizaciones con clientes: ${conClientes.length}; en alerta: ${enAlerta.join(', ')}; sin medición: ${sinMedicion.join(', ')}.\n` +
    `Rutas: ${JSON.stringify(rutas.totales)} (${resumenRutas}).\n` +
    `Estados: ${conClientes.map((u) => `${u.nombre}=${u.estado}`).join(', ')}`,
);
