# Contrato entre módulos

Este documento es el acuerdo entre los equipos de Plataforma, Medición, Cliente y Operador. Si algo no está aquí, decide quien sea dueño de la carpeta y lo anota al final, en "Cambios".

## Reglas de trabajo

- Monorepo con espacios de trabajo de npm: `api/` y `app/`. Las dependencias ya están instaladas. **Nadie ejecuta `npm install`**: si falta una librería, se resuelve sin ella o se avisa al orquestador.
- Node puede no estar en el PATH del sistema: usa la instalación local del equipo antes de correr npm.
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
- Zonas: `Naguanagua`, `San Diego`, `Valencia norte`, `Valencia sur`, `Otra`. Tienda sugerida por zona (SUPUESTO hasta que Tulio confirme): Naguanagua → `manongo`, San Diego → `biglow`, resto → `manongo`.
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
- sáb 21 nov, Medición · Lector de fotos (`api/src/medicion/lector.ts`), tras verificar el formato contra la documentación oficial del servicio:
  - `tool_choice` va en `{ type: 'auto' }` y el uso de la herramienta se exige en las instrucciones. Los modelos más recientes de ese servicio rechazan con 400 la herramienta forzada (`type: 'tool'`). Para un modelo que sí la admita: variable nueva y opcional `VISION_FORZAR_HERRAMIENTA=1` (falta en `.env.example`).
  - `max_tokens` sube de 1024 a 4096: en los modelos que razonan siempre, el razonamiento cuenta dentro del tope y con 1024 la lectura puede quedar cortada.
  - La cabecera de versión (`2023-06-01`) sigue vigente; existe una versión más nueva (`2026-10-21`) que acepta esta misma petición. El nombre de esa cabecera lo fija el servicio y es la única mención de proveedor en el código.
  - El `motivo` de `no_legible` siempre es uno de los textos fijos de la app (poca luz, borrosa, sin tabla, sin tira, pocas casillas, archivo que no es foto o el general de legal); lo que escribe el servicio solo se usa para elegir cuál. Si la foto no muestra la tabla de colores (`tabla_visible: false`) también es `no_legible`.
  - El mínimo de 3 lecturas válidas baja al número de casillas si la tira en uso tiene menos de 3.
- sáb 21 nov, Medición · Evaluación (`evaluar.ts`, `config/umbrales.ts`):
  - `evaluarAgua(valores, perfil?, hoy?)` y `leerTira(imagen, tipoMime, tira?)` aceptan un tercer parámetro opcional (para pruebas); las firmas del contrato siguen valiendo.
  - `porParametro` trae una fila por casilla de la tira en uso, más cualquier otra clave conocida que venga con valor (por ejemplo `hierro` cargado a mano).
  - Regla opcional de `agua.md` activada: cloro en 0 con origen chorro, tanque o pozo y sin filtro → amarillo, con `corrige: ['bacterias']`. Se apaga con `reglaSinCloro.activa = false`.
  - `corrige` incluye `bacterias` siempre que el origen sea pozo o tanque (aunque todo salga verde) y `sedimentos` si el agua sale turbia. Cloro en amarillo o rojo aporta `cloro_libre` y `sabor_olor`.
  - `diasParaRecambio`: toma el cartucho que vence primero según las etapas (SUPUESTO: 1 etapa = carbón en bloque, 180 días; 2 o más incluyen sedimentos, 90 días; sin dato de etapas = 2). Agua turbia: sedimentos × 0.5. Cinco o más personas: × 0.75. Negativo = vencido. No aplica el ajuste de membrana por dureza (no cambia el resultado: nunca es el cartucho que vence primero).
  - Frases: literales de `docs/negocio/agua.md` sección 2 (revisión 2 de legal). `pH`: niveles `6.2, 6.8, 7.2, 7.6, 8.4, 8.8` y `hierro` `0, 0.3, 1, 3, 5`, ambos por confirmar con el empaque.
