# Modelo de negocio · Grimuca Agua

**Borrador para validar con Tulio · sábado 21 nov 2026 · hackatón ValenValley, track Logística**

Cómo leer este documento:

- **DATO** = viene de un documento del equipo o de una fuente pública con enlace (lista completa en la sección 12).
- **SUPUESTO** = número puesto por Business para poder calcular, con su rango razonable. Se cambia en cuanto Tulio dé el real.
- Todos los montos están en dólares. Los totales se calculan con todos los decimales; puede haber diferencias de 1 centavo al sumar las filas.
- Ningún precio ni margen de filtros o cartuchos de Grimuca es real todavía: el catálogo no ha llegado.

---

## 0. El modelo en 8 líneas

1. Se vende un **sobre de una sola lectura a $9** (DATO, Tulio). El sobre no es el negocio: es la puerta de entrada.
2. Armar y entregar el sobre cuesta unos **$7,26** en el escenario base (SUPUESTO, rango $3,95 a $10,68). Deja **$1,74**. Dos números deciden si se paga solo: **el frasco de bacterias y el envío**.
3. El negocio es el **filtro** (margen SUPUESTO $18) y los **recambios de cartuchos** (margen SUPUESTO $6,30 por juego).
4. De cada 100 sobres, **15 hogares compran filtro** (SUPUESTO, rango 8 a 25). Cada uno deja **$24 de margen en 12 meses y $34 en 24**.
5. Conseguir ese cliente cuesta **menos de cero** en el escenario base: los sobres que hay que vender para encontrarlo pagan la publicidad y sobra $1,57.
6. **Punto de equilibrio: 69 sobres al mes por tienda** (unos 3 por día), que traen 10 filtros al mes.
7. Con filtro de $60 el primer año queda casi tablas (−$1.400 entre las 3 tiendas) y el segundo ya es positivo. **Cobrar el envío aparte o subir el ticket del filtro a $90 lo voltea en el primer año.**
8. Logística: un hogar con botellón mueve **2.054 kg y 52 entregas al año**; con filtro mueve **menos de 4 kg y 3 envíos**, y solo cuando la medición lo pide.

---

## 1. La oferta y el costo del sobre

**Qué trae (DATO, correo de Tulio 8:12 p.m.):** 1 tira multiparámetro, 1 prueba de bacterias (E. coli y coliformes) de frasco, tabla de colores impresa, QR al video, enviado a la casa. Precio: **$9**.

### Costo unitario, componente por componente

| Componente | Conservador | **Base** | Optimista | Tipo | De dónde sale |
|---|---|---|---|---|---|
| Tira multiparámetro (HORYZON 16 en 1) | $0,04 | **$0,04** | $0,04 | DATO | Tulio: "unos 4 centavos" en Alibaba. Precio en origen, sin flete |
| Sobre individual de aluminio para la tira | $0,10 | **$0,05** | $0,03 | SUPUESTO | Las tiras vienen en frascos de 50 o 100; para vender de a una hay que sellarla sola para que la humedad no la dañe. Rango $0,03 a $0,10 |
| Prueba de bacterias (frasco) | $3,50 | **$2,70** | $1,50 | SUPUESTO | Rango $1,50 a $4,00. Referencias en la nota de abajo |
| Importación (flete + nacionalización) sobre lo anterior | 50% = $1,82 | **35% = $0,98** | 25% = $0,39 | SUPUESTO | Pendiente de Tulio. Rango 25% a 60% |
| Tabla de colores impresa + instructivo con QR | $0,25 | **$0,15** | $0,08 | SUPUESTO | Impresión local a color. Rango $0,08 a $0,30 |
| Empaque (sobre, bolsa con cierre, etiqueta) | $0,50 | **$0,35** | $0,20 | SUPUESTO | Pendiente de Tulio. Rango $0,20 a $0,60 |
| Armado en tienda | $0,15 | **$0,10** | $0,05 | SUPUESTO | Minutos de un empleado. Rango $0,05 a $0,20 |
| Merma (sobres dañados, tira que hay que reponer) | 8% = $0,51 | **5% = $0,22** | 3% = $0,07 | SUPUESTO | Rango 3% a 8% del costo del producto |
| **Costo del producto, sin envío** | **$6,87** | **$4,58** | **$2,36** | | |
| Envío a la casa en moto, dentro de Valencia | $3,50 | **$2,50** | $1,50 | SUPUESTO | Pendiente de Tulio. Referencia: un repartidor de plataforma cobra entre $2 y $3 por viaje (Cavecom-e, 2024) |
| Comisión de cobro (punto, pago móvil, Zelle) | 3,5% = $0,31 | **2% = $0,18** | 1% = $0,09 | SUPUESTO | Rango 0% a 3,5% |
| **Costo total por sobre** | **$10,68** | **$7,26** | **$3,95** | | |
| **Margen por sobre ($9 − costo)** | **−$1,68** | **+$1,74 (19%)** | **+$5,05 (56%)** | | |
| Margen si el cliente retira en tienda (sin envío) | +$1,82 | +$4,24 | +$6,55 | | |

