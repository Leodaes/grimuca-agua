// Mediciones: por foto (lectura con el servicio de visión) o cargadas a mano.
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { CLAVES_PARAMETRO, type Evaluacion, type Hogar, type Medicion, type Nivel, type ValoresMedicion } from '../tipos';
import { buscarHogar, filaAMedicion, listarCatalogo, perfilDe } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { esquemaMedicionManual, esquemaUuid, esquemaValores } from './esquemas';

export const TAMANO_MAXIMO_FOTO = 8 * 1024 * 1024;
const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

const MOTIVO_SIN_LECTURA =
  'No pudimos leer la tira en esa foto. Toma otra con buena luz, junto a la tabla de colores, o carga los valores a mano.';

/** Deja solo las claves conocidas con número válido o null. */
function limpiarValores(valores: ValoresMedicion): ValoresMedicion {
  const limpio: ValoresMedicion = {};
  for (const clave of CLAVES_PARAMETRO) {
    const valor = valores[clave];
    if (valor === undefined) continue;
    limpio[clave] = typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  }
  return limpio;
}

function hayAlgunaLectura(valores: ValoresMedicion): boolean {
  return Object.values(valores).some((valor) => typeof valor === 'number');
}

export async function rutasMediciones(app: FastifyInstance): Promise<void> {
  const { bd, config, medicion, eventos } = app.contexto;

  async function guardar(hogar: Hogar, origen: Medicion['origen'], valores: ValoresMedicion): Promise<Medicion> {
    const perfil = perfilDe(hogar);
    const evaluacion: Evaluacion = medicion.evaluarAgua(valores, perfil);
    if (evaluacion.diasParaRecambio === undefined || evaluacion.diasParaRecambio === null) {
      evaluacion.diasParaRecambio = medicion.diasParaRecambio(perfil);
    }
    const porParametro: Partial<Record<string, Nivel>> = {};
    for (const resultado of evaluacion.porParametro ?? []) porParametro[resultado.clave] = resultado.nivel;

    const { rows } = await bd.query(
      `INSERT INTO mediciones (id, hogar_id, origen, valores, semaforo, semaforo_por_parametro, evaluacion)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb)
       RETURNING *`,
      [
        randomUUID(),
        hogar.id,
        origen,
        JSON.stringify(valores),
        evaluacion.semaforo,
        JSON.stringify(porParametro),
        JSON.stringify(evaluacion),
      ],
    );
    const nueva = filaAMedicion(rows[0], {
      catalogo: await listarCatalogo(bd),
      perfil,
      filtro: hogar.filtro,
      marcasExcluidas: config.marcasExcluidas,
    });
    await eventos.publicar({
      tipo: 'medicion_nueva',
      datos: { hogar_id: hogar.id, zona: hogar.zona, semaforo: nueva.evaluacion.semaforo },
    });
    return nueva;
  }

  async function exigirHogar(id: string): Promise<Hogar> {
    const hogar = await buscarHogar(bd, id);
    if (!hogar) throw noEncontrado('El hogar');
    return hogar;
  }

  app.post('/mediciones/manual', async (req, reply) => {
    const datos = esquemaMedicionManual.parse(req.body);
    const valores = limpiarValores(datos.valores);
    if (!hayAlgunaLectura(valores)) {
      throw datosInvalidos('Carga al menos un valor de la tira.');
    }
    const hogar = await exigirHogar(datos.hogar_id);
    return reply.code(201).send(await guardar(hogar, 'manual', valores));
  });

  app.post('/mediciones/foto', async (req) => {
    if (!req.isMultipart()) {
      throw new ErrorHttp(415, 'Envía la foto como formulario (multipart/form-data).');
    }
    let foto: { imagen: Buffer; tipoMime: string } | null = null;
    let hogarId: string | null = null;
    for await (const parte of req.parts()) {
      if (parte.type === 'file') {
        if (parte.fieldname === 'foto' && !foto) {
          // toBuffer lanza si la foto pasa del tamaño máximo (lo traduce el manejador de errores).
          foto = { imagen: await parte.toBuffer(), tipoMime: parte.mimetype.toLowerCase() };
        } else {
          parte.file.resume(); // se descarta cualquier otro archivo
        }
      } else if (parte.fieldname === 'hogar_id' && typeof parte.value === 'string') {
        hogarId = parte.value;
      }
    }
    const idLeido = esquemaUuid.safeParse(hogarId);
    if (!idLeido.success) throw datosInvalidos('Falta el identificador del hogar (hogar_id).');
    if (!foto || foto.imagen.length === 0) throw datosInvalidos('Falta la foto de la tira (campo "foto").');
    if (!TIPOS_DE_FOTO.includes(foto.tipoMime)) {
      throw new ErrorHttp(415, 'La foto debe ser JPG, PNG o WebP.');
    }
    const hogar = await exigirHogar(idLeido.data);

    let lectura;
    try {
      lectura = await medicion.leerTira(foto.imagen, foto.tipoMime);
    } catch (error) {
      req.log.error({ err: error }, 'falló la lectura de la tira');
      return { estado: 'no_legible', motivo: MOTIVO_SIN_LECTURA };
    }
    if (lectura.estado !== 'ok') {
      return { estado: 'no_legible', motivo: lectura.motivo || MOTIVO_SIN_LECTURA };
    }
    const revisados = esquemaValores.safeParse(lectura.valores);
    const valores = revisados.success ? limpiarValores(revisados.data) : {};
    if (!hayAlgunaLectura(valores)) {
      return { estado: 'no_legible', motivo: MOTIVO_SIN_LECTURA };
    }
    return { estado: 'ok', medicion: await guardar(hogar, 'foto', valores) };
  });

  app.get('/mediciones/:id', async (req) => {
    const id = esquemaUuid.parse((req.params as { id?: unknown }).id);
    const { rows } = await bd.query('SELECT * FROM mediciones WHERE id = $1', [id]);
    if (!rows[0]) throw noEncontrado('La medición');
    const hogar = await exigirHogar(String(rows[0].hogar_id));
    return filaAMedicion(rows[0], {
      catalogo: await listarCatalogo(bd),
      perfil: perfilDe(hogar),
      filtro: hogar.filtro,
      marcasExcluidas: config.marcasExcluidas,
      diasParaRecambio: medicion.diasParaRecambio,
    });
  });
}
