# Modelo de negocio · Grimuca Agua

**Versión 2 · sábado 21 nov 2026 · hackatón ValenValley, track Logística**
**Reescrito con las cifras y el modelo de Tulio (correos del 21 nov, 8:38 a 8:52 p.m.). Sus cifras mandan sobre los supuestos del borrador anterior.**

**Lema:** "Saber qué tomas empieza en casa".
**Promesa:** "Menos botellones: mide tu agua y cambia el cartucho cuando toca".

Cómo leer este documento. Cada cifra lleva su origen:

- **Tulio** = lo dijo él en sus correos.
- **Referencia de mercado** = precio de una tienda en línea u otra fuente pública. **No es precio de Grimuca.**
- **SUPUESTO** = lo puso Business para poder calcular. Se cambia cuando Tulio dé el real.
- Montos en dólares. Los totales se calculan con todos los decimales; al sumar filas puede haber diferencias de $1.
- Nada de lo que sigue es una promesa sobre la calidad del agua. La app orienta y avisa cuándo cambiar el cartucho; no certifica.

---

## 0. El modelo en 10 líneas

1. El **sobre de $9** es el gancho para captar hogares (Tulio). Cuesta **$1,54 a $2,04 en fábrica** (Tulio, fuente en la sección 1), sin envío, importación ni empaque.
2. El **filtro se vende casi a costo: 20% de margen** (Tulio), más barato que la competencia. Con los precios de referencia, eso es $24 (ultrafiltración) a $66 (ósmosis) por filtro.
3. El margen grande está en los **cartuchos: 50% de margen, cambio cada 3 meses** (Tulio). Un juego de referencia de $18,99 deja $9,50.
4. Por cada 100 sobres (Tulio): **10 compran filtro, 30 ya tienen filtro y compran cartuchos, 60 solo se informan.** El segundo mercado son los hogares que ya tienen filtro y no saben cuándo cambiarlo.
5. El **plomero** cobra $40 a $60 por instalar y $30 por cambiar; Grimuca se queda con el 30%.
6. Con **150 hogares al mes por tienda**, el modelo de Tulio da **$1.650 a $2.450 al mes por tienda** descontado el almacenista ($360). Al revisar la cuenta me da **$1.657 a $2.377** (sección 4).
7. Descontando lo que Tulio todavía no incluía (importación, empaque, envío, pasarela, responsable de logística, todo SUPUESTO), quedan **unos $1.150 a $1.830 por tienda al mes** el primer mes.
8. **Punto de equilibrio:** unos **40 a 44 sobres al mes por tienda** con la conversión de Tulio, y 62 con la mitad de conversión. La meta de Tulio es 150.
9. **Flujo de caja a 12 meses, las 3 tiendas:** escenario base **+$65.500** de caja al cerrar el año; conservador **+$6.200**. La variable que lo tumba es la **captación de hogares por tienda** (sección 6).
10. Contra el botellón de Tulio (5 a 6 por quincena, $240 a $576 al año), un hogar que cambia el cartucho a tiempo **mueve menos de 6 kg al año contra 2.370 a 2.844 kg**.

---

## 1. El sobre: precio, costo y margen

**Qué trae (Tulio):** 1 tira multiparámetro, 1 prueba de bacterias en frasco, tabla de colores impresa, QR al video. Precio **$9**.

**El primer paso del cliente es escanear el QR del sobre.** El pago dentro de la app es solo para quien pide el sobre a domicilio; también puede retirarlo en la tienda (Tulio).

### Costo en fábrica (Tulio)

| Componente | Costo | Origen |
|---|---|---|
| Frasco de bacterias, de 10 a 499 unidades | $2,00 | Tulio (Shenzhen Hongyi, Alibaba) |
| Frasco, de 500 a 1.999 unidades | $1,90 | Tulio |
| Frasco, desde 2.000 unidades | $1,50 | Tulio |
| Tira HORYZON | ~$0,04 | Tulio |
| **Sobre en fábrica** | **$2,04 / $1,94 / $1,54** según volumen | Tulio: rango $1,54 a $2,04 |

### Lo que se suma hasta la puerta (SUPUESTO, pendiente de Tulio)

| Concepto | Valor usado | Origen |
|---|---|---|
| Importación (flete y aduana) más empaque e impresos | **$1,00 por sobre** (rango $0,60 a $1,50) | SUPUESTO. Antes: importación 35% (~$0,63) y empaque ~$0,35 |
| Envío a domicilio | **$2,50 por entrega** | SUPUESTO, sin tarifa real (SAMA Logística 3 por cotizar) |
| Parte de los sobres que van a domicilio | **50%** | SUPUESTO; el resto se retira en tienda, farmacia o supermercado aliado |
| Pasarela de pagos | **2% de lo que se paga en la app; en promedio 1% de las ventas** | SUPUESTO, costos de Cobrix pendientes |

### Margen por sobre

| | Fábrica $1,94 (lote del piloto) | Fábrica $1,54 (2.000 o más) |
|---|---|---|
| Retiro en tienda (sin envío) | $9 − $1,94 − $1,00 = **$6,06** | $6,46 |
| A domicilio ($2,50 de envío) | **$3,56** | $3,96 |
| Con el 50% a domicilio (promedio base), antes de pasarela | **$4,81** | $5,21 |
| Con el 50% a domicilio y 1% de pasarela | **$4,72** | $5,12 |

El sobre se paga solo en cualquier combinación de estos números. Ni el frasco a $2,00 ni el envío a $2,50 lo pasan a pérdida. Esto cambia lo que decía el borrador anterior, cuando el frasco se supuso a $2,70 y la importación a 35% sobre todo.

**Lectura:** el sobre de $9 deja entre $3,56 y $6,06 antes de mirar un solo filtro. Con 150 sobres por tienda al mes eso son $530 a $910, que casi paga solo el almacenista ($360) más la parte del responsable de logística.