**Nota sobre la prueba de bacterias (el número más importante de la tabla):**

- Al detal en Estados Unidos una sola prueba casera de coliformes y E. coli (Pro-Lab BA110) cuesta entre $10,99 y $14,98. A ese precio el sobre de $9 no existe.
- Un kit escolar de 44 pruebas (LaMotte 5850) cuesta $154,99: unos $3,50 por prueba.
- En Alibaba apareció un listado de kit casero de bacterias entre $2,60 y $2,80 por unidad, pero la página no abrió al verificarla y no quedó claro qué trae cada unidad. **No es un dato firme.**
- Por eso el base es $2,70 y el rango $1,50 a $4,00. Con los demás costos en base, **el sobre deja de pagarse si el frasco llega a costar más de $3,92** en origen.

**Lectura:** en el escenario base el sobre se paga solo y deja $1,74. En el conservador pierde $1,68 por sobre. La diferencia la hacen el frasco y el envío, no la tira.

**Decisión que conviene que Tulio mire:** "$9 con retiro en tienda, envío a la casa aparte". Sube el margen del sobre de $1,74 a $4,24 y es lo que más mejora el flujo de caja (sección 7).

---

## 2. Botellón contra filtro + cartuchos · familia de 4, 12 meses

**Consumo (SUPUESTO):** 2 botellones de 19 L por semana = **104 al año** = 1.976 litros (1,35 L por persona al día). Rango: 1,5 a 3 por semana.
Referencias: en Caracas hay hogares que usan hasta 3 por semana (El Diario, 2024); en México el hogar promedio compra 1.385 L al año, unos 73 garrafones (Kantar, 2017); la OMS usa 2 L por adulto al día como supuesto estándar para beber, así que 2 botellones por semana es un número prudente.

**Precio del botellón:** no se encontró un precio publicado de Valencia para 2026. Lo disponible es de Caracas y está marcado.

| Opción | Precio unitario | Gasto en 12 meses | Gasto en 24 meses | Kilos que se mueven al año |
|---|---|---|---|---|
| Botellón: recarga que la familia busca | $1,00 (DATO de rango: $0,50 a $1,10, Caracas, mar 2024) | **$104** (de $52 a $114) | $208 | 2.054 kg, cargados por la familia |
| Botellón: a domicilio | $2,00 (SUPUESTO, rango $1,50 a $2,50; tope de $2,50 es DATO de 2022) | **$208** (de $156 a $260) | $416 | 2.054 kg |
| Botellón sellado de marca | $2,50 a $5,00 (DATO, Caracas, mar 2024) | **$260 a $520** | $520 a $1.040 | 2.054 kg |
| **Sobre + filtro de 3 etapas + cartuchos** | Sobre $9 (DATO) + filtro $60 + instalación $15 + 1 juego de cartuchos $18 (los tres SUPUESTO) | **$102** (de $61 a $214) | **$147** | Unos 4 kg el primer año, 2 kg el segundo |

Cómo se arma la fila del filtro:

- Año 1: sobre $9 + filtro $60 (ya trae sus cartuchos) + instalación $15 + 1 recambio al mes 6 ($18) = **$102**.
- Año 2: 2 recambios ($36) + 1 sobre de control ($9) = **$45**.
- Rangos SUPUESTO: filtro $40 a $120 (un equipo de ósmosis inversa puede estar entre $150 y $250), juego de cartuchos $12 a $30, instalación $0 a $25, recambio cada 4 a 8 meses.

**Lo que dice la tabla:**

