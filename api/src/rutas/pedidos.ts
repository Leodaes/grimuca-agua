// Pedidos del cliente: el sobre (pago simulado) y los cartuchos de "Mi lista" (sin cobro).
import type { FastifyInstance } from 'fastify';
import { buscarCartucho, buscarHogar, buscarPedido, existeTienda } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { esquemaCrearPedido, esquemaIdPedido } from './esquemas';

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

    // Para envío hace falta una dirección: la del pedido o, si no viene, la del hogar.
    let direccion: string | null = null;
    if (datos.modalidad === 'envio') {
      direccion = datos.direccion ?? hogar.direccion;
      if (!direccion) throw datosInvalidos('Para enviarlo necesitamos una dirección.');
    }

    // El servidor decide el pago: el sobre va con pago simulado; los cartuchos no se cobran aquí.
    const pago = datos.tipo === 'sobre' ? 'simulado' : 'no_aplica';

    const { rows } = await bd.query(
      `INSERT INTO pedidos (hogar_id, tipo, cartucho_codigo, cantidad, modalidad, direccion, pago, tienda_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [hogar.id, datos.tipo, cartuchoCodigo, datos.cantidad, datos.modalidad, direccion, pago, datos.tienda_id],
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
