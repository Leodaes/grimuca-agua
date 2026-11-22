# Modelo de negocio · Grimuca Agua · red de ferreterías

**Versión 3.1 · sábado 21 nov 2026, noche · hackatón ValenValley, track Logística**
**Decisión del 22 nov:** el costo del sobre puesto en Venezuela es $2,94 (Leonardo); el $4,00 pasa a sensibilidad.
**Cambio de la 3.1 (cifras reales de Grimuca):** llegaron datos de ventas e inventario de Grimuca (90 días al 21 nov 2026). Dos cosas cambian: (1) el ejemplo supuesto de inventario de la sección 3 se reemplaza por el argumento real, en proporciones; (2) el volumen de familias por ferretería se baja de 40 a 20 en el escenario base, porque 40 era una meta y no continuidad de lo que Grimuca vende hoy (sección 0b). El escenario de 40 se conserva como **escenario meta**. Los montos exactos de Grimuca no están en este documento por ser público.
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

## 0. El costo del sobre: $2,94 de base y $4,00 como sensibilidad

**Decisión (dom 22 nov):** Leonardo, el dueño, decidió que el costo del sobre puesto en Venezuela es **$2,94** (decisión del equipo; incluye fábrica y un supuesto de $1,00 de flete, aduana y empaque). Es la base de este documento y de los materiales públicos. El $4,00 queda como **escenario de sensibilidad**: en las tablas, la versión A es la base ($2,94) y la B es la sensibilidad ($4,00).

| | **Base (A): $2,94, decisión del equipo** | Sensibilidad (B): $4,00, cifra de la asesoría |
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
| Aporte de la red por ferretería al mes, volumen completo, **base (20 familias)** | **$87** | **$66** |
| Ferreterías que pagan para cubrir los fijos de la red, base | **6** | **7** |
| Caja de la red al cierre del año 1, base | **−$3.105** | **−$4.669** |
| Caja de la red al cierre del año 1, conservador (10 familias) | **−$8.909** | **−$9.969** |
| Caja de la red al cierre del año 1, **meta (40 familias, el antiguo base)** | **+$1.094** | **−$2.035** |
| Hogares al mes por ferretería para que el año 1 cierre en cero | **35** | **56** |

**Nota de sensibilidad:** si el costo sube a $4,00, cifra que se mencionó en la asesoría (sin desglose), la caja del año 1 base baja de −$3.105 a −$4.669.

---

## 0b. Realidad del volumen: lo proyectado frente a lo que Grimuca vende hoy

**Dato de Grimuca, 90 días al 21 nov 2026** (facturas de las tres tiendas; clasificación por palabras de la descripción, aproximada): Grimuca vende del orden de **un centenar de cartuchos y membranas al mes** entre las tres tiendas, es decir unas decenas por tienda. El modelo anterior de las tres tiendas proyectaba hasta **639 juegos de cartuchos al mes** en el mes 12: **unas seis a ocho veces** lo que se vende hoy. No es continuidad de lo actual: es una meta de crecimiento.

**¿Es defendible el supuesto de 40 familias medidas por ferretería al mes?** No como escenario base. Razones:

1. Cada familia medida compra cartuchos con 30% de probabilidad (Tulio). 40 familias son unos 12 juegos al mes de ventas nuevas por ferretería, más los recambios. Eso es una parte importante de lo que una tienda de Grimuca vende hoy en todo el rubro, y la ferretería aliada es, por hipótesis, más chica que Grimuca.
2. No hay ninguna ferretería aliada ni medición real todavía: las 40 familias no tienen una fuente medida.
3. Los recambios (cada 3 meses) solo aparecen cuando las familias ya llevan meses en el sistema; en el año 1 pesan poco.

**Decisión:** el escenario base pasa a **20 familias medidas por ferretería al mes**, el conservador a **10** y el de 40 queda como **meta** (antes era el base). Todo lo demás (ferreterías que entran, que pagan, membresía, fijos) se mantiene.

**De dónde saldrían las familias de la meta (hipótesis a probar en el piloto, no dato):** (a) cada comprador de filtro o cartucho en el mostrador de la ferretería sale con un sobre de $9 en la mano o se le ofrece uno; (b) los códigos QR en el mostrador de Grimuca en Carabobo; (c) las urbanizaciones donde el mapa muestra resultados fuera de rango; (d) campañas dirigidas por urbanización. Si el piloto mide menos de 10 familias al mes por ferretería, el modelo cae al conservador.

