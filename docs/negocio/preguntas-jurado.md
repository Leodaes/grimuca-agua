# Preguntas probables del jurado · Grimuca Agua

**Versión 4.2 · domingo 22 nov 2026 · red de ferreterías, con cifras reales de Grimuca (en proporciones)**

**Supuesto de costo del sobre: $4,00 (variante $2,94: ver nota)**. Todas las respuestas usan $4,00 como base. Nota de variante, lo que cambia con $2,94: aporte por ferretería $87 en vez de $66; ferreterías para cubrir los fijos 6 en vez de 7 (4 en vez de 5 en la meta de 40 familias; 10 en vez de 12 en el conservador); margen del sobre a domicilio $3,38 en vez de $2,38; caja del año 1, base −$3.105 en vez de −$4.669, conservador −$8.909 en vez de −$9.969, meta +$1.094 en vez de −$2.035; con 10 familias −$5.975 en vez de −$7.035; familias para cerrar en cero 35 en vez de 56.

**Lema del cliente final:** "Saber qué tomas empieza en casa". **Frase para el lado empresa (propuesta):** "Clientes que llegan sabiendo qué necesitan".

Los números salen de `docs/negocio/modelo.md`. Cada cifra lleva su origen: **Tulio**, **Asesoría** (se dijo en una de las dos asesorías, sin documento), **referencia de mercado** (precio público, no de Grimuca), **SUPUESTO** (de Business, pendiente de Tulio) o **cálculo** de Business. Si el jurado pregunta, se dice así, sin adornarlo. Esto es un negocio de largo plazo; para el hackatón hay una demo con datos sembrados y comercios de demostración rotulados.

---

## Las preguntas de fondo

**1. ¿Por qué pagaría una ferretería?**
Porque recibe familias ya medidas, con su necesidad identificada, y en la demo ve su inventario contra demanda. Con 20 familias asignadas al mes, la ferretería gana unos $140 de margen entre filtros, cartuchos y sobres y paga $30 de membresía (cálculo; las 20 familias y los $30 son SUPUESTO, los márgenes de 20% y 50% son de Tulio; con las 40 de la meta serían unos $280). Recupera la membresía con 5 familias al mes.

**2. ¿Qué impide que la ferretería lo haga sola?**
Una ferretería sola no lee la tira por foto, no tiene el perfil del hogar ni llega a las familias de su zona que todavía no la conocen. Lo que vendemos es ese flujo de familias medidas y la fecha de cada recambio; el margen de producto se lo queda la ferretería.

**3. ¿Quién es el cliente, la familia o la ferretería?**
Las dos. La familia entra por la medición y paga $9 (Tulio); la ferretería paga la membresía cada mes y compra sobres al mayor. Con la membresía a $30 y 20 familias, el lado empresa (membresía y mayor) es el 64% del aporte por ferretería con el sobre a $4,00 (61% con $2,94; cálculo).

**4. ¿Cuál es el problema logístico y cuánto le ahorran a la industria?**
Porque hoy se compra, se almacena y se despacha a ciegas, y los datos reales de Grimuca lo muestran en proporciones (dato de Grimuca, 90 días al 21 nov 2026, tres tiendas): el surtido de agua está disperso y la venta concentrada. Una de cada tres referencias casi no se mueve, una sola referencia hace la mitad de la venta de cartuchos, el inventario de agua alcanza para más de dos meses de venta y hay referencias en existencia cero mientras otras sobran. Con la fecha del último cambio de cada cartucho cambian tres cosas: se compra contra fechas de recambio conocidas, así que el inventario se concentra en lo que se va a vender; los quiebres se ven antes, en el panel de 7 y 30 días; y las entregas y visitas técnicas se agrupan por urbanización: con los datos de demostración, 15 entregas en 3 rutas contra 15 viajes sueltos son 51,9 km contra 110,9 km, 53% menos (cálculo sobre datos de demostración, no un ahorro medido). Hay que ser francos con el tamaño: en dólares el inventario de agua de una ferretería es pequeño; el valor está en no perder ventas por faltantes, no inmovilizar surtido que no rota y agrupar entregas. No afirmamos un ahorro de industria: faltan datos de cuántas veces se pide una pieza que no hay y de cuántas entregas se hacen y a qué costo. Como ilustración, SUPUESTO nuestro: si comprar contra recambios conocidos baja el inventario de unos 70 a unos 35 días de venta, el dinero parado se reduce a la mitad (cálculo, modelo sección 3).

