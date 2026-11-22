# Lo que la app puede y no puede decir

Asesor legal · primera corrida (antes del código) · sáb 21 nov 2026
**No reemplaza a un abogado.** Lo marcado "confirmar con abogado" no es certeza.
Aplica a: pantallas, mensajes de error, voz (ElevenLabs), deck, guion, video, descripción del portal, README y redes.

## Regla madre

La app **informa lo que marcó una tira casera y recomienda un producto**. No certifica agua, no diagnostica y no da consejo de salud. Decir "potable" exige cumplir la norma sanitaria venezolana completa (Normas Sanitarias de Calidad del Agua Potable, Resolución SG-018-98, Gaceta Oficial 36.395 del 13-02-1998), que se comprueba en laboratorio y abarca mucho más de lo que mide una tira.

## SÍ puede decir

1. Qué parámetros leyó la tira y en qué nivel cayó cada uno, "según la tabla de colores de la tira".
2. "En rango", "Para vigilar" o "Fuera de rango" **por parámetro**, nombrando la referencia usada (la que fije el Especialista de agua).
3. "Resultado orientativo" y "lectura automática: puede equivocarse".
4. Plomo y cobre: "posible presencia; confirma con un laboratorio".
5. Bacterias, frasco que cambió: "posible presencia de bacterias coliformes en la muestra".
6. Bacterias, frasco igual: "la prueba no detectó bacterias coliformes en esta muestra" (siempre con la aclaratoria de que no certifica el agua).
7. "No pudimos leer la tira. Repite la foto o carga los colores a mano." Nunca adivinar.
8. Recomendar un cartucho "pensado para reducir X", **solo si la ficha del fabricante lo dice**.
9. Cuándo toca cambiar el cartucho, como estimación ("te toca cambiarlo en unos X días").
10. Sugerir un análisis de laboratorio y precauciones generales (hervir el agua).
11. Lo que la tira **no** mide: bacterias, virus, parásitos, pesticidas y otros metales.

## NO puede decir (nunca, en ningún canal)

1. **"Potable"**: ni siquiera en negativo ("no es potable"). La palabra no aparece en la app.
2. **"Segura"**, **"apta"**, "pura", "limpia", "sana", "saludable", "de calidad" como veredicto sobre el agua del cliente. "Apta" solo se usa en negativo y solo en los textos aprobados de `textos.md`.
3. "Tu agua está bien", "puedes tomarla tranquilo", "sin contaminantes", "libre de plomo", "libre de bacterias".
4. "Tu agua está contaminada", "tu agua tiene plomo", "tu agua es tóxica o peligrosa", "te puede enfermar".
5. "Análisis", "diagnóstico", "certificado", "garantizado", "aprobado", "cumple la norma", "laboratorio en casa", "100 %", "exacto".
6. "Detectamos E. coli" o "tu agua tiene bacterias": el frasco es una prueba casera de presencia o ausencia, no identifica ni cuenta.
7. Efectos en la salud atados al resultado del cliente (cáncer, riñones, embarazo, niños, diarrea).
8. Que un filtro o cartucho "elimina", "purifica", "protege a tu familia" o "previene enfermedades".
9. Que el agua de una zona, de Hidrocentro o de una marca de botellón "está contaminada" o "es mala".
10. Un semáforo general verde con mensaje de tranquilidad. Si se muestra un resumen, solo: "Todos los parámetros medidos están en rango", con el aviso fijo pegado.

## Frases prohibidas y su reemplazo