**Antes y después** (cálculo con el mismo motor de las secciones 6 y 7; la versión A es sobre a $2,94 y la B a $4,00):

| | Antes (base: 40 familias, membresía $30) | **Después, base nuevo (20 familias, membresía $30)** | Antes (conservador: 20 familias, $20) | **Después, conservador nuevo (10 familias, $20)** |
|---|---|---|---|---|
| Aporte de la red por ferretería al mes (A / B) | $144 / $103 | **$87 / $66** | $77 / $56 | **$48 / $38** |
| Ferreterías pagando para cubrir los $450 de fijos (A / B) | 4 / 5 | **6 / 7** | 6 / 8 | **10 / 12** |
| Caja de la red al cierre del año 1 (A / B) | +$1.094 / −$2.035 | **−$3.105 / −$4.669** | −$7.203 / −$8.263 | **−$8.909 / −$9.969** |
| Mes en que la operación mensual pasa a positivo | 4 | **6** (en A y en B) | 11 | **no en el año 1** |
| Hueco máximo de caja (capital a poner) | $5.300 a $6.400 | **$6.100 a $7.100** (mes 5 o 6) | $7.300 a $8.400 | **$8.900 a $10.000 y sigue bajando al mes 12** |
| Margen mensual de la ferretería a volumen completo | $280 | **$140** | $88 | **$44** |

**Lectura franca:** con lo que Grimuca vende hoy, el año 1 de la red cierra en negativo en los dos escenarios. El escenario meta (40 familias por ferretería) es el que da caja positiva en A y se logra solo si las familias llegan; para que el año 1 cierre en cero hacen falta **35 familias por ferretería al mes con el sobre a $2,94 y 56 con $4,00**. El año 1 es una inversión de $6.000 a $10.000 según el escenario (SUPUESTOS), no un negocio que se paga solo en 12 meses.

---

## 1. El modelo en 10 líneas

1. **El cliente que paga es la ferretería.** La familia mide su agua con un sobre de **$9** (Tulio) y genera la señal: una medición con su perfil y la fecha del último cambio del cartucho.
2. **El sistema asigna cada familia al comercio más cercano que tiene el producto.** La ferretería recibe clientes ya medidos y con su necesidad identificada, y no vende filtros a ciegas.
3. **Tres líneas de ingreso para Grimuca como operador:** (1) el sobre de $9 al cliente final, (2) la membresía mensual de la ferretería, con 1 a 3 meses gratis de entrada, y (3) la venta de sobres al mayor a las ferreterías. Siguiente paso, fuera de la demo: comisión por transacción y plan premium con prioridad de asignación.
4. **Supuestos de precio (SUPUESTO):** membresía de **$30 al mes** (rango $20 a $50), sobre al mayor a **$5,50** (rango $5,00 a $6,00).
5. **Por cada ferretería a volumen completo, la red aporta $87 al mes con el sobre a $2,94 y $66 con el sobre a $4,00** (cálculo, escenario base de 20 familias; en el escenario meta de 40 familias son $144 y $103).
6. **La ferretería recibe unos $140 al mes en margen de las 20 familias asignadas** (a volumen completo, cálculo con los márgenes de Tulio; $280 con las 40 de la meta) y paga $30. Con 5 familias al mes recupera la membresía.
7. **Punto de equilibrio de la red: 6 a 7 ferreterías pagando** en el escenario base, 10 a 12 en el conservador (fijos de la red $450 al mes, SUPUESTO); 4 a 5 en el escenario meta. Solo con membresía harían falta 15.
8. **Flujo de caja de la red a 12 meses:** base −$3.105 con el sobre a $2,94 y −$4.669 con $4,00; conservador −$8.909 y −$9.969; meta (40 familias) +$1.094 y −$2.035. El año 1 es de inversión; el flujo mensual de la operación pasa a positivo en el mes 6 (base) y en el escenario conservador no lo hace dentro del año.
9. **Lo que tumba el modelo** es el volumen de familias medidas que la red le entrega a cada ferretería: con 35 al mes (sobre a $2,94) o 56 (a $4,00) el año 1 cierra en cero, y hoy el base supone 20 (sección 0b).
10. **Logística:** el surtido de agua de Grimuca está disperso y su venta concentrada (dato real, sección 3). Con cada cartucho con fecha y referencia semanas antes, se compra lo que se va a vender, los quiebres se ven antes y las entregas se agrupan por urbanización.

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
| Familias asignadas | **20** (SUPUESTO; antes 40) | **10** (SUPUESTO; antes 20) |
| Compran filtro (10% base, 5% conservador; Tulio y la mitad) | 2 × $24,00 = $48 | 0,5 × $24,00 = $12 |
| Compran cartuchos (30% y 15%) | 6 × $9,50 = $57 | 1,5 × $9,50 = $14 |
| Sobre vendido en mostrador, la mitad de las familias: $9 menos $5,50 | 10 × $3,50 = $35 | 5 × $3,50 = $18 |
| **Margen mensual de la ferretería** | **$140** | **$44** |
| Membresía | $30 (21% del margen) | $20 (45% del margen) |

