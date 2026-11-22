# Informe de Calidad externa · Grimuca Agua

Pruebas de navegador contra https://agua.oydo.app, hechas desde una máquina distinta a la del equipo que construye. No se tocó código de la app.

Cómo correrlas: `cd pruebas/externas && npm install && npx playwright install chromium && npx playwright test`. Revisión del repositorio: `node pruebas/externas/revisar-repo.js` desde la raíz.

## Pasada 11 · dom 22 nov, 12:50 a.m. (solo lectura)

**Resumen:** sin cambios desde la pasada 10: mismo código y misma versión publicada (`index-t8kfX0Rf.js`). Pasan 23 revisiones, falla 1 (tamaño) y se saltan 2 (el recorrido que crea pedidos). El recorrido completo sigue sin probarse tras el despliegue de las 11:51 p.m.; la última prueba completa (pasada 8) funcionó. El pedido en vivo en Despacho sigue certificado por la Calidad interna.

**Repositorio:** 404 archivos, sin hallazgos. **Orquestador:** último commit a las 11:57 p.m., hace 53 minutos. El sitio responde. No hay alerta: el umbral es de 90 minutos sin commits y con el sitio sin cambios.

**Fallas abiertas:** las mismas de la pasada 10. Ninguna rompe la demo. «Medir mi agua» mide menos de 44 px en `/catalogo`.

## Pasada 10 · dom 22 nov, 12:20 a.m. (solo lectura)

**Resumen:** hay un despliegue nuevo publicado: mapa real con rutas de despacho, catálogo por comercio, filtro que se guarda al confirmar, correcciones de Calidad y encabezado del panel sin desborde en teléfono (`ea4d452`, `3faa413`). Por el acuerdo con el orquestador, desde la medianoche esta revisión no crea pedidos. **Por eso el recorrido completo del cliente no se volvió a probar después de estos cambios.** La última prueba completa (pasada 8, 11:25 p.m.) funcionó. Pasan 23 revisiones, falla 1 (tamaño) y se saltan 2.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| Portada y 7 páginas públicas | Cargan y cumplen, salvo `/catalogo` (tamaño) | Cargan y cumplen |
| Paneles `/operador`, `/comercio`, `/tecnico`, `/red` piden PIN | Sí | Sí |
| No dice «potable» | Cumple | Cumple |
| Recorrido completo del cliente | **Sin probar tras el despliegue de las 11:51 p.m.** | **Sin probar** |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna (11:42 p.m.) | Certificado por la Calidad interna |

**Repositorio:** 404 archivos revisados, sin hallazgos.

**Señales de vida del orquestador:** último commit a las 11:57 p.m. (`3faa413`). El sitio responde. No hay alerta.

### Fallas abiertas

**Rompe la demo**
- Ninguna encontrada. El recorrido con los cambios de las 11:51 p.m. queda para la Calidad interna o para la prueba de Leonardo en la mañana.

**Confunde**
- «Medir mi agua» mide menos de 44 px en `/catalogo` (teléfono).
- «Cotizar por WhatsApp» (filtro guardado) y «Mira cómo cambiarlo» (resultado): sin poder revisarlas porque están dentro del recorrido. Siguen abiertas hasta que alguien lo confirme.

**Cosmético**
- Ninguna.

## Pasada 9 · sáb 21 nov, 11:50 p.m. (solo lectura)

**Resumen:** la app no cambió desde la pasada 8 (mismo código y misma versión publicada). Corrió en modo solo lectura: 23 revisiones pasan, 1 falla (tamaño) y 2 se saltan (el recorrido que crea pedidos). La Calidad interna certificó a las 11:42 p.m. las compuertas 1 a 3 y el recorrido de la red (`2471b84`). **El último recorrido completo del cliente que probó esta revisión (pasada 8, 11:25 p.m.) funciona en teléfono y escritorio.**

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| Portada y 7 páginas públicas | Cargan y cumplen, salvo `/catalogo` (tamaño) | Cargan y cumplen |
| Paneles `/operador`, `/comercio`, `/tecnico`, `/red` piden PIN | Sí | Sí |
| No dice «potable» | Cumple | Cumple |
| Recorrido completo del cliente | Saltado (solo lectura); funcionó en la pasada 8 | Saltado; funcionó en la pasada 8 |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna | Certificado por la Calidad interna |

