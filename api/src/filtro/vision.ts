// Llamada mínima al servicio de visión para identificar el filtro del hogar.
// Misma configuración que el lector de la tira (api/src/medicion/lector.ts), solo por variables de entorno:
//   VISION_API_URL, VISION_API_KEY, VISION_MODELO, VISION_CABECERAS (JSON), VISION_FORZAR_HERRAMIENTA=1,
//   LECTOR_SIMULADO=1 (o sin clave) → no llama a nadie.
// No cambia el comportamiento de lector.ts: es una copia acotada de su forma de llamar.
import { z } from 'zod';

export const TIEMPO_LIMITE_MS = 40_000;
const MAXIMO_TOKENS = 4096;
export const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface Herramienta {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface PeticionVision {
  instrucciones: string;
  texto: string;
  imagen: Buffer;
  tipoMime: string;
  herramienta: Herramienta;
}

export type RespuestaVision =
  | { estado: 'ok'; entrada: unknown }
  | { estado: 'error'; causa: string };

/** true cuando no se debe llamar al servicio (demo y pruebas sin red). */
export function visionSimulada(): boolean {
  return process.env.LECTOR_SIMULADO === '1' || !process.env.VISION_API_KEY;
}

function cabecerasExtra(): Record<string, string> {
  try {
    const crudo = process.env.VISION_CABECERAS;
    return crudo ? (JSON.parse(crudo) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function construirCuerpo(peticion: PeticionVision, modelo: string) {
  const forzar = process.env.VISION_FORZAR_HERRAMIENTA === '1';
  return {
    model: modelo,
    max_tokens: MAXIMO_TOKENS,
    system: peticion.instrucciones,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: peticion.tipoMime, data: peticion.imagen.toString('base64') },
          },
          { type: 'text', text: peticion.texto },
        ],
      },
    ],
    tools: [peticion.herramienta],
    tool_choice: forzar ? { type: 'tool', name: peticion.herramienta.name } : { type: 'auto' },
  };
}

const esquemaRespuesta = z.object({
  content: z.array(z.object({ type: z.string() }).passthrough()),
});

/** Saca la entrada de la herramienta de la respuesta cruda del servicio. */
export function entradaDeHerramienta(cuerpo: unknown, nombre: string): RespuestaVision {
  const respuesta = esquemaRespuesta.safeParse(cuerpo);
  if (!respuesta.success) return { estado: 'error', causa: 'respuesta mal formada' };
  const bloque = respuesta.data.content.find((b) => b.type === 'tool_use' && b.name === nombre);
  if (!bloque) return { estado: 'error', causa: 'sin herramienta' };
  return { estado: 'ok', entrada: (bloque as { input?: unknown }).input };
}

/** Llama al servicio con tiempo límite. Nunca lanza: los fallos vuelven como `{ estado: 'error' }`. */
export async function llamarVision(peticion: PeticionVision): Promise<RespuestaVision> {
  const clave = process.env.VISION_API_KEY;
  const url = process.env.VISION_API_URL;
  const modelo = process.env.VISION_MODELO;
  if (!clave || !url || !modelo) return { estado: 'error', causa: 'falta configuración' };

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': clave, ...cabecerasExtra(), 'content-type': 'application/json' },
      body: JSON.stringify(construirCuerpo(peticion, modelo)),
      signal: control.signal,
    });
    if (!respuesta.ok) return { estado: 'error', causa: `estado ${respuesta.status}` };
    return entradaDeHerramienta(await respuesta.json(), peticion.herramienta.name);
  } catch (error) {
    const causa = control.signal.aborted ? 'tiempo agotado' : error instanceof Error ? error.name : 'error';
    return { estado: 'error', causa };
  } finally {
    clearTimeout(reloj);
  }
}
