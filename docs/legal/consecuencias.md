# Consecuencias y conclusiones del resultado

Dev + redacción con criterio legal · domingo 22 nov 2026 · pantalla `/resultado/:id`.
**No reemplaza a un abogado.** Fuente de los textos en código: `app/src/features/resultado/consecuencias.ts` (cada frase con su fuente en un comentario). Fuentes consultadas el 22 nov 2026.

## Por qué existe

El dueño vio un resultado con 3 rojos (plomo, cobre y nitrito), 1 amarillo (pH) y 4 verdes y preguntó: "¿Qué significa? ¿Cuál es la conclusión? ¿Qué pasa si no hago nada? ¿Qué podría pasarme a mí?". La pantalla ahora responde en este orden: **Tu conclusión** → aviso fijo → **Si no haces nada** → **Qué hacer hoy** (3 pasos) → **Tu agua, casilla por casilla** → productos.

## Tensión con la norma vigente (leer primero)

`puede-y-no-puede-decir.md` (NO 7) y `agua.md` §2 prohíben atar efectos en la salud o grupos de personas (niños, embarazadas, bebés) **al resultado del cliente**. El encargo pide responder "¿qué podría pasarme?". La salida elegida:

1. Las frases de salud son **información general** con fuente (OMS, EPA), en condicional ("si hay plomo y se sigue tomando…"), nunca "a ti te va a pasar".
2. Plomo y cobre siempre como **posible presencia**, con la línea "La tira solo marca una posible presencia: por eso el primer paso es confirmarlo".
3. Línea fija al final del bloque: "Esto es información general, no un diagnóstico. Si alguien en casa se siente mal, consulta a un médico."
4. Las filas que nombran grupos (niños pequeños, embarazadas, bebés menores de 6 meses) quedan marcadas **confirmar con abogado**. Es el mismo punto abierto en `revision-2.md` §4.1 y `revision-final.md` §5.1.

## "Si no haces nada" (una línea por casilla en rojo o amarillo, de la más grave a la menos grave)

