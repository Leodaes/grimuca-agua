# Auditoría del asesor de marketing y ventas · Grimuca Agua

**Sábado 21 nov 2026 · lente del asesor sobre `modelo.md` (versión 2)**

Cómo leerla. Cada afirmación lleva su origen: **Tulio** (lo dijo él), **SUPUESTO** (lo puso Business), **Material** (método del curso del asesor, con su autor; las cifras de un curso son casos, no leyes), **Inferencia** (cálculo o deducción de esta auditoría) y **Recomendación**. Los montos salen de las tablas de `modelo.md`; las cuentas nuevas se explican en la misma línea. Nada aquí es una promesa sobre la calidad del agua.

---

## 1. Etapa y condición del negocio

Grimuca como ferretería y plomería está establecida, con tres tiendas. La línea Grimuca Agua no ha vendido ningún sobre.

- **Condición: inexistencia** (Hubbard College, en `estrategia-crecimiento.md`). Todo producto nuevo empieza ahí. La fórmula pide cuatro pasos en orden: hallar la línea de comunicación (QR del sobre, mostrador, aliados; está definida), darse a conocer (pendiente), descubrir lo que el hogar necesita (lo hace el piloto) y producirlo (la app, ya en construcción). **Material.**
- **Fase del ciclo de vida: nacimiento a "en pañales"** (Tony Robbins Business Mastery). El riesgo típico de la fase es depender del dueño, aquí de Tulio para precios, aliados y catálogo; la decisión que pide es delegar. El equipo mínimo (responsable de logística y un almacenista por tienda) va en esa dirección. **Material, aplicado por inferencia.**
- **Consecuencia para el gasto en anuncios.** El curso recomienda encuestas y relaciones públicas antes de la publicidad, porque pagar anuncios sin terreno preparado puede generarle demanda a la competencia. El modelo de Tulio ya apunta en esa dirección (QR, mostrador, aliados). La auditoría la refuerza: sin publicidad pagada hasta que el piloto muestre conversión (plan, punto 13).
- **Los cuatro bloques de rentabilidad de Midas** (Velocity) como lista de revisión: creación de demanda (150 hogares por tienda al mes, sin dato propio todavía), estrategia de precios (sobre de $9 y filtro con 20% de margen, ambos sin probar), valor de por vida del cliente (cartuchos cada 3 meses, el bloque más fuerte y el menos probado) y activos (tres tiendas y una base de hogares con mediciones y fecha de último cambio). El bloque con más riesgo es el de demanda.

---

## 2. Qué es sólido y por qué

1. **El sobre se paga solo.** Con costo de fábrica de $1,54 a $2,04 (Tulio) deja $3,56 a $6,06 en cualquier combinación de envío y retiro (cuenta de Business con SUPUESTOS). El gancho no consume caja. En el lenguaje del curso es un producto de entrada de bajo ticket (rango de $10 a $100, Vinasco), cuyo propósito es conocer el mercado y convertir compradores para el peldaño siguiente. **Material.**
2. **La escalera de valor está completa.** Sobre de $9, juego de cartuchos de $18,99 (referencia), filtro de $120 a $330 (referencia), plomero y recambios cada 3 meses. La maximización del embudo (`arquitectura-funnels.md`) es justo esto: recompra, venta cruzada y fidelización sobre un cliente ya captado. **Material.**
3. **El sobre cumple la función del lead magnet.** Crea la necesidad (descubrir qué tiene el agua de la casa) y el cartucho o el filtro la satisfacen. Como el cliente ya pagó, su base es más caliente que una lista gratuita. **Material, aplicado por inferencia.**
4. **La captación sale de activos propios.** Tres tiendas con tráfico, mostrador y QR. El primer canal no requiere anuncios y por eso el costo de captar los primeros hogares es bajo (sin dato todavía).
5. **El modelo ya dice qué lo tumba.** Tiene dos escenarios con caja a 12 meses, punto de equilibrio con holgura (40 a 44 sobres contra una meta de 150) y la variable que manda: captación. El mentor del curso pide decidir con números, y aquí están.
6. **La app deja un calendario.** `hogares.fecha_ultimo_cambio` y `mediciones.fecha` permiten prever qué cartucho se necesita y cuándo. Esa previsión es lo que hace logística al modelo.

---

