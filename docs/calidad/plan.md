# Plan de Calidad · Grimuca Agua

Calidad es independiente de Desarrollo: **no arregla, reporta**. Cada compuerta se certifica con evidencia (salida de las pruebas y capturas). Si algo falla, se dice tal cual.

## 1. Cómo se corren las pruebas

Desde la raíz del repositorio, con Node en el PATH (ver "Reglas de trabajo" en `docs/decisiones/contrato-api.md`):

```bash
npx playwright install chromium        # una sola vez por máquina
npm run e2e                            # todo: proyectos movil y escritorio
npm run e2e -- --project=movil         # solo el teléfono (375×812, táctil)
npm run e2e -- --project=escritorio    # solo la laptop (1366×768)
npm run e2e -- 02-cliente-manual       # un archivo
npm run e2e -- --list                  # lista las pruebas sin correrlas
```

**Comando vigente (pasada 2, Git Bash en Windows, sin Node en el PATH):**

```bash
export PATH="/c/Users/lede4/Valenhack/herramientas/node:$PATH"
set -a; . ./.env.pruebas; set +a          # carga los PIN sin imprimirlos
# Siempre por archivo, con salida de línea y dos procesos (una corrida de todo junto se colgó):
npx playwright test -c pruebas/playwright.config.ts --reporter=line --workers=2 01-salud
npx playwright test -c pruebas/playwright.config.ts --reporter=line --workers=2 03-despacho-en-vivo
npx playwright test -c pruebas/playwright.config.ts --reporter=line --workers=2 --project=escritorio 08-red
```

| Variable | Para qué | Si falta |
|---|---|---|
| `URL_BASE` | Dirección contra la que se prueba | Usa `https://agua.oydo.app` |
| `PIN_OPERADOR` | PIN del panel del comercio Grimuca (`/comercio`, también `/operador`) | Las pruebas del comercio **se saltan** y lo dicen en la salida |
| `PIN_SUPERADMIN`, `PIN_TECNICO`, `PINES_COMERCIOS` | Red (`/red`), técnico (`/tecnico`) y comercios aliados (JSON con `aliado-lara` y `aliado-aragua`) | `08` se salta y lo dice |
| `SOLO_LECTURA=1` | No crear hogares, mediciones ni pedidos | Se crean datos de prueba (ver sección 5) |

El PIN nunca se escribe en el repositorio ni en la línea de comandos (queda en el historial). Para cargarlo sin que se vea:

```bash
read -s PIN_OPERADOR && export PIN_OPERADOR
```

Configuración (`pruebas/playwright.config.ts`): tiempo límite 60 s por prueba (120 s en los dos recorridos largos), 1 reintento, un solo proceso, capturas en fallo, informe `list` en la terminal y HTML en `pruebas/informe-html/`. **No se graban trazas a propósito:** guardarían el PIN y el token del operador. El PIN se escribe en el navegador por un canal que no deja el texto en el informe.

Salidas que no van a git: `pruebas/informe-html/` y `pruebas/test-results/` (ya están en `.gitignore`).

## 2. Qué hay en cada archivo