---

## 2. Filtro, cartuchos y plomero

**Precios de referencia de mercado (Oasis, tienda en línea Mundo JAB; no son precios de Grimuca):**

| Producto | Precio de referencia | Margen de Grimuca (Tulio) | Margen en dólares |
|---|---|---|---|
| Filtro de ultrafiltración de 6 etapas | $119,99 | 20% | **$24,00** |
| Filtro de ósmosis de 8 etapas | $329,99 | 20% | **$66,00** |
| Kit de 3 cartuchos | $18,99 | 50% | **$9,50** |
| Instalación por plomero | $40 a $60 (Tulio) | 30% | $12 a $18 |
| Cambio de cartucho por plomero | $30 (Tulio) | 30% | $9 |

Notas:

- Tulio calcula el margen **sobre estos precios de referencia**. Pero dijo que Grimuca vende **más barato que la competencia**. Si el precio de venta baja 10% bajo la referencia y el costo no cambia, el margen de $24 baja a unos $12 (la mitad). **Pendiente: precios internos de Grimuca (costo y precio de venta).**
- El kit de $18,99 es de referencia. Las membranas de ósmosis cuestan más ($30 a $76 en el catálogo que Tulio describió), así que para ósmosis el margen de cartuchos probablemente es mayor, pero el precio por juego es otro. Se usa $18,99 para todo hasta tener el catálogo completo.
- Catálogo (Tulio): 64 referencias; rangos de ósmosis $175 a $390, ultrafiltración bajo fregadero $112 a $176, cartuchos $2,70 a $76. El archivo completo no ha llegado.
- Proveedor: Oasis. No se usa la línea Aqual.
- **Margen y frecuencia reales del cartucho (50% y 3 meses) están por confirmar** (Tulio).

---

## 3. Embudo por cada 100 sobres, y el segundo mercado

| De cada 100 sobres (Tulio) | Hogares | Qué compran | Margen de Grimuca (referencia) |
|---|---|---|---|
| Compran filtro | 10 | Filtro (queda con cartuchos puestos), instalación con plomero | $24 a $66 + $12 a $18 de plomero |
| Ya tienen filtro | 30 | Cartuchos (la app dice cuál y cuándo) | $9,50 por juego, y vuelven cada 3 meses |
| Solo se informan | 60 | Nada | $0 (el sobre ya se pagó solo) |

**Segundo mercado (Tulio):** los hogares que ya tienen filtro y no saben cuándo cambiarlo ni qué cartucho comprar. La app les avisa el recambio y el cartucho correcto. En el modelo son los **30 de cada 100**. Es el supuesto de Tulio más importante y el menos probado: nadie ha vendido este sobre todavía. **El piloto lo mide** (sección 9).

**Captación:** 150 hogares al mes por tienda (Tulio), unos 5 por día de atención (26 días). Cada hogar captado compra un sobre.

**Meta de hogares que actúan:** 15 filtros + 45 que compran cartuchos = **60 hogares nuevos por tienda al mes** con compra (no 60 filtros).

**Canales (Tulio):** mostrador de Mañongo y San Diego, a domicilio, y mostradores de farmacias y supermercados aliados. Cliente ideal: madres y padres de clase media y media alta en Valencia, preocupados por el agua que toman sus hijos.

---

## 4. Verificación de las cuentas de Tulio

Tomé sus datos y rehice cada número. Casi todo cuadra; va lo que no.

**Cálculos de Tulio, por tienda al mes, con 150 hogares captados:**

| Concepto | Tulio | Mi cálculo con sus datos | Cuadra |
|---|---|---|---|
| Sobres | ~$1.050 | Ingreso: 150 × $9 = **$1.350**. Margen: 150 × ($9 − ~$2 de fábrica) = ~$1.050 | Sí, **pero $1.050 es margen sin envío ni importación, no ingreso**. El ingreso es $1.350 |
| Filtros | $360 a $990 | 10% de 150 = **15 filtros** × $24 (ultrafiltración) = $360 · 15 × $66 (ósmosis) = $990 | Sí. Son 15 filtros por tienda al mes, no 60 |
| Cartuchos | ~$427 | 30% de 150 = 45 hogares × $9,50 (50% de $18,99) = **$427** | Sí |
| Plomero | $180 a $270 | 15 instalaciones × ($40 a $60 × 30%) = 15 × $12 = $180 · 15 × $18 = $270 | Sí |
| Suma antes del almacenista | no la dice | $1.050 + $360 + $427 + $180 = **$2.017** · $1.050 + $990 + $427 + $270 = **$2.737** | |
| Descontado el almacenista ($360) | $1.650 a $2.450 | **$1.657 a $2.377** | **Extremo bajo cuadra. El alto no: $2.450 pide $73 más** |

**Al mes 12 (Tulio):**

| Cifra de Tulio | Mi cálculo | Cuadra |
|---|---|---|
| ~720 hogares con filtro por tienda | 60 hogares nuevos al mes × 12 = **720**. Pero son 180 que **compraron filtro a Grimuca** (15 × 12) y **540 que ya tenían filtro** (45 × 12) | Sí, **si "con filtro" incluye al 30% que ya lo tenía**. Conviene decirlo así. Con el arranque gradual (40%, 60%, 80% en los meses 1 a 3), son **648** por tienda |
| ~240 cambios al mes | 720 hogares ÷ cambio cada 3 meses = **240** | Sí, es el promedio de largo plazo con **cero abandono**. Mes a mes, el mes 12 trae 180 recambios de cohortes anteriores más 45 primeras compras = **225** (o 213 con el arranque gradual) |
| ~$2.280 de margen mensual por tienda | 240 × $9,50 = **$2.280** | Sí. Pero es **solo el margen de cartuchos**. Con 213 a 225 cambios serían **$2.020 a $2.140** |
| ~$6.840 las 3 tiendas | 3 × $2.280 = $6.840 | Sí |
| Piloto: $9.000 en ventas contra $1.540 a $2.040 de costo | 1.000 × $9 = $9.000. Costo en fábrica: 1.000 unidades caen en el escalón de 500 a 1.999 ($1,90 + $0,04) = **$1.940** | $9.000 sí. **$1.540 solo se alcanza con 2.000 unidades o más; en 1.000 el costo es $1.940** |
| 450 hogares al mes: se vende en unos dos meses | 1.000 ÷ 450 = **2,2 meses** | Sí, si se capta 150 por tienda desde el primer día. Con arranque gradual es en el mes 4 |

