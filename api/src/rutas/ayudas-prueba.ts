// Utilidades para las pruebas: base en memoria con las migraciones reales, catálogo de prueba y dobles de medición.
// No se usa fuera de los archivos *.test.ts.
import { randomUUID } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import type { FastifyInstance } from 'fastify';
import { crearApp, type ConfigApp, type Medidor, type OpcionesApp } from '../app';
import type { Bd } from '../bd';
import { crearCanalLocal, type CanalEventos } from '../eventos';
import { migrar } from '../migrar';
import type { Evaluacion, EventoAgua, LecturaTira, Nivel, ParametroTira, ResultadoParametro } from '../tipos';

export const PIN_PRUEBA = '2468';
export const SECRETO_PRUEBA = 'secreto-solo-para-pruebas-0123456789';

export const CONFIG_PRUEBA: ConfigApp = {
  pinOperador: PIN_PRUEBA,
  secretoSesion: SECRETO_PRUEBA,
  version: 'prueba',
  marcasExcluidas: [],
};

/** Base de datos en memoria, vacía. */
export function crearBdVacia(): Bd {
  const memoria = newDb();
  memoria.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID(),
    impure: true,
  });
  const { Pool } = memoria.adapters.createPg();
  return new Pool() as Bd;
}

/** Base en memoria con todas las migraciones de `db/migraciones` aplicadas. */
export async function crearBdDePrueba(): Promise<Bd> {
  const bd = crearBdVacia();
  await migrar(bd);
  return bd;
}

export interface CartuchoDePrueba {
  codigo: string;
  nombre: string;
  corrige: string[];
  categoria: string;
  recomendable?: boolean;
  disponible?: boolean;
  marca?: string;
}

/** Catálogo propio de las pruebas (no depende de db/semilla_cartuchos.sql). */
export const CATALOGO_PRUEBA: CartuchoDePrueba[] = [
  { codigo: 'PR-SED', nombre: 'Cartucho de sedimentos de prueba', corrige: ['sedimentos'], categoria: 'cartucho' },
  { codigo: 'PR-CARBON', nombre: 'Cartucho de carbón de prueba', corrige: ['cloro_libre', 'sabor_olor'], categoria: 'cartucho' },
  { codigo: 'PR-RESINA', nombre: 'Cartucho de resina de prueba', corrige: ['dureza'], categoria: 'cartucho' },
  { codigo: 'PR-FILTRO', nombre: 'Filtro de dos etapas de prueba', corrige: ['sedimentos', 'cloro_libre'], categoria: 'filtro' },
  {
    codigo: 'PR-OSMOSIS',
    nombre: 'Ósmosis inversa de prueba',
    corrige: ['nitrato', 'nitrito', 'plomo', 'cobre', 'dureza', 'sedimentos', 'cloro_libre'],
    categoria: 'sistema_osmosis_inversa',
  },
  { codigo: 'PR-UV', nombre: 'Lámpara UV de prueba', corrige: ['bacterias'], categoria: 'lampara_uv' },
  { codigo: 'PR-REPUESTO', nombre: 'Repuesto de prueba', corrige: ['sedimentos'], categoria: 'repuesto', recomendable: false },
  { codigo: 'PR-AGOTADO', nombre: 'Cartucho agotado de prueba', corrige: ['nitrato', 'sedimentos'], categoria: 'cartucho', disponible: false },
];

export async function insertarCartuchos(bd: Bd, cartuchos: CartuchoDePrueba[] = CATALOGO_PRUEBA): Promise<void> {
  for (const c of cartuchos) {
    const corrige = c.corrige.length > 0 ? `ARRAY[${c.corrige.map((clave) => `'${clave}'`).join(', ')}]` : `'{}'`;
    await bd.query(
      `INSERT INTO cartuchos (codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, vida_util_meses,
                              categoria, recomendable, url_producto, disponible)
       VALUES ($1, $2, $3, NULL, ${corrige}, false, NULL, 6, $4, $5, NULL, $6)`,
      [c.codigo, c.nombre, c.marca ?? 'Marca de prueba', c.categoria, c.recomendable ?? true, c.disponible ?? true],
    );
  }
}

export const TIRA_PRUEBA: ParametroTira[] = [
  { clave: 'ph', nombre: 'pH', unidad: '', niveles: [6.2, 6.8, 7.2, 7.6, 8.4], orientativo: false },
  { clave: 'nitrato', nombre: 'Nitrato', unidad: 'mg/L', niveles: [0, 10, 25, 50, 100], orientativo: false },
  { clave: 'dureza', nombre: 'Dureza', unidad: 'mg/L', niveles: [0, 50, 120, 250, 425], orientativo: false },
  { clave: 'plomo', nombre: 'Plomo', unidad: 'ppb', niveles: [0, 5, 15, 30], orientativo: true },
];

/**
 * Doble del módulo de medición con reglas mínimas:
 * nitrato ≥ 50 → rojo; dureza ≥ 250 → amarillo; lo demás verde; casilla sin número → sin_dato.
 */
