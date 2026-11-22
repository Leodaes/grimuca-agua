# Cambios de texto para la app

Marketing · sáb 21 nov 2026, noche. Para que Desarrollo los aplique tal cual. Doce como máximo, ordenados por impacto. Todos respetan `docs/legal/puede-y-no-puede-decir.md` y `docs/legal/textos.md`: ninguno dice "potable", "segura" ni "apta" como afirmación; plomo y cobre siguen como "posible presencia, confirma con un laboratorio"; el aviso fijo y el pie del resultado no se tocan.

**Cómo leer**
- `{llaves}` lo llena la app con datos del hogar o de la medición.
- "Texto actual" sale de los archivos fuente de la app. Antes de reemplazar, Desarrollo confirma que coincide con lo que hay en pantalla.
- Los cambios 1, 3 y 5 necesitan un pequeño ajuste de código (armar el mensaje con los datos del hogar). Los demás son cambio de cadena.
- Los cambios 1, 3, 5 y 12 llevan el resultado del cliente al chat de la tienda. **El Asesor legal debe confirmar ese uso** (lo manda el propio cliente y puede editarlo antes de enviar). El mensaje solo repite el nombre de la casilla y el color que la app ya mostró.
- Lo que no se aplica sin respuesta de Tulio: cambio 9 (decisión 1 de `resumen-para-tulio.md`).

---

## 1. Mensaje que abre "Cotizar por WhatsApp"

- **Pantalla:** Resultado, tarjeta de producto. Archivo: `enlaceCotizar` en `app/src/features/resultado/textos.ts`.
- **Texto actual:** `Hola, quiero cotizar: {producto} (código {codigo})`
- **Texto nuevo:**
  `Hola, soy {nombre}, de {zona}. Medí mi agua con el sobre de Grimuca Agua el {fecha}. {resumen} Somos {personas} en casa{filtro}. Quiero cotizar: {producto} (código {codigo}). ¿Tienen en {tienda}?`
  - `{fecha}`: "22 de noviembre de 2026".
  - `{resumen}`: si hay casillas en Amarillo o Rojo: `Casillas para vigilar o atender: Cloro: Amarillo, Dureza: Rojo.` (para plomo y cobre se agrega ` (orientativo)` después del color). Si todo salió en Verde: `Todas las casillas medidas salieron en Verde.`
  - `{filtro}`: ` y tenemos un filtro de {etapas} etapas`, o ` y todavía no tenemos filtro`; si no se sabe, vacío.
  - `{tienda}`: `Grimuca {tienda}` si hay tienda asignada; si no, `su tienda más cercana`.
- **Por qué:** quien atiende recibe quién es el cliente, qué midió y qué filtro tiene, y puede descubrir antes de dar precio. Con el mensaje actual el vendedor parte de cero y el cliente pregunta "¿cuánto cuesta?" sin contexto [Material: Botero, `venta-digital-canales.md`]. Ver `guion-whatsapp-tiendas.md`.

## 2. Línea bajo "Cotizar por WhatsApp"

- **Pantalla:** Resultado, tarjeta de producto, debajo del enlace "Cotizar por WhatsApp".
- **Texto actual:** (no hay)
- **Texto nuevo:** `El precio te lo confirma la tienda por WhatsApp, sin compromiso.`
- **Por qué:** la tarjeta no muestra precio por decisión de Tulio. La línea dice qué pasa al tocar el enlace y quita la duda de si cotizar obliga a comprar. La tarjeta mantiene dos acciones ("Agregar a mi lista" y "Cotizar"), y esta línea explica la segunda.

## 3. Resultado en verde, sección de productos sugeridos vacía

- **Pantalla:** Resultado, cuando no hay productos sugeridos. Archivo: `PaginaResultado.tsx`, componente `Sugeridos`.
- **Texto actual:**
  Título: `Productos sugeridos`
  Párrafo: `Con esta medición no tenemos un cartucho que recomendarte.`
  Enlace: `¿Dudas? Pasa por la tienda y lo vemos contigo.`
