# Guion de la demo · 3 minutos

Versión 5 (22 nov, madrugada), corregida tras el ensayo cronometrado de Calidad contra `agua.oydo.app` (`pruebas/e2e/09-ensayo-demo.spec.ts`, informe en `docs/calidad/ensayo/informe.md`). Enfoque B2B2C: la demo **abre en el lado empresa** (la Red y el panel de un comercio) y usa el teléfono del cliente como "así llega el dato". Un solo pedido recorre los cuatro módulos. Ensayo técnico: domingo 3:30 p.m.

**Quién hace qué**
- **Tulio** abre, narra el momento clave y cierra (negocio y modelo).
- **Leonardo** maneja la laptop y el teléfono del cliente y narra lo que toca.
- **Teléfono del técnico:** un segundo teléfono, en manos de Tulio, con `/tecnico` abierto. Tulio marca "Ya fui" cuando Leonardo se lo indica.

**Qué se ve**
- **Laptop (proyector):** `/red` al inicio, luego `/comercio` (Grimuca, tienda Mañongo), luego la lámina de cierre. Dos pestañas abiertas y ya con la sesión iniciada con su PIN (los PIN no van escritos en este documento).
- **Teléfono del cliente:** `agua.oydo.app` en `/`, ya con el perfil de la familia (se ve el tablero "Hola, …" con "Medir mi agua"). Si se puede duplicar la pantalla en el proyector, mitad y mitad con la laptop; si no, Leonardo lo muestra en alto.

**El momento clave:** minuto 1:35. El pedido hecho en el teléfono aparece en el despacho del comercio sin que nadie toque la laptop. Pausa de dos segundos en silencio. En el ensayo tardó **1,0 s** desde "Hacer pedido".

**Pilares del jurado:** modelo de negocio (bloques 1 y 7), producto (2 y 3), calidad técnica (4, en vivo), innovación y logística (2, 4, 5 y 6).

**Tiempos de la app:** los segundos marcados "App medida" son lo que tardó el sitio publicado en el ensayo del 22 nov, 4:00 a.m. (laptop 1366×768, teléfono 375×812, buena conexión). No incluyen lo que se habla ni lo que tarda la mano en tocar o escribir.

---

## Antes de subir

- Laptop: pestaña 1 en `/red` con la sesión de superadmin; pestaña 2 en `/comercio` con la sesión de Grimuca, en **Despacho**, con el chip de tienda **Mañongo** marcado. Despacho **no está vacío**: trae los pedidos pendientes de la semilla (11 en Mañongo en el ensayo); lo que importa es que el pedido de la demo todavía no esté. Si quedó un "Nuevos: N" de un ensayo, tocar "Marcar vistos". Deck en otra ventana, en la lámina 3. Entrar con PIN tarda 1 a 2 s por módulo.
- Teléfono del cliente: con el perfil **ya llenado** de una familia inventada de 4 en Naguanagua, urbanización El Naranjal, con un filtro de 3 vasos registrado ("Cárgalo a mano" → "Tres vasos"). Ningún dato real. Al abrir `/` se ve el tablero con "Medir mi agua" (con perfil ya no aparece "Ya tengo mi sobre"). Brillo al máximo, sin notificaciones, con datos móviles listos.
- **Un sobre físico** con su QR a la vista y la tira ya mojada junto a la tabla de colores, sobre una hoja blanca con buena luz. Una foto buena de esa tira guardada en el teléfono (sirve `docs/calibracion/tira-ejemplo.jpg`: se lee en unos 7 s y da Nitrato en Rojo, Dureza en Amarillo y 6 en Verde). El QR del sobre abre la app y el video de cómo se hace; **la app no escanea el QR por dentro**, así que en tarima no se escanea.
- Una dirección inventada corta lista para escribir (por ejemplo "Calle 3, casa 12, El Naranjal").
- Teléfono del técnico: `/tecnico` con la sesión abierta, en "Pendientes" (la semilla trae 3) y una foto de un filtro ya instalado guardada en la galería.
- **Verificado en el ensayo:** el cliente sí puede pedir un técnico desde la app ("¿No sabes hacerlo? Contrata a un experto", en la pantalla del pedido).
- Video de respaldo abierto y en pausa en la laptop. Capturas y videos del ensayo en `docs/calidad/ensayo/respaldo/` (ver su `LEEME.md`).

---

## Guion cronometrado

### Bloque 1 · 0:00 a 0:25 · La Red: comercios y cobertura
- **Habla:** Tulio.
- **Laptop:** `/red`. Lista de comercios con su plan y el estado de su membresía (Grimuca "Activa", Aliado Lara "Periodo gratis: quedan N días", Aliado Aragua "Vencida"); cifras de toda la red (comercios, estados cubiertos, tiendas, hogares, mediciones del mes, pedidos del mes).
- **Teléfono:** guardado.
- **App medida:** 0 s con la pestaña ya abierta (0,4 s si hay que recargarla).

