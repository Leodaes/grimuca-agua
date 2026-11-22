# Textos de la app · Grimuca Agua

Versión 3 (21 nov, noche): aplica las decisiones de Tulio (lema, promesa, semáforo con sus palabras, flujo con QR, tiendas reales) y el lente de marketing y ventas: el cliente es el protagonista y Grimuca lo guía. Cambios de esta versión: bienvenida, sobre, resultado con llamado a la acción por semáforo, tarjeta de producto, Mi lista, pedido confirmado y mensajes de WhatsApp (sección 19). La lista corta que Desarrollo aplica a la app está en `cambios-para-la-app.md`. Detalle de Tulio en `cambios-tulio.md`. Listos para pegar.

**Lema definitivo:** Saber qué tomas empieza en casa
**Promesa:** Menos botellones: mide tu agua y cambia el cartucho cuando toca

**Cómo leer este archivo**
- Lo que va entre `{llaves}` lo pone la app (nombre, tienda, número).
- Lo que va entre `[CORCHETES]` es un dato que falta; no se inventa.
- Trato: de "tú", como en el mostrador.
- Revisado por el Asesor legal (revisión 2, sáb 21 nov; cambios en `docs/legal/revision-2.md`). Los textos de consentimiento, aviso fijo, plomo, cobre, bacterias y pago simulado son literales de `docs/legal/textos.md`: se pegan tal cual, sin ajustar el tono.

**Reglas que no se rompen**
- La app nunca dice "potable", "segura" ni "apta para tomar" como afirmación.
- Plomo y cobre: siempre "posible presencia, confirma con un laboratorio".
- La prueba de bacterias no certifica el agua, salga como salga.
- Aviso fijo, literal, en cada resultado: **"Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."**
- Pie del resultado (además del aviso fijo): **"Esta prueba es una orientación, no un análisis de laboratorio, y no certifica que el agua sea apta para tomar."**
- Sin "agua de calidad" ni "permanente" en ningún texto.

---

## 0. Elementos comunes

| Elemento | Texto |
|---|---|
| Nombre en el encabezado | Grimuca Agua |
| Barra inferior | Medir · Resultados · Tiendas · WhatsApp · Mi lista |
| Lema (pie de la bienvenida y de la pantalla de tiendas) | Saber qué tomas empieza en casa |
| Botón seguir | Continuar |
| Botón volver | Atrás |
| Botón guardar | Guardar |
| Botón reintentar | Intentar otra vez |
| Cargando | Un momento… |
| Campo obligatorio | Este dato hace falta. |
| Opcional | (opcional) |

---

## 1. Bienvenida

| Elemento | Texto |
|---|---|
| Título (lema) | Saber qué tomas empieza en casa |
| Subtítulo (promesa) | Menos botellones: mide tu agua y cambia el cartucho cuando toca. |
| Línea fija bajo el subtítulo | Medición orientativa con tira. No es un análisis de laboratorio. |
| Explicación (el plan en tres pasos) | Escanea el QR de tu sobre, pon una gota en cada casilla de la tira y toma una foto. Te explicamos cada resultado y, si hace falta cambiar el cartucho, te decimos cuál. |
| Dónde se consigue el sobre | Lo compras en el mostrador de Grimuca Mañongo o San Diego, o en las farmacias y supermercados aliados, o te lo llevamos a la casa. |
| Beneficio 1 | **Mides en tu casa.** Una tira, una gota por casilla y una foto. |
| Beneficio 2 | **Te lo explicamos claro.** Verde, amarillo o rojo, casilla por casilla. |
| Beneficio 3 | **Te decimos cuándo cambiar el cartucho.** Y cuál va. Sale de la tienda Grimuca que te quede más cerca. |
| Botón principal (camino A) | Ya tengo mi sobre |
| Botón secundario (camino B) | Pedir el sobre a domicilio ($9) |
| Pie | Grimuca · Mañongo · Big Low · CC CEM |

> Los dos caminos. **A, "Ya tengo mi sobre":** escanear el QR del sobre (sección 5) → perfil del hogar (sección 2) → medir (sección 6). **B, "Pedir el sobre a domicilio ($9)":** perfil del hogar → envío del sobre (sección 3) → pago simulado (sección 4) → cuando llega el sobre, escanear su QR → medir. El pago dentro de la app es solo del camino B.

---

## 2. Perfil del hogar

| Elemento | Texto |
|---|---|
| Título | Cuéntanos de tu casa |
| Subtítulo | Con esto te recomendamos lo que de verdad te sirve. Es un minuto. |