**5. ¿Por qué es logística?**
Porque resolvemos qué se despacha, cuándo y desde dónde. La medición asigna el pedido al comercio más cercano que tiene el producto, el despacho se ve en vivo, el inventario se compra contra demanda prevista y la última milla la hacen operadores que ya tienen red. Un hogar con botellón mueve 2.370 a 2.844 kg al año en 24 viajes (estimación de Tulio, pesos SUPUESTOS) y con filtro unos 6 kg en 5 viajes.

**6. ¿Cómo escalan a otros estados?**
Grimuca es el comercio de Carabobo y opera la red; en cada estado entra una ferretería aliada, y con una por estado ese estado queda cubierto. Sumar una ferretería cuesta unos $100 de visita, material y muestras (SUPUESTO), y con 7 pagando se cubren los costos fijos de la red en el base, 5 en la meta de 40 familias (cálculo con el sobre a $4,00, SUPUESTOS). Los comercios de Lara y Aragua de la demo son de demostración.

**7. ¿Qué pasa si la tira falla?**
La app no adivina: dice que no pudo leer y pide repetir la foto o cargar los colores a mano junto a la tabla impresa. Si el sobre llegó dañado se repone, y el resultado siempre se presenta como medición orientativa que no certifica el agua.

**8. ¿Cómo ganan dinero?**
Con tres líneas: el sobre de $9 al cliente final (Tulio), la membresía de la ferretería, de $30 al mes con 1 a 3 meses gratis (SUPUESTO, rango $20 a $50), y los sobres al mayor a $5,50 (SUPUESTO, rango $5,00 a $6,00). Cada ferretería a volumen completo deja a la red unos $66 al mes con el sobre a $4,00 y 20 familias (cálculo; $103 en la meta de 40; $87 y $144 si el sobre fuera $2,94).

**9. ¿Cuál es el punto de equilibrio?**
Con $450 al mes de costos fijos de la red (SUPUESTO) y el sobre a $4,00, 7 ferreterías pagando en el escenario base (20 familias por ferretería) y 12 en el conservador (10 familias); en la meta de 40 familias serían 5 (con $2,94: 6, 10 y 4). Solo con la membresía harían falta 15 (cálculo).

**10. ¿Cuántas ferreterías tienen hoy?**
Una: Grimuca, con tres tiendas en Carabobo. Los comercios de Lara y Aragua de la demo son de demostración. El modelo supone 20 ferreterías nuevas en el año base y 10 en el conservador (SUPUESTO), y las primeras salen de las que Tulio ya conoce.

**11. ¿Cuánto cuesta el sobre?**
Trabajamos con $4,00 puesto en Venezuela, el escenario prudente (asesoría, sin desglose); con él el sobre de $9 deja $2,38 a domicilio. Hay una variante de $2,94 (fábrica $1,94 de Tulio más $1,00 de importación y empaque, SUPUESTO) que lo deja en $3,38 y mejora la caja de la red del año 1 en la meta de 40 familias de −$2.035 a +$1.094. La cifra definitiva la confirma el primer lote.

**12. ¿La medición no es solo un gancho?**
Es la entrada y genera la señal; los ingresos grandes están del lado de la ferretería. Con el modelo actual, la membresía y el sobre al mayor suman cerca de dos tercios del aporte por ferretería a volumen completo (64% con el sobre a $4,00; 61% con $2,94), y esa proporción sube a 75% si más sobres se venden en el mostrador de la ferretería (cálculo).

