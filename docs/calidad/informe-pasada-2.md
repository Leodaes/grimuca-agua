# Informe de Calidad · Pasada 2 · red de comercios · sáb 21 nov 2026, 11:45 p. m.

**Veredicto:** Compuerta 1 **PASA** · Compuerta 2 **PASA** · Compuerta 3 **PASA** (en `/comercio/despacho` con el PIN de Grimuca) · Recorrido de la red (a–l) **PASA, 12 de 12 pasos**.
No apareció ningún defecto de la app que rompa el guion. **La demo no se puede dar sobre la base como quedó**: hay que reiniciar los datos antes (R1).

**Probado en:** `https://agua.oydo.app`, despliegue actual de `main`, con datos recién reiniciados al empezar (3 comercios, 70 hogares, 16 pedidos pendientes). El hash no se verificó: Calidad no usa git.
**Proyectos:** `movil` (375×812, táctil) y `escritorio` (1366×768).
**Comando:** por archivo, `npx playwright test -c pruebas/playwright.config.ts --reporter=line --workers=2 <archivo>`, con los PIN cargados desde `.env.pruebas`. Más `npm test`.
**No se probó:** la lectura de una tira real con foto real (Compuerta 4, en un teléfono). La accesibilidad es la básica de `05`. No se probó la red con dos técnicos ni con técnicos de otro comercio, porque la demo tiene un solo PIN de técnico, el de Grimuca.

## Resultado por archivo (última corrida de cada uno)

| Archivo | Pasan | Fallan | Saltadas | Duración |
|---|---|---|---|---|
| `npm test` (api + app) | 339 (221 + 118) | 0 | 0 | — |
| `01-salud` | 66 | 0 | 0 | 1,3 min |
| `02-cliente-manual` | 2 | 0 | 0 | 10 s |
| `03-despacho-en-vivo` | 2 | 0 | 0 | 10 s (2 corridas) |
| `04-api` | 22 | 0 | 0 | 13 s |
| `05-accesibilidad` | 26 | 0 | 0 | 34 s |
| `06-capturas-revision` | 5 | 0 | 5 (a propósito) | 1,0 min |
| `07-funciones-nuevas` | 7 | **2** | 9 (a propósito) | 2,0 min |
| `08-red-de-comercios` (nuevo) | 1 (12/12 pasos) | 0 | 1 (a propósito: el proyecto movil) | 50 s |

Las saltadas son pruebas que corren en un solo proyecto, por diseño. No hubo pruebas inestables. Las 2 fallas de `07` son de comportamiento, no de selectores (C5 y K1).

## Qué se ajustó en las pruebas (no en la app)

Las pruebas `01` a `07` ya pasaban con los textos de la portada nueva. El cambio que hacía falta era sumar la red de comercios:

- `apoyo/pagina.ts`: `entrarAlPanel` entra por **`/comercio`** (antes `/operador`) y acepta otro PIN. Hay una ayuda nueva, `escribirPin`, para `/red` y `/tecnico`. `abrirPestana` ahora conoce **Productos** y respeta la dirección base.
- `apoyo/datos.ts`: lee `PIN_SUPERADMIN`, `PIN_TECNICO` y `PINES_COMERCIOS`. Al cargarlo con `. ./.env.pruebas`, el shell le quita las comillas al JSON, así que se lee con una expresión que acepta las dos formas.
- `01`: la portada sin hogar exige "Pedir el sobre a domicilio ($9)" como primer botón del hero y "Ya tengo mi sobre" como segundo. Una prueba nueva verifica que con `?sobre=1` el primero pasa a "Ya tengo mi sobre" y va a `/perfil?ya=1`. Se sumaron `/?sobre=1`, `/modulos`, `/comercio`, `/tecnico` y `/red` a las rutas revisadas por "potable", y las 5 pestañas del comercio.
- `03`: Despacho en **`/comercio/despacho`**.
- `05`: las rutas nuevas y la pestaña Productos.
- `06`: 5 pestañas del comercio (captura nueva `35-operador-productos.png`) y el nombre del comercio arriba.
- **`08-red-de-comercios.spec.ts`** (nuevo): el recorrido de la demo, de la a a la l. Cada paso deja PASA / NO PASA, tiempos y lo que se vio en `capturas/revision-escritorio-08-*.json`.