Con las 40 familias de la meta el margen es $280 y la membresía pesa 11%. **Lectura franca:** con 10 familias al mes, la membresía de $20 se lleva casi la mitad del margen de la ferretería; en ese escenario la ferretería probablemente no renueva, y el 40% de permanencia supuesto ya lo refleja.

Recambios: cada familia que compró vuelve cada 3 meses (Tulio, sin abandono). A plena madurez suman unos $228 más al mes en el base (la mitad de los $456 de la meta), un techo y no un valor esperado. Para recuperar la membresía de $30 la ferretería necesita unas **5 familias asignadas al mes** con la conversión de Tulio (cada familia deja $7,00 entre producto y sobre) y 7 con la mitad de la conversión.

**¿Quién es el cliente, la familia o la ferretería?** Las dos, en orden distinto: la familia entra por la medición y paga $9, y la ferretería paga cada mes por recibir a esa familia con su dato. El modelo se diseñó para que la ferretería sea la parte que sostiene el ingreso recurrente.

**¿Qué impide que la ferretería lo haga sola?** Una ferretería sola no tiene la lectura de la tira por foto, el perfil del hogar ni los hogares de la zona que aún no la conocen. Tampoco tiene la fecha de recambio de clientes que nunca le compraron. Lo que Grimuca vende es el flujo de familias medidas y la previsión de lo que van a pedir; la ferretería conserva su margen de producto.

---

## 3. El problema logístico y cuánto ahorra

**La respuesta a la pregunta del jurado, "¿cuál es el problema logístico y cuánto le ahorran a la industria?"**

**Lo que dicen los datos reales de Grimuca** (dato de Grimuca, 90 días al 21 nov 2026; facturas de las tres tiendas e inventario del gestor interno, que lleva solo algunas marcas; la clasificación es por palabras de la descripción, así que son órdenes de magnitud):

- **El surtido está disperso.** Una de cada tres referencias de agua casi no se mueve: vendió dos unidades o menos en 90 días.
- **La venta está concentrada.** Una sola referencia hace la mitad de la venta de cartuchos y membranas.
- **El inventario de agua alcanza para más de dos meses de venta**, repartido en tres tiendas.
- **Faltan unas mientras sobran otras.** Alrededor de una de cada diez líneas de agua está en existencia cero mientras otras acumulan meses de venta.

Ese es el problema logístico: surtido amplio y disperso, venta concentrada en pocas piezas, y nadie en la cadena que conozca la fecha de cambio de cada cartucho para comprar lo que de verdad se va a vender.

**Qué cambia con demanda prevista.** Con la medición y la fecha del último cambio, cada cartucho tiene fecha y referencia conocidas con semanas de anticipación. De ahí salen tres efectos:

1. **Se compra contra fechas de recambio conocidas.** El inventario se concentra en las pocas referencias que rotan y se deja de comprar profundidad en las que no se mueven.
2. **Los quiebres se ven antes.** El panel muestra, por tienda y por zona, lo que se va a pedir en 7 y 30 días; una pieza en cero deja de ser una sorpresa en el mostrador. Y el pedido se asigna al comercio más cercano que sí tiene la pieza.
3. **Las entregas se agrupan por urbanización y por semana.** Una ruta por zona en lugar de un viaje por pedido; la demo muestra la ruta agrupada contra los viajes sueltos.

Además, la identificación del filtro por foto reduce la venta del cartucho equivocado: menos devoluciones y menos segundas visitas del técnico.