| Campo | Etiqueta | Ayuda |
|---|---|---|
| Nombre | ¿Cómo te llamas? | Con el nombre basta. Es para tu pedido. |
| Zona | ¿En qué zona vives? | Así sabemos qué tienda te queda más cerca. Opciones: Naguanagua · San Diego · Valencia norte · Otra zona |
| Origen del agua | ¿De dónde sale el agua que toman en casa? | Marca la que más usan. |
| Opción | Chorro | Directo de la tubería. |
| Opción | Botellón | El que compran o rellenan. |
| Opción | Filtro | Pasa por un filtro antes de tomarla. |
| Opción | Tanque | Sale de un tanque de la casa o del edificio. |
| Opción | Pozo | Viene de un pozo. |
| Personas | ¿Cuántos viven en la casa? | Contando niños. Mientras más gente, más rápido se gasta el cartucho. |
| Tiene filtro | ¿Tienen filtro en casa? | Sí · No |
| Etapas | ¿De cuántas etapas es? | Cuenta los vasos o cartuchos que tiene el filtro. Si no sabes, marca "No sé". Opciones: 1 · 2 · 3 · 4 o más · No sé |
| Último cambio | ¿Cuándo cambiaron el cartucho la última vez? | Una fecha aproximada sirve. Opción: No me acuerdo |
| Agua turbia | ¿El agua a veces sale turbia o amarilla? | Sí · A veces · No |
| WhatsApp | Tu WhatsApp | Para que la tienda te ubique si hace falta por tu pedido. Ejemplo: 0414 123 4567 |

| Elemento | Texto |
|---|---|
| Casilla de consentimiento (desmarcada por defecto, obligatoria) | Acepto que Grimuca Agua use mi nombre, zona, WhatsApp, dirección y los datos de mi hogar para enviarme el sobre, mostrarme mis resultados y atender mis pedidos, como explica el Aviso de privacidad. |
| Enlace | "Aviso de privacidad", dentro del texto de la casilla, abre el aviso. |
| Línea bajo la casilla (solo en la demo) | Esto es una demostración: puedes usar datos de prueba. |
| Error: falta consentimiento | Marca la casilla para poder seguir. |
| Error: WhatsApp | Revisa el número: deben ser 11 dígitos, empezando por 04. |
| Error: personas | Escribe un número del 1 en adelante. |
| Botón | Continuar |

---

## 3. Envío del sobre

| Elemento | Texto |
|---|---|
| Título | ¿A dónde te mandamos el sobre? |
| Subtítulo | Sale de la tienda Grimuca más cercana a tu zona. Solo para quien pide el sobre a domicilio. |
| Campo dirección | Dirección de entrega |
| Ayuda dirección | Urbanización, calle, casa o edificio y apartamento. |
| Campo referencia | Punto de referencia (opcional) |
| Ayuda referencia | Algo que ayude a ubicarte: frente a la panadería, portón negro. |
| Tienda asignada | Tu sobre sale de: **Grimuca {tienda}** |
| Cambiar tienda | Prefiero otra tienda |
| Qué trae el sobre (título) | Qué te llega |
| Qué trae 1 | 1 tira para medir tu agua |
| Qué trae 2 | 1 prueba casera de bacterias coliformes ("E. coli" solo si lo dice la caja del frasco real) |
| Qué trae 3 | La tabla de colores impresa |
| Qué trae 4 | Un código QR con el video de cómo se hace |
| Nota | El sobre es para una sola medición. |
| Error: dirección corta | Falta detalle en la dirección. Agrega calle y número de casa o edificio. |
| Botón | Continuar al pago |

---

## 4. Pago simulado de $9

| Elemento | Texto |
|---|---|
| Título | Pide tu sobre a domicilio |
| Etiqueta corta (visible arriba) | SIMULACIÓN · No se cobra nada |
| Rótulo fijo (completo, arriba del botón) | Pago simulado. Esto es una demostración: no se cobra nada, no se piden datos de tarjeta ni de banco y no se envía un sobre real. |
| Resumen: producto | Sobre de medición Grimuca Agua |
| Resumen: precio | $9 |
| Resumen: envío | A {zona}, desde Grimuca {tienda} |
| Explicación | Esto es una demostración: al tocar el botón no sale dinero de ningún lado. Solo se registra tu pedido. |
| Botón | Pagar $9 (simulación) |
| Procesando | Registrando tu pedido… |
| Confirmación: línea fija | Pago simulado registrado. No se hizo ningún cobro. |
| Confirmación: título | Listo, {nombre}. Tu sobre está pedido. |
| Confirmación: detalle | Pedido N.º {numero} · Sale de Grimuca {tienda} |
| Confirmación: qué sigue | Cuando el pedido salga de la tienda, su estado cambia a Despachado en la app. Cuando te llegue el sobre, abre la app y escanea su QR. |
| Botón | Entendido |
| Botón de la demo | Ya me llegó el sobre (saltar la espera): lleva a escanear el QR |
| Error | No se pudo registrar el pedido. No se cobró nada. Intenta otra vez. |