---

## Compuerta 1 · PASA

| Qué | Evidencia |
|---|---|
| `npm test` en verde | 339 pruebas unitarias pasan (api 221, app 118) |
| `/api/salud` ok y con base | `01` y `04` pasan; `{"ok":true,"bd":true}` |
| API con datos | `04`: 22 de 22 (tira, tiendas, catálogo, 401 sin token, PIN equivocado → 401, hogar sin consentimiento → 4xx, medición con `porParametro`, pedidos, bacterias, despacho) |
| Portada | h1 con "Descubre la calidad del agua de tu casa". Sin hogar, los botones son "Pedir el sobre a domicilio ($9)" y "Ya tengo mi sobre". Con `?sobre=1` cambia el principal |
| Ninguna pantalla dice "potable" | `01` revisa 27 rutas sin perfil (incluidos `/modulos`, `/comercio`, `/tecnico` y `/red`), 21 con hogar, las 5 pestañas del comercio y la API. `08` revisa además la red, el técnico, la portada con y sin hogar y el resultado. **Cero apariciones** |

## Compuerta 2 · PASA

- **Recorrido completo en el teléfono** (`02` en los dos proyectos y `06` en movil). Camino a domicilio: perfil con urbanización, mascotas, "¿Cuándo cambiaste el cartucho…?" y "Código de país" +58 → `/mi-filtro` → a mano → `/envio` → `/pago` "Simulación" → "Ya me llegó el sobre" → carga manual → resultado → Mi lista → retiro en Mañongo → pedido. Camino "Ya tengo mi sobre": de punta a punta. Cada paso se contrasta con la API.
- **"Paso X de N"**: el perfil con `?ya=1` dice "Paso 1 de 2" (verificado en `08`). Envío y pago dicen 2 de 3 y 3 de 3.
- **Aviso fijo literal** en el resultado: `02`, `06`, `07` y `08`.
- **Accesibilidad básica** (`05`): 26 de 26, con las rutas nuevas.
- **Revisión en vivo** a 375 px: 0 desbordes, 0 botones principales de menos de 44 px, 0 imágenes rotas y 0 botones tapados en las pantallas del cliente, el técnico y la portada. "Cotizar por WhatsApp" ya mide 44 px.
- **Fotos de productos**: en el resultado del recorrido cargan 3 de 4. La cuarta es el cartucho de Aliado Lara, que no tiene foto y muestra "Foto no disponible" (ver C1).
- **Foto que no es una tira**: "No pudimos leer bien la foto" en 3,0 s.

## Compuerta 3 · PASA (en `/comercio/despacho`, PIN de Grimuca)

| Variante | Aparición sin recargar | "Despachado" lo saca |
|---|---|---|
| Pedido confirmado en el teléfono (Mi lista → Retiro → Mañongo → "Hacer pedido") | **0,4 s** (pedido 122) | Sí: el conteo vuelve, la API dice `despachado` y la página no se recargó |
| Pedido creado por la API | **0,1 s** (pedido 121) | Sí |
| Recorrido de la red (`08`, envío a domicilio) | **0,7 s** (pedido 115) | Sí (limpieza al final) |
| Servicio técnico desde `/experto` | **0,2 s** (`08`) y 0,4 s (`07`) | Lo cierra el técnico con su reporte |

Capturas: `40-despacho-pedido-del-telefono-en-vivo.png`, `41-…`, `42-…`, `90-despacho-grimuca-pedido-en-vivo.png`.

---

