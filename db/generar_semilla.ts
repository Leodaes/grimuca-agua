// Genera db/semilla.sql: datos de demostración INVENTADOS (ninguna persona, teléfono ni dirección real).
// Las evaluaciones se calculan con el mismo módulo que usa la API, para que la semilla tenga la forma real.
// Uso (desde la raíz del repositorio): npx tsx db/generar_semilla.ts
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluarAgua } from '../api/src/medicion/index';
import { tiendaSugerida, type Nivel, type OrigenAgua, type PerfilHogar, type ValoresMedicion } from '../api/src/tipos';

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
  origen: OrigenAgua;
  personas: number;
  /** 0 = sin filtro */
  etapas: number;
  /** Días desde el último cambio de cartucho (null = no tiene filtro o no se acuerda). */
  diasCambio: number | null;
  turbia: boolean;
  serie: Paso[];
}

const h = (
  nombre: string, zona: string, origen: OrigenAgua, personas: number, etapas: number,
  diasCambio: number | null, turbia: boolean, serie: Paso[],
): HogarSemilla => ({ nombre, zona, origen, personas, etapas, diasCambio, turbia, serie });

const N = 'Naguanagua';
const S = 'San Diego';
const V = 'Valencia norte';

// Naguanagua concentra varios hogares en rojo (nitrato, nitrito, plomo) en la última semana:
// es la zona que debe disparar la alerta del panel del operador.
const HOGARES: HogarSemilla[] = [
  h('Ana P.', N, 'pozo', 4, 0, null, true, [[34, 'nitrato_medio', 'manual'], [3, 'nitrato_rojo', 'foto']]),
  h('Luis M.', N, 'tanque', 5, 2, 176, false, [[60, 'bien', 'foto'], [28, 'nitrato_medio', 'foto'], [2, 'nitrato_rojo', 'foto']]),
  h('Carmen R.', N, 'chorro', 3, 0, null, false, [[5, 'plomo_rojo', 'foto']]),
  h('José G.', N, 'pozo', 6, 3, 190, true, [[45, 'nitrito_medio', 'manual'], [4, 'nitrito_rojo', 'foto']]),
  h('María T.', N, 'chorro', 2, 3, 40, false, [[70, 'cloro_alto', 'foto'], [10, 'bien', 'foto']]),
  h('Pedro L.', N, 'botellon', 4, 0, null, false, [[15, 'bien_2', 'foto']]),
  h('Rosa D.', N, 'tanque', 3, 0, null, true, [[50, 'dura', 'manual'], [20, 'dura', 'foto'], [6, 'nitrato_rojo', 'foto']]),
  h('Carlos V.', N, 'filtro', 4, 5, 160, false, [[80, 'bien', 'foto'], [40, 'bien_2', 'foto'], [9, 'faltan_casillas', 'foto']]),
  h('Elena S.', N, 'chorro', 1, 0, null, false, [[22, 'cloro_alto', 'manual']]),
  h('Miguel A.', N, 'chorro', 5, 2, 95, false, [[30, 'plomo_medio', 'foto'], [8, 'bien', 'foto']]),

  h('Laura B.', S, 'chorro', 4, 3, 178, false, [[65, 'dura', 'foto'], [12, 'muy_dura', 'foto']]),
  h('Jorge C.', S, 'pozo', 5, 0, null, true, [[40, 'muy_dura', 'manual'], [3, 'muy_dura', 'foto']]),
  h('Daniela F.', S, 'tanque', 3, 0, null, false, [[6, 'cobre_rojo', 'foto']]),
  h('Andrés H.', S, 'botellon', 2, 0, null, false, [[18, 'bien', 'foto']]),
  h('Patricia N.', S, 'filtro', 4, 5, 200, false, [[90, 'bien', 'foto'], [55, 'bien_2', 'foto'], [25, 'dura', 'foto'], [4, 'dura', 'foto']]),
  h('Rafael O.', S, 'chorro', 6, 2, 152, false, [[33, 'cloro_alto', 'foto'], [7, 'bien', 'foto']]),
  h('Gabriela Q.', S, 'chorro', 3, 0, null, false, [[11, 'acida', 'manual']]),
  h('Héctor Z.', S, 'tanque', 4, 3, 20, false, [[48, 'nitrato_medio', 'foto'], [16, 'bien_2', 'foto']]),
  h('Mariana E.', S, 'botellon', 2, 0, null, false, [[27, 'faltan_casillas', 'manual']]),
  h('Ricardo J.', S, 'pozo', 7, 4, 120, true, [[75, 'nitrato_medio', 'foto'], [35, 'nitrato_medio', 'foto'], [5, 'nitrato_medio', 'foto']]),

  h('Sofía K.', V, 'chorro', 3, 3, 60, false, [[21, 'plomo_rojo', 'foto'], [2, 'bien', 'foto']]),
  h('Alberto U.', V, 'chorro', 4, 0, null, false, [[14, 'cloro_alto', 'foto']]),
  h('Valentina I.', V, 'botellon', 1, 0, null, false, [[9, 'bien', 'manual']]),
  h('Fernando Y.', V, 'filtro', 5, 5, 174, false, [[85, 'bien', 'foto'], [44, 'bien_2', 'foto'], [13, 'bien', 'foto']]),
  h('Isabel W.', V, 'tanque', 4, 0, null, true, [[30, 'dura', 'foto'], [6, 'dura', 'foto']]),
  h('Tomás X.', V, 'chorro', 2, 2, 10, false, [[19, 'bien_2', 'foto']]),
  h('Adriana P.', V, 'chorro', 3, 0, null, false, [[26, 'alcalina', 'manual'], [4, 'bien', 'foto']]),
  h('Manuel R.', V, 'pozo', 6, 3, 165, false, [[58, 'nitrato_medio', 'foto'], [17, 'bien', 'foto']]),
  h('Beatriz G.', V, 'botellon', 2, 0, null, false, [[8, 'bien', 'foto']]),
  h('Óscar M.', V, 'chorro', 4, 1, 130, false, [[36, 'cloro_alto', 'foto'], [1, 'cloro_alto', 'foto']]),
];

