// Técnico (pensado para el teléfono): entra con su PIN, ve los servicios de su comercio y marca "Ya fui"
// con una nota y, si quiere, la foto de cómo quedó. La foto se ve con GET /api/servicios/:id/foto?token=.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Bd } from '../bd';
import { buscarPedido } from './datos';
import { ErrorHttp, noEncontrado } from './errores';
import { TAMANO_MAXIMO_FOTO } from './mediciones';
import {
  comercioDe,
  crearTokenConRol,
  esquemaEntrar,
  exigirRol,
  frenoDeEntrada,
  leerToken,
  pinCorrecto,
  tokenDeCabecera,
} from './operador';
import { buscarComercio, buscarServicio, COMERCIO_PRINCIPAL, serviciosDeComercio } from './plataforma';

const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const LARGO_MAXIMO_NOTA = 500;

const esquemaEstado = z.object({ estado: z.enum(['pendiente', 'atendido', 'todos']).default('pendiente') });
const esquemaId = z.object({ id: z.coerce.number().int().positive().max(2_147_483_647) });
const esquemaNota = z.object({
  nota: z.union([z.string(), z.null()]).optional(),
});

function limpiarNota(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpia = valor.trim().slice(0, LARGO_MAXIMO_NOTA);
  return limpia ? limpia : null;
}

/**
 * La foto viaja como texto en formato hexadecimal de bytea (\x...): Postgres lo convierte a binario.
 * (La base en memoria de las pruebas lo guarda tal cual; `aBinario` lo deshace al leer.)
 */
export function aHexBytea(imagen: Buffer): string {
  return `\\x${imagen.toString('hex')}`;
}

/** Bytes de la foto tal como los devuelve la base (Buffer, Uint8Array o texto hexadecimal). */
export function aBinario(valor: unknown): Buffer | null {
  if (valor === null || valor === undefined) return null;
  let datos: Buffer;
  if (Buffer.isBuffer(valor)) datos = valor;
  else if (valor instanceof Uint8Array) datos = Buffer.from(valor);
  else if (typeof valor === 'string') datos = Buffer.from(valor, 'utf8');
  else return null;
  // Una imagen real (JPG, PNG o WebP) nunca empieza con los caracteres "\x".
  const comoTexto = datos.length >= 2 && datos[0] === 0x5c && datos[1] === 0x78 ? datos.toString('latin1') : null;
  if (comoTexto && /^\\x([0-9a-f]{2})*$/i.test(comoTexto)) return Buffer.from(comoTexto.slice(2), 'hex');
  return datos;
}

/** Guarda (o reemplaza) el reporte del servicio. */
async function guardarReporte(
  bd: Pick<Bd, 'query'>,
  pedidoId: number,
  nota: string | null,
  foto: { imagen: Buffer; tipoMime: string } | null,
): Promise<void> {
  const { rows } = await bd.query('SELECT pedido_id, foto_tipo FROM reportes_servicio WHERE pedido_id = $1', [pedidoId]);
  if (rows.length === 0) {
    await bd.query(
      'INSERT INTO reportes_servicio (pedido_id, fecha_visita, nota, foto, foto_tipo) VALUES ($1, now(), $2, $3::bytea, $4)',
      [pedidoId, nota, foto ? aHexBytea(foto.imagen) : null, foto?.tipoMime ?? null],
    );
    return;
  }
  // Una segunda visita actualiza la nota; si no trae foto, se conserva la anterior.
  if (foto) {
    await bd.query(
      'UPDATE reportes_servicio SET fecha_visita = now(), nota = $2, foto = $3::bytea, foto_tipo = $4 WHERE pedido_id = $1',
      [pedidoId, nota, aHexBytea(foto.imagen), foto.tipoMime],
    );
  } else {
    await bd.query('UPDATE reportes_servicio SET fecha_visita = now(), nota = $2 WHERE pedido_id = $1', [pedidoId, nota]);
  }
}

