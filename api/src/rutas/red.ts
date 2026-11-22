// Red de comercios (superadmin): entrada, cifras de toda la red y alta de comercio.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Bd } from '../bd';
import { buscarUrbanizacion } from '../logistica/urbanizaciones';
import {
  PLANES_COMERCIO,
  TIPOS_COMERCIO,
  type Comercio,
  type ComercioEnRed,
  type PlanComercio,
  type ResumenRed,
  type TipoComercio,
} from '../tipos';
import { datosInvalidos, ErrorHttp } from './errores';
import { crearTokenConRol, esquemaEntrar, exigirRol, frenoDeEntrada, pinCorrecto } from './operador';
import {
  aKebab,
  buscarComercio,
  comercioDeHogarCon,
  estadoMembresia,
  hoyEnVenezuela,
  idLibre,
  listarComercios,
  mapaComercioPorTienda,
  sumarMeses,
} from './plataforma';

type Consultable = Pick<Bd, 'query'>;

/** "Del mes" = los últimos 30 días. */
export const DIAS_DEL_MES = 30;

const texto = (minimo: number, maximo: number) => z.string().trim().min(minimo).max(maximo);

const esquemaComercio = z.object({
  nombre: texto(2, 80),
  estado_pais: texto(2, 40),
  ciudad: texto(2, 60),
  plan: z.enum(PLANES_COMERCIO as [PlanComercio, ...PlanComercio[]]),
  meses_gratis: z.number().int().min(0, 'Los meses gratis van de 0 a 3.').max(3, 'Los meses gratis van de 0 a 3.'),
  tienda_nombre: texto(2, 80),
  tienda_direccion: z
    .union([z.string().trim().max(200), z.null()])
    .optional()
    .transform((valor) => (valor ? valor : null)),
  tipo: z.enum(TIPOS_COMERCIO as [TipoComercio, ...TipoComercio[]]).default('ferreteria'),
  urbanizacion: z
    .union([z.string().trim().max(80), z.null()])
    .optional()
    .transform((valor) => (valor ? valor : null)),
});

/** Un centro de llenado necesita su urbanización (de la lista de Carabobo) para salir como "el más cercano". */
function urbanizacionDelAlta(datos: { tipo: TipoComercio; urbanizacion: string | null }): string | null {
  if (!datos.urbanizacion) {
    if (datos.tipo === 'centro_llenado') {
      throw datosInvalidos('Elige la urbanización del centro de llenado.', [
        { campo: 'urbanizacion', mensaje: 'Elige la urbanización del centro de llenado.' },
      ]);
    }
    return null;
  }
  const urbanizacion = buscarUrbanizacion(datos.urbanizacion);
  if (!urbanizacion) {
    throw datosInvalidos('Esa urbanización no está en la lista.', [
      { campo: 'urbanizacion', mensaje: 'Esa urbanización no está en la lista.' },
    ]);
  }
  return urbanizacion.nombre;
}

interface Conteo {
  tiendas: number;
  hogares: number;
  mediciones_mes: number;
  pedidos_pendientes: number;
  pedidos_mes: number;
  productos_propios: number;
}

const vacio = (): Conteo => ({
  tiendas: 0,
  hogares: 0,
  mediciones_mes: 0,
  pedidos_pendientes: 0,
  pedidos_mes: 0,
  productos_propios: 0,
});

export function aComercioEnRed(
  comercio: Comercio,
  conteo: Conteo,
  hoy: string = hoyEnVenezuela(),
  ultimaMedicionCentro: string | null = null,
): ComercioEnRed {
  const base: ComercioEnRed = { ...comercio, ...conteo, ...estadoMembresia(comercio, hoy) };
  return comercio.tipo === 'centro_llenado' ? { ...base, ultima_medicion_centro: ultimaMedicionCentro } : base;
}