- sáb 21 nov, Medición · Front (`/medir`, `/medir/manual`): hay dos botones de foto, "Tomar la foto" (cámara, `capture="environment"`) y "Elegir una foto del teléfono" (sin `capture`, para poder subir una foto ya tomada). El conteo usa el componente `Temporizador` tal cual, así que el botón dice "Empezar a contar" y no "Iniciar conteo". La carga manual usa chips por nivel (no `select`) y la opción "No la tiene / no se ve".
- sáb 21 nov, Plataforma · `crearApp(opciones)` es asíncrona y recibe `{ bd, config, medicion, eventos?, dirEstaticos?, registro?, conLogistica? }`; servir el front y devolver `index.html` fuera de `/api` se configura ahí (opción `dirEstaticos`) y `servidor.ts` solo pasa `DIR_ESTATICOS`.
- sáb 21 nov, Plataforma · Las rutas leen sus dependencias de `app.contexto` (`bd`, `config`, `medicion`, `eventos`); también existe `app.bd`. `rutas/logistica.ts` se carga con import dinámico y se registra con prefijo `/api` si exporta `rutasLogistica` (o un export por defecto).
- sáb 21 nov, Plataforma · Las 3 tiendas se insertan en `001_inicial.sql` (además de la semilla): son identificadores fijos y los pedidos las necesitan aunque no se cargue la semilla. Horario "Por confirmar" y dirección nula hasta tener los datos reales.
- sáb 21 nov, Plataforma · `tipos.ts` suma tipos de apoyo (`EntradaHogar`, `CambiosHogar`, `EntradaPedido`, `PerfilHogar`, `LecturaTira`, `ResultadoFoto`, `EventoAgua`, `ItemLista`, `Salud`), las constantes `ZONAS`, `CLAVES_PARAMETRO`, `IDS_TIENDA` y `tiendaSugerida(zona)`, y los tres tipos de Logística. Una prueba de la API exige que `api/src/tipos.ts` y `app/src/lib/tipos.ts` sean idénticos.
- sáb 21 nov, Plataforma · `PruebaBacterias.sugeridos` es obligatorio y también lo devuelve `POST /bacterias` (201 si la crea, 200 si ya existía). Una prueba por hogar.
- sáb 21 nov, Plataforma · `Pedido.cartucho_nombre` viene en todas las respuestas; `hogar_nombre` y `zona`, solo en las del operador y en los eventos.
- sáb 21 nov, Plataforma · `POST /hogares` sin `tienda_id` guarda la tienda sugerida por zona; sin filtro, `etapas_filtro` y `fecha_ultimo_cambio` quedan nulos. `POST /pedidos` con envío y sin dirección usa la del hogar (400 si no hay ninguna); con retiro la dirección queda nula.
- sáb 21 nov, Plataforma · Mediciones: `sugeridos` no se guarda, se calcula al leer con el catálogo y el perfil de ese momento; `evaluacion.diasParaRecambio` también se recalcula al leer. `GET /cartuchos` devuelve todo el catálogo (incluye repuestos), sin el campo interno `recomendable`.
- sáb 21 nov, Plataforma · `POST /mediciones/foto`: si el lector falla o no trae ningún número responde `no_legible` (200) y no guarda; foto de más de 8 MB → 413; archivo que no es JPG, PNG o WebP → 415. `POST /mediciones/manual` exige al menos un valor.
- sáb 21 nov, Plataforma · Operador: el token dura 3 días; sin `PIN_OPERADOR` nadie entra; sin `SECRETO_SESION` (o con menos de 16 caracteres) se firma con un secreto temporal que cambia en cada reinicio; 8 PIN fallidos por dirección en 5 minutos → 429. `GET /operador/pedidos` usa `estado=pendiente` por defecto y ordena del más nuevo al más viejo. Despachar dos veces no repite el aviso.
- sáb 21 nov, Plataforma · Tiempo real: el aviso sale con `pg_notify('agua_eventos', …)` desde el código; si la conexión `LISTEN` está caída se reparte en memoria dentro del mismo proceso (hay una sola instancia). El SSE envía `: conectado` al abrir.
- sáb 21 nov, Plataforma · Semillas: `--semilla` carga `semilla_cartuchos.sql` siempre (actualiza lo existente) y `semilla.sql` solo si no hay hogares. `semilla.sql` se genera con `npx tsx db/generar_semilla.ts` usando la evaluación real; además de lo pedido trae el historial despachado (52 pedidos, 7 pendientes) y 4 pruebas de bacterias.
- sáb 21 nov, Plataforma · Front (`app/src/lib`): `api.bacterias()` devuelve `null` si el hogar no ha iniciado la prueba; las funciones del operador usan el token guardado si no se les pasa uno y lo borran ante un 401; `api.medirManual` acepta `(hogarId, valores)` o `{ hogar_id, valores }`. `suscribirEventos(token, manejadores)` acepta `pedido_nuevo`/`pedidoNuevo`, `pedido_despachado`/`pedidoDespachado`, `medicion_nueva`/`medicionNueva`, `pedidos` (lista de pendientes del sondeo), `conexion` (`conectando`, `en_vivo`, `reconectando`) y `sinPermiso`; devuelve la función para cancelar. `sesion.ts` suma `cambiarCantidad`, `cantidadEnLista` y `alCambiarLista`; el token del operador se guarda en `agua.token_operador`.
- sáb 21 nov, Plataforma · `.env.example` incluye `VISION_CABECERAS` y `VISION_FORZAR_HERRAMIENTA` (las usa el lector). `MARCAS_EXCLUIDAS` queda opcional y vacía.
- sáb 21 nov, Plataforma · Nueva migración `003_tiendas.sql`: pone el horario y la dirección públicos de las tres tiendas (CC CEM queda en San Diego, frente al Big Low). En `tipos.ts`, `tiendaSugerida` devuelve hoy `manongo` para Valencia norte y para el resto de las zonas (cambio hecho fuera de Plataforma; la línea "Identificadores fijos" de arriba todavía dice `cem`).
- sáb 21 nov, Plataforma · `semilla.sql` asigna la tienda de cada hogar de forma explícita (16 en Mañongo, 7 en Big Low, 7 en CC CEM) para que ninguna tienda quede vacía en el panel, y mezcla fechas de último cambio de cartucho pensadas para un ciclo de 90 días.
- sáb 21 nov, Dev · Tutoriales y servicio técnico: rutas `/tutoriales`, `/tutoriales/:id` y `/experto` (`app/src/features/tutoriales/`, contenido de demostración en `contenido.ts`); `Pedido.tipo` suma `'servicio'` y `Pedido` trae siempre `servicio` (`cambio_cartucho` | `instalacion_filtro`), `fecha_preferida`, `momento` (`manana` | `tarde`, agregado al pedido) y `nota` (nulos fuera de servicio); `POST /pedidos` con `tipo: 'servicio'` exige `servicio` y `fecha_preferida` (no pasada), fuerza `modalidad: 'envio'`, `cantidad: 1` y `pago: 'no_aplica'`; migración `004_servicios.sql` (en pg-mem el ayudante de pruebas traduce `pedidos_tipo_check` a `pedidos_constraint_1`); en Despacho el servicio se cierra con "Atendido" (mismo `despachar`, estado `despachado`).
- sáb 21 nov, Dev · Filtro del hogar por foto (migración `006_filtro_del_hogar.sql`, `api/src/filtro/`, `rutas/filtro.ts`, front `/mi-filtro` y `/mi-filtro/manual?sigue=`): `POST /hogares/:id/filtro/foto` (`{ estado: 'ok', filtro, cartuchos }` o `{ estado: 'no_identificado', motivo }`), `PUT`/`GET /hogares/:id/filtro` (`RespuestaFiltro`), `GET /filtros/modelos`; `Hogar.filtro?: FiltroHogar | null`; los sugeridos de una medición ponen primero los cartuchos compatibles con el filtro que atienden lo hallado (`sugerirConFiltro`, sin perder la cobertura de `sugerirCartuchos`); el perfil ya no pregunta las etapas.
- sáb 21 nov, Dev · Operador · Migración `005_urbanizacion.sql`: `hogares.urbanizacion` (texto, opcional) y `hogares.mascotas` (boolean, por defecto false); `POST/PATCH /hogares` los aceptan y `Hogar` los devuelve. Nueva `GET /operador/mapa` (con token): una entrada por urbanización de `api/src/logistica/urbanizaciones.ts` (copia igual en el front) con hogares, mediciones de 30 días, rojos de salud en 7 días, `estado`, `alerta` (3 o más), `parametros` y pedidos pendientes, más "Otras de <zona>" con `en_tablero: false`; la pestaña Zonas la dibuja como mapa de hexágonos y la semilla pasa a 60 hogares en 31 urbanizaciones.
- sáb 21 nov, Dev · Cliente · "Por qué te lo recomendamos": cada elemento de `Medicion.sugeridos` es ahora `CartuchoSugerido` (`Cartucho` + `motivo: string` + `atiende: MotivoAtendido[]`, con `MotivoAtendido = { clave, nombre, nivel: Nivel | null }`; `nivel` null en las razones del perfil: `sedimentos`/"Agua turbia", `recambio`/"Toca el cambio", `sin_filtro`/"Sin filtro en casa", `filtro`/"Tu filtro"). La frase se arma en el servidor, sin llamadas externas, con `conMotivos` (`api/src/rutas/motivos.ts`, probado con todo `db/semilla_cartuchos.sql`: nunca "elimina", "quita", "corrige", "purifica", "apta", "segura" ni "potable"; siempre "pensado/pensada para"; máximo 3 parámetros; plomo y cobre con "La tira solo orienta: confirma con un laboratorio."; sin frases repetidas). `ParaArmarMedicion` suma `hogar?` (las rutas pasan el hogar). `GET /cartuchos` y `PruebaBacterias.sugeridos` siguen siendo `Cartucho[]`.
- sáb 21 nov, Dev · Cliente · WhatsApp normalizado: `api/src/telefono.ts` y `app/src/lib/telefono.ts` (copias idénticas, una prueba lo exige). `POST/PATCH /hogares` guardan `whatsapp` como `+<código><número>` sin espacios (`+584145550199`); acepta `0414-555-0199`, `4145550199`, `+58 …`, `58…`, `0058…`; para +58 exige celular (412, 414, 416, 422, 424, 426) y responde 400 con "Revisa el número: debe ser un celular, por ejemplo 0414 555 01 99"; otros códigos de la lista, 7 a 12 dígitos. Los números viejos guardados con otro formato se leen sin cambios.
- sáb 21 nov, Dev · Cliente · Último cambio como pregunta cerrada: migración `007_ultimo_cambio.sql` (`hogares.ultimo_cambio text`: `menos_de_un_mes` | `mas_de_tres_meses` | `no_me_acuerdo`); `Hogar.ultimo_cambio`, `EntradaHogar.ultimo_cambio?`, tipo `UltimoCambio` y `ULTIMOS_CAMBIOS`. Con `ultimo_cambio` el servidor deriva `fecha_ultimo_cambio` (hoy − 15 días, hoy − 100 días o null); en PATCH una `fecha_ultimo_cambio` explícita manda (lo usa "Ya lo cambié" de los tutoriales, que envía `ultimo_cambio: 'menos_de_un_mes'` y la fecha de hoy) y repetir la misma respuesta no reinicia la fecha. Sin filtro, `ultimo_cambio` queda null. El perfil ya no muestra el campo de fecha.
- sáb 21 nov, Dev · Cliente · Front: textos 1, 2, 3, 4, 5, 7, 8, 10, 11 y 12 de `docs/marketing/cambios-para-la-app.md` aplicados (6 y 9 no, pendientes de Tulio); los mensajes de WhatsApp se ven y se editan antes de enviar ("Ver o editar el mensaje"). "Cotizar por WhatsApp" es un botón secundario de 44 px en todas las tarjetas. `/bacterias` no deja reportar antes de 48 horas salvo con "Saltar la espera (demostración)" (`/bacterias?saltar=1`; el servidor no lo exige). El título del pago confirmado ya no lleva el nombre del hogar. En `/catalogo` el enlace de los recomendados pasa de "Ver por qué" a "Ver mi resultado" (el motivo ya se ve en la tarjeta). Las fotos de producto llevan `referrerPolicy="no-referrer"` por si el sitio de origen bloquea imágenes enlazadas desde otro dominio.
