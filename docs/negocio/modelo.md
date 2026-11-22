# Modelo de negocio · Grimuca Agua · red de ferreterías

**Versión 3 · sábado 21 nov 2026, noche · hackatón ValenValley, track Logística**
**Rehecho tras la decisión de Leonardo (10:00 p.m.) y dos asesorías con jurados.** Grimuca pasa de "la app de Grimuca" a una plataforma para ferreterías que Grimuca opera. La versión anterior, con las tres tiendas propias, quedó guardada en `modelo-v2-tres-tiendas.md` (cuentas de Tulio verificadas, KPI y experimentos del piloto, flujo de caja de las tres tiendas). Lo que sigue valiendo se conserva aquí de forma resumida.

**Lema del cliente final:** "Saber qué tomas empieza en casa".
**Frase para el lado empresa (propuesta):** "Clientes que llegan sabiendo qué necesitan".

## Cómo leer este documento

Cada cifra lleva su origen:

- **Tulio** = lo dijo él en sus correos (`insumos-tulio/`).
- **Asesoría** = se dijo en una de las dos asesorías con jurados. Sin documento detrás.
- **Referencia de mercado** = precio público de una tienda en línea. No es precio de Grimuca.
- **SUPUESTO** = lo puso Business para poder calcular. **Tulio lo corrige** (lista en la sección 12).
- **Cálculo** = cuenta de Business con las cifras anteriores.

Montos en dólares. Las cuentas se hicieron con todos los decimales. Nada de esto es una promesa sobre la calidad del agua: la app orienta con una medición casera y no certifica.

**Alcance:** esto es un negocio para ejecutar a largo plazo. Para el hackatón existe una demo con datos sembrados: los comercios de Lara y de Aragua son de demostración y están rotulados así; no hay ninguna ferretería aliada real todavía y la membresía no se cobra.

---

## 0. La cifra que no cuadra: el sobre, $2,94 contra $4,00

| | Versión A: modelo anterior | Versión B: dicho en la asesoría |
|---|---|---|
| Costo del sobre puesto en Venezuela | **$2,94** | **$4,00** |
| De dónde sale | Fábrica $1,94 (frasco $1,90 en el escalón de 500 a 1.999, más tira de $0,04; Tulio) + $1,00 de importación y empaque (SUPUESTO de Business) | Asesoría. No hay desglose |
| Margen del sobre de $9 a domicilio (envío $2,50 y pasarela $0,18, SUPUESTOS) | **$3,38** | **$2,38** |
| Margen del sobre de $9 con retiro en tienda | **$6,06** | **$5,00** |
| Margen del sobre al mayor a $5,50 (SUPUESTO), con $0,25 de flete al comercio | **$2,31** | **$1,25** |
| Lote de 1.000 sobres pagado por adelantado | $2.940 | $4.000 |

**Qué implica el $4.** Con el frasco a $2,00 y la tira a $0,04, el sobre sale a $2,04 en fábrica (Tulio, lote chico). Para llegar a $4,00 puesto en Venezuela, el flete, la aduana y el empaque tendrían que sumar $1,96 por sobre. Business había supuesto $1,00, con un rango de $0,60 a $1,50. El $4 queda fuera de ese rango, o incluye algo que el modelo anterior no contaba (envío dentro del país, IVA, comisión de un importador).

**Resultado del modelo con las dos versiones** (detalle en las secciones 5 a 8):

| Resultado | Con $2,94 | Con $4,00 |
|---|---|---|
| Aporte de la red por ferretería al mes, volumen completo, escenario base | **$144** | **$103** |
| Ferreterías que pagan para cubrir los fijos de la red, base | **4** | **5** |
| Caja de la red al cierre del año 1, base | **+$1.094** | **−$2.035** |
| Caja de la red al cierre del año 1, conservador | **−$7.203** | **−$8.263** |
| Hogares al mes por ferretería para que el año 1 cierre en cero, base | **35** | **55** |

**Pregunta para Leonardo:** ¿quién dio el $4,00, qué incluye (flete, aduana, empaque, envío nacional, IVA) y cuál de las dos cifras va en la lámina? Mientras no se decida, todo material público muestra el rango y el modelo se lee con las dos columnas.

---

## 1. El modelo en 10 líneas