**Repositorio:** 395 archivos revisados, sin hallazgos.

**Señales de vida del orquestador:** último commit a las 11:42 p.m. (`2471b84`). El sitio responde. No hay alerta.

### Fallas abiertas

**Rompe la demo**
- Ninguna.

**Confunde** (sin cambios desde la pasada 8)
- «Cotizar por WhatsApp» mide 26 px en «Listo, guardamos tu filtro».
- «Mira cómo cambiarlo» mide menos de 44 px en el resultado.
- «Medir mi agua» mide menos de 44 px en `/catalogo`.

**Cosmético**
- Ninguna.

## Pasada 8 · sáb 21 nov, 11:25 p.m.

**Resumen:** está publicada la red de comercios: paneles de comercio, técnico y red, cada uno con su PIN (`6eeb0da`). **El recorrido completo del cliente sigue funcionando en teléfono y en escritorio.** Esta pasada suma una revisión de solo lectura de 7 páginas públicas y de los 3 paneles nuevos: todo carga, nada dice «potable» y cada panel pide su PIN.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| Portada | Sí | Sí |
| `/tiendas`, `/tutoriales`, `/experto`, `/modulos`, `/privacidad`, `/terminos` | Cargan y cumplen | Cargan y cumplen |
| `/catalogo` | Carga; 1 control de menos de 44 px | Carga y cumple |
| Paneles `/operador`, `/comercio`, `/tecnico`, `/red` piden PIN | Sí | Sí |
| No dice «potable» (todas las páginas revisadas) | Cumple | Cumple |
| Recorrido completo del cliente | **Sí** | **Sí** |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna | Certificado por la Calidad interna |
| Contenido de los paneles nuevos (detrás del PIN) | Sin verificar: falta PIN | Sin verificar: falta PIN |

**Repositorio:** 377 archivos revisados, sin hallazgos.

**Señales de vida del orquestador:** último commit a las 11:15 p.m. (`37e5265`). El sitio responde. No hay alerta.

### Fallas abiertas

**Rompe la demo**
- Ninguna.

**Confunde**
- «Cotizar por WhatsApp» sigue en 26 px en «Listo, guardamos tu filtro» (4 veces).
- «Mira cómo cambiarlo» sigue por debajo de 44 px en el resultado.
- **Nuevo:** «Medir mi agua», en `/catalogo` (teléfono), mide menos de 44 px.

**Cosmético**
- Ninguna nueva.

**Desde la medianoche** esta revisión ya no crea pedidos: el recorrido del cliente se salta y siguen la portada, las páginas públicas, los paneles y el repositorio.

## Pasada 7 · sáb 21 nov, 10:51 p.m.

**Resumen:** está publicada la portada nueva del cliente, como página de venta con foto, «Sobre de medición $9» e indicador de pasos (`ad5f2d0`). **El recorrido completo del cliente sigue funcionando en teléfono y en escritorio.** El pedido en vivo en Despacho sigue certificado por la Calidad interna.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| Portada nueva carga, con sus dos entradas | Sí | Sí |
| No dice «potable» | Cumple | Cumple |
| Recorrido completo del cliente | **Sí** | **Sí** |
| Semáforo por parámetro y aviso fijo literal | Sí | Sí |
| Producto sugerido y pedido | Sí | Sí |
| Controles de 44 px o más | **No:** los mismos 2 casos | No aplica |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna | Certificado por la Calidad interna |

**Repositorio:** 313 archivos revisados, sin hallazgos.

**Señales de vida del orquestador:** último commit a las 10:28 p.m. (`7ec6ddc`). El sitio responde. No hay alerta.

