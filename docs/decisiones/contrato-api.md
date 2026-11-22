# Contrato entre módulos

Este documento es el acuerdo entre los equipos de Plataforma, Medición, Cliente y Operador. Si algo no está aquí, decide quien sea dueño de la carpeta y lo anota al final, en "Cambios".

## Reglas de trabajo

- Monorepo con espacios de trabajo de npm: `api/` y `app/`. Las dependencias ya están instaladas. **Nadie ejecuta `npm install`**: si falta una librería, se resuelve sin ella o se avisa al orquestador.
- Node no está en el PATH del sistema. En Bash: `export PATH="/c/Users/lede4/Valenhack/herramientas/node:$PATH"`. En PowerShell: `$env:Path = "C:\Users\lede4\Valenhack\herramientas\node;" + $env:Path`.
- Comandos: `npm run test -w api`, `npm run test -w app`, `npm run revisar -w api` (tipos), `npm run revisar -w app`, `npm run build` (front).
- No hay Docker ni Postgres en la PC de desarrollo. Las pruebas de la API usan `pg-mem` o dobles; nunca dependen de una base real.
- La API corre con `tsx` (sin compilar). TypeScript con `moduleResolution: Bundler`: imports sin extensión.
- Todo en español: nombres de archivos, variables, rutas y textos. Sin menciones de proveedores ni modelos de IA en el código: el servicio de visión se configura por variables de entorno.
- Nadie usa git; el orquestador integra y hace los commits.
- La palabra "potable" no aparece en ningún texto visible.

## Territorios

| Carpeta | Dueño |
|---|---|
| `api/src/*.ts` (raíz: `servidor.ts`, `app.ts`, `bd.ts`, `config.ts`, `migrar.ts`, `tipos.ts`), `api/src/rutas/`, `db/`, `app/src/lib/` | Plataforma |
| `api/src/medicion/`, `app/src/features/medicion/` | Medición |
| `app/src/features/alta/`, `resultado/`, `pedido/` | Cliente |
| `app/src/features/operador/`, `api/src/logistica/`, `api/src/rutas/logistica.ts` | Operador |
| `app/src/components/grimuca/`, `docs/diseno/` | Diseño |
| `app/src/App.tsx`, `main.tsx`, `estilos.css`, configuración, `infra/` | Orquestador |

Cada carpeta de `app/src/features/<x>/` exporta sus rutas desde `rutas.tsx` (`rutasAlta`, `rutasMedicion`, `rutasResultado`, `rutasPedido`, `rutasOperador`, de tipo `RouteObject[]`). `App.tsx` las une.

Rutas del front por dueño:
- Cliente · alta: `/`, `/perfil`, `/envio`, `/pago`, `/tiendas`, `/privacidad`, `/terminos`
- Medición: `/medir`, `/medir/manual`
- Cliente · resultado: `/resultado/:id`, `/resultados`, `/bacterias`
- Cliente · pedido: `/lista`, `/pedido/:id`
- Operador: `/operador` (PIN y panel con pestañas)

## Identificadores fijos

- Tiendas (`tiendas.id`, texto): `manongo` (Mañongo), `biglow` (Big Low), `cem` (CC CEM).
- Zonas: `Naguanagua`, `San Diego`, `Valencia norte`, `Valencia sur`, `Otra`. Tienda sugerida por zona (SUPUESTO hasta que Tulio confirme): Naguanagua → `manongo`, San Diego → `biglow`, Valencia norte → `cem`, resto → `cem`.
- Claves de parámetros: `alcalinidad`, `dureza`, `cobre`, `nitrato`, `cloro_libre`, `plomo`, `ph`, `nitrito`, `hierro`.
- Niveles de semáforo: `verde`, `amarillo`, `rojo`, `sin_dato`.
- El hogar se identifica con un UUID que el front guarda en `localStorage` (clave `agua.hogar_id`). No hay cuentas.
- "Mi lista" vive en `localStorage` (clave `agua.lista`): arreglo de `{ codigo, nombre, cantidad }`.

## Tipos compartidos