- Contra el botellón a domicilio la familia ahorra **$106 el primer año y $163 el segundo**. El filtro se paga **entre el mes 5 y el 6**.
- Contra la recarga que la familia busca ella misma, el primer año sale tablas ($102 contra $104) y desde el segundo ahorra $59 al año. Ahí el argumento no es el dinero: es **dejar de cargar 2 toneladas de agua al año** y saber cuándo toca cambiar el cartucho.
- El filtro necesita que llegue agua por el chorro o que haya tanque. En hogares donde no llega agua, el filtro no reemplaza el suministro.
- La comparación es de costo y de carga. Ni el sobre ni el filtro certifican el agua; el aviso fijo de la app se mantiene.

---

## 3. Margen del filtro y de los cartuchos

Todo SUPUESTO hasta que llegue el catálogo real (sin la línea Aqual).

| Producto | Precio de venta (SUPUESTO) | Margen bruto (SUPUESTO) | Margen en dólares | Rango razonable |
|---|---|---|---|---|
| Filtro de 3 etapas | $60 (rango $40 a $120) | 30% (rango 20% a 40%) | **$18,00** | $8 a $48 |
| Juego de 3 cartuchos (sedimento, carbón granular, carbón en bloque) | $18 (rango $12 a $30) | 35% (rango 25% a 45%) | **$6,30** | $3,00 a $13,50 |
| Cartucho suelto | $6 en promedio (rango $3 a $12) | 35% (rango 25% a 45%) | **$2,10** | $0,75 a $5,40 |
| Instalación | $15 (rango $0 a $25) | 0% (se le paga completo al instalador) | $0 | Por definir |

No hay fuente pública para los márgenes: son los de un comercio de ferretería, a confirmar con los costos de Grimuca.

---

## 4. Embudo y valor del cliente

**Escenarios (todos SUPUESTO; nadie ha vendido este sobre todavía):**

| Por cada 100 sobres vendidos | Conservador | **Base** | Optimista |
|---|---|---|---|
| Hogares que compran filtro | 8 | **15** | 25 |
| Meses entre recambios | 8 | **6** | 4 |
| Hogares con filtro que siguen recambiando con Grimuca | 60% | **75%** | 90% |
| Recambios pagados por hogar en los primeros 12 meses | 0,6 | **0,75** | 1,8 |
| Recambios pagados por hogar en 24 meses | 1,2 | **2,25** | 4,5 |
| Recambios por año ya en régimen | 0,9 | **1,5** | 2,7 |
| Margen del filtro | 25% = $15,00 | **30% = $18,00** | 35% = $21,00 |
| Margen del juego de cartuchos | 30% = $5,40 | **35% = $6,30** | 40% = $7,20 |

Regla de conteo: el recambio que cae justo en el mes 12 (o 24) se cuenta en el período siguiente. Es el lado prudente.

**Valor de un cliente (un hogar que compró filtro):**

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Ventas en 12 meses (sobre + filtro + recambios) | $79,80 | **$82,50** | $101,40 |
| **Margen en 12 meses** | $16,56 | **$24,46** | $39,01 |
| Ventas en 24 meses | $90,60 | **$109,50** | $150,00 |
| **Margen en 24 meses** | $19,80 | **$33,91** | $58,45 |

Ejemplo base a 12 meses: margen del sobre $1,74 + margen del filtro $18,00 + 0,75 recambios × $6,30 = **$24,46**.

**Lo que deja cada sobre vendido (mezclando a los que compran filtro y a los que no):**

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Margen por sobre vendido, a 12 meses | −$0,22 | **$5,14** | $13,54 |
| Margen por sobre vendido, a 24 meses | $0,03 | **$6,56** | $18,40 |

**No está contado (queda del lado prudente):** hogares que ya tienen filtro y solo compran cartuchos; sobres de control que se repiten; vecinos que compran cuando una zona entra en alerta; instalación con margen.

---

## 5. Costo de conseguir un cliente

"Cliente" = hogar que compra filtro. La cuenta: cuántos sobres hay que vender para encontrar uno, cuánto se gasta en publicidad para vender esos sobres y cuánto dejan (o cuestan) esos mismos sobres.

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Sobres que hay que vender por cada comprador de filtro | 12,5 | **6,7** | 4 |
| Publicidad por sobre vendido (SUPUESTO, rango $0,75 a $2,50) | $2,50 | **$1,50** | $0,75 |
| Publicidad total por cliente | $31,25 | **$10,00** | $3,00 |
| Lo que dejan esos sobres | −$21,05 | **+$11,57** | +$20,19 |
| **Costo neto de conseguir el cliente** | **$52,30** | **−$1,57** | **−$17,19** |
| Margen del filtro + recambios en 12 meses | $18,24 | **$22,73** | $33,96 |
| Comparación: si el sobre se regalara | $164,80 | $58,43 | $18,81 |