**Contexto:** según el registro de decisiones (10:00 p.m.), Leonardo cambió el enfoque a una plataforma para ferreterías con cuatro módulos: cliente, comercio, técnico y red. Esta revisión sigue cubriendo el recorrido del cliente y el panel; cuando los módulos nuevos estén publicados, se suman.

**Captura:** `capturas/pasada7-portada-telefono.png`.

### Fallas abiertas

**Rompe la demo**
- Ninguna.

**Confunde**
- «Cotizar por WhatsApp» sigue en 26 px en «Listo, guardamos tu filtro» (4 veces).
- «Mira cómo cambiarlo» sigue por debajo de 44 px en el resultado (teléfono).

**Cosmético**
- Ninguna nueva.

## Pasada 6 · sáb 21 nov, 10:22 p.m.

**Resumen:** está publicado el despliegue con «Por qué te lo recomendamos», WhatsApp con código de país, la pregunta del último cambio de cartucho con tres opciones y el catálogo ajustado (`e279d35`, `451ba33`). **El recorrido completo del cliente funciona en teléfono y en escritorio.** El pedido en vivo en Despacho sigue certificado por la Calidad interna.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La bienvenida carga | Sí | Sí |
| No dice «potable» | Cumple | Cumple |
| Recorrido completo del cliente | **Sí** | **Sí** |
| Perfil con la pregunta nueva del último cambio | Sí | Sí |
| Semáforo por parámetro y aviso fijo literal | Sí | Sí |
| Producto sugerido y pedido | Sí | Sí |
| Controles de 44 px o más | **No:** 2 casos (ver abajo) | No aplica |
| Panel del operador carga y pide PIN | Sí | Sí |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna | Certificado por la Calidad interna |

**Repositorio:** 301 archivos revisados, sin hallazgos. `api/src/rutas/motivos.ts` contiene «potable», pero dentro de la lista `PALABRAS_PROHIBIDAS`, que es justo lo correcto; el revisor ya ignora esas líneas.

**Señales de vida del orquestador:** último commit a las 10:09 p.m. (`264f454`, «Contrato de la red de comercios y registro del cambio de enfoque»). El sitio responde. No hay alerta.

**Ajustes a las pruebas:** cubren la pregunta que aparece después de responder que hay filtro. Además, la casilla de consentimiento se marca con un clic directo, porque en teléfono la barra inferior fija la tapa y un clic forzado caía en «Medir». Eso lo causaba la prueba, no es una falla de la app.

**Captura:** `capturas/pasada6-resultado-telefono.png`.

### Fallas abiertas

**Rompe la demo**
- Ninguna.

**Confunde**
- **«Cotizar por WhatsApp» sigue en 26 px** en la pantalla «Listo, guardamos tu filtro» (4 veces). En el resultado ya quedó corregido.
- **Enlace nuevo de menos de 44 px:** «Mira cómo cambiarlo», en el resultado (teléfono).

**Cosmético**
- Ninguna nueva.

**Resueltas desde la pasada 5**
- ~~«Cotizar por WhatsApp» de 26 px en el resultado~~: corregido.

## Pasada 5 · sáb 21 nov, 9:52 p.m.

**Resumen:** ya está publicado el despliegue con foto del filtro, mascotas, mapa por urbanización, tutoriales y «contrata a un experto» (`93bb76c`). **El recorrido completo del cliente funciona en teléfono y en escritorio**, incluido el paso nuevo del filtro. El pedido en vivo en Despacho no lo verifica esta revisión: lo certificó la Calidad interna (Compuerta 3, `8a57cae`).

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La bienvenida carga | Sí | Sí |
| No dice «potable» | Cumple en todas las pantallas | Cumple |
| Recorrido completo del cliente | **Sí** | **Sí** |
| Paso nuevo «Cuéntanos qué filtro tienes» (carga a mano) | Sí; sugiere 4 cartuchos | Sí |
| Semáforo por parámetro y aviso fijo literal | Sí | Sí |
| Producto sugerido y pedido | Sí («Listo, tu pedido ya está en la tienda») | Sí |
| Controles de 44 px o más | **No:** «Cotizar por WhatsApp» mide 26 px | No aplica |
| Panel del operador carga y pide PIN | Sí | Sí |
| Pedido en vivo en Despacho sin recargar | Certificado por la Calidad interna | Certificado por la Calidad interna |