> Nota legal: esta pantalla no lleva campos de tarjeta, banco, cédula ni pago móvil, ni de adorno. Si el equipo sí va a mandar sobres reales, del rótulo se quita solo "y no se envía un sobre real".

---

## 5. Escanea el QR del sobre (primer paso para medir)

| Elemento | Texto |
|---|---|
| Título | Escanea el QR de tu sobre |
| Subtítulo | Está en la parte de atrás del sobre. Así sabemos que es tu sobre y te llevamos paso a paso. |
| Botón | Abrir la cámara |
| Escaneando | Buscando el código… |
| Código leído | Listo, es tu sobre. |
| Error: no se leyó | No pudimos leer el código. Acércalo un poco y con buena luz, o escríbelo a mano. |
| Enlace de respaldo (propuesto) | Escribir el código del sobre |
| Error: código no válido | Ese código no es de un sobre Grimuca. Revisa que lo hayas escrito bien. |
| Sin permiso de cámara | La app no tiene permiso para usar la cámara. Actívalo en los ajustes del teléfono o escribe el código a mano. |
| ¿Dónde lo consigo? | ¿No tienes sobre? Lo compras en el mostrador de Grimuca Mañongo o San Diego, o en farmacias y supermercados aliados. También puedes pedirlo a domicilio ($9). |
| Botón: pedirlo | Pedir el sobre a domicilio ($9) |

**Pantalla de preparación (después de escanear)**

| Elemento | Texto |
|---|---|
| Título | ¿Ya tienes el sobre en la mano? |
| Subtítulo | Busca un vaso con agua de tu chorro, una mesa y buena luz. Son cinco minutos. |
| Lista: título | Ten a la mano |
| Lista 1 | La tira |
| Lista 2 | La tabla de colores que vino en el sobre |
| Lista 3 | Un vaso con el agua que quieres medir |
| Botón principal | Empezar a medir |
| Botón secundario | Ver el video primero |
| Nota de bacterias | La prueba de bacterias va aparte y tarda 48 horas. Te la explicamos al final. |
| Todavía no llega (solo si lo pidió a domicilio) | ¿Aún no te llega? Tu sobre sale de Grimuca {tienda}. |

---

## 6. "Cómo medir tu agua en 4 pasos"

| Elemento | Texto |
|---|---|
| Título | Cómo medir tu agua en 4 pasos |
| Paso 1: título | Pon una gota en cada casilla |
| Paso 1: línea | Una sola gota de agua por casilla de la tira. Ni más ni menos. |
| Paso 2: título | Espera entre 30 y 60 segundos |
| Paso 2: línea | Toca "Empezar a contar" y te avisamos cuando sea el momento. |
| Paso 3: título | Pon la tira junto a la tabla de colores |
| Paso 3: línea | Una al lado de la otra, sobre la mesa, sin que se tapen. |
| Paso 4: título | Toma la foto con buena luz |
| Paso 4: línea | Cerca de una ventana o con la luz prendida. Sin sombras encima. |
| Botón del contador | Empezar a contar |
| Contador: antes de 30 s | Espera… faltan {segundos} segundos |
| Contador: entre 30 y 60 s | Ahora sí: toma la foto |
| Contador: después de 60 s | Ya pasó el minuto. Toma la foto de una vez, que los colores siguen cambiando. |
| Botón al terminar | Tomar la foto |
| Enlace | Ver el video |

---

## 7. Subir foto

| Elemento | Texto |
|---|---|
| Título | Foto de tu tira |
| Subtítulo | Que se vean completas la tira y la tabla de colores. |
| Botón principal | Tomar la foto |
| Botón secundario | Elegir una foto del teléfono |
| Consejo 1 | Tira y tabla, juntas en la misma foto. |
| Consejo 2 | Buena luz, sin sombras. |
| Consejo 3 | El teléfono derecho, desde arriba. |
| Vista previa: título | ¿Se ve bien? |
| Vista previa: botón principal | Sí, leer mi tira |
| Vista previa: botón secundario | Tomar otra |
| Leyendo | Leyendo los colores de tu tira… |
| Leyendo: línea de espera | Esto tarda unos segundos. |
| Enlace de respaldo | Prefiero anotar los colores yo mismo |

---

## 8. Foto no legible

