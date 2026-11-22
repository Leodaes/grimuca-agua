// Esquemas de validación (zod) compartidos por las rutas.
import { z } from 'zod';
import {
  CLAVES_PARAMETRO,
  MOMENTOS_DIA,
  ORIGENES_AGUA,
  SERVICIOS_TECNICOS,
  ULTIMOS_CAMBIOS,
  ZONAS,
  type ClaveParametro,
  type UltimoCambio,
  type MomentoDia,
  type OrigenAgua,
  type ServicioTecnico,
} from '../tipos';
import { normalizarTelefono } from '../telefono';

export const esquemaUuid = z.string().uuid('El identificador no es válido.');
export const esquemaIdHogar = z.object({ id: esquemaUuid });
export const esquemaHogarId = z.object({ hogar_id: esquemaUuid });

const textoCorto = (maximo: number) => z.string().trim().min(1).max(maximo);

/** Vacío o solo espacios cuenta como "sin dato". */
const textoONulo = (maximo: number) =>
  z
    .union([z.string().trim().max(maximo), z.null()])
    .transform((valor) => (valor === null || valor === '' ? null : valor));

function esDiaReal(texto: string): boolean {
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

const esquemaDia = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha va como AAAA-MM-DD.')
  .refine(esDiaReal, 'La fecha no existe.');

const camposHogar = {
  nombre: textoCorto(80),
  zona: z.enum(ZONAS as [string, ...string[]]),
  origen_agua: z.enum(ORIGENES_AGUA as [OrigenAgua, ...OrigenAgua[]]),
  personas: z.number().int().min(1).max(30),
  tiene_filtro: z.boolean(),
  etapas_filtro: z.number().int().min(1).max(12).nullable(),
  fecha_ultimo_cambio: esquemaDia.nullable(),
  agua_turbia: z.boolean(),
  // Se guarda siempre en formato internacional sin espacios (+584145550199): misma regla que el front (telefono.ts).
  whatsapp: z
    .string()
    .trim()
    .max(30, 'El número de WhatsApp es demasiado largo.')
    .transform((valor, ctx) => {
      const resultado = normalizarTelefono(valor);
      if (!resultado.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
        return z.NEVER;
      }
      return resultado.numero;
    }),
  direccion: textoONulo(200),
  tienda_id: textoONulo(40),
  urbanizacion: textoONulo(80),
  mascotas: z.boolean(),
  ultimo_cambio: z.enum(ULTIMOS_CAMBIOS as [UltimoCambio, ...UltimoCambio[]]).nullable(),
};

export const esquemaCrearHogar = z.object({
  nombre: camposHogar.nombre,
  zona: camposHogar.zona,
  origen_agua: camposHogar.origen_agua,
  personas: camposHogar.personas,
  tiene_filtro: camposHogar.tiene_filtro.default(false),
  etapas_filtro: camposHogar.etapas_filtro.optional(),
  fecha_ultimo_cambio: camposHogar.fecha_ultimo_cambio.optional(),
  agua_turbia: camposHogar.agua_turbia.default(false),
  whatsapp: camposHogar.whatsapp,
  direccion: camposHogar.direccion.optional(),
  tienda_id: camposHogar.tienda_id.optional(),
  urbanizacion: camposHogar.urbanizacion.optional(),
  mascotas: camposHogar.mascotas.default(false),
  ultimo_cambio: camposHogar.ultimo_cambio.optional(),
  consentimiento: z.literal(true, {
    errorMap: () => ({ message: 'Hace falta aceptar el aviso de privacidad para continuar.' }),
  }),
});

export const esquemaCambiarHogar = z
  .object({
    nombre: camposHogar.nombre,
    zona: camposHogar.zona,
    origen_agua: camposHogar.origen_agua,
    personas: camposHogar.personas,
    tiene_filtro: camposHogar.tiene_filtro,
    etapas_filtro: camposHogar.etapas_filtro,
    fecha_ultimo_cambio: camposHogar.fecha_ultimo_cambio,
    agua_turbia: camposHogar.agua_turbia,
    whatsapp: camposHogar.whatsapp,
    direccion: camposHogar.direccion,
    tienda_id: camposHogar.tienda_id,
    urbanizacion: camposHogar.urbanizacion,
    mascotas: camposHogar.mascotas,
    ultimo_cambio: camposHogar.ultimo_cambio,
    ultimo_cartucho: textoONulo(120),
  })
  .partial();

const valorCasilla = z.number().finite().min(0).max(100_000).nullable().optional();

/** Valores de la tira: solo las claves conocidas; lo demás se descarta. */
export const esquemaValores = z.object(
  Object.fromEntries(CLAVES_PARAMETRO.map((clave) => [clave, valorCasilla])) as Record<
    ClaveParametro,
    typeof valorCasilla
  >,
);

export const esquemaMedicionManual = z.object({
  hogar_id: esquemaUuid,
  valores: esquemaValores,
});

export const esquemaCrearPedido = z.object({
  hogar_id: esquemaUuid,
  tipo: z.enum(['sobre', 'cartucho', 'servicio']),
  cartucho_codigo: textoONulo(60).optional(),
  cantidad: z.number().int().min(1).max(50).default(1),
  modalidad: z.enum(['retiro', 'envio']),
  direccion: textoONulo(200).optional(),
  tienda_id: textoCorto(40),
  // Solo para tipo 'servicio' (la ruta exige `servicio` y `fecha_preferida`).
  servicio: z.enum(SERVICIOS_TECNICOS as [ServicioTecnico, ...ServicioTecnico[]]).nullable().optional(),
  fecha_preferida: esquemaDia.nullable().optional(),
  momento: z.enum(MOMENTOS_DIA as [MomentoDia, ...MomentoDia[]]).nullable().optional(),
  nota: textoONulo(300).optional(),
});

export const esquemaIdPedido = z.object({ id: z.coerce.number().int().positive().max(2_147_483_647) });

export const esquemaReporteBacterias = z.object({ resultado: z.enum(['cambio', 'sin_cambio']) });
