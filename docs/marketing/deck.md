# Deck · Grimuca Agua · 6 láminas

Versión 4 (21 nov, noche), enfoque B2B2C por decisión de Leonardo: Grimuca opera una **plataforma para ferreterías**. La familia mide su agua (entrada y señal) y la ferretería es el cliente que paga. Deck final: domingo 1:30 p.m.

**Lema del cliente final:** Saber qué tomas empieza en casa
**Frase para el lado empresa (propuesta):** Clientes que llegan sabiendo qué necesitan
**Promesa para la familia:** Menos botellones: mide tu agua y cambia el cartucho cuando toca.

**Reglas del deck**
- Máximo 3 viñetas por lámina. Lo demás lo dice el orador.
- Toda cifra lleva su origen: "Tulio", "supuesto" o "cálculo", con `docs/negocio/modelo.md`. Nada se presenta como medido. Las cifras que no existen (membresía, precio al mayor, cuántas ferreterías entran) se rotulan **SUPUESTO** en la lámina.
- Decir siempre que esto se ejecuta a largo plazo y que lo de hoy es una demo con datos sembrados: los comercios de Lara y Aragua son de demostración, la membresía no se cobra y el pago del sobre es simulado.
- Nunca "potable", "segura" ni "apta para tomar" como afirmación. Plomo y cobre: "posible presencia, confirma con un laboratorio".
- Sin "agua de calidad" ni "permanente". No se nombra a competidores, a Hidrocentro ni a marcas de botellón. Sin miedo: ni niños enfermos ni hospitales.
- Pie legal en láminas con resultados o salud: "Grimuca Agua ofrece mediciones caseras orientativas. No certifica agua ni reemplaza un análisis de laboratorio."
- Diseño: azul Grimuca `#12437F`, un solo acento naranja por lámina, esquinas rectas, sin sombras. Logo arriba a la izquierda.

**Imágenes disponibles** (`docs/marketing/imagenes/` y capturas de `docs/calidad/capturas/`):
- Portada, antes de la lámina 1 (no cuenta): `01-saber-que-tomas.jpg`.
- Lámina 1: `02-botellones.jpg` con el pie legal.
- Lámina 2: `03-sobre.jpg` (la tabla de colores es ilustrativa) y un esquema de tres cajas: familia, plataforma y ferretería.
- Lámina 3: cuatro capturas, una por módulo (detalle abajo). **Las de `/red`, `/tecnico` y la pestaña Productos de `/comercio` no existen todavía**: se toman cuando la migración `008_red_de_comercios.sql` esté desplegada.
- Lámina 4: `33-operador-inventario.png` y `34-operador-zonas.png`.
- Lámina 5: sin imagen; tabla de las tres líneas de ingreso.
- Lámina 6: mapa de Venezuela con estados cubiertos (la Red lo muestra como cifra) y `01-saber-que-tomas.jpg` de fondo.

**Qué pilar del jurado trabaja cada lámina:** 1 y 2 producto; 3 calidad técnica y producto; 4 innovación y logística; 5 modelo de negocio; 6 modelo e innovación.

---

## Lámina 1 · El problema

**Imagen:** `02-botellones.jpg`
**Título:** La ferretería vende filtros a ciegas y el hogar no mide

- La ferretería no sabe qué agua tiene la casa del comprador, qué cartucho le toca ni cuándo vuelve; compra y almacena repuestos a ciegas.
- El hogar carga 5 a 6 botellones por quincena, hasta $576 al año con delivery (estimación de Tulio, sin encuesta), y no ve nunca una medición de lo que toma.
- Resultado: pedidos sorpresa, piezas que faltan y dinero parado en estante.

**Lema en pantalla, abajo:** Saber qué tomas empieza en casa

**Nota del orador (Tulio):** "En el mostrador de Grimuca nos lo preguntan todos los días: ¿este filtro me sirve?, ¿cuándo le cambio el cartucho? Nadie sabe, porque nadie mide. Y nosotros, que vendemos el cartucho, tampoco sabemos cuándo lo van a pedir." Cuenta del botellón por si preguntan: $2 cada uno, hasta $4 con delivery; $20 a $24 al mes o $40 a $48 con delivery; estimación nuestra. No se nombra a ninguna marca de botellón.

---

