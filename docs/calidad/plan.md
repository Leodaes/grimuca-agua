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

| Variable | Para qué | Si falta |
|---|---|---|
| `URL_BASE` | Dirección contra la que se prueba | Usa `https://agua.oydo.app` |
| `PIN_OPERADOR` | PIN del panel del operador | Las pruebas del operador **se saltan** y lo dicen en la salida |
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
| `03-despacho-en-vivo.spec.ts` | escritorio (abre también un contexto de teléfono) | El pedido aparece en Despacho **sin recargar** en menos de 10 s y sale de pendientes al pulsar "Despachado". Dos variantes: pedido creado por la API y pedido confirmado en el teléfono |
| `04-api.spec.ts` | escritorio | Contrato de la API: hogar sin consentimiento → 4xx; medición manual con `evaluacion.porParametro`; operador sin token → 401; `config/tira` con parámetros; tiendas, catálogo, pedidos, bacterias y despacho con PIN |
| `05-accesibilidad.spec.ts` | movil y escritorio | `lang` en `html`, un solo `h1`, campos con etiqueta, botones con nombre, botones principales de 44 px o más (solo en movil), foco visible al tabular |

Ayudas en `pruebas/e2e/apoyo/`: `dispositivos.ts` (teléfono y laptop), `datos.ts` (datos inventados y llamadas a la API), `pagina.ts` (selectores por rol y texto). Los textos que se asumen están en una tabla al inicio de `02` y `03`: si cambia una palabra, se ajusta ahí.

## 3. Qué certifica cada compuerta y con qué comando

| Compuerta | Qué se certifica | Comando | Evidencia |
|---|---|---|---|
| **1** · tras la Tanda 1 | `npm test` en verde; la API responde con datos; la URL pública muestra el esqueleto | `npm test` y `npm run e2e -- 01-salud 04-api` | Salida de ambos comandos |
| **2** · tras integrar Cliente | Recorrido completo con carga manual en la URL pública, en teléfono; aviso fijo literal; ninguna pantalla dice "potable"; accesibilidad básica | `npm run e2e -- --project=movil 01-salud 02-cliente-manual 05-accesibilidad` | Salida + capturas `resultado` y `pedido-confirmado` del informe HTML |
| **3** · tras integrar Operador | Un pedido creado en el teléfono aparece en Despacho sin recargar (< 10 s) y sale al despacharlo | `npm run e2e -- --project=escritorio 03-despacho-en-vivo 04-api` (con `PIN_OPERADOR`) | Salida con el "tiempo de aparición" anotado + capturas del despacho antes y después |
| **4** · antes de congelar | Lectura con tira real y foto real en la URL pública | Manual, en un teléfono real (lista de abajo) + `npm run e2e` completo como regresión | Foto usada, captura del resultado y salida de la regresión |
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

- Se escribieron contra la especificación y los primeros componentes; **todavía no han corrido contra la app desplegada**. La primera corrida real puede pedir ajustes de selectores (son cambios en las tablas de textos, no en la lógica).
- La lectura por foto no se prueba de forma automática (depende de la tira real): es la Compuerta 4.
- El campo del PIN solo acepta dígitos: si el PIN configurado tiene letras, la prueba lo reporta y no puede entrar por la interfaz.
- La API frena los intentos fallidos de PIN (8 por dirección en 5 minutos). `04` hace un intento fallido a propósito por corrida: no correrlo en bucle, o el panel queda bloqueado unos minutos.
- La accesibilidad es básica y aproximada; no reemplaza una revisión con lector de pantalla.
- `03` cuenta filas pendientes: si otra persona crea o despacha pedidos al mismo tiempo, puede fallar sin que haya un defecto. Se corre con el panel quieto.

## 5. Datos que dejan las pruebas (importante antes de la demo)

Cada corrida completa crea alrededor de una docena de hogares llamados **`Prueba Calidad <marca>`**, en Naguanagua, con una medición en rojo y pedidos en Mañongo. Eso **mueve las cifras del operador** (resumen, inventario contra demanda y, sobre todo, la alerta de zona: 3 hogares en rojo en 7 días).

- Antes de la demo y del video de respaldo hay que limpiar la base o volver a sembrarla. Calidad no toca el servidor; lo hace el orquestador. Referencia de lo que hay que borrar: pedidos, mediciones y pruebas de bacterias de los hogares cuyo `nombre` empieza por `Prueba Calidad `, y después esos hogares.
- Después de limpiar, solo se corre con `SOLO_LECTURA=1`.
- Todos los datos son inventados (teléfono `0412 000 0000`, "Calle Inventada"). Ninguno corresponde a una persona real.

## 6. Estado al sáb 21 nov, 8:50 p.m.

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