| Elemento | Texto |
|---|---|
| Título | No pudimos leer bien la foto |
| Explicación | Preferimos decirte que no se ve antes que adivinar. Casi siempre es por la luz o porque la tabla quedó cortada. |
| Qué revisar 1 | Que salgan completas la tira y la tabla. |
| Qué revisar 2 | Que no haya sombra ni reflejo encima. |
| Qué revisar 3 | Que la foto no esté movida. |
| Botón principal | Repetir la foto |
| Botón secundario | Anotar los colores a mano |
| Lectura parcial: título | Leímos una parte |
| Lectura parcial: explicación | Estas casillas no se vieron bien: {casillas}. Puedes repetir la foto o anotarlas tú. |
| Lectura parcial: botón | Anotar las que faltan |

---

## 9. Carga manual

| Elemento | Texto |
|---|---|
| Título | Anota los colores tú mismo |
| Subtítulo | Compara cada casilla de la tira con la tabla y toca el color que más se parezca. |
| Etiqueta por casilla | {parámetro}: ¿a cuál color se parece? |
| Opción para casilla ausente | Mi tira no trae esta casilla |
| Opción de duda | No estoy seguro |
| Ayuda | Si quedas entre dos colores, marca el más oscuro. |
| Avance | {hechas} de {total} casillas |
| Botón | Ver mi resultado |
| Error | Marca al menos una casilla para poder darte un resultado. |

> Nota para Tulio: "si quedas entre dos, marca el más oscuro" es un criterio prudente nuestro, no una instrucción del empaque. Confírmalo o lo quitamos.

---

## 10. Resultado

**Encabezado general (según el peor color de la tira) y llamado a la acción**

| Estado | Título | Línea de apoyo | Acción principal |
|---|---|---|---|
| Verde | Todo lo que medimos salió en rango | Todos los parámetros medidos están en rango. | Si tiene filtro: "Cotizar el recambio de mi filtro por WhatsApp". Si no: "Medir otra vez cuando cambies el cartucho". |
| Amarillo | Hay casillas para vigilar | Una o más casillas salieron cerca del límite. Abajo te decimos cuáles y qué opciones hay en la tienda. | "Agregar a mi lista" en la primera tarjeta de "Lo que te recomendamos". |
| Rojo | Hay casillas que atender | Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué opciones hay en la tienda. | "Agregar a mi lista" en la primera tarjeta; "Cotizar por WhatsApp" como segunda vía. |

> Legal: el verde no lleva tono de tranquilidad ni ícono de aprobado, y el aviso fijo va pegado. El llamado a la acción del verde habla de recambio y de repetir la medición, y no de la calidad del agua.

**Aviso fijo (siempre visible, debajo del encabezado, no se puede cerrar)**

> Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.

**Pie del resultado (debajo del aviso fijo, mismo tamaño de letra)**

> Esta prueba es una orientación, no un análisis de laboratorio, y no certifica que el agua sea apta para tomar.

**Etiqueta por casilla (las palabras son los colores, decisión de Tulio)**

| Estado | Etiqueta |
|---|---|
| Verde | Verde |
| Amarillo | Amarillo |
| Rojo | Rojo |
| No leída | No se pudo leer |
| No viene en la tira | Esta tira no la mide |

| Elemento | Texto |
|---|---|
| Título de la sección | Tu agua, casilla por casilla |
| Fecha | Medición del {fecha} · {origen: con foto / anotada a mano} |
| Aviso de lectura (si fue con foto) | Lectura automática: puede equivocarse. Compara con la tabla de colores y corrige si hace falta. |
| Plomo en amarillo o rojo | Posible presencia de plomo. Una tira casera no lo confirma. Confirma con un laboratorio. |
| Cobre en amarillo o rojo | Posible presencia de cobre. Una tira casera no lo confirma. Confirma con un laboratorio. |
| Plomo o cobre en rojo: línea que se agrega | Por precaución, mientras confirmas, usa otra agua para tomar y cocinar. Hervirla no quita el {plomo / cobre}. |
| Plomo en verde | La tira no marcó presencia de plomo. Una tira casera puede no detectar cantidades bajas. |
| Recambio: a tiempo | Te toca cambiar el cartucho en unos {dias} días. |
| Recambio: vencido | Ya te toca cambiar el cartucho. |
| Recambio: sin fecha | No sabemos cuándo cambiaste el cartucho. Si pasó mucho tiempo, pregunta en la tienda. |
| Botón | Medir otra vez |
| Enlace a bacterias | Falta tu prueba de bacterias. Repórtala a las 48 horas. |

**Qué mide cada casilla (frases de Tulio, van junto a cada indicador; el Especialista de agua las revisa)**

