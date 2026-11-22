// Consultas y conversión de filas a los tipos del contrato. Lo usan todas las rutas.
import { aDia, aIso, aIsoONulo, aJson, aNumeroONulo, type Bd } from '../bd';
import { cartuchosParaFiltro, filaAFiltro } from '../filtro';
import { ULTIMOS_CAMBIOS, type FiltroHogar, type UltimoCambio } from '../tipos';
import { conMotivos, type HogarParaMotivo } from './motivos';
import type {
  Cartucho,
  Evaluacion,
  Hogar,
  Medicion,
  Pedido,
  PerfilHogar,
  PruebaBacterias,
  Tienda,
  ValoresMedicion,
} from '../tipos';

type Fila = Record<string, unknown>;
type Consultable = Pick<Bd, 'query'>;

/** Máximo de productos sugeridos por medición o por prueba de bacterias. */
export const MAXIMO_SUGERIDOS = 4;
/** Categoría de los equipos de desinfección: solo se sugieren desde la prueba de bacterias. */
export const CATEGORIA_DESINFECCION = 'lampara_uv';

// ---------- Conversión de filas ----------

export function filaATienda(fila: Fila): Tienda {
  return {
    id: String(fila.id),
    nombre: String(fila.nombre),
    horario: String(fila.horario),
    direccion: (fila.direccion as string | null) ?? null,
  };
}

/** Fila del catálogo: el cartucho público más lo que solo usa el servidor para sugerir. */
export interface CartuchoCatalogo extends Cartucho {
  recomendable: boolean;
}

const siFalta = (valor: unknown, porDefecto: boolean) =>
  valor === undefined || valor === null ? porDefecto : Boolean(valor);

export function filaACartucho(fila: Fila): CartuchoCatalogo {
  return {
    codigo: String(fila.codigo),
    nombre: String(fila.nombre),
    marca: String(fila.marca),
    precio_usd: aNumeroONulo(fila.precio_usd),
    corrige: Array.isArray(fila.corrige) ? fila.corrige.map(String) : [],
    es_ejemplo: Boolean(fila.es_ejemplo),
    foto_url: (fila.foto_url as string | null) ?? null,
    categoria: (fila.categoria as string | null) ?? null,
    url_producto: (fila.url_producto as string | null) ?? null,
    disponible: siFalta(fila.disponible, true),
    recomendable: siFalta(fila.recomendable, true),
  };
}

/** Quita los campos internos antes de responder. */
export function aCartuchoPublico(cartucho: CartuchoCatalogo): Cartucho {
  const { recomendable: _interno, ...publico } = cartucho;
  return publico;
}

function aUltimoCambio(valor: unknown): UltimoCambio | null {
  return typeof valor === 'string' && (ULTIMOS_CAMBIOS as readonly string[]).includes(valor)
    ? (valor as UltimoCambio)
    : null;
}

export function filaAHogar(fila: Fila): Hogar {
  return {
    id: String(fila.id),
    nombre: String(fila.nombre),
    zona: String(fila.zona),
    origen_agua: fila.origen_agua as Hogar['origen_agua'],
    personas: Number(fila.personas),
    tiene_filtro: Boolean(fila.tiene_filtro),
    etapas_filtro: aNumeroONulo(fila.etapas_filtro),
    fecha_ultimo_cambio: aDia(fila.fecha_ultimo_cambio),
    agua_turbia: Boolean(fila.agua_turbia),
    whatsapp: String(fila.whatsapp),
    direccion: (fila.direccion as string | null) ?? null,
    tienda_id: (fila.tienda_id as string | null) ?? null,
    urbanizacion: (fila.urbanizacion as string | null) ?? null,
    mascotas: Boolean(fila.mascotas),
    ultimo_cambio: aUltimoCambio(fila.ultimo_cambio),
    consentimiento_fecha: aIso(fila.consentimiento_fecha),
    filtro: filaAFiltro(fila),
  };
}

export function perfilDe(hogar: Hogar): PerfilHogar {
  return {
    origen_agua: hogar.origen_agua,
    tiene_filtro: hogar.tiene_filtro,
    etapas_filtro: hogar.etapas_filtro,
    fecha_ultimo_cambio: hogar.fecha_ultimo_cambio,
    agua_turbia: hogar.agua_turbia,
    personas: hogar.personas,
  };
}

