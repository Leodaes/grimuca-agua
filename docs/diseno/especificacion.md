# Grimuca Agua · Especificación de pantallas

Fuente de estilo: `grimuca-design/DESIGN.md` y `tokens.css`. Componentes: `app/src/components/grimuca/` (ver `componentes.md`).
Todo texto de aquí es **provisional**: Marketing y el Asesor legal lo pueden cambiar; la estructura no.

## 0. Reglas que aplican a todas las pantallas

- **Cliente:** diseñado a 375px. Contenido en una columna, ancho máximo 480px centrado, margen lateral 16px. Usa `<Pantalla>` (encabezado azul + contenido + barra inferior).
- **Operador:** diseñado a ≥1280px (laptop y proyector). Usa `<Pantalla ancho="operador" conBarra={false}>`. Sin barra inferior.
- **Un solo botón `--accion` por pantalla** (`<Boton>` primario). Todo lo demás es secundario o enlace.
- Radio 2px en controles, 0 en tarjetas. Sin sombras (única excepción: el cajón de Mi lista). Solo modo claro.
- Títulos con clases `g-h1`…`g-h4` (Archivo, azul). Texto en Source Sans 3, 17px.
- Objetivos táctiles ≥44px. Foco siempre visible (azul sobre claro, amarillo sobre azul).
- Tono de mostrador: frases cortas, de tú, sin tecnicismos. **Nunca aparece la palabra "potable"**, ni "apta", "segura" o "limpia" como afirmación sobre el agua del cliente.
- Plomo y cobre: siempre "posible presencia, confirma con un laboratorio". Nunca un diagnóstico.
- **Aviso fijo literal** (componente `<AvisoTira />`, no se reescribe): "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."
- Estados obligatorios en toda pantalla con datos: **carga** (`<Cargando>`), **vacío** (`<EstadoVacio>`) y **error** (`<EstadoVacio tono="error">` con botón "Reintentar"). Los errores de formulario van debajo de cada campo, no en alertas.
- El hogar se recuerda en el dispositivo (sin cuentas). Si alguien entra a una ruta que necesita perfil y no lo tiene, se le manda a `/perfil`.

## 1. Mapa de rutas

| Ruta | Pantalla | Barra inferior |
|---|---|---|
| `/` | Bienvenida | No |
| `/perfil` | Perfil del hogar | No |
| `/envio` | Dirección y tienda más cercana | No |
| `/pago` | Pago del sobre (simulación) y "Ya me llegó el sobre" | No |
| `/medir` | Cómo medir en 4 pasos + foto | Sí |
| `/medir/manual` | Carga manual de colores | Sí |
| `/resultado/:id` | Resultado con semáforo (`:id` acepta `ultimo`) | Sí |
| `/lista` | Mi lista → retiro o envío → confirmar | Sí |
| `/pedido/:id` | Pedido confirmado | Sí |
| `/bacterias` | Reporte de la prueba a las 48 horas | Sí |
| `/tiendas` | Las 3 tiendas | Sí |
| `/privacidad`, `/terminos` | Textos legales | No |
| `/operador` | PIN | — |
| `/operador/resumen`, `/despacho`, `/inventario`, `/zonas` | Pestañas del operador | — |

Recorrido completo: `/` → `/perfil` → `/envio` → `/pago` → `/medir` → `/resultado/:id` → `/lista` → `/pedido/:id`. Después: `/bacterias`.
**Atajo para la demo:** en `/` hay un enlace "Ya tengo mi sobre" que va a `/perfil?ya=1`; al guardar el perfil salta directo a `/medir` (sin envío ni pago).

### Barra inferior del cliente (`<BarraInferior>`)

Fija abajo, 64px, fondo blanco, borde superior. 5 accesos con icono y palabra:

| Acceso | Destino | Activo en |
|---|---|---|
| Medir | `/medir` | `/medir*` |
| Resultados | `/resultado/ultimo` | `/resultado*`, `/bacterias` |
| Tiendas | `/tiendas` | `/tiendas` |
| WhatsApp | `https://wa.me/580000000000` (número marcador; abre pestaña nueva; **no hay bot**) | — |
| Mi lista | `/lista` (con contador) | `/lista`, `/pedido*` |