**Repositorio:** 292 archivos revisados, sin hallazgos.

**Señales de vida del orquestador:** último commit a las 9:39 p.m. (`d7a57f7`). El sitio responde. No hay alerta.

**Ajustes a las pruebas:** cubren el paso nuevo `/mi-filtro`: «Cárgalo a mano» → «Listo, guardamos tu filtro» → «Continuar». Además esperan a que cargue la pantalla de envío antes de escribir la dirección. Los pedidos de esta pasada se llaman «Prueba Calidad externa».

**Capturas:** `capturas/pasada5-resultado-telefono.png` y `capturas/pasada5-pedido-telefono.png`.

### Fallas abiertas

**Rompe la demo**
- Ninguna.

**Confunde**
- **«Cotizar por WhatsApp» sigue midiendo 26 px de alto** en teléfono. Ahora aparece también en la pantalla «Listo, guardamos tu filtro» (4 veces) y en el resultado (3 veces). El orquestador lo anunció para el próximo despliegue.

**Cosmético**
- Los textos de la especificación siguen sin coincidir con los de la app. No se volvió a revisar: está anunciado para el próximo despliegue.

**Resueltas desde la pasada 4**
- ~~Cartuchos sugeridos sin foto~~: ahora cada tarjeta muestra la foto del producto.
- ~~Pedidos «Prueba Calidad» en producción~~: el orquestador los borró.

## Nota · sáb 21 nov, 9:40 p.m.

- **Compuerta 3 certificada por la Calidad interna**, no por esta revisión. El pedido aparece en Despacho sin recargar en menos de medio segundo; la evidencia está en `docs/calidad/informe-compuertas-1-3.md` (`8a57cae`). Esta revisión no la repite porque no usa el PIN en el sitio publicado.
- **Los pedidos «Prueba Calidad» a secas (hallazgo C1 de la Calidad interna) los creó esta revisión externa**, en las corridas de ajuste de la pasada 4: fueron unos 13, más de los 4 que estimé. El orquestador ya los borró.
- Desde ahora, todo lo que crean estas pruebas se llama **«Prueba Calidad externa»**. **Desde la medianoche no se crean pedidos** en el sitio publicado: el recorrido se salta solo y siguen corriendo la navegación, la lectura y las reglas fijas.
- El orquestador incluye en el próximo despliegue las fallas 1, 2 y 4 de la pasada 4 (botón de 26 px, fotos de los cartuchos y textos de la especificación). Ese despliegue cambia otra vez los textos de los botones y el perfil del hogar; las pruebas se ajustan después de verlo.

## Pasada 4 · sáb 21 nov, 9:22 p.m.

**Resumen:** la app ya está publicada en https://agua.oydo.app. **El recorrido completo del cliente funciona en teléfono y en escritorio**: bienvenida → perfil → dirección → pago simulado → «Ya me llegó el sobre» → carga manual → semáforo por parámetro con el aviso fijo → cartucho Oasis sugerido → pedido confirmado. **El pedido en vivo en el panel no se pudo verificar**: el panel pide PIN y esta máquina no lo tiene.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La bienvenida carga | Sí | Sí |
| No dice «potable» | Cumple en todas las pantallas | Cumple |
| Recorrido completo del cliente | **Sí** | **Sí** |
| Semáforo por parámetro | Sí (rojo, amarillo y verde por casilla) | Sí |
| Aviso fijo en el resultado | **Sí**, literal | **Sí** |
| Producto sugerido y pedido | Sí: 3 cartuchos Oasis, pedido confirmado | Sí |
| Controles de 44 px o más | **No:** «Cotizar por WhatsApp» mide 26 px | No aplica |
| Panel del operador carga y pide PIN | Sí («Panel de tiendas») | Sí |
| Pedido en vivo en Despacho sin recargar | **Sin verificar: falta PIN** | **Sin verificar: falta PIN** |