**Franqueza sobre el tamaño.** En dólares, el inventario de agua de una ferretería es pequeño; no es ahí donde está el valor. El valor está en tres cosas: (1) **no perder ventas por faltantes** de las piezas que sí rotan, (2) **no inmovilizar surtido que no rota** y (3) **agrupar entregas**. No se afirma una cifra de ahorro de la industria: no hay datos de cuántas veces al mes piden una pieza que no hay ni de cuántas entregas hace Grimuca y a qué costo.

**Porcentaje de ahorro (SUPUESTO, cálculo):** el inventario de agua cubre hoy más de dos meses de venta (unos 70 días, estimación que mezcla marcas del gestor con ventas de todas las marcas). Si comprar contra fechas de recambio lo lleva a unos 35 días, el dinero parado baja a la mitad (35 ÷ 70 = 50%). Los 35 días son un supuesto de Business, no un dato ni un compromiso.

**Ejemplo de entregas (ilustración, no dato de Grimuca):** si en una semana hay seis recambios previstos en la misma urbanización, la ruta agrupada es un viaje en lugar de seis.

**Se retira de esta sección:** el ejemplo anterior (639 juegos al mes, 90 días de rotación supuestos y un capital de trabajo del piloto de $15.000 a $20.000) partía de un volumen ocho veces mayor que la venta actual (sección 0b) y queda sustituido por lo anterior.

**Datos que siguen faltando (pedidos a Tulio):** veces al mes que se pide una pieza que no hay, y entregas por semana con el costo de cada una. Cuando lleguen, se completa el ahorro por faltantes y por entregas.

**Frase pública:** "Grimuca reparte su surtido de agua entre tres tiendas: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos. Con la fecha de cada recambio se compra lo que se va a vender y las entregas salen agrupadas por urbanización." (Dato de Grimuca, 90 días al 21 nov 2026.)

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

Lo que se suma hasta la puerta (SUPUESTO, pendiente de Tulio): importación y empaque $1,00 por sobre en la versión A; envío a domicilio $2,50 por entrega (SAMA Logística 3 por cotizar); pasarela 2% de lo que se paga en la app (Cobrix por cotizar). La sensibilidad (B) reemplaza todo el costo puesto en Venezuela por $4,00 (sección 0).

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

**Por una ferretería a volumen completo (20 familias al mes, escenario base; entre paréntesis, la meta de 40):**

| | Con sobre a $2,94 | Con sobre a $4,00 |
|---|---|---|
| Membresía | $30,0 | $30,0 |
| 10 sobres al mayor × margen (20 en la meta) | $23,1 | $12,5 |
| 10 sobres de $9 a domicilio × margen (20 en la meta) | $33,8 | $23,8 |
| **Aporte de la red por ferretería al mes** | **$86,9** ($143,8 en la meta) | **$66,3** ($102,6 en la meta) |
| Lado empresa (membresía + mayor) | 61% (53% en la meta) | 64% (54% en la meta) |

En el escenario conservador (10 familias al mes y membresía de $20) el aporte es **$48,5** (A) y **$38,1** (B); antes, con 20 familias, era $76,9 y $56,3.

**Lectura honesta:** con la membresía a $30 y 20 familias al mes, la membresía pesa un tercio del aporte (35% con $2,94, 45% con $4,00) y el resto viene de los sobres. Para que el lado empresa pese más hay tres palancas: subir la membresía (a $50 la ferretería pagaría 36% de su margen de $140 con 20 familias, y 18% con las 40 de la meta: con poco volumen subirla es arriesgado), llevar más sobres al mostrador de la ferretería en vez de a domicilio (con 30% a domicilio, el lado empresa pasa a 75% del margen con el sobre a $2,94 y 20 familias) y activar el plan premium. Se decide con Tulio.

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
| **Familias asignadas por ferretería al mes, a volumen completo** | **20** (antes 40; la meta sigue en 40) | **10** (antes 20) | SUPUESTO; bajado por la realidad del volumen (sección 0b) |
| **Arranque de cada ferretería** | 40%, 70% y 100% del volumen en sus meses 1, 2 y 3 | igual | SUPUESTO |
| **Sobres al mayor por ferretería al mes, a volumen completo** | **10** (la mitad de las familias) | **5** | SUPUESTO |
| Precio al mayor del sobre | $5,50 | $5,50 | SUPUESTO |
| Sobres a domicilio | 50% | 50% | SUPUESTO |
| Costo del sobre puesto en Venezuela | **$2,94** (sensibilidad: $4,00) | **$2,94** (sensibilidad: $4,00) | Decisión de Leonardo, 22 nov (sección 0); incluye fábrica y $1,00 de flete, aduana y empaque (SUPUESTO) |
| Envío $2,50 · pasarela 2% · flete al comercio $0,25 por sobre | igual | igual | SUPUESTO |
| Fijos de la red: responsable de la red $400 + plataforma $50 al mes | $450 | $450 | SUPUESTO ($400 viene del responsable de logística del modelo anterior) |
| Costo de dar de alta una ferretería (visita, material, muestras) | $100 | $100 | SUPUESTO |
| Mes 0: material y capacitación $1.500 + lote de 1.000 sobres | $4.440 (A) · $5.500 (B) | igual | SUPUESTO + sección 0 |
| Cada familia compra un sobre | sí | sí | Tulio |
| Margen de la ferretería en filtro y cartucho | 20% y 50% | 20% y 50% | Tulio (para Grimuca como comercio) |

