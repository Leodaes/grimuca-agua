// Filtro del hogar: identificación por foto, carga manual y cartuchos que necesita.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aJson } from '../bd';
import {
  cartuchosParaFiltro,
  equiposDelCatalogo,
  esEquipo,
  etapasDelNombre,
  filaAFiltro,
  identificarFiltro,
  medidaEstandar,
  type DetalleFiltro,
} from '../filtro';
import {
  MEDIDAS_CARTUCHO,
  TIPOS_FILTRO,
  type Evaluacion,
  type FiltroHogar,
  type Hogar,
  type MedidaCartucho,
  type RespuestaFiltro,
  type ResultadoFotoFiltro,
  type TipoFiltro,
} from '../tipos';
import { buscarHogar, listarCatalogo, type CartuchoCatalogo } from './datos';
import { datosInvalidos, ErrorHttp, noEncontrado } from './errores';
import { esquemaIdHogar } from './esquemas';
import { catalogoDelHogar } from './plataforma';

const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MOTIVO_SIN_IDENTIFICAR = 'No pudimos mirar la foto. Intenta de nuevo o carga tu filtro a mano.';

const esquemaFiltroManual = z.object({
  tipo: z.enum(TIPOS_FILTRO as [TipoFiltro, ...TipoFiltro[]]),
  etapas: z.number().int().min(1).max(12).nullable().optional(),
  medida: z
    .enum(MEDIDAS_CARTUCHO as [MedidaCartucho, ...MedidaCartucho[]])
    .nullable()
    .optional(),
  modelo_codigo: z.string().trim().max(60).nullable().optional(),
  // Al confirmar lo identificado en la foto ("Sí, es este"): origen 'foto' y lo que se leyó en la etiqueta.
  origen: z.enum(['foto', 'manual']).optional(),
  detalle: z
    .object({
      marca_visible: z.string().trim().max(120).nullable().optional(),
      modelo_visible: z.string().trim().max(120).nullable().optional(),
      confianza: z.enum(['alta', 'media', 'baja']).nullable().optional(),
      observaciones: z.string().trim().max(500).nullable().optional(),
    })
    .nullable()
    .optional(),
});

interface DatosFiltro {
  tipo: TipoFiltro;
  etapas: number | null;
  medida: MedidaCartucho | null;
  modelo_codigo: string | null;
  origen: 'foto' | 'manual';
  detalle: DetalleFiltro;
}

