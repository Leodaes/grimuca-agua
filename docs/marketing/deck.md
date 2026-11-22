# Deck · Grimuca Agua · 6 láminas

**Costo del sobre puesto en Venezuela: $2,94 (decisión del equipo; incluye fábrica y un supuesto de $1,00 de flete, aduana y empaque)** · el $4,00 queda como sensibilidad en la nota de la lámina 5.

Versión 4.1 (22 nov): costo del sobre en $2,94 como base (decisión de Leonardo; $4,00 como sensibilidad), rutas en la lámina de logística y revisión legal. Versión 4 (21 nov, noche), enfoque B2B2C por decisión de Leonardo: Grimuca opera una **plataforma para ferreterías**. La familia mide su agua (entrada y señal) y la ferretería es el cliente que paga. Deck final: domingo 1:30 p.m.

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
- Lámina 5: sin imagen; tabla de las cuatro líneas de ingreso.
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

**Nota del orador (Tulio):** "Esto lo vamos a ejecutar a largo plazo; hoy les mostramos una demo." Decir siempre, sin que lo pregunten: "La tira no mide todo y no certificamos el agua; la prueba de bacterias tampoco certifica nada, salga como salga. Con plomo y cobre decimos 'posible presencia' y mandamos al laboratorio. Somos una ferretería, no un laboratorio." La tabla de colores de la imagen es ilustrativa.

---

## Lámina 3 · Demo: los cuatro módulos

**Imagen:** cuatro capturas en fila, con el nombre del módulo y la dirección debajo
1. Red (`/red`): lista de comercios con plan y periodo gratis, cifras de toda la red. *Captura nueva pendiente.*
2. Comercio (`/comercio`): `31-operador-despacho.png` y pestaña Productos. *Productos pendiente.*
3. Cliente (`/`): `41-telefono-pedido-para-despacho.png`.
4. Técnico (`/tecnico`): servicio asignado con "Ya fui". *Captura nueva pendiente.*

**Título:** Un mismo pedido recorre los cuatro módulos
**Pie legal en la lámina:** Grimuca Agua ofrece mediciones caseras orientativas. No certifica agua ni reemplaza un análisis de laboratorio.

- Red y Comercio: la ferretería ve su despacho, su inventario contra demanda y el mapa por urbanización.
- Cliente: mide, ve por qué se le recomienda un producto y pide. El pedido aparece en vivo en el comercio.
- Técnico: marca "Ya fui" con foto de cómo quedó, y la Red refleja la actividad.

**Nota del orador (Tulio):** Esta lámina se queda en pantalla solo dos segundos: es la entrada a la demo en vivo. "Mejor se los mostramos." El detalle está en `guion-demo.md`. Si falla internet: datos móviles; si fallan los datos: video de respaldo.

---

## Lámina 4 · Por qué es logística

**Imagen:** `33-operador-inventario.png` (faltantes en rojo) y la captura del mapa con las rutas de despacho (datos de demostración)
**Título:** Lo que deja de existir es el pedido sorpresa y el viaje suelto

- **Rutas (cálculo con datos de demostración):** 15 entregas en 3 rutas contra 15 viajes sueltos: 51,9 km contra 110,9 km, 53% menos.
- **Surtido disperso, venta concentrada:** una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos (dato de Grimuca, 90 días al 21 nov 2026).
- **Qué cambia:** con la fecha de cada recambio se compra lo que se va a vender, los quiebres se ven antes y las entregas y visitas técnicas salen agrupadas por urbanización.

**Nota del orador (Tulio):** "Una ferretería compra, almacena y despacha a ciegas. Nosotros le damos la fecha de cada cartucho." Frase pública con el dato real de Grimuca (90 días al 21 nov 2026): "Grimuca reparte su surtido de agua entre tres tiendas: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos. Con la fecha de cada recambio se compra lo que se va a vender y las entregas salen agrupadas por urbanización." La cifra de las rutas sale de los datos de demostración del despacho (15 entregas, 3 rutas, 51,9 km contra 110,9 km): se dice "con los datos de demostración" y no se presenta como ahorro medido en una operación real. Honestidad si preguntan por el ahorro: en dólares el inventario de agua de una ferretería es pequeño; el valor está en no perder ventas por faltantes, no inmovilizar lo que no rota y agrupar entregas. No se afirma un ahorro de industria. Supuesto ilustrativo, rotulado así: bajar el inventario de unos 70 a unos 35 días de venta lo reduce a la mitad. Un hogar con filtro mueve unos 6 kg al año contra 2.370 a 2.844 kg en botellones (estimación de Tulio y pesos supuestos). SAMA Logística 3 cubre Valencia, con tarifas por cotizar; en otros estados todavía no hay operador confirmado.