## Recorrido de la red de comercios (`08`) · PASA, 12 de 12

Un mismo pedido, el hogar "Prueba Calidad MWRA6QDQM3 red", por los cuatro módulos. Duró 50 s.

| Paso | Veredicto | Evidencia |
|---|---|---|
| **a.** `/modulos`: cuatro tarjetas y sus enlaces | **PASA** | 4 tarjetas: Cliente → `/`, Comercio → `/comercio` ("Panel del comercio"), Técnico → `/tecnico` ("Servicio técnico"), Red → `/red` ("Red Grimuca Agua"). Las cuatro abren su pantalla. `80-modulos.png` |
| **b.** Red con `PIN_SUPERADMIN`: 3 comercios en 3 estados con su membresía | **PASA** | Grimuca (Valencia, Carabobo, Premium, **Activa**); Aliado Aragua (Maracay, Aragua, Básico, **Vencida**); Aliado Lara (Barquisimeto, Lara, Básico, **Periodo gratis: quedan 71 días**). Banda: **3 comercios · 3 estados cubiertos · 5 tiendas · 100 hogares · 87 mediciones del mes · 82 pedidos del mes**. Coincide con `/api/red/resumen`. "En vivo". `81-red.png` |
| **c.** Grimuca (A) y Aliado Lara (B) en Despacho | **PASA** | A: ficha "Grimuca · Valencia, Carabobo · Plan Premium", 3 tiendas. B: ficha "Aliado Lara", solo "Aliado Lara · Centro" y ninguna tienda de Grimuca. Los dos dicen "En vivo" |
| **d.** Teléfono: portada → "Ya tengo mi sobre" → perfil → nitrato 50 → resultado → pedido con envío | **PASA** | Perfil guardado: Naguanagua, El Naranjal, mascotas, sin filtro, `+584120000000`, tienda `manongo`. Resultado con "Lo que te recomendamos", "Por qué te lo recomendamos" ("…tu medición dio Nitrato en Rojo…"), "Ver todos los productos de la tienda" y el aviso fijo. Primer sugerido: Ósmosis Inversa 8 Etapas 110 GPD. Pedido 115, `envio`, `manongo`. `84`, `85`, `89` |
| **e.** Aparece sin recargar en Grimuca y NO en Aliado Lara | **PASA** | **0,7 s** en Grimuca, marcado "Nuevo", sin recargar. Aliado Lara, 4 s después: 0 filas, "Nuevos: 0". `90`, `91` |
| **f.** `/experto` → "Pedir el servicio" → en vivo como "Servicio técnico" | **PASA** | **0,2 s**. Fila "Servicio técnico · Cambio de cartucho · … · Fecha preferida: domingo, 22 de noviembre · En la mañana". No aparece en Aliado Lara. `92`. Después, la portada con hogar dice "Hola, Prueba Calidad…" y trae "Medir mi agua", "Ver mis resultados", "Mi filtro" y "Productos de la tienda" (`86`) |
| **g.** Técnico: "Ya fui" → foto → "Guardar reporte" → "Atendidos" | **PASA** | Entra con `PIN_TECNICO`: "Servicios asignados · Servicio técnico de Grimuca". Ve el servicio (N.º 116) en "Pendientes (4)". Con la foto `02-botellones.jpg` aparece la vista previa. "Guardar reporte" tarda **0,4 s** y pasa a "Atendidos (3)" con la miniatura; "Pendientes" baja a 3. La API da `despachado`. Sale solo del Despacho de Grimuca. `87`, `88` |
| **h.** Grimuca: "Reportes del técnico" con foto | **PASA** | Aparece **sin recargar**. "Ver reporte" muestra la visita, la nota y la foto, que carga (`naturalWidth` > 0). `83-comercio-reportes-del-tecnico.png` |
| **i.** La red refleja la actividad | **PASA** | **Sin recargar**, "Pedidos del mes" pasa de 82 a 84, "Hogares" de 100 a 101 y "Mediciones del mes" de 87 a 88. "Actividad de la red" lista la medición, los dos pedidos y "Servicio atendido". Al recargar sigue en 84 |
| **j.** Grimuca → Productos → "Guardar producto" `PC-PRUEBA-…` | **PASA** | `PC-PRUEBA-MWRA6QDQM3`, Repuesto, "Bacterias", existencias 0. "Producto agregado. Ya entra en las recomendaciones." Queda en la tabla como "Cargado por ti" y sigue al recargar. Los campos de existencias son Big Low, CC CEM y Mañongo. `82-comercio-productos.png` |
| **k.** Red → "Dar de alta" "Prueba Calidad Comercio" | **PASA** | Zulia, Maracaibo, Básico, 3 meses. "Comercio dado de alta. Periodo gratis hasta el 21 de febrero de 2027." Aparece en la lista; la banda pasa a 4 comercios, 4 estados y 6 tiendas; sigue al recargar. `93-red-tras-dar-de-alta.png` |
| **l.** Seguridad | **PASA** | PIN equivocado en `/comercio` → "PIN incorrecto" (no entra); `/api/red/entrar` y `/api/tecnico/entrar` → 401. Con el token de Aliado Lara, `GET /api/operador/pedidos?estado=todos` trae 9 pedidos, todos de `lara-centro`, ninguno de Grimuca. Despachar el pedido 115 de Grimuca → **404** y el pedido sigue `pendiente`. Su foto (`/api/servicios/116/foto`) → 404; sus reportes no incluyen el de Grimuca. Sin token, `red/resumen`, `red/comercios`, `tecnico/servicios`, `tecnico/…/atender`, `servicios/…/foto`, `operador/productos` y `operador/reportes` → **401**. Con el rol equivocado (comercio en red, técnico en comercio, comercio en técnico) → **403** |