**Repositorio:** 205 archivos revisados, sin hallazgos reales. Ya existen `LICENCIAS.md` y las pruebas internas en `pruebas/e2e/`. Hubo tres falsos positivos, ya ajustados en `revisar-repo.js`: una clave ficticia en `api/src/config.test.ts`, «potable» dentro de una prueba que verifica que no aparezca, y el WhatsApp de las tiendas (+58 414-4409396), que es público en grimuca.com.

**Señales de vida del orquestador:** último commit a las 9:05 p.m. (`9eecc72`). El sitio responde con la app. No hay alerta.

**Capturas:** `capturas/pasada4-resultado-telefono.png`, `capturas/pasada4-pedido-telefono.png` y `capturas/pasada4-resultado-escritorio.png`.

### Fallas abiertas

**Rompe la demo**
- Ninguna encontrada en el recorrido del cliente.
- **Sin verificar:** el momento clave, el pedido apareciendo en Despacho sin recargar. Para probarlo hace falta correr `PIN_OPERADOR=<PIN> npx playwright test` en esta máquina. El PIN no está aquí y no se buscó en el servidor.

**Confunde**
- **«Cotizar por WhatsApp» mide 26 px de alto** en las tarjetas de producto del resultado (teléfono). La regla de diseño exige 44 px o más.
- **Pedidos de prueba en producción:** cada corrida del recorrido crea un pedido de sobre y uno de cartucho a nombre de «Prueba Calidad» (WhatsApp 0414 123 4567, Calle Prueba 123). Hay 4 de esta pasada más los de los ajustes. Conviene borrarlos o marcarlos como despachados antes de la demo. Desde ahora el recorrido externo solo corre cuando cambia el código de la app.

**Cosmético**
- Los cartuchos sugeridos no muestran foto: sale un recuadro gris. El catálogo tiene `url_foto` pública para cada producto Oasis.
- La especificación dice «Empezar», «Guardar y seguir» y «Pagar $9 (simulación)», pero la app dice «Pedir el sobre a domicilio ($9)», «Continuar», «Continuar al pago» y «Simular pago de $9». La app manda; conviene actualizar `docs/diseno/especificacion.md`.

## Pasada 3 · sáb 21 nov, 8:46 p.m.

**Resumen:** el orquestador avanza rápido: componentes, especificación de pantallas, contenedores y guion de despliegue (último commit `4cc3a9a`, 8:44 p.m.). La URL pública sigue con la página provisional y las rutas del operador siguen vacías en el código. El recorrido aún no se puede probar.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La bienvenida carga con su título | **No:** página provisional | **No:** página provisional |
| No dice «potable» | Cumple | Cumple |
| Controles de 44 px o más | No hay controles todavía | No aplica |
| Recorrido completo en teléfono | **No:** la app no está publicada | — |
| Pedido en vivo en Despacho sin recargar | **No:** `/operador` no muestra «Panel de despacho» | **No** |
| Aviso fijo en el resultado | No probado | No probado |

**Repositorio:** 96 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y «potable» no aparece en el código. Siguen faltando `LICENCIAS.md` y `.env.example`.

**Señales de vida del orquestador:** commits a las 8:41, 8:43 y 8:44 p.m. El sitio responde con la página provisional. No hay alerta.

**Ajustes a las pruebas:** el recorrido se reescribió contra `docs/diseno/especificacion.md`, con sus rutas (§1) y los textos exactos de cada botón:
- Cliente: «Empezar» → «Guardar y seguir» → «Seguir al pago» → «Pagar $9 (simulación)» → «Ya me llegó el sobre» → «Marca los colores a mano» → «Ver mi resultado» → «Agregar a mi lista» → «Confirmar pedido».
- Operador: PIN → «Entrar» → `/operador/despacho`, abierto desde antes de que el cliente empiece. La prueba exige que el pedido aparezca sin recargar.
- Los datos de prueba son inventados («Prueba Calidad», 0414 123 4567).

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no está publicada.