---

## Lámina 5 · Modelo de negocio

**Costo del sobre puesto en Venezuela: $2,94 (decisión del equipo; incluye fábrica y un supuesto de $1,00 de flete, aduana y empaque)**

**Título:** Cuatro líneas de ingreso, y la ferretería es la que paga

- **Sobre de $9** al cliente final (Tulio). **Membresía de la ferretería: $30 al mes con 1 a 3 meses gratis (SUPUESTO).** **Sobres al mayor a $5,50 (SUPUESTO).** **Estudios de calidad del agua por zona para universidades e instituciones públicas, con datos agregados y anónimos (SUPUESTO, sin precio todavía).**
- La ferretería recibe unos $140 al mes en margen de las familias asignadas (cálculo con márgenes de Tulio y 20 familias, supuesto; $280 con las 40 de la meta) y recupera la membresía con 5 familias.
- Cada ferretería deja a la red unos $87 al mes (cálculo con 20 familias y el sobre a $2,94); 6 ferreterías pagando cubren los fijos de la red. Siguiente paso: comisión por transacción y plan premium.

**Nota al pie de la lámina (sensibilidad del costo del sobre).** Base de la lámina: sobre a $2,94 puesto en Venezuela (decisión del equipo: fábrica $1,94 de Tulio más un supuesto de $1,00 de flete, aduana y empaque). Sensibilidad: si el costo sube a $4,00, cifra que se mencionó en la asesoría, el aporte por ferretería baja a $66 en vez de $87; las ferreterías que cubren los fijos pasan de 6 a 7; el margen del sobre a domicilio baja de $3,38 a $2,38; la caja de la red al cierre del año 1 baja a −$4.669 en vez de −$3.105 en el base, −$9.969 en vez de −$8.909 en el conservador y −$2.035 en vez de +$1.094 en la meta de 40 familias; las familias por ferretería para cerrar el año 1 en cero suben de 35 a 56. Lo demás no cambia. Fuente: `docs/negocio/modelo.md`, sección 0.

**Nota del orador (Tulio):** "El que paga todos los meses es la ferretería. La familia entra por la medición y paga $9." Honestidad en tarima: "No hay todavía ninguna ferretería aliada; la membresía, el precio al mayor y el número de ferreterías son supuestos que el piloto confirma." Si preguntan por caja: el primer año de la red es de inversión (base de 20 familias: −$3.105 con el sobre a $2,94; con las 40 de la meta, +$1.094); la operación mensual es positiva desde el mes 6. Grimuca vende hoy del orden de un centenar de cartuchos al mes, así que 40 familias por ferretería es meta de crecimiento y no continuidad. La variable que lo tumba es cuántas familias medidas le llegan a cada ferretería al mes: con 35 el año 1 cierra en cero. Las tres tiendas propias de Carabobo siguen con su economía (hipótesis de Tulio, sin venta real). Si preguntan por los estudios: "Cada medición casera queda en un mapa por zona. Agregados y sin nombrar hogares, esos datos le sirven a una universidad o a una institución pública para ver dónde mirar primero. Son mediciones caseras orientativas, no análisis de laboratorio; solo entran los hogares que dieron su consentimiento. No tenemos todavía cliente ni precio para esta línea."

---

## Lámina 6 · Red y expansión por estados

**Imagen:** `01-saber-que-tomas.jpg` de fondo, con el mapa de estados cubiertos
**Título:** Una ferretería por estado cubre el estado

- Grimuca es el comercio de Carabobo y opera la red; en otros estados entran ferreterías aliadas, una por estado.
- La Red muestra comercios, plan, periodo gratis y cifras de toda la red; el alta de un comercio nuevo se hace en pantalla.
- Siguiente: piloto de 1.000 sobres en Carabobo, primeras ferreterías aliadas y comisión por transacción. Fuera de la demo: cuentas por usuario y cobro real.

**Lema en pantalla, abajo:** Clientes que llegan sabiendo qué necesitan · Saber qué tomas empieza en casa