---

## 1. Rompe la demo

| N.º | Dónde | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| R1 | Base de la demo: cliente, comercio y red | Las pruebas de esta pasada ensuciaron la base. Ahora hay **4 comercios en 4 estados**, con "Prueba Calidad Comercio" en Zulia, así que la historia de "3 comercios en 3 estados" ya no se cumple. Hay **115 hogares** (eran 70), **39 pedidos pendientes** (eran 16; 23 son "Prueba Calidad") y el producto **`PC-PRUEBA-MWRA6QDQM3` "Prueba Calidad producto…" sale en el catálogo público** (`/api/cartuchos`, que alimenta `/catalogo` de cualquier cliente). El zoom de Naguanagua y el mapa también cuentan estos hogares | Reiniciar la base antes de la demo y del video | `GET /api/cartuchos`; abrir `/red` y `/comercio/despacho` | `93-red-tras-dar-de-alta.png`, `revision-escritorio-08-*.json` | Orquestador (reinicio). No es un defecto de la app |

No se encontró **ningún defecto de la app** que rompa el guion. Los cuatro módulos, el pedido en vivo, el aislamiento entre comercios, el reporte con foto y las cifras de la red funcionan.

## 2. Confunde

| N.º | Dónde | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| C1 | Resultado y Mi filtro de un cliente de Grimuca | Las recomendaciones mezclan productos de **otros comercios**. Un hogar de Naguanagua (tienda Mañongo) ve "Cartucho de sedimentos 10 pulgadas (producto de demostración) · Aliado Lara (comercio de demostración) · ALIADO-LARA-SED10", sin foto ("Foto no disponible"). En "Mi filtro" sale **primero** en "Cartuchos que necesita". Si el cliente lo agrega, el pedido llega a Mañongo por un producto que Grimuca no tiene | Que cada cliente vea solo los productos del comercio de su tienda | Perfil en Naguanagua con agua turbia → carga manual con nitrato 50 → resultado (4.º sugerido). En `/mi-filtro`, foto de un filtro | `89-resultado-porque.png` (4.ª tarjeta), `revision-movil-07-mi-filtro-*.json`, `revision-movil-07-resultado-sin-filtro-*.json` (`ALIADO-LARA-SED10` en `sugeridosApi`) | `api/src/medicion` / `api/src/rutas/filtro.ts` |
| C2 | Catálogo público (`/api/cartuchos` → `/catalogo`) | El catálogo no filtra por comercio: trae el producto de Aliado Lara y el que cargó Grimuca en Productos. El aviso de Productos dice "Lo que cargues aquí entra en las recomendaciones **de tus clientes**", pero entra en las de todos | Catálogo filtrado por el comercio de la tienda del hogar | `GET /api/cartuchos` y buscar `ALIADO-` o `PC-PRUEBA-` | Respuesta de la API (82 productos, 2 de esos) | `api/src/rutas/catalogo.ts` |
| C3 | `/red`, columna "Alta" | Grimuca, el comercio fundador, figura con **alta del 21 de noviembre de 2026**, la fecha de la migración. Queda como el más nuevo de la red, después de Aliado Aragua (13 de agosto) y Aliado Lara (1 de noviembre) | Una fecha de alta real o anterior a las de los aliados | Abrir `/red` | `81-red.png` | `api` (migración 008) / `db` |
| C4 | `/experto` después de pedir con envío | La dirección del servicio llega vacía. El cliente acaba de escribirla en Mi lista para el envío, pero ahí no se guarda en el hogar, así que la tiene que escribir otra vez | Prellenarla con la última dirección usada | Hogar nuevo por "Ya tengo mi sobre" → pedido con envío → `/experto` | `revision-escritorio-08-*.json` (`direccionPrellenadaExperto: ""`) | `app/src/features/tutoriales` / `pedido` |
| C5 | `/mi-filtro`, foto de un filtro | El filtro identificado por foto **se guarda antes** de pulsar "Sí, es este". Si la persona toca "Corregir" y se va, queda guardado un filtro que no confirmó, y ese filtro cambia sus recomendaciones. Falla `07 › mi filtro` (aserción blanda) | Guardar solo al confirmar | Hogar → `/mi-filtro` → foto `docs/marketing/imagenes/02-botellones.jpg` → antes de confirmar, `GET /api/hogares/:id/filtro` | `revision-movil-07-mi-filtro-*.json` (`filtroAntesDeConfirmar` con `portafiltro_doble`) | `api/src/rutas/filtro.ts` |
| C6 | `/tecnico`, "Atendidos" | Un servicio que el comercio cerró con "Atendido" desde Despacho aparece en los "Atendidos" del técnico como si él lo hubiera hecho: "Sin foto" y, en vez de la fecha, "N.º 114" | Distinguir "cerrado por la tienda" de "atendido por el técnico", o no mostrarlo | `07 › experto` (cierra con "Atendido") → entrar a `/tecnico` → "Atendidos" | `88-tecnico-atendidos.png` (2.ª tarjeta) | `app/src/features/tecnico` |