`api/src/tipos.ts` es la fuente; `app/src/lib/tipos.ts` es su copia para el front (Plataforma mantiene ambas iguales).

```ts
type Nivel = 'verde' | 'amarillo' | 'rojo' | 'sin_dato';
type ClaveParametro = 'alcalinidad' | 'dureza' | 'cobre' | 'nitrato' | 'cloro_libre' | 'plomo' | 'ph' | 'nitrito' | 'hierro';
type OrigenAgua = 'chorro' | 'botellon' | 'filtro' | 'tanque' | 'pozo';

interface Tienda { id: string; nombre: string; horario: string; direccion: string | null }

interface ParametroTira {            // GET /api/config/tira
  clave: ClaveParametro; nombre: string; unidad: string;
  niveles: number[];                 // valores de cada casilla de la tabla de colores
  orientativo: boolean;              // plomo y cobre: true
}

interface Hogar {
  id: string; nombre: string; zona: string; origen_agua: OrigenAgua; personas: number;
  tiene_filtro: boolean; etapas_filtro: number | null; fecha_ultimo_cambio: string | null; // AAAA-MM-DD
  agua_turbia: boolean; whatsapp: string; direccion: string | null; tienda_id: string | null;
  consentimiento_fecha: string;
}

type ValoresMedicion = Partial<Record<ClaveParametro, number | null>>;   // null o ausente = casilla que falta

interface ResultadoParametro { clave: ClaveParametro; nombre: string; unidad: string; valor: number | null; nivel: Nivel; frase: string; orientativo: boolean }

interface Evaluacion {
  semaforo: Nivel;                     // el peor nivel entre los parámetros leídos
  porParametro: ResultadoParametro[];
  hallazgos: string[];                 // frases simples, solo amarillos y rojos
  corrige: string[];                   // claves que un cartucho debe corregir: claves de parámetro + 'sedimentos' | 'sabor_olor' | 'bacterias'
  diasParaRecambio: number | null;     // según fecha del último cambio y perfil; null si no hay filtro
}

interface Cartucho { codigo: string; nombre: string; marca: string; precio_usd: number | null; corrige: string[]; es_ejemplo: boolean; foto_url: string | null }
// precio_usd null → la tarjeta dice "Cotizar", nunca un precio inventado.

interface Medicion {
  id: string; hogar_id: string; fecha: string; origen: 'foto' | 'manual';
  valores: ValoresMedicion; evaluacion: Evaluacion; sugeridos: Cartucho[];
}

interface Pedido {
  id: number; hogar_id: string; tipo: 'sobre' | 'cartucho'; cartucho_codigo: string | null; cantidad: number;
  modalidad: 'retiro' | 'envio'; direccion: string | null; pago: 'simulado' | 'no_aplica';
  tienda_id: string; estado: 'pendiente' | 'despachado'; fecha: string; fecha_despacho: string | null;
  // solo en respuestas del operador:
  hogar_nombre?: string; zona?: string; cartucho_nombre?: string | null;
}

interface PruebaBacterias { id: string; hogar_id: string; fecha_inicio: string; fecha_reporte: string | null; resultado: 'cambio' | 'sin_cambio' | 'pendiente' }
```

## API (todas bajo `/api`, JSON; errores como `{ error: string, detalle?: unknown }` con código 4xx/5xx)

