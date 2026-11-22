// Pedidos del cliente: el sobre (pago simulado), los cartuchos de "Mi lista" y el servicio técnico (sin cobro).
import type { FastifyInstance } from 'fastify';
import { buscarCartucho, buscarHogar, buscarPedido, existeTienda } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { esquemaCrearPedido, esquemaIdPedido } from './esquemas';

/** AAAA-MM-DD de hoy en Venezuela (UTC-4, sin horario de verano). */
function hoyEnVenezuela(ahora = new Date()): string {
  return new Date(ahora.getTime() - 4 * 3_600_000).toISOString().slice(0, 10);
}

export async function rutasPedidos(app: FastifyInstance): Promise<void> {
  const { bd, eventos } = app.contexto;

  app.post('/pedidos', async (req, reply) => {
    const datos = esquemaCrearPedido.parse(req.body);

    const hogar = await buscarHogar(bd, datos.hogar_id);
    if (!hogar) throw noEncontrado('El hogar');
    if (!(await existeTienda(bd, datos.tienda_id))) throw datosInvalidos('Esa tienda no existe.');

    let cartuchoCodigo: string | null = null;
    if (datos.tipo === 'cartucho') {
      if (!datos.cartucho_codigo) throw datosInvalidos('Falta el código del producto (cartucho_codigo).');
      const cartucho = await buscarCartucho(bd, datos.cartucho_codigo);
      if (!cartucho) throw datosInvalidos('Ese producto no está en el catálogo.');
      cartuchoCodigo = cartucho.codigo;
    }

    // Servicio técnico: el experto va a la casa (siempre 'envio'), una visita, con fecha preferida.
    const esServicio = datos.tipo === 'servicio';
    const modalidad = esServicio ? 'envio' : datos.modalidad;
    if (esServicio) {
      if (!datos.servicio) throw datosInvalidos('Falta el servicio que necesitas (servicio).');
      if (!datos.fecha_preferida) throw datosInvalidos('Falta la fecha preferida (fecha_preferida).');
      if (datos.fecha_preferida < hoyEnVenezuela()) throw datosInvalidos('La fecha preferida ya pasó.');
    }

    // Para envío hace falta una dirección: la del pedido o, si no viene, la del hogar.
    let direccion: string | null = null;
    if (modalidad === 'envio') {
      direccion = datos.direccion ?? hogar.direccion;
      if (!direccion) {
        throw datosInvalidos(esServicio ? 'Para ir a tu casa necesitamos una dirección.' : 'Para enviarlo necesitamos una dirección.');
      }
    }

    // El servidor decide el pago: el sobre va con pago simulado; cartuchos y servicios no se cobran aquí.
    const pago = datos.tipo === 'sobre' ? 'simulado' : 'no_aplica';

    const { rows } = await bd.query(
      `INSERT INTO pedidos (hogar_id, tipo, cartucho_codigo, cantidad, modalidad, direccion, pago, tienda_id,
                            servicio, fecha_preferida, momento, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        hogar.id,
        datos.tipo,
        cartuchoCodigo,
        esServicio ? 1 : datos.cantidad,
        modalidad,
        direccion,
        pago,
        datos.tienda_id,
        esServicio ? datos.servicio : null,
        esServicio ? datos.fecha_preferida : null,
        esServicio ? (datos.momento ?? null) : null,
        esServicio ? (datos.nota ?? null) : null,
      ],
    );
    const id = Number(rows[0].id);
    const conDetalle = await buscarPedido(bd, id, true);
    if (!conDetalle) throw new ErrorHttp(500, 'No se pudo registrar el pedido.');

    await eventos.publicar({ tipo: 'pedido_nuevo', datos: conDetalle });

    // Al cliente se le responde sin los campos que son solo del operador.
    const { hogar_nombre: _nombre, zona: _zona, ...pedido } = conDetalle;
    return reply.code(201).send(pedido);
  });

  app.get('/pedidos/:id', async (req) => {
    const { id } = esquemaIdPedido.parse(req.params);
    const pedido = await buscarPedido(bd, id);
    if (!pedido) throw noEncontrado('El pedido');
    return pedido;
  });
}