## 3. Las fugas, con su costo

Ordenadas por dinero en juego en el año 1 de las tres tiendas (base: caja $65.500; conservador: $6.200).

| # | Fuga | Costo | Origen del costo |
|---|---|---|---|
| 1 | Los 30 de cada 100 "que ya tienen filtro" no compran cartuchos | Si nadie compra: base −$31.600 (cae a $33.900), conservador cae a −$1.700. Si compra la mitad: base −$15.800 | Tabla de `modelo.md` §6 (nadie compra); la mitad es interpolación lineal mía |
| 2 | Publicidad pagada para llegar a 150 sobres | Con $4 por sobre en todos: base −$19.400 (cae a $46.100); conservador −$9.700 (cae a −$3.500) | Inferencia, cuenta en 3.2 |
| 3 | Abandono del recambio cada 3 meses | Con 50% de abandono: base −$12.100 (cae a unos $53.400); conservador −$3.000 (cae a unos $3.200). Margen de cartuchos al mes 12: de $2.280 a $1.140 por tienda | Interpolación lineal entre "tal cual" y "cero recambios" de `modelo.md` §6 |
| 4 | Cotizar por WhatsApp | Unos $8.000 de margen de primera compra en el año base si 25% de los que querían comprar no escribe | Inferencia, cuenta en 3.4; el 25% es SUPUESTO |
| 5 | Capital de trabajo del piloto | Hueco declarado $4.440 a $4.940; con stock comprado por adelantado, unos $15.000 a $20.000 | Inferencia, cuenta en 3.6 |
| 6 | Filtro con 20% de margen | Precio 10% bajo la referencia: base −$8.800, conservador −$1.400 | Tabla de `modelo.md` §6 |
| 7 | 60 de cada 100 sobres no compran nada | No quita caja (el sobre ya se pagó). Cada hogar que pasa a comprar cartuchos vale $9,50 el primer juego y hasta $38 en 12 meses | Inferencia, cuenta en 3.1 |

### 3.1 El 60% que solo se informa

Son 90 hogares por tienda al mes, 2.916 en el año base (60% de 4.860 sobres). Perder el sobre no cuesta caja, porque cada uno ya dejó $4,72 de margen. Lo que cuesta es la oportunidad: cada hogar que pasa de "solo informa" a "compra cartuchos" deja $9,50 de entrada y hasta $38 en 12 meses con cuatro juegos y cero abandono (4 × $9,50). Mover 5 de esos 60 a cartuchos son 243 hogares al año: $2.300 de primer juego y hasta $9.200 con recambios.

Parte de ese 60% es estructural. Si el agua de un hogar sale en rango, la medición no le da razón para comprar un filtro, y la regla legal impide asustar a nadie (`puede-y-no-puede-decir.md`). Por eso el KPI de apoyo de `modelo.md` incluye el porcentaje de hogares con un parámetro fuera de rango: sin él no se sabe qué parte del 60% se puede recuperar.

El curso da un punto de comparación: en un lanzamiento, cerca de 3% de la lista compra de inmediato y cerca de 7% en la semana, y el 90% restante se calienta con contacto posterior. Esos porcentajes son de listas gratuitas, no de compradores de un sobre de $9, así que el 40% de Tulio (10 + 30) no se contradice con ellos. Lo que sí enseñan es que la segunda oferta ocurre días después de la primera, y hoy el modelo no tiene ninguna. **Material, con la salvedad dicha.**

### 3.2 El CAC real si hay que pagar publicidad

Cálculo de atrás hacia adelante, con el método del curso (`sistema-anuncios-ads.md`):