export async function rutasTecnico(app: FastifyInstance): Promise<void> {
  const { bd, config, eventos } = app.contexto;
  const freno = frenoDeEntrada(app);
  const soloTecnico = exigirRol('tecnico');

  app.post('/tecnico/entrar', async (req, reply) => {
    const { pin } = esquemaEntrar.parse(req.body);
    freno.revisar(req.ip);
    // PIN_TECNICO es el del técnico de Grimuca (en la demo hay un solo técnico).
    const comercio = pinCorrecto(pin, config.pinTecnico) ? await buscarComercio(bd, COMERCIO_PRINCIPAL) : null;
    if (!comercio) {
      freno.fallo(req.ip);
      return reply.code(401).send({ error: 'PIN incorrecto.' });
    }
    freno.exito(req.ip);
    return {
      token: crearTokenConRol(config.secretoSesion, { rol: 'tecnico', comercio_id: comercio.id }),
      rol: 'tecnico' as const,
      comercio,
    };
  });

  app.get('/tecnico/servicios', { preHandler: soloTecnico }, async (req) => {
    const { estado } = esquemaEstado.parse(req.query);
    return serviciosDeComercio(bd, comercioDe(req), estado);
  });

  app.post('/tecnico/servicios/:id/atender', { preHandler: soloTecnico }, async (req) => {
    const { id } = esquemaId.parse(req.params);
    let nota: string | null = null;
    let foto: { imagen: Buffer; tipoMime: string } | null = null;
    if (req.isMultipart()) {
      for await (const parte of req.parts()) {
        if (parte.type === 'file') {
          if (parte.fieldname === 'foto' && !foto) {
            // toBuffer lanza si la foto pasa de 8 MB (lo traduce el manejador de errores).
            const imagen = await parte.toBuffer();
            if (imagen.length > 0) foto = { imagen, tipoMime: parte.mimetype.toLowerCase() };
          } else {
            parte.file.resume();
          }
        } else if (parte.fieldname === 'nota') {
          nota = limpiarNota(parte.value);
        }
      }
    } else {
      nota = limpiarNota(esquemaNota.parse(req.body ?? {}).nota);
    }
    if (foto && !TIPOS_DE_FOTO.includes(foto.tipoMime)) {
      throw new ErrorHttp(415, 'La foto debe ser JPG, PNG o WebP.');
    }
    if (foto && foto.imagen.length > TAMANO_MAXIMO_FOTO) {
      throw new ErrorHttp(413, 'La foto pesa más de 8 MB. Toma otra o bájale la calidad.');
    }

    const servicio = await buscarServicio(bd, id);
    // Solo los servicios de su comercio: los demás, para él, no existen.
    if (!servicio || (servicio.comercio_id ?? COMERCIO_PRINCIPAL) !== comercioDe(req)) throw noEncontrado('El servicio');

    await guardarReporte(bd, id, nota, foto);
    const { rows } = await bd.query(
      "UPDATE pedidos SET estado = 'despachado', fecha_despacho = now() WHERE id = $1 AND estado = 'pendiente' RETURNING id",
      [id],
    );
    if (rows.length > 0) {
      const pedido = await buscarPedido(bd, id, true);
      if (pedido) await eventos.publicar({ tipo: 'pedido_despachado', datos: pedido });
    }
    const actualizado = await buscarServicio(bd, id);
    if (!actualizado) throw noEncontrado('El servicio');
    return actualizado;
  });

  // La foto del reporte: la ve el comercio dueño, el técnico de ese comercio y el superadmin.
  // El token va en la consulta para poder usarla en <img src>; también se acepta la cabecera.
  app.get('/servicios/:id/foto', async (req, reply) => {
    const { id } = esquemaId.parse(req.params);
    const token = (req.query as { token?: unknown } | undefined)?.token ?? tokenDeCabecera(req);
    const sesion = leerToken(token, config.secretoSesion);
    if (!sesion) return reply.code(401).send({ error: 'Tu sesión venció o no es válida. Vuelve a entrar con el PIN.' });

    const servicio = await buscarServicio(bd, id);
    const dueno = servicio?.comercio_id ?? COMERCIO_PRINCIPAL;
    if (!servicio || (sesion.rol !== 'superadmin' && sesion.comercio_id !== dueno)) throw noEncontrado('La foto');

    const { rows } = await bd.query('SELECT foto, foto_tipo FROM reportes_servicio WHERE pedido_id = $1', [id]);
    const fila = rows[0];
    const datos = fila ? aBinario(fila.foto) : null;
    if (!fila || !datos || datos.length === 0 || typeof fila.foto_tipo !== 'string') throw noEncontrado('La foto');
    return reply
      .header('Content-Type', TIPOS_DE_FOTO.includes(fila.foto_tipo) ? fila.foto_tipo : 'application/octet-stream')
      .header('Cache-Control', 'private, no-store')
      .send(datos);
  });
}