El acceso activo se marca con `aria-current="page"`, color azul y una línea superior de 3px.

## 2. Semáforo

Siempre **icono + palabra + color** (`<Semaforo nivel>`). Nunca solo color.

| Nivel | Palabra | Icono | Texto | Fondo | Contraste |
|---|---|---|---|---|---|
| `verde` | Bien | círculo con check | `--ok` `#166534` | `--ok-bg` `#E8F6EE` | 6,4:1 |
| `amarillo` | Atención | triángulo con ! | `--ambar` `#7A4B00` (nuevo) | `--ambar-bg` `#FFF4D6` (nuevo) | 6,8:1 |
| `rojo` | Alerta | octágono con X | `--error` `#B42318` | `--error-bg` `#FDECEB` | 5,7:1 |
| `sin_dato` | Sin dato | círculo punteado | `--apagado` `#575756` | `--papel` `#F6F6F6` | 6,8:1 |

- `--ambar` y `--ambar-bg` se definen en `components/grimuca/grimuca.css` (no existen en `tokens.css`). El amarillo de marca `#FBE919` **no** se usa para semáforo: no tiene contraste sobre blanco.
- Las palabras viven en `PALABRA_SEMAFORO`; si Legal las cambia, se cambian ahí.
- `sin_dato` es normal: la tira de la demo puede traer menos casillas. Frase: "Esta tira no trae esa casilla" o "No se pudo leer".

## 3. Pantallas del cliente

### `/` Bienvenida
- **Propósito:** explicar en 5 segundos qué es y arrancar.
- **Componentes:** `Encabezado`, `Pasos` (estático), `Boton`.
- **Contenido:** (1) kicker "Grimuca Agua"; (2) h1 "Descubre la calidad del agua de tu casa"; (3) párrafo "Te mandamos un sobre con una tira. La mojas, le tomas una foto y te decimos qué está fallando y cómo corregirlo."; (4) `Pasos` de 3: "Pides el sobre ($9)", "Mides en casa en 5 minutos", "Te decimos qué filtro o cartucho te sirve"; (5) CTA; (6) enlace "Ya tengo mi sobre"; (7) pie con enlaces a Privacidad y Términos.
- **CTA:** "Empezar" → `/perfil`.
- **Estados:** si ya hay hogar guardado, el CTA dice "Seguir donde quedé" y lleva al último paso pendiente.

### `/perfil` Perfil del hogar
- **Propósito:** conocer el hogar para personalizar el resultado. Tiene que llenarse en menos de 1 minuto.
- **Componentes:** `Campo`, `Chip` (opciones de una sola elección, dentro de `fieldset` con clase `g-grupo`), `Casilla`, `Boton`.
- **Contenido, en orden:**
  1. h1 "Cuéntanos de tu casa" + "Con esto te damos un resultado hecho para ustedes."
  2. Nombre (obligatorio).
  3. Zona (select, obligatorio): Naguanagua, San Diego, Valencia norte, Otra zona.
  4. "¿De dónde viene el agua que toman?" (chips, obligatorio): Chorro · Botellón · Filtro · Tanque · Pozo.
  5. "¿Cuántos viven en la casa?" (número, 1 a 20).
  6. "¿Tienen filtro?" (chips Sí / No). Si Sí aparecen: "¿De cuántas etapas?" (select 1 a 5, "No sé") y "¿Cuándo cambiaron el cartucho por última vez?" (fecha; ayuda "Si no te acuerdas, déjalo vacío").
  7. "¿El agua sale turbia o amarilla?" (chips Sí / No).
  8. WhatsApp (opcional; `type="tel"`, ayuda "Solo para avisarte de tu pedido.").
  9. Casilla obligatoria: "Acepto que Grimuca use estos datos para preparar mi resultado y mi pedido. Leer el [aviso de privacidad] y los [términos]."
- **CTA:** "Guardar y seguir" → `/envio` (o `/medir` si vino con `?ya=1`).
- **Estados:** botón en `cargando` al guardar. Errores por campo: "Escribe tu nombre", "Elige tu zona", "Elige una opción", "Marca la casilla para seguir". Error de red: `Toast` "No se pudo guardar. Revisa tu conexión y prueba otra vez."