**Nota del orador (Tulio):** "Empezamos en Valencia con tres tiendas que ya existen." Alerta temprana (no cabe como cuarta viñeta, va aquí): "Cuando varios hogares de una zona salen fuera de rango en la misma semana, la red lo detecta y avisa a los vecinos que aceptaron recibir avisos, para que midan su agua. No nombramos hogares y no decimos que el agua esté contaminada." En la demo hay dos comercios de demostración (Barquisimeto y Maracay), rotulados así. Datos de la región con fuente, si piden (`modelo.md` sección 11): México, 98% de los hogares compra agua embotellada (Kantar Worldpanel, 2017); República Dominicana, 84,3% usa agua de botellón (ONE, Censo 2022). Cerrar con la dirección `agua.oydo.app` en pantalla y los nombres: Leonardo Dávila y Tulio Dávila.

---

## Preguntas probables del jurado y respuesta corta

Las 23 respuestas con su número están en `docs/negocio/preguntas-jurado.md`. Las cuatro que más se hacen:

| Pregunta | Respuesta |
|---|---|
| ¿Por qué pagaría una ferretería? | Recibe familias ya medidas y inventario contra demanda; con 20 familias al mes gana unos $140 y paga $30 (cálculo, supuestos); a la red le deja unos $87 con el sobre a $2,94. |
| ¿Cuál es el problema logístico? | Surtido disperso y venta concentrada: una de cada tres referencias casi no se mueve y una hace la mitad de la venta de cartuchos; con la fecha de cada cartucho se compra lo que se vende, se ven los quiebres antes y las entregas se agrupan (15 entregas en 3 rutas: 51,9 km contra 110,9 km, datos de demostración). |
| ¿Quién es el cliente? | La familia entra por la medición y paga $9; la ferretería paga cada mes. |
| ¿Certifican el agua? | No. Es una medición casera orientativa; la prueba de bacterias tampoco certifica. Con plomo o cobre decimos "posible presencia, confirma con un laboratorio". |

## Cifras que siguen pendientes

| Lámina | Qué falta | Quién |
|---|---|---|
| 4 | Dinero en inventario, días de rotación, faltantes y entregas por semana de Grimuca | Tulio |
| 5 | Precio de membresía, precio al mayor, cuántas ferreterías entran y cuántas pagan | Tulio |
| 5 | Costo del sobre puesto en Venezuela: la lámina usa $2,94 (decisión de Leonardo); $4,00 queda como sensibilidad en la nota | Leonardo (resuelto) |
| 3 | Capturas de `/red`, `/tecnico` y Productos | Calidad o Leonardo, tras desplegar la migración 008 |

## Criterios del jurado → lámina, minuto y evidencia

Cada criterio vale 25%. Los minutos son los de `guion-demo.md` (versión 4).

| Criterio del jurado | Lámina y minuto del guion que lo responde | Evidencia en la demo |
|---|---|---|
| Modelo de negocio | Lámina 5 y bloque 7 (2:40 a 3:00); la Red en el bloque 1 (0:00 a 0:25) | Cuatro líneas de ingreso con supuestos rotulados (sobre $9, membresía $30, mayor $5,50, estudios por zona sin precio), costo del sobre en $2,94 con la sensibilidad de $4,00 en nota; `/red` muestra comercios con plan y periodo gratis |
| Producto: problema claro | Lámina 1 y bloque 1 (0:00 a 0:25); lámina 4 y bloque 2 (0:25 a 0:50) | Ferretería que compra a ciegas y hogar que no mide; inventario con faltantes en rojo y dato real de Grimuca (una de cada tres referencias casi no se mueve) |
| Producto: caso de uso demostrado | Láminas 2 y 3; bloques 3 a 5 (0:50 a 2:25) | Un solo pedido recorre cliente, comercio, técnico y red; "Ya fui" con foto; aviso fijo en el resultado |
| Calidad técnica | Lámina 3; bloque 4 (1:35 a 1:55, momento clave) | El pedido aparece solo en el despacho del comercio, en vivo, sin recargar; mapa real con rutas; aviso legal literal en resultado y bacterias |
| Innovación y potencial en Latinoamérica | Lámina 4 y bloque 2 (0:25 a 0:50); lámina 6 y bloque 7 (2:40 a 3:00) | Rutas: 15 entregas en 3 rutas contra 15 viajes sueltos, 51,9 km contra 110,9 km (53% menos, datos de demostración); una ferretería por estado cubre el estado; México 98% y República Dominicana 84,3% (con fuente, si preguntan) |

**Pendiente fuera de este archivo:** el bloque 2 del guion aún no dice la cifra de las rutas; hoy dice "una ruta en vez de viajes sueltos". Sugerido para quien ensaya: "15 entregas en 3 rutas: 51,9 kilómetros contra 110,9, con los datos de demostración".