> **Tulio:** "Una ferretería compra, almacena y despacha repuestos a ciegas, porque nadie sabe cuándo se le acaba el cartucho a cada casa. Grimuca opera una red de ferreterías que recibe clientes ya medidos. Esta es la Red: Grimuca en Carabobo y dos comercios de demostración en otros estados, cada uno con su plan y su membresía: activa, en periodo gratis o vencida. Con una ferretería por estado, ese estado queda cubierto. Esto lo vamos a ejecutar a largo plazo; hoy es una demo."

### Bloque 2 · 0:25 a 0:50 · El comercio: despacho, inventario, mapa y ruta
- **Habla:** Leonardo.
- **Laptop:** pestaña `/comercio` de Grimuca, chip Mañongo. Despacho (los pendientes del día) → **Inventario** (insignias "Faltan N" en rojo y "Faltan N cartuchos en Mañongo para cubrir los próximos 30 días") → **Zonas** (botón "Mapa", vista "Calidad del agua"; "Urbanizaciones en alerta") → **Rutas** ("1 ruta por tienda contra N viajes sueltos", "Ahorro (53 %)"). La pestaña Productos queda fuera (es lo primero que se recorta).
- **Teléfono:** guardado.
- **App medida:** Despacho 0,1 s · Inventario 0,2 s · Zonas 0,7 s (el fondo del mapa, 0,4 s) · Rutas 0,7 s · Productos 0,2 s si se muestra. Total 1,7 s.

> **Leonardo:** "Así ve su día una ferretería. En Despacho, lo que tiene por entregar. En Inventario ve, en rojo, lo que le va a faltar en los próximos treinta días, y en Zonas, el mapa de las urbanizaciones con más resultados fuera de rango. Así desaparece el pedido sorpresa. Grimuca reparte su surtido de agua entre tres tiendas: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos. Con la fecha de cada recambio se compra lo que se va a vender, los quiebres se ven antes y, en Rutas, las entregas salen agrupadas por urbanización: una ruta en vez de viajes sueltos. Ahora vean cómo le llega el dato."

### Bloque 3 · 0:50 a 1:35 · El teléfono del cliente: mide, entiende y pide
- **Habla:** Leonardo.
- **Laptop:** `/comercio`, Despacho quieto (chip Mañongo).
- **Teléfono:** tablero → "Medir mi agua" → "Tomar la foto" de la tira real, o "Elegir una foto del teléfono" con la foto guardada → "¿Se ve bien?" → "Leer mi tira" ("Leyendo tu tira…") → resultado: "1 en Rojo · 1 en Amarillo · 6 en Verde", el aviso fijo y "Tu agua, casilla por casilla" → tarjeta "La mejor opción para tu casa" con "Por qué te lo recomendamos" → "Agregar a mi lista" → "Mi lista" (barra de abajo) → "Envío a mi dirección" y se escribe la dirección inventada → "Hacer pedido" → "Listo, tu pedido ya está en la tienda".
- **App medida:** "Medir mi agua" ~1 s · lectura de la foto **7,2 s** (Leonardo habla encima) · resultado al instante · agregar, Mi lista y "Hacer pedido" 0,5 s. Total 8,7 s. Escribir la dirección: unos 10 s de mano.
- **Ojo:** con el filtro de 3 vasos, la primera recomendación es un cartucho de sedimentos que se explica por "Dureza en Amarillo" y "Ya te toca el cambio", no por el Nitrato en Rojo (el equipo que atiende el nitrato, la ósmosis inversa, sale más abajo). Leonardo no promete que el cartucho corrige el rojo.

> **Leonardo:** "Una familia compra el sobre de nueve dólares; el QR del sobre la trae a la app. Le toma una foto a la tira junto a la tabla y la app le dice, casilla por casilla, Verde, Amarillo o Rojo, y qué mide cada una. Siempre avisa que la tira no mide todo. Con ese resultado y lo que contó de su casa, le explica por qué le recomienda este cartucho. Lo pide con envío, y el pedido le llega a la ferretería de su zona."

### Bloque 4 · 1:35 a 1:55 · MOMENTO CLAVE: el pedido aparece en el comercio
- **Habla:** Tulio.
- **Laptop:** ya está en `/comercio`, Despacho. El pedido nuevo aparece arriba de Mañongo con la etiqueta "Nuevo", sin recargar, y la pestaña pasa a "Despacho (1 nuevos)". Leonardo levanta las manos del teclado. Después toca "Despachado".
- **Teléfono:** pedido confirmado, en alto.
- **App medida:** el pedido aparece **1,0 s** después de "Hacer pedido". La pestaña Rutas, si está abierta, ya lo incluye a los 2,5 s como máximo (de 15 a 16 entregas). "Despachado": 0,1 s.