**Lectura:**

- En el base **el sobre de $9 paga la publicidad y sobra $1,57 por cliente**: el cliente llega pagado y todo el margen del filtro es ganancia bruta.
- Si el sobre se regalara, cada cliente costaría $58 y el filtro de $60 no lo recupera. Por eso cobrar los $9 es la pieza clave del modelo.
- En el conservador el cliente cuesta $52 y solo deja $18 en 12 meses: **el modelo no cierra**. Qué tiene que ser cierto para que cierre: frasco por debajo de $3, envío cobrado aparte o retiro en tienda, y conversión de 12% o más.

---

## 6. Punto de equilibrio por tienda

**Costo fijo adicional por tienda (SUPUESTO):** $250 al mes en el base (rango $200 a $350). Es lo que se agrega a una tienda que ya existe: media jornada de una persona para armar sobres, despachar y atender consultas (~$150), su parte de la app y el servidor (~$50) y varios (~$50). El alquiler y la nómina actual de la tienda no se cargan aquí.

**Contribución por sobre vendido** = lo que deja el sobre a 12 meses (sección 4) menos la publicidad.

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Costo fijo adicional por tienda al mes | $350 | **$250** | $200 |
| Contribución por sobre vendido | −$2,72 | **$3,64** | $12,79 |
| **Sobres al mes para equilibrio, por tienda** | No hay equilibrio | **69** | 16 |
| Sobres por día (26 días de venta) | — | **2,6** | 0,6 |
| Filtros al mes que eso trae | — | **10** | 4 |
| Sobres al mes supuestos en régimen | 40 | **80** | 150 |

**Por tienda, escenario base.** SUPUESTO: las tres venden igual. No hay datos de tráfico por tienda; se ajusta cuando Tulio los dé.

| Tienda | Costo fijo adicional | Sobres al mes para equilibrio | Filtros al mes | Sobres al mes supuestos | Holgura |
|---|---|---|---|---|---|
| Mañongo | $250 | 69 | 10 | 80 | +11 |
| Big Low | $250 | 69 | 10 | 80 | +11 |
| CC CEM | $250 | 69 | 10 | 80 | +11 |
| **Las 3** | **$750** | **206** | **31** | **240** | **+34** |

**Qué mueve el punto de equilibrio (base, por tienda):**

| Cambio | Sobres al mes para equilibrio |
|---|---|
| Base (filtro $60, envío incluido) | 69 |
| Envío cobrado aparte o retiro en tienda | 41 |
| Ticket promedio del filtro $90 | 50 |
| Ticket promedio del filtro $120 | 39 |
| Ticket promedio del filtro $200 (ósmosis inversa) | 25 |

Con 80 sobres al mes por tienda, la conversión mínima para no perder es **12,7%**. Por debajo de eso el base no cierra.

Este equilibrio es "en régimen": cuando cada sobre ya rindió sus 12 meses. La caja del primer año va más atrás (sección 7).

---

## 7. Flujo de caja simple a 12 meses · las 3 tiendas

Supuestos del flujo (todos SUPUESTO):

- Arranque gradual: 40%, 60% y 80% de las ventas en los meses 1, 2 y 3; 100% desde el mes 4.
- El filtro se compra al mes siguiente del sobre. Los recambios llegan según el intervalo de cada escenario.
- Inversión inicial: **$1.500** (video, diseño de impresos, capacitación de las tiendas, ajustes de la app).
- Simplificación: el inventario se cuenta cuando se vende. En la realidad el primer lote se paga por adelantado: 1.000 sobres son unos **$4.300** (SUPUESTO) que hay que tener en caja antes de vender el primero.

### Escenario base, mes a mes