### `/envio` Dirección y tienda
- **Propósito:** saber a dónde va el sobre y de qué tienda sale.
- **Componentes:** `Campo` (textarea), `TarjetaTienda`, `Chip`, `Insignia`, `Boton`.
- **Contenido:** (1) h1 "¿A dónde te mandamos el sobre?"; (2) Dirección (textarea, obligatorio; ayuda "Calle, casa o edificio, y un punto de referencia."); (3) h2 "Sale de esta tienda" + `TarjetaTienda` de la tienda más cercana según la zona, con `Insignia` "Más cercana"; (4) "Cambiar tienda": chips Mañongo · Big Low · CC CEM.
- **CTA:** "Seguir al pago" → `/pago`.
- **Estados:** carga de tiendas con `Cargando variante="esqueleto"`; si falla, se deja elegir tienda a mano con los chips. Error: "Escribe la dirección".

### `/pago` Pago del sobre (simulación)
- **Propósito:** cerrar la compra del sobre de $9. Crea el pedido de tipo "sobre" que entra al despacho.
- **Componentes:** `Insignia`, `Aviso`, `Boton`, `Pasos`.
- **Estado A · antes de pagar:** (1) `Insignia tono="aviso"` "Simulación" arriba, siempre visible; (2) h1 "Tu sobre de medición"; (3) resumen: "1 tira para medir tu agua · 1 prueba de bacterias · tabla de colores · video paso a paso"; línea "Envío a: {dirección}" y "Sale de: {tienda}"; total "$9,00" (Archivo, grande, cifras tabulares); (4) `Aviso` "Esto es una simulación: no se cobra nada ni se piden datos de tarjeta."
  - **CTA:** "Pagar $9 (simulación)".
- **Estado B · pagado:** (1) `Insignia tono="ok"` "Pedido recibido"; (2) h1 "Tu sobre sale de {tienda}"; (3) "Te avisamos cuando vaya en camino. Cuando lo tengas en la mano, vuelve aquí."; (4) `Insignia tono="aviso"` "Simulación".
  - **CTA (botón de demo):** "Ya me llegó el sobre" → `/medir`.
- **Estados:** botón `cargando` mientras se crea el pedido. Error: `Toast` "No se pudo registrar el pedido. Prueba otra vez." (se queda en el estado A).

### `/medir` Cómo medir tu agua en 4 pasos
- **Propósito:** guiar la medición y recibir la foto.
- **Componentes:** `Pasos` (con `actual`), `Temporizador`, `Boton`, `Aviso`, `Cargando`.
- **Contenido:** (1) h1 "Mide tu agua en 4 pasos"; (2) `Pasos`:
  1. "Llena un vaso" — "Con el agua que toman en la casa."
  2. "Moja la tira" — "Sigue la tabla que viene en el sobre: una gota en cada casilla."
  3. "Espera 30 segundos" — aquí va el `Temporizador` (30 s de espera + 30 s para la foto).
  4. "Toma la foto" — "Pon la tira al lado de la tabla de colores, con buena luz y sin sombra."
  (3) botón de foto (`<input type="file" accept="image/*" capture="environment">` oculto, disparado por el `Boton`); (4) enlace "¿No puedes tomar la foto? Marca los colores a mano" → `/medir/manual`.
- **CTA:** "Tomar o subir la foto". Siempre habilitado: el temporizador orienta, no bloquea (en la demo no se espera).
- **Estados:**
  - Leyendo: se reemplaza el contenido por `Cargando` "Leyendo tu tira…" (puede tardar 5 a 15 s).
  - No se pudo leer (`no_legible`): `Aviso tono="atencion"` "No pudimos leer la foto. Tómala otra vez con más luz y con la tabla al lado." + botón secundario "Marcar los colores a mano".
  - Error de red: `EstadoVacio tono="error"` "No hay conexión" + "Reintentar".

### `/medir/manual` Carga manual
- **Propósito:** respaldo si falla la foto. También es el camino seguro de la demo.
- **Componentes:** `Campo` (select por parámetro), `Boton`.
- **Contenido:** (1) h1 "Marca los colores a mano"; (2) "Compara cada casilla con la tabla y elige el valor que más se parezca."; (3) un select por parámetro de la tira configurada (los niveles vienen del servidor), cada uno con la opción "No la tengo o no se ve"; (4) CTA.
- **CTA:** "Ver mi resultado" → `/resultado/:id`.
- **Estados:** carga de parámetros con esqueleto. Si todos quedan en "No la tengo": error "Marca al menos una casilla".