export function crearMedidorDoble(lectura?: () => Promise<LecturaTira>): Medidor & { fotos: Array<{ bytes: number; tipoMime: string }> } {
  const gravedad: Record<Nivel, number> = { sin_dato: 0, verde: 1, amarillo: 2, rojo: 3 };
  const fotos: Array<{ bytes: number; tipoMime: string }> = [];
  return {
    fotos,
    tira: TIRA_PRUEBA,
    async leerTira(imagen, tipoMime) {
      fotos.push({ bytes: imagen.length, tipoMime });
      return lectura ? lectura() : { estado: 'ok', valores: { ph: 7.2, nitrato: 10, dureza: 50, plomo: null } };
    },
    evaluarAgua(valores, perfil): Evaluacion {
      const corrige: string[] = [];
      const porParametro: ResultadoParametro[] = TIRA_PRUEBA.map((p) => {
        const valor = valores[p.clave];
        let nivel: Nivel = 'verde';
        if (typeof valor !== 'number') nivel = 'sin_dato';
        else if (p.clave === 'nitrato' && valor >= 50) nivel = 'rojo';
        else if (p.clave === 'dureza' && valor >= 250) nivel = 'amarillo';
        if (nivel === 'rojo' || nivel === 'amarillo') corrige.push(p.clave);
        return {
          clave: p.clave,
          nombre: p.nombre,
          unidad: p.unidad,
          valor: typeof valor === 'number' ? valor : null,
          nivel,
          frase: nivel === 'verde' ? 'Esta medida salió dentro de lo esperado.' : `Revisa ${p.nombre}.`,
          orientativo: p.orientativo,
        };
      });
      if (perfil?.agua_turbia) corrige.push('sedimentos');
      if (perfil && ['pozo', 'tanque'].includes(perfil.origen_agua)) corrige.push('bacterias');
      const semaforo = porParametro.reduce<Nivel>((peor, p) => (gravedad[p.nivel] > gravedad[peor] ? p.nivel : peor), 'sin_dato');
      return {
        semaforo,
        porParametro,
        hallazgos: porParametro.filter((p) => p.nivel === 'rojo' || p.nivel === 'amarillo').map((p) => p.frase),
        corrige,
        diasParaRecambio: null,
      };
    },
    diasParaRecambio(perfil) {
      return perfil.tiene_filtro && perfil.fecha_ultimo_cambio ? 42 : null;
    },
  };
}

export interface Entorno {
  app: FastifyInstance;
  bd: Bd;
  eventos: CanalEventos;
  medicion: ReturnType<typeof crearMedidorDoble>;
  /** Eventos publicados desde que se creó el entorno. */
  emitidos: EventoAgua[];
  /** Cabecera con un token válido de operador. */
  entrarComoOperador(): Promise<{ authorization: string }>;
}

export async function crearEntorno(opciones: Partial<OpcionesApp> & { lectura?: () => Promise<LecturaTira> } = {}): Promise<Entorno> {
  const bd = opciones.bd ?? (await crearBdDePrueba());
  if (!opciones.bd) await insertarCartuchos(bd);
  const eventos = opciones.eventos ?? crearCanalLocal();
  const emitidos: EventoAgua[] = [];
  eventos.suscribir((evento) => emitidos.push(evento));
  const medicion = crearMedidorDoble(opciones.lectura);
  const app = await crearApp({
    bd,
    config: opciones.config ?? CONFIG_PRUEBA,
    medicion: opciones.medicion ?? medicion,
    eventos,
    dirEstaticos: opciones.dirEstaticos,
    conLogistica: opciones.conLogistica ?? false,
  });
  await app.ready();
  return {
    app,
    bd,
    eventos,
    medicion,
    emitidos,
    async entrarComoOperador() {
      const respuesta = await app.inject({ method: 'POST', url: '/api/operador/entrar', payload: { pin: PIN_PRUEBA } });
      return { authorization: `Bearer ${respuesta.json().token}` };
    },
  };
}

/** Perfil válido para POST /api/hogares. */
export function perfilDePrueba(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nombre: 'Hogar de prueba',
    zona: 'Naguanagua',
    origen_agua: 'chorro',
    personas: 4,
    tiene_filtro: false,
    agua_turbia: false,
    whatsapp: '04145550199',
    consentimiento: true,
    ...cambios,
  };
}

/** Cuerpo multipart armado a mano para `app.inject`. */
export function formularioFoto(campos: Record<string, string>, foto?: { nombre: string; tipo: string; datos: Buffer }) {
  const limite = `----prueba${randomUUID().replace(/-/g, '')}`;
  const partes: Buffer[] = [];
  for (const [nombre, valor] of Object.entries(campos)) {
    partes.push(Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="${nombre}"\r\n\r\n${valor}\r\n`));
  }
  if (foto) {
    partes.push(
      Buffer.from(
        `--${limite}\r\nContent-Disposition: form-data; name="foto"; filename="${foto.nombre}"\r\nContent-Type: ${foto.tipo}\r\n\r\n`,
      ),
      foto.datos,
      Buffer.from('\r\n'),
    );
  }
  partes.push(Buffer.from(`--${limite}--\r\n`));
  return { payload: Buffer.concat(partes), headers: { 'content-type': `multipart/form-data; boundary=${limite}` } };
}