- Meta: 150 sobres por tienda al mes, 450 en las tres. Ticket: $9. Ventas: $4.050 al mes.
- CAC máximo del curso: 20% a 30% del ticket, es decir $1,80 a $2,70 por sobre. Inversión que ese tope permite: $810 a $1.215 al mes para las tres tiendas.
- Qué costaría de verdad. El curso no trae benchmarks de industria; sus casos de planes de medios muestran conversaciones de WhatsApp en Venezuela a $0,70 a $1,10 cada una. Si 20% de esas conversaciones cierra (mínimo de Manuel Trejo sobre leads calificados, que él mismo dice que varía por producto), el costo por sobre vendido queda entre $3,50 y $5,50. Es una inferencia con datos de otros rubros, no de Valencia. Uso $4,00 como punto central.
- A $4,00, los 450 sobres cuestan $1.800 al mes, entre $585 y $990 por encima del tope sano.
- Efecto en el equilibrio por tienda (fijos $493): el margen por sobre captado baja de $11,29 a $7,29 y los sobres necesarios suben de 44 a 68. Con la mitad de conversión (margen de $8,01 a $4,01), suben de 62 a 123, y el margen de seguridad sobre la meta de 150 se reduce a 18%.
- Efecto en el año: la nota del modelo ($1,50 por sobre, $7.300) subestima. Con $4,00 en todos los sobres el base cierra en $46.100 y el conservador en −$3.500. Con la mitad de los sobres pagados, $55.800 y $1.300.

**Lectura.** La publicidad pagada se justifica solo si el hogar vale más que su costo de captación. El primer mes un sobre captado deja $11,29 (ultrafiltración, conversión de Tulio) y en 12 meses unos $22,70 con cero abandono, o $17,00 con 50% de abandono. El tope de $2,70 es conservador frente a esos valores; los $4,00 son rentables si la conversión de Tulio se cumple y dejan de serlo si cae a la mitad. Esta es la razón técnica para medir antes de pautar. **Recomendación.**

### 3.3 El filtro al 20%

Con la referencia de $119,99, el margen es $24; con ósmosis, $66. Tulio vende más barato que la competencia, y un precio 10% bajo la referencia deja el margen de ultrafiltración en unos $12. Además cada filtro inmoviliza $96 de capital (80% de la referencia) para ganar $24, una relación de 4 a 1. El filtro tiene sentido como puerta de entrada a cartuchos y plomero; sin eso, no paga el esfuerzo de captar al hogar. La fuga real es vender un filtro y no vender los cuatro juegos de cartuchos del año siguiente, que valen $38. **Inferencia.**

Corrección propuesta: el filtro se vende junto a un plan anual de cartuchos prepagado (punto 12 del plan y experimento 3).

### 3.4 Depender de que el cliente escriba por WhatsApp

Las tarjetas del catálogo dicen "Cotizar por WhatsApp" (`HANDOFF-hackaton.md`, decisión sobre el catálogo) y hay un solo número compartido por las tres tiendas. Cada paso extra pierde gente. El curso de venta consultiva lo resume así: el seguimiento importa más que la cotización, y la mayoría de las ventas ocurre entre el contacto 5 y el 12 (dato del curso, no estadística verificada). Un cliente que tiene que escribir primero, esperar el precio y que además nadie le hace seguimiento, no completa la compra.

Dimensión del problema: 40 de cada 100 sobres muestran intención de compra. Si 25% de ese grupo no escribe (SUPUESTO; no hay dato), se pierden $6,57 × 25% por sobre vendido en la primera compra (margen de filtro más primer cartucho en ultrafiltración): unos $8.000 en el año base, sin contar los recambios de esos hogares. Y el volumen no es pequeño: al mes 12 del escenario base son unos 26 pedidos por día hábil (639 juegos de cartuchos y 45 filtros al mes) por un solo número.

Por eso el experimento 1 compara precio visible con cotizar por WhatsApp. La exhibición de precios requiere confirmación del abogado. **Recomendación.**

### 3.5 El abandono en los recambios

El modelo de Tulio supone que nadie deja de cambiar el cartucho. Los $2.280 por tienda al mes 12 son un techo. Dos debilidades concretas:

- **El recordatorio vive dentro de la app.** Para que un hogar lo vea tiene que abrir la app, y el WhatsApp posterior a la compra está fuera del hackatón. En el piloto lo debe hacer una persona (el almacenista con la lista de fechas), con un segundo contacto a los 2 días que aporte algo nuevo, como la foto del cartucho. **Recomendación.**
- **La app le dice al hogar qué cartucho necesita, y el hogar puede comprarlo en otra ferretería.** El foso es el recordatorio a tiempo y el plan anual prepagado, no la información. Sin esos dos, Grimuca informa y otro vende.

### 3.6 El capital de trabajo del piloto