| Casilla | Qué mide |
|---|---|
| Cloro | Es lo que se usa para desinfectar el agua. Si hay mucho, cambia el sabor y el olor. |
| pH | Dice si el agua está ácida o alcalina. Si se sale del rango, daña las tuberías y cambia el sabor. |
| Dureza | Es el sarro. Mancha la grifería, tapa la ducha y gasta los equipos. |
| Alcalinidad | Muestra qué tan estable es el agua. Si está fuera de rango, se forma sarro o corrosión. |
| Hierro | Es lo que deja el agua amarilla y mancha la ropa y el baño. |
| Cobre y plomo | Vienen de las tuberías viejas. Con esto no se juega. *(Adaptado por legal: Tulio añadía "si sale en rojo, toca filtrar". Ver abajo.)* |
| Nitrato y nitrito | Vienen de la tierra, de abonos o del pozo séptico. Es una señal de alerta de contaminación. |
| Bacterias (frasco aparte) | El resultado sale en 48 horas. Cuando lo reportes, te mostramos el texto de la sección 14. |

**Cobre y plomo: qué dice la app (literal de legal)**
- Junto al indicador: "Vienen de las tuberías viejas. Con esto no se juega."
- Hallazgo en amarillo o rojo: "Posible presencia de plomo (o cobre). Una tira casera no lo confirma. Confirma con un laboratorio."
- Nunca "toca filtrar" para plomo o cobre. Lo que sí se puede: la línea de precaución de arriba y, solo si la ficha del fabricante lo dice, "pensado para reducir…".

**Recordatorio del cartucho (dentro de la app, en la demo)**

| Elemento | Texto |
|---|---|
| Tarjeta | Te avisamos aquí cuándo toca cambiar el cartucho. |
| Frecuencia de referencia (estimación de Tulio) | Los cartuchos se cambian más o menos cada 3 meses. |
| Siguiente paso, marcado como "Próximamente" | Recordatorio por WhatsApp. |

**Lo que te recomendamos (tarjeta de producto)**

| Elemento | Texto |
|---|---|
| Encabezado | Lo que te recomendamos |
| Subtítulo | Según tu resultado y lo que nos contaste de tu casa. |
| En la tarjeta | Pensado para: {hallazgos} |
| Precio | No se muestra (decisión de Tulio). Enlace: **Cotizar por WhatsApp** |
| Línea bajo el enlace | El precio te lo confirma la tienda por WhatsApp, sin compromiso. |
| Disponibilidad | Hay en Grimuca {tienda} |
| Sin existencia | Por ahora no hay en {tienda}. Mira si hay en otra tienda. |
| Botón de la tarjeta | Agregar a mi lista |
| Ya agregado | En tu lista |
| Aviso al agregar | Agregado a tu lista |
| Marcador de catálogo (literal de Legal) | Sugerido según tu resultado. Producto y precio de ejemplo. |
| Sección sin productos: título | Lo que sigue |
| Sección sin productos: texto | Con esta medición no tenemos un cartucho que recomendarte. Lo que toca ahora es cambiar el cartucho a tiempo y volver a medir cuando lo cambies. |
| Sección sin productos: botón (solo si tiene filtro) | Cotizar el recambio de mi filtro por WhatsApp |
| Sección sin productos: enlace | ¿Dudas? Pasa por la tienda y lo vemos contigo. |
| Tarjeta "Tu cartucho": enlace con productos | Ver productos sugeridos |
| Tarjeta "Tu cartucho": enlace sin productos | Cotizar el recambio |
| Hogar sin filtro: título | ¿Todavía no tienes filtro? |
| Hogar sin filtro: texto | Pregunta en la tienda qué filtro se ajusta a tu casa. Te contamos las opciones según lo que midió tu tira y cuántos son en casa. |
| Hogar sin filtro: botón | Preguntar por filtros por WhatsApp |

> Nota: "Pensado para" en vez de "corrige" o "elimina": no prometemos lo que hace el cartucho. Con la ficha del fabricante en mano se puede decir "Pensado para reducir {hallazgo} (según el fabricante)"; sin ficha, no se afirma nada.

---

## 11. Mi lista

| Elemento | Texto |
|---|---|
| Título | Mi lista |
| Subtítulo | Lo que le pedimos a la tienda por ti. |
| Cantidad | Cantidad |
| Quitar | Quitar |
| Total | Total estimado: ${total} |
| Nota | No se cobra nada ahora. La tienda te escribe al WhatsApp que nos diste para confirmarte el precio y la entrega. (Se aplica cuando Tulio confirme quién escribe y cuándo.) |
| Botón | Hacer pedido |
| Lista vacía: título | Tu lista está vacía |
| Lista vacía: línea | Mide tu agua y te decimos qué cartucho te sirve. |
| Lista vacía: botón | Medir mi agua |