1. **El cliente que paga es la ferretería.** La familia mide su agua con un sobre de **$9** (Tulio) y genera la señal: una medición con su perfil y la fecha del último cambio del cartucho.
2. **El sistema asigna cada familia al comercio más cercano que tiene el producto.** La ferretería recibe clientes ya medidos y con su necesidad identificada, y no vende filtros a ciegas.
3. **Tres líneas de ingreso para Grimuca como operador:** (1) el sobre de $9 al cliente final, (2) la membresía mensual de la ferretería, con 1 a 3 meses gratis de entrada, y (3) la venta de sobres al mayor a las ferreterías. Siguiente paso, fuera de la demo: comisión por transacción y plan premium con prioridad de asignación.
4. **Supuestos de precio (SUPUESTO):** membresía de **$30 al mes** (rango $20 a $50), sobre al mayor a **$5,50** (rango $5,00 a $6,00).
5. **Por cada ferretería a volumen completo, la red aporta $144 al mes con el sobre a $2,94 y $103 con el sobre a $4,00** (cálculo, escenario base).
6. **La ferretería recibe unos $280 al mes en margen de las 40 familias asignadas** (primer mes a volumen completo, cálculo con los márgenes de Tulio) y paga $30. Con 5 familias al mes recupera la membresía.
7. **Punto de equilibrio de la red: 4 a 5 ferreterías pagando** en el escenario base, 6 a 8 en el conservador (fijos de la red $450 al mes, SUPUESTO). Solo con membresía harían falta 15.
8. **Flujo de caja de la red a 12 meses:** base +$1.094 con el sobre a $2,94 y −$2.035 con $4,00; conservador −$7.203 y −$8.263. El año 1 es de inversión; el flujo mensual de la operación pasa a positivo en el mes 4 (base) o en el mes 11 (conservador).
9. **Lo que tumba el modelo** es el volumen de familias medidas que la red le entrega a cada ferretería: con 20 al mes en vez de 40, el año 1 base pasa de +$1.094 a −$3.105.
10. **Logística:** lo que deja de existir es el pedido sorpresa. Cada cartucho tiene fecha y referencia con semanas de anticipación, y de ahí salen tres ahorros (sección 3).

---

## 2. Quién paga y por qué pagaría

**Cliente 1, la familia.** Padres y madres de clase media y media alta de Valencia, preocupados por el agua que toman sus hijos (Tulio). Compra el sobre de $9 y aporta los datos. Es la entrada del negocio y no el lado grande del ingreso.

**Cliente 2, la ferretería.** Dueño de una ferretería o tienda de plomería con filtros y cartuchos en el mostrador. Es el cliente que paga todos los meses. Hoy vende filtros sin saber qué agua tiene la casa del comprador ni cuándo vuelve por el cartucho (Tulio: "nos preguntan todos los días si el filtro les sirve y cuándo cambiar el cartucho").

**Qué recibe la ferretería a cambio de la membresía:**

1. **Clientes ya medidos y con la necesidad identificada**, asignados por cercanía. Cada hogar llega con su resultado por casilla, su perfil (zona, origen del agua, personas en casa, filtro y etapas) y el producto que se le recomienda.
2. **Inventario contra demanda.** El panel muestra los cartuchos que se van a pedir en 7 y 30 días por tienda y por zona, y el mapa por urbanización avisa dónde se acumulan resultados fuera de rango.
3. **Recambios previstos.** Cada hogar tiene fecha de último cambio; la ferretería sabe qué cartucho sale y cuándo.
4. **Técnicos y despacho.** Los servicios de instalación se asignan a un técnico, que marca "Ya fui" con foto, y el comercio ve el reporte.

**Lo que vale para la ferretería (cálculo, con los márgenes de Tulio aplicados a la ferretería: 20% en filtros y 50% en cartuchos sobre precios de referencia; el margen real de cada ferretería aliada es SUPUESTO):**

| Por mes, a volumen completo | Escenario base | Escenario conservador |
|---|---|---|
| Familias asignadas | 40 (SUPUESTO) | 20 (SUPUESTO) |
| Compran filtro (10% base, 5% conservador; Tulio y la mitad) | 4 × $24,00 = $96 | 1 × $24,00 = $24 |
| Compran cartuchos (30% y 15%) | 12 × $9,50 = $114 | 3 × $9,50 = $29 |
| Sobre vendido en mostrador, la mitad de las familias: $9 menos $5,50 | 20 × $3,50 = $70 | 10 × $3,50 = $35 |
| **Margen mensual de la ferretería** | **$280** | **$88** |
| Membresía | $30 (11% del margen) | $20 (23% del margen) |

Recambios: cada familia que compró vuelve cada 3 meses (Tulio, sin abandono). A plena madurez suman unos $456 más al mes en el base, un techo y no un valor esperado. Para recuperar la membresía de $30 la ferretería necesita unas **5 familias asignadas al mes** con la conversión de Tulio (cada familia deja $7,00 entre producto y sobre) y 7 con la mitad de la conversión.