**Tres diferencias que importan:**

1. **El $1.050 de los sobres es margen, no ingreso**, y es antes de envío, importación y empaque. Mi cuenta con esos costos (SUPUESTO) lo baja a unos $710 por tienda.
2. **El extremo alto, $2.450, debería ser $2.377** con sus propios números. Diferencia de $73, sin consecuencia grande, pero conviene corregirlo antes de presentarlo.
3. **Los $2.280 al mes 12 suponen que nadie deja de comprar cartuchos.** Es el supuesto más fuerte del modelo. Si la mitad abandona el cambio de cartucho, son $1.140, y el mes 12 deja de ser el motor.

**Lo que Tulio no había restado y yo sí (SUPUESTO, por tienda al mes):**

| Concepto | Monto | Origen |
|---|---|---|
| Importación y empaque | −$150 (150 × $1,00) | SUPUESTO |
| Envío (50% de 150 a $2,50) | −$188 | SUPUESTO |
| Pasarela (1% de ventas de $4.000 a $7.150) | −$40 a −$72 | SUPUESTO |
| Responsable de logística ($400 al mes entre 3 tiendas) | −$133 | SUPUESTO |
| **Resultado primer mes, por tienda** | **$1.147 a $1.835** (contra $1.657 a $2.377 de Tulio) | |

Si todos los sobres fueran a domicilio, el envío es −$375 y el rango baja a **$960 a $1.650**.

---

## 5. Punto de equilibrio por tienda

**Costos fijos por tienda al mes:** almacenista **$360** (Tulio) + responsable de logística **$133** (SUPUESTO: $400 al mes entre las tres) = **$493**.

**Lo que deja cada sobre captado el primer mes** (sin contar recambios posteriores; SUPUESTO donde se indica):

| | Mezcla 70% ultrafiltración y 30% ósmosis (SUPUESTO) | Solo ultrafiltración | Conversión a la mitad, solo ultrafiltración |
|---|---|---|---|
| Sobre, margen (50% a domicilio) | $4,72 | $4,72 | $4,72 |
| Filtros, margen incluye comisión de plomero | $4,98 | $3,78 | $1,89 |
| Cartuchos primeros | $2,79 | $2,79 | $1,40 |
| **Por sobre captado** | **$12,49** | **$11,29** | **$8,01** |
| **Sobres al mes por tienda para cubrir $493** | **40** | **44** | **62** |
| Hogares por día (26 días) | 1,5 | 1,7 | 2,4 |

- **Solo el sobre**, sin filtros ni cartuchos, cubre los $493 con **105 sobres por tienda al mes** (4 por día).
- La meta de Tulio, **150 hogares**, es más de tres veces el punto de equilibrio. Esa holgura es la que protege al modelo.
- Los recambios (cada 3 meses) bajan el equilibrio con el tiempo: cada hogar captado vuelve cuatro veces por año.

---

## 6. Escenarios y qué variable tumba el modelo

**Tres escenarios, las 3 tiendas, 12 meses** (flujo mes a mes en la sección 7):

| | **Base (cifras de Tulio)** | **Conservador (mitad de captación y de conversión)** |
|---|---|---|
| Hogares captados por tienda al mes | 150 | 75 |
| De cada 100 sobres | 10 filtro · 30 cartuchos · 60 informan | 5 filtro · 15 cartuchos · 80 informan |
| Tipo de filtro | 70% ultrafiltración, 30% ósmosis (SUPUESTO) | 100% ultrafiltración |
| Abandono de cambio de cartucho | 0% (Tulio) | 0% |
| Sobres vendidos en el año | 4.860 | 2.430 |
| Filtros vendidos | 486 | 122 |
| Juegos de cartuchos vendidos | 4.050 | 1.013 |
| Ventas del año | $216.900 | $57.500 |
| Egresos del año (sin inversión ni lote) | $146.900 | $46.800 |
| **Resultado del año 1** | **+$70.000** | **+$10.700** |
| Caja al cierre (tras $4.440 de inversión y lote) | **+$65.500** | **+$6.200** |
| Hueco máximo de caja | −$4.440 (mes 0) | −$4.940 (mes 2) |
| Caja positiva desde el mes | **3** | **8** |
| Neto mensual al mes 12 (3 tiendas) | +$8.830 | +$1.490 |

"Ventas" suma el precio completo de los filtros y de los cartuchos más la comisión de plomero. "Egresos" incluye el costo de filtros y cartuchos (80% y 50% del precio de referencia), sobres, envío, pasarela y fijos.

**¿Qué variable tumba el modelo?** Probé una por una, contra el base y contra el conservador:

| Cambio | Caja al cierre, base | Caja al cierre, conservador |
|---|---|---|
| Tal cual | $65.500 | $6.200 |
| Todos los sobres a domicilio ($2,50) | $59.500 | $3.200 |
| Precio del filtro 10% bajo la referencia | $56.700 | $4.800 |
| Cero recambios después del primero (abandono total) | $41.400 | $200 |
| Nadie de los "ya tienen filtro" compra cartuchos | $33.900 | −$1.700 |
| Conversión a la mitad | $34.600 | (ya incluida) |
| **Captación a la mitad (75 por tienda)** | **$23.100** | (ya incluida) |
| Captación de 50 por tienda | $9.000 | −$2.300 |
| Captación de 30 por tienda | −$2.400 | −$9.100 |

**Conclusión:** ninguna variable sola tumba el base. El modelo se rompe por la **captación**: con la conversión de Tulio, la caja del año 1 cierra en cero con unos **34 hogares al mes por tienda**; con la mitad de conversión, con unos **57**. La meta es 150. Después viene la combinación **conversión baja + abandono del recambio**, que deja el conservador en cero. Por eso el piloto debe medir **cuántos hogares por tienda y cuántos de cada 100 compran qué**.

**No incluido (SUPUESTO que no tiene dato):** publicidad. Tulio no dio presupuesto; la captación es por QR, mostrador y aliados. Si se pagara $1,50 por sobre vendido, el año 1 base cuesta $7.300 más y sigue positivo. Ese $1,50 es optimista. A partir de los planes de medios del curso del asesor (casos de otros rubros, no Valencia; ver `auditoria-asesor.md`), Business estima $3,50 a $5,50 por sobre vendido. Con $4,00 en todos los sobres, el año 1 base cuesta $19.400 más y cierra con $46.100 de caja; el conservador cuesta $9.700 más y cierra en −$3.500. El tope sano es 20% a 30% del ticket: $1,80 a $2,70 por sobre.

---

## 7. Flujo de caja a 12 meses · las 3 tiendas

Supuestos del flujo (SUPUESTO salvo donde dice Tulio):

- Arranque gradual: 40%, 60% y 80% de la captación en los meses 1, 2 y 3; 100% desde el mes 4.
- Mes 0: inversión inicial $1.500 (video, impresos, capacitación) más el lote del piloto, 1.000 sobres pagados por adelantado a $1,94 + $1,00 = **$2.940**.
- Hogares que ya tienen filtro: compran un juego al captarlos y luego cada 3 meses (Tulio). Hogares que compran filtro: primer cambio 3 meses después.
- Fijos (3 tiendas): 3 almacenistas × $360 (Tulio) + $400 de responsable de logística (SUPUESTO) = $1.480 al mes.
- No se cuentan IVA, devoluciones, inventario de filtros y cartuchos comprado por adelantado ni plazos de cobro.

### Escenario base (cifras de Tulio)

| Mes | Sobres | Filtros | Juegos de cartuchos | Ventas | Egresos | Neto | Caja acumulada |
|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 |
| 1 | 180 | 18 | 54 | $6.209 | $4.912 | +$1.297 | −$3.143 |
| 2 | 270 | 27 | 81 | $9.314 | $6.628 | +$2.686 | −$457 |
| 3 | 360 | 36 | 108 | $12.419 | $8.344 | +$4.074 | +$3.617 |
| 4 | 450 | 45 | 207 | $16.890 | $11.522 | +$5.368 | +$8.985 |
| 5 | 450 | 45 | 243 | $17.574 | $12.429 | +$5.145 | +$14.130 |
| 6 | 450 | 45 | 279 | $18.258 | $12.778 | +$5.480 | +$19.610 |
| 7 | 450 | 45 | 387 | $20.309 | $13.824 | +$6.485 | +$26.094 |
| 8 | 450 | 45 | 423 | $20.992 | $14.173 | +$6.820 | +$32.914 |
| 9 | 450 | 45 | 459 | $21.676 | $14.521 | +$7.155 | +$40.069 |
| 10 | 450 | 45 | 567 | $23.727 | $15.567 | +$8.160 | +$48.228 |
| 11 | 450 | 45 | 603 | $24.411 | $15.916 | +$8.495 | +$56.723 |
| 12 | 450 | 45 | 639 | $25.094 | $16.265 | +$8.830 | +$65.552 |

Los cartuchos suben cada trimestre porque cada cohorte vuelve a cambiar. Por eso el neto crece aunque los sobres no.

### Escenario conservador (mitad de captación y de conversión)

| Mes | Sobres | Filtros | Juegos de cartuchos | Ventas | Egresos | Neto | Caja acumulada |
|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 |
| 1 | 90 | 5 | 14 | $1.674 | $2.169 | −$495 | −$4.935 |
| 2 | 135 | 7 | 20 | $2.511 | $2.513 | −$2 | −$4.937 |
| 3 | 180 | 9 | 27 | $3.348 | $2.857 | +$490 | −$4.447 |
| 4 | 225 | 11 | 52 | $4.526 | $3.376 | +$1.150 | −$3.297 |
| 5 | 225 | 11 | 61 | $4.697 | $3.463 | +$1.234 | −$2.063 |
| 6 | 225 | 11 | 70 | $4.868 | $3.786 | +$1.083 | −$980 |
| 7 | 225 | 11 | 97 | $5.381 | $4.473 | +$907 | −$73 |
| 8 | 225 | 11 | 106 | $5.552 | $4.561 | +$991 | +$919 |
| 9 | 225 | 11 | 115 | $5.723 | $4.648 | +$1.075 | +$1.994 |
| 10 | 225 | 11 | 142 | $6.235 | $4.909 | +$1.326 | +$3.320 |
| 11 | 225 | 11 | 151 | $6.406 | $4.996 | +$1.410 | +$4.730 |
| 12 | 225 | 11 | 160 | $6.577 | $5.084 | +$1.494 | +$6.223 |

