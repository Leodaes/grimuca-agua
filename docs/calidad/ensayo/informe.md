# Informe del ensayo cronometrado de la demo

**Fecha:** domingo 22 nov, 3:57 y 3:59 a.m. (dos corridas; la segunda es la buena, todos los tramos en PASA).
**Contra:** `https://agua.oydo.app`, después del restablecimiento de datos de las 3:53 a.m.
**Cómo:** `pruebas/e2e/09-ensayo-demo.spec.ts`, el guion `docs/marketing/guion-demo.md` (versión 4) en su orden, con cuatro contextos: Red y Comercio Grimuca en laptop 1366×768, Cliente y Técnico en teléfono 375×812. Playwright, un proceso, `--reporter=line`.
**Qué se mide:** lo que tarda la app desde el toque hasta que se ve lo que el guion promete. No incluye lo que se habla ni lo que tarda una mano en tocar o escribir. Registro completo en `ensayo.json`.

## Veredicto

- **La app aguanta la demo:** 20 de 20 tramos pasan, sin errores en la consola de las páginas. El momento clave (el pedido llega a Despacho sin recargar) tarda **1,0 s**; la ruta se recalcula sola en ≤ 2,5 s; el técnico recibe el servicio en 0,4 s; la Red se actualiza sin recargar.
- **Lo que la app tarda en tarima: unos 14 s en total**, y 7,2 s son la lectura de la foto, que se tapan hablando.
- **La demo no cabe en 3:00 como está escrita:** estimado **≈ 3:28** (habla a 150 palabras por minuto más unos 15 s de manos). Con los recortes propuestos en el guion (≈ 30 s de habla) queda en unas 3:00. El exceso es del habla, no de la app.
- El guion tenía 13 diferencias con la app; están corregidas en la versión 5. Ninguna falla de la app rompe la demo; tres confunden.

## Tiempos por tramo (corrida de las 3:59 a.m.)

| Tramo | Bloque | Qué | App |
|---|---|---|---|
| 00 | Antes de subir | `/modulos` con las cuatro tarjetas | 0,9 s |
| 00b | Antes de subir | Entrar con PIN: Red 0,6 s · Comercio 1,4 s · Técnico 1,2 s | 3,2 s |
| 01 | 1 · La Red | `/red` con cifras y comercios (recarga; con la pestaña abierta, 0 s) | 0,4 s |
| 02a | 2 · Comercio | Despacho, chip Mañongo | 0,1 s |
| 02b | 2 · Comercio | Inventario con faltantes en rojo | 0,2 s |
| 02c | 2 · Comercio | Zonas, mapa real (teselas en 0,4 s) | 0,7 s |
| 02d | 2 · Comercio | Productos (80 filas) | 0,2 s |
| 02e | 2 · Comercio (agregado) | Rutas: 15 entregas, 3 rutas, ahorro 53 % | 0,7 s |
| 03a | 3 · Cliente (antes de subir) | Portada → "Ya tengo mi sobre" → perfil | 1,1 s |
| 03b | 3 · Cliente (antes de subir) | Perfil y filtro de 3 vasos → `/medir` | 1,3 s |
| 03c | 3 · Cliente | Foto `tira-ejemplo.jpg` → "Leer mi tira" → resultado | **7,2 s** |
| 03e | 3 · Cliente | Resultado con semáforo, aviso fijo y "Por qué te lo recomendamos" | 0,0 s |
| 03i | 3 · Cliente | "Agregar a mi lista" → "Mi lista" → envío → "Hacer pedido" | 0,5 s |
| 04a | 4 · Momento clave | El pedido aparece en Despacho, arriba, con "Nuevo", sin recargar | **1,0 s** |
| 04b | 4 · (agregado) | Rutas pasa de 15 a 16 entregas sola | ≤ 2,5 s desde "Hacer pedido" |
| 04c | 4 · Momento clave | "Despachado" | 0,1 s |
| 05a | 5 · Técnico | "Contrata a un experto" → "Pedir el servicio" (dirección ya escrita) | 0,7 s |
| 05c | 5 · Técnico | El servicio aparece en `/tecnico` sin recargar | 0,3 s |
| 05d | 5 · Técnico | "Ya fui" → foto → "Guardar reporte" → "Atendidos" | 1,1 s |
| 05f | 5 · Técnico | "Reportes del técnico" con la foto, sin recargar | 0,6 s |
| 06 | 6 · La Red refleja | Pedidos del mes +2, mediciones +1, actividad; sin recargar | 0,0 s |