> **Tulio:** "Miren la laptop. *(pausa de dos segundos)* Nadie la tocó: el pedido llegó solo al comercio, con el cartucho, la casa y la dirección de entrega. La ferretería ya sabe qué preparar y para qué casa."

### Bloque 5 · 1:55 a 2:25 · El técnico: "Ya fui" con foto
- **Habla:** Leonardo.
- **Teléfono del cliente:** en "Tu pedido", "¿No sabes hacerlo? Contrata a un experto" → ya viene marcado "Cambiar el cartucho", la fecha de mañana y la dirección del envío → "Pedir el servicio".
- **Teléfono del técnico (Tulio):** el servicio aparece solo en "Pendientes" con el aviso "Servicio nuevo", **al final de la lista** (Tulio baja hasta él). Tulio toca "Ya fui", sube la foto ("Sube una foto de cómo quedó") y toca "Guardar reporte"; el servicio pasa a "Atendidos".
- **Laptop:** `/comercio`, al pie de Despacho, "Reportes del técnico" → "Ver reporte": la visita, la nota y la foto.
- **App medida:** pedir el servicio 0,7 s · llega al técnico 0,3 s (0,4 s desde que el cliente lo pidió) · "Ya fui" y "Guardar reporte" 1,1 s · el reporte con la foto en el comercio 0,6 s, sin recargar. Total 2,7 s.

> **Leonardo:** "La familia pide que le cambien el cartucho. Se asigna a un técnico de la ferretería, y aquí lo ve en su teléfono. *(Tulio toca "Ya fui", sube la foto y guarda)* El técnico marca que fue y sube una foto de cómo quedó. El comercio ve el reporte y no necesita llamarlo."

### Bloque 6 · 2:25 a 2:40 · La Red refleja la actividad
- **Habla:** Leonardo.
- **Laptop:** pestaña `/red`, sin recargar: "Mediciones del mes" sube en 1 y "Pedidos del mes" en 2 (el cartucho y el servicio); abajo, "Actividad de la red" con cada paso (medición nueva, pedido nuevo, despachado, servicio atendido). Los pendientes de Grimuca vuelven al mismo número porque los dos pedidos ya se cerraron. "Hogares" no sube en vivo (solo al recargar): no se menciona.
- **App medida:** 0 s (ya estaba actualizada al cambiar de pestaña).

> **Leonardo:** "Y la Red lo refleja: la medición y los dos pedidos ya suben en las cifras del mes, y la actividad muestra cada paso."

### Bloque 7 · 2:40 a 3:00 · El modelo y el cierre
- **Habla:** Tulio.
- **Laptop:** lámina 5 (modelo) y luego lámina 6 con el lema y `agua.oydo.app`.
- **Teléfono:** guardado.
- **App medida:** no aplica (láminas).

> **Tulio:** "Tenemos tres líneas de ingreso: el sobre de nueve dólares a la familia, una membresía mensual de la ferretería, que suponemos en treinta dólares, y los sobres que les vendemos al mayor. Con cuatro o cinco ferreterías pagando cubrimos los costos de la red; son supuestos que el piloto confirma. Para la familia: saber qué tomas empieza en casa. Para la ferretería: clientes que llegan sabiendo qué necesitan."

---

## Resumen de tiempos

| Bloque | Tiempo | Habla | Pantalla | App medida | Estimado real (habla + manos) |
|---|---|---|---|---|---|
| 1. La Red | 0:00 – 0:25 | Tulio | Laptop `/red` | 0 s | ≈ 33 s (82 palabras) |
| 2. Comercio | 0:25 – 0:50 | Leonardo | Laptop `/comercio` | 1,7 s | ≈ 48 s (119 palabras) |
| 3. Cliente | 0:50 – 1:35 | Leonardo | Teléfono del cliente | 8,7 s | ≈ 46 s (86 palabras + foto y dirección) |
| 4. **Momento clave** | 1:35 – 1:55 | Tulio | Laptop `/comercio`, el pedido aparece | 1,1 s | ≈ 16 s (32 palabras + pausa) |
| 5. Técnico | 1:55 – 2:25 | Leonardo | Teléfono del técnico y laptop | 2,7 s | ≈ 28 s (44 palabras + foto) |
| 6. La Red refleja | 2:25 – 2:40 | Leonardo | Laptop `/red` | 0 s | ≈ 10 s (24 palabras) |
| 7. Modelo y cierre | 2:40 – 3:00 | Tulio | Láminas 5 y 6 | — | ≈ 27 s (68 palabras) |
| **Total** | **3:00** | | | **≈ 14 s** | **≈ 3:28** |