El flujo declara $4.440 en el mes 0 ($1.500 de inversión inicial y $2.940 del lote de 1.000 sobres) y un hueco máximo de $4.440 en el base y $4.940 en el conservador. El flujo no cuenta inventario de filtros ni de cartuchos, IVA ni plazos de cobro. Cuenta de Business: el piloto debería traer unos 100 compradores de filtro y 300 de cartuchos. A 80% y 50% de la referencia:

- Filtros: 100 × $96 = $9.600 en ultrafiltración, o 100 × $146 = $14.600 con mezcla 70/30.
- Cartuchos: 300 × $9,50 = $2.850.
- Total con el lote: unos $15.400 a $20.400 si todo se compra antes de vender.

Es un tope: Grimuca puede tener inventario de Oasis en sus tiendas y comprará por etapas. Aun así, el que presenta el modelo debe saber que "caja de $4.440" y "caja necesaria" no son la misma cifra. Corrección propuesta: filtros contra anticipo del cliente (el filtro llega de Oasis al pagar) y cartuchos para dos semanas.

---

## 4. Abogado del diablo sobre los supuestos de Tulio

| Supuesto de Tulio | Qué tendría que ser cierto | Por qué puede no serlo | Cómo se prueba |
|---|---|---|---|
| 150 hogares al mes por tienda, unos 5 por día de atención | Que 5 de los clientes que entran cada día compren un sobre de $9 | No sabemos cuántos clientes entran por día. Si entran 60, son 8%; si entran 20, son 25%. Y las farmacias y supermercados aliados no están en ningún costo: con 20% de comisión serían $1,80 por sobre, todo el tope | Pedir a Tulio el flujo diario por tienda y la comisión del aliado (resumen); KPI 1 y experimento 2 |
| 30 de cada 100 ya tienen filtro y compran cartuchos | Que el hogar tenga un filtro de una marca para la que Grimuca vende cartucho compatible (Oasis) y que prefiera comprarlo ahí | Los que ya tienen filtro pueden tener otras marcas; y los que compran un sobre de $9 son quizá los más interesados, no un hogar típico. Nadie ha medido este número | Primeras 100 respuestas del perfil (`tipo_filtro`); KPI 3 |
| 10 de cada 100 compran filtro | Que la medición dé una razón (parámetro fuera de rango) y que el hogar pueda pagar $120 a $330 | Si el agua de un hogar sale en rango, no hay razón de compra. Un filtro de ósmosis a $330 más $50 de instalación se paga en 22 a 28 meses contra una recarga de $2 (`modelo.md` §8) | KPI 2 y porcentaje de hogares con parámetros fuera de rango |
| Cartucho con 50% de margen, cambio cada 3 meses | Que el kit de $18,99 se cambie completo cada 3 meses y que Grimuca lo venda a la referencia | Las etapas de un filtro no siempre duran lo mismo y las membranas de ósmosis ($30 a $76) suelen cambiarse con menos frecuencia (referencia técnica general, a confirmar con Oasis). Si el cambio es cada 6 meses, el margen recurrente de $2.280 al mes 12 baja a la mitad | Pendiente 12 de Tulio; KPI 4 |
| Nadie abandona | Que el 100% de los hogares siga cambiando el cartucho cada 3 meses durante años | Ningún negocio de recompra llega a 100%. El mes 12 pasa a ser motor o decoración según esta cifra | KPI 4, con meta de 70% y alarma de 50% |
| Filtro al 20% y precio menor que la competencia | Que el costo de Grimuca sea 80% de la referencia | Los $119,99 y $329,99 son de Mundo JAB, no de Grimuca. Si el precio de venta baja 10%, el margen de $24 queda en $12 | Pendiente 4 de Tulio (precios internos) |
| Piloto de 1.000 sobres se vende en 2,2 meses | Que las tres tiendas capten 150 hogares por tienda desde el primer día | Con arranque gradual (40%, 60% y 80%) son 4 meses. Cada mes extra con el lote sin vender es capital inmovilizado | KPI 1, semana a semana |
| Sobre entregado = sobre usado | Que cada hogar que compra mida y pase al paso siguiente | Un sobre sin foto no convierte; el modelo no tiene este paso. Es la fuga más fácil de corregir (recordatorio a los 2 días) | Activación (dato de apoyo en `modelo.md`) |

---

## 5. Plan de corrección

### Para el pitch del domingo (cierre a las 5:00 p.m.; solo palabras y láminas, sin tocar el código)