**Lectura honesta:** con las cifras de Tulio el modelo gana dinero desde el mes 1 y la caja es positiva en el mes 3. Eso depende de tres cosas que nadie ha probado todavía: 150 hogares por tienda al mes, que 3 de cada 10 ya tengan filtro y compren cartuchos, y que los hogares sigan cambiando cada 3 meses. Con la mitad de todo sigue en positivo, pero delgado (mes 8). Los números son una hipótesis para el piloto, no un resultado.

---

## 8. Botellón contra filtro (estimación de Tulio)

**Consumo y precio del botellón (estimación de Tulio, no hay medición):**

- 5 a 6 botellones por quincena = **10 a 12 al mes**.
- Unos **$2 cada uno**, hasta **$4 con delivery**.
- Gasto: **$20 a $24 al mes** (a $2) o **$40 a $48 al mes** (a $4). Al año, **$240 a $288 sin delivery y $480 a $576 con delivery.** Tulio dice "hasta $576 al año": cuadra (12 al mes × $4 × 12 meses).
- Contexto público: la recarga de 20 L en Venezuela se reportó entre $0,50 y $2,50 (Bloomberg Línea, 2022), y de $0,50 a $1,10 en Caracas (El Diario, 2024). Los $2 de Tulio caen dentro de ese rango; los $4 con delivery quedan por encima de lo publicado, así que son su estimación.

**Costo de la alternativa (precios de referencia de mercado, no de Grimuca; SUPUESTO la instalación en $50):**

| | Ultrafiltración 6 etapas | Ósmosis 8 etapas |
|---|---|---|
| Sobre | $9,00 | $9,00 |
| Filtro (referencia) | $119,99 | $329,99 |
| Instalación con plomero (promedio) | $50 | $50 |
| 3 juegos de cartuchos en el año (meses 3, 6 y 9) | $56,97 | $56,97 |
| **Primer año** | **$235,96** | **$445,96** |
| Segundo año: 4 juegos de cartuchos | $75,96 | $75,96 |

El filtro trae sus primeros cartuchos. Para ósmosis el precio del juego es otro; se usa $18,99 hasta tener catálogo. Si el hogar hace el cambio solo, con el video de la app, no paga plomero; si lo pide, son $30 cada vez.

**Comparación, familia con 10 a 12 botellones al mes:**

| Botellón al año | Ultrafiltración, año 1 | Ahorro año 1 | Ahorro año 2 |
|---|---|---|---|
| $240 ($20 al mes, 10 a $2) | $236 | $4 | $164 |
| $288 ($24 al mes, 12 a $2) | $236 | $52 | $212 |
| $480 ($40 al mes, 10 a $4 con delivery) | $236 | $244 | $404 |
| $576 ($48 al mes, 12 a $4 con delivery) | $236 | $340 | $500 |

Con ósmosis ($446 el primer año) el ahorro del primer año es $34 a $130 solo si se compara contra delivery; contra recarga sin delivery, **no se paga el primer año**.

**En cuánto tiempo se paga** (inversión de sobre + filtro + plomero de $50; luego $6,33 al mes de cartuchos, que es $18,99 cada 3 meses):

| Botellón al mes | Ultrafiltración | Ósmosis |
|---|---|---|
| $20 | 13 meses | 28 meses |
| $24 | 10 meses | 22 meses |
| $40 (con delivery) | 5 meses | 12 meses |
| $48 (con delivery) | 4 meses | 9 meses |

**Lo que dice la tabla:**

- Para quien ya paga delivery, el filtro de ultrafiltración se paga en 4 a 5 meses.
- Para quien busca su recarga a $2, se paga en 10 a 13 meses y el argumento deja de ser solo dinero: es **menos botellones**, menos carga y saber cuándo cambiar el cartucho.
- El filtro necesita agua en el grifo o tanque. Donde no llega agua, no reemplaza el suministro.
- Grimuca vende más barato que la referencia (Tulio): estas cifras son un techo para el costo del hogar.
- La comparación es de costo y de carga. Ni el sobre ni el filtro certifican el agua.

---

## 9. Piloto de 1.000 sobres

| | Cifra | Origen |
|---|---|---|
| Sobres | 1.000 | Tulio |
| Ventas | $9.000 | Tulio |
| Costo en fábrica | **$1.940** (escalón de 500 a 1.999: $1,94). A $1,54 solo desde 2.000 | Tulio (precios), cuenta de Business |
| Importación y empaque | $1.000 | SUPUESTO |
| Lote pagado por adelantado | **$2.940** | |
| Margen antes de envío y fijos | $6.060 | |
| Envío si el 50% va a domicilio | −$1.250 | SUPUESTO |
| Hogares que debería traer | ~100 compran filtro, ~300 compran cartuchos, ~600 se informan | Tulio |
| Tiempo para venderlo | 2,2 meses con 450 hogares al mes; mes 4 con arranque gradual | Tulio, cuenta de Business |

**El piloto es la prueba del modelo.** Al terminar se sabe: cuántos de cada 100 compran filtro, cuántos ya tenían, cuántos hogares reales llegan por tienda al mes, qué porcentaje pide domicilio y cuánto cuesta el envío de verdad. Con eso se corrigen las 5 cifras que más mueven la caja.

**Capital de trabajo que el flujo no cuenta (inferencia de Business, ver `auditoria-asesor.md`):** el hueco de caja de $4.440 a $4.940 no incluye inventario de filtros ni de cartuchos. Si se compraran por adelantado los ~100 filtros y ~300 juegos de cartuchos que debería traer el piloto, a 80% y 50% del precio de referencia, la caja que hay que tener lista sube a unos $15.000 (todo ultrafiltración) o $20.000 (mezcla 70/30). Para el piloto se propone vender el filtro contra anticipo del cliente y comprarlo a Oasis al recibirlo, y mantener solo unas dos semanas de cartuchos.

---

## KPI del piloto