**¿Quién es el cliente, la familia o la ferretería?** Las dos, en orden distinto: la familia entra por la medición y paga $9, y la ferretería paga cada mes por recibir a esa familia con su dato. El modelo se diseñó para que la ferretería sea la parte que sostiene el ingreso recurrente.

**¿Qué impide que la ferretería lo haga sola?** Una ferretería sola no tiene la lectura de la tira por foto, el perfil del hogar ni los hogares de la zona que aún no la conocen. Tampoco tiene la fecha de recambio de clientes que nunca le compraron. Lo que Grimuca vende es el flujo de familias medidas y la previsión de lo que van a pedir; la ferretería conserva su margen de producto.

---

## 3. El problema logístico y cuánto ahorra

**La respuesta a la pregunta del jurado, "¿cuál es el problema logístico y cuánto le ahorran a la industria?"**

La ferretería compra, almacena y despacha repuestos a ciegas, porque nadie en la cadena conoce la fecha de cambio de cada cartucho. Lo que deja de existir es el **pedido sorpresa**: con la medición y la fecha del último cambio, cada cartucho tiene fecha y referencia conocidas con semanas de anticipación. De ahí salen tres ahorros:

1. **Compra al proveedor contra demanda prevista.** Menos dinero parado en inventario y menos quiebres de pieza.
2. **Asignación del pedido al comercio más cercano que sí tiene la pieza.** Menos ventas perdidas por falta de stock y menos viajes de la familia.
3. **Entregas y visitas técnicas agrupadas por urbanización y por semana.** Una ruta por zona en lugar de un viaje por pedido.

Además, la identificación del filtro por foto reduce la venta del cartucho equivocado: menos devoluciones y menos segundas visitas del técnico.

**La cifra de industria que existe hoy es una sola y sale de supuestos.** El capital de trabajo del piloto, si se compran por adelantado los ~100 filtros y ~300 juegos de cartuchos que debería traer (a 80% y 50% del precio de referencia), es de **$15.000 a $20.000** (cálculo de Business en `auditoria-asesor.md`, SUPUESTO). Comprando contra demanda prevista, con unas dos semanas de cartuchos en estante, baja a una fracción de eso. **Preséntese como supuesto.**

**Ejemplo de orden de magnitud** (SUPUESTO de rotación; los datos reales de Grimuca están pedidos a Tulio):

| | Cálculo |
|---|---|
| Cartuchos que sale Grimuca al mes 12 del modelo anterior | 639 juegos al mes (escenario base de `modelo-v2-tres-tiendas.md`) |
| Costo por juego | $18,99 de referencia × 50% = $9,50 |
| Compra mensual de cartuchos al costo | 639 × $9,50 = **$6.070** |
| Inventario con rotación de 90 días (SUPUESTO) | 3 meses × $6.070 = **$18.200** |
| Inventario contra demanda prevista, 14 días | 14/30 × $6.070 = **$2.830** |
| Dinero que deja de estar parado (ejemplo) | **$15.400**, 85% del inventario de ejemplo |

**Frase lista para rellenar con los datos de Tulio (no inventar):**

> "Grimuca tiene $[DATO DE TULIO] en inventario de filtros y cartuchos, que rota cada [DATO DE TULIO] días; comprando contra demanda prevista baja a [CÁLCULO: inventario ÷ días de rotación × 14]."

Datos pedidos a Tulio: dinero en inventario de filtros y cartuchos, días de rotación, veces al mes que falta una pieza en la tienda, y entregas por semana con el costo de cada una. Cuando lleguen, la frase se completa y el ejemplo de arriba se reemplaza por la cifra real.

**Pesos y viajes del hogar (se conserva del modelo anterior; pesos SUPUESTO, se confirman pesando):** botellón de 19 L lleno 19,75 kg; juego de 3 cartuchos 0,9 kg; sobre 60 g; filtro en su caja 3 kg.

| Un hogar, un año | Botellón (5 a 6 por quincena, estimación de Tulio) | Filtro, año 1 | Filtro, año 2 en adelante |
|---|---|---|---|
| Qué se mueve | 120 a 144 botellones llenos | 1 sobre, 1 filtro, 3 juegos de cartuchos | 4 juegos de cartuchos |
| Kilos | **2.370 a 2.844 kg** | **5,8 kg** | **3,6 kg** |
| Viajes | **24** | **5** | **4** |

Reducción de kilos: **99,8%**. Reducción de viajes: **79%** el primer año y **83%** desde el segundo. El ahorro de kilos y viajes es del hogar y de la ciudad. Lo que Grimuca mueve en el año 1 base de las tres tiendas propias es 5,4 toneladas (`modelo-v2-tres-tiendas.md`).