/** `conDetalle`: agrega nombre del hogar y zona (solo para el operador y los eventos). */
export function filaAPedido(fila: Fila, conDetalle = false): Pedido {
  const pedido: Pedido = {
    id: Number(fila.id),
    hogar_id: String(fila.hogar_id),
    tipo: fila.tipo as Pedido['tipo'],
    cartucho_codigo: (fila.cartucho_codigo as string | null) ?? null,
    cantidad: Number(fila.cantidad),
    modalidad: fila.modalidad as Pedido['modalidad'],
    direccion: (fila.direccion as string | null) ?? null,
    pago: fila.pago as Pedido['pago'],
    tienda_id: String(fila.tienda_id),
    estado: fila.estado as Pedido['estado'],
    fecha: aIso(fila.fecha),
    fecha_despacho: aIsoONulo(fila.fecha_despacho),
    servicio: (fila.servicio as Pedido['servicio']) ?? null,
    fecha_preferida: aDia(fila.fecha_preferida),
    momento: (fila.momento as Pedido['momento']) ?? null,
    nota: (fila.nota as string | null) ?? null,
    cartucho_nombre: (fila.cartucho_nombre as string | null) ?? null,
  };
  if (conDetalle) {
    pedido.hogar_nombre = String(fila.hogar_nombre);
    pedido.zona = String(fila.zona);
  }
  return pedido;
}

export function filaABacterias(fila: Fila, sugeridos: Cartucho[] = []): PruebaBacterias {
  return {
    id: String(fila.id),
    hogar_id: String(fila.hogar_id),
    fecha_inicio: aIso(fila.fecha_inicio),
    fecha_reporte: aIsoONulo(fila.fecha_reporte),
    resultado: fila.resultado as PruebaBacterias['resultado'],
    sugeridos,
  };
}

// ---------- Consultas ----------

export async function listarTiendas(bd: Consultable): Promise<Tienda[]> {
  const { rows } = await bd.query('SELECT id, nombre, horario, direccion FROM tiendas ORDER BY nombre');
  return rows.map(filaATienda);
}

export async function existeTienda(bd: Consultable, id: string): Promise<boolean> {
  const { rows } = await bd.query('SELECT id FROM tiendas WHERE id = $1', [id]);
  return rows.length > 0;
}

const COLUMNAS_CARTUCHO =
  'codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, categoria, url_producto, disponible, recomendable';

export async function listarCatalogo(bd: Consultable): Promise<CartuchoCatalogo[]> {
  const { rows } = await bd.query(`SELECT ${COLUMNAS_CARTUCHO} FROM cartuchos ORDER BY codigo`);
  return rows.map(filaACartucho);
}

export async function buscarCartucho(bd: Consultable, codigo: string): Promise<CartuchoCatalogo | null> {
  const { rows } = await bd.query(`SELECT ${COLUMNAS_CARTUCHO} FROM cartuchos WHERE codigo = $1`, [codigo]);
  return rows[0] ? filaACartucho(rows[0]) : null;
}

export async function buscarHogar(bd: Consultable, id: string): Promise<Hogar | null> {
  const { rows } = await bd.query('SELECT * FROM hogares WHERE id = $1', [id]);
  return rows[0] ? filaAHogar(rows[0]) : null;
}

const SELECT_PEDIDO = `
  SELECT p.id, p.hogar_id, p.tipo, p.cartucho_codigo, p.cantidad, p.modalidad, p.direccion, p.pago,
         p.tienda_id, p.estado, p.fecha, p.fecha_despacho, p.servicio, p.fecha_preferida, p.momento, p.nota,
         h.nombre AS hogar_nombre, h.zona AS zona, c.nombre AS cartucho_nombre
    FROM pedidos p
    JOIN hogares h ON h.id = p.hogar_id
    LEFT JOIN cartuchos c ON c.codigo = p.cartucho_codigo`;

export async function buscarPedido(bd: Consultable, id: number, conDetalle = false): Promise<Pedido | null> {
  const { rows } = await bd.query(`${SELECT_PEDIDO} WHERE p.id = $1`, [id]);
  return rows[0] ? filaAPedido(rows[0], conDetalle) : null;
}

export async function pedidosDeHogar(bd: Consultable, hogarId: string): Promise<Pedido[]> {
  const { rows } = await bd.query(`${SELECT_PEDIDO} WHERE p.hogar_id = $1 ORDER BY p.fecha DESC, p.id DESC`, [
    hogarId,
  ]);
  return rows.map((fila) => filaAPedido(fila));
}

