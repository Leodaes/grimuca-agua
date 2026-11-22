// Centros de llenado con resultados públicos (docs/negocio/idea-centros-de-llenado.md).
//
// Decisión de Leonardo (22 nov): los resultados de cada centro se publican siempre, también los que salen fuera de
// rango. Grimuca no dice si el agua es buena o mala: publica el valor de cada casilla junto al rango de referencia,
// la fecha, quién midió y el resultado del frasco. La "ponderación" es un conteo de casillas en rango.
//
// - Cualquiera (sin sesión): GET /centros?hogar_id= (el más cercano primero) y GET /centros/:tienda_id (con su historial).
// - Técnico de Grimuca: GET /tecnico/centros, POST /tecnico/centros/:tienda_id/mediciones y el frasco a las 48 horas.
// - Comercio que es centro de llenado: GET /operador/centro.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aIso, aIsoONulo, aJson, type Bd } from '../bd';
import { distanciaKm } from '../logistica/rutas-despacho';
import { buscarUrbanizacion, type Coordenada, type Urbanizacion } from '../logistica/urbanizaciones';
import { umbrales } from '../medicion/config/umbrales';
import {
  CLAVES_PARAMETRO,
  DIAS_VIGENCIA_MEDICION_CENTRO,
  type CasillaCentro,
  type CentroCercano,
  type CentroPublico,
  type ClaveParametro,
  type DetalleCentro,
  type Evaluacion,
  type MedicionCentro,
  type PanelCentro,
  type ResultadoBacteriasCentro,
  type ValoresMedicion,
} from '../tipos';
import { buscarHogar } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { esquemaUuid, esquemaValores } from './esquemas';
import { buscarComercio, COMERCIO_PRINCIPAL } from './plataforma';
import { comercioDe, exigirRol } from './operador';

type Fila = Record<string, unknown>;
type Consultable = Pick<Bd, 'query'>;
type Evaluador = (valores: ValoresMedicion) => Evaluacion;

const LARGO_MAXIMO_NOTA = 300;
const DIA_MS = 86_400_000;

// ---------- Referencia y casillas ----------

/** Rango "en rango" (verde) de la referencia de umbrales.ts; null en el extremo sin límite. */
export function rangoDeReferencia(clave: ClaveParametro): { desde: number | null; hasta: number | null } {
  const tramos = umbrales[clave]?.tramos ?? [];
  const inicio = tramos.findIndex((tramo) => tramo.nivel === 'verde');
  if (inicio < 0) return { desde: null, hasta: null };
  let fin = inicio;
  while (fin + 1 < tramos.length && tramos[fin + 1].nivel === 'verde') fin += 1;
  return {
    desde: inicio > 0 ? (tramos[inicio - 1].hasta ?? null) : null,
    hasta: tramos[fin].hasta ?? null,
  };
}

/** Las casillas tal como se publican: valor, unidad, nivel frente a la referencia y el rango. Sin frases para el hogar. */
export function casillasDe(evaluacion: Evaluacion): CasillaCentro[] {
  return (evaluacion.porParametro ?? []).map((resultado) => {
    const rango = rangoDeReferencia(resultado.clave);
    return {
      clave: resultado.clave,
      nombre: resultado.nombre,
      unidad: resultado.unidad,
      valor: typeof resultado.valor === 'number' ? resultado.valor : null,
      nivel: resultado.nivel,
      referencia_desde: rango.desde,
      referencia_hasta: rango.hasta,
      orientativo: Boolean(resultado.orientativo),
    };
  });
}

/** Solo las claves conocidas con número válido o null. */
function limpiarValores(valores: ValoresMedicion): ValoresMedicion {
  const limpio: ValoresMedicion = {};
  for (const clave of CLAVES_PARAMETRO) {
    const valor = valores[clave];
    if (valor === undefined) continue;
    limpio[clave] = typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  }
  return limpio;
}

function aBacterias(valor: unknown): ResultadoBacteriasCentro {
  return valor === 'cambio' || valor === 'sin_cambio' ? valor : 'pendiente';
}