| Prohibida | Reemplazo permitido |
|---|---|
| "Tu agua es potable / segura / apta" | "Los parámetros medidos están en rango. Esta tira no mide todo." |
| "Tu agua está bien" o "Bien" (verde) | "En rango" |
| "Nada urgente" (amarillo) | "Para vigilar" |
| "Tu agua está mala / contaminada" (rojo) | "Fuera de rango: [parámetro]" |
| "Tu agua tiene plomo" | "Plomo: posible presencia. Confirma con un laboratorio." |
| "No hay plomo en tu agua" | "Plomo: la tira no marcó presencia. Una tira casera puede no detectar cantidades bajas." |
| "Tu agua tiene bacterias / E. coli" | "El frasco cambió de color: posible presencia de bacterias coliformes en la muestra." |
| "Tu agua no tiene bacterias" | "La prueba no detectó bacterias coliformes en esta muestra. Esto no certifica el agua." |
| "Análisis de tu agua" | "Lectura de tu tira" o "medición orientativa" |
| "Diagnóstico" | "Resultado" u "hallazgo" |
| "Este filtro elimina el cloro" | "Cartucho pensado para reducir el cloro (según el fabricante)" |
| "Purifica tu agua" | "Filtra tu agua" |
| "Agua de calidad garantizada" | "Agua filtrada en casa y medida cada cierto tiempo" |
| "Monitoreo permanente" | "Te avisamos cuándo volver a medir y cuándo cambiar el cartucho" |
| "El agua de [zona] está contaminada" | "Varios hogares de la zona reportaron resultados fuera de rango" (solo en el panel del operador) |
| "El botellón es malo" | "Con el botellón no sabes qué estás tomando si nadie te muestra una medición" |
| "Paga $9" a secas (en la demo) | "Simular pago de $9" o "Pagar $9 (simulación)" |

## Alcance real, para que nadie lo estire

- **Tira:** lectura de color casera de unos pocos parámetros químicos. Depende de la luz, del tiempo de lectura y de la tira. No mide bacterias, virus, parásitos, pesticidas ni la mayoría de los metales.
- **Plomo y cobre:** orientativos. Hay estudios que muestran que las tiras caseras pueden no detectar plomo en partículas (Environmental Science & Technology, 2021). Un "no marcó" no descarta plomo. Un "marcó" no lo confirma.
- **Frasco de bacterias:** prueba casera de presencia o ausencia de coliformes. Depende de cómo se tomó la muestra, la temperatura y las 48 horas completas. **Un frasco sin cambio no certifica el agua.** Un frasco que cambió no es un diagnóstico: se confirma en laboratorio.
- **Bienvenida "Descubre la calidad del agua de tu casa":** se puede usar si en la misma pantalla va la línea "Medición orientativa con tira. No es un análisis de laboratorio." Alternativa sin riesgo: "Conoce mejor el agua de tu casa".

## Reglas para publicidad

1. Toda pieza que muestre un resultado lleva el aviso fijo, legible (no en letra mínima) o dicho en voz.
2. Nada de testimonios de salud ("desde que uso el filtro no me enfermo").
3. Nada de miedo: no usar niños enfermos, hospitales ni "veneno".
4. No nombrar a Hidrocentro, a marcas de botellón ni a competidores. No compararse con datos que no se puedan mostrar.
5. Las marcas de tiras (Qteeyou, HORYZON) se nombran solo para identificar el producto, sin logo y sin sugerir alianza.
6. Las propiedades de un filtro se copian de la ficha del fabricante; si no hay ficha, no se afirman.
7. Precio: "$9" es referencia de la demo. Para venta real, forma de exhibir precios en divisas y en bolívares: **confirmar con abogado**.
8. Base legal: derecho a información adecuada y no engañosa (art. 117 de la Constitución) y publicidad engañosa como práctica prohibida (art. 17 de la Ley Antimonopolio, Gaceta 40.549 del 26-11-2014, según fuente secundaria). Texto exacto y sanciones: **confirmar con abogado**.

## Reglas para el deck y el guion

1. **Promesa "no cargar más botellones; agua de calidad, monitoreada y permanente": no se usa tal cual.** Tres problemas: "de calidad" es un veredicto que la tira no sostiene; "permanente" es una garantía absoluta; "monitoreada" no es verdad con un sobre de una sola lectura.
2. **Versión permitida para el deck (como meta, no como garantía):** "Nuestra meta: que ninguna familia tenga que cargar botellones. Agua filtrada en casa, medida cada cierto tiempo y con el cartucho cambiado a tiempo."
3. **Versión corta para la app y redes:** "Deja de cargar botellones: filtra el agua en tu casa y mídela para saber cuándo cambiar el cartucho."
4. En el deck sí se puede hablar del problema de salud pública **con fuente citada en la lámina** y sin atarlo a una empresa ni a una zona.
5. "Empresas que casi nunca presentan análisis del agua": decirlo como "muchas familias no ven nunca una medición del agua que compran". Sin fuente, no se dan porcentajes.
6. Decirle al jurado de frente: "No certificamos agua. Orientamos con una medición casera y despachamos el cartucho correcto." Eso suma, no resta.
7. La prueba de bacterias se presenta como "prueba casera de coliformes, orientativa", no como "detectamos E. coli".
8. Cada cifra con fuente; lo que sea supuesto se dice "supuesto".
9. El pago se muestra y se nombra como simulado.

