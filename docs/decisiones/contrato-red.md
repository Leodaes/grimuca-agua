# Contrato de la red de comercios

Decisión de Leonardo (sáb 21 nov, 10:00 p.m.), tras dos asesorías con jurados: Grimuca Agua pasa de ser "la app de Grimuca" a una **plataforma para ferreterías que Grimuca opera**. El cliente final sigue igual; se suman tres módulos del lado empresa. Es alcance de **demo**: datos sembrados, un PIN por rol, sin cuentas, sin cobro real.

**Regla número uno:** el recorrido del cliente y lo que ya pasó compuertas no se rompe. Ante la duda, menos alcance.

## Módulos

| Módulo | Dirección | Quién entra | Qué hace en la demo |
|---|---|---|---|
| Cliente | `/` | Cualquiera | Lo que ya existe |
| Comercio | `/comercio` (y `/operador`, que sigue funcionando) | Administrador de una ferretería, con el PIN de su comercio | El panel actual, filtrado a sus tiendas; pestaña "Productos" para cargar un producto con su inventario; reportes del técnico |
| Técnico | `/tecnico` | Técnico, con su PIN | Lista de servicios asignados, "Ya fui" y foto de cómo quedó |
| Red | `/red` | Superadmin (Leonardo y Tulio), con su PIN | Comercios de la red, plan y periodo gratis, cifras de toda la red, alta de comercio |

## Datos

Migración `008_red_de_comercios.sql`:

- `comercios` (`id text PK`, `nombre`, `estado_pais`, `ciudad`, `plan text` [`basico`|`premium`], `membresia_usd numeric` nulo, `fecha_alta timestamptz`, `fin_periodo_gratis date` nulo, `activo boolean`, `es_demostracion boolean`).
- `tiendas.comercio_id text REFERENCES comercios` (las tres tiendas actuales quedan en `grimuca`).
- `cartuchos.comercio_id text` nulo (nulo = catálogo general; con valor = producto cargado por ese comercio).
- `reportes_servicio` (`pedido_id int PK REFERENCES pedidos ON DELETE CASCADE`, `fecha_visita timestamptz`, `nota text`, `foto bytea` nulo, `foto_tipo text` nulo).

Semilla: comercio `grimuca` (Grimuca, Carabobo, Valencia, plan `premium`, no es demostración) con sus tres tiendas; dos aliados inventados y rotulados "(comercio de demostración)": `aliado-lara` (Barquisimeto, Lara, plan `basico`, alta hace 20 días, periodo gratis vigente) con una tienda, inventario de 6 productos, 6 hogares de zona "Barquisimeto" y 3 pedidos pendientes; y `aliado-aragua` (Maracay, Aragua, plan `basico`, alta hace 100 días, periodo gratis vencido) con una tienda, inventario y 4 hogares. Además, 3 servicios técnicos pendientes y 1 atendido con reporte en Grimuca.

## Entrada y roles

Variables de entorno: `PIN_OPERADOR` (comercio `grimuca`, ya existe), `PINES_COMERCIOS` (JSON `{"aliado-lara":"…"}`, opcional), `PIN_SUPERADMIN`, `PIN_TECNICO` (técnico del comercio `grimuca`). Ningún PIN va en el repositorio ni en la semilla.

El token (el mismo HMAC de hoy) lleva `{ rol: 'comercio' | 'superadmin' | 'tecnico', comercio_id }`. Los tokens viejos sin rol se tratan como `comercio` de `grimuca`.

## API