| Mes | Sobres | Filtros | Recambios | Ingresos | Egresos | Neto del mes | Caja acumulada |
|---|---|---|---|---|---|---|---|
| 0 | — | — | — | — | $1.500 | −$1.500 | −$1.500 |
| 1 | 96 | 0 | 0 | $864 | $1.591 | −$727 | −$2.227 |
| 2 | 144 | 14 | 0 | $2.160 | $2.617 | −$457 | −$2.684 |
| 3 | 192 | 22 | 0 | $3.024 | $3.340 | −$316 | −$3.000 |
| 4 | 240 | 29 | 0 | $3.888 | $4.063 | −$175 | −$3.176 |
| 5 | 240 | 36 | 0 | $4.320 | $4.366 | −$46 | −$3.221 |
| 6 | 240 | 36 | 0 | $4.320 | $4.366 | −$46 | −$3.267 |
| 7 | 240 | 36 | 0 | $4.320 | $4.366 | −$46 | **−$3.312** |
| 8 | 240 | 36 | 11 | $4.514 | $4.492 | +$22 | −$3.290 |
| 9 | 240 | 36 | 16 | $4.612 | $4.555 | +$57 | −$3.233 |
| 10 | 240 | 36 | 22 | $4.709 | $4.618 | +$91 | −$3.143 |
| 11 | 240 | 36 | 27 | $4.806 | $4.681 | +$125 | −$3.018 |
| 12 | 240 | 36 | 27 | $4.806 | $4.681 | +$125 | −$2.894 |
| **Año 1** | **2.592** | **353** | **103** | **$46.343** | **$47.736** | **−$1.394** | **−$2.894** |

Egresos = costo de los sobres + publicidad + costo de los filtros y cartuchos vendidos + $750 de fijos.

### Los tres escenarios

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Sobres vendidos en el año | 1.296 | **2.592** | 4.860 |
| Filtros vendidos | 94 | **353** | 1.103 |
| Recambios vendidos | 10 | **103** | 770 |
| Ingresos del año | $17.495 | **$46.343** | $123.741 |
| Egresos del año | $34.050 | **$47.736** | $81.356 |
| **Resultado del año 1** | **−$16.555** | **−$1.394** | **+$42.385** |
| Hueco máximo de caja | −$18.055 (y sigue) | **−$3.312 (mes 7)** | −$1.500 (mes 0) |
| Primer mes con neto positivo | Ninguno | **Mes 8** | Mes 1 |
| Mes en que se recupera la inversión | No se recupera | **Mes 23** | Mes 2 |
| Resultado del año 2 | −$16.343 | **+$3.808** | +$74.544 |

**Lectura honesta:** con filtro de $60 y envío incluido, el base queda casi tablas el primer año y gana poco el segundo. El modelo es sano pero delgado. Hay tres palancas, y cualquiera de las tres lo voltea:

| Variante del base | Resultado año 1 | Se recupera la inversión | Resultado año 2 |
|---|---|---|---|
| Base tal cual | −$1.394 | Mes 23 | +$3.808 |
| Envío cobrado aparte o retiro en tienda | **+$5.086** | **Mes 7** | +$11.008 |
| Ticket promedio del filtro $90 | +$1.782 | Mes 12 | +$7.696 |
| Ticket promedio del filtro $120 | +$4.957 | Mes 8 | +$11.584 |
| Conversión 20% en vez de 15% | +$939 | Mes 14 | +$7.851 |
| Conversión 10% en vez de 15% | −$3.726 | No en 24 meses | −$236 |

El conservador pierde todos los meses: con frasco caro, envío caro y 8% de conversión, **no se debe lanzar sin cambiar el precio o la forma de entrega**. Eso se sabe con las primeras 100 ventas.

---

## 8. Por qué esto es logística

**La idea:** hoy el agua de tomar viaja todas las semanas en botellones de 19 L. Con filtro, lo que viaja es un cartucho de vez en cuando, y solo cuando la medición dice que toca.

**Pesos (SUPUESTO, se confirman pesando):** botellón lleno 19,75 kg (19 kg de agua + envase de ~0,75 kg); juego de 3 cartuchos 0,9 kg; sobre 60 g; filtro en su caja 3 kg.

### Un hogar, un año

| | Botellón | Filtro, año 1 | Filtro, año 2 en adelante |
|---|---|---|---|
| Qué se mueve | 104 botellones llenos + 104 vacíos de vuelta | 1 sobre + 1 filtro + 1 juego de cartuchos | 2 juegos de cartuchos + 1 sobre de control |
| Kilos | **2.054 kg** | 4 kg | 1,9 kg |
| Entregas | **52** (2 botellones por visita) | 3 | 3 |
| Cuándo | Todas las semanas, haga falta o no | Cuando la medición lo pide | Cuando la medición lo pide |