Seis indicadores, medidos cada semana con una reunión de 30 minutos. Los porcentajes se calculan sobre sobres vendidos, como los cuenta Tulio (de cada 100). Origen de las metas: **Tulio** donde dice Tulio; **SUPUESTO** donde es de Business y se recalibra con los primeros 100 sobres. Un porcentaje con menos de 30 sobres detrás no se interpreta.

| KPI | Cómo se mide con lo que la app ya registra | Meta | Umbral de alarma |
|---|---|---|---|
| **1. Sobres por tienda por semana** (variable que tumba el modelo) | `pedidos` con tipo sobre, por `tienda_id` y `fecha`. Se lleva con desviación productiva: meta semanal 35, el déficit pasa a la semana siguiente | 35 por semana, 150 al mes (Tulio) | Menos de 20 durante dos semanas seguidas (cerca del equilibrio de 62 a 68 al mes) |
| **2. Conversión sobre→filtro** | Hogares con un pedido de filtro dentro de 30 días de su primera `medicion` ÷ sobres vendidos. Hoy `pedidos.tipo` solo tiene sobre y cartucho: en el piloto se anota el filtro en hoja con `hogar_id` | 10 de cada 100 (Tulio) | Menos de 5 (la conversión a la mitad lleva el equilibrio a 62) |
| **3. Conversión sobre→cartucho** | Hogares con pedido de cartucho dentro de 30 días de su primera `medicion` ÷ sobres vendidos. Se separa por `origen_agua` y `tipo_filtro` para ver si los que ya tienen filtro son 30 de cada 100 | 30 de cada 100 (Tulio) | Menos de 15 (si nadie compra, la caja base baja de $65.500 a $33.900) |
| **4. Tasa de recambio a 90 días** | De los hogares con compra de cartucho o filtro hace 90 a 105 días, los que repiten pedido de cartucho dentro de ese plazo. La primera lectura completa llega en el mes 4; antes se usa `fecha_ultimo_cambio` de los hogares que ya tenían filtro | 70% (SUPUESTO; el modelo de Tulio usa 100%) | Menos de 50% (la caja base baja a unos $53.400) |
| **5. Costo por sobre vendido, por canal** | (comisión del aliado + gasto en anuncios + incentivos del canal) ÷ sobres del canal. Pide un campo `canal` en el hogar, con un QR distinto por mostrador, farmacia, supermercado, lista de clientes por WhatsApp y anuncio | $1,80 o menos (20% de $9) | Más de $2,70 (30% de $9): se pausa el canal |
| **6. Margen por tienda** | Ventas (`pedidos` × `cartuchos.precio_usd` y precios de filtro) − costo de lo vendido − envío − pasarela − captación − $493 de fijos | $1.150 o más al mes con 150 sobres (modelo, primer mes) | Negativo después del mes 3 |

**Dato de apoyo, fuera de los seis:** activación = hogares con `medicion` dentro de 7 días del despacho del sobre ÷ sobres despachados. Meta 80% y alarma 60% (SUPUESTO). Un sobre sin medición no puede convertir, así que este número explica por qué fallan los KPI 2 y 3.

**Faltan en los datos de la app:** el campo `canal` del hogar, el tipo filtro en `pedidos` y el monto de cada pedido. Mientras no estén, se llevan en una hoja con `hogar_id` y no se espera a la app.

**Regla de decisión al cerrar el piloto (SUPUESTO):** si los KPI 1, 2 y 3 están en meta, se compra el siguiente lote y se abre publicidad pagada con tope de $2,70 por sobre. Si falla uno, se corrige ese canal u oferta y se repite con 300 sobres. Si fallan el 1 y el 3 a la vez, no se compra más inventario.

---

## Experimentos del piloto

Tres pruebas que cuestan tiempo del almacenista y no dinero (la prueba de anuncios tiene un tope de $100). Cada una tiene su criterio antes de empezar.

| Experimento | Qué se compara | Cómo se corre | Criterio de éxito |
|---|---|---|---|
| **1. Precio visible contra "Cotizar por WhatsApp"** | Tarjeta de cartuchos con precio y botón de pedir, contra la tarjeta que pide escribir por WhatsApp para cotizar | Semanas alternas en las tres tiendas durante tres semanas, para que no pese la tienda. Se mide pedidos de cartucho ÷ hogares con producto sugerido. La exhibición de precios en divisas se confirma antes con el abogado (`puede-y-no-puede-decir.md`, reglas para publicidad) | Precio visible logra 1,3 veces o más los pedidos de la otra versión, con al menos 60 hogares en cada una. Si hay menos, no se concluye |
| **2. Costo por sobre en cuatro canales** | Mostrador con QR, farmacia o supermercado aliado, mensaje a la lista de clientes de Grimuca por WhatsApp, y un anuncio de prueba con tope de $100 | Tres semanas, un QR distinto por canal. Se anota la comisión pactada, el gasto del anuncio y las horas | Al menos dos canales con costo de $2,70 o menos por sobre y 10 o más sobres por semana. El anuncio solo se escala si vende 37 sobres o más con sus $100 (CAC de $2,70) |
| **3. Recambio con recordatorio manual** | Mensaje A: recordatorio con foto del cartucho y precio. Mensaje B: lo mismo más plan anual de 4 juegos prepagados con 10% de descuento ($68,36 contra $75,96; deja $30,38 de margen contra $37,98) | El almacenista escribe por WhatsApp a los hogares cuya `fecha_ultimo_cambio` supera 90 días (no hay que esperar tres meses), mitad con cada mensaje, y vuelve a escribir a los 2 días con un dato nuevo | A: 25% o más compra dentro de 14 días. B: 10% o más toma el plan. Si ninguno llega, el recordatorio por sí solo no sostiene el mes 12 del modelo |

---

## 10. Por qué esto es logística