| Ruta | Rol | Entrada → salida |
|---|---|---|
| `POST /api/operador/entrar` | — | `{ pin }` → `{ token, rol: 'comercio', comercio: Comercio }` (busca el PIN entre `PIN_OPERADOR` y `PINES_COMERCIOS`) |
| `GET /api/operador/yo` | comercio | → `{ rol, comercio: Comercio, tiendas: Tienda[] }` |
| `GET /api/operador/pedidos`, `POST …/despachar`, `resumen`, `inventario`, `zonas`, `mapa` | comercio | Igual que hoy, **solo con las tiendas de su comercio** |
| `GET /api/operador/productos` | comercio | → `ProductoComercio[]` (catálogo general + los suyos, con existencias por tienda suya) |
| `POST /api/operador/productos` | comercio | `{ codigo, nombre, categoria, corrige: string[], foto_url?, existencias: Record<tienda_id, number> }` → `ProductoComercio` (201). El producto queda `recomendable` y con `comercio_id` del comercio |
| `GET /api/operador/reportes` | comercio | → `ServicioTecnico[]` atendidos de sus tiendas, con su reporte |
| `GET /api/eventos?token=` | comercio, superadmin, técnico | Los eventos de hoy, filtrados por comercio (el superadmin recibe todos) |
| `POST /api/red/entrar` | — | `{ pin }` → `{ token, rol: 'superadmin' }` |
| `GET /api/red/resumen` | superadmin | → `ResumenRed` |
| `POST /api/red/comercios` | superadmin | `{ nombre, estado_pais, ciudad, plan, meses_gratis (0 a 3), tienda_nombre, tienda_direccion? }` → `ComercioEnRed` (201); crea también su primera tienda |
| `POST /api/tecnico/entrar` | — | `{ pin }` → `{ token, rol: 'tecnico', comercio: Comercio }` |
| `GET /api/tecnico/servicios?estado=pendiente\|atendido\|todos` | técnico | → `ServicioTecnico[]` de su comercio |
| `POST /api/tecnico/servicios/:id/atender` | técnico | `multipart`: `foto` (opcional, jpeg/png/webp, máx. 8 MB), `nota` → `ServicioTecnico`; deja el pedido en `despachado`, guarda el reporte y emite `pedido_despachado` |
| `GET /api/servicios/:id/foto?token=` | comercio dueño, técnico, superadmin | La foto del reporte |

```ts
interface Comercio { id: string; nombre: string; estado_pais: string; ciudad: string; plan: 'basico' | 'premium'; membresia_usd: number | null; fecha_alta: string; fin_periodo_gratis: string | null; activo: boolean; es_demostracion: boolean }
interface ComercioEnRed extends Comercio { tiendas: number; hogares: number; mediciones_mes: number; pedidos_pendientes: number; pedidos_mes: number; productos_propios: number; estado_membresia: 'periodo_gratis' | 'activa' | 'vencida'; dias_gratis_restantes: number | null }
interface ResumenRed { comercios: ComercioEnRed[]; totales: { comercios: number; estados_cubiertos: number; tiendas: number; hogares: number; mediciones_mes: number; pedidos_mes: number; pedidos_pendientes: number } }
interface ProductoComercio extends Cartucho { propio: boolean; existencias: { tienda_id: string; tienda_nombre: string; cantidad: number }[] }
interface ServicioTecnico extends Pedido { reporte: { fecha_visita: string; nota: string | null; tiene_foto: boolean } | null }
```

Los pedidos del cliente no cambian de forma. `Pedido` suma `tienda_nombre` y `comercio_nombre` en las respuestas. Un hogar pertenece al comercio de su tienda; los hogares sin tienda cuentan para `grimuca`.

`membresia_usd` es nulo en toda la semilla: el precio de la membresía es un supuesto que todavía no fijó el equipo y no se muestra como cifra en la app (se muestra el plan y el estado).

## Front

- `app/src/lib/api.ts`, `sesion.ts` y `tipos.ts` (Plataforma): `api.yo()`, `api.productosComercio()`, `api.crearProducto()`, `api.reportes()`, `api.redEntrar()`, `api.redResumen()`, `api.crearComercio()`, `api.tecnicoEntrar()`, `api.tecnicoServicios()`, `api.atenderServicio(id, { foto?, nota })`, `api.urlFotoServicio(id)`; en `sesion.ts`, un token por rol (`tokenOperador()` sigue igual; `tokenRed()`, `tokenTecnico()` y sus `guardar…`).
- `/comercio` y `/operador`: el encabezado muestra el nombre del comercio; pestaña nueva "Productos"; en Despacho, los servicios atendidos muestran su reporte.
- `/red`: `app/src/features/red/`. `/tecnico`: `app/src/features/tecnico/` (pensado para teléfono).

