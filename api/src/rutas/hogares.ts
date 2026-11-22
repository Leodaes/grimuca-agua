// Perfil del hogar. No hay cuentas: el UUID del hogar es la llave que guarda el navegador.
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { tiendaSugerida, type Hogar, type UltimoCambio } from '../tipos';
import { buscarHogar, existeTienda, filaAHogar, filaAMedicion, listarCatalogo, pedidosDeHogar, perfilDe } from './datos';
import { datosInvalidos, noEncontrado } from './errores';
import { esquemaCambiarHogar, esquemaCrearHogar, esquemaIdHogar } from './esquemas';

/** Columnas que se pueden cambiar con PATCH. */
const COLUMNAS_EDITABLES = [
  'nombre',
  'zona',
  'origen_agua',
  'personas',
  'tiene_filtro',
  'etapas_filtro',
  'fecha_ultimo_cambio',
  'agua_turbia',
  'whatsapp',
  'direccion',
  'tienda_id',
  'urbanizacion',
  'mascotas',
  'ultimo_cambio',
] as const;

/** Días hacia atrás que se anotan como fecha del último cambio según la respuesta cerrada del perfil. */
export const DIAS_ULTIMO_CAMBIO: Readonly<Record<UltimoCambio, number | null>> = {
  menos_de_un_mes: 15,
  mas_de_tres_meses: 100,
  no_me_acuerdo: null,
};

/** "Hace menos de un mes" → hoy − 15 días (AAAA-MM-DD); "Hace más de tres meses" → hoy − 100; "No me acuerdo" → null. */
export function fechaDeUltimoCambio(respuesta: UltimoCambio, hoy: Date = new Date()): string | null {
  const dias = DIAS_ULTIMO_CAMBIO[respuesta];
  if (dias === null) return null;
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
  const dosCifras = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

export async function rutasHogares(app: FastifyInstance): Promise<void> {
  const { bd, config, medicion } = app.contexto;

  async function exigirHogar(id: string): Promise<Hogar> {
    const hogar = await buscarHogar(bd, id);
    if (!hogar) throw noEncontrado('El hogar');
    return hogar;
  }

  async function exigirTienda(id: string): Promise<void> {
    if (!(await existeTienda(bd, id))) throw datosInvalidos('Esa tienda no existe.');
  }

  app.post('/hogares', async (req, reply) => {
    const datos = esquemaCrearHogar.parse(req.body);
    const tiendaId = datos.tienda_id ?? tiendaSugerida(datos.zona);
    await exigirTienda(tiendaId);
    const tieneFiltro = datos.tiene_filtro;
    const ultimoCambio = tieneFiltro ? (datos.ultimo_cambio ?? null) : null;
    // Con la respuesta cerrada, la fecha se deriva de ella.
    const fechaUltimoCambio = ultimoCambio ? fechaDeUltimoCambio(ultimoCambio) : (datos.fecha_ultimo_cambio ?? null);
    const { rows } = await bd.query(
      `INSERT INTO hogares (id, nombre, zona, origen_agua, personas, tiene_filtro, etapas_filtro,
                            fecha_ultimo_cambio, agua_turbia, whatsapp, direccion, tienda_id, urbanizacion, mascotas,
                            ultimo_cambio, consentimiento_fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())
       RETURNING *`,
      [
        randomUUID(),
        datos.nombre,
        datos.zona,
        datos.origen_agua,
        datos.personas,
        tieneFiltro,
        tieneFiltro ? (datos.etapas_filtro ?? null) : null,
        tieneFiltro ? fechaUltimoCambio : null,
        datos.agua_turbia,
        datos.whatsapp,
        datos.direccion ?? null,
        tiendaId,
        datos.urbanizacion ?? null,
        datos.mascotas,
        ultimoCambio,
      ],
    );
    return reply.code(201).send(filaAHogar(rows[0]));
  });

  app.get('/hogares/:id', async (req) => {
    const { id } = esquemaIdHogar.parse(req.params);
    return exigirHogar(id);
  });

  app.patch('/hogares/:id', async (req) => {
    const { id } = esquemaIdHogar.parse(req.params);
    const cambios = esquemaCambiarHogar.parse(req.body ?? {});
    const actual = await exigirHogar(id);

    if (cambios.tienda_id) await exigirTienda(cambios.tienda_id);
    // Sin filtro no hay etapas ni fecha de cambio.
    if (cambios.tiene_filtro === false) {
      cambios.etapas_filtro = null;
      cambios.fecha_ultimo_cambio = null;
      cambios.ultimo_cambio = null;
    } else if (cambios.ultimo_cambio) {
      // La fecha se deriva de la respuesta cerrada, salvo que venga explícita (p. ej. "Ya lo cambié" de los tutoriales).
      // Si la respuesta no cambió y ya hay fecha, se conserva para no reiniciar la cuenta en cada guardado.
      const misma = cambios.ultimo_cambio === actual.ultimo_cambio && actual.fecha_ultimo_cambio !== null;
      if (cambios.ultimo_cambio === 'no_me_acuerdo') cambios.fecha_ultimo_cambio = null;
      else if (cambios.fecha_ultimo_cambio === undefined && !misma) {
        cambios.fecha_ultimo_cambio = fechaDeUltimoCambio(cambios.ultimo_cambio);
      }
    }

    const asignaciones: string[] = [];
    const valores: unknown[] = [];
    for (const columna of COLUMNAS_EDITABLES) {
      const valor = cambios[columna];
      if (valor === undefined) continue;
      valores.push(valor);
      asignaciones.push(`${columna} = $${valores.length}`);
    }
    if (asignaciones.length === 0) return actual;

    valores.push(id);
    const { rows } = await bd.query(
      `UPDATE hogares SET ${asignaciones.join(', ')} WHERE id = $${valores.length} RETURNING *`,
      valores,
    );
    return filaAHogar(rows[0]);
  });

  app.get('/hogares/:id/mediciones', async (req) => {
    const { id } = esquemaIdHogar.parse(req.params);
    const hogar = await exigirHogar(id);
    const [{ rows }, catalogo] = await Promise.all([
      bd.query('SELECT * FROM mediciones WHERE hogar_id = $1 ORDER BY fecha DESC', [id]),
      listarCatalogo(bd),
    ]);
    const perfil = perfilDe(hogar);
    return rows.map((fila) =>
      filaAMedicion(fila, {
        catalogo,
        perfil,
        filtro: hogar.filtro,
        hogar,
        marcasExcluidas: config.marcasExcluidas,
        diasParaRecambio: medicion.diasParaRecambio,
      }),
    );
  });

  app.get('/hogares/:id/pedidos', async (req) => {
    const { id } = esquemaIdHogar.parse(req.params);
    await exigirHogar(id);
    return pedidosDeHogar(bd, id);
  });
}