**La idea:** hoy el agua de tomar viaja todas las quincenas en botellones. Con el filtro, lo que viaja es un cartucho cada 3 meses, cuando la medición y el calendario lo piden.

**Pesos (SUPUESTO, se confirman pesando):** botellón de 19 L lleno 19,75 kg (19 kg de agua más ~0,75 kg de envase); juego de 3 cartuchos 0,9 kg; sobre 60 g; filtro en su caja 3 kg.

### Un hogar, un año (botellón según la estimación de Tulio)

| | Botellón | Filtro, año 1 | Filtro, año 2 en adelante |
|---|---|---|---|
| Qué se mueve | 120 a 144 botellones llenos (5 a 6 por quincena) | 1 sobre, 1 filtro, 3 juegos de cartuchos | 4 juegos de cartuchos |
| Kilos | **2.370 a 2.844 kg** | **5,8 kg** | **3,6 kg** |
| Viajes | **24** (uno por quincena, cargando 99 a 118 kg cada vez) | **5** (sobre, filtro y 3 recambios) | **4** (uno por recambio) |
| Cuándo | Todas las quincenas, haga falta o no | Cuando toca el cartucho | Cuando toca el cartucho |

Reducción de kilos: **99,8%**. Reducción de viajes: **79%** el primer año y **83%** desde el segundo.

### 1.000 hogares

| | Botellón | Filtro + cartuchos, año 1 | Filtro, año 2 en adelante |
|---|---|---|---|
| Kilos al año | 2.370 a 2.844 toneladas | 5,8 toneladas | 3,6 toneladas |
| Viajes al año | 24.000 | 5.000 | 4.000 |
| Kilos por semana | 46 a 55 toneladas | 111 kg | 69 kg |

### Lo que mueve Grimuca (escenario base, año 1)

- 4.860 sobres (292 kg), 486 filtros (1.458 kg) y 4.050 juegos de cartuchos (3.645 kg): **5,4 toneladas en todo el año**, entre las 3 tiendas.
- Si los 486 hogares que compran filtro dejaran el botellón (SUPUESTO; si la mitad, la mitad), dejarían de moverse **1.150 a 1.380 toneladas** de agua en botellón.
- Al mes 12: 450 sobres, 45 filtros y 639 juegos de cartuchos: unos **740 kg al mes**, 250 kg por tienda. Cabe en un estante. Son unos **8 despachos de cartuchos por tienda por día**.

**Aclaratoria:** Grimuca no reparte botellones hoy. El ahorro de kilos y viajes es del hogar y de la ciudad, no un costo que Grimuca se quite. Lo que Grimuca resuelve:

- **Las 3 tiendas son los almacenes de despacho.** No hace falta galpón ni flota.
- **Demanda prevista.** Cada medición y cada fecha de último cambio dicen cuándo toca el próximo recambio; el operador compra solo lo que va a salir.
- **Envíos agrupados.** El delivery de última milla recoge por zona; si varios hogares cambian cartucho la misma semana, sale una ruta.
- **Retiro en tienda** para filtro y cartuchos (Tulio): el cliente decide.

---

## 11. Aliados y equipo mínimo

**Aliados (Tulio):**

| Aliado | Para qué | Pendiente |
|---|---|---|
| SAMA Logística 3 (Valencia) | Última milla, rastreo, cobro contra entrega, mismo día | **Tarifa** y cobertura en Naguanagua y San Diego |
| Cobrix | Pasarela: links de pago con Pago Móvil, transferencia, Zelle y Binance Pay | **Costos** |
| Oasis | Proveedor de filtros y cartuchos | Precios internos de Grimuca |
| Plomeros o técnicos | Instalación y cambio de cartucho; Grimuca se queda con el 30% | Quién y cómo se contacta |
| Farmacias y supermercados aliados | Mostrador para vender el sobre | Condiciones |

**Equipo mínimo (Tulio):** un **responsable de logística** + un **almacenista por tienda** ($360 al mes cada uno) + el delivery. El costo del responsable ($400 al mes entre las tres) es SUPUESTO.

**Tiendas (grimuca.com):** Mañongo (Naguanagua), Big Low (San Diego) y CC CEM (San Diego). Horario lunes a viernes 8:30 a.m. a 4:30 p.m., sábados 9:00 a.m. a 2:00 p.m. WhatsApp compartido: +58 414-4409396.

**Fuera del hackatón:** el WhatsApp posterior a la compra (recordatorio, sugerencia y pago). En la demo el recordatorio va dentro de la app y el bot se presenta como siguiente paso. En la app, el video de cambio de cartucho y el módulo opcional de plomero son deseados.

---

## 12. Potencial en Latinoamérica

| Dato | Cifra | Fuente |
|---|---|---|
| Venezuela: hogares | ~9 millones, 3,1 personas en promedio | ENCOVI 2025 (UCAB, may 2026) |
| Venezuela: reciben agua todos los días | 27% | OVSP, citado por El Diario, abr 2022 |
| Venezuela: dicen que el agua llega con mal olor o color | 47% | OVSP, citado por El Diario, abr 2022 |
| Valencia | Ciudad donde más se compra agua embotellada, según el OVSP | El Diario, abr 2022 |
| México: hogares que compran agua embotellada | 98%, 51 compras al año; el garrafón es 98% del volumen | Kantar Worldpanel, datos 2017 |
| República Dominicana: hogares con agua de botellón | 84,3% | ONE, Censo 2022, vía Revista Mercado, ago 2026 |
| Mercado de purificadores en Latinoamérica | $2.500 millones en 2025, crece 6,7% al año | Global Market Insights |

Recarga de 20 L por país (Bloomberg Línea, oct 2022): Venezuela $0,50 a $2,50; República Dominicana $0,66 a $1,60; México $2,30 a $2,50; Argentina $4,14; Perú $5,00; Panamá ~$5,50. Donde la recarga es más cara, el filtro se paga más rápido.