## Lámina 2 · La solución

**Imagen:** `03-sobre.jpg` y el esquema familia → plataforma → ferretería
**Título:** La medición es la entrada; la plataforma para ferreterías es el negocio

- Una familia mide su agua con un sobre de $9 (Tulio): tira, prueba de bacterias y tabla de colores. El sistema la asigna a la ferretería más cercana que tiene el producto.
- La ferretería recibe clientes ya medidos, inventario contra demanda y recambios con fecha. Grimuca opera la red.
- La familia mide y entiende en Verde, Amarillo o Rojo; la ferretería despacha y un técnico visita.

**Nota del orador (Tulio):** "Esto lo vamos a ejecutar a largo plazo; hoy les mostramos una demo." Decir siempre, sin que lo pregunten: "La tira no mide todo y no certificamos el agua. Con plomo y cobre decimos 'posible presencia' y mandamos al laboratorio. Somos una ferretería, no un laboratorio." La tabla de colores de la imagen es ilustrativa.

---

## Lámina 3 · Demo: los cuatro módulos

**Imagen:** cuatro capturas en fila, con el nombre del módulo y la dirección debajo
1. Red (`/red`): lista de comercios con plan y periodo gratis, cifras de toda la red. *Captura nueva pendiente.*
2. Comercio (`/comercio`): `31-operador-despacho.png` y pestaña Productos. *Productos pendiente.*
3. Cliente (`/`): `41-telefono-pedido-para-despacho.png`.
4. Técnico (`/tecnico`): servicio asignado con "Ya fui". *Captura nueva pendiente.*

**Título:** Un mismo pedido recorre los cuatro módulos

- Red y Comercio: la ferretería ve su despacho, su inventario contra demanda y el mapa por urbanización.
- Cliente: mide, ve por qué se le recomienda un producto y pide. El pedido aparece en vivo en el comercio.
- Técnico: marca "Ya fui" con foto de cómo quedó, y la Red refleja la actividad.

**Nota del orador (Tulio):** Esta lámina se queda en pantalla solo dos segundos: es la entrada a la demo en vivo. "Mejor se los mostramos." El detalle está en `guion-demo.md`. Si falla internet: datos móviles; si fallan los datos: video de respaldo.

---

## Lámina 4 · Por qué es logística

**Imagen:** `33-operador-inventario.png` (faltantes en rojo) y `34-operador-zonas.png`
**Título:** Lo que deja de existir es el pedido sorpresa

- Con la medición y la fecha del último cambio, cada cartucho tiene fecha y referencia conocidas con semanas de anticipación.
- Surtido disperso, venta concentrada: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos (dato de Grimuca, 90 días al 21 nov 2026).
- Qué cambia: se compra contra fechas de recambio conocidas; los quiebres se ven antes; las entregas y visitas técnicas se agrupan por urbanización y por semana.
- Última milla con operadores que ya tienen red; la foto del filtro evita el cartucho equivocado y la segunda visita.

**Nota del orador (Tulio):** "Una ferretería compra, almacena y despacha a ciegas. Nosotros le damos la fecha de cada cartucho." Frase pública con el dato real de Grimuca (90 días al 21 nov 2026): "Grimuca reparte su surtido de agua entre tres tiendas: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos. Con la fecha de cada recambio se compra lo que se va a vender y las entregas salen agrupadas por urbanización." Honestidad si preguntan por el ahorro: en dólares el inventario de agua de una ferretería es pequeño; el valor está en no perder ventas por faltantes, no inmovilizar lo que no rota y agrupar entregas. No se afirma un ahorro de industria. Supuesto ilustrativo, rotulado así: bajar el inventario de unos 70 a unos 35 días de venta lo reduce a la mitad. Un hogar con filtro mueve unos 6 kg al año contra 2.370 a 2.844 kg en botellones (estimación de Tulio y pesos supuestos). SAMA Logística 3 cubre Valencia, con tarifas por cotizar; en otros estados todavía no hay operador confirmado.

---

## Lámina 5 · Modelo de negocio

**Título:** Tres líneas de ingreso, y la ferretería es la que paga