## 3. Cosmético

| N.º | Dónde | Qué pasa | Evidencia | Dueño |
|---|---|---|---|---|
| K1 | `/comercio/zonas` a 375 px | 58 px de desborde horizontal: los botones "En vivo" y "Salir" del encabezado y el SVG del mapa. El panel es para laptop: a 1366 px no hay desborde. Falla `07 › mapa de zonas` (aserción blanda) | `72-zonas-375.png`, `revision-escritorio-07-mapa-*.json` | `app/src/features/operador` |
| K2 | `/tecnico` y Despacho | Los datos sembrados muestran "(dato de prueba)" en las direcciones y notas ("Calle 3, casa 6 (dato de prueba)"). Es honesto, pero se ve en pantalla frente al jurado | `87-tecnico-pendientes.png` | `db` (semilla) |
| K3 | `/modulos` | Las tarjetas no tienen la misma altura (la de Red es más alta por el texto) | `80-modulos.png` | `app/src/features/red` |
| K4 | `/bacterias` sin prueba iniciada | Sigue el 404 en la consola al cargar (`GET /api/bacterias/:hogar` antes de empezar). No se ve en pantalla | `revision-movil-07-revision-en-vivo-*.json`, `revision-movil-prueba-de-bacterias-*.json` | `app/src/features/resultado` |