| Método y ruta | Entrada | Salida |
|---|---|---|
| `GET /salud` | — | `{ ok: true, bd: boolean, version: string }` |
| `GET /tiendas` | — | `Tienda[]` |
| `GET /cartuchos` | — | `Cartucho[]` |
| `GET /config/tira` | — | `ParametroTira[]` |
| `POST /hogares` | perfil sin `id` + `consentimiento: true` (obligatorio) | `Hogar` (201) |
| `GET /hogares/:id` | — | `Hogar` |
| `PATCH /hogares/:id` | `{ direccion?, tienda_id? , ...campos de perfil }` | `Hogar` |
| `GET /hogares/:id/mediciones` | — | `Medicion[]` (más reciente primero) |
| `GET /hogares/:id/pedidos` | — | `Pedido[]` |
| `POST /mediciones/foto` | `multipart/form-data`: `foto` (jpeg/png/webp, máx. 8 MB), `hogar_id` | `{ estado: 'ok', medicion: Medicion }` o `{ estado: 'no_legible', motivo: string }` (200 en ambos) |
| `POST /mediciones/manual` | `{ hogar_id, valores: ValoresMedicion }` | `Medicion` (201) |
| `GET /mediciones/:id` | — | `Medicion` |
| `POST /pedidos` | `{ hogar_id, tipo, cartucho_codigo?, cantidad?, modalidad, direccion?, tienda_id }` (`pago` lo pone el servidor: `simulado` si es sobre, `no_aplica` si es cartucho) | `Pedido` (201) |
| `GET /pedidos/:id` | — | `Pedido` |
| `GET /bacterias/:hogar_id` | — | `PruebaBacterias` o 404 |
| `POST /bacterias` | `{ hogar_id }` (inicia la prueba; idempotente) | `PruebaBacterias` |
| `PUT /bacterias/:hogar_id` | `{ resultado: 'cambio' \| 'sin_cambio' }` | `PruebaBacterias` |
| `POST /operador/entrar` | `{ pin }` | `{ token }` o 401 |
| `GET /operador/pedidos?estado=pendiente\|despachado\|todos` | cabecera `Authorization: Bearer <token>` | `Pedido[]` con `hogar_nombre`, `zona`, `cartucho_nombre` |
| `POST /operador/pedidos/:id/despachar` | token | `Pedido` |
| `GET /operador/resumen` | token | `ResumenTienda[]` (ver Logística) |
| `GET /operador/inventario` | token | `FilaInventario[]` |
| `GET /operador/zonas` | token | `AlertaZona[]` |
| `GET /eventos?token=<token>` | SSE | eventos de abajo |

Plataforma escribe todas las rutas excepto `resumen`, `inventario` y `zonas`, que van en `api/src/rutas/logistica.ts` (Operador). Plataforma deja exportado un `preHandler` `exigirOperador` en `api/src/rutas/operador.ts` y registra `rutas/logistica.ts` si existe.

### Tiempo real

- Postgres: un disparador o el propio código hace `NOTIFY agua_eventos, '<json>'` al crear o despachar un pedido y al crear una medición.
- `GET /api/eventos` (SSE, `text/event-stream`, con `retry: 3000` y un comentario de latido cada 20 s). Eventos: `pedido_nuevo`, `pedido_despachado` (data: `Pedido` con `hogar_nombre`, `zona`, `cartucho_nombre`), `medicion_nueva` (data: `{ hogar_id, zona, semaforo }`).
- `app/src/lib/eventos.ts` exporta `suscribirEventos(token, manejadores)`: usa `EventSource` y, si falla, sondea `GET /operador/pedidos` cada 5 s.

### Cliente HTTP del front (`app/src/lib/api.ts`, Plataforma)

Exporta un objeto `api` con una función por ruta (`api.crearHogar`, `api.obtenerHogar`, `api.actualizarHogar`, `api.tiendas`, `api.cartuchos`, `api.configTira`, `api.medirConFoto(hogarId, archivo)`, `api.medirManual`, `api.medicion(id)`, `api.medicionesDeHogar`, `api.crearPedido`, `api.pedido(id)`, `api.pedidosDeHogar`, `api.bacterias`, `api.iniciarBacterias`, `api.reportarBacterias`, `api.operadorEntrar`, `api.operadorPedidos`, `api.despachar`, `api.resumen`, `api.inventario`, `api.zonas`), todas tipadas, que lanzan `ErrorApi` con `mensaje` legible. También `app/src/lib/sesion.ts`: `hogarId()`, `guardarHogarId()`, `lista()`, `agregarALista()`, `quitarDeLista()`, `vaciarLista()`, `tokenOperador()`, `guardarTokenOperador()`.

## Medición (`api/src/medicion/`, exportado desde `api/src/medicion/index.ts`)

