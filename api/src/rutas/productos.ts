// Productos del comercio: el catálogo general más los que cargó el comercio, con existencias en sus tiendas.
// Un producto propio entra al catálogo y a los sugeridos igual que los demás (recomendable y disponible).
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { codigoPg, type Bd } from '../bd';
import { CLAVES_PARAMETRO, type ProductoComercio } from '../tipos';
import { aCartuchoPublico, filaACartucho } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { comercioDe, exigirOperador } from './operador';
import { buscarComercio, tiendasDeComercio } from './plataforma';

type Consultable = Pick<Bd, 'query'>;

/** Lo que un producto puede corregir: los parámetros de la tira y las razones del perfil. */
export const CLAVES_CORRIGE: readonly string[] = [...CLAVES_PARAMETRO, 'sedimentos', 'sabor_olor', 'bacterias'];

const esquemaProducto = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, 'El código debe tener al menos 2 caracteres.')
    .max(60, 'El código es demasiado largo.')
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'El código solo lleva letras, números, punto, guion o guion bajo.'),
  nombre: z.string().trim().min(2, 'Escribe el nombre del producto.').max(120, 'El nombre es demasiado largo.'),
  categoria: z
    .string()
    .trim()
    .min(2, 'Indica la categoría.')
    .max(40, 'La categoría es demasiado larga.')
    .regex(/^[a-z0-9_]+$/, 'La categoría va en minúsculas y con guion bajo (cartucho, filtro, repuesto…).'),
  corrige: z
    .array(z.string())
    .max(CLAVES_CORRIGE.length)
    .refine((claves) => claves.every((c) => CLAVES_CORRIGE.includes(c)), 'Hay una clave de "corrige" que no se conoce.')
    .transform((claves) => [...new Set(claves)]),
  foto_url: z
    .union([z.string().trim().max(500).url('La foto debe ser un enlace (https://…).'), z.literal(''), z.null()])
    .optional()
    .transform((valor) => (valor ? valor : null))
    .refine((valor) => valor === null || /^https:\/\//i.test(valor), 'La foto debe ser un enlace https://.'),
  existencias: z.record(z.string(), z.number().int().min(0).max(100_000)).default({}),
});

const COLUMNAS =
  'codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, categoria, url_producto, disponible, recomendable, comercio_id';

/** Catálogo general (sin comercio) más los productos propios del comercio, con existencias en sus tiendas. */
export async function productosDeComercio(bd: Consultable, comercioId: string): Promise<ProductoComercio[]> {
  const [tiendas, cartuchosRes, stockRes] = await Promise.all([
    tiendasDeComercio(bd, comercioId),
    bd.query(`SELECT ${COLUMNAS} FROM cartuchos WHERE comercio_id IS NULL OR comercio_id = $1 ORDER BY codigo`, [
      comercioId,
    ]),
    bd.query(
      'SELECT s.tienda_id, s.cartucho_codigo, s.cantidad FROM stock s JOIN tiendas t ON t.id = s.tienda_id WHERE t.comercio_id = $1',
      [comercioId],
    ),
  ]);
  const cantidad = new Map<string, number>();
  for (const s of stockRes.rows) cantidad.set(`${s.tienda_id}|${s.cartucho_codigo}`, Number(s.cantidad) || 0);
  return cartuchosRes.rows.map((fila) => {
    const cartucho = aCartuchoPublico(filaACartucho(fila));
    return {
      ...cartucho,
      propio: fila.comercio_id === comercioId,
      existencias: tiendas.map((t) => ({
        tienda_id: t.id,
        tienda_nombre: t.nombre,
        cantidad: cantidad.get(`${t.id}|${cartucho.codigo}`) ?? 0,
      })),
    };
  });
}

export async function rutasProductos(app: FastifyInstance): Promise<void> {
  const { bd } = app.contexto;

  app.get('/operador/productos', { preHandler: exigirOperador }, async (req) => productosDeComercio(bd, comercioDe(req)));

  app.post('/operador/productos', { preHandler: exigirOperador }, async (req, reply) => {
    const datos = esquemaProducto.parse(req.body);
    const comercioId = comercioDe(req);
    const comercio = await buscarComercio(bd, comercioId);
    if (!comercio) throw noEncontrado('El comercio');

    const { rows: existentes } = await bd.query('SELECT codigo FROM cartuchos WHERE lower(codigo) = lower($1)', [datos.codigo]);
    if (existentes.length > 0) throw new ErrorHttp(409, 'Ya hay un producto con ese código. Usa otro.');

    const tiendas = await tiendasDeComercio(bd, comercioId);
    const propias = new Set(tiendas.map((t) => t.id));
    const ajenas = Object.keys(datos.existencias).filter((id) => !propias.has(id));
    if (ajenas.length > 0) throw datosInvalidos('Las existencias solo pueden ir en tiendas de tu comercio.');

    // Las claves de "corrige" ya se validaron contra la lista conocida: se pueden escribir tal cual.
    const corrige = datos.corrige.length > 0 ? `ARRAY[${datos.corrige.map((c) => `'${c}'`).join(', ')}]::text[]` : `'{}'::text[]`;
    const cliente = await bd.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(
        `INSERT INTO cartuchos (codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, vida_util_meses,
                                categoria, recomendable, url_producto, disponible, comercio_id)
         VALUES ($1, $2, $3, NULL, ${corrige}, false, $4, NULL, $5, true, NULL, true, $6)`,
        [datos.codigo, datos.nombre, comercio.nombre, datos.foto_url, datos.categoria, comercioId],
      );
      // Una fila de existencias por cada tienda del comercio (las que no vienen quedan en 0).
      for (const tienda of tiendas) {
        await cliente.query('INSERT INTO stock (tienda_id, cartucho_codigo, cantidad) VALUES ($1, $2, $3)', [
          tienda.id,
          datos.codigo,
          datos.existencias[tienda.id] ?? 0,
        ]);
      }
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK').catch(() => {});
      if (codigoPg(error) === '23505') throw new ErrorHttp(409, 'Ya hay un producto con ese código. Usa otro.');
      throw error;
    } finally {
      cliente.release();
    }

    const producto = (await productosDeComercio(bd, comercioId)).find((p) => p.codigo === datos.codigo);
    if (!producto) throw new ErrorHttp(500, 'No se pudo registrar el producto.');
    return reply.code(201).send(producto);
  });
}
