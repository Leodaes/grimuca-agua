// Salud del servicio, tiendas, catálogo y configuración de la tira.
import type { FastifyInstance } from 'fastify';
import { bdResponde } from '../bd';
import type { Salud } from '../tipos';
import { aCartuchoPublico, listarCatalogo, listarTiendas } from './datos';
import { COMERCIO_PRINCIPAL } from './plataforma';

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

  app.get('/cartuchos', async () => (await listarCatalogo(bd)).map(aCartuchoPublico));

  app.get('/config/tira', async () => medicion.tira);
}
