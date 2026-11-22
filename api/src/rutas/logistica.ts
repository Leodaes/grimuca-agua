// Panel del operador: resumen por tienda, inventario contra demanda y alertas por zona.
// Se registra como las demás rutas (con prefijo /api), así que aquí van sin él.
import type { FastifyInstance } from 'fastify';
import { alertasZona, inventario, mapaUrbanizaciones, resumenPorTienda } from '../logistica';
import type { AlertaZona, FilaInventario, ResumenTienda, UrbanizacionMapa } from '../tipos';
import { exigirOperador } from './operador';

export async function rutasLogistica(app: FastifyInstance): Promise<void> {
  const { bd } = app.contexto;

  app.get('/operador/resumen', { preHandler: exigirOperador }, async (): Promise<ResumenTienda[]> =>
    resumenPorTienda(bd),
  );

  app.get('/operador/inventario', { preHandler: exigirOperador }, async (): Promise<FilaInventario[]> =>
    inventario(bd),
  );

  app.get('/operador/zonas', { preHandler: exigirOperador }, async (): Promise<AlertaZona[]> => alertasZona(bd));

  // Mapa de hexágonos por urbanización (calidad del agua y clientes).
  app.get('/operador/mapa', { preHandler: exigirOperador }, async (): Promise<UrbanizacionMapa[]> =>
    mapaUrbanizaciones(bd),
  );
}

export default rutasLogistica;
