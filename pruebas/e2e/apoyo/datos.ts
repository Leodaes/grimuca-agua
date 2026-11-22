import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Datos inventados y llamadas directas a la API (según docs/decisiones/contrato-api.md).
 * Todo lo que crean las pruebas lleva el nombre "Prueba Calidad <marca>" para poder
 * encontrarlo y borrarlo de la base antes de la demo.
 */

/** PIN del operador: solo desde el entorno, nunca escrito en el repositorio. */
export const PIN_OPERADOR = (process.env.PIN_OPERADOR ?? '').trim();
export const SIN_PIN =
  'Falta la variable de entorno PIN_OPERADOR: se saltan las pruebas del operador. ' +
  'Córrelas con PIN_OPERADOR=<el PIN de agua.env> npm run e2e';

/** Con SOLO_LECTURA=1 no se crea nada en la base. */
export const SOLO_LECTURA = process.env.SOLO_LECTURA === '1';
export const AVISO_SOLO_LECTURA =
  'SOLO_LECTURA=1: se saltan las pruebas que crean hogares, mediciones o pedidos.';

export const PREFIJO_NOMBRE = 'Prueba Calidad';

/** Aviso fijo del resultado: literal, no se reescribe. */
export const AVISO_FIJO =
  'Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';

/** Palabra que la app nunca puede mostrar. */
export const PALABRA_PROHIBIDA = /potable/i;

export interface ParametroTira {
  clave: string;
  nombre: string;
  unidad: string;
  niveles: number[];
  orientativo: boolean;
}