1. **Mostrar los dos escenarios juntos**, base de $65.500 y conservador de $6.200, y llamar al base "hipótesis con las cifras de Tulio, que el piloto valida". Un jurado que ve un solo número optimista duda de todo lo demás.
2. **Corregir antes de presentar las discrepancias ya detectadas**: $1.050 es margen y no ingreso ($1.350); $2.377 y no $2.450; 720 hogares son 180 con filtro comprado a Grimuca y 540 que ya lo tenían; $2.280 al mes es un techo con cero abandono.
3. **Decir cuál es la variable que manda.** Captación: equilibrio con 40 a 44 sobres al mes por tienda, caja anual en cero con 34 hogares por tienda, meta de 150.
4. **Responder la pregunta de la publicidad con el cálculo**: tope de $1,80 a $2,70 por sobre; con $4,00 el conservador queda en −$3.500; por eso arrancamos con QR, mostrador y aliados.
5. **Presentar el piloto como una prueba con seis indicadores, metas y alarmas** (`modelo.md`, "KPI del piloto") y con una regla de decisión al cerrar. Eso responde a "viabilidad" mejor que otra proyección.
6. **Decir las condiciones pendientes de los aliados** en lugar de listarlos como resueltos: la comisión de farmacias y supermercados y las tarifas de SAMA y Cobrix están por definir.
7. **Nombrar el foso con honestidad**: lo que retenemos es el calendario de recambio y el recordatorio a tiempo; el cliente puede comprar el cartucho en otro lado, y por eso medimos la tasa de recambio.

### Para el piloto

8. **Pedir a Tulio cuatro datos antes de vender** (resumen): clientes por día y tienda, comisión de aliados, frecuencia de cambio por etapa según Oasis, precios internos y tarifas pendientes.
9. **Registrar el canal de cada sobre.** Un QR distinto por mostrador, farmacia o supermercado, lista de clientes y anuncio; campo `canal` en el hogar y tipo filtro en `pedidos` (o una hoja con `hogar_id` mientras tanto).
10. **Filtros contra anticipo, sin stock**, y cartuchos para dos semanas. Baja el capital de trabajo de unos $15.000 a $20.000 a cerca del hueco declarado.
11. **Quitar la fricción de WhatsApp.** Precio de cartuchos visible y pedido desde la app (confirmar con el abogado la exhibición de precios), y para quien escriba: respuesta en 2 horas hábiles, preguntas de perfil antes de mandar información (nombre, zona, filtro que tiene) y un seguimiento a los 2 días con un dato nuevo. Cuando los chats pasen de unos 200 al mes se evalúa un CRM como Kommo; la tarifa de la API de WhatsApp cambia seguido y se verifica el día que se cotice.
12. **Plan anual de cartuchos prepagado** junto al filtro: 4 juegos por $68,36 (10% de descuento), que deja $30,38 de margen y adelanta caja. Se prueba en el experimento 3.
13. **Cero publicidad pagada hasta que los KPI 1, 2 y 3 estén en meta durante dos semanas seguidas.** Después, una prueba de $100 con tope de $2,70 por sobre (experimento 2).
14. **Segunda oferta a los que solo se informan**: contacto a los 7, 30 y 60 días, cada uno con algo nuevo (un recordatorio de la fecha de cambio sugerida, el dato del cartucho correcto). Hoy el modelo no tiene ninguno.
15. **Recordatorio manual de recambio**, 7 días antes de la fecha, por el almacenista con la lista del día. Es el piloto del bot de WhatsApp que quedó fuera del hackatón.
16. **Reunión semanal de 30 minutos con los seis indicadores** y desviación productiva por tienda (meta de 35 sobres por semana, el déficit pasa a la siguiente), según el método de Manuel Trejo: pocos indicadores, medidos todas las semanas.
17. **Definir por escrito la comisión del aliado**, dentro del tope de $2,70 por sobre.
18. **Decidir al cerrar el piloto** con la regla de `modelo.md`: comprar el siguiente lote solo si los KPI 1, 2 y 3 están en meta.

### Acción para hoy

Punto 2 del pitch: corregir las cifras de las láminas con las cuatro discrepancias. Es lo único que se arregla en minutos y que el jurado puede verificar con el repositorio abierto.