export async function pedidosDelOperador(
  bd: Consultable,
  estado: 'pendiente' | 'despachado' | 'todos',
): Promise<Pedido[]> {
  const { rows } =
    estado === 'todos'
      ? await bd.query(`${SELECT_PEDIDO} ORDER BY p.fecha DESC, p.id DESC`)
      : await bd.query(`${SELECT_PEDIDO} WHERE p.estado = $1 ORDER BY p.fecha DESC, p.id DESC`, [estado]);
  return rows.map((fila) => filaAPedido(fila, true));
}

// ---------- Sugeridos ----------

export interface CriterioSugeridos {
  /** Claves que pide corregir la evaluación. */
  corrige: string[];
  tieneFiltro: boolean;
  /** Marcas que no se sugieren (opcional; normalmente vacío). */
  marcasExcluidas?: string[];
}

/**
 * Productos para una medición de la tira: recomendables, disponibles y que corrigen algo de lo hallado.
 * Orden: (a) con filtro en casa, primero los cartuchos de recambio; sin filtro, primero filtros y ósmosis;
 * (b) los que corrigen más hallazgos; (c) código. Máximo 4.
 * Los equipos de desinfección no salen aquí: van con la prueba de bacterias.
 */
export function sugerirCartuchos(catalogo: CartuchoCatalogo[], criterio: CriterioSugeridos): Cartucho[] {
  const candidatos = ordenarCandidatos(catalogo, criterio);
  const elegidos = candidatos.slice(0, MAXIMO_SUGERIDOS);
  // Si algún hallazgo queda sin producto que lo atienda, entra el que más hallazgos pendientes cubra y sale el último
  // de la lista. Así un nitrato en rojo trae un equipo que lo trate aunque el hogar ya tenga filtro.
  const cubre = (clave: string) => elegidos.some((par) => par.cartucho.corrige.includes(clave));
  let cupo = elegidos.length - 1;
  while (cupo >= 1) {
    const pendientes = criterio.corrige.filter((clave) => !cubre(clave));
    if (pendientes.length === 0) break;
    const aporte = (par: (typeof candidatos)[number]) =>
      par.cartucho.corrige.filter((clave) => pendientes.includes(clave)).length;
    const mejor = candidatos
      .filter((par) => !elegidos.includes(par))
      .reduce<(typeof candidatos)[number] | null>((m, par) => (aporte(par) > (m ? aporte(m) : 0) ? par : m), null);
    if (!mejor) break;
    elegidos[cupo] = mejor;
    cupo -= 1;
  }
  return elegidos.map((par) => aCartuchoPublico(par.cartucho));
}

function ordenarCandidatos(catalogo: CartuchoCatalogo[], criterio: CriterioSugeridos) {
  const pedidas = new Set(criterio.corrige);
  const excluidas = new Set((criterio.marcasExcluidas ?? []).map((marca) => marca.trim().toLowerCase()));
  const preferidas = criterio.tieneFiltro ? ['cartucho'] : ['filtro', 'sistema_osmosis_inversa'];
  return catalogo
    .filter(
      (cartucho) =>
        cartucho.recomendable &&
        cartucho.disponible &&
        cartucho.categoria !== CATEGORIA_DESINFECCION &&
        !excluidas.has(cartucho.marca.trim().toLowerCase()),
    )
    .map((cartucho) => ({
      cartucho,
      aciertos: cartucho.corrige.filter((clave) => pedidas.has(clave)).length,
      preferido: cartucho.categoria !== null && preferidas.includes(cartucho.categoria) ? 0 : 1,
    }))
    .filter((par) => par.aciertos > 0)
    .sort(
      (a, b) =>
        a.preferido - b.preferido ||
        b.aciertos - a.aciertos ||
        (a.cartucho.codigo < b.cartucho.codigo ? -1 : a.cartucho.codigo > b.cartucho.codigo ? 1 : 0),
    );
}

/** Equipos de desinfección: solo cuando la prueba de bacterias se reportó con cambio de color. */
export function sugerirDesinfeccion(catalogo: CartuchoCatalogo[]): Cartucho[] {
  return catalogo
    .filter(
      (cartucho) =>
        cartucho.categoria === CATEGORIA_DESINFECCION &&
        cartucho.recomendable &&
        cartucho.disponible &&
        cartucho.corrige.includes('bacterias'),
    )
    .slice(0, MAXIMO_SUGERIDOS)
    .map(aCartuchoPublico);
}

// ---------- Mediciones ----------

