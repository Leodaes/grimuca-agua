# Informe de Calidad · Compuertas 1 a 3 · sáb 21 nov 2026, noche

**Veredicto:** Compuerta 1 **PASA** · Compuerta 2 **PASA** · Compuerta 3 **PASA**. La demo **no se puede dar sin limpiar la base antes** (ver R1).
**Probado en:** `https://agua.oydo.app` (`/api/salud` → `{"ok":true,"bd":true,"version":"0.1.0"}`). Es el despliegue actual de `main`; el hash no se verificó porque Calidad no usa git.
**Proyectos:** `movil` (375×812, táctil) y `escritorio` (1366×768).
**Comando:** `npx playwright test -c pruebas/playwright.config.ts` con `PIN_OPERADOR` cargado desde `.env.pruebas`.
**Resultado de la corrida completa final:** **89 pasan · 0 fallan · 0 inestables · 5 saltadas** (5,4 min). Las 5 saltadas son a propósito: las pruebas de `06` que solo corren en un proyecto (las del teléfono no corren en `escritorio` y la del panel no corre en `movil`). No se saltó ninguna prueba por falta de PIN.
**No se probó:** la lectura de una tira real con foto real (eso es la Compuerta 4, en un teléfono). La accesibilidad es la básica de `05`, no se hizo con lector de pantalla.

## Qué se ajustó en las pruebas (no en la app)

La primera corrida dio **79 pasan · 5 fallan**. Las 5 fallas venían de las pruebas, no de la app:

| Prueba | Por qué fallaba | Ajuste |
|---|---|---|
| `01` portada (movil y escritorio) | Buscaba el botón "Empezar", que ya no existe | Ahora acepta "Ya tengo mi sobre", "Pedir el sobre a domicilio" o "Medir mi agua" |
| `02` recorrido (movil y escritorio) | Igual que arriba; además esperaba las palabras "Bien/Atención/Alerta" y "en tu lista" | Ahora entra por "Pedir el sobre a domicilio ($9)" y espera "Verde/Amarillo/Rojo" y "Agregado". La tienda se comprueba por el valor elegido en la lista (`manongo`) |
| `03` pedido desde el teléfono | Elegía la tienda cuando la lista todavía decía "Cargando tiendas…" | `elegirEnLista` espera hasta 10 s a que aparezca la opción |

Además se agregó **`pruebas/e2e/06-capturas-revision.spec.ts`**. Recorre los dos caminos del cliente con los botones actuales, prueba la foto que no es una tira y los dos resultados de bacterias, y captura las 4 pestañas del operador. En cada pantalla revisa la palabra prohibida, el desborde a 375 px, los botones de menos de 44 px, las imágenes rotas, si la barra inferior tapa botones y los errores de consola. Lo que encuentra queda en `docs/calidad/capturas/revision-*.json`. También `03` guarda ahora sus capturas en `docs/calidad/capturas/40…42`.

---

## Compuerta 1 · PASA

| Qué | Evidencia |
|---|---|
| `/api/salud` ok y con base | `01 › /api/salud responde ok` y `04 › GET /api/salud` pasan; respuesta `{"ok":true,"bd":true}` |
| API con datos | `04` pasa completo (22 pruebas): `/api/config/tira` con parámetros; `/api/tiendas` con Mañongo, Big Low y CC CEM; `/api/cartuchos` con catálogo (fotos `grimuca.com/wp-content/uploads/...`); operador sin token → 401; PIN equivocado → 401; hogar sin consentimiento → 4xx; medición manual con `evaluacion.porParametro` y una casilla en rojo; pedidos y bacterias |
| La portada sirve la app | `01 › la portada carga y muestra el título de bienvenida` pasa en los dos proyectos (200 y h1 "Descubre la calidad del agua de tu casa"). Captura `01-bienvenida.png` |
| Ninguna pantalla dice "potable" | `01` recorre 16 rutas sin perfil, las del cliente con hogar, medición y pedido, y las 4 pestañas del operador, en los dos proyectos; además la API no devuelve la palabra. También `06` en cada pantalla. **Cero apariciones** |

