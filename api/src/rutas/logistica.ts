// Panel del comercio: resumen por tienda, inventario contra demanda y alertas por zona.
// Se registra como las demás rutas (con prefijo /api), así que aquí van sin él.
// Cada comercio ve solo sus tiendas y los hogares que atienden (docs/decisiones/contrato-red.md).
import type { FastifyInstance } from 'fastify';
import { alertasZona, inventario, mapaUrbanizaciones, resumenPorTienda, rutasDespacho } from '../logistica';
import type { AlertaZona, FilaInventario, ResumenTienda, RutasDespacho, UrbanizacionMapa } from '../tipos';
import { comercioDe, exigirOperador } from './operador';

export async function rutasLogistica(app: FastifyInstance): Promise<void> {
  const { bd } = app.contexto;

  app.get('/operador/resumen', { preHandler: exigirOperador }, async (req): Promise<ResumenTienda[]> =>
    resumenPorTienda(bd, new Date(), comercioDe(req)),
  );

  app.get('/operador/inventario', { preHandler: exigirOperador }, async (req): Promise<FilaInventario[]> =>
    inventario(bd, new Date(), comercioDe(req)),
  );

  app.get('/operador/zonas', { preHandler: exigirOperador }, async (req): Promise<AlertaZona[]> =>
    alertasZona(bd, new Date(), comercioDe(req)),
  );

  // Mapa de hexágonos por urbanización (calidad del agua y clientes).
  app.get('/operador/mapa', { preHandler: exigirOperador }, async (req): Promise<UrbanizacionMapa[]> =>
    mapaUrbanizaciones(bd, new Date(), comercioDe(req)),
  );

  // Rutas de despacho: una por tienda, con las entregas pendientes agrupadas por urbanización.
  app.get('/operador/rutas', { preHandler: exigirOperador }, async (req): Promise<RutasDespacho> =>
    rutasDespacho(bd, comercioDe(req)),
  );
}

export default rutasLogistica;
