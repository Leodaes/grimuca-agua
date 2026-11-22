// Salud del servicio, tiendas, catálogo y configuración de la tira.
import type { FastifyInstance } from 'fastify';
import { bdResponde } from '../bd';
import type { Salud } from '../tipos';
import { aCartuchoPublico, listarCatalogo, listarTiendas } from './datos';

export async function rutasCatalogo(app: FastifyInstance): Promise<void> {
  const { bd, config, medicion } = app.contexto;

  app.get('/salud', async (): Promise<Salud> => {
    return { ok: true, bd: await bdResponde(bd), version: config.version };
  });

  app.get('/tiendas', async () => listarTiendas(bd));

  app.get('/cartuchos', async () => (await listarCatalogo(bd)).map(aCartuchoPublico));

  app.get('/config/tira', async () => medicion.tira);
}