---

## 12. Retiro o envío

| Elemento | Texto |
|---|---|
| Título | ¿Cómo lo quieres recibir? |
| Opción 1 | Lo retiro en la tienda |
| Opción 1: ayuda | Escoge la que te quede más cómoda. También retiras ahí el filtro y los cartuchos. |
| Tiendas | Grimuca Mañongo · Grimuca Big Low · Grimuca CC CEM |
| Horario | Lunes a viernes de 8:30 a. m. a 4:30 p. m. · Sábados de 9:00 a. m. a 2:00 p. m. · Domingos cerrado |
| Opción 2 | Que me lo lleven a la casa |
| Opción 2: ayuda | Sale de Grimuca {tienda}, la más cercana a {zona}. |
| Dirección | Dirección de entrega |
| Usar la misma | Usar la misma dirección del sobre |
| Costo de envío | [COSTO DE ENVÍO: pendiente de Tulio] |
| Botón | Confirmar pedido |
| Error | Escoge retiro o envío para seguir. |

---

## 13. Pedido confirmado

| Elemento | Texto |
|---|---|
| Título | Listo, {nombre}. Tu pedido ya está en la tienda. |
| Número | Pedido N.º {numero} |
| Si es retiro | Pasa por Grimuca {tienda} y da tu nombre en el mostrador. |
| Si es envío | Sale de Grimuca {tienda} hacia {direccion}. |
| Estado: pendiente | En preparación |
| Estado: despachado | Despachado |
| Aviso al despachar | Tu pedido ya salió de Grimuca {tienda}. |
| Qué sigue | La tienda te escribe al WhatsApp que nos diste para confirmarte el precio y la entrega. |
| Aviso | No se cobra nada ahora. |
| Recordatorio de recambio (si hay fecha) | Te toca cambiar el cartucho en {dias} días. Vuelve a medir cuando lo cambies. |
| Botón principal | Volver a mis resultados |
| Botón secundario | Ver tiendas |

---

## 14. Prueba de bacterias a las 48 horas

| Elemento | Texto |
|---|---|
| Título | Reporta tu prueba de bacterias a las 48 horas |
| Subtítulo | El frasco que vino en el sobre busca bacterias coliformes. Necesita 48 horas quieto para dar resultado. |
| Cómo hacerla | Sigue las instrucciones que trae el frasco y toca "Ya la puse" para empezar a contar. |
| Botón de inicio | Ya la puse |
| Contando | Faltan {horas} horas para revisar el frasco. |
| Mientras esperas | Déjalo quieto, tapado y lejos del sol. |
| Llegó la hora | Ya pasaron 48 horas. Mira el frasco. |
| Antes de elegir | Reporta solo cuando hayan pasado 48 horas completas desde que llenaste el frasco. |
| Pregunta | ¿Cómo está el frasco? |
| Opción 1 | Cambió de color |
| Opción 2 | Sigue igual |
| Botón | Reportar |
| Resultado: cambió (rojo o amarillo) | El frasco cambió de color. Eso indica posible presencia de bacterias coliformes en la muestra. Es una prueba casera orientativa, no un análisis de laboratorio. Por precaución, hierve el agua antes de tomarla y confirma el resultado con un laboratorio. Si alguien en casa se siente mal, consulta a un médico. |
| Resultado: sigue igual (azul o gris, nunca verde ni con ícono de aprobado) | El frasco no cambió de color. La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua ni significa que sea apta para tomar: es una prueba casera orientativa, depende de cómo se tomó la muestra y no detecta virus, parásitos ni otros contaminantes. Si quieres certeza, pide un análisis de laboratorio. |
| Aviso fijo de esta pantalla (debajo de ambos resultados) | Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar. |
| Pie del resultado (debajo del aviso fijo, en ambos casos) | Esta prueba es una orientación, no un análisis de laboratorio, y no certifica que el agua sea apta para tomar. |
| Explicación junto al indicador de bacterias | El resultado sale en 48 horas. |
| Invitación a la tienda (aparte, debajo; solo si cambió) | ¿Quieres orientación? Pasa por la tienda o escríbenos por WhatsApp y lo vemos contigo. |
| Sugerencia de lámpara UV (tarjeta aparte, debajo; solo si cambió) | Opción para consultar en tienda: lámpara UV, pensada para reducir bacterias según el fabricante. No significa que el agua quede apta para tomar. Sigue hirviendo el agua y confirma con un laboratorio. |
| Reportada | Prueba reportada el {fecha}. Gracias. |
| Aún no la hace | Todavía no has puesto la prueba de bacterias. Está en tu sobre. |