Reducción: **99,8% menos kilos y 94% menos entregas** por hogar.

### 1.000 hogares

| | Botellón | Filtro + cartuchos |
|---|---|---|
| Kilos al año | 2.054 toneladas | 1,9 toneladas |
| Entregas al año | 52.000 | 3.000 |
| Semana típica | 39,5 toneladas en 1.000 visitas | 36 kg en 58 envíos |

Lo que hoy pide camiones toda la semana pasa a caber en el morral de un motorizado.

**En el escenario base, año 1:** 353 hogares con filtro. Si todos dejaran el botellón (SUPUESTO; si lo deja la mitad, la mitad): 725 toneladas y 18.300 entregas al año que dejan de moverse, contra 0,7 toneladas y unos 1.060 envíos pequeños.

**Aclaratoria:** Grimuca no reparte botellones hoy. Ese ahorro es de la familia y de la ciudad, no un costo que Grimuca se quite. Lo que Grimuca gana en logística es esto:

- **Las 3 tiendas son almacenes de despacho.** No hace falta galpón ni flota. El stock de un mes de una tienda en el base (80 sobres, que pesan unos 5 kg, más 12 filtros y unos 9 juegos de cartuchos) cabe en un estante.
- **Demanda prevista por zona.** Cada medición y cada fecha de último cambio dicen cuándo toca el próximo recambio. El operador ve los recambios a 7 y 30 días por tienda y compra solo lo que va a salir.
- **Envíos agrupados.** Si una zona tiene varios hogares con recambio en la misma semana (o entra en alerta), sale una sola ruta. A $2,50 por envío (SUPUESTO), agrupar 3 pedidos en una ruta baja el costo por pedido a menos de $1.
- **El sobre también es un despacho.** Sale de la misma tienda, con la misma lista y el mismo botón de "despachado".

---

## 9. Potencial en Latinoamérica

**El problema no es solo de Venezuela:**

| Dato | Cifra | Fuente |
|---|---|---|
| Venezuela: hogares | Unos 9 millones, 3,1 personas en promedio | ENCOVI 2025 (UCAB, may 2026) |
| Venezuela: reciben agua todos los días | 27% | OVSP, citado por El Diario, abr 2022 |
| Venezuela: dicen que el agua llega con mal olor o color | 47% | OVSP, citado por El Diario, abr 2022 |
| Valencia | Ciudad donde más se compra agua embotellada, según el OVSP | El Diario, abr 2022 |
| México: hogares que compran agua embotellada | 98%, 51 compras al año, el garrafón es 98% del volumen | Kantar Worldpanel, datos 2017 |
| México: consumo por persona | 273 litros al año | El Imparcial, mar 2026 |
| República Dominicana: hogares que toman agua de botellón | 84,3% (3,14 millones de hogares) | ONE, Censo 2022, citado por Revista Mercado, ago 2026 |
| Mercado de agua embotellada en Latinoamérica | Entre $15.000 y $33.000 millones al año (dos consultoras, cifras muy distintas) | Credence Research (2023) y MarketDataForecast (2025); no verificadas directamente |
| Mercado de purificadores de agua en Latinoamérica | $2.500 millones en 2025, crece 6,7% anual hasta 2035; Brasil es el 45,6% | Global Market Insights |

**Dónde el filtro se paga más rápido.** Precio de la recarga del botellón de 20 L por país (Bloomberg Línea, oct 2022):

| País | Recarga de 20 L |
|---|---|
| Venezuela | $0,50 (buscándola) a $2,50 (a domicilio) |
| República Dominicana | $0,66 a $1,60 |
| Honduras | $1,62 |
| El Salvador | $1,50 a $2,50 |
| México | $2,30 a $2,50 |
| Chile, Colombia, Guatemala | Alrededor de $2,50 |
| Argentina | $4,14 |
| Perú | $5,00 |
| Panamá | Alrededor de $5,50 |

En México, 73 garrafones al año a $2,30–$2,50 son $168 a $182 por hogar: con los mismos precios SUPUESTO del filtro, se paga en unos 7 meses. En Perú o Panamá, en menos.