### `/resultado/:id` Resultado
- **Propósito:** decir qué está fallando, en claro, y qué producto lo corrige.
- **Componentes:** `Semaforo` (grande), `AvisoTira`, `ListaParametros` + `FilaParametro`, `Aviso`, `TarjetaProducto`, `Toast`, `CajonLista`, `Boton`.
- **Contenido, en orden:**
  1. kicker con fecha y origen ("Medición del 22 de noviembre · por foto").
  2. h1 "Tu agua, casilla por casilla" + `Semaforo tamano="grande"` general + una frase: verde "Todo lo que midió la tira salió en rango."; amarillo "Hay cosas que conviene vigilar."; rojo "Hay cosas que conviene corregir."
  3. **`<AvisoTira />`** — va aquí, antes de la lista, para que se vea sin bajar. Aparece siempre, también cuando todo sale verde.
  4. h2 "Lo que salió" + `ListaParametros`: una `FilaParametro` por casilla (nombre, valor, semáforo, frase simple). Orden: rojos, amarillos, verdes, sin dato. Plomo y cobre con `orientativo`.
  5. h2 "Qué hacer" + hallazgos: un `Aviso` por hallazgo, con frase de mostrador (ej. "Hay mucho cloro: por eso el sabor y el olor.").
  6. h2 "Lo que te sirve" + `TarjetaProducto` por sugerido (máximo 3), con `motivo` según resultado y perfil. La primera lleva `destacado` (único botón `--accion`); las demás, botón secundario. Mientras el catálogo sea de ejemplo, `esEjemplo`.
  7. Enlace "Reportar mi prueba de bacterias" → `/bacterias`.
- **CTA:** "Agregar a mi lista" del producto destacado. Al agregar: `Toast` "Agregado a tu lista" con acción "Ver mi lista" (abre `CajonLista`; su pie lleva a `/lista`).
- **Estados:**
  - Carga: `Cargando variante="esqueleto" lineas={6}`.
  - `ultimo` sin mediciones: `EstadoVacio` "Todavía no has medido tu agua" + "Medir ahora" → `/medir`.
  - No existe o error: `EstadoVacio tono="error"` "No encontramos esa medición" + "Volver a medir".
  - Todo verde, sin sugeridos: en vez de productos, `Aviso tono="ok"` "La tira no encontró nada que corregir. Vuelve a medir en 3 meses o si notas un cambio." + botón secundario "Ver tiendas". El aviso fijo sigue arriba.

### `/lista` Mi lista
- **Propósito:** convertir lo sugerido en un pedido de tipo "cartucho" (sin cobro en la app).
- **Componentes:** `ListaArticulos`, `Chip`, `Campo`, `TarjetaTienda`, `Aviso`, `Boton`.
- **Contenido:** (1) h1 "Mi lista"; (2) `ListaArticulos` con cantidad (− / +) y "Quitar"; (3) h2 "¿Cómo lo quieres?": chips "Retiro en tienda" · "Envío a mi casa"; (4) si retiro: select de tienda (por defecto la del hogar) y su `TarjetaTienda`; si envío: dirección (prellenada con la del perfil); (5) `Aviso` "Aquí no se cobra. La tienda te confirma el total y la forma de pago."
- **CTA:** "Confirmar pedido" → `/pedido/:id`.
- **Estados:** vacío: `EstadoVacio` "Tu lista está vacía" + "Ver mi resultado". Botón `cargando` al confirmar. Error: `Toast` "No se pudo enviar el pedido. Prueba otra vez." (la lista no se borra).