// Códigos reales del catálogo (db/semilla_cartuchos.sql).
const CARTUCHOS_DE_RECAMBIO = ['OPW-PP20A022', 'OPW-CTOSU5', 'OPW-GACSU5', 'OPW-PP20BFL02', 'OPW-RSSU5'];

/** Pedidos pendientes: [n.º de hogar, tipo, código, cantidad, modalidad, hace cuántas horas] */
const PENDIENTES: Array<[number, 'sobre' | 'cartucho', string | null, number, 'retiro' | 'envio', number]> = [
  [6, 'sobre', null, 1, 'envio', 2],
  [1, 'cartucho', 'OPW-PP20A022', 2, 'retiro', 3],
  [14, 'sobre', null, 1, 'envio', 5],
  [12, 'cartucho', 'OPW-RSSU5', 1, 'retiro', 8],
  [3, 'cartucho', 'OPW-100GPD-8TN', 1, 'envio', 20],
  [23, 'sobre', null, 1, 'retiro', 26],
  [22, 'cartucho', 'OPW-CTOSU5', 1, 'envio', 30],
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
};

/** Pruebas de bacterias: [n.º de hogar, iniciada hace cuántos días, reportada hace cuántos días o null, resultado] */
const BACTERIAS: Array<[number, number, number | null, 'pendiente' | 'cambio' | 'sin_cambio']> = [
  [1, 1, null, 'pendiente'],
  [2, 5, 3, 'cambio'],
  [13, 6, 4, 'sin_cambio'],
  [21, 2, null, 'pendiente'],
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

HOGARES.forEach((hogar, indice) => {
  const n = indice + 1;
  const id = idHogar(n);
  const tieneFiltro = hogar.etapas > 0;
  const tienda = tiendaSugerida(hogar.zona);
  const direccion = direccionDe(n);
  const masVieja = Math.max(...hogar.serie.map((paso) => paso[0]));
  const diasSobre = masVieja + 4; // el sobre se pidió unos días antes de la primera medición

  filasHogares.push(
    `  (${txt(id)}, ${txt(hogar.nombre)}, ${txt(hogar.zona)}, ${txt(hogar.origen)}, ${hogar.personas}, ${tieneFiltro}, ` +
      `${tieneFiltro ? hogar.etapas : 'NULL'}, ${hogar.diasCambio === null ? 'NULL' : `(${hace(hogar.diasCambio)})::date`}, ` +
      `${hogar.turbia}, ${txt(`0414-555-01${dos(n)}`)}, ${txt(direccion)}, ${txt(tienda)}, ${hace(diasSobre, 1)})`,
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
    }
  });
  if (ultimoNivel === 'rojo' && ultimoDias < 7) {
    rojosRecientesPorZona.set(hogar.zona, (rojosRecientesPorZona.get(hogar.zona) ?? 0) + 1);
  }

  // Historial: el sobre que recibió y, si tiene filtro, el cartucho de su último cambio.
  filasPedidos.push(
    `  (${txt(id)}, 'sobre', NULL, 1, 'envio', ${txt(direccion)}, 'simulado', ${txt(tienda)}, 'despachado', ` +
      `${hace(diasSobre)}, ${hace(diasSobre - 1)})`,
  );
  if (tieneFiltro && hogar.diasCambio !== null) {
    const codigo = CARTUCHOS_DE_RECAMBIO[indice % CARTUCHOS_DE_RECAMBIO.length];
    filasPedidos.push(
      `  (${txt(id)}, 'cartucho', ${txt(codigo)}, 1, 'retiro', NULL, 'no_aplica', ${txt(tienda)}, 'despachado', ` +
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
      `${txt(tiendaSugerida(hogar.zona))}, 'pendiente', ${haceHoras(horas)}, NULL)`,
  );
}

const filasStock = Object.entries(STOCK).flatMap(([tienda, existencias]) =>
  Object.entries(existencias).map(([codigo, cantidad]) => `  (${txt(tienda)}, ${txt(codigo)}, ${cantidad})`),
);

const filasBacterias = BACTERIAS.map(
  ([n, inicio, reporte, resultado]) =>
    `  (${txt(idBacterias(n))}, ${txt(idHogar(n))}, ${hace(inicio)}, ${reporte === null ? 'NULL' : hace(reporte)}, ${txt(resultado)})`,
);

// ---------- Comprobaciones antes de escribir ----------

if (HOGARES.length !== 30) throw new Error('La semilla debe tener 30 hogares.');
if (HOGARES.some((hogar) => hogar.serie.length < 1 || hogar.serie.length > 4)) {
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
-- Contenido: 3 tiendas, ${HOGARES.length} hogares, ${totalMediciones} mediciones, ${filasPedidos.length} pedidos (${PENDIENTES.length} pendientes),
-- ${filasStock.length} filas de stock y ${filasBacterias.length} pruebas de bacterias.

-- Tiendas (identificadores fijos; la migración inicial ya las crea).
INSERT INTO tiendas (id, nombre, horario, direccion) VALUES
  ('manongo', 'Mañongo', 'Por confirmar', NULL),
  ('biglow', 'Big Low', 'Por confirmar', NULL),
  ('cem', 'CC CEM', 'Por confirmar', NULL)
ON CONFLICT (id) DO NOTHING;

-- Hogares inventados: 10 en Naguanagua, 10 en San Diego y 10 en Valencia norte.
INSERT INTO hogares (id, nombre, zona, origen_agua, personas, tiene_filtro, etapas_filtro, fecha_ultimo_cambio, agua_turbia, whatsapp, direccion, tienda_id, consentimiento_fecha) VALUES
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

-- Pruebas de bacterias.
INSERT INTO pruebas_bacterias (id, hogar_id, fecha_inicio, fecha_reporte, resultado) VALUES
${filasBacterias.join(',\n')};
`;

const destino = path.join(AQUI, 'semilla.sql');
writeFileSync(destino, sql);
console.log(
  `semilla.sql: ${HOGARES.length} hogares, ${totalMediciones} mediciones, ${filasPedidos.length} pedidos ` +
    `(${PENDIENTES.length} pendientes), ${filasStock.length} filas de stock. ` +
    `Rojos recientes por zona: ${JSON.stringify(Object.fromEntries(rojosRecientesPorZona))}`,
);