```ts
// config/tira.ts: lista intercambiable de parámetros de la tira en uso
export const tira: ParametroTira[];
// config/umbrales.ts: cortes de semáforo y frases por parámetro (de docs/negocio/agua.md)
export function leerTira(imagen: Buffer, tipoMime: string): Promise<{ estado: 'ok'; valores: ValoresMedicion } | { estado: 'no_legible'; motivo: string }>;
export function evaluarAgua(valores: ValoresMedicion, perfil?: Pick<Hogar, 'origen_agua' | 'tiene_filtro' | 'etapas_filtro' | 'fecha_ultimo_cambio' | 'agua_turbia' | 'personas'>): Evaluacion;
export function diasParaRecambio(perfil, hoy?: Date): number | null;
```

- `leerTira` llama al servicio de visión con `fetch`, usando `VISION_API_URL`, `VISION_API_KEY` y `VISION_MODELO`. Si `LECTOR_SIMULADO=1` o falta la clave, devuelve una lectura de ejemplo fija (para pruebas y demo sin red).
- Debe tolerar casillas que falten (valor `null`) y devolver `no_legible` en vez de adivinar.
- Las rutas de Plataforma llaman a estas funciones; para los sugeridos, Plataforma busca en `cartuchos` los que tengan intersección entre `cartuchos.corrige` y `evaluacion.corrige`, excluyendo las marcas de `MARCAS_EXCLUIDAS`.

## Logística (`api/src/logistica/`, exportado desde `index.ts`; reciben un `Pool` de `pg`)

```ts
interface ResumenTienda { tienda_id: string; nombre: string; hogares: number; pedidos_pendientes: number; sobres_pendientes: number; recambios_7_dias: number; recambios_30_dias: number }
interface FilaInventario { tienda_id: string; tienda_nombre: string; cartucho_codigo: string; cartucho_nombre: string; stock: number; demanda_30_dias: number; faltante: number } // faltante > 0 va en rojo
interface AlertaZona { zona: string; hogares_en_rojo_7_dias: number; alerta: boolean; parametros: string[] } // alerta = 3 o más
```

## Base de datos

Tablas de la sección 6 del documento de traspaso, con estos ajustes: `tiendas.id` texto; `tiendas.direccion`; `hogares.tiene_filtro boolean`; `cartuchos.precio_usd` admite nulo; `cartuchos.es_ejemplo boolean`; `cartuchos.foto_url`; `cartuchos.vida_util_meses int`; `pedidos.cantidad int default 1`; `pedidos.fecha_despacho`; `mediciones.evaluacion jsonb` (además de `valores`, `semaforo` y `semaforo_por_parametro`). Migraciones numeradas `db/migraciones/001_*.sql`; `api/src/migrar.ts` las aplica en orden y registra en una tabla `migraciones`. Semillas: `db/semilla.sql` (tiendas, 30 hogares inventados, mediciones, pedidos, stock) y `db/semilla_cartuchos.sql` (catálogo de ejemplo con `es_ejemplo = true`). `npm run migrar -w api -- --semilla` aplica también las semillas si la tabla `hogares` está vacía.

## Variables de entorno (`.env.example`)

`PUERTO` (3070), `DATABASE_URL`, `PIN_OPERADOR`, `SECRETO_SESION`, `VISION_API_URL`, `VISION_API_KEY`, `VISION_MODELO`, `LECTOR_SIMULADO` (0/1), `MARCAS_EXCLUIDAS` (lista separada por comas), `DIR_ESTATICOS` (carpeta del front compilado; por defecto `../app/dist`).

## Cambios

(Anota aquí cualquier desviación: fecha, quién, qué.)
- sáb 21 nov, orquestador · Catálogo real (solo Oasis): `Cartucho` suma `categoria`, `url_producto` y `disponible`; todos los productos vienen sin precio (`precio_usd: null`). Los sugeridos de una medición son máximo 4, solo productos recomendables y disponibles. Las lámparas UV no se sugieren desde la tira: `GET/PUT /bacterias/:hogar_id` devuelven además `sugeridos: Cartucho[]`, que solo trae productos cuando el resultado es `cambio`. `MARCAS_EXCLUIDAS` deja de usarse.