---

## 4. El sobre: costo, margen y las dos versiones

**Qué trae (Tulio):** 1 tira multiparámetro, 1 prueba de bacterias en frasco, tabla de colores impresa, QR al video. Precio **$9**. El primer paso del cliente es escanear el QR; el pago en la app es solo para quien lo pide a domicilio.

| Componente de fábrica (Tulio) | Costo |
|---|---|
| Frasco de bacterias, 10 a 499 unidades / 500 a 1.999 / desde 2.000 | $2,00 / $1,90 / $1,50 |
| Tira HORYZON | ~$0,04 |
| **Sobre en fábrica** | **$2,04 / $1,94 / $1,54** según volumen |

Lo que se suma hasta la puerta (SUPUESTO, pendiente de Tulio): importación y empaque $1,00 por sobre en la versión A; envío a domicilio $2,50 por entrega (SAMA Logística 3 por cotizar); pasarela 2% de lo que se paga en la app (Cobrix por cotizar). La versión B reemplaza todo el costo puesto en Venezuela por $4,00 (sección 0).

**El sobre se paga solo en ambas versiones:** deja $3,38 (A) o $2,38 (B) a domicilio, y $6,06 o $5,00 con retiro.

---

## 5. Las tres líneas de ingreso y su economía

| Línea | Cómo funciona | Precio | Margen del operador |
|---|---|---|---|
| **1. Sobre de $9 al cliente final** | La familia lo pide a domicilio en la app y paga con la pasarela (50% de los sobres, SUPUESTO tomado del modelo anterior) | $9 (Tulio) | $3,38 (A) · $2,38 (B) |
| **2. Membresía de la ferretería** | Cuota mensual por estar en la red y recibir familias asignadas. 1 a 3 meses gratis al entrar | **$30 al mes (SUPUESTO; rango $20 a $50)** | $30 (100%) |
| **3. Sobres al mayor** | Grimuca importa el sobre y lo vende a la ferretería, que lo revende a $9 en su mostrador (el otro 50%) | **$5,50 (SUPUESTO; rango $5,00 a $6,00)**, flete al comercio $0,25 (SUPUESTO) | $2,31 (A) · $1,25 (B) |
| *Siguiente paso: comisión por transacción* | Porcentaje de las ventas de filtros y cartuchos que pasan por la plataforma | Sin definir | Fuera del cálculo |
| *Siguiente paso: plan premium* | Prioridad de asignación de familias | Sin definir | Fuera del cálculo |

**Por una ferretería a volumen completo (40 familias al mes, escenario base):**

| | Con sobre a $2,94 | Con sobre a $4,00 |
|---|---|---|
| Membresía | $30,0 | $30,0 |
| 20 sobres al mayor × margen | $46,2 | $25,0 |
| 20 sobres de $9 a domicilio × margen | $67,6 | $47,6 |
| **Aporte de la red por ferretería al mes** | **$143,8** | **$102,6** |
| Lado empresa (membresía + mayor) | 53% | 54% |

En el escenario conservador (20 familias al mes y membresía de $20) el aporte es **$76,9** (A) y **$56,3** (B).

**Lectura honesta:** con la membresía a $30 y 40 familias al mes, el sobre aporta la mayor parte del margen y la membresía un quinto (21% con $2,94, 29% con $4,00). Para que el lado empresa pese más hay tres palancas: subir la membresía (a $50 la ferretería sigue pagando 18% de su margen del primer mes), llevar más sobres al mostrador de la ferretería en vez de a domicilio (con 30% a domicilio, el lado empresa pasa a 68% del margen con el sobre a $2,94) y activar el plan premium. Se decide con Tulio.

Quien más gana de estas palancas es la ferretería: el sobre en mostrador le deja $3,50 y le trae a la familia a la tienda.

**Quién hace qué en la entrega:** Grimuca opera la red y despacha en Carabobo desde sus tres tiendas; en otros estados entra una ferretería aliada por estado, y la última milla la hacen operadores que ya tienen red (SAMA Logística 3 en Valencia; en otros estados, por buscar).

---

## 6. Supuestos de la red (para que Tulio corrija)