- **Texto nuevo:**
  Título: `Lo que sigue`
  Párrafo: `Con esta medición no tenemos un cartucho que recomendarte. Lo que toca ahora es cambiar el cartucho a tiempo y volver a medir cuando lo cambies.`
  Si el hogar tiene filtro, botón secundario: `Cotizar el recambio de mi filtro por WhatsApp`, con este mensaje: `Hola, soy {nombre}, de {zona}. Tengo un filtro de {etapas} etapas y el último cambio de cartucho fue {fecha_ultimo_cambio, o "no me acuerdo"}. Mi medición del {fecha}: {resumen} Quiero cotizar el recambio.`
  Enlace (se mantiene): `¿Dudas? Pasa por la tienda y lo vemos contigo.`
- **Por qué:** hoy el hogar que ya tiene filtro y mide en verde llega a un callejón. Ese es el segundo mercado de Tulio (30 de cada 100, estimación) y el motor de los cartuchos. El botón solo aparece si el hogar dijo tener filtro.

## 4. Enlace de la tarjeta "Tu cartucho" cuando no hay productos sugeridos

- **Pantalla:** Resultado, tarjeta "Tu cartucho". Archivo: `PaginaResultado.tsx`, `AvisoRecambio`.
- **Texto actual:** enlace `Ver mi lista`, que lleva a `/lista`, vacía en este caso.
- **Texto nuevo:** enlace `Cotizar el recambio`, que lleva al ancla `#titulo-sugeridos` (la sección del cambio 3). Cuando sí hay productos se mantiene `Ver productos sugeridos`.
- **Por qué:** el aviso de recambio es el único momento en que el cliente sabe que le toca comprar, y el enlace lo llevaba a una lista vacía.

## 5. Hogar sin filtro: puerta al filtro

- **Pantalla:** Resultado, debajo de la sección de productos. Elemento nuevo, solo si el hogar dijo no tener filtro.
- **Texto actual:** (no hay)
- **Texto nuevo:**
  Título: `¿Todavía no tienes filtro?`
  Texto: `Pregunta en la tienda qué filtro se ajusta a tu casa. Te contamos las opciones según lo que midió tu tira y cuántos son en casa.`
  Botón secundario: `Preguntar por filtros por WhatsApp`
  Mensaje: `Hola, soy {nombre}, de {zona}. Somos {personas} en casa y no tenemos filtro. Mi medición del {fecha}: {resumen} ¿Qué filtros tienen y cuánto cuestan?`
- **Por qué:** según el modelo de Tulio, el filtro es el producto de 10 de cada 100 sobres, y la app solo sugiere cartuchos. No promete nada sobre lo que hace un filtro.

## 6. Bienvenida: título y explicación

- **Pantalla:** Bienvenida. Archivo: `app/src/features/alta/Bienvenida.tsx`.
- **Texto actual:**
  `<h1>`: `Descubre la calidad del agua de tu casa`
  Debajo, el lema en un segundo título y la explicación: `Escanea el QR de tu sobre, haz la prueba tú mismo y en minutos te decimos qué está saliendo por tu chorro y qué hacer.`
- **Texto nuevo:**
  `<h1>`: `Saber qué tomas empieza en casa` (se quita el segundo título con el lema, porque pasa a ser el primero).
  Explicación: `Escanea el QR de tu sobre, pon una gota en cada casilla de la tira y toma una foto. Te explicamos cada resultado y, si hace falta cambiar el cartucho, te decimos cuál.`
- **Por qué:** Tulio retiró "agua de calidad" y fijó el lema como mensaje de la app; Legal marcó la frase "Descubre la calidad…". El texto nuevo ordena el plan en tres pasos (escanear, medir, entender) y deja al cliente como quien hace la prueba [Material: `contenido-comercial.md`].

## 7. Lista del sobre: bacterias