## Revisión de los borradores de Marketing (21 nov, noche)

Revisados `docs/marketing/textos-app.md`, `deck.md`, `portal.md` y los dos guiones. En general respetan las reglas. Correcciones:

| Dónde | Dice | Debe decir | Gravedad |
|---|---|---|---|
| `textos-app.md` §14, "sigue igual" | "Es buena señal, pero esta prueba no certifica el agua." | Texto (e) de `docs/legal/textos.md`. Se quita "Es buena señal": tranquiliza sin base. | Alta |
| `textos-app.md` §14, "cambió" | "posible presencia de bacterias. Confirma con un laboratorio y pasa por la tienda..." | Texto (e) de `docs/legal/textos.md` (agrega hervir el agua y médico). La invitación a la tienda puede ir aparte, debajo. | Alta |
| `textos-app.md` encabezado amarillo | "Nada urgente, pero conviene atenderlo antes de que empeore." | "Una o más casillas salieron cerca del límite. Abajo te decimos cuáles." ("Nada urgente" es un juicio que la tira no sostiene, menos si es plomo.) | Alta |
| `textos-app.md` casilla de consentimiento | "Acepto que Grimuca use estos datos para enviarme el sobre y atender mis pedidos." | Texto (a) de `docs/legal/textos.md`: nombra los datos y enlaza el aviso. | Media |
| `resumen-para-tulio.md`, pregunta 3 | Alternativa "Bien", "Ojo" y "Mal" | No se ofrece. Quedan "En rango", "Para vigilar" y "Fuera de rango". | Media |
| `textos-app.md` §14 subtítulo y "Qué trae 2" | "busca E. coli y coliformes" | Solo si la caja del frasco real lo dice. Si no: "busca bacterias coliformes". | Media |
| `textos-app.md` sin productos | "Por ahora no hace falta cambiar nada." | "Con esta medición no tenemos un cartucho que recomendarte." | Media |
| `deck.md` lámina 1 | "Las empresas que venden agua casi nunca muestran un análisis." | "Muchas familias nunca han visto una medición del agua que compran." | Media |
| `portal.md`, ambas versiones | "le explica qué está fallando" | "le explica qué salió fuera de rango" | Baja |
| `portal.md` | "casi nadie mide el agua de su casa" | "muchas familias no miden el agua de su casa" (sin fuente no hay "casi nadie") | Baja |
| `deck.md` lámina 2, nota | "qué salió bien" | "qué salió en rango" | Baja |
| `textos-app.md` §4 pago | Rótulo "SIMULACIÓN · No se cobra nada" y botón "Pagar $9 (simulación)" | Se aceptan. Debajo del rótulo va la línea completa del texto (f). | Baja |

Aprobado tal cual: aviso fijo literal, textos de plomo y cobre, "Pensado para", etiquetas "En rango / Para vigilar / Fuera de rango", "Todo lo que medimos salió en rango" (con el aviso fijo pegado), la frase del orador "Somos una ferretería, no un laboratorio".

## Para Calidad

- Buscar en toda la app, sin distinguir mayúsculas: `potable`, `segura`, `seguro para`, `pura`, `garantiz`, `certific`, `diagn`, `contaminad`, `elimina`, `purific`, `libre de`. Cero apariciones, salvo "no certifica" de los textos aprobados.
- `apta`: solo dentro de los textos literales de `textos.md` (siempre en negativo).
- El aviso fijo aparece en cada pantalla de resultado, también en el resultado de bacterias y en la voz.