### `/pedido/:id` Pedido confirmado
- **Propósito:** dar certeza. En la demo, es el instante en que el pedido aparece en el proyector.
- **Componentes:** `Insignia`, `TarjetaTienda`, `Aviso`, `Boton`.
- **Contenido:** (1) `Insignia tono="ok"` "Pedido recibido"; (2) h1 "Listo, {nombre}"; (3) retiro: "Pasa a buscarlo en {tienda}. Te avisamos cuando esté listo." / envío: "Sale de {tienda} hacia {dirección}."; (4) resumen: número de pedido, artículos y cantidades; (5) `TarjetaTienda` con horario.
- **CTA:** "Volver a mi resultado" → `/resultado/ultimo`.
- **Estados:** carga con esqueleto; error "No encontramos ese pedido" + "Ir a Mi lista".

### `/bacterias` Reporta tu prueba a las 48 horas
- **Propósito:** que el cliente diga si el frasco cambió de color. No se envía ningún mensaje.
- **Componentes:** `Pasos`, `Chip`, `Aviso`, `Boton`, `Insignia`.
- **Contenido:** (1) h1 "Reporta tu prueba de bacterias"; (2) "Llena el frasco, tápalo y déjalo quieto 48 horas. Después vuelve y cuéntanos cómo quedó."
  - **Sin empezar:** CTA "Ya llené el frasco" (guarda la hora de inicio).
  - **En espera:** `Insignia` "Faltan {n} horas" + "Vuelve el {día} a las {hora}." Enlace "Ya pasaron las 48 horas" (para la demo; lleva a Reportar).
  - **Reportar:** "¿Cómo quedó el frasco?" con dos chips grandes: "Cambió de color" · "Sigue igual". CTA "Enviar reporte".
  - **Reportado (textos PENDIENTES del Asesor legal; no publicar otros):**
    - Cambió: `Aviso tono="atencion"` "El frasco cambió de color: puede haber bacterias. Confírmalo con un laboratorio y pregunta en la tienda qué hacer mientras tanto."
    - Sigue igual: `Aviso` "El frasco no cambió. Esta prueba casera es una orientación: no certifica el agua."
- **CTA:** uno por estado, como se indica.
- **Estados:** carga con `Cargando`; error de red con `Toast` "No se pudo guardar tu reporte."

### `/tiendas` Tiendas
- **Propósito:** dónde retirar y a quién escribir.
- **Componentes:** `TarjetaTienda`, `Boton` (secundario).
- **Contenido:** h1 "Nuestras tiendas" + 3 `TarjetaTienda` (Mañongo, Big Low, CC CEM) con horario, dirección (marcador hasta tener la real) y botón secundario "Escribir por WhatsApp" (wa.me marcador).
- **CTA:** no lleva botón `--accion` (pantalla informativa).
- **Estados:** esqueleto; error con "Reintentar"; vacío no aplica.

### `/privacidad` y `/terminos`
- Texto corrido del Asesor legal (`docs/legal/`), ancho máximo `70ch`, h1 + h2, enlace "Volver" arriba (`Encabezado rutaAtras`). Sin barra inferior ni CTA. Mientras no llegue el texto: "Texto en revisión."

## 4. Pantallas del operador (≥1280px)

Marco común: `Encabezado variante="operador"` con título "Panel de despacho", a la derecha `Insignia` de conexión ("En vivo" con punto verde / "Reconectando…" en ámbar) y botón "Salir" (`sobreAzul`). Debajo, franja `--papel` con las pestañas (`Chip` con `a`, que marca `aria-current`): **Resumen · Despacho · Inventario · Zonas**. Contenido con ancho máximo 1440px, margen 24px.
En cualquier pestaña, cuando entra un pedido: `Toast` "Pedido nuevo en {tienda}" con acción "Ver despacho".

### `/operador` PIN
- **Contenido:** tarjeta centrada de 360px: h1 "Panel de despacho", `Campo` "PIN" (`type="password"`, `inputMode="numeric"`), CTA.
- **CTA:** "Entrar" → `/operador/resumen`.
- **Estados:** botón `cargando`; error bajo el campo "PIN incorrecto. Prueba otra vez."

### Resumen
- **Propósito:** la foto del día por tienda.
- **Componentes:** `BandaCifras`, `TarjetaTienda` (con `cifras`).
- **Contenido:** (1) `BandaCifras` con totales: Hogares · Pedidos pendientes · Recambios en 7 días · Recambios en 30 días; (2) 3 `TarjetaTienda` en fila con las mismas 4 cifras por tienda y enlace "Ver despacho".
- **Estados:** esqueleto; error con "Reintentar"; sin datos: cifras en 0 (no se oculta nada).