**Tamaño de la oportunidad (cuentas con SUPUESTO):**

- Valencia: área metropolitana de unos 2 millones de personas (SUPUESTO, verificar) ≈ 645.000 hogares. Con 1% de ellos con filtro: 6.450 hogares × $82,50 de ventas el primer año = **unos $530.000**.
- Venezuela: 1% de 9 millones de hogares = 90.000 hogares × $82,50 = **unos $7,4 millones** el primer año, más los recambios cada año.

**Por qué se puede repetir en otra ciudad o país:**

1. La tira cuesta centavos y viaja en un sobre: no hay que montar laboratorio.
2. La app ya lee la foto, recomienda el cartucho y arma el despacho.
3. El almacén es una ferretería que ya existe. Grimuca es la primera; en otra ciudad puede ser una ferretería aliada (idea, por validar).
4. Lo que cambia por país es el catálogo y la tabla de la tira, y las dos cosas ya son configurables en la app.

---

## 10. Riesgos del modelo

| Riesgo | Qué pasa | Qué se hace |
|---|---|---|
| El frasco de bacterias cuesta más de $3,92 | El sobre deja de pagarse solo | Cotizar ya con 2 o 3 proveedores; si no baja, subir a $10–$12 o vender la prueba de bacterias aparte |
| Conversión a filtro menor a 12% | El base no llega a equilibrio | Medirla con las primeras 100 ventas antes de comprar un lote grande |
| Envío más caro de lo supuesto | Se come el margen del sobre | Retiro en tienda como opción principal; envío aparte |
| Ticket del filtro bajo | Año 1 queda en tablas | Ofrecer también el equipo de más etapas |
| La tira se lee mal o llega dañada | Reposición (ya hay 5% de merma en el costo) | Sobre individual sellado, foto junto a la tabla, carga manual |
| Afirmaciones de salud | Riesgo legal y de confianza | La app no certifica el agua; aviso fijo; plomo, cobre y bacterias se confirman con laboratorio |
| Permisos para importar y vender pruebas de agua | Sin fuente verificada | Confirmar con abogado (lo lleva el Asesor legal) |

---

## 11. Datos que Tulio debe confirmar

En orden de cuánto mueven el resultado:

1. **Prueba de bacterias:** proveedor, costo por frasco puesto en origen y pedido mínimo. (Supuesto: $2,70; rango $1,50–$4,00.)
2. **Envío del sobre dentro de Valencia:** costo por entrega y si se cobra aparte o va dentro de los $9. (Supuesto: $2,50 incluido.)
3. **% de sobres que terminan en compra de filtro.** (Supuesto: 15%; rango 8%–25%.) Si hay experiencia de mostrador, cuántos de los que preguntan por filtro compran.
4. **Catálogo real:** qué filtros se van a ofrecer, precio de venta y costo de cada uno. (Supuesto: $60 con 30% de margen.)
5. **Cartuchos:** precio de venta y costo por cartucho y por juego; cada cuánto se cambian. (Supuesto: juego $18, 35% de margen, cada 6 meses.)
6. **Importación:** flete y nacionalización como % del valor, y cuánto tarda en llegar. (Supuesto: 35%.)
7. **Empaque e impresos:** costo del sobre, la tabla de colores y la etiqueta. (Supuesto: $0,50 entre todo.)
8. **Tira:** ¿los 4 centavos incluyen flete? ¿El proveedor la entrega sellada de a una o hay que re-empacarla? (Supuesto: sobre de aluminio aparte, $0,05.)
9. **Instalación del filtro:** quién la hace y cuánto cobra. (Supuesto: $15, sin margen para Grimuca.)
10. **Precio del botellón hoy en Valencia:** recarga y a domicilio. (No hay fuente de 2026; supuesto $1,00 y $2,00.)
11. **Costo adicional por tienda:** quién arma y despacha los sobres y cuántas horas. (Supuesto: $250 al mes por tienda.)
12. **Reparto entre tiendas:** cuál de las tres vende más y qué zonas atiende cada una. (Supuesto: iguales.)
13. **Publicidad:** cuánto se piensa gastar para vender los primeros sobres. (Supuesto: $1,50 por sobre vendido.)
14. **Comisión de cobro** de los medios de pago que se usarán. (Supuesto: 2%.)

---

## 12. Fuentes