**Por bloque del guion (app en tarima):** 1 → 0 s · 2 → 1,7 s (2,0 s con Productos) · 3 → 8,7 s · 4 → 1,1 s · 5 → 2,7 s · 6 → 0 s · 7 → láminas. **Total ≈ 14 s.** Con la corrida anterior (3:57 a.m.) los números son casi iguales (foto 7,3 s, pedido en Despacho 1,0 s).

La foto se leyó en 7,2 s (menos de 15 s), así que no hizo falta cronometrar la carga manual; queda en el plan B del guion.

## Total contra los 3 minutos

| Bloque | Previsto | Estimado (habla + manos) |
|---|---|---|
| 1 | 0:25 | ≈ 33 s (82 palabras) |
| 2 | 0:25 | ≈ 48 s (119 palabras) |
| 3 | 0:45 | ≈ 46 s (86 palabras, foto y dirección) |
| 4 | 0:20 | ≈ 16 s (32 palabras y la pausa) |
| 5 | 0:30 | ≈ 28 s (44 palabras y la foto del técnico) |
| 6 | 0:15 | ≈ 10 s (24 palabras) |
| 7 | 0:20 | ≈ 27 s (68 palabras) |
| **Total** | **3:00** | **≈ 3:28** |

El habla es una estimación (455 palabras a 150 por minuto), no un cronometraje: el ensayo automático no habla. Los bloques 1, 2 y 7 se pasan de su tiempo. Recortes propuestos en el guion, en orden: el párrafo del surtido de Grimuca en el bloque 2 (−12 s), "Esto lo vamos a ejecutar a largo plazo; hoy es una demo" (−5 s), la frase de las cuatro o cinco ferreterías del bloque 7 (−7 s) y no bajar por todo el resultado (−5 s). Con eso, ≈ 3:00. Hay que confirmarlo en el ensayo humano de las 3:30 p.m. con cronómetro.

## Diferencias guion ↔ app corregidas en el guion (versión 5)

1. **Bloque 1:** "cada uno con su plan y su periodo gratis". En la app solo Aliado Lara está en periodo gratis; Grimuca sale "Activa" y Aliado Aragua "Vencida". Ahora dice "su plan y su membresía: activa, en periodo gratis o vencida".
2. **Bloque 2:** "Despacho vacío" y "El despacho está vacío". La semilla deja 11 pendientes en Mañongo (15 entregas con envío en Rutas). Ahora: "En Despacho, lo que tiene por entregar"; en "Antes de subir" se aclara que no está vacío.
3. **Bloque 2:** el habla dice "las entregas salen agrupadas por urbanización, una ruta en vez de viajes sueltos", pero la pantalla no pasaba por Rutas. Se cambió el segundo en Productos por la pestaña **Rutas**; Productos queda como primer recorte. Se nombra la pestaña "Zonas" (el guion decía "mapa por urbanización").
4. **Bloque 3:** "Ya tengo mi sobre" choca con "Antes de subir" (perfil ya llenado): con perfil, la portada es el tablero con "Medir mi agua" y ese botón no aparece. Se deja el perfil hecho antes (llenarlo en vivo no cabe) y el bloque arranca en "Medir mi agua".
5. **Bloque 3:** "escanea el QR del sobre". La app no escanea QR por dentro: el QR del sobre abre la app y el video. Se quitó como paso en pantalla y se nombra en el habla.
6. **Bloque 3:** faltaba el paso "Mi lista" (barra de abajo) entre "Agregar a mi lista" y "Hacer pedido". Se cambió "retiro en tienda" por **"Envío a mi dirección"**: así el pedido entra en Rutas y en el bloque 5 la dirección del técnico llega ya escrita (con retiro hay que escribirla allí).
7. **Bloque 3:** "el sistema lo asigna al comercio más cercano que lo tiene". La app manda el pedido a la tienda de la zona del hogar (Mañongo), sin revisar existencias ni distancia (fuera de alcance según `contrato-red.md`). Ahora: "le llega a la ferretería de su zona", y se agregó a "Lo que no se dice".
8. **Bloque 4:** "con el resultado de la familia ya escrito". La fila de Despacho trae cartucho, hogar, zona y dirección; no trae el resultado. Ahora: "con el cartucho, la casa y la dirección de entrega".
9. **Bloque 5:** "pide un técnico para instalar el filtro". La familia ya tiene filtro y el enlace de la pantalla del pedido ("¿No sabes hacerlo? Contrata a un experto") abre con "Cambiar el cartucho" marcado. Ahora: "que le cambien el cartucho". Se agregó "Guardar reporte" (sin él no se guarda) y que el servicio nuevo sale al final de la lista.
10. **Bloque 6:** "los pendientes ya actualizados". Como el pedido y el servicio ya se cerraron, los pendientes de Grimuca vuelven al mismo número. Lo que sube es "Pedidos del mes" (+2) y "Mediciones del mes" (+1), más la lista "Actividad de la red". El habla se ajustó.
11. **Plan B:** "Escribir el código del sobre" no existe en la app. Se cambió por "Elegir una foto del teléfono" y por "Cargar los colores a mano" si la foto no se lee o tarda más de 15 s.
12. **Antes de subir:** "Verificar que el cliente pueda pedir un técnico". Queda verificado: funciona.
13. **Plan B:** se agregó la fila del mapa sin fondo (Zonas y Rutas siguen con los puntos y las rutas).