export function filaAMedicionCentro(fila: Fila, evaluar: Evaluador): MedicionCentro {
  const valores = limpiarValores(aJson<ValoresMedicion>(fila.valores) ?? {});
  const casillas = casillasDe(evaluar(valores));
  const leidas = casillas.filter((casilla) => casilla.valor !== null);
  return {
    id: Number(fila.id),
    tienda_id: String(fila.tienda_id),
    fecha: aIso(fila.fecha),
    casillas,
    casillas_en_rango: leidas.filter((casilla) => casilla.nivel === 'verde').length,
    casillas_leidas: leidas.length,
    bacterias: aBacterias(fila.bacterias),
    fecha_bacterias: aIsoONulo(fila.fecha_bacterias),
    nota: typeof fila.nota === 'string' && fila.nota ? fila.nota : null,
    medido_por: typeof fila.medido_por === 'string' && fila.medido_por ? fila.medido_por : 'Técnico de Grimuca',
  };
}

// ---------- Consultas ----------

/** Ubicación del centro: centro aproximado de su urbanización (si está en la lista). */
function ubicacionDe(urbanizacion: Urbanizacion | undefined): Coordenada | null {
  return urbanizacion ? { lat: urbanizacion.lat, lng: urbanizacion.lng } : null;
}

export function estaVencida(ultima: MedicionCentro | null, ahora: Date = new Date()): boolean {
  if (!ultima) return true;
  return ahora.getTime() - new Date(ultima.fecha).getTime() > DIAS_VIGENCIA_MEDICION_CENTRO * DIA_MS;
}

/** Centros de llenado activos (una entrada por local) con todo su historial, el más reciente primero. */
export async function leerCentros(
  bd: Consultable,
  evaluar: Evaluador,
  opciones: { comercioId?: string; tiendaId?: string } = {},
  ahora: Date = new Date(),
): Promise<DetalleCentro[]> {
  const filtros = ["c.tipo = 'centro_llenado'", 'c.activo = true'];
  const valores: unknown[] = [];
  if (opciones.comercioId) {
    valores.push(opciones.comercioId);
    filtros.push(`c.id = $${valores.length}`);
  }
  if (opciones.tiendaId) {
    valores.push(opciones.tiendaId);
    filtros.push(`t.id = $${valores.length}`);
  }
  const { rows } = await bd.query(
    `SELECT t.id AS tienda_id, t.nombre AS local, t.direccion, t.horario, t.urbanizacion,
            c.id AS comercio_id, c.nombre, c.es_demostracion
       FROM tiendas t JOIN comercios c ON c.id = t.comercio_id
      WHERE ${filtros.join(' AND ')}
      ORDER BY c.nombre, t.nombre`,
    valores,
  );
  if (rows.length === 0) return [];

  const ids = new Set(rows.map((fila) => String(fila.tienda_id)));
  const mediciones = await bd.query('SELECT * FROM mediciones_centro ORDER BY fecha DESC, id DESC');
  const porTienda = new Map<string, MedicionCentro[]>();
  for (const fila of mediciones.rows) {
    const tienda = String(fila.tienda_id);
    if (!ids.has(tienda)) continue;
    const lista = porTienda.get(tienda) ?? [];
    lista.push(filaAMedicionCentro(fila, evaluar));
    porTienda.set(tienda, lista);
  }

  return rows.map((fila) => {
    const urbanizacion = buscarUrbanizacion(fila.urbanizacion as string | null);
    const ubicacion = ubicacionDe(urbanizacion);
    const historial = porTienda.get(String(fila.tienda_id)) ?? [];
    const ultima = historial[0] ?? null;
    return {
      tienda_id: String(fila.tienda_id),
      comercio_id: String(fila.comercio_id),
      nombre: String(fila.nombre),
      local: String(fila.local),
      direccion: (fila.direccion as string | null) ?? null,
      horario: String(fila.horario),
      zona: urbanizacion?.zona ?? null,
      urbanizacion: urbanizacion?.nombre ?? ((fila.urbanizacion as string | null) || null),
      lat: ubicacion?.lat ?? null,
      lng: ubicacion?.lng ?? null,
      es_demostracion: Boolean(fila.es_demostracion),
      ultima,
      vencida: estaVencida(ultima, ahora),
      historial,
    };
  });
}

const sinHistorial = ({ historial: _historial, ...centro }: DetalleCentro): CentroPublico => centro;

/** Punto de partida del cliente: su urbanización de la lista, si es de su misma zona (como en el mapa). */
export function origenDelCliente(zona: string | null, urbanizacion: string | null): Coordenada | null {
  const encontrada = buscarUrbanizacion(urbanizacion);
  if (!encontrada) return null;
  if (zona && encontrada.zona !== zona) return null;
  return { lat: encontrada.lat, lng: encontrada.lng };
}