> Nota: las instrucciones exactas del frasco (cuánta agua, de qué color a qué color cambia) dependen del producto que se consiga. Falta: [INSTRUCCIONES DEL FRASCO: pendiente de Tulio].
>
> Nota legal: los dos resultados y el aviso fijo se pegan literal. "E. coli" solo se nombra si la caja del frasco real lo dice. La tarjeta de la lámpara UV lleva "Producto y precio de ejemplo" mientras el catálogo sea de ejemplo; si el producto no tiene ficha del fabricante, queda solo "Opción para consultar en tienda: lámpara UV." más las dos frases finales. Condiciones completas en `docs/legal/revision-2.md`.

---

## 15. Estados vacíos y errores

**Estados vacíos**

| Dónde | Texto |
|---|---|
| Resultados, sin mediciones | Todavía no has medido tu agua. Cuando lo hagas, aquí queda guardado. |
| Resultados: botón | Medir mi agua |
| Medir, sin perfil | Primero cuéntanos de tu casa. Es un minuto. |
| Medir, sin sobre | Para medir necesitas el sobre. Escanea su QR, o pídelo a domicilio ($9). |
| Tiendas | Ver la sección 16 |
| Pedidos, sin pedidos | No tienes pedidos todavía. |
| Mi lista vacía | Tu lista está vacía. Mide tu agua y te decimos qué cartucho te sirve. |

**Errores**

| Caso | Texto |
|---|---|
| Sin conexión | Se fue la señal. Revisa tu internet e intenta otra vez. Lo que llenaste no se pierde. |
| Falla general | Algo falló de nuestro lado. Intenta otra vez en un momento. |
| Tarda demasiado | Esto está tardando más de la cuenta. Puedes esperar o anotar los colores a mano. |
| Foto muy pesada | La foto pesa mucho. Tómala otra vez desde la app. |
| Archivo que no es foto | Ese archivo no es una foto. Usa JPG o PNG. |
| Sin permiso de cámara | La app no tiene permiso para usar la cámara. Actívalo en los ajustes del teléfono o elige una foto que ya tengas. |
| Lectura no disponible | Ahora mismo no podemos leer fotos. Anota los colores a mano y sigue. |
| No se guardó | No se pudo guardar. Intenta otra vez. |
| Pedido no enviado | No se pudo enviar el pedido. Tu lista sigue ahí; intenta otra vez. |
| Página no existe | Esta página no existe. Vuelve al inicio. |
| Botón en errores | Intentar otra vez |

---

## 16. Tiendas (`/tiendas`)

Datos tomados de grimuca.com por Tulio. WhatsApp compartido de las tres tiendas.

| Elemento | Texto |
|---|---|
| Título | Nuestras tiendas |
| Subtítulo | Aquí compras el sobre, y retiras filtros y cartuchos. |
| Horario (común) | Lunes a viernes de 8:30 a. m. a 4:30 p. m. · Sábados de 9:00 a. m. a 2:00 p. m. · Domingos cerrado |
| Tienda 1 | **Grimuca Mañongo** (Naguanagua). C.C. Profesional Paseo Orquídea, local A-3, Av. Salvador Feo La Cruz. |
| Tienda 2 | **Grimuca Big Low** (San Diego). C.C. Big Low Center, nivel 1, nave F, locales 1–3 y 35–37, calle 101, diagonal al terminal. |
| Tienda 3 | **Grimuca CC CEM** (San Diego). C.C. CEM I, nivel 1, local 06, Av. Don Julio Centeno, frente al Big Low. |
| WhatsApp | Escríbenos por WhatsApp: +58 414-4409396 (es el mismo para las tres tiendas). |
| Botón | Escribir por WhatsApp |
| Dónde comprar el sobre | El sobre también se vende en el mostrador de Mañongo y San Diego, y en farmacias y supermercados aliados. |
| Pie | Saber qué tomas empieza en casa |

> Nota: el botón solo abre una conversación de WhatsApp con la tienda. La app no envía mensajes ni recordatorios por WhatsApp (queda como siguiente paso).

---

## 17. Siguiente paso (marcado "Próximamente", no funciona en la demo)

| Elemento | Texto |
|---|---|
| Recordatorio | Próximamente: te avisamos por WhatsApp cuándo toca cambiar el cartucho. |
| Video | Próximamente: un video corto para que cambies tú mismo el cartucho. |
| Plomero | Próximamente: pide un plomero o técnico para instalar o cambiar el cartucho. Es un servicio con costo. |

---

## 18. Panel del operador