- **Pantalla:** Envío del sobre y Pago. Archivos: `alta/Envio.tsx` (línea 134) y `alta/Pago.tsx` (línea 123).
- **Texto actual:** `1 prueba de bacterias (E. coli y coliformes)`
- **Texto nuevo:** `1 prueba casera de bacterias coliformes`
- **Por qué:** Legal condicionó nombrar "E. coli" a lo que diga la caja del frasco real, que todavía no llega. Es el mismo texto de `textos-app.md`.

## 8. Pago simulado: confirmación

- **Pantalla:** Pago, después de registrar el pedido. Archivo: `alta/Pago.tsx` (línea 92).
- **Texto actual:** `Te avisaremos cuando salga de la tienda.`
- **Texto nuevo:** `Cuando el pedido salga de la tienda, su estado cambia a Despachado en la app.`
- **Por qué:** la app no envía avisos ni mensajes por WhatsApp. El texto nuevo dice lo que sí ocurre y no genera una espera que no se cumple.

## 9. "No se cobra nada ahora" (Mi lista y Pedido confirmado)

- **Pantalla:** Mi lista y Pedido confirmado. Archivo: `TEXTO_SIN_COBRO` en `resultado/textos.ts`.
- **Texto actual:** `No se cobra nada ahora. La tienda te contactará para confirmar.`
- **Texto nuevo:** `No se cobra nada ahora. La tienda te escribe al WhatsApp que nos diste para confirmarte el precio y la entrega.`
- **Por qué:** dice quién, por dónde y para qué. **Solo se aplica si Tulio confirma que la tienda escribe al número del cliente** (decisión 1 de su resumen). Si la tienda llama o espera que el cliente escriba, el texto cambia.

## 10. Líneas de apoyo del resultado en Amarillo y Rojo

- **Pantalla:** Resultado, bajo el título. Archivo: `RESUMEN_NIVEL` en `resultado/textos.ts`.
- **Texto actual:**
  Amarillo: `Una o más casillas salieron cerca del límite. Abajo te decimos cuáles.`
  Rojo: `Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué hacer.`
- **Texto nuevo:**
  Amarillo: `Una o más casillas salieron cerca del límite. Abajo te decimos cuáles y qué opciones hay en la tienda.`
  Rojo: `Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué opciones hay en la tienda.`
- **Por qué:** "qué hacer" promete una instrucción que la pantalla no da; las opciones de tienda sí están más abajo. Cada estado del semáforo termina con un llamado a la acción claro. Los títulos ("Hay casillas para vigilar", "Hay casillas que atender") y la línea del verde no cambian.

## 11. Encabezado de la sección de recomendaciones

- **Pantalla:** Resultado, sección de productos (cuando hay sugeridos).
- **Texto actual:** `Productos sugeridos`, y debajo `Sugerido según tu resultado y lo que nos contaste de tu casa.`
- **Texto nuevo:** `Lo que te recomendamos`, y debajo `Según tu resultado y lo que nos contaste de tu casa.`
- **Por qué:** habla del cliente y de su casa y deja el término de catálogo atrás. Cuando el catálogo es de ejemplo se mantiene el texto literal de Legal: `Sugerido según tu resultado. Producto y precio de ejemplo.`

## 12. Prueba de bacterias: mensaje de WhatsApp en la tarjeta de lámpara UV

- **Pantalla:** Reporte de bacterias, resultado "Cambió de color", tarjeta de la lámpara UV. Archivo: `resultado/PaginaBacterias.tsx` (enlace "Cotizar por WhatsApp").
- **Texto actual:** el enlace abre el chat con el mensaje genérico de `enlaceCotizar`.
- **Texto nuevo del mensaje:** `Hola, soy {nombre}, de {zona}. Mi prueba de bacterias cambió de color a las 48 horas. Quiero consultar la lámpara UV.`
- **Por qué:** quien atiende sabe de qué se trata y puede responder con la precaución que ya fija Legal (hervir el agua y confirmar con un laboratorio). El texto de la tarjeta y los resultados de bacterias no se modifican.
