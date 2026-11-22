# Preguntas probables del jurado · Grimuca Agua

**Versión 4 · sábado 21 nov 2026, noche · red de ferreterías**

**Lema del cliente final:** "Saber qué tomas empieza en casa". **Frase para el lado empresa (propuesta):** "Clientes que llegan sabiendo qué necesitan".

Los números salen de `docs/negocio/modelo.md`. Cada cifra lleva su origen: **Tulio**, **Asesoría** (se dijo en una de las dos asesorías, sin documento), **referencia de mercado** (precio público, no de Grimuca), **SUPUESTO** (de Business, pendiente de Tulio) o **cálculo** de Business. Si el jurado pregunta, se dice así, sin adornarlo. Esto es un negocio de largo plazo; para el hackatón hay una demo con datos sembrados y comercios de demostración rotulados.

---

## Las preguntas de fondo

**1. ¿Por qué pagaría una ferretería?**
Porque recibe familias ya medidas, con su necesidad identificada, y en la demo ve su inventario contra demanda. Con 40 familias asignadas al mes, la ferretería gana unos $280 de margen entre filtros, cartuchos y sobres y paga $30 de membresía (cálculo; las 40 familias y los $30 son SUPUESTO, los márgenes de 20% y 50% son de Tulio). Recupera la membresía con 5 familias al mes.

**2. ¿Qué impide que la ferretería lo haga sola?**
Una ferretería sola no lee la tira por foto, no tiene el perfil del hogar ni llega a las familias de su zona que todavía no la conocen. Lo que vendemos es ese flujo de familias medidas y la fecha de cada recambio; el margen de producto se lo queda la ferretería.

**3. ¿Quién es el cliente, la familia o la ferretería?**
Las dos. La familia entra por la medición y paga $9 (Tulio); la ferretería paga la membresía cada mes y compra sobres al mayor. Con la membresía a $30 y el sobre a $2,94, el lado empresa (membresía y mayor) es el 53% del margen por ferretería, y con el sobre a $4,00 el 54% (cálculo).

**4. ¿Cuál es el problema logístico y cuánto le ahorran a la industria?**
La ferretería compra, almacena y despacha repuestos a ciegas, porque nadie en la cadena conoce la fecha de cambio de cada cartucho. Con la medición y la fecha del último cambio desaparece el pedido sorpresa, y de ahí salen tres ahorros: compra al proveedor contra demanda prevista, asignación al comercio más cercano que tiene la pieza, y entregas y visitas técnicas agrupadas por urbanización y por semana. La cifra de industria es una sola y sale de supuestos: el piloto necesitaría $15.000 a $20.000 de inventario comprado por adelantado, contra unas dos semanas de cartuchos si se compra contra demanda prevista (SUPUESTO). Con datos reales de Grimuca la frase queda así: "Grimuca tiene $[DATO DE TULIO] en inventario de filtros y cartuchos, que rota cada [DATO DE TULIO] días; comprando contra demanda prevista baja a [CÁLCULO]". Como orden de magnitud, con 90 días de rotación (SUPUESTO) y 639 juegos de cartuchos al mes, el dinero parado baja de unos $18.200 a unos $2.800.

**5. ¿Por qué es logística?**
Porque resolvemos qué se despacha, cuándo y desde dónde. La medición asigna el pedido al comercio más cercano que tiene el producto, el despacho se ve en vivo, el inventario se compra contra demanda prevista y la última milla la hacen operadores que ya tienen red. Un hogar con botellón mueve 2.370 a 2.844 kg al año en 24 viajes (estimación de Tulio, pesos SUPUESTOS) y con filtro unos 6 kg en 5 viajes.

**6. ¿Cómo escalan a otros estados?**
Grimuca es el comercio de Carabobo y opera la red; en cada estado entra una ferretería aliada, y con una por estado ese estado queda cubierto. Sumar una ferretería cuesta unos $100 de visita, material y muestras (SUPUESTO), y con 4 a 5 pagando se cubren los costos fijos de la red (cálculo, SUPUESTOS). Los comercios de Lara y Aragua de la demo son de demostración.

**7. ¿Qué pasa si la tira falla?**
La app no adivina: dice que no pudo leer y pide repetir la foto o cargar los colores a mano junto a la tabla impresa. Si el sobre llegó dañado se repone, y el resultado siempre se presenta como medición orientativa que no certifica el agua.

**8. ¿Cómo ganan dinero?**
Con tres líneas: el sobre de $9 al cliente final (Tulio), la membresía de la ferretería, de $30 al mes con 1 a 3 meses gratis (SUPUESTO, rango $20 a $50), y los sobres al mayor a $5,50 (SUPUESTO, rango $5,00 a $6,00). Cada ferretería a volumen completo deja a la red $144 al mes con el sobre a $2,94 y $103 con $4,00 (cálculo).

**9. ¿Cuál es el punto de equilibrio?**
Con $450 al mes de costos fijos de la red (SUPUESTO), 4 ferreterías pagando con el sobre a $2,94 y 5 con $4,00 en el escenario base, y 6 u 8 en el conservador. Solo con la membresía harían falta 15 (cálculo).

**10. ¿Cuántas ferreterías tienen hoy?**
Una: Grimuca, con tres tiendas en Carabobo. Los comercios de Lara y Aragua de la demo son de demostración. El modelo supone 20 ferreterías nuevas en el año base y 10 en el conservador (SUPUESTO), y las primeras salen de las que Tulio ya conoce.