No se cuentan IVA, devoluciones, comisión de la ferretería por sobres vendidos fuera del mayor ni los ingresos de las tres tiendas propias de Grimuca (sección 9).

---

## 7. Flujo de caja de la red a 12 meses

Es el flujo del operador: cobra membresías, vende sobres al mayor y al cliente final, y paga sobres, envío, pasarela, fijos y altas.

Las tres tablas usan el mismo motor de cálculo y solo cambian las familias por ferretería, la cantidad de ferreterías, el pago y la membresía. **Las cifras de abajo reemplazan a las de la versión 3**, que tomaban 40 familias como base (ese escenario queda al final como meta).

### Escenario base (20 ferreterías entran, 70% pagan, 2 meses gratis, $30, 20 familias por ferretería)

| Mes | Ferreterías activas | Pagando | Sobres | Ingresos | Egresos (A) | Neto (A) | Caja (A, $2,94) | Caja (B, $4,00) |
|---|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 | −$5.500 |
| 1 | 1,0 | 0 | 8 | $58 | $562 | −$504 | −$4.944 | −$6.004 |
| 2 | 2,0 | 0 | 22 | $160 | $582 | −$423 | −$5.366 | −$6.426 |
| 3 | 2,7 | 0,7 | 36 | $282 | $603 | −$321 | −$5.687 | −$6.747 |
| 4 | 3,4 | 1,4 | 50 | $405 | $623 | −$219 | −$5.906 | −$6.966 |
| 5 | 5,1 | 2,1 | 72 | $585 | $755 | −$170 | −$6.076 | −$7.136 |
| 6 | 6,8 | 2,8 | 100 | $809 | $797 | +$13 | −$6.064 | −$7.124 |
| 7 | 8,2 | 4,2 | 128 | $1.054 | $838 | +$216 | −$5.847 | −$6.907 |
| 8 | 9,6 | 5,6 | 156 | $1.299 | $879 | +$420 | −$5.427 | −$6.487 |
| 9 | 11,0 | 7,0 | 184 | $1.544 | $920 | +$624 | −$4.803 | −$5.863 |
| 10 | 12,4 | 8,4 | 212 | $1.789 | $961 | +$828 | −$3.974 | −$5.034 |
| 11 | 13,8 | 9,8 | 240 | $2.034 | $1.613 | +$421 | −$3.553 | −$4.834 |
| 12 | 15,2 | 11,2 | 268 | $2.279 | $1.831 | +$448 | **−$3.105** | **−$4.669** |

Neto y egresos en la versión A; en la B los egresos suben $1,06 por cada sobre comprado y el efecto está en la última columna. En los meses 11 y 12 los egresos suben porque el lote inicial de 1.000 sobres se agota y desde ahí se compra sobre a sobre.

### Escenario conservador (10 ferreterías entran, 40% pagan, 3 meses gratis, $20, 10 familias por ferretería)