export async function resumenDeLaRed(bd: Consultable, ahora: Date = new Date()): Promise<ResumenRed> {
  const desde = new Date(ahora.getTime() - DIAS_DEL_MES * 86_400_000);
  const [comercios, comercioPorTienda, hogaresRes, medicionesRes, pedidosRes, productosRes, centrosRes] =
    await Promise.all([
      listarComercios(bd),
      mapaComercioPorTienda(bd),
      bd.query('SELECT id, zona, tienda_id FROM hogares'),
      bd.query('SELECT hogar_id FROM mediciones WHERE fecha >= $1', [desde]),
      bd.query('SELECT tienda_id, estado, fecha FROM pedidos'),
      bd.query('SELECT comercio_id FROM cartuchos WHERE comercio_id IS NOT NULL'),
      bd.query('SELECT tienda_id, fecha FROM mediciones_centro'),
    ]);
  // Fecha de la medición más reciente de cada centro de llenado.
  const ultimaPorComercio = new Map<string, string>();
  for (const fila of centrosRes.rows) {
    const comercio = comercioPorTienda.get(String(fila.tienda_id));
    if (!comercio) continue;
    const fecha = new Date(fila.fecha as string).toISOString();
    const previa = ultimaPorComercio.get(comercio);
    if (!previa || fecha > previa) ultimaPorComercio.set(comercio, fecha);
  }

  const conteos = new Map<string, Conteo>(comercios.map((c) => [c.id, vacio()]));
  const de = (id: string) => {
    let c = conteos.get(id);
    if (!c) {
      c = vacio();
      conteos.set(id, c);
    }
    return c;
  };

  for (const comercio of comercioPorTienda.values()) de(comercio).tiendas += 1;
  const comercioDelHogar = new Map<string, string>();
  for (const fila of hogaresRes.rows) {
    const comercio = comercioDeHogarCon(
      { tienda_id: (fila.tienda_id as string | null) ?? null, zona: String(fila.zona) },
      comercioPorTienda,
    );
    comercioDelHogar.set(String(fila.id), comercio);
    de(comercio).hogares += 1;
  }
  for (const fila of medicionesRes.rows) {
    const comercio = comercioDelHogar.get(String(fila.hogar_id));
    if (comercio) de(comercio).mediciones_mes += 1;
  }
  for (const fila of pedidosRes.rows) {
    const comercio = comercioPorTienda.get(String(fila.tienda_id));
    if (!comercio) continue;
    if (fila.estado === 'pendiente') de(comercio).pedidos_pendientes += 1;
    if (new Date(fila.fecha as string).getTime() >= desde.getTime()) de(comercio).pedidos_mes += 1;
  }
  for (const fila of productosRes.rows) de(String(fila.comercio_id)).productos_propios += 1;

  const hoy = hoyEnVenezuela(ahora);
  const lista = comercios.map((c) =>
    aComercioEnRed(c, conteos.get(c.id) ?? vacio(), hoy, ultimaPorComercio.get(c.id) ?? null),
  );
  const suma = (campo: keyof Conteo) => lista.reduce((total, c) => total + c[campo], 0);
  return {
    comercios: lista,
    totales: {
      comercios: lista.length,
      estados_cubiertos: new Set(lista.map((c) => c.estado_pais.trim().toLowerCase())).size,
      tiendas: suma('tiendas'),
      hogares: suma('hogares'),
      mediciones_mes: suma('mediciones_mes'),
      pedidos_mes: suma('pedidos_mes'),
      pedidos_pendientes: suma('pedidos_pendientes'),
    },
  };
}

export async function rutasRed(app: FastifyInstance): Promise<void> {
  const { bd, config } = app.contexto;
  const freno = frenoDeEntrada(app);
  const soloRed = exigirRol('superadmin');

  app.post('/red/entrar', async (req, reply) => {
    const { pin } = esquemaEntrar.parse(req.body);
    freno.revisar(req.ip);
    if (!pinCorrecto(pin, config.pinSuperadmin)) {
      freno.fallo(req.ip);
      return reply.code(401).send({ error: 'PIN incorrecto.' });
    }
    freno.exito(req.ip);
    return {
      token: crearTokenConRol(config.secretoSesion, { rol: 'superadmin', comercio_id: null }),
      rol: 'superadmin' as const,
    };
  });

  app.get('/red/resumen', { preHandler: soloRed }, async () => resumenDeLaRed(bd));

  app.post('/red/comercios', { preHandler: soloRed }, async (req, reply) => {
    const datos = esquemaComercio.parse(req.body);
    const urbanizacion = urbanizacionDelAlta(datos);
    const hoy = hoyEnVenezuela();
    const finGratis = datos.meses_gratis > 0 ? sumarMeses(hoy, datos.meses_gratis) : null;

    const cliente = await bd.connect();
    let comercioId: string;
    try {
      await cliente.query('BEGIN');
      comercioId = await idLibre(cliente, 'comercios', aKebab(datos.nombre, 40));
      const tiendaId = await idLibre(cliente, 'tiendas', aKebab(datos.tienda_nombre, 40));
      await cliente.query(
        `INSERT INTO comercios (id, nombre, tipo, estado_pais, ciudad, plan, membresia_usd, fin_periodo_gratis, activo, es_demostracion)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, true, false)`,
        [comercioId, datos.nombre, datos.tipo, datos.estado_pais, datos.ciudad, datos.plan, finGratis],
      );
      await cliente.query(
        'INSERT INTO tiendas (id, nombre, horario, direccion, comercio_id, urbanizacion) VALUES ($1, $2, $3, $4, $5, $6)',
        [tiendaId, datos.tienda_nombre, 'Por confirmar', datos.tienda_direccion, comercioId, urbanizacion],
      );
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      cliente.release();
    }

    const comercio = await buscarComercio(bd, comercioId);
    if (!comercio) throw new ErrorHttp(500, 'No se pudo registrar el comercio.');
    return reply.code(201).send(aComercioEnRed(comercio, { ...vacio(), tiendas: 1 }));
  });
}