| Archivo | Proyecto | Qué prueba |
|---|---|---|
| `01-salud.spec.ts` | movil y escritorio | `/api/salud` responde ok; la portada muestra "Descubre la calidad del agua de tu casa"; ninguna pantalla dice "potable" (rutas del contrato sin perfil, con hogar y, con PIN, las pestañas del operador) |
| `02-cliente-manual.spec.ts` | movil y escritorio | Recorrido completo del cliente con carga manual: bienvenida → perfil → envío → pago simulado → "Ya me llegó el sobre" → carga manual con una casilla en rojo → resultado (semáforo por parámetro, aviso fijo literal, producto sugerido) → Mi lista → retiro en Mañongo → pedido confirmado. Cada paso se contrasta con la API |
| `03-despacho-en-vivo.spec.ts` | escritorio (abre también un contexto de teléfono) | En `/comercio/despacho` con el PIN de Grimuca: el pedido aparece **sin recargar** en menos de 10 s y sale de pendientes al pulsar "Despachado". Dos variantes: pedido creado por la API y pedido confirmado en el teléfono |
| `04-api.spec.ts` | escritorio | Contrato de la API: hogar sin consentimiento → 4xx; medición manual con `evaluacion.porParametro`; operador sin token → 401; `config/tira` con parámetros; tiendas, catálogo, pedidos, bacterias y despacho con PIN |
| `05-accesibilidad.spec.ts` | movil y escritorio | `lang` en `html`, un solo `h1`, campos con etiqueta, botones con nombre, botones principales de 44 px o más (solo en movil), foco visible al tabular |
| `06-capturas-revision.spec.ts` | movil (cliente) y escritorio (panel) | Los dos caminos del cliente con el perfil nuevo (con filtro pasa por `/mi-filtro` → carga a mano; sin filtro va directo), foto que no es tira, bacterias (no deja reportar antes de 48 h sin "Saltar la espera (demostración)") y las 4 pestañas del operador. Capturas `01`…`34` y `revision-*.json` |
| `07-funciones-nuevas.spec.ts` | movil (cliente) y escritorio (operador) | Perfil (+58, número inválido, urbanización, mascotas); Mi filtro por foto (filtro real y una imagen que no es filtro) y a mano; "Por qué te lo recomendamos" sin filtro y con filtro; mensaje de WhatsApp; todo en verde → "Lo que sigue"; catálogo; tutoriales → experto; pedido de servicio en Despacho en vivo → "Atendido"; mapa de zonas (vistas, detalle, cifras contra la API, desborde a 1366 y 375); enlaces internos rotos. Capturas `50`…`72` y `revision-*-07-*.json` con frases, mensajes y tiempos |
| `08-red-de-comercios.spec.ts` | escritorio (abre contextos de teléfono) | El recorrido de la demo, un mismo pedido por los cuatro módulos: a) `/modulos`; b) red con sus 3 comercios, membresías y cifras; c) Grimuca y Aliado Lara en Despacho; d) teléfono de la portada al pedido con envío; e) el pedido entra en vivo en Grimuca y no en Aliado Lara; f) `/experto` → servicio técnico en vivo; g) técnico: "Ya fui", foto, "Guardar reporte"; h) reporte con foto en el comercio; i) la red sube sus cifras; j) producto propio; k) alta de comercio; l) seguridad (PIN, aislamiento, 401/403). Cada paso queda PASA / NO PASA en `revision-escritorio-08-*.json`. Capturas `80`…`93` |

Ayudas en `pruebas/e2e/apoyo/`: `dispositivos.ts` (teléfono y laptop), `datos.ts` (datos inventados y llamadas a la API), `pagina.ts` (selectores por rol y texto), `perfil.ts` (llenar el perfil vigente y cargar el filtro a mano), `revision.ts` (revisión en vivo y capturas, compartida por 06 y 07). Los textos que se asumen están en una tabla al inicio de `02` y `03`: si cambia una palabra, se ajusta ahí.

## 3. Qué certifica cada compuerta y con qué comando

| Compuerta | Qué se certifica | Comando | Evidencia |
|---|---|---|---|
| **1** · tras la Tanda 1 | `npm test` en verde; la API responde con datos; la URL pública muestra el esqueleto | `npm test` y `npm run e2e -- 01-salud 04-api` | Salida de ambos comandos |
| **2** · tras integrar Cliente | Recorrido completo con carga manual en la URL pública, en teléfono; aviso fijo literal; ninguna pantalla dice "potable"; accesibilidad básica | `npm run e2e -- --project=movil 01-salud 02-cliente-manual 05-accesibilidad` | Salida + capturas `resultado` y `pedido-confirmado` del informe HTML |
| **3** · tras integrar Operador | Un pedido creado en el teléfono aparece en Despacho sin recargar (< 10 s) y sale al despacharlo | `npm run e2e -- --project=escritorio 03-despacho-en-vivo 04-api` (con `PIN_OPERADOR`) | Salida con el "tiempo de aparición" anotado + capturas del despacho antes y después |
| **4** · antes de congelar | Lectura con tira real y foto real en la URL pública | Manual, en un teléfono real (lista de abajo) + `npm run e2e` completo como regresión | Foto usada, captura del resultado y salida de la regresión |
| **Funciones nuevas** · pasada 2 | Perfil, Mi filtro, porqué, WhatsApp, catálogo, experto → Despacho, mapa | `npx playwright test -c pruebas/playwright.config.ts 07` (con `PIN_OPERADOR`) | Salida + `revision-*-07-*.json` + capturas `50`…`72` |
| **Red de comercios** · pasada 2 | Los cuatro módulos con un mismo pedido, aislamiento entre comercios, técnico con foto, red en vivo | `npx playwright test -c pruebas/playwright.config.ts --reporter=line --project=escritorio 08-red` (con los cuatro PIN) | `revision-escritorio-08-*.json` (pasos a–l) + capturas `80`…`93` |
| **Pasada final** (dom 12:00 m.) | Nada se rompió al congelar; repo limpio | `SOLO_LECTURA=1 npm run e2e -- 01-salud 05-accesibilidad`, más `docs/calidad/secretos.md` y `LICENCIAS.md` al día | Salida + fecha de la revisión de secretos |