| Mes | Ferreterías activas | Pagando | Sobres | Ingresos | Egresos (A) | Neto (A) | Caja (A, $2,94) | Caja (B, $4,00) |
|---|---|---|---|---|---|---|---|---|
| 0 | | | | | $4.440 | −$4.440 | −$4.440 | −$5.500 |
| 1 | 0 | 0 | 0 | $0 | $450 | −$450 | −$4.890 | −$5.950 |
| 2 | 0 | 0 | 0 | $0 | $450 | −$450 | −$5.340 | −$6.400 |
| 3 | 1,0 | 0 | 4 | $29 | $556 | −$527 | −$5.867 | −$6.927 |
| 4 | 2,0 | 0 | 11 | $80 | $566 | −$486 | −$6.353 | −$7.413 |
| 5 | 3,0 | 0 | 21 | $152 | $581 | −$429 | −$6.782 | −$7.842 |
| 6 | 3,4 | 0,4 | 25 | $189 | $587 | −$397 | −$7.179 | −$8.239 |
| 7 | 3,8 | 0,8 | 29 | $226 | $592 | −$366 | −$7.545 | −$8.605 |
| 8 | 4,2 | 1,2 | 33 | $263 | $598 | −$335 | −$7.880 | −$8.940 |
| 9 | 4,6 | 1,6 | 37 | $300 | $604 | −$304 | −$8.184 | −$9.244 |
| 10 | 5,0 | 2,0 | 41 | $337 | $610 | −$273 | −$8.457 | −$9.517 |
| 11 | 5,4 | 2,4 | 45 | $374 | $616 | −$242 | −$8.699 | −$9.759 |
| 12 | 5,8 | 2,8 | 49 | $411 | $622 | −$211 | **−$8.909** | **−$9.969** |

Con 10 familias por ferretería el lote inicial de 1.000 sobres es demasiado grande: se venden unos 295 en el año y quedan unos 705 en inventario que no se cuentan como ingreso. Si este escenario fuera el real, el lote inicial se compraría más chico.

### Escenario meta (40 familias por ferretería; era el escenario base de la versión 3)

Es lo que da caja positiva en la versión A, y solo se alcanza si llegan 40 familias medidas al mes por ferretería, unas dos veces el volumen del base y un múltiplo de lo que Grimuca vende hoy en el rubro (sección 0b). Se conserva como meta de crecimiento y como referencia.

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

**Lectura:**

- **El año 1 de la red es de inversión, y con el volumen real de hoy no se paga dentro del año.** El capital que hay que poner antes de que la red se pague es de **$6.100 a $7.100** en el base (hueco máximo en el mes 5 o 6) y de **$8.900 a $10.000** en el conservador (todavía en descenso al mes 12). En la meta de 40 familias era de $5.300 a $6.400.
- **La operación mensual pasa a positivo en el mes 6 (base)** y en el conservador no lo hace dentro del año (en la meta era el mes 4). Al cerrar el año 1, la red base opera con unos +$450 al mes.
- **Año 2, base:** las 14 ferreterías que se quedan (70% de 20), a volumen completo, aportan 14 × $87 = $1.217 al mes (A) o 14 × $66 = $928 (B) contra $450 de fijos: **+$767 o +$478 al mes**. Con una ferretería por estado (23, cálculo): +$1.549 o +$1.075 al mes. En la meta eran +$1.563 y +$986 con las 14 ferreterías.
- **No se suman** a las cifras de la red las de las tres tiendas propias (sección 9).

---

## 8. Punto de equilibrio y qué tumba el modelo

### Punto de equilibrio, en ferreterías que pagan

Fijos de la red $450 al mes (SUPUESTO). Se cuentan ferreterías pagando y a volumen completo. **Antes y después** de bajar el volumen a la realidad de hoy:

| Escenario | Aporte por ferretería | **Ferreterías para cubrir $450** | Antes (versión 3) |
|---|---|---|---|
| Base (20 familias), sobre a $2,94 | $86,9 | **6** (5,2) | 4 |
| Base (20 familias), sobre a $4,00 | $66,3 | **7** (6,8) | 5 |
| Conservador (10 familias), sobre a $2,94 | $48,5 | **10** (9,3) | 6 |
| Conservador (10 familias), sobre a $4,00 | $38,1 | **12** (11,8) | 8 |
| Meta (40 familias), sobre a $2,94 / $4,00 | $143,8 / $102,6 | **4 / 5** (3,1 / 4,4) | el antiguo base |
| Solo con la membresía, a $30 | $30 | **15** | 15 |
| Solo con la membresía, a $20 | $20 | **23** | 23 |

Con la membresía sola harían falta 15 a 23 ferreterías: los sobres son lo que acerca el equilibrio, pero con el volumen real de hoy lo acercan menos (6 a 7 en vez de 4 a 5).

### Qué variable tumba el modelo

Caja del año 1, escenario base nuevo (20 familias), cambiando una variable a la vez:

| Cambio | Con $2,94 | Con $4,00 |
|---|---|---|
| Tal cual (20 familias) | −$3.105 | −$4.669 |
| **10 familias por ferretería al mes en vez de 20** | **−$5.975** | **−$7.035** |
| **40 familias al mes (la meta)** | **+$1.094** | **−$2.035** |
| 60 familias por ferretería al mes | +$5.294 | +$600 |
| **Solo la mitad de las ferreterías entra (10)** | −$3.958 | −$5.018 |
| El doble de ferreterías entra (40) | +$690 | −$2.439 |
| Pagan 40% al terminar el periodo gratis (en vez de 70%) | −$5.086 | −$6.167 |
| Pagan 100% | −$1.123 | −$3.171 |
| Membresía de $20 | −$3.637 | −$5.201 |
| Membresía de $50 | −$2.041 | −$3.605 |
| Sin membresía | −$4.701 | −$6.265 |
| Sobre al mayor a $5,00 / a $6,00 | −$3.474 / −$2.736 | −$5.038 / −$4.300 |
| Periodo gratis de 1 mes / de 3 meses | −$2.941 / −$3.168 | −$4.425 / −$4.834 |
| 100% de los sobres a domicilio | −$2.315 | −$3.880 |
| 30% de los sobres a domicilio | −$3.421 | −$4.985 |
| 40% pagan y 10 familias a la vez | −$7.978 | −$9.038 |

**Conclusión:**

1. **La variable que tumba el modelo es el volumen de familias medidas que la red le entrega a cada ferretería.** Mueve a la vez el margen de los sobres y la razón para pagar la membresía. Para que el año 1 cierre en cero se necesitan unas **35 familias al mes por ferretería con el sobre a $2,94 y unas 56 con $4,00**; el base supone 20. La ferretería recupera la membresía con 5 familias, así que la membresía por sí sola no frena la compra; lo que la frena es que lleguen pocas.
2. **La segunda es cuántas ferreterías entran**, y la tercera cuántas pagan al terminar el periodo gratis.
3. **El periodo gratis casi no mueve el resultado** (±$200), porque la ferretería en periodo gratis igual compra sobres. Puede ser de 3 meses sin costo importante.
4. **La diferencia entre $2,94 y $4,00 en el sobre vale unos $1.560 de caja al año en el base de 20 familias** ($3.100 en la meta de 40); el año 1 es negativo en las dos versiones.
5. **Llevar sobres al mostrador de la ferretería** sube el peso del lado empresa pero baja la caja del operador (cada sobre al mayor deja menos que uno a domicilio). Es una decisión de negocio que se toma sabiendo ese costo.
6. **Cómo crecer de 20 a 40 familias es el trabajo del piloto**, no una cifra que se pueda asegurar hoy (sección 0b).

---

## 9. Grimuca como comercio de Carabobo (con una advertencia de volumen)

Grimuca es el comercio de Carabobo y opera la red. Sus tres tiendas (Mañongo, Big Low y CC CEM) siguen con la economía del modelo anterior, que Tulio aportó y Business verificó (`modelo-v2-tres-tiendas.md`): 150 hogares al mes por tienda, 10 de cada 100 sobres compran filtro con 20% de margen, 30 compran cartuchos con 50% de margen y el recambio es cada 3 meses.

| Las tres tiendas propias, año 1 | Con $2,94 | Con $4,00 (estimación) |
|---|---|---|
| Caja al cierre, base | +$65.500 | unos +$60.300 |
| Caja al cierre, conservador | +$6.200 | unos +$3.600 |

