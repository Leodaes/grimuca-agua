# Textos de la app · Grimuca Agua

Borrador de Marketing para validar con Tulio. Listos para pegar.

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

---

## 0. Elementos comunes

| Elemento | Texto |
|---|---|
| Nombre en el encabezado | Grimuca Agua |
| Barra inferior | Medir · Resultados · Tiendas · WhatsApp · Mi lista |
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
| Título | Descubre la calidad del agua de tu casa |
| Línea fija bajo el título | Medición orientativa con tira. No es un análisis de laboratorio. |
| Subtítulo | Te mandamos un sobre con la prueba, la haces tú mismo y en minutos te decimos qué marcó la tira y qué hacer. |
| Beneficio 1 | **Mides en tu casa.** Una tira, una gota por casilla y una foto. |
| Beneficio 2 | **Te lo explicamos claro.** Verde, amarillo o rojo, casilla por casilla. |
| Beneficio 3 | **Te decimos qué cartucho va.** Y sale de la tienda Grimuca que te quede más cerca. |
| Botón | Empezar |
| Enlace secundario | Ya me llegó el sobre |
| Pie | Grimuca · Mañongo · Big Low · CC CEM |

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
| Subtítulo | Sale de la tienda Grimuca más cercana a tu zona. |
| Campo dirección | Dirección de entrega |
| Ayuda dirección | Urbanización, calle, casa o edificio y apartamento. |
| Campo referencia | Punto de referencia (opcional) |
| Ayuda referencia | Algo que ayude a ubicarte: frente a la panadería, portón negro. |
| Tienda asignada | Tu sobre sale de: **Grimuca {tienda}** |
| Cambiar tienda | Prefiero otra tienda |
| Qué trae el sobre (título) | Qué te llega |
| Qué trae 1 | 1 tira para medir tu agua |
| Qué trae 2 | 1 prueba casera de bacterias coliformes |
| Qué trae 3 | La tabla de colores impresa |
| Qué trae 4 | Un código QR con el video de cómo se hace |
| Nota | El sobre es para una sola medición. |
| Error: dirección corta | Falta detalle en la dirección. Agrega calle y número de casa o edificio. |
| Botón | Continuar al pago |

---

## 4. Pago simulado de $9

| Elemento | Texto |
|---|---|
| Título | Pide tu sobre |
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
| Confirmación: qué sigue | Cuando te llegue, abre la app y toca "Ya me llegó el sobre". |
| Botón | Entendido |
| Botón de la demo | Ya me llegó el sobre (saltar la espera) |
| Error | No se pudo registrar el pedido. No se cobró nada. Intenta otra vez. |

> Nota legal: esta pantalla no lleva campos de tarjeta, banco, cédula ni pago móvil, ni de adorno. Si el equipo sí va a mandar sobres reales, del rótulo se quita solo "y no se envía un sobre real".

---

## 5. "Ya me llegó el sobre"

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
| Todavía no llega | ¿Aún no te llega? Tu sobre sale de Grimuca {tienda}. |

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

**Encabezado general (según el peor color de la tira)**

| Estado | Título | Línea de apoyo |
|---|---|---|
| Verde | Todo lo que medimos salió en rango | Ninguna casilla salió fuera de lo esperado en esta medición. |
| Amarillo | Hay casillas para vigilar | Una o más casillas salieron cerca del límite. Abajo te decimos cuáles. |
| Rojo | Hay casillas que atender | Una o más casillas salieron fuera de rango. Abajo te decimos cuáles y qué hacer. |

**Aviso fijo (siempre visible, debajo del encabezado, no se puede cerrar)**

> Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.

**Etiqueta por casilla**

| Estado | Etiqueta |
|---|---|
| Verde | En rango |
| Amarillo | Para vigilar |
| Rojo | Fuera de rango |
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

**Qué es cada casilla, en palabras de mostrador (provisional: lo ajusta el Especialista de agua)**

| Casilla | Qué es |
|---|---|
| pH | Qué tan ácida o alcalina sale el agua. |
| Dureza | Cuánta cal trae. Es la que deja sarro en ollas, grifos y duchas. |
| Cloro | El cloro que le queda al agua del tratamiento. |
| Alcalinidad | Lo que ayuda a que el pH no cambie de golpe. |
| Nitrato | Algo que no debería salir alto. Si sale, vale la pena confirmarlo con un laboratorio. |
| Nitrito | Igual que el nitrato: si sale alto, confírmalo con un laboratorio. |
| Hierro | El que pone el agua amarilla y mancha la ropa y las pocetas. |
| Plomo | Posible presencia. Confirma con un laboratorio. |
| Cobre | Posible presencia. Confirma con un laboratorio. |

**Productos sugeridos**

| Elemento | Texto |
|---|---|
| Encabezado | Lo que te recomendamos |
| Subtítulo | Según tu resultado y lo que nos contaste de tu casa. |
| En la tarjeta | Pensado para: {hallazgos} |
| Precio | ${precio} |
| Disponibilidad | Hay en Grimuca {tienda} |
| Sin existencia | Por ahora no hay en {tienda}. Mira si hay en otra tienda. |
| Botón de la tarjeta | Agregar a mi lista |
| Ya agregado | En tu lista |
| Aviso al agregar | Agregado a tu lista |
| Marcador de catálogo | Sugerido según tu resultado. Producto y precio de ejemplo. |
| Sin productos (todo en verde) | Con esta medición no tenemos un cartucho que recomendarte. Vuelve a medir cuando cambies el cartucho o si notas el agua distinta. |
| Pie | ¿Dudas? Pasa por la tienda y lo vemos contigo. |

> Nota: "Pensado para" en vez de "corrige" o "elimina": no prometemos lo que hace el cartucho. Con la ficha del fabricante en mano se puede decir "Pensado para reducir {hallazgo} (según el fabricante)"; sin ficha, no se afirma nada.

---

## 11. Mi lista

| Elemento | Texto |
|---|---|
| Título | Mi lista |
| Subtítulo | Lo que vas a pedir a la tienda. |
| Cantidad | Cantidad |
| Quitar | Quitar |
| Total | Total estimado: ${total} |
| Nota | Aquí no se cobra nada. La tienda te confirma el precio y cómo pagar. |
| Botón | Pedir |
| Lista vacía: título | Tu lista está vacía |
| Lista vacía: línea | Mide tu agua y te decimos qué cartucho te sirve. |
| Lista vacía: botón | Medir mi agua |

---

## 12. Retiro o envío

| Elemento | Texto |
|---|---|
| Título | ¿Cómo lo quieres recibir? |
| Opción 1 | Lo retiro en la tienda |
| Opción 1: ayuda | Escoge la que te quede más cómoda. |
| Tiendas | Grimuca Mañongo · Grimuca Big Low · Grimuca CC CEM |
| Horario | Horario: {horario} |
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
| Medir, sin sobre pedido | Para medir necesitas el sobre. Pídelo y te lo mandamos. |
| Tiendas | Grimuca Mañongo · Grimuca Big Low · Grimuca CC CEM |
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

## 16. Panel del operador

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