| Casilla | Frase en pantalla | Fuente (enlace) | Estado |
|---|---|---|---|
| Plomo | "Si hay plomo y se sigue tomando esa agua por meses, se va acumulando en el cuerpo. Los niños pequeños y las embarazadas son los más sensibles (OMS, EPA)." + "La tira solo marca una posible presencia: por eso el primer paso es confirmarlo." | OMS: se acumula con el tiempo en dientes y huesos; dañino sobre todo para niños pequeños y mujeres en edad fértil ([nota OMS](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health)). EPA: niños pequeños, bebés y fetos, los más vulnerables ([EPA](https://www.epa.gov/ground-water-and-drinking-water/basic-information-about-lead-drinking-water)) | **Confirmar con abogado** (nombra grupos) |
| Cobre | "En exceso puede causar malestar de estómago. Suele venir de tuberías que se están desgastando (OMS, EPA)." + línea de posible presencia | OMS: valor guía de 2 mg/L por efectos gastrointestinales ([ficha OMS](https://www.who.int/docs/default-source/wash-documents/wash-chemicals/copper-chemical-fact-sheet.pdf)). EPA: "Gastrointestinal distress"; fuente "Corrosion of household plumbing systems" ([EPA, estándares primarios](https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations)) | Revisado contra puede-y-no-puede-decir.md |
| Nitrito / Nitrato | "En niveles altos es un riesgo sobre todo para bebés menores de 6 meses, si se usa para preparar teteros. Suele venir de abonos o de pozos sépticos (OMS, EPA)." | EPA: bebés menores de seis meses pueden enfermar gravemente; fuentes: abonos, pozos sépticos, aguas negras ([EPA, estándares primarios](https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations)). OMS: el valor guía protege a los bebés alimentados con tetero ([ficha OMS](https://www.who.int/docs/default-source/wash-documents/wash-chemicals/nitrate-nitrite-chemical-fact-sheet.pdf)) | **Confirmar con abogado** (nombra a bebés) |
| Cloro libre | "Cambia el sabor y el olor del agua: mucha gente lo nota desde niveles bajos. Si acabas de clorar el tanque, repite la prueba en unas horas (guías de agua de Australia)." | Guías australianas (NHMRC): umbral de olor de unos 0,6 mg/L; hay quien lo nota desde 0,2 mg/L ([NHMRC, cloro](https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/chlorine)) | Revisado. Se quitó "no es una alerta de salud en estos niveles": el rojo es >4 mg/L y afirmar que no hay riesgo sería un veredicto que la tira no sostiene |
| Dureza | "El sarro se pega en tuberías, llaves y calentadores, y puede llegar a tapar duchas y válvulas (guías de agua de Australia)." | NHMRC: sobre 200 mg/L, sarro excesivo en tuberías y conexiones; puede tapar válvulas del calentador ([NHMRC, dureza](https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/hardness-as-calcium-carbonate)) | Revisado |
| pH bajo | "Un agua ácida desgasta las tuberías y puede arrastrar metales de ellas; también da sabor metálico (EPA)." | EPA, estándares secundarios: pH bajo "bitter metallic taste; corrosion" ([EPA](https://www.epa.gov/sdwa/secondary-drinking-water-standards-guidance-nuisance-chemicals)); NHMRC: el agua ácida en tuberías de cobre sube el cobre ([NHMRC, cobre](https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/copper)) | Revisado |
| pH alto | "Un agua muy alcalina deja depósitos de sarro y puede saber a soda (EPA)." | EPA, estándares secundarios: "slippery feel; soda taste; deposits" (mismo enlace) | Revisado |
| Hierro | "Da color de óxido, deja sedimento, mancha de rojo o naranja la ropa y los sanitarios, y da sabor metálico (EPA)." | EPA, estándares secundarios: "rusty color; sediment; metallic taste; reddish or orange staining" (mismo enlace) | Revisado |
| Alcalinidad | Baja: "Con poca alcalinidad, el agua se vuelve agresiva con las tuberías y la grifería." Alta: "Una alcalinidad alta ayuda a que se forme sarro en tuberías y equipos." | Sin fuente oficial: ni OMS ni EPA fijan valor (`agua.md` §1). Se muestra **sin paréntesis de fuente** | Revisado; frase operativa |
| (fija) | "Esto es información general, no un diagnóstico. Si alguien en casa se siente mal, consulta a un médico." | Mismo criterio que el texto (e) de `textos.md` ("consulta a un médico") | Revisado |

## "Tu conclusión" (función `armarConclusion`)

| Caso | Texto | Estado |
|---|---|---|
| Rojo en plomo, cobre, nitrato o nitrito | "Tu agua necesita atención en N cosas: [lista]. Lo primero es no usarla para tomar ni cocinar mientras la confirmas con un laboratorio." + "Son N en casa y tienen mascotas: ellas también toman de esa agua." o "Son N en casa: la precaución es para todos." | Revisado. Es la misma precaución aprobada ("usa otra agua para tomar y cocinar") dicha en positivo |
| Rojo solo en cloro | "…Lo primero es repetir la prueba: si acabas de clorar el tanque, espera unas horas." | Revisado (frase del servidor) |
| Rojo solo operativo (dureza, hierro) | "Tu agua necesita atención en 1 cosa: dureza. El sarro desgasta la grifería, el calentador y los equipos de la casa." | Revisado |
| Amarillo de salud | "No salió nada en rojo, pero hay N casillas para vigilar: [lista]. Confírmalo con un laboratorio antes de sacar conclusiones y vuelve a medir." | Revisado (texto 5 de `textos.md`) |
| Solo amarillos operativos | "No salió nada en rojo. Tu agua tiene sarro (dureza en Amarillo): no es urgente, pero desgasta la grifería y los equipos." | Revisado. "No es urgente" solo cuando **ninguna** casilla de salud salió fuera de rango (la objeción de `revision-final.md` era usarlo con plomo) |
| Todo verde | "Lo que midió tu tira está en rango. Esto no certifica que el agua sea apta para tomar: la tira no mide bacterias ni todo lo que puede traer el agua. Vuelve a medir en 3 meses; [recambio]." | Revisado. "Apta" solo en negativo |
| Casillas sin lectura | "N casillas no se pudieron leer: repite la foto o cárgalas a mano para completar tu resultado." | Revisado (SÍ 7) |

## "Qué hacer hoy" (función `pasosQueHacerHoy`)

| Paso | Texto | Fuente / estado |
|---|---|---|
| 1, rojo de metales o nitrógeno | "Usa agua de botellón para tomar, cocinar [y preparar teteros] mientras confirmas. [Dales esa misma agua a tus mascotas.] No sirve hervirla: hervir no quita el plomo ni el cobre, y el nitrito se concentra (EPA)." | EPA: hervir no quita el plomo ([EPA](https://www.epa.gov/ground-water-and-drinking-water/basic-information-about-lead-drinking-water)); hervir no baja el nitrato, lo empeora porque el agua se evapora ([EPA, preguntas sobre nitratos](https://www.epa.gov/faqs/search/topics/about-nitrates-341144/topics/asbestos-and-school-buildings-315213)). Cobre: texto aprobado "Hervirla no quita el cobre" (`revision-2.md`). No se recomienda agua hervida para estos casos porque no sirve. "Teteros": **confirmar con abogado** (mismo punto abierto) |
| 1, cloro en rojo | "Si acabas de clorar el tanque, espera unas horas y mide otra vez. Si sigue igual, por precaución usa otra agua para tomar mientras lo revisas." | Frase del servidor (`umbrales.ts`) |
| 1, otros | "Mide otra vez con una tira nueva, con buena luz y leyendo a tiempo, para ver si se repite." | Alcance real de la tira (`puede-y-no-puede-decir.md`) |
| 2, confirmar | "La tira casera orienta, no confirma: un análisis de laboratorio dice cuánto hay. Pregunta en tu tienda Grimuca por dónde hacerlo." | Revisado (no nombra laboratorios) |
| 3, la opción para la casa | Primer producto con "Por qué te lo recomendamos", "Agregar a mi lista" y "Cotizar por WhatsApp". Con filtro de 1 a 3 etapas: "Un filtro de N etapas de sedimentos y carbón no está pensado para [nitrito/nitrato/dureza]." Con ósmosis: "lo más probable es que toque el recambio de cartuchos o de la membrana." | `agua.md` §6. Las propiedades del producto salen solo de `motivos.ts` ("pensado para") |
| Todo verde | "Vuelve a medir en 3 meses" (con el botón de calendario "Recuérdame cuándo hacer mi próxima medición" y su WhatsApp simulado), "Revisa el recambio de tu filtro" o "Pregunta por un filtro", "Mira los productos" | Revisado |

## Pruebas que lo vigilan

`app/src/features/resultado/consecuencias.test.ts` recorre las 9 casillas en amarillo y rojo y los pasos de varios casos, y falla si aparece "potable", "segura/seguro", "te vas a enfermar", "contaminada", "elimina", "purifica", "garantiza", o "apta" y "certifica" fuera de "no certifica que el agua sea apta para tomar".