**Total estimado: unas 3:28, se pasa unos 28 segundos.** La app no es el problema (unos 14 s en todo el recorrido, casi todos los 7 s de la lectura de la foto, que se tapan hablando): son unas 455 palabras habladas a 150 por minuto, más unos 15 s de manos que no se pueden tapar (escribir la dirección, elegir las fotos). Es una estimación: el habla no se cronometró en el ensayo automático. Se ensaya con cronómetro.

**Qué recortar del habla, en este orden (≈ 30 s):**
1. Bloque 2: quitar "Grimuca reparte su surtido de agua entre tres tiendas: una de cada tres referencias casi no se mueve y una sola hace la mitad de la venta de cartuchos." (−12 s). Con eso el bloque 2 baja a unos 36 s.
2. Bloque 1: quitar "Esto lo vamos a ejecutar a largo plazo; hoy es una demo." (−5 s). Ya se dijo "comercios de demostración".
3. Bloque 7: quitar "Con cuatro o cinco ferreterías pagando cubrimos los costos de la red; son supuestos que el piloto confirma." (−7 s). Si el jurado pregunta, se responde con la frase de "Si preguntan por el precio".
4. Bloque 3: no bajar por todo el resultado; se nombra "casilla por casilla" con la pantalla de arriba y se va directo a la tarjeta del porqué (−5 s).
5. Si todavía se pasa: en el bloque 2 no se abre Inventario; se nombra.

---

## Plan B si falla el internet

| Momento | Falla | Qué se hace | Qué se dice |
|---|---|---|---|
| Antes de empezar | No hay Wi-Fi | Laptop y los dos teléfonos pasan a datos móviles (zona de datos del teléfono de Tulio) | Nada |
| Bloque 1 a 3 | Una pantalla no carga | Esperar 5 segundos y recargar una vez; si no carga, pasar a la captura de esa pantalla (`docs/calidad/ensayo/respaldo/`, mismo número que el bloque) | "Les muestro la captura." |
| Bloque 2 | El mapa sale sin fondo | Seguir: sin internet para las teselas, Zonas y Rutas muestran los puntos y las rutas sobre fondo liso con el aviso "Sin mapa de fondo" | Nada |
| Bloque 3 | La cámara falla | "Elegir una foto del teléfono" con la foto guardada | "Uso la foto que tomé hace un rato." |
| Bloque 3 | La foto no se lee ("No pudimos leer bien la foto") o tarda más de 15 s | "Cargar los colores a mano" (o el enlace "¿No puedes tomar la foto? Carga los colores a mano") | "Lo cargo a mano, que es lo mismo." |
| Bloque 4 | El pedido no aparece en 5 segundos | Esperar 5 segundos más; recargar una vez | "Aquí está el pedido." |
| Bloque 5 | El técnico no sube la foto | Tulio toca "Ya fui" y "Guardar reporte" sin foto, y Leonardo muestra la foto guardada del reporte sembrado | "Aquí el reporte de una visita anterior." |
| Cualquier bloque | Se cae todo (más de 10 segundos sin respuesta) | Video de respaldo en la laptop, Tulio narra encima, desde el bloque en que se cayó; si no hay video, las capturas y videos del ensayo en `docs/calidad/ensayo/respaldo/` | "Les mostramos la grabación de esta mañana." |

Sin internet no hay demo en vivo: la app y el panel viven en `agua.oydo.app`. Por eso el video de respaldo cubre los cuatro módulos y está copiado en la laptop y en el teléfono.

## Si preguntan por el precio

"La membresía y el precio al mayor son supuestos nuestros, y el piloto los confirma. En la demo no se cobra nada. El precio del producto lo confirma la tienda, con el resultado de la familia ya escrito en el mensaje."

## Lo que no se dice en tarima

- Nunca "potable", "segura" ni "apta para tomar" como afirmación; tampoco "agua de calidad" ni "permanente".
- Con plomo o cobre: "posible presencia, confirma con un laboratorio". La prueba de bacterias no certifica el agua, salga como salga.
- Nada de miedo: ni niños enfermos ni hospitales. El problema se cuenta con la carga de los botellones, el gasto y el repuesto que se compra sin saber.
- No se dice que el pago es real: es simulado y la pantalla lo rotula. Los comercios de Lara y Aragua son de demostración y no hay ferreterías aliadas reales todavía.
- No se dice que el sistema asigna el pedido "al comercio más cercano que lo tiene": hoy va a la tienda de la zona del hogar, sin revisar existencias (la asignación por distancia real está fuera de alcance).
- La membresía, el precio al mayor y el número de ferreterías se dicen siempre "supuesto". Si el jurado pregunta por un número que no tenemos: "Eso lo tenemos como estimado, no medido; para eso es el piloto."
- Cobrix y SAMA se nombran como aliados previstos, sin tarifas. No se nombra a competidores ni a marcas de botellón.