**Para el dueño de `docs/marketing/guion-video-respaldo.md`** (no es territorio de Calidad, no se tocó). Tiene cuatro de las mismas diferencias: "El sistema lo asigna al comercio más cercano que lo tiene" (punto 7); "con el resultado de la familia ya escrito" (punto 8); "Confirmar pedido" (el botón se llama "Hacer pedido"); y "Escanea el QR de tu sobre" como si fuera una pantalla de la app (punto 5).

## Fallas de la app (no se tocaron)

### Rompen la demo
Ninguna en las dos corridas.

### Confunden
1. **El porqué de la primera recomendación no habla de la casilla roja.** Con la foto de ejemplo y el hogar del guion (filtro de 3 vasos), el resultado dice "1 en Rojo" (Nitrato 50) y la tarjeta "La mejor opción para tu casa" es un cartucho de sedimentos que se explica con "Dureza en Amarillo" y "Ya te toca el cambio". El equipo que atiende el nitrato (la ósmosis inversa de 8 etapas) sale cuarto. Un jurado puede preguntar "¿y el rojo?". Sin filtro (pasada 08), el porqué sí nombra "Nitrato en Rojo". Capturas: `03f`, `03h`.
2. **En `/tecnico`, el servicio que llega en vivo queda al final de "Pendientes"**, sin "Parada N" ni "Cómo llegar", detrás de los 3 sembrados que sí los tienen. Tulio tiene que bajar para encontrarlo (lo ayuda el aviso "Servicio nuevo"). Captura: `05c`.
3. **Rutas: la cifra "3" lleva la etiqueta "1 ruta por tienda contra 15 viajes sueltos"**: se lee "3 · 1 ruta por tienda…" y no se entiende qué es el 3 (son las rutas activas). Captura: `02e`.

### Cosméticas
4. La pestaña dice "Despacho (1 nuevos)": falta el singular.
5. El contador "Despacho (N nuevos)" / "Nuevos: N" no baja al tocar "Despachado"; tras el bloque 5 dice "2 nuevos" aunque los dos ya se cerraron (baja con "Marcar vistos").
6. En `/red`, "Hogares" no sube en vivo: la pantalla quedó en 72 y la API ya decía 73 (sube al recargar). Pedidos y mediciones sí suben en vivo.
7. En las bandas de cifras, la etiqueta y su detalle quedan pegados en el texto accesible ("Entregas con envíoincluye servicios técnicos"): un lector de pantalla los lee juntos. En pantalla se ven bien.
8. La foto del producto en la tarjeta recomendada todavía no había cargado cuando se tomó la captura (cuadro gris en `03h`); carga al rato.

## Datos creados

Todos los hogares llevan "Prueba Calidad". No se crearon productos ni comercios. Dos corridas, en total:

- 2 hogares ("Prueba Calidad MWRJNQRBIF ensayo" y "Prueba Calidad MWRJQ12HZN ensayo"), cada uno con su filtro "Tres vasos".
- 2 mediciones por foto.
- 2 pedidos de cartucho con envío (N.º 100 y 102), los dos despachados.
- 2 servicios técnicos (N.º 101 y 103), los dos atendidos con foto y nota "Prueba Calidad …".

En total, **10 registros**. Suman 4 a "Pedidos del mes", 2 a "Mediciones del mes" y 2 reportes a "Reportes del técnico" de Grimuca. Conviene restablecer la demo antes de la tarima.

## Respaldo

En `respaldo/` quedan 28 capturas numeradas del recorrido y 5 videos WebM (cliente, comercio, comercio-rutas, red y técnico). Orden de uso y nota del mapa sin internet en `LEEME.md`. El fondo liso sin internet se describe según `contrato-red.md`; en este ensayo no se probó sin red.