- **Sobre de $9** al cliente final (Tulio). **Membresía de la ferretería: $30 al mes con 1 a 3 meses gratis (SUPUESTO).** **Sobres al mayor a $5,50 (SUPUESTO).**
- La ferretería recibe unos $140 al mes en margen de las familias asignadas (cálculo con márgenes de Tulio y 20 familias, supuesto; $280 con las 40 de la meta) y recupera la membresía con 5 familias.
- Cada ferretería deja a la red entre $66 y $87 al mes (cálculo con 20 familias; el rango depende del costo del sobre, $4,00 o $2,94, por decidir); 6 a 7 ferreterías pagando cubren los fijos de la red. Siguiente paso: comisión por transacción y plan premium.

**Nota del orador (Tulio):** "El que paga todos los meses es la ferretería. La familia entra por la medición y paga $9." Honestidad en tarima: "No hay todavía ninguna ferretería aliada; la membresía, el precio al mayor y el número de ferreterías son supuestos que el piloto confirma." Si preguntan por caja: el primer año de la red es de inversión (base de 20 familias: −$3.105 con el sobre a $2,94 y −$4.669 con $4,00; con las 40 de la meta, +$1.094 y −$2.035); la operación mensual es positiva desde el mes 6. Grimuca vende hoy del orden de un centenar de cartuchos al mes, así que 40 familias por ferretería es meta de crecimiento y no continuidad. La variable que lo tumba es cuántas familias medidas le llegan a cada ferretería al mes: con 35 a 56 el año 1 cierra en cero. Las tres tiendas propias de Carabobo siguen con su economía (hipótesis de Tulio: +$65.500 en el base del modelo anterior).

---

## Lámina 6 · Red y expansión por estados

**Imagen:** `01-saber-que-tomas.jpg` de fondo, con el mapa de estados cubiertos
**Título:** Una ferretería por estado cubre el estado

- Grimuca es el comercio de Carabobo y opera la red; en otros estados entran ferreterías aliadas, una por estado.
- La Red muestra comercios, plan, periodo gratis y cifras de toda la red; el alta de un comercio nuevo se hace en pantalla.
- Siguiente: piloto de 1.000 sobres en Carabobo, primeras ferreterías aliadas y comisión por transacción. Fuera de la demo: cuentas por usuario y cobro real.

**Lema en pantalla, abajo:** Clientes que llegan sabiendo qué necesitan · Saber qué tomas empieza en casa

**Nota del orador (Tulio):** "Empezamos en Valencia con tres tiendas que ya existen." En la demo hay dos comercios de demostración (Barquisimeto y Maracay), rotulados así. Datos de la región con fuente, si piden (`modelo.md` sección 11): México, 98% de los hogares compra agua embotellada (Kantar Worldpanel, 2017); República Dominicana, 84,3% usa agua de botellón (ONE, Censo 2022). Cerrar con la dirección `agua.oydo.app` en pantalla y los nombres: Leonardo Dávila y Tulio Dávila.

---

## Preguntas probables del jurado y respuesta corta

Las 21 respuestas con su número están en `docs/negocio/preguntas-jurado.md`. Las cuatro que más se hacen:

| Pregunta | Respuesta |
|---|---|
| ¿Por qué pagaría una ferretería? | Recibe familias ya medidas y inventario contra demanda; con 20 familias al mes gana unos $140 y paga $30 (cálculo, supuestos). |
| ¿Cuál es el problema logístico? | Surtido disperso y venta concentrada: una de cada tres referencias casi no se mueve y una hace la mitad de la venta de cartuchos; la fecha de cada cartucho permite comprar lo que se vende, ver los quiebres antes y agrupar entregas. |
| ¿Quién es el cliente? | La familia entra por la medición y paga $9; la ferretería paga cada mes. |
| ¿Certifican el agua? | No. Orientamos con una medición casera y despachamos el cartucho correcto. |

## Cifras que siguen pendientes

| Lámina | Qué falta | Quién |
|---|---|---|
| 4 | Dinero en inventario, días de rotación, faltantes y entregas por semana de Grimuca | Tulio |
| 5 | Precio de membresía, precio al mayor, cuántas ferreterías entran y cuántas pagan | Tulio |
| 5 | Costo del sobre puesto en Venezuela: $2,94 o $4,00 | Leonardo |
| 3 | Capturas de `/red`, `/tecnico` y Productos | Calidad o Leonardo, tras desplegar la migración 008 |