| Supuesto | Base | Conservador | Origen |
|---|---|---|---|
| **Ferreterías que entran por mes** | 1 por mes en los meses 1 a 4, 2 por mes en los meses 5 a 12: **20 en el año** | 1 por mes en los meses 3 a 12: **10 en el año** | SUPUESTO |
| **Meses gratis** | 2 | 3 | SUPUESTO (propuesta de Leonardo: 1 a 3) |
| **Pagan al terminar el periodo gratis** | **70%** | **40%** | SUPUESTO. Las que no pagan salen de la red |
| **Membresía al mes** | **$30** | **$20** | SUPUESTO |
| **Familias asignadas por ferretería al mes, a volumen completo** | **40** (150 por tienda propia, Tulio) | **20** | SUPUESTO |
| **Arranque de cada ferretería** | 40%, 70% y 100% del volumen en sus meses 1, 2 y 3 | igual | SUPUESTO |
| **Sobres al mayor por ferretería al mes, a volumen completo** | **20** (la mitad de las familias) | **10** | SUPUESTO |
| Precio al mayor del sobre | $5,50 | $5,50 | SUPUESTO |
| Sobres a domicilio | 50% | 50% | SUPUESTO |
| Costo del sobre puesto en Venezuela | $2,94 o $4,00 | $2,94 o $4,00 | Modelo anterior o asesoría (sección 0) |
| Envío $2,50 · pasarela 2% · flete al comercio $0,25 por sobre | igual | igual | SUPUESTO |
| Fijos de la red: responsable de la red $400 + plataforma $50 al mes | $450 | $450 | SUPUESTO ($400 viene del responsable de logística del modelo anterior) |
| Costo de dar de alta una ferretería (visita, material, muestras) | $100 | $100 | SUPUESTO |
| Mes 0: material y capacitación $1.500 + lote de 1.000 sobres | $4.440 (A) · $5.500 (B) | igual | SUPUESTO + sección 0 |
| Cada familia compra un sobre | sí | sí | Tulio |
| Margen de la ferretería en filtro y cartucho | 20% y 50% | 20% y 50% | Tulio (para Grimuca como comercio) |

No se cuentan IVA, devoluciones, comisión de la ferretería por sobres vendidos fuera del mayor ni los ingresos de las tres tiendas propias de Grimuca (sección 9).

---

## 7. Flujo de caja de la red a 12 meses

Es el flujo del operador: cobra membresías, vende sobres al mayor y al cliente final, y paga sobres, envío, pasarela, fijos y altas. Los egresos de los meses 8 y 9 suben porque el lote inicial de 1.000 sobres se agota y desde ahí se compra sobre a sobre.

### Escenario base (20 ferreterías entran, 70% pagan, 2 meses gratis, $30, 40 familias)

| Mes | Ferreterías activas | Pagando | Sobres | Ingresos | Egresos (A) | Neto (A) | Caja (A, $2,94) | Caja (B, $4,00) |
|---|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 | −$5.500 |
| 1 | 1,0 | 0 | 16 | $116 | $573 | −$457 | −$4.897 | −$5.957 |
| 2 | 2,0 | 0 | 44 | $319 | $614 | −$295 | −$5.193 | −$6.253 |
| 3 | 2,7 | 0,7 | 72 | $543 | $655 | −$112 | −$5.305 | −$6.365 |
| 4 | 3,4 | 1,4 | 100 | $767 | $696 | +$70 | −$5.235 | −$6.295 |
| 5 | 5,1 | 2,1 | 144 | $1.107 | $861 | +$246 | −$4.989 | −$6.049 |
| 6 | 6,8 | 2,8 | 200 | $1.534 | $943 | +$591 | −$4.398 | −$5.458 |
| 7 | 8,2 | 4,2 | 256 | $1.982 | $1.025 | +$957 | −$3.441 | −$4.501 |
| 8 | 9,6 | 5,6 | 312 | $2.430 | $1.530 | +$900 | −$2.541 | −$3.754 |
| 9 | 11,0 | 7,0 | 368 | $2.878 | $2.271 | +$607 | −$1.934 | −$3.537 |
| 10 | 12,4 | 8,4 | 424 | $3.326 | $2.518 | +$808 | −$1.126 | −$3.178 |
| 11 | 13,8 | 9,8 | 480 | $3.774 | $2.764 | +$1.010 | −$116 | −$2.677 |
| 12 | 15,2 | 11,2 | 536 | $4.222 | $3.011 | +$1.211 | **+$1.094** | **−$2.035** |

Neto y egresos en la versión A; en la B los egresos suben $1,06 por cada sobre comprado y el efecto está en la última columna. Año 1: ingresos $22.998, 2.952 sobres. Margen del año 1 por línea (versión A / B): membresía $1.596 / $1.596; mayor $3.410 / $1.845; sobre a domicilio $4.989 / $3.424. El lado empresa (membresía y mayor) es la mitad del margen en las dos versiones.