**Confunde**
- Faltan `LICENCIAS.md` y `.env.example`.
- ~~Aqual en el catálogo~~: resuelto. El catálogo quedó solo con Oasis (`b1bbfe5`).

**Cosmético**
- Nada nuevo.

## Pasada 2 · sáb 21 nov, 8:38 p.m.

**Resumen:** el esqueleto del monorepo ya está en main (`3d097c4`, 8:34 p.m.), pero la URL pública sigue sirviendo la página provisional. Las rutas de la app existen en el código y están vacías, incluida la del operador. El recorrido de la demo todavía no se puede probar en la URL pública.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La página carga | Sí (provisional) | Sí (provisional) |
| No dice «potable» | Cumple | Cumple |
| Botones de 44 px o más | No hay botones todavía | No aplica |
| Recorrido completo en teléfono | **No:** la app no está publicada | — |
| Pedido en vivo en el panel sin recargar | **No:** `/operador` da 404 | **No:** `/operador` da 404 |
| Aviso fijo en el resultado | No probado | No probado |

**Repositorio:** 56 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y «potable» no aparece en el código de `app/`, `api/` ni `db/`. Todavía faltan `LICENCIAS.md` y `.env.example`, que el HANDOFF exige (sección 4).

**Señales de vida del orquestador:** último commit suyo el sáb a las 8:34 p.m. El sitio responde, pero aún con la página provisional.

**Ajustes a las pruebas en esta pasada:**
- La prueba del panel ahora acepta el PIN del operador (HANDOFF §3) desde la variable `PANEL_PIN`. El PIN nunca se escribe en el repo.
- `revisar-repo.js` ya no marca los números de ejemplo (0414 123 4567), y solo busca «potable» en código, porque la documentación nombra la palabra para prohibirla.

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no está publicada.

**Confunde**
- **Aqual:** el HANDOFF dice que no se usa la línea Aqual, pero el catálogo de `insumos/catalogo/` la incluye porque así lo pidió el encargo. Hay que filtrar por Oasis antes de llevarlo a la base. Quedó anotado en `insumos/catalogo/NOTAS.md`.
- **Faltan `LICENCIAS.md` y `.env.example`**, que el jurado revisa.
- **No se sabe la ruta del panel:** las pruebas usan `/operador` hasta que exista la ruta real.

**Cosmético**
- Nada nuevo.

Captura: `capturas/pasada2-panel-telefono.png` (404 del panel).

## Pasada 1 · sáb 21 nov, 8:30 p.m. (hora de Caracas)

**Resumen:** la app todavía no está publicada. La raíz responde 200 con la página provisional «Sitio en construcción». El recorrido de la demo no se puede probar aún.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La página carga | Sí (provisional) | Sí (provisional) |
| No dice «potable» | Cumple | Cumple |
| Botones de 44 px o más | No hay botones todavía | No aplica |
| Recorrido completo | No probado: no hay app | No probado: no hay app |
| Pedido en vivo en el panel | No probado: `/operador` da 404 | No probado: `/operador` da 404 |
| Aviso fijo en el resultado | No probado: no hay resultado | No probado |

**Repositorio:** 14 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y la palabra «potable» no aparece en el código.

**Señales de vida del orquestador:** último commit en main el sáb 21 nov a las 8:26 p.m. (`edbcece`, estructura inicial). El sitio responde.

**Acceso al servidor:** la comprobación por SSH no se hizo. El sistema de permisos de esta PC la bloqueó y no se intentó otra vía.

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no existe aún.

**Confunde**
- No se sabe la ruta del panel del operador. Las pruebas usan `/operador` por defecto; si es otra, se corre con `PANEL_PATH=/ruta npx playwright test`.
- El documento de traspaso (HANDOFF) no está en el repositorio, por la decisión de las 8:30 p.m. Las pruebas se escribieron a partir del recorrido descrito en el encargo.

**Cosmético**
- La página provisional muestra «construcciÃ³n» cuando se lee sin UTF-8. En navegador se ve bien porque declara `charset=utf-8`.