**13. ¿Certifican el agua?**
No. La app nunca certifica: cada resultado dice que es una orientación, no un análisis de laboratorio, y que no certifica que el agua sea apta para tomar. La prueba de bacterias tampoco certifica, salga como salga. Con plomo o cobre dice "posible presencia, confirma con un laboratorio".

**14. ¿Cómo es el flujo de caja?**
El de la red en el año 1 es de inversión, con el sobre a $4,00: base −$4.669, conservador −$9.969 y meta de 40 familias −$2.035 (con $2,94: −$3.105, −$8.909 y +$1.094). La operación mensual pasa a positivo en el mes 6 (base) y en el conservador no lo hace dentro del año, y el capital que hay que poner es de $6.100 a $10.000 según el escenario (cálculo). Las tres tiendas propias de Carabobo se calculan aparte: +$65.500 en el base del modelo anterior (hipótesis de Tulio, sin venta real).

**15. ¿Quién asegura que Grimuca no se queda con los mejores clientes, si es comercio y operador a la vez?**
La asignación va por cercanía y por existencias, y esa regla se muestra en el panel de cada comercio. En la demo la asignación es sembrada; la asignación por distancia real queda como siguiente paso.

**16. ¿Quiénes son los aliados?**
SAMA Logística 3 para la última milla en Valencia, Cobrix para pagos, Oasis como proveedor y técnicos para instalar, con el 30% para Grimuca (Tulio). Tarifas de SAMA y Cobrix por confirmar; en otros estados todavía no hay operador de última milla confirmado.

**17. ¿Qué riesgos legales ven?**
Tres: lo que se afirma sobre salud, los datos personales del hogar y los permisos para importar y vender pruebas de agua al mayor. Los dos primeros están resueltos en la app (aviso fijo, consentimiento y aviso de privacidad) y el tercero se confirma con abogado antes de vender sobres a las ferreterías.

**18. ¿Qué tan firmes son esos números?**
De Tulio: el sobre de $9, el costo de fábrica, la conversión, los márgenes de 20% y 50% y los pagos al almacenista y al técnico. SUPUESTOS: la membresía, el precio al mayor, cuántas ferreterías entran, cuántas pagan al terminar el periodo gratis, el volumen por ferretería, el envío, la pasarela y los fijos. La demo no cobra nada y no hay ventas todavía.

---

## Las más incómodas

**19. Ninguna ferretería ha pagado todavía. ¿Por qué creerles?**
No hay ninguna, y la membresía de $30 y el 70% de permanencia son supuestos nuestros. Por eso el periodo gratis es de 1 a 3 meses, el primer cobro llega después de que la ferretería vea sus primeras familias, y el modelo trae un escenario conservador con 40% de permanencia y 10 familias por ferretería (año 1 de −$9.969 con el sobre a $4,00). El siguiente paso con fecha es una reunión de 20 minutos con la primera ferretería en la semana del 26 de noviembre.

**20. ¿Qué impide que la ferretería se quede con la familia y deje de pagar?**
Nada la obliga, y lo que sostiene el pago es que la plataforma le sigue entregando familias nuevas ya medidas y fechas de recambio con anticipación. Las familias asignadas son 20 al mes por ferretería en el base (40 es la meta), y si bajan a 10 la membresía de $20 pesa el 45% del margen de la ferretería (unos $44 al mes, con la mitad de la conversión de Tulio) y el año 1 de la red pasa de −$4.669 a −$7.035 con el sobre a $4,00. La comisión por transacción y el plan premium crecen con el uso.

**21. Su propio flujo dice que la red sola no recupera la inversión en el año 1. ¿Por qué es un buen negocio?**
Porque cada ferretería ya deja un aporte positivo a partir de su tercer mes y el flujo mensual de la operación es positivo desde el mes 6 en el base. Pero hay que decirlo claro: con el volumen real de hoy el año 1 de la red cierra en negativo (−$4.669 en el base de 20 familias y −$9.969 en el conservador, con el sobre a $4,00), así que es una inversión de unos $7.000 a $10.000 (cálculo, SUPUESTOS; con $2,94 serían −$3.105 y −$8.909). La red necesita 7 ferreterías pagando para cubrir sus $450 al mes, y con una por estado (23) el aporte sería de unos $1.075 al mes. La variable que lo tumba es el volumen de familias medidas por ferretería: con 56 al mes el año 1 cierra en cero (35 con $2,94), y el base supone 20.

