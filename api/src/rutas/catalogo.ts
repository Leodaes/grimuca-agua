// Salud del servicio, tiendas, catálogo y configuración de la tira.
import type { FastifyInstance } from 'fastify';
import { bdResponde } from '../bd';
import type { Salud } from '../tipos';
import { aCartuchoPublico, buscarHogar, listarCatalogo, listarTiendas } from './datos';
import { datosInvalidos } from './errores';
import { esquemaUuid } from './esquemas';
import { catalogoDelHogar, COMERCIO_PRINCIPAL } from './plataforma';

export async function rutasCatalogo(app: FastifyInstance): Promise<void> {
  const { bd, config, medicion } = app.contexto;

  app.get('/salud', async (): Promise<Salud> => {
    return { ok: true, bd: await bdResponde(bd), version: config.version };
  });

  // El recorrido del cliente sigue viendo las tiendas de Grimuca (como antes de la red).
  // `?comercio=<id>` filtra por otro comercio; `?comercio=todos`, todas las de la red.
  app.get('/tiendas', async (req) => {
    const pedido = (req.query as { comercio?: unknown } | undefined)?.comercio;
    if (pedido === 'todos') return listarTiendas(bd);
    const comercio = typeof pedido === 'string' && /^[a-z0-9-]{1,60}$/.test(pedido) ? pedido : COMERCIO_PRINCIPAL;
    return listarTiendas(bd, comercio);
  });

  // Sin `?hogar_id=`, solo el catálogo general; con él, también los productos del comercio de la tienda del hogar.
  // Un hogar que no existe ve el catálogo general.
  app.get('/cartuchos', async (req) => {
    const pedido = (req.query as { hogar_id?: unknown } | undefined)?.hogar_id;
    if (pedido === undefined || pedido === '') return (await listarCatalogo(bd)).map(aCartuchoPublico);
    const hogarId = esquemaUuid.safeParse(pedido);
    if (!hogarId.success) throw datosInvalidos('El identificador del hogar (hogar_id) no es válido.');
    const hogar = await buscarHogar(bd, hogarId.data);
    const catalogo = hogar ? await catalogoDelHogar(bd, hogar) : await listarCatalogo(bd);
    return catalogo.map(aCartuchoPublico);
  });

  app.get('/config/tira', async () => medicion.tira);
}