**11. ¿Cuánto cuesta el sobre?**
Hoy hay dos cifras sin resolver: $2,94 puesto en Venezuela en el modelo anterior (fábrica $1,94 de Tulio más $1,00 de importación y empaque, SUPUESTO) y $4,00 según la asesoría. Con $2,94 el sobre de $9 deja $3,38 a domicilio y con $4,00 deja $2,38, y la caja de la red en el año 1 base pasa de +$1.094 a −$2.035.

**12. ¿La medición no es solo un gancho?**
Es la entrada y genera la señal; los ingresos grandes están del lado de la ferretería. Con el modelo actual, la membresía y el sobre al mayor suman la mitad del margen del año 1 de la red, y esa proporción sube a 68% si más sobres se venden en el mostrador de la ferretería (cálculo).

**13. ¿Certifican el agua?**
No. La app nunca certifica: cada resultado dice que es una orientación, no un análisis de laboratorio, y que no certifica que el agua sea apta para tomar. Con plomo o cobre dice "posible presencia, confirma con un laboratorio".

**14. ¿Cómo es el flujo de caja?**
El de la red en el año 1 es de inversión: base +$1.094 con el sobre a $2,94 y −$2.035 con $4,00; conservador −$7.203 y −$8.263. La operación mensual pasa a positivo en el mes 4 (base) o en el 11 (conservador), y el capital que hay que poner es de $5.300 a $8.400 según el escenario (cálculo). Las tres tiendas propias de Carabobo se calculan aparte: +$65.500 en el base del modelo anterior (hipótesis de Tulio, sin venta real).

**15. ¿Quién asegura que Grimuca no se queda con los mejores clientes, si es comercio y operador a la vez?**
La asignación va por cercanía y por existencias, y esa regla se muestra en el panel de cada comercio. En la demo la asignación es sembrada; la asignación por distancia real queda como siguiente paso.

**16. ¿Quiénes son los aliados?**
SAMA Logística 3 para la última milla en Valencia, Cobrix para pagos, Oasis como proveedor y técnicos para instalar, con el 30% para Grimuca (Tulio). Tarifas de SAMA y Cobrix por confirmar; en otros estados todavía no hay operador de última milla confirmado.

**17. ¿Qué riesgos legales ven?**
Tres: lo que se afirma sobre salud, los datos personales del hogar y los permisos para importar y vender pruebas de agua al mayor. Los dos primeros están resueltos en la app (aviso fijo, consentimiento y aviso de privacidad) y el tercero se confirma con abogado antes de vender sobres a las ferreterías.

**18. ¿Qué tan firmes son esos números?**
De Tulio: el sobre de $9, el costo de fábrica, la conversión, los márgenes de 20% y 50% y los pagos al almacenista y al técnico. SUPUESTOS: la membresía, el precio al mayor, cuántas ferreterías entran, cuántas pagan al terminar el periodo gratis, el volumen por ferretería, el envío, la pasarela y los fijos. La demo no cobra nada y no hay ventas todavía.

---

## Las tres más incómodas

**19. Ninguna ferretería ha pagado todavía. ¿Por qué creerles?**
No hay ninguna, y la membresía de $30 y el 70% de permanencia son supuestos nuestros. Por eso el periodo gratis es de 1 a 3 meses, el primer cobro llega después de que la ferretería vea sus primeras familias, y el modelo trae un escenario conservador con 40% de permanencia (año 1 de −$7.203 a −$8.263). El siguiente paso con fecha es una reunión de 20 minutos con la primera ferretería en la semana del 26 de noviembre.

**20. ¿Qué impide que la ferretería se quede con la familia y deje de pagar?**
Nada la obliga, y lo que sostiene el pago es que la plataforma le sigue entregando familias nuevas ya medidas y fechas de recambio con anticipación. Las familias asignadas son 40 al mes por ferretería en el base, y si bajan a 20 la membresía de $20 pesa el 23% del margen de la ferretería (unos $88 al mes, con la mitad de la conversión de Tulio) y el año 1 con $30 de membresía de la red pasa de +$1.094 a −$3.105. La comisión por transacción y el plan premium crecen con el uso.

**21. Su propio flujo dice que la red sola no recupera la inversión en el año 1. ¿Por qué es un buen negocio?**
Porque cada ferretería ya deja un aporte positivo a partir de su tercer mes y el flujo mensual de la operación es positivo desde el mes 4 en el base. La red necesita 4 a 5 ferreterías pagando para cubrir sus $450 al mes, y con una por estado (23) el aporte sería de $1.910 a $2.857 al mes (cálculo, SUPUESTOS). La variable que lo tumba es el volumen de familias medidas por ferretería: con 35 a 55 al mes el año 1 cierra en cero, y la meta supuesta es 40.

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
| $2,94 el sobre puesto en Venezuela | Fábrica $1,94 (Tulio) + $1,00 de importación y empaque (SUPUESTO) |
| $4,00 el sobre puesto en Venezuela | Asesoría, sin desglose |
| $30 de membresía; $5,50 al mayor | SUPUESTO de Business |
| 40 familias por ferretería; 20 ferreterías base y 10 conservador; 70% y 40% pagan; fijos de la red $450 | SUPUESTO de Business |
| $280 de margen mensual de la ferretería; $144 y $103 de aporte a la red; 4 a 5 ferreterías | Cálculo de Business con lo anterior (`modelo.md`) |
| $15.000 a $20.000 de capital de trabajo del piloto; 90 días de rotación | SUPUESTO de Business (`auditoria-asesor.md`, `modelo.md` sección 3) |
| 99,8% menos kilos | Botellón de Tulio y pesos SUPUESTOS |
| 84,3% República Dominicana; 98% México; $2.500 millones | ONE, Censo 2022; Kantar Worldpanel, 2017; Global Market Insights, 2025 |