export async function rutasFiltro(app: FastifyInstance): Promise<void> {
  const { bd } = app.contexto;

  async function exigirHogar(id: string): Promise<Hogar> {
    const hogar = await buscarHogar(bd, id);
    if (!hogar) throw noEncontrado('El hogar');
    return hogar;
  }

  /** Claves que pidió corregir la medición más reciente del hogar (para ordenar los cartuchos). */
  async function corrigeReciente(hogarId: string): Promise<string[]> {
    const { rows } = await bd.query(
      'SELECT evaluacion FROM mediciones WHERE hogar_id = $1 ORDER BY fecha DESC LIMIT 1',
      [hogarId],
    );
    const evaluacion = rows[0] ? aJson<Partial<Evaluacion> | null>(rows[0].evaluacion) : null;
    return Array.isArray(evaluacion?.corrige) ? evaluacion.corrige.map(String) : [];
  }

  /** `filtro`: el que se muestra (por defecto, el guardado en el hogar). */
  async function responder(
    hogar: Hogar,
    catalogo?: CartuchoCatalogo[],
    filtro: FiltroHogar | null = hogar.filtro ?? null,
  ): Promise<RespuestaFiltro> {
    if (!filtro) return { filtro: null, cartuchos: [] };
    const [productos, corrige] = await Promise.all([
      catalogo ? Promise.resolve(catalogo) : catalogoDelHogar(bd, hogar),
      corrigeReciente(hogar.id),
    ]);
    return { filtro, cartuchos: cartuchosParaFiltro(filtro, productos, corrige) };
  }

  /** El filtro tal como quedaría guardado, sin escribirlo en el hogar. */
  function aFiltroHogar(datos: DatosFiltro): FiltroHogar | null {
    return filaAFiltro({
      tiene_filtro: true,
      filtro_tipo: datos.tipo,
      etapas_filtro: datos.etapas,
      filtro_medida: datos.medida,
      filtro_modelo_codigo: datos.modelo_codigo,
      filtro_detalle: datos.detalle,
      filtro_origen: datos.origen,
    });
  }

  /** Con un modelo del catálogo, completa la medida y las etapas que falten a partir de su nombre. */
  function completarConModelo(datos: DatosFiltro, catalogo: CartuchoCatalogo[]): DatosFiltro {
    const modelo = datos.modelo_codigo ? catalogo.find((p) => p.codigo === datos.modelo_codigo) : undefined;
    if (!modelo) return { ...datos, modelo_codigo: null, detalle: { ...datos.detalle, modelo_nombre: null } };
    return {
      ...datos,
      medida: datos.medida ?? medidaEstandar(modelo.nombre),
      etapas: datos.etapas ?? etapasDelNombre(modelo.nombre),
      detalle: { ...datos.detalle, modelo_nombre: modelo.nombre },
    };
  }

  async function guardar(hogarId: string, datos: DatosFiltro): Promise<Hogar> {
    const { rows } = await bd.query(
      `UPDATE hogares
          SET tiene_filtro = true, filtro_tipo = $1, etapas_filtro = $2, filtro_medida = $3,
              filtro_modelo_codigo = $4, filtro_detalle = $5::jsonb, filtro_origen = $6
        WHERE id = $7
        RETURNING id`,
      [
        datos.tipo,
        datos.etapas,
        datos.medida,
        datos.modelo_codigo,
        JSON.stringify(datos.detalle),
        datos.origen,
        hogarId,
      ],
    );
    if (!rows[0]) throw noEncontrado('El hogar');
    return exigirHogar(hogarId);
  }

  app.get('/filtros/modelos', async () => equiposDelCatalogo(await listarCatalogo(bd)));

  app.get('/hogares/:id/filtro', async (req): Promise<RespuestaFiltro> => {
    const { id } = esquemaIdHogar.parse(req.params);
    return responder(await exigirHogar(id));
  });

  app.put('/hogares/:id/filtro', async (req): Promise<RespuestaFiltro> => {
    const { id } = esquemaIdHogar.parse(req.params);
    const entrada = esquemaFiltroManual.parse(req.body ?? {});
    const hogar = await exigirHogar(id);
    const catalogo = await catalogoDelHogar(bd, hogar);

    const codigo = entrada.modelo_codigo || null;
    if (codigo) {
      const modelo = catalogo.find((p) => p.codigo === codigo);
      if (!modelo || !esEquipo(modelo)) throw datosInvalidos('Ese modelo no está en el catálogo.');
    }
    const actual: FiltroHogar | null = hogar.filtro ?? null;
    const datos = completarConModelo(
      {
        tipo: entrada.tipo,
        etapas: entrada.etapas ?? null,
        medida: entrada.medida ?? null,
        modelo_codigo: codigo,
        origen: 'manual',
        detalle: {},
      },
      catalogo,
    );
    if (entrada.origen === 'foto') {
      // "Sí, es este": confirma lo identificado en la foto (que no se guardó al identificarlo).
      const leido = entrada.detalle ?? {};
      datos.origen = 'foto';
      datos.detalle = {
        modelo_nombre: datos.detalle.modelo_nombre ?? null,
        marca_visible: leido.marca_visible ?? null,
        modelo_visible: leido.modelo_visible ?? null,
        confianza: leido.confianza ?? null,
        observaciones: leido.observaciones ?? null,
      };
      return responder(await guardar(id, datos), catalogo);
    }
    // Si solo confirma lo que ya estaba guardado desde una foto, se conserva el origen y lo leído en la etiqueta.
    const confirma =
      actual?.origen === 'foto' &&
      actual.tipo === datos.tipo &&
      actual.etapas === datos.etapas &&
      actual.medida === datos.medida &&
      actual.modelo_codigo === datos.modelo_codigo;
    if (confirma && actual) {
      datos.origen = 'foto';
      datos.detalle = {
        modelo_nombre: actual.modelo_nombre,
        marca_visible: actual.marca_visible,
        modelo_visible: actual.modelo_visible,
        confianza: actual.confianza,
        observaciones: actual.observaciones,
      };
    }
    return responder(await guardar(id, datos), catalogo);
  });

  app.post('/hogares/:id/filtro/foto', async (req): Promise<ResultadoFotoFiltro> => {
    const { id } = esquemaIdHogar.parse(req.params);
    if (!req.isMultipart()) {
      throw new ErrorHttp(415, 'Envía la foto como formulario (multipart/form-data).');
    }
    let foto: { imagen: Buffer; tipoMime: string } | null = null;
    for await (const parte of req.parts()) {
      if (parte.type !== 'file') continue;
      if (parte.fieldname === 'foto' && !foto) {
        // toBuffer lanza si la foto pasa del tamaño máximo (lo traduce el manejador de errores).
        foto = { imagen: await parte.toBuffer(), tipoMime: parte.mimetype.toLowerCase() };
      } else {
        parte.file.resume();
      }
    }
    if (!foto || foto.imagen.length === 0) throw datosInvalidos('Falta la foto del filtro (campo "foto").');
    if (!TIPOS_DE_FOTO.includes(foto.tipoMime)) throw new ErrorHttp(415, 'La foto debe ser JPG, PNG o WebP.');
    const hogar = await exigirHogar(id);
    // Por defecto solo identifica: se guarda cuando el cliente confirma ("Sí, es este" → PUT con origen 'foto').
    // `?guardar=1` guarda de una vez (comportamiento anterior).
    const guardarYa = (req.query as { guardar?: unknown } | undefined)?.guardar === '1';

    const catalogo = await catalogoDelHogar(bd, hogar);
    let resultado;
    try {
      resultado = await identificarFiltro(foto.imagen, foto.tipoMime, equiposDelCatalogo(catalogo));
    } catch (error) {
      req.log.error({ err: error }, 'falló la identificación del filtro');
      return { estado: 'no_identificado', motivo: MOTIVO_SIN_IDENTIFICAR };
    }
    if (resultado.estado !== 'ok') {
      return { estado: 'no_identificado', motivo: resultado.motivo || MOTIVO_SIN_IDENTIFICAR };
    }
    const visto = resultado.filtro;
    const datos = completarConModelo(
      {
        tipo: visto.tipo,
        etapas: visto.etapas,
        medida: visto.medida,
        modelo_codigo: visto.codigo_catalogo,
        origen: 'foto',
        detalle: {
          marca_visible: visto.marca_visible,
          modelo_visible: visto.modelo_visible,
          confianza: visto.confianza,
          observaciones: visto.observaciones,
        },
      },
      catalogo,
    );
    const respuesta = guardarYa
      ? await responder(await guardar(id, datos), catalogo)
      : await responder(hogar, catalogo, aFiltroHogar(datos));
    if (!respuesta.filtro) return { estado: 'no_identificado', motivo: MOTIVO_SIN_IDENTIFICAR };
    return { estado: 'ok', filtro: respuesta.filtro, cartuchos: respuesta.cartuchos };
  });
}