export interface ParaArmarMedicion {
  catalogo: CartuchoCatalogo[];
  /** Perfil actual del hogar: decide el orden de los sugeridos y los días para el recambio. */
  perfil: PerfilHogar;
  marcasExcluidas?: string[];
  /** Recalcula los días para el recambio con el perfil de hoy; si falla se deja el valor guardado. */
  diasParaRecambio?: (perfil: PerfilHogar) => number | null;
  /** Filtro registrado del hogar: los cartuchos compatibles que atienden lo hallado van primero. */
  filtro?: FiltroHogar | null;
  /** Datos del hogar para la frase de "Por qué te lo recomendamos" (mascotas, último cambio…). */
  hogar?: Partial<HogarParaMotivo> | null;
}

export function filaAMedicion(fila: Fila, extra: ParaArmarMedicion): Medicion {
  const guardada = aJson<Partial<Evaluacion> | null>(fila.evaluacion) ?? {};
  const evaluacion: Evaluacion = {
    semaforo: guardada.semaforo ?? (fila.semaforo as Evaluacion['semaforo']),
    porParametro: guardada.porParametro ?? [],
    hallazgos: guardada.hallazgos ?? [],
    corrige: guardada.corrige ?? [],
    diasParaRecambio: guardada.diasParaRecambio ?? null,
  };
  if (extra.diasParaRecambio) {
    try {
      evaluacion.diasParaRecambio = extra.diasParaRecambio(extra.perfil);
    } catch {
      // se conserva el valor guardado
    }
  }
  const filtro = extra.perfil.tiene_filtro ? (extra.filtro ?? null) : null;
  const sugeridos = sugerirConFiltro(
    extra.catalogo,
    {
      corrige: evaluacion.corrige,
      tieneFiltro: extra.perfil.tiene_filtro,
      marcasExcluidas: extra.marcasExcluidas,
    },
    filtro,
  );
  const compatibles = filtro
    ? new Set(cartuchosParaFiltro(filtro, extra.catalogo, evaluacion.corrige).map((c) => c.codigo))
    : undefined;
  return {
    id: String(fila.id),
    hogar_id: String(fila.hogar_id),
    fecha: aIso(fila.fecha),
    origen: fila.origen as Medicion['origen'],
    valores: aJson<ValoresMedicion | null>(fila.valores) ?? {},
    evaluacion,
    sugeridos: conMotivos(sugeridos, {
      porParametro: evaluacion.porParametro,
      corrige: evaluacion.corrige,
      diasParaRecambio: evaluacion.diasParaRecambio,
      hogar: { ...extra.perfil, ...extra.hogar, filtro },
      compatibles,
    }),
  };
}

/**
 * Sugeridos adaptados al filtro del hogar: primero los cartuchos compatibles con ese filtro que atienden lo hallado;
 * después, los de `sugerirCartuchos` que hagan falta para que cada hallazgo siga cubierto por algún producto.
 * Sin filtro registrado (o sin compatibles que atiendan algo) devuelve lo mismo que `sugerirCartuchos`.
 */
export function sugerirConFiltro(
  catalogo: CartuchoCatalogo[],
  criterio: CriterioSugeridos,
  filtro: FiltroHogar | null | undefined,
): Cartucho[] {
  const base = sugerirCartuchos(catalogo, criterio);
  if (!filtro) return base;
  const excluidas = new Set((criterio.marcasExcluidas ?? []).map((marca) => marca.trim().toLowerCase()));
  const preferidos: Cartucho[] = cartuchosParaFiltro(filtro, catalogo, criterio.corrige)
    .filter((c) => c.atiende_medicion && !excluidas.has(c.marca.trim().toLowerCase()))
    .map(({ funcion: _f, para_que: _p, atiende_medicion: _a, ...cartucho }) => cartucho);
  if (preferidos.length === 0) return base;

  const cubiertas = (lista: Cartucho[]) => new Set(lista.flatMap((c) => c.corrige));
  // Cuántos compatibles caben sin dejar sin cubrir algo que `base` sí cubría.
  for (let cuantos = Math.min(preferidos.length, MAXIMO_SUGERIDOS); cuantos >= 0; cuantos -= 1) {
    const elegidos = preferidos.slice(0, cuantos);
    for (const cartucho of base) {
      const ya = cubiertas(elegidos);
      const aporta = cartucho.corrige.some((clave) => criterio.corrige.includes(clave) && !ya.has(clave));
      if (aporta && !elegidos.some((e) => e.codigo === cartucho.codigo)) elegidos.push(cartucho);
    }
    if (elegidos.length > MAXIMO_SUGERIDOS) continue;
    for (const cartucho of base) {
      if (elegidos.length >= MAXIMO_SUGERIDOS) break;
      if (!elegidos.some((e) => e.codigo === cartucho.codigo)) elegidos.push(cartucho);
    }
    return elegidos;
  }
  return base;
}