**22. ¿Su proyección no es demasiado optimista frente a lo que vende hoy la ferretería?**
Sí, y por eso la bajamos. El modelo anterior de las tres tiendas proyectaba hasta 639 juegos de cartuchos al mes, y hoy Grimuca vende del orden de un centenar de cartuchos al mes entre las tres tiendas (dato de Grimuca, 90 días al 21 nov 2026): esa proyección era varias veces la venta actual y es una meta de crecimiento, no continuidad. Recalculamos con 20 familias medidas por ferretería al mes en el base (antes 40) y 10 en el conservador: el punto de equilibrio pasa de 5 a 7 ferreterías pagando, y la caja de la red en el año 1 pasa de −$2.035 a −$4.669 con el sobre a $4,00 (cálculo, SUPUESTOS; el escenario de 40 se conserva como meta). Las familias adicionales saldrían de que cada comprador en el mostrador salga con un sobre, de los códigos QR y de las urbanizaciones donde el mapa muestra resultados fuera de rango; es una hipótesis que el piloto debe medir, y si llegan menos de 10 al mes, el modelo cae al conservador.

---

## Si preguntan por una cifra, de dónde sale

| Cifra | Origen |
|---|---|
| $9 el sobre; $1,54 a $2,04 de costo en fábrica | Tulio (frasco $2,00, $1,90 o $1,50 según volumen; tira ~$0,04) |
| 10, 30 y 60 de cada 100 sobres | Tulio |
| 20% de margen del filtro; 50% y cada 3 meses en cartuchos | Tulio (por confirmar) |
| $119,99 / $329,99 / $18,99 | Referencia de mercado (Oasis, Mundo JAB), no de Grimuca |
| Técnico: $40 a $60 y $30, Grimuca 30% | Tulio |
| 5 a 6 botellones por quincena, $2 o $4, hasta $576 al año | Tulio (estimación suya) |
| $4,00 el sobre puesto en Venezuela (base) | Asesoría, sin desglose |
| $2,94 el sobre puesto en Venezuela (variante) | Fábrica $1,94 (Tulio) + $1,00 de importación y empaque (SUPUESTO) |
| $30 de membresía; $5,50 al mayor | SUPUESTO de Business |
| 20 familias por ferretería en el base, 10 en el conservador, 40 como meta; 20 ferreterías base y 10 conservador; 70% y 40% pagan; fijos de la red $450 | SUPUESTO de Business (el volumen bajó por la realidad de ventas, `modelo.md` sección 0b) |
| $140 de margen mensual de la ferretería; $66 de aporte a la red y 7 ferreterías con el sobre a $4,00 ($87 y 6 con $2,94; $280, $103 y 5 en la meta de 40 familias) | Cálculo de Business con lo anterior (`modelo.md`) |
| 15 entregas en 3 rutas contra 15 viajes sueltos, 51,9 km contra 110,9 km (53% menos) | Cálculo sobre los datos de demostración de la app, no dato de operación real |
| Una de cada tres referencias casi no se mueve; una sola hace la mitad de la venta de cartuchos; inventario para más de dos meses | Dato de Grimuca, 90 días al 21 nov 2026 (proporciones; clasificación aproximada por palabras de la descripción) |
| Bajar el inventario de unos 70 a unos 35 días de venta | SUPUESTO de Business (`modelo.md` sección 3) |
| 99,8% menos kilos | Botellón de Tulio y pesos SUPUESTOS |
| 84,3% República Dominicana; 98% México; $2.500 millones | ONE, Censo 2022; Kantar Worldpanel, 2017; Global Market Insights, 2025 |