### Despacho (momento clave de la demo)
- **Propósito:** ver qué sale de cada tienda y marcarlo como despachado.
- **Componentes:** `TarjetaTienda` (una por tienda, 3 columnas), `FilaPedido`, `Chip` (filtros), `Insignia`, `Toast`.
- **Contenido:** (1) h1 "Despacho de hoy" + filtros: Todos · Sobres · Cartuchos; (2) tres tarjetas: **Mañongo · Big Low · CC CEM**, cada una con `extra` = `Insignia` "{n} pendientes"; (3) dentro, una `FilaPedido` por pedido, del más nuevo al más viejo:
  - línea 1: `Insignia` de tipo (**Sobre** / **Cartucho**) + qué es ("Sobre de medición" o nombre del cartucho) + **hora** a la derecha (cifras tabulares);
  - línea 2: **zona** · **modalidad** (icono + "Retiro en tienda" o "Envío: {dirección}") + botón **"Despachado"** (secundario).
  (4) al final de cada tarjeta, los despachados de hoy, atenuados y sin botón.
- **Pedido nuevo:** entra **arriba de su tienda, sin recargar**. `FilaPedido nuevo`: aparece con un desplazamiento corto (0,18 s), fondo `--azul-100` que se desvanece en 4 s, borde izquierdo de 4px azul e `Insignia` "Nuevo". La marca "Nuevo" dura 60 s o hasta despacharlo. Con `prefers-reduced-motion` no hay animación: queda el fondo `--azul-50` y la insignia. Se anuncia en una región `aria-live="polite"`: "Pedido nuevo: {tipo} para {zona}, {tienda}".
- **Al pulsar "Despachado":** el botón pasa a `cargando`; al confirmar, la fila baja a los despachados y el contador resta 1.
- **Estados:** tienda sin pendientes: "No hay pedidos pendientes en esta tienda."; carga con esqueleto por tarjeta; si se cae la conexión en vivo, la insignia del encabezado pasa a "Reconectando…" y se consulta cada 5 s; error al despachar: `Toast` "No se pudo marcar. Prueba otra vez."

### Inventario
- **Propósito:** saber qué va a faltar.
- **Componentes:** tabla (`g-tabla`), `Insignia`, `Chip` (filtro por tienda).
- **Contenido:** tabla con columnas: Cartucho · Tienda · En stock · Demanda a 30 días · Diferencia. Si falta: `Insignia tono="error"` "Faltan {n}" (icono + palabra, no solo rojo); si alcanza: `Insignia tono="ok"` "Alcanza". Faltantes primero. Encabezado de tabla fijo.
- **Estados:** esqueleto; vacío "No hay cartuchos cargados."; error con "Reintentar". Nota al pie mientras el catálogo sea de ejemplo: "Catálogo de ejemplo."

### Zonas
- **Propósito:** detectar zonas con problemas repetidos.
- **Componentes:** `Aviso tono="error"`, tabla (`g-tabla`), `Semaforo`.
- **Contenido:** (1) arriba, un `Aviso tono="error" rol="alert"` por cada zona con 3 o más hogares en rojo en 7 días: "Alerta en {zona}: {n} hogares en rojo en los últimos 7 días. Lo que más se repite: {parámetro}."; (2) tabla: Zona · Hogares medidos · En rojo (7 días) · Parámetro más repetido · Tienda que la atiende.
- **Estados:** sin alertas: `Aviso tono="ok"` "Ninguna zona en alerta esta semana."; esqueleto; error con "Reintentar".

## 5. Notas para Desarrollo

- Importar una sola vez `tokens.css` (global) y luego los componentes desde `components/grimuca` (el `index.ts` ya importa `grimuca.css`).
- Logos servidos en `/marca/logo-horizontal-blanco.png` y `/marca/logo-horizontal-azul.png`.
- El `Toast` se monta dentro de `<Pantalla>` para que quede por encima de la barra inferior.
- Fechas y horas en formato local (`es-VE`), hora de Caracas. Dinero: `$9,00`.
- Marcadores pendientes: número de WhatsApp, direcciones y horarios de tiendas, catálogo, textos de bacterias y legales.