## Compuerta 2 · PASA

Recorrido completo en el teléfono (375×812), con carga manual, en la URL pública:

**Camino "Ya tengo mi sobre"** (`06`, pasa): bienvenida → "Ya tengo mi sobre" → `/perfil?ya=1` → "Continuar" → `/medir` ("Tomar la foto" y "Elegir una foto del teléfono" visibles) → enlace "¿No puedes tomar la foto? Carga los colores a mano" → un nivel por casilla con nitrato en 50 → "Ver mi resultado" → resultado con **Rojo** en Nitrato y **Verde** en el resto, aviso fijo literal y "Cotizar por WhatsApp" → "Agregar a mi lista" pasa a "Agregado" → barra inferior "Mi lista" → "Retiro en tienda" y Grimuca Mañongo → "Hacer pedido" → "Listo, tu pedido ya está en la tienda", con Mañongo, "Volver a mis resultados" e "Ir al inicio".
Capturas `01` a `09` y, con este hogar, `10` a `14`.

**Camino a domicilio** (`06` y `02`, pasan): "Pedir el sobre a domicilio ($9)" → `/perfil` → "Continuar" → `/envio` (sugiere Mañongo para Naguanagua) → "Continuar al pago" → `/pago` con el rótulo "Simulación" → "Simular pago de $9" → "Ya me llegó el sobre (saltar la espera)" → `/medir`. `02` sigue además hasta el pedido y contrasta cada paso con la API: pedido de sobre `simulado/pendiente`; medición `manual`; nitrato en `rojo`; semáforo general `rojo`; pedido de cartucho con `retiro`, `manongo`, `pendiente` y `no_aplica`.
Capturas `15-envio`, `16-pago`, `17-pago-hecho`.

- **Aviso fijo literal** ("Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.") presente en el resultado: se verifica en `02` y `06` (captura `06-resultado-con-rojo.png`).
- **Accesibilidad básica** (`05`): pasa en movil y escritorio.
- **Revisión en vivo** (`revision-movil-*.json`): **0 desbordes horizontales** a 375 px, **0 botones principales de menos de 44 px**, **0 imágenes rotas**, **0 botones tapados por la barra inferior** al final de cada pantalla. Las fotos de producto de grimuca.com sí cargan (comprobado: 3 de 3 con `naturalWidth` 1080; captura `06b-tarjeta-producto.png`).
- **Errores de consola:** ninguno en los recorridos. Solo hay uno en `/bacterias`: un 404 al cargar el hogar sin prueba iniciada (ver K1).
- **Bacterias:** salen los dos resultados con sus textos legales (capturas `20-bacterias-pendiente`, `21-bacterias-cambio`, `22-bacterias-sin-cambio`).
- **Foto que no es una tira** (una captura de pantalla): responde **"No pudimos leer bien la foto"** con un motivo claro ("En la foto no se ve la tabla de colores…") y ofrece "Repetir la foto" y "Cargar los colores a mano". **Tardó 3,5 s**, sin colgarse y sin inventar un resultado. Capturas `18-foto-vista-previa`, `19-foto-no-legible`.

## Compuerta 3 · PASA

Con el panel abierto en Despacho (1366×768) y el teléfono en otro contexto:

| Variante | Tiempo de aparición sin recargar | Despachado lo saca de pendientes |
|---|---|---|
| Pedido confirmado **en el teléfono por la interfaz** (Mi lista → Retiro → Mañongo → "Hacer pedido") | **0,4 s** (pedido 88) y **0,3 s** (pedido 98) | Sí: el conteo vuelve al anterior, la API lo da como `despachado` y la página no se recargó |
| Pedido creado por la API | **0,2 s** (pedido 87) | Sí |