/**
 * Ordena los centros para un cliente: con su urbanización, por distancia aproximada por calle; sin ella, primero
 * los de su zona (sin distancia). Los centros sin ubicación van al final.
 */
export function ordenarPorCercania(
  centros: CentroPublico[],
  cliente: { zona: string | null; urbanizacion: string | null },
): CentroCercano[] {
  const origen = origenDelCliente(cliente.zona, cliente.urbanizacion);
  const conDistancia = centros.map((centro, indice) => {
    const distancia =
      origen && centro.lat !== null && centro.lng !== null
        ? Math.round(distanciaKm(origen, { lat: centro.lat, lng: centro.lng }) * 10) / 10
        : null;
    return { centro: { ...centro, distancia_km: distancia }, indice };
  });
  const rango = (c: CentroCercano) => {
    if (c.distancia_km !== null) return 0;
    if (cliente.zona && c.zona === cliente.zona) return 1;
    return c.lat !== null ? 2 : 3;
  };
  return conDistancia
    .sort(
      (a, b) =>
        rango(a.centro) - rango(b.centro) ||
        (a.centro.distancia_km ?? 0) - (b.centro.distancia_km ?? 0) ||
        a.indice - b.indice,
    )
    .map(({ centro }) => centro);
}

/** Cuántos clientes (hogares y negocios con urbanización conocida) tienen a cada local como el centro más cercano. */
export async function clientesCercanosPorCentro(
  bd: Consultable,
  centros: CentroPublico[],
): Promise<Map<string, number>> {
  const conteo = new Map<string, number>(centros.map((c) => [c.tienda_id, 0]));
  const ubicados = centros.filter((c) => c.lat !== null && c.lng !== null);
  if (ubicados.length === 0) return conteo;
  const { rows } = await bd.query('SELECT zona, urbanizacion FROM hogares WHERE urbanizacion IS NOT NULL');
  for (const fila of rows) {
    const origen = origenDelCliente(String(fila.zona), fila.urbanizacion as string | null);
    if (!origen) continue;
    let mejor: { id: string; km: number } | null = null;
    for (const centro of ubicados) {
      const km = distanciaKm(origen, { lat: centro.lat as number, lng: centro.lng as number });
      if (!mejor || km < mejor.km) mejor = { id: centro.tienda_id, km };
    }
    if (mejor) conteo.set(mejor.id, (conteo.get(mejor.id) ?? 0) + 1);
  }
  return conteo;
}

// ---------- Rutas ----------

const esquemaConsultaCentros = z.object({
  hogar_id: esquemaUuid.optional(),
  zona: z.string().trim().max(40).optional(),
  urbanizacion: z.string().trim().max(80).optional(),
});
const esquemaTiendaId = z.object({ tienda_id: z.string().trim().min(1).max(40) });
const esquemaIdMedicion = z.object({ id: z.coerce.number().int().positive().max(2_147_483_647) });
const esquemaMedicionCentro = z.object({
  valores: esquemaValores,
  nota: z.union([z.string(), z.null()]).optional(),
});
const esquemaFrasco = z.object({ resultado: z.enum(['cambio', 'sin_cambio']) });

function limpiarNota(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpia = valor.trim().slice(0, LARGO_MAXIMO_NOTA);
  return limpia ? limpia : null;
}