## Fuera de alcance (se dice así en el informe y en el pitch)

Cuentas con contraseña por usuario, cobro real de la membresía, carga masiva de productos, comisión por transacción, plan premium con prioridad de asignación, registro abierto de comercios y asignación automática por distancia real.

## Cambios

(Anota aquí cualquier desviación.)

- **`ServicioTecnico` → `ServicioConReporte`.** El nombre `ServicioTecnico` ya existe en `tipos.ts` como la unión `'cambio_cartucho' | 'instalacion_filtro'` y lo usan pantallas del cliente; no se renombra. La interfaz de esta tabla (`Pedido` + `reporte`) se llama `ServicioConReporte` en `tipos.ts`, y `ReporteServicio` es el tipo de su campo `reporte`.
- **Forma del token.** Viejo: `<vencimiento>.<firma>` (sigue valiendo como comercio `grimuca`). Nuevo: `<rol>.<comercio>.<vencimiento>.<firma>` (el superadmin lleva `-`); la firma cubre rol y comercio. Una ruta de otro rol responde **403**; sin token o vencido, 401. Las tres entradas (`/operador`, `/red`, `/tecnico`) comparten el mismo freno de intentos de siempre (8 por dirección y 40 en total cada 5 min). `PIN_TECNICO` entra como técnico de `grimuca`. Un PIN de `PINES_COMERCIOS` cuyo comercio no existe o está inactivo no entra.
- **`GET /api/tiendas` sigue devolviendo solo las tiendas de Grimuca** (el recorrido del cliente no cambia). `?comercio=<id>` filtra por otro comercio y `?comercio=todos` trae todas. `Tienda` suma `comercio_id` (opcional).
- **Campos agregados para repartir eventos:** `Pedido.comercio_id` y `DatosMedicionNueva.comercio_id` (opcionales). Un evento sin `comercio_id` se trata como de `grimuca`.
- **"Del mes" = últimos 30 días** (`mediciones_mes`, `pedidos_mes`).
- **`estado_membresia`:** `periodo_gratis` si `fin_periodo_gratis` es hoy o después (`dias_gratis_restantes` = días que faltan, 0 el último día); `vencida` si ya pasó o el comercio está inactivo; `activa` si no tiene periodo gratis (Grimuca). Con `meses_gratis: 0`, `fin_periodo_gratis` queda nulo (`activa`).
- **Alta de comercio:** el `id` de la tienda sale de `tienda_nombre` en kebab (único, con `-2`, `-3`…); su horario queda "Por confirmar"; el comercio nuevo va con `es_demostracion: false`.
- **Alta de producto:** `marca` = nombre del comercio; `precio_usd` nulo ("Cotizar"); el código se compara sin mayúsculas (409 si existe); `categoria` en minúsculas con guion bajo; `foto_url` solo `https://`; se crea una fila de existencias por cada tienda del comercio (las que no vienen, en 0). Existencias en una tienda ajena: 400.
- **Técnico:** `POST …/atender` acepta también JSON `{ nota }` sin foto. Repetir "Ya fui" actualiza el reporte (conserva la foto anterior si no trae otra) y no repite el aviso. `GET /api/operador/reportes` trae todos los servicios atendidos; `reporte` es nulo si se marcó con el botón del panel. La foto se guarda en `bytea` (enviada en hexadecimal); `GET /api/servicios/:id/foto` también acepta la cabecera `Authorization`.
- **Front (`app/src/lib`):** se agregan `api.comercioEntrar()` (igual que `operadorEntrar`, que ahora también devuelve `rol` y `comercio`), y en `suscribirEventos` la opción `sondearCon` para que el técnico sondee sus servicios si se cae el tiempo real. Claves de sesión: `agua.token_red` y `agua.token_tecnico`.
- **Semilla:** los aliados usan zonas `Barquisimeto` y `Maracay` y sus hogares no tienen urbanización de la lista (en su mapa salen como "Otras de <zona>"). El aliado de Lara tiene un producto propio (`ALIADO-LARA-SED10`) entre sus 6 de inventario. Periodo gratis: Lara vence en 70 días; Aragua venció hace 10.
