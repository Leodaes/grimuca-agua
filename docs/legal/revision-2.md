# Revisión 2: textos que van a la app

Asesor legal · segunda pasada · sáb 21 nov 2026
**No reemplaza a un abogado.** Norma aplicada: `puede-y-no-puede-decir.md` y `textos.md`.
No se tocaron umbrales, tablas numéricas ni referencias.

## 1. Cambios en `docs/negocio/agua.md`

| Dónde | Antes | Después |
|---|---|---|
| §2 `dureza` amarillo | "...No es un tema de salud, pero le acorta la vida a tus equipos." | "...y le acorta la vida a tus equipos." (se quita el juicio de salud) |
| §2 `cobre` amarillo | "La tira marca posible presencia de cobre. Puede venir de las tuberías. Confirma con un laboratorio." | "Posible presencia de cobre. Una tira casera no lo confirma. Confirma con un laboratorio." |
| §2 `cobre` rojo | "...posible presencia alta de cobre. No es un diagnóstico... usa otra agua para tomar y cocinar." | "Posible presencia de cobre. Una tira casera no lo confirma. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar y cocinar. Hervirla no quita el cobre." |
| §2 `plomo` amarillo | "La tira marca posible presencia de plomo. Una tira casera no alcanza para asegurarlo..." | "Posible presencia de plomo. Una tira casera no lo confirma. Confirma con un laboratorio." |
| §2 `plomo` rojo | "...en nivel alto. No es un diagnóstico... sobre todo si hay niños o embarazadas. Hervirla no quita el plomo." | "Posible presencia de plomo. Una tira casera no lo confirma. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar y cocinar. Hervirla no quita el plomo." |
| §2 `plomo` verde | (frase genérica) | "La tira no marcó presencia de plomo. Una tira casera puede no detectar cantidades bajas." |
| §2 `cloro_libre` amarillo | "Un filtro de carbón lo resuelve." | "Un filtro de carbón está pensado para reducirlo." |
| §2 `cloro_libre` rojo | "Si sigue igual, no la tomes así: pásala por un filtro de carbón." | "Si sigue igual, por precaución usa otra agua para tomar mientras lo revisas. Un filtro de carbón está pensado para reducir el cloro." |
| §2 `cloro_libre` = 0 | "...no tiene protección contra microbios. Haz la prueba de bacterias del sobre." | "La tira no marcó cloro. Si tu agua viene de tanque o pozo, vale la pena hacer la prueba de bacterias del sobre." |
| §2 `nitrato` amarillo | "Aparecen nitratos en nivel medio..." | "La tira marca nitratos en nivel medio..." |
| §2 `nitrato` rojo | "...Si en casa hay bebés o embarazadas, usa otra agua para tomar y preparar teteros..." | "La tira marca nitratos altos. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar, cocinar y preparar teteros. Hervirla no quita los nitratos." |
| §2 `nitrito` amarillo | "...Puede ser señal de contaminación reciente..." | "La tira marca nitritos. Repite la prueba y haz también la de bacterias del sobre." |
| §2 `nitrito` rojo | "No uses esta agua para bebés ni teteros, no intentes arreglarla hirviéndola..." | "La tira marca nitritos altos. Confirma con un laboratorio. Por precaución, mientras confirmas, usa otra agua para tomar, cocinar y preparar teteros. Hervirla no quita los nitritos." |
| §2 reglas de redacción | Tres reglas | Se agregan: sin "diagnóstico", sin "resuelve / elimina / corrige", sin efectos en la salud ni grupos de personas; frases literales. |
| §3 encabezado | (sin nota) | Nota: tabla interna; "corrige", "muy bien", "quita" y "desinfecta" no pasan a la app. |
| §4 | Lista de límites | Se agregan: "potable" ni en negativo; "apta" solo en los textos literales; nunca "tiene plomo / libre de plomo / detectamos E. coli"; nunca "elimina / purifica / protege"; aviso fijo también en bacterias. |
| §5 título | "(E. coli y coliformes, frasco a 48 horas)" | "(coliformes, frasco a 48 horas)" |
| §5 tabla, "Cambió de color" | "Hay coliformes en esa muestra." | "Posible presencia de coliformes en esa muestra... Se confirma en laboratorio." |
| §5 texto "Cambió de color" | Texto propuesto (con "hay bacterias coliformes", minuto de hervor y lavado del tanque) | Literal de `textos.md` (e). |
| §5 texto "Sigue igual" | Texto propuesto (con "Es una buena señal") | Literal de `textos.md` (e). |
| Encabezado y pendiente 5 | "Pendiente: el Asesor legal revisa..." | Marcado como revisado. |

Sin cambios, quedan aprobadas: `alcalinidad`, `ph`, `hierro`, `dureza` rojo y la frase genérica de verde.

## 2. Cambios en `docs/marketing/textos-app.md`

