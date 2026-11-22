// Prueba de bacterias del sobre: el cliente la inicia y a las 48 horas reporta si el frasco cambió de color.
// Una prueba por hogar. Los equipos de desinfección solo se sugieren si el frasco cambió de color.
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { codigoPg } from '../bd';
import type { PruebaBacterias } from '../tipos';
import { buscarHogar, filaABacterias, listarCatalogo, sugerirDesinfeccion } from './datos';
import { noEncontrado } from './errores';
import { catalogoDelHogar } from './plataforma';
import { esquemaHogarId, esquemaReporteBacterias } from './esquemas';

export async function rutasBacterias(app: FastifyInstance): Promise<void> {
  const { bd } = app.contexto;

  /** Los sugeridos salen del catálogo que ve el hogar (el general más los productos del comercio de su tienda). */
  async function armar(fila: Record<string, unknown>): Promise<PruebaBacterias> {
    if (fila.resultado !== 'cambio') return filaABacterias(fila, []);
    const hogar = await buscarHogar(bd, String(fila.hogar_id));
    const catalogo = hogar ? await catalogoDelHogar(bd, hogar) : await listarCatalogo(bd);
    return filaABacterias(fila, sugerirDesinfeccion(catalogo));
  }

  async function buscar(hogarId: string): Promise<Record<string, unknown> | null> {
    const { rows } = await bd.query('SELECT * FROM pruebas_bacterias WHERE hogar_id = $1', [hogarId]);
    return rows[0] ?? null;
  }

  app.get('/bacterias/:hogar_id', async (req) => {
    const { hogar_id } = esquemaHogarId.parse(req.params);
    const fila = await buscar(hogar_id);
    if (!fila) throw noEncontrado('La prueba de bacterias de este hogar');
    return armar(fila);
  });

  // Idempotente: si el hogar ya inició su prueba, devuelve la misma.
  app.post('/bacterias', async (req, reply) => {
    const { hogar_id } = esquemaHogarId.parse(req.body);
    if (!(await buscarHogar(bd, hogar_id))) throw noEncontrado('El hogar');

    const existente = await buscar(hogar_id);
    if (existente) return armar(existente);
    try {
      const { rows } = await bd.query(
        "INSERT INTO pruebas_bacterias (id, hogar_id, resultado) VALUES ($1, $2, 'pendiente') RETURNING *",
        [randomUUID(), hogar_id],
      );
      return reply.code(201).send(await armar(rows[0]));
    } catch (error) {
      // Dos solicitudes a la vez: la segunda encuentra la fila que creó la primera.
      if (codigoPg(error) === '23505') {
        const creada = await buscar(hogar_id);
        if (creada) return armar(creada);
      }
      throw error;
    }
  });

  app.put('/bacterias/:hogar_id', async (req) => {
    const { hogar_id } = esquemaHogarId.parse(req.params);
    const { resultado } = esquemaReporteBacterias.parse(req.body);
    const { rows } = await bd.query(
      'UPDATE pruebas_bacterias SET resultado = $1, fecha_reporte = now() WHERE hogar_id = $2 RETURNING *',
      [resultado, hogar_id],
    );
    if (!rows[0]) throw noEncontrado('La prueba de bacterias de este hogar');
    return armar(rows[0]);
  });
}