El tiempo se mide desde el toque en "Hacer pedido" hasta que la fila aparece; incluye la respuesta del servidor. La fila llega marcada "Nuevo", la pestaña cambia a "Despacho (1 nuevos)" y el panel muestra "En vivo". Capturas `40-despacho-pedido-del-telefono-en-vivo.png`, `41-telefono-pedido-para-despacho.png`, `42-despacho-despues-de-despachar.png`. Las 4 pestañas en 1366×768: `30-operador-entrada`, `31-operador-despacho`, `32-operador-resumen`, `33-operador-inventario`, `34-operador-zonas`.

---

## 1. Rompe la demo

| N.º | Dónde | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| R1 | Base de la demo, se ve en todo el panel del operador | La base está llena de datos de prueba. Despacho tiene **44–47 pedidos pendientes**: 36 en Mañongo y unos 40 son "Prueba Calidad…". Zonas dice "Alerta en Naguanagua: 17 hogares en rojo". Inventario dice "Faltan 56 cartuchos en Mañongo". Resumen muestra 54 hogares. El momento clave de la demo (un pedido nuevo que entra en Despacho) queda enterrado en la columna de Mañongo, y las cifras no cuadran con la historia sembrada | Antes de la demo, la base solo tiene los datos sembrados | Abrir `/operador/despacho` y `/operador/zonas` | `31-operador-despacho.png`, `32-operador-resumen.png`, `33-operador-inventario.png`, `34-operador-zonas.png`, `40-…` | Orquestador (limpieza, ver al final). No es un defecto de la app |

No se encontró **ningún defecto de la app** que rompa el guion: los dos caminos del cliente, el pedido en Mañongo y el despacho en vivo funcionan.

## 2. Confunde

| N.º | Dónde | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| C1 | Despacho y Resumen | Hay **13 pedidos pendientes llamados "Prueba Calidad" a secas** (sin marca; varios en CC CEM con "Calle Prueba 123"). No los creó esta corrida: las pruebas de Calidad siempre le añaden una marca. Vienen de otra fuente (probablemente `pruebas/externas` u otra sesión) y habrá que borrarlos aparte | Que se sepa quién los crea y que también se limpien | `GET /api/operador/pedidos?estado=pendiente` y filtrar por `hogar_nombre` = "Prueba Calidad" | `40-despacho-pedido-del-telefono-en-vivo.png` (columna CC CEM) | Orquestador |
| C2 | `/bacterias` | Al tocar "Ya llené el frasco" salen de inmediato los botones "Cambió de color" y "Sigue igual", aunque falten 48 horas. Se puede reportar el resultado al minuto. El aviso dice "Todavía no se cumplen las 48 horas", pero no impide reportar | Que no se pueda reportar antes de las 48 h, o que lo pida confirmar. Si para la demo se quiere así, que el presentador lo sepa | Hogar nuevo → `/bacterias` → "Ya llené el frasco" | `20-bacterias-pendiente.png` | `app/src/features/resultado` |
| C3 | Bienvenida | La imagen dice "Retira en Mañongo o San Diego", pero el pie y `/tiendas` nombran tres tiendas (Mañongo · Big Low · CC CEM). CC CEM no aparece en la imagen | Que la imagen y el texto nombren lo mismo | Abrir `/` | `01-bienvenida.png` | Diseño/Marketing (`app/public/promo`) |
| C4 | `/pago` después de pagar | El título usa el nombre completo del hogar: "Listo, Prueba Calidad MWR5CDILE1 domicilio. Tu sobre está pedido." Con un nombre largo ocupa 4 líneas en 375 px | Usar solo el primer nombre o un título fijo | Camino a domicilio con un nombre largo | `17-pago-hecho.png` | `app/src/features/alta` |
| C5 | Resultado, tarjeta de producto | El enlace "Cotizar por WhatsApp" mide **26 px de alto** (el mínimo para tocar es 44 px) y está pegado al botón "Agregar a mi lista": en el teléfono es fácil tocar uno por otro | Área táctil de 44 px o más | Abrir un resultado con productos sugeridos | `06b-tarjeta-producto.png` | `app/src/features/resultado` |