El valor con $4,00 es una estimación de Business: $1,06 más por cada uno de los 4.860 y 2.430 sobres del año. Esas cifras son una hipótesis para el piloto de 1.000 sobres, no un resultado. **Advertencia (cifras reales, sección 0b):** esa proyección partía de 150 hogares por tienda al mes y llegaba a 639 juegos de cartuchos al mes en el mes 12, contra un volumen actual del orden de un centenar de cartuchos al mes entre las tres tiendas. Es una meta de crecimiento, no continuidad de lo que se vende hoy; no se recalculó aquí porque depende de una conversión de hogares medidos que aún no se ha medido. **No se suman a la red**: comparten el lote de sobres y el responsable de logística, y sumarlas contaría dos veces esos costos. En Carabobo, la asignación por cercanía vale para Grimuca y para cualquier ferretería aliada que entre.

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
5. Costo del sobre puesto en Venezuela: la base es $2,94 por decisión de Leonardo; que Tulio confirme el desglose (fábrica $1,94 y $1,00 de flete, aduana y empaque). El $4,00 queda como sensibilidad.
6. De los datos de Grimuca para logística ya llegaron inventario, ventas y rotación (sección 3). Siguen faltando: veces al mes que se pide una pieza que no hay, y entregas por semana con su costo. Además, la correspondencia entre las tiendas del sistema interno y las de la app, y qué marcas entran (hoy Grimuca vende otras marcas de agua además del catálogo de la app).
7. Si las ferreterías aliadas comprarían también filtros y cartuchos a Grimuca u Oasis (sería una cuarta línea de ingreso, fuera del cálculo).
8. Tarifa de SAMA y cobertura, costos de Cobrix, precios internos de Grimuca, catálogo completo y comisión de farmacias y supermercados (de la versión anterior; siguen pendientes).

**Para Leonardo:** si se prefiere llevar más sobres al mostrador de la ferretería aunque baje la caja del operador.

---

## 13. Riesgos

| Riesgo | Qué pasa | Qué se hace |
|---|---|---|
| Volumen proyectado muy por encima de lo que Grimuca vende hoy | La meta de 40 familias por ferretería y los 639 juegos del modelo anterior son varias veces la venta actual; el año 1 no se paga | El base usa 20 familias y la meta queda declarada como meta (sección 0b); el piloto mide cuántas familias llegan antes de prometer más |
| Pocas familias medidas por ferretería | La ferretería no recupera la membresía y no renueva | Medir en el piloto cuántas familias llegan por zona; asignar a las ferreterías primero donde hay más hogares |
| Ninguna ferretería ha pagado | La membresía es un supuesto | Periodo gratis de 1 a 3 meses; primer cobro solo después de que la ferretería vea sus primeras familias |
| La ferretería se queda con la familia y deja de pagar | Pérdida de la membresía | La asignación y la fecha de recambio viven en la plataforma; el plan premium y la comisión crecen con el uso |
| Grimuca es operador y comercio a la vez | Desconfianza de una ferretería aliada en Carabobo | Regla de asignación por cercanía y por existencias, visible en el panel (en la demo la asignación por distancia real queda fuera) |
| La tira falla o se lee mal | Reposición del sobre | La app no adivina: pide repetir la foto o cargar los colores a mano |
| Afirmaciones sobre salud | Riesgo legal y de confianza | Medición orientativa; aviso fijo; plomo y cobre "posible presencia, confirma con un laboratorio" |
| Permisos para importar y vender pruebas de agua | Sin fuente verificada | Confirmar con el abogado antes de vender sobres al mayor |
| Costo del sobre sube a $4,00 (sensibilidad) | La caja del año 1 base baja de −$3.105 a −$4.669 y la meta de 40 familias pasa de +$1.094 a −$2.035 | Confirmar el desglose con Tulio; subir el precio al mayor o la membresía |

---

## 14. Fuentes

- Correos de Tulio, sáb 21 nov, 8:12, 8:38, 8:49 y 8:52 p.m.: `insumos-tulio/`.
- Decisión de la red de comercios: `docs/decisiones/contrato-red.md`.
- Modelo anterior con cuentas verificadas: `docs/negocio/modelo-v2-tres-tiendas.md` y `auditoria-asesor.md`.
- Precios de referencia (consultados por Tulio, no son precios de Grimuca): Oasis en Mundo JAB (ultrafiltración $119,99; ósmosis $329,99; kit de 3 cartuchos $18,99). Frasco y tira: Shenzhen Hongyi y HORYZON, en Alibaba.
- Fuentes públicas: OVSP vía El Diario (9 abr 2022); ENCOVI 2025 (UCAB); Kantar Worldpanel (2018); Revista Mercado (19 ago 2026); Global Market Insights.
- Dato de Grimuca (ventas de tres tiendas e inventario del gestor interno, 90 días al 21 nov 2026): sección 3 y sección 0b, solo en proporciones y órdenes de magnitud.
- Sin fuente (SUPUESTO): todo lo marcado así en la sección 6, el volumen de 20 y 10 familias por ferretería, y los 35 días de inventario de la sección 3. Se retiró el capital de trabajo del piloto de $15.000 a $20.000 y el ejemplo de 90 días de rotación.