Una compuerta **pasa** solo si su comando termina sin fallas y sin pruebas saltadas que le correspondan (por ejemplo, la 3 no pasa si el operador se saltó por falta de PIN). Una prueba que pasa solo en el reintento se anota como inestable.

### Compuerta 4: lista manual (teléfono real, datos móviles)

1. Abrir la URL pública, llegar a `/medir` con un hogar ya creado.
2. Foto de la tira real junto a su tabla, con buena luz → resultado con semáforo por casilla. Anotar cuánto tardó.
3. Comparar a ojo cada casilla leída con la tabla impresa. Anotar las que no coinciden.
4. Foto mala a propósito (oscura o sin tabla) → debe decir que no pudo leer y ofrecer la carga manual; nunca un resultado inventado.
5. Tira con menos casillas que la configurada → las que faltan salen "sin lectura", no en verde.
6. Repetir el pedido con retiro en Mañongo y verlo entrar en la laptop.

## 4. Límites conocidos de estas pruebas

- Ya corren contra la app desplegada (pasada 2). Si cambia un texto, se ajusta la expresión de la tabla al inicio de cada archivo, no la lógica.
- La lectura por foto de la tira no se prueba de forma automática (depende de la tira real): es la Compuerta 4. La foto del **filtro** sí se prueba en `07` con `docs/marketing/imagenes/02-botellones.jpg` (y `app/public/marca/og-01.jpg` como imagen que no es filtro); la respuesta viene de un modelo y puede variar entre corridas (tipo, medida, cartuchos).
- `07` espera que La Begoña esté en alerta con los datos sembrados; si se vuelve a sembrar distinto, se ajusta esa línea.
- El campo del PIN solo acepta dígitos: si el PIN configurado tiene letras, la prueba lo reporta y no puede entrar por la interfaz.
- La API frena los intentos fallidos de PIN (8 por dirección en 5 minutos, una sola cuenta para comercio, red y técnico). `04` hace un intento fallido a propósito y `08` hace tres: no correrlos en bucle, o las entradas quedan bloqueadas unos minutos.
- `08` deja un comercio "Prueba Calidad Comercio" y un producto `PC-PRUEBA-<marca>`: después de correrlo, la red ya no tiene "3 comercios en 3 estados" y el producto sale en el catálogo público. Se corre antes de reiniciar la base, nunca después.
- Solo hay un PIN de técnico (el de Grimuca): no se prueba un técnico de otro comercio.
- La accesibilidad es básica y aproximada; no reemplaza una revisión con lector de pantalla.
- `03` cuenta filas pendientes: si otra persona crea o despacha pedidos al mismo tiempo, puede fallar sin que haya un defecto. Se corre con el panel quieto.

## 5. Datos que dejan las pruebas (importante antes de la demo)

Cada corrida completa de `01` a `07` crea unos 30 a 45 hogares (pasada 2: de 70 a 115), y `08` deja además un comercio, su tienda, un producto y un servicio con reporte y foto. Antes se decía "alrededor de una docena de hogares"; hoy son más. Los hogares se llaman **`Prueba Calidad <marca>`**, en Naguanagua, con una medición en rojo y pedidos en Mañongo. Eso **mueve las cifras del operador** (resumen, inventario contra demanda y, sobre todo, la alerta de zona: 3 hogares en rojo en 7 días).