**Por qué se repite en otra ciudad:** la tira cuesta centavos y viaja en un sobre; la app lee la foto, recomienda el cartucho y arma el despacho; el almacén es una tienda que ya existe; lo que cambia por país es el catálogo y la tabla de la tira, ambos configurables.

---

## 13. Riesgos

| Riesgo | Qué pasa | Qué se hace |
|---|---|---|
| Captación menor a ~34 a 57 hogares por tienda al mes | La caja del año 1 no cierra | El piloto de 1.000 sobres lo mide; ajustar canales antes de más inventario |
| Los "30 que ya tienen filtro" resultan menos | Se pierde el motor de cartuchos | Medir en el mostrador; ofrecer el recordatorio de cambio también a clientes que ya tiene Grimuca |
| Abandono del cambio cada 3 meses | Los $2.280 del mes 12 bajan | Recordatorio en la app, kit con descuento si se paga por adelantado |
| Precio del filtro por debajo de la referencia | El margen de 20% baja con el precio | Confirmar costo y precio interno antes de fijar la oferta |
| Envío más caro que $2,50 | Se come el margen del sobre | Retiro en tienda como opción principal |
| La tira se lee mal o llega dañada | Reposición | Foto junto a la tabla; carga manual; sobre sellado |
| Afirmaciones de salud | Riesgo legal y de confianza | La app no certifica el agua; aviso fijo: "no certifica que el agua sea apta para tomar"; plomo, cobre y bacterias se confirman con laboratorio |
| Permisos para importar y vender pruebas de agua | Sin fuente verificada | Confirmar con abogado (lo lleva el Asesor legal) |

---

## 14. Pendientes de Tulio, en orden de peso

1. **Tarifa de envío** de SAMA Logística 3 y cobertura en Naguanagua y San Diego. (SUPUESTO $2,50.)
2. **Costos de la pasarela** (Cobrix). (SUPUESTO 2% sobre lo pagado en la app.)
3. **Importación y empaque.** (SUPUESTO $1,00 por sobre.)
4. **Precios internos de Grimuca:** costo y precio de venta de filtros y cartuchos; y confirmar el 50% de margen y los 3 meses del cartucho.
5. **Archivo completo del catálogo con precios** (64 referencias).
6. **Tira física e instrucciones del frasco.**
7. Si los **$1.050** de sobres son margen (como indica la cuenta) y de dónde sale el **$2.450** (la suma da $2.377).
8. Si "720 hogares con filtro" incluye al 30% que ya tenía filtro (así cuadra).
9. Cuántos sobres van a domicilio y cuántos se retiran.
10. Cuántos clientes entran por día a cada tienda (para ver si 5 sobres por día de atención es razonable).
11. Qué comisión cobrarían farmacias y supermercados aliados por vender el sobre (hoy no está en ningún costo).
12. Cada cuánto se cambia cada etapa del filtro según Oasis; el modelo supone 3 meses para todo el juego, y las membranas de ósmosis suelen durar más.

---

## 15. Fuentes

Documentos del equipo:

- Correos de Tulio, sáb 21 nov, 8:38, 8:49 y 8:52 p.m.: `insumos-tulio/2026-11-21_2052_modelo-tiendas-lema-y-cifras.md`.
- Correo de Tulio, 8:12 p.m.: `insumos-tulio/2026-11-21_2012_producto-y-onboarding.md`.
- `HANDOFF-hackaton.md`, secciones 2 y 3.

Precios de referencia (consultados por Tulio; no son precios de Grimuca): Oasis en Mundo JAB (ultrafiltración de 6 etapas $119,99; ósmosis de 8 etapas $329,99; kit de 3 cartuchos $18,99). Frasco y tira: Shenzhen Hongyi y HORYZON, en Alibaba.

Fuentes públicas (consultadas el 21 nov 2026):

- Recarga y botellón sellado en Caracas: [El Diario, 22 mar 2024](https://eldiario.com/2024/03/22/cuales-son-precios-tanques-botellones-cisternas-caracas/).
- Botellón de 20 L ($0,50 a $2,50) y precios por país: [Bloomberg Línea, 27 oct 2022](https://www.bloomberglinea.com/2022/10/27/el-agua-en-venezuela-es-realmente-una-de-las-mas-caras-de-la-region/).
- OVSP: [El Diario, 9 abr 2022](https://eldiario.com/2022/04/09/estados-acceso-agua-por-tuberias-en-venezuela/).
- ENCOVI 2025: [presentación UCAB, 7 may 2026 (PDF)](https://elucabista.com/wp-content/uploads/2023/01/ENCOVI-2025_presentacion_UCAB-07-05-2026.pdf), tomado del resumen del buscador.
- México: [Kantar Worldpanel, 20 mar 2018](https://www.kantar.com/latin-america/inspiracion/consumo-masivo/consumo-agua-embotellada).
- República Dominicana: [Revista Mercado, 19 ago 2026](https://revistamercado.do/money-invest/daily-news/el-pais-del-botellon-cuanto-gastan-las-familias-en-rd-al-comprar-el-agua-que-toman/).
- Purificadores en Latinoamérica: [Global Market Insights](https://www.gminsights.com/es/industry-analysis/latin-america-water-purifier-market).
- Prueba de bacterias al detal, Pro-Lab BA110 ($10,99 a $14,98): [Walmart](https://www.walmart.com/ip/Pro-Lab-Water-Bacteria-Test-Kit-BA110/21903076), tomado del resumen del buscador.

Sin fuente (SUPUESTO): importación y empaque, envío, parte a domicilio, mezcla de filtros, responsable de logística, pasarela, pesos de cartuchos y envases, precios y márgenes internos de Grimuca.