Nota sobre las capturas de página completa del resultado (`89`) y la portada (`85`): la barra inferior fija aparece a media página. Es un efecto de la captura, no de la app.

## Revisión en vivo (punto 5)

- **"potable"**: no aparece en ninguna pantalla ni en la API (`01`, `07` y `08`). Las frases de "Por qué te lo recomendamos" tampoco dicen "elimina", "purifica", "segura" ni "apta".
- **Aviso fijo literal** en el resultado: sí (`02`, `06`, `07`, `08`).
- **Botones principales ≥ 44 px** a 375 px: 0 hallazgos en cliente, portada y técnico. "Ya fui" y "Guardar reporte" ocupan el ancho completo.
- **Fotos de productos**: cargan todas las de grimuca.com. Solo falta la del producto de Aliado Lara (C1).
- **Desbordes a 375 px**: ninguno en el cliente ni en el técnico. Solo el mapa de zonas del panel (K1).
- **Errores de consola**: el 404 de `/bacterias` (K4) y el 401 esperado al probar un PIN equivocado. Ninguno más en `08`.
- **Enlaces internos rotos**: 0 de 22 enlaces del cliente (`07`). Las 4 tarjetas de `/modulos` abren su pantalla (`08 a`).

## Lo que sí funciona

- Los cuatro módulos con su PIN y su pantalla de entrada; el "PIN incorrecto" se ve claro.
- El aislamiento entre comercios: Despacho, API, reportes y foto.
- El tiempo real en los tres lugares: comercio (0,1–0,7 s), red (cifras y actividad) y reportes del técnico.
- El técnico en el teléfono: foto, vista previa, nota y cambio de pestaña con su aviso "Reporte guardado".
- Productos del comercio y alta de comercios, persistentes al recargar.

## Notas

- **Tiempos medidos:** pedido en Despacho 0,1 s (API) / 0,4 s (teléfono) / 0,7 s (recorrido de la red); servicio técnico 0,2 s y 0,4 s; guardar el reporte con foto 0,4 s; foto que no es tira 3,0 s.
- **Freno de PIN:** `08` hace 3 intentos fallidos a propósito (comercio por la interfaz, red y técnico por la API) y `04` hace 1. El límite es 8 por dirección en 5 minutos: no correr `04` y `08` en bucle.
- **Datos de prueba que quedan** (todos con el prefijo "Prueba Calidad"; ninguno es de una persona real):
  - **Hogares:** 45 nuevos (de 70 a 115), con sus mediciones.
  - **Pedidos:** 34 en Grimuca de hogares "Prueba Calidad". 23 siguen pendientes y 11 quedaron despachados o atendidos. Entre ellos están los servicios 114 y 116; el 116 tiene reporte con foto y nota.
  - **Productos:** 1, `PC-PRUEBA-MWRA6QDQM3` en Grimuca (Repuesto, Bacterias, existencias 0). Se ve en el catálogo público (C2).
  - **Comercios:** 1, "Prueba Calidad Comercio" (Zulia, Maracaibo, id `prueba-calidad-comercio`), con su tienda "Prueba Calidad Tienda".
  - Para limpiar: reiniciar la base, o borrar estos registros en ese orden inverso (reportes → pedidos → mediciones → hogares "Prueba Calidad …"; el producto `PC-PRUEBA-…`; la tienda y el comercio `prueba-calidad-comercio`).
- Ningún PIN ni token aparece en este informe, en las salidas guardadas ni en los JSON.