- Antes de la demo y del video de respaldo hay que limpiar la base o volver a sembrarla. Calidad no toca el servidor; lo hace el orquestador. Referencia de lo que hay que borrar: pedidos, mediciones y pruebas de bacterias de los hogares cuyo `nombre` empieza por `Prueba Calidad `, y después esos hogares.
- Después de limpiar, solo se corre con `SOLO_LECTURA=1`.
- Todos los datos son inventados (teléfono `0412 000 0000`, "Calle Inventada"). Ninguno corresponde a una persona real.

## 6. Estado (histórico)

Estado vigente: ver `docs/calidad/informe-pasada-2.md`.

### Sáb 21 nov, 11:45 p. m. · pasada 2 (red de comercios)

- Compuertas 1, 2 y 3 **PASAN** (la 3 en `/comercio/despacho`, 0,1 a 0,7 s). Recorrido de la red `08`: **12 de 12 pasos PASAN**.
- `07` tiene 2 fallas de comportamiento: la foto del filtro se guarda antes de confirmar y hay 58 px de desborde en Zonas a 375 px.
- Sin defectos de la app que rompan el guion. La base quedó con datos de prueba: hay que reiniciarla antes de la demo.

### Sáb 21 nov, 8:50 p.m.

- `npx playwright test -c pruebas/playwright.config.ts --list`: **84 pruebas en 5 archivos**, compila sin errores.
- `01-salud` contra `https://agua.oydo.app` (sin reintentos, para probar el arnés): **2 pasan, 38 fallan, 2 saltadas** de 42. Es lo esperado hoy: el sitio muestra la página provisional, `/api/salud` y las demás rutas responden 404, y no hay PIN cargado. Pasa solo "sin perfil: /" (carga y no dice "potable"). El arnés, los dos proyectos, las capturas en fallo y el informe HTML funcionan.
- Ninguna compuerta está certificada todavía.

## 7. Plantilla del informe de fallas

Un informe por corrida, en `docs/calidad/informe-compuerta-N.md`. Orden fijo: **rompe la demo → confunde → cosmético**. Dentro de cada grupo, primero lo que está en el guion de la demo (sección 12 del documento de traspaso).

```markdown
# Informe de Calidad · Compuerta N · <día y hora>

**Veredicto:** PASA / NO PASA
**Probado en:** <URL> · commit <hash corto> · proyectos: movil, escritorio
**Comando:** `<comando exacto>`
**Resultado:** <n> pasan · <n> fallan · <n> saltadas · <n> inestables (pasaron en el reintento)
**No se probó:** <lo que quedó fuera y por qué; por ejemplo, operador sin PIN>

## 1. Rompe la demo
Lo que impide completar el guion: teléfono (alta → medición → semáforo → producto → pedido
con retiro en Mañongo) o laptop (el pedido aparece en Despacho sin recargar; inventario; zonas).
También va aquí cualquier pantalla que diga "potable" o que no muestre el aviso fijo.

| N.º | Dónde (ruta y paso) | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| R1 | | | | | captura o línea de la salida | carpeta responsable |

## 2. Confunde
Funciona, pero un cliente o el jurado puede entender otra cosa o perderse: textos que se
contradicen, errores sin explicación, estados de carga que parecen falla, cifras que no cuadran.

| N.º | Dónde | Qué pasa | Qué debería pasar | Cómo repetirlo | Evidencia | Dueño |
|---|---|---|---|---|---|---|
| C1 | | | | | | |

## 3. Cosmético
No cambia lo que el usuario entiende ni lo que puede hacer: alineación, espacios, ortografía
menor, diferencias con `grimuca-design/DESIGN.md`.

| N.º | Dónde | Qué pasa | Evidencia | Dueño |
|---|---|---|---|---|
| K1 | | | | |

## Lo que sí funciona
<lista corta, con la prueba que lo respalda>

## Notas
<pruebas inestables, tiempos medidos (aparición del pedido en Despacho), supuestos, datos de prueba creados>
```

Reglas del informe:

- Una falla por fila, con la forma de repetirla. Sin adjetivos: lo que se vio y lo que se esperaba.
- Lo que no se pudo probar se dice en "No se probó"; no se da por bueno.
- Calidad propone el dueño por carpeta (tabla de territorios del contrato); no corrige código de la app.
- Nunca se pega en el informe un PIN, un token ni el contenido de `agua.env`.