**Entrada**

| Elemento | Texto |
|---|---|
| Título | Panel de tiendas |
| Campo | PIN |
| Botón | Entrar |
| Error | PIN incorrecto. Prueba otra vez. |
| Pestañas | Resumen · Despacho · Inventario · Zonas |
| Filtro | Todas las tiendas · Mañongo · Big Low · CC CEM |

**Resumen**

| Elemento | Texto |
|---|---|
| Título | Resumen por tienda |
| Subtítulo | Cómo va cada tienda hoy. |
| Cifra 1 | Hogares |
| Cifra 2 | Pedidos pendientes |
| Cifra 3 | Recambios en 7 días |
| Cifra 4 | Recambios en 30 días |
| Enlace de la tarjeta | Ver despacho de {tienda} |
| Vacío | Todavía no hay hogares registrados en {tienda}. |

**Despacho**

| Elemento | Texto |
|---|---|
| Título | Despacho |
| Subtítulo | Sobres y cartuchos por salir, por tienda y zona. |
| Indicador en vivo | En vivo |
| Indicador sin conexión | Sin conexión en vivo. Actualizando cada 5 segundos. |
| Columnas | Pedido · Cliente · Zona · Qué lleva · Cómo se entrega · Estado |
| Tipo | Sobre · Cartucho |
| Modalidad | Retiro en tienda · Envío a casa |
| Estado | Pendiente · Despachado |
| Botón | Despachado |
| Aviso de pedido nuevo | Pedido nuevo en {tienda} |
| Etiqueta de fila nueva | Nuevo |
| Aviso al despachar | Pedido N.º {numero} despachado |
| Contador | {n} por despachar |
| Vacío | No hay nada por despachar en {tienda}. |
| Error | No se pudo marcar como despachado. Intenta otra vez. |

**Inventario**

| Elemento | Texto |
|---|---|
| Título | Inventario |
| Subtítulo | Lo que hay contra lo que se va a pedir en 30 días. |
| Columnas | Cartucho · Hay · Se van a pedir (30 días) · Faltan |
| Etiqueta en rojo | Falta |
| Etiqueta normal | Alcanza |
| Resumen de faltantes | Faltan {n} cartuchos en {tienda} para cubrir los próximos 30 días. |
| Sin faltantes | Hay inventario para cubrir los próximos 30 días. |
| Vacío | No hay inventario cargado para {tienda}. |

**Zonas**

| Elemento | Texto |
|---|---|
| Título | Zonas |
| Subtítulo | Dónde están saliendo mediciones en rojo. |
| Alerta de zona | Alerta en {zona}: {n} hogares en rojo en los últimos 7 días. |
| Línea de apoyo de la alerta | Revisa el inventario de Grimuca {tienda}, que es la que atiende esa zona. |
| Botón de la alerta | Ver inventario |
| Columnas | Zona · Hogares · En rojo (7 días) · Tienda que la atiende |
| Sin alertas | Ninguna zona en alerta esta semana. |
| Regla (texto pequeño) | Una zona entra en alerta con 3 o más hogares en rojo en 7 días. |

---

## 19. Mensajes que la app escribe en WhatsApp (los envía el cliente, que puede editarlos)

El enlace abre el chat de las tiendas con el texto ya escrito. Datos que usa: nombre, zona, fecha de la medición, casillas en Amarillo o Rojo (con "orientativo" en plomo y cobre), cuántos viven, filtro y etapas. Las variables y el detalle están en `cambios-para-la-app.md` (cambios 1, 3, 5 y 12). El Asesor legal confirma este uso.

| Cuándo | Mensaje |
|---|---|
| Cotizar un cartucho | Hola, soy {nombre}, de {zona}. Medí mi agua con el sobre de Grimuca Agua el {fecha}. Casillas para vigilar o atender: {lista}. Somos {personas} en casa{filtro}. Quiero cotizar: {producto} (código {codigo}). ¿Tienen en {tienda}? |
| Resultado todo en verde | Hola, soy {nombre}, de {zona}. Tengo un filtro de {etapas} etapas y el último cambio de cartucho fue {fecha, o "no me acuerdo"}. Mi medición del {fecha}: todas las casillas medidas salieron en Verde. Quiero cotizar el recambio. |
| Sin filtro | Hola, soy {nombre}, de {zona}. Somos {personas} en casa y no tenemos filtro. Mi medición del {fecha}: {lista}. ¿Qué filtros tienen y cuánto cuestan? |
| Frasco de bacterias que cambió | Hola, soy {nombre}, de {zona}. Mi prueba de bacterias cambió de color a las 48 horas. Quiero consultar la lámpara UV. |