### Escenario conservador (10 ferreterías entran, 40% pagan, 3 meses gratis, $20, 20 familias)

| Mes | Ferreterías activas | Pagando | Sobres | Ingresos | Egresos (A) | Neto (A) | Caja (A, $2,94) | Caja (B, $4,00) |
|---|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 | −$5.500 |
| 1 | 0 | 0 | 0 | $0 | $450 | −$450 | −$4.890 | −$5.950 |
| 2 | 0 | 0 | 0 | $0 | $450 | −$450 | −$5.340 | −$6.400 |
| 3 | 1,0 | 0 | 8 | $58 | $562 | −$504 | −$5.844 | −$6.904 |
| 4 | 2,0 | 0 | 22 | $160 | $582 | −$423 | −$6.266 | −$7.326 |
| 5 | 3,0 | 0 | 42 | $304 | $612 | −$307 | −$6.573 | −$7.633 |
| 6 | 3,4 | 0,4 | 50 | $370 | $623 | −$253 | −$6.826 | −$7.886 |
| 7 | 3,8 | 0,8 | 58 | $436 | $635 | −$198 | −$7.025 | −$8.085 |
| 8 | 4,2 | 1,2 | 66 | $502 | $647 | −$144 | −$7.169 | −$8.229 |
| 9 | 4,6 | 1,6 | 74 | $568 | $658 | −$90 | −$7.259 | −$8.319 |
| 10 | 5,0 | 2,0 | 82 | $634 | $670 | −$36 | −$7.294 | −$8.354 |
| 11 | 5,4 | 2,4 | 90 | $700 | $682 | +$19 | −$7.276 | −$8.336 |
| 12 | 5,8 | 2,8 | 98 | $766 | $694 | +$73 | **−$7.203** | **−$8.263** |

El lote inicial de 1.000 sobres no se termina en el año (se venden unos 590): quedan unos 410 sobres en inventario que no se cuentan como ingreso.

**Lectura:**

- **El año 1 de la red es de inversión.** El capital que hay que poner antes de que la red se pague es de **$5.300 a $6.400** en el base (hueco máximo en el mes 3) y de **$7.300 a $8.400** en el conservador (mes 10).
- **La operación mensual pasa a positivo en el mes 4 (base) y en el mes 11 (conservador).** Al cerrar el año 1, la red base opera con +$1.211 al mes y crece con cada ferretería que entra.
- **Año 2, base:** las 14 ferreterías que se quedan (70% de 20), a volumen completo, aportan 14 × $144 = $2.013 al mes (A) o 14 × $103 = $1.436 (B) contra $450 de fijos: **+$1.563 o +$986 al mes**. Con una ferretería por estado (23, cálculo): +$2.857 o +$1.910 al mes.
- **No se suman** a las cifras de la red las de las tres tiendas propias (sección 9).

---

## 8. Punto de equilibrio y qué tumba el modelo

### Punto de equilibrio, en ferreterías que pagan

Fijos de la red $450 al mes (SUPUESTO). Se cuentan ferreterías pagando y a volumen completo.

| Escenario | Aporte por ferretería | **Ferreterías para cubrir $450** |
|---|---|---|
| Base, sobre a $2,94 | $143,8 | **4** (3,1) |
| Base, sobre a $4,00 | $102,6 | **5** (4,4) |
| Conservador, sobre a $2,94 | $76,9 | **6** (5,9) |
| Conservador, sobre a $4,00 | $56,3 | **8** (8,0) |
| Solo con la membresía, a $30 | $30 | **15** |
| Solo con la membresía, a $20 | $20 | **23** |

Con la membresía sola harían falta 15 a 23 ferreterías: los sobres son lo que acerca el equilibrio a 4 o 5.

### Qué variable tumba el modelo

Caja del año 1, escenario base, cambiando una variable a la vez:

| Cambio | Con $2,94 | Con $4,00 |
|---|---|---|
| Tal cual | +$1.094 | −$2.035 |
| **20 familias por ferretería al mes en vez de 40** | **−$3.105** | **−$4.669** |
| 60 familias por ferretería al mes | +$5.294 | +$600 |
| **Solo la mitad de las ferreterías entra (10)** | −$2.903 | −$4.467 |
| El doble de ferreterías entra (40) | +$17.083 | +$7.696 |
| Pagan 40% al terminar el periodo gratis (en vez de 70%) | −$2.184 | −$4.347 |
| Pagan 100% | +$4.373 | +$277 |
| Membresía de $20 | +$562 | −$2.567 |
| Membresía de $50 | +$2.158 | −$971 |
| Sin membresía | −$502 | −$3.631 |
| Sobre al mayor a $5,00 / a $6,00 | +$356 / +$1.832 | −$2.773 / −$1.297 |
| Periodo gratis de 1 mes / de 3 meses | +$1.042 / +$1.305 | −$1.927 / −$2.028 |
| 100% de los sobres a domicilio | +$2.674 | −$455 |
| 30% de los sobres a domicilio | +$463 | −$2.666 |
| 40% pagan y 20 familias a la vez | −$5.086 | −$6.167 |