Documentos del equipo:

- Correo de Tulio, sáb 21 nov, 8:12 p.m.: `insumos-tulio/2026-11-21_2012_producto-y-onboarding.md` (oferta de $9, contenido del sobre, tira a ~4 centavos, pendientes de costos).
- `HANDOFF-hackaton.md`, secciones 2 y 3 (alcance, tiendas, por qué es logística).

Fuentes públicas (consultadas el 21 nov 2026):

- Precio de recarga y de botellón sellado en Caracas; hogares con hasta 3 botellones por semana: [El Diario, 22 mar 2024](https://eldiario.com/2024/03/22/cuales-son-precios-tanques-botellones-cisternas-caracas/).
- Botellón de 20 L en Venezuela ($0,50 a $2,50) y precios por país: [Bloomberg Línea, 27 oct 2022](https://www.bloomberglinea.com/2022/10/27/el-agua-en-venezuela-es-realmente-una-de-las-mas-caras-de-la-region/).
- OVSP: frecuencia del servicio, olor y color, Valencia y el agua embotellada: [El Diario, 9 abr 2022](https://eldiario.com/2022/04/09/estados-acceso-agua-por-tuberias-en-venezuela/).
- ENCOVI 2025, hogares y tamaño promedio: [presentación UCAB, 7 may 2026 (PDF)](https://elucabista.com/wp-content/uploads/2023/01/ENCOVI-2025_presentacion_UCAB-07-05-2026.pdf). Tomado del resumen del buscador; verificar en el PDF.
- Tarifa de repartidor por viaje ($2 a $3), Cavecom-e vía EFE: [Diario de Los Andes, 5 mar 2024](https://diariodelosandes.com/el-reparto-a-domicilio-un-boyante-sector-en-venezuela-que-emplea-a-miles-de-personas).
- Prueba de bacterias al detal, Pro-Lab BA110: [Walmart](https://www.walmart.com/ip/Pro-Lab-Water-Bacteria-Test-Kit-BA110/21903076). Kit de 44 pruebas LaMotte 5850: [Zoro](https://zoro.com/lamotte-water-test-ed-kit-coliform-bacteria-5850/i/G2153216). Precios tomados del resumen del buscador.
- Listado de Alibaba de kit casero de bacterias ($2,60 a $2,80): [enlace](https://www.alibaba.com/product-introduction/Bacteria-Test-Kit-home-use-Drinking_1600693755855.html). La página no abrió al verificarla; no es dato firme.
- Supuesto estándar de 2 L por adulto al día: [Guías de la OMS para la calidad del agua de consumo humano, 4.ª edición](https://www.who.int/publications/i/item/9789240045064).
- México, compra de agua embotellada por hogar: [Kantar Worldpanel, 20 mar 2018](https://www.kantar.com/latin-america/inspiracion/consumo-masivo/consumo-agua-embotellada).
- México, 273 litros por persona al año: [El Imparcial, 30 mar 2026](https://www.elimparcial.com/mexico/2026/03/30/cada-botella-de-agua-puede-requerir-hasta-150-litros-para-fabricarse-y-el-consumo-de-273-litros-por-persona-al-ano-en-mexico-un-pais-con-acuiferos-sobreexplotados-intensifico-la-crisis-hidrica/).
- República Dominicana, 84,3% de hogares con botellón: [Revista Mercado, 19 ago 2026](https://revistamercado.do/money-invest/daily-news/el-pais-del-botellon-cuanto-gastan-las-familias-en-rd-al-comprar-el-agua-que-toman/).
- Mercado de purificadores en Latinoamérica: [Global Market Insights](https://www.gminsights.com/es/industry-analysis/latin-america-water-purifier-market).
- Mercado de agua embotellada en Latinoamérica: [MarketDataForecast](https://www.marketdataforecast.com/market-reports/la-bottled-water-market) ($32.570 millones en 2025) y [Credence Research](https://www.credenceresearch.com/report/latin-america-bottled-water-market) ($14.864 millones en 2023). Informes de pago, cifras tomadas del resumen del buscador: usar solo como orden de magnitud.

Sin fuente pública (van como SUPUESTO): precio del botellón en Valencia en 2026, precios y márgenes de filtros y cartuchos en Venezuela, costo de importación, conversión de sobre a filtro, pesos de cartuchos y envases, población del área metropolitana de Valencia.