/** Marca corta y única para reconocer lo que creó cada prueba. */
export function marca(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`.toUpperCase();
}

function haceDias(dias: number): string {
  const fecha = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  return fecha.toISOString().slice(0, 10);
}

/** Perfil de hogar inventado. Ningún dato corresponde a una persona real. */
export function hogarInventado(m: string = marca(), cambios: Record<string, unknown> = {}) {
  return {
    nombre: `${PREFIJO_NOMBRE} ${m}`,
    zona: 'Naguanagua',
    origen_agua: 'tanque',
    personas: 4,
    tiene_filtro: true,
    etapas_filtro: 3,
    fecha_ultimo_cambio: haceDias(100),
    agua_turbia: true,
    whatsapp: '04120000000',
    direccion: `Calle Inventada ${m}, casa 00, sector de prueba`,
    tienda_id: 'manongo',
    consentimiento: true,
    ...cambios,
  };
}

async function resumen(respuesta: APIResponse): Promise<string> {
  const cuerpo = await respuesta.text().catch(() => '');
  return `${respuesta.status()} ${cuerpo.replace(/\s+/g, ' ').slice(0, 200)}`;
}

export async function crearHogar(api: APIRequestContext, cambios: Record<string, unknown> = {}, m?: string) {
  const respuesta = await api.post('/api/hogares', { data: hogarInventado(m, cambios) });
  expect(respuesta.status(), `POST /api/hogares respondió ${await resumen(respuesta)}`).toBe(201);
  return respuesta.json();
}

export async function obtenerTira(api: APIRequestContext): Promise<ParametroTira[]> {
  const respuesta = await api.get('/api/config/tira');
  expect(respuesta.status(), `GET /api/config/tira respondió ${await resumen(respuesta)}`).toBe(200);
  return respuesta.json();
}

/** Cortes de rojo por parámetro (docs/negocio/agua.md). Sirven para escoger una casilla que dé rojo. */
const DA_ROJO: Record<string, (valor: number) => boolean> = {
  nitrato: (v) => v >= 50,
  cloro_libre: (v) => v > 4,
  dureza: (v) => v > 300,
  nitrito: (v) => v > 3,
  plomo: (v) => v > 10,
  cobre: (v) => v > 1.3,
  hierro: (v) => v >= 3,
};
const ORDEN_ROJO = ['nitrato', 'cloro_libre', 'dureza', 'nitrito', 'plomo', 'cobre', 'hierro'];

/** Valor "tranquilo" de cada casilla; se usa el nivel de la tira que quede más cerca. */
const VALOR_EN_RANGO: Record<string, number> = {
  alcalinidad: 120,
  dureza: 50,
  cobre: 0,
  nitrato: 0,
  cloro_libre: 0.5,
  plomo: 0,
  ph: 7.2,
  nitrito: 0,
  hierro: 0,
};

export interface PlanDeValores {
  /** Nivel escogido por clave de parámetro. */
  valores: Record<string, number>;
  /** Parámetro que debe salir en rojo (nitrato 50 si la tira lo trae). */
  claveRoja: string | null;
}

/**
 * Escoge un nivel por cada casilla de la tira configurada: una en rojo y el resto en rango.
 * La tira es intercambiable, así que no se asume que traiga nitrato.
 */
export function planDeValores(tira: ParametroTira[]): PlanDeValores {
  const conNiveles = tira.filter((p) => Array.isArray(p.niveles) && p.niveles.length > 0);
  const claveRoja =
    ORDEN_ROJO.find((clave) => conNiveles.some((p) => p.clave === clave && p.niveles.some(DA_ROJO[clave]))) ?? null;

  const valores: Record<string, number> = {};
  for (const parametro of conNiveles) {
    if (parametro.clave === claveRoja) {
      valores[parametro.clave] = Math.min(...parametro.niveles.filter(DA_ROJO[parametro.clave]));
      continue;
    }
    const objetivo = VALOR_EN_RANGO[parametro.clave] ?? parametro.niveles[0];
    valores[parametro.clave] = parametro.niveles.reduce((mejor, nivel) =>
      Math.abs(nivel - objetivo) < Math.abs(mejor - objetivo) ? nivel : mejor,
    );
  }
  return { valores, claveRoja };
}

export async function medirManual(api: APIRequestContext, hogarId: string, valores: Record<string, number | null>) {
  const respuesta = await api.post('/api/mediciones/manual', { data: { hogar_id: hogarId, valores } });
  expect(respuesta.status(), `POST /api/mediciones/manual respondió ${await resumen(respuesta)}`).toBe(201);
  return respuesta.json();
}

export async function crearPedido(api: APIRequestContext, datos: Record<string, unknown>) {
  const respuesta = await api.post('/api/pedidos', { data: datos });
  expect(respuesta.status(), `POST /api/pedidos respondió ${await resumen(respuesta)}`).toBe(201);
  return respuesta.json();
}

/** Código y nombre del primer cartucho del catálogo, o null si no hay ninguno. */
export async function primerCartucho(api: APIRequestContext): Promise<{ codigo: string; nombre: string } | null> {
  const respuesta = await api.get('/api/cartuchos');
  if (!respuesta.ok()) return null;
  const cartuchos = await respuesta.json();
  return Array.isArray(cartuchos) && cartuchos.length > 0
    ? { codigo: cartuchos[0].codigo, nombre: cartuchos[0].nombre }
    : null;
}

/** Entra como operador por la API y devuelve el token. No lo imprimas ni lo adjuntes. */
export async function entrarOperador(api: APIRequestContext): Promise<string> {
  const respuesta = await api.post('/api/operador/entrar', { data: { pin: PIN_OPERADOR } });
  expect(respuesta.status(), 'POST /api/operador/entrar con el PIN del entorno debe responder 200').toBe(200);
  const { token } = await respuesta.json();
  expect(typeof token === 'string' && token.length > 0, 'La respuesta de entrar debe traer un token').toBe(true);
  return token;
}

export function cabeceraOperador(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface ClienteDePrueba {
  hogar: any;
  medicion: any;
  pedido: any;
  claveRoja: string | null;
}

/**
 * Deja listo un cliente completo por la API: hogar, una medición manual con una casilla en rojo
 * y un pedido de cartucho con retiro en Mañongo (o de sobre, si el catálogo está vacío).
 */
export async function prepararCliente(api: APIRequestContext): Promise<ClienteDePrueba> {
  const hogar = await crearHogar(api);
  const tira = await obtenerTira(api);
  const plan = planDeValores(tira);
  const medicion = await medirManual(api, hogar.id, plan.valores);
  const cartucho = medicion.sugeridos?.[0] ?? (await primerCartucho(api));
  const pedido = await crearPedido(api, cartucho
    ? { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: cartucho.codigo, cantidad: 1, modalidad: 'retiro', tienda_id: 'manongo' }
    : { hogar_id: hogar.id, tipo: 'sobre', modalidad: 'envio', direccion: hogar.direccion, tienda_id: 'manongo' });
  return { hogar, medicion, pedido, claveRoja: plan.claveRoja };
}