| Dónde | Antes | Después |
|---|---|---|
| Cómo leer | "Marcado (legal): texto provisional..." | "Revisado por el Asesor legal (revisión 2)..." Se quitaron todas las marcas "(legal)". |
| §1 bienvenida | (faltaba) | Línea fija: "Medición orientativa con tira. No es un análisis de laboratorio." |
| §1 subtítulo | "...te decimos qué está saliendo por tu chorro y qué hacer." | "...te decimos qué marcó la tira y qué hacer." |
| §2 consentimiento | "Acepto que Grimuca use estos datos para enviarme el sobre y atender mis pedidos." | Texto (a) literal, con enlace al Aviso de privacidad y línea de la demo. |
| §3 qué trae 2 | "1 prueba de bacterias (E. coli y coliformes)" | "1 prueba casera de bacterias coliformes" |
| §4 título | "Paga tu sobre" | "Pide tu sobre" |
| §4 rótulo | Solo "SIMULACIÓN · No se cobra nada" | Se conserva como etiqueta corta y se agrega el rótulo (f) completo arriba del botón. |
| §4 confirmación | (faltaba) | "Pago simulado registrado. No se hizo ningún cobro." |
| §10 encabezado amarillo | "Nada urgente, pero conviene atenderlo antes de que empeore." | "Una o más casillas salieron cerca del límite. Abajo te decimos cuáles." |
| §10 plomo y cobre | "Posible presencia de plomo. Confirma con un laboratorio." + nota "Una tira casera orienta, no confirma." | "Posible presencia de [plomo / cobre]. Una tira casera no lo confirma. Confirma con un laboratorio." En rojo se agrega la línea de precaución. Se agrega plomo en verde. |
| §10 lectura con foto | (faltaba) | "Lectura automática: puede equivocarse. Compara con la tabla de colores y corrige si hace falta." |
| §10 marcador de catálogo | "Producto de ejemplo. El catálogo real está por llegar." | "Sugerido según tu resultado. Producto y precio de ejemplo." |
| §10 sin productos | "Por ahora no hace falta cambiar nada..." | "Con esta medición no tenemos un cartucho que recomendarte..." |
| §14 subtítulo | "busca E. coli y coliformes" | "busca bacterias coliformes" |
| §14 antes de elegir | (faltaba) | "Reporta solo cuando hayan pasado 48 horas completas desde que llenaste el frasco." |
| §14 resultado: cambió | "...posible presencia de bacterias. Confirma con un laboratorio y pasa por la tienda para orientarte." | Texto (e) literal. La invitación a la tienda va aparte, debajo. |
| §14 resultado: sigue igual | "...Es buena señal, pero esta prueba no certifica el agua." | Texto (e) literal. Color neutro, nunca verde. |
| §14 aviso fijo | "Esta prueba es orientativa. No reemplaza un análisis de laboratorio." | Aviso fijo (d) literal. |
| §14 lámpara UV | (no existía) | Fila nueva con el texto (g), solo si el frasco cambió. |

## 3. Veredicto: sugerir lámparas UV cuando el frasco cambie de color

**Se puede, con condiciones.** Es una recomendación comercial atada a un hallazgo, igual que los cartuchos. El riesgo es que el cliente lea "compra la lámpara y ya puedes tomar el agua". El texto y la pantalla tienen que cortar esa lectura.

Texto permitido, literal (quedó como sección (g) de `textos.md`):

> Opción para consultar en tienda: lámpara UV, pensada para reducir bacterias según el fabricante. No significa que el agua quede apta para tomar. Sigue hirviendo el agua y confirma con un laboratorio.

Condiciones:

1. Solo aparece con "Cambió de color". Nunca con "Sigue igual".
2. Va en tarjeta aparte, **debajo** del resultado (e) y del aviso fijo (d). Primero la precaución, después el producto.
3. "Pensada para reducir bacterias según el fabricante" solo si la ficha del producto del catálogo lo declara. Sin ficha queda: "Opción para consultar en tienda: lámpara UV." más las dos frases finales.
4. Mientras el catálogo sea de ejemplo, la tarjeta lleva "Producto y precio de ejemplo".
5. Botón: "Consultar en tienda" o "Agregar a mi lista". Prohibido: "Soluciónalo", "Compra ya", "Protege a tu familia", "elimina", "desinfecta tu agua", "agua lista para tomar".
6. Sin rojo, sin íconos de alarma y sin cuenta regresiva en la tarjeta: no se vende con miedo.
7. La tienda es la que revisa si la lámpara aplica a esa casa (necesita agua clara y un equipo antes). La app no lo afirma.
8. En la voz y en el deck aplica el mismo texto. En el deck se puede decir: "si la prueba casera cambia de color, la app recomienda hervir, confirmar con laboratorio y ofrece consultar una lámpara UV en tienda".

## 4. Sigue pendiente de "confirmar con abogado"

1. Línea de precaución en rojo ("usa otra agua para tomar y cocinar", "preparar teteros"): si basta así o si debe nombrar a bebés y embarazadas. Hoy no se nombran por la regla de no atar efectos de salud al resultado.
2. Venta de lámparas UV y cartuchos con propiedades sobre el agua de consumo: si exigen registro o permiso sanitario y qué puede decir su publicidad.
3. Publicidad engañosa: texto exacto y sanciones (art. 117 de la Constitución; art. 17 de la Ley Antimonopolio, citado de fuente secundaria).
4. Datos personales: no hay ley especial; base en arts. 28 y 60 de la Constitución. Validar el aviso de privacidad, el plazo de 12 meses, el envío de la foto a un proveedor externo y el servidor fuera del país.
5. Forma de exhibir precios en divisas y en bolívares para la venta real.
6. Valores de la norma venezolana (Gaceta Oficial 36.395): no se citan cifras hasta leer los cuadros.
7. Marcadores sin llenar en `textos.md`: `[RESPONSABLE]`, `[CONTACTO]`, `[PROVEEDOR]`, `[FECHA]`.

Pendientes que no son de abogado:

- Instructivo del frasco real: las 48 horas, el color que cuenta como cambio, si distingue E. coli y cómo se desecha.
- Minuto de hervor y lavado del tanque: sin fuente verificada, no van en el resultado.
- §4 de `textos-app.md`: el rótulo dice "no se envía un sobre real" y la confirmación dice "Tu sobre está pedido" y "Cuando te llegue". Tulio decide si se mandan sobres reales; si sí, se quita esa frase del rótulo.
- Correcciones de la primera revisión todavía abiertas en `deck.md`, `portal.md` y `resumen-para-tulio.md`.
- Calidad: la búsqueda de `apta` ahora admite también el texto (g).