## 3. Cosmético

| N.º | Dónde | Qué pasa | Evidencia | Dueño |
|---|---|---|---|---|
| K1 | `/bacterias` | Error en consola "Failed to load resource: 404" al abrir la pantalla sin una prueba iniciada (la API responde 404 a propósito, según el contrato). No se ve en pantalla | `revision-movil-prueba-de-bacterias-*.json` | `app/src/features/resultado` / `api` |
| K2 | Inventario | "Faltan 1 cartuchos en CC CEM": no concuerda en singular | `33-operador-inventario.png` | `app/src/features/operador` |
| K3 | Capturas de página completa | En las capturas largas (`06-resultado-con-rojo.png`, `21-…`) la barra inferior aparece a mitad de la página. Es un efecto de la captura: la barra es fija. En el teléfono, la revisión real no encontró botones tapados | `06-resultado-con-rojo.png` | Ninguno (nota de evidencia) |

## Lo que sí funciona

- Los dos caminos del cliente, de punta a punta, en 375 px (`06`, `02`).
- Semáforo con palabra por casilla (Verde, Rojo), aviso fijo literal y pie de orientación; ninguna pantalla dice "potable" (`01`, `02`, `06`).
- Sugerencia de productos con foto de grimuca.com, "Agregar a mi lista" → "Agregado" y "Cotizar por WhatsApp" (`06`).
- Pedido con retiro en Mañongo y confirmación con horario (`02`, `06`).
- Foto que no es una tira → "No pudimos leer bien la foto" en 3,5 s, con la carga manual a la mano (`06`).
- Despacho en vivo en menos de medio segundo, sin recargar; "Despachado" lo saca de pendientes (`03`).
- Contrato de la API y permisos del operador (`04`); accesibilidad básica (`05`).

## Notas

- **Tiempos:** aparición en Despacho 0,2 s (API), 0,4 s y 0,3 s (teléfono). Lectura de una foto que no es tira: 3,5 s.
- **Inestables:** ninguna en la corrida final (1 reintento configurado, no hizo falta).
- **Supuesto:** el "Nuevo" y "Despacho (1 nuevos)" se ven solo en la pestaña abierta en ese momento; no se probó con dos operadores a la vez.

## Limpieza de datos (para el orquestador)

Calidad no tiene acceso a la base. Lo que dejaron estas corridas (6 corridas hoy, entre ~9:00 y ~9:30 p. m.):

- **Pedidos:** **37** con nombre de hogar `Prueba Calidad <marca>` (27 pendientes y 10 despachados, contados por la API del operador). Las marcas de hoy empiezan por `MWR` (por ejemplo `Prueba Calidad MWR5JAOTFP`, `… con sobre`, `… domicilio`).
- **Hogares:** unos **55** (no hay ruta para listarlos, es una estimación de ~20 por corrida completa). Todos se llaman `Prueba Calidad MWR…` y llevan sufijos ` con sobre`, ` domicilio`, ` foto` o ` bacterias`; uno más se llama **`Prueba Calidad IMG`**. Todos en Naguanagua, con WhatsApp `04120000000` y "Calle Inventada …".
- **Mediciones:** casi todos esos hogares tienen una medición manual con nitrato 50 (rojo). Son las que inflan la alerta de Naguanagua.
- **Pruebas de bacterias:** unas 6 (hogares con sufijo ` bacterias` y los de `04`).
- **Aparte, no son de esta corrida:** 13 pedidos pendientes de hogares llamados exactamente `Prueba Calidad` (ver C1).

Regla para borrar: pedidos, mediciones y pruebas de bacterias de los hogares cuyo `nombre` empieza por `Prueba Calidad`, y después esos hogares. Después de limpiar, correr solo con `SOLO_LECTURA=1`.