**Conclusión:**

1. **La variable que tumba el modelo es el volumen de familias medidas que la red le entrega a cada ferretería.** Mueve a la vez el margen de los sobres y la razón para pagar la membresía. Para que el año 1 cierre en cero se necesitan unas **35 familias al mes por ferretería con el sobre a $2,94 y unas 55 con $4,00**. La ferretería recupera la membresía con 5 familias, así que la membresía por sí sola no frena la compra; lo que la frena es que lleguen pocas.
2. **La segunda es cuántas ferreterías entran**, y la tercera cuántas pagan al terminar el periodo gratis.
3. **El periodo gratis casi no mueve el resultado** (±$200), porque la ferretería en periodo gratis igual compra sobres. Puede ser de 3 meses sin costo importante.
4. **La diferencia entre $2,94 y $4,00 en el sobre vale $3.100 de caja al año en el base**, y cambia de signo el año 1.
5. **Llevar sobres al mostrador de la ferretería** sube el peso del lado empresa pero baja la caja del operador (cada sobre al mayor deja menos que uno a domicilio). Es una decisión de negocio que se toma sabiendo ese costo.

---

## 9. Grimuca como comercio de Carabobo (lo que no cambia)

Grimuca es el comercio de Carabobo y opera la red. Sus tres tiendas (Mañongo, Big Low y CC CEM) siguen con la economía del modelo anterior, que Tulio aportó y Business verificó (`modelo-v2-tres-tiendas.md`): 150 hogares al mes por tienda, 10 de cada 100 sobres compran filtro con 20% de margen, 30 compran cartuchos con 50% de margen y el recambio es cada 3 meses.

| Las tres tiendas propias, año 1 | Con $2,94 | Con $4,00 (estimación) |
|---|---|---|
| Caja al cierre, base | +$65.500 | unos +$60.300 |
| Caja al cierre, conservador | +$6.200 | unos +$3.600 |

El valor con $4,00 es una estimación de Business: $1,06 más por cada uno de los 4.860 y 2.430 sobres del año. Esas cifras son una hipótesis para el piloto de 1.000 sobres, no un resultado. **No se suman a la red**: comparten el lote de sobres y el responsable de logística, y sumarlas contaría dos veces esos costos. En Carabobo, la asignación por cercanía vale para Grimuca y para cualquier ferretería aliada que entre.

---

## 10. Botellón contra filtro (se conserva)

Estimación de Tulio, sin medición: 5 a 6 botellones por quincena (10 a 12 al mes), unos $2 cada uno y hasta $4 con delivery. Son $240 a $288 al año sin delivery y $480 a $576 con delivery.

| Costo del filtro (referencia de mercado, no de Grimuca; instalación SUPUESTO $50) | Ultrafiltración 6 etapas | Ósmosis 8 etapas |
|---|---|---|
| Sobre + filtro + plomero | $9 + $119,99 + $50 | $9 + $329,99 + $50 |
| 3 juegos de cartuchos en el año ($18,99 cada uno, referencia) | $56,97 | $56,97 |
| **Primer año** | **$236** | **$446** |
| Segundo año | $76 | $76 |

Con delivery, la ultrafiltración se paga en 4 a 5 meses; con recarga a $2, en 10 a 13. Como Grimuca vende más barato que la referencia (Tulio), son techos. El filtro necesita agua en el grifo o en el tanque. La comparación es de costo y de carga: ni el sobre ni el filtro certifican el agua.

---

## 11. Expansión: una ferretería por estado

- **Carabobo:** Grimuca es el comercio y opera la red.
- **Otros estados:** entra una ferretería aliada por estado. Con una, el estado queda cubierto para la asignación por cercanía. En la demo hay dos comercios de demostración (Barquisimeto, Lara, y Maracay, Aragua), rotulados así.
- **Última milla:** operadores que ya tienen red. SAMA Logística 3 cubre Valencia (tarifa y cobertura en Naguanagua y San Diego por confirmar); en otros estados no hay operador confirmado.
- **Para otros países** cambian el catálogo y la tabla de la tira, ambos configurables. Datos de mercado:

| Dato | Cifra | Fuente |
|---|---|---|
| Venezuela: hogares | ~9 millones | ENCOVI 2025 (UCAB, may 2026) |
| Venezuela: reciben agua todos los días | 27% | OVSP, citado por El Diario, abr 2022 |
| México: hogares que compran agua embotellada | 98% | Kantar Worldpanel, datos 2017 |
| República Dominicana: hogares con agua de botellón | 84,3% | ONE, Censo 2022, vía Revista Mercado, ago 2026 |
| Mercado de purificadores en Latinoamérica | $2.500 millones en 2025 | Global Market Insights |

---

## 12. Pendientes y preguntas

**Para Tulio, en orden de peso (los cuatro primeros corrigen el modelo):**

1. **Precio de la membresía** que pagaría una ferretería (supuesto $30, rango $20 a $50). ¿Cuánto cobraría usted a una ferretería que conoce?
2. **Precio al mayor del sobre** (supuesto $5,50).
3. **Cuántas ferreterías entrarían** en los primeros 12 meses y cuáles conoce por nombre (supuesto 20 base, 10 conservador).
4. **Cuántas pagarían al terminar el periodo gratis** (supuesto 70% y 40%).
5. Costo real del sobre puesto en Venezuela ($2,94 o $4,00; la pregunta de fondo va a Leonardo).
6. Los cuatro datos de Grimuca para la cifra logística: dinero en inventario de filtros y cartuchos, días de rotación, veces al mes que falta una pieza, entregas por semana y su costo.
7. Si las ferreterías aliadas comprarían también filtros y cartuchos a Grimuca u Oasis (sería una cuarta línea de ingreso, fuera del cálculo).
8. Tarifa de SAMA y cobertura, costos de Cobrix, precios internos de Grimuca, catálogo completo y comisión de farmacias y supermercados (de la versión anterior; siguen pendientes).

**Para Leonardo:** el $4,00 contra el $2,94 (sección 0), y si se prefiere llevar más sobres al mostrador de la ferretería aunque baje la caja del operador.

---

## 13. Riesgos

| Riesgo | Qué pasa | Qué se hace |
|---|---|---|
| Pocas familias medidas por ferretería | La ferretería no recupera la membresía y no renueva | Medir en el piloto cuántas familias llegan por zona; asignar a las ferreterías primero donde hay más hogares |
| Ninguna ferretería ha pagado | La membresía es un supuesto | Periodo gratis de 1 a 3 meses; primer cobro solo después de que la ferretería vea sus primeras familias |
| La ferretería se queda con la familia y deja de pagar | Pérdida de la membresía | La asignación y la fecha de recambio viven en la plataforma; el plan premium y la comisión crecen con el uso |
| Grimuca es operador y comercio a la vez | Desconfianza de una ferretería aliada en Carabobo | Regla de asignación por cercanía y por existencias, visible en el panel (en la demo la asignación por distancia real queda fuera) |
| La tira falla o se lee mal | Reposición del sobre | La app no adivina: pide repetir la foto o cargar los colores a mano |
| Afirmaciones sobre salud | Riesgo legal y de confianza | Medición orientativa; aviso fijo; plomo y cobre "posible presencia, confirma con un laboratorio" |
| Permisos para importar y vender pruebas de agua | Sin fuente verificada | Confirmar con el abogado antes de vender sobres al mayor |
| Costo del sobre a $4,00 | La caja del año 1 base pasa a negativo | Decidir la cifra (sección 0); subir el precio al mayor o la membresía |

---

## 14. Fuentes

- Correos de Tulio, sáb 21 nov, 8:12, 8:38, 8:49 y 8:52 p.m.: `insumos-tulio/`.
- Decisión de la red de comercios: `docs/decisiones/contrato-red.md`.
- Modelo anterior con cuentas verificadas: `docs/negocio/modelo-v2-tres-tiendas.md` y `auditoria-asesor.md`.
- Precios de referencia (consultados por Tulio, no son precios de Grimuca): Oasis en Mundo JAB (ultrafiltración $119,99; ósmosis $329,99; kit de 3 cartuchos $18,99). Frasco y tira: Shenzhen Hongyi y HORYZON, en Alibaba.
- Fuentes públicas: OVSP vía El Diario (9 abr 2022); ENCOVI 2025 (UCAB); Kantar Worldpanel (2018); Revista Mercado (19 ago 2026); Global Market Insights.
- Sin fuente (SUPUESTO): todo lo marcado así en la sección 6, el capital de trabajo del piloto de $15.000 a $20.000 y el ejemplo de rotación de 90 días.