export async function rutasCentros(app: FastifyInstance): Promise<void> {
  const { bd, medicion } = app.contexto;
  const evaluar: Evaluador = (valores) => medicion.evaluarAgua(valores);
  const soloTecnico = exigirRol('tecnico');
  const soloComercio = exigirRol('comercio');

  /** Las mediciones de los centros las hace el técnico de Grimuca, que opera la red. */
  function exigirTecnicoDeGrimuca(comercio: string): void {
    if (comercio !== COMERCIO_PRINCIPAL) {
      throw new ErrorHttp(403, 'Las mediciones de los centros de llenado las hace el técnico de Grimuca.');
    }
  }

  async function exigirCentro(tiendaId: string): Promise<DetalleCentro> {
    const [centro] = await leerCentros(bd, evaluar, { tiendaId });
    if (!centro) throw noEncontrado('El centro de llenado');
    return centro;
  }

  // --- Públicas ---

  // El más cercano primero: con `hogar_id`, desde la urbanización de ese cliente; si no, desde `urbanizacion` y `zona`.
  app.get('/centros', async (req) => {
    const consulta = esquemaConsultaCentros.parse(req.query ?? {});
    let cliente = { zona: consulta.zona ?? null, urbanizacion: consulta.urbanizacion ?? null };
    if (consulta.hogar_id) {
      const hogar = await buscarHogar(bd, consulta.hogar_id);
      if (hogar) cliente = { zona: hogar.zona, urbanizacion: hogar.urbanizacion };
    }
    const centros = (await leerCentros(bd, evaluar)).map(sinHistorial);
    return ordenarPorCercania(centros, cliente);
  });

  app.get('/centros/:tienda_id', async (req) => {
    const { tienda_id } = esquemaTiendaId.parse(req.params);
    return exigirCentro(tienda_id);
  });

  // --- Técnico de Grimuca ---

  app.get('/tecnico/centros', { preHandler: soloTecnico }, async (req) => {
    exigirTecnicoDeGrimuca(comercioDe(req));
    const centros = (await leerCentros(bd, evaluar)).map(sinHistorial);
    // Primero los que no tienen medición o la tienen vencida; después, la más antigua primero.
    const fecha = (c: CentroPublico) => (c.ultima ? new Date(c.ultima.fecha).getTime() : 0);
    return centros.sort((a, b) => Number(b.vencida) - Number(a.vencida) || fecha(a) - fecha(b));
  });

  app.post('/tecnico/centros/:tienda_id/mediciones', { preHandler: soloTecnico }, async (req, reply) => {
    exigirTecnicoDeGrimuca(comercioDe(req));
    const { tienda_id } = esquemaTiendaId.parse(req.params);
    const datos = esquemaMedicionCentro.parse(req.body ?? {});
    await exigirCentro(tienda_id);
    const valores = limpiarValores(datos.valores as ValoresMedicion);
    if (!Object.values(valores).some((valor) => typeof valor === 'number')) {
      throw datosInvalidos('Carga al menos una casilla de la tira.');
    }
    const { rows } = await bd.query(
      `INSERT INTO mediciones_centro (tienda_id, valores, nota, medido_por)
       VALUES ($1, $2::jsonb, $3, $4) RETURNING *`,
      [tienda_id, JSON.stringify(valores), limpiarNota(datos.nota), 'Técnico de Grimuca'],
    );
    return reply.code(201).send(filaAMedicionCentro(rows[0], evaluar));
  });

  // El frasco se lee a las 48 horas. Se anota una sola vez: lo publicado no se cambia.
  app.post('/tecnico/centros/mediciones/:id/bacterias', { preHandler: soloTecnico }, async (req) => {
    exigirTecnicoDeGrimuca(comercioDe(req));
    const { id } = esquemaIdMedicion.parse(req.params);
    const { resultado } = esquemaFrasco.parse(req.body ?? {});
    const { rows } = await bd.query('SELECT * FROM mediciones_centro WHERE id = $1', [id]);
    if (!rows[0]) throw noEncontrado('La medición');
    if (aBacterias(rows[0].bacterias) !== 'pendiente') {
      throw new ErrorHttp(409, 'El resultado del frasco ya está publicado y no se cambia.');
    }
    const actualizada = await bd.query(
      'UPDATE mediciones_centro SET bacterias = $2, fecha_bacterias = now() WHERE id = $1 RETURNING *',
      [id, resultado],
    );
    return filaAMedicionCentro(actualizada.rows[0], evaluar);
  });

  // --- Comercio que es centro de llenado ---

  app.get('/operador/centro', { preHandler: soloComercio }, async (req): Promise<PanelCentro> => {
    const comercio = await buscarComercio(bd, comercioDe(req));
    if (!comercio || comercio.tipo !== 'centro_llenado') {
      throw noEncontrado('El centro de llenado');
    }
    const [propios, todos] = await Promise.all([
      leerCentros(bd, evaluar, { comercioId: comercio.id }),
      leerCentros(bd, evaluar),
    ]);
    const cercanos = await clientesCercanosPorCentro(bd, todos.map(sinHistorial));
    return { centros: propios.map((c) => ({ ...c, clientes_cercanos: cercanos.get(c.tienda_id) ?? 0 })) };
  });
}
