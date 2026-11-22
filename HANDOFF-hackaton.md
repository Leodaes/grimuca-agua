# Handoff v2: Grimuca Agua · Hackatón ValenValley 2026

Eres el **orquestador** de este proyecto. Diriges un equipo de agentes que trabaja de forma autónoma para Leonardo Dávila (dueño; solo toma decisiones). Tulio Dávila es su compañero de equipo: no programa, valida negocio, textos y pitch, y consigue los insumos físicos. Lee todo este documento antes de lanzar a nadie.

**Regla de oro: no te detengas y no preguntes.** Leonardo ya respondió todo (sección 0). Si una tarea se queda sin información, credencial o insumo: usa un marcador o un simulado, anótalo en `docs/decisiones/bloqueos.md` (qué falta, qué pusiste en su lugar, cómo se completa) y **pasa a la siguiente tarea**. Nunca termines un turno esperando una respuesta. Lo único que te frena de verdad está en la sección 10.

## 0. Decisiones de Leonardo (sáb 21 nov, 8:45 p.m.) — esta es la Compuerta 0, ya está pasada

| Tema | Decisión |
|---|---|
| Modo de trabajo | Equipo de agentes autónomo toda la noche. Leonardo no revisa pantallas antes del código: **el equipo arranca directo**. |
| Alcance | **Propuesta de Tulio, sin WhatsApp real** (sección 3). El reporte de bacterias a las 48 horas es una pantalla dentro de la app. |
| Repositorio | Cuenta personal de GitHub de Leonardo, **público desde el inicio**. Se crea con `gh` (Leonardo inicia sesión en esta PC). **Sin GitHub Actions ni ningún workflow**: no crear `.github/workflows`. |
| Despliegue | **Solo por SSH**, hecho por el orquestador, con `infra/desplegar.sh`. |
| Voz | Sí, al final y solo después de la Compuerta 3; si no hay clave disponible, se salta sin detener nada. |
| Si una compuerta falla dos veces | **Recortar y seguir**, en este orden: voz → aviso a vecinos → pago simulado → vista por zonas → reporte de bacterias. **Nunca** se recorta el recorrido foto → resultado → pedido → despacho en vivo. Cada recorte va al informe. |
| Cambios de Tulio de madrugada | **Tulio decide producto.** Lo que pida sobre producto, textos, precios, catálogo o tiras se construye, siempre que no rompa el recorrido principal ni la hora de congelar. No decide sobre servidor, credenciales, dinero ni track. |
| Informes | Página de estado actualizada en cada compuerta e informe a las 5:30 a.m. |
| Catálogo | **Solo marca Oasis** (Aqual queda fuera). Productos reales tomados de la API pública de la tienda de grimuca.com. Ningún precio es público: las tarjetas dicen "Cotizar por WhatsApp". |

## 1. Situación y reloj

- Hackatón ValenValley 2026, Linko Cowork, Valencia. Equipos de 2. Track registrado: **Logística**.
- **Cierre de entregas: domingo 22 nov, 5:00 p.m. (hora de Caracas).** Después no se aceptan commits.
- **Congelar funciones: domingo 12:00 m.** Desde ahí solo se corrigen fallas.
- Entregables en el portal: URL de la demo, enlace al repositorio, descripción corta. Demo de 3 minutos + deck.
- Se permiten librerías, APIs y código open source. El jurado revisa el repositorio y las licencias.

### Cómo evalúan (25% cada pilar) y qué agente responde por cada uno
| Pilar | Qué mira el jurado | Agente responsable |
|---|---|---|
| Modelo de negocio | Viabilidad, cliente, flujo de caja, punto de equilibrio | Business |
| Producto | Problema claro, caso de uso demostrado | Diseño UX/UI + Marketing |
| Calidad técnica | Lo que funciona en vivo, arquitectura, carpetas, pruebas | Desarrollo + Calidad |
| Innovación | El "wow" y el potencial en Latinoamérica | Marketing + Business |

Lo primero es que la demo funcione de punta a punta.

## 2. El producto

**Problema:** en Venezuela muchas familias dependen del botellón, de empresas que casi nunca presentan análisis del agua, o de filtros que nadie sabe cuándo cambiar. Nadie mide el agua en casa.

**Solución:** con la compra de un filtro (o por $1 como prueba de entrada) el cliente recibe una tira reactiva. Toma una foto, la app la lee con visión, explica en lenguaje simple qué está fallando y recomienda el cartucho exacto. El pedido sale de una de las 3 tiendas de Grimuca, que funcionan como almacenes de despacho.

**Por qué es logística:** el operador ve la demanda de cartuchos prevista por zona y tienda, la lista de despacho y el inventario faltante. Se reemplaza el reparto semanal de botellones por envíos pequeños de cartuchos solo cuando la medición lo pide.

**Marca:** Grimuca (plomería y ferretería, Valencia, grimuca.com). Tiendas: **Mañongo, Big Low, CC CEM**.

**La tira (actualizado por Tulio, sáb 8:12 p.m.):**
- **Demo del domingo:** la tira que se consiga en Valencia; la Qteeyou no llega. Por eso **el lector debe tolerar que falten casillas** y `config/tira.ts` define la tira como una lista de parámetros intercambiable, no fija.
- **Producción:** HORYZON 16 en 1 (unos 4 centavos la tira): pH, dureza, cloro, nitrato, nitrito, plomo, cobre, alcalinidad, hierro, entre otros.
- **Referencia de rangos:** Qteeyou W-8 (alcalinidad, plomo, pH, dureza, cobre, nitrato, nitrito, cloro; 1 gota por casilla, leer entre 30 y 60 s). Los niveles de cada casilla están en `insumos-tulio/2026-11-21_2012_producto-y-onboarding.md`; nitrito y el tramo alto de pH están "por confirmar".
- **Aviso fijo (texto de Tulio):** "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."
- **Catálogo:** no se usa la línea Aqual. Productos sugeridos con marcador hasta que llegue el catálogo.

### Propuesta de producto de Tulio (sáb 8:12 p.m.) — **aprobada por Leonardo sin WhatsApp real; el alcance vigente es la sección 3**
- Oferta: un sobre de una sola lectura a **$9** enviado a la casa (antes: tira a $1 o con la compra del filtro). Trae tira, **prueba de bacterias (E. coli y coliformes)**, tabla de colores impresa y QR a un video.
- Flujo: bienvenida → perfil del hogar (nombre, zona, origen del agua: chorro, botellón, filtro, tanque o pozo; cuántos viven; filtro y etapas; agua turbia o amarilla; WhatsApp) → dirección de envío → pago de $9 (simulado en la demo) → al llegar el sobre: video, medición y foto junto a la tabla → panel con semáforo **por parámetro** y productos sugeridos según resultado y perfil → a las 48 horas, WhatsApp para reportar la prueba de bacterias.
- Choca con el alcance actual en: pago (estaba fuera, aunque sea simulado), mensaje de WhatsApp (el bot estaba fuera) y bacterias (el MVP decía "no mide bacterias"). Encaja bien con Logística: el envío del sobre es un despacho más desde las tiendas.
- Business recalcula el modelo sobre el sobre de $9 (tira a ~4 centavos, prueba de bacterias, empaque, envío); los costos que Tulio aún no entregó van como supuestos marcados.

## 3. Alcance del MVP

**Oferta:** un sobre de una sola lectura a **$9**, enviado a la casa: 1 tira multiparámetro, 1 prueba de bacterias (E. coli y coliformes), tabla de colores impresa y QR al video. El sobre filtra a los hogares con perfil para comprar el filtro, que es el negocio. Promesa: no cargar más botellones; agua de calidad, monitoreada y permanente.

**Cliente (teléfono)**
1. Bienvenida: "Descubre la calidad del agua de tu casa".
2. Perfil del hogar: nombre, zona de Valencia, origen del agua que toman (chorro, botellón, filtro, tanque o pozo), cuántos viven, si tienen filtro y de cuántas etapas, fecha del último cambio de cartucho, si el agua sale turbia o amarilla, WhatsApp. Con casilla de consentimiento y enlace al aviso de privacidad (texto del Asesor legal).
3. Dirección de envío del sobre y tienda más cercana.
4. Pago del sobre de $9, **simulado** y rotulado como simulación. Crea un pedido de tipo "sobre", que entra al despacho del operador.
5. "Ya me llegó el sobre": video o 4 pasos con temporizador de 30 a 60 s → foto de la tira junto a la tabla → lectura con visión. Carga manual de respaldo. Para la demo, un botón deja saltar del paso 4 al 5 sin esperar el envío.
6. Panel personalizado: verde, amarillo o rojo **por parámetro**, hallazgos en frases simples y productos sugeridos según resultado y perfil del hogar. Aviso fijo: "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar." La app **nunca** dice "potable".
7. Producto sugerido → "Agregar a mi lista" → retiro o envío → pedido de tipo "cartucho" (sin cobro).
8. Prueba de bacterias: pantalla "Reporta tu prueba a las 48 horas" donde el cliente indica si el frasco cambió de color o sigue igual. **No se envía ningún WhatsApp.** El texto del resultado lo define el Asesor legal con el Especialista de agua: un frasco sin cambio tampoco certifica el agua.

**Operador (laptop/proyector)**
6. Resumen por tienda: hogares, pedidos pendientes, recambios a 7 y 30 días.
7. Lista de despacho por tienda y zona con botón "despachado": incluye **sobres por enviar** y cartuchos. **El pedido hecho en el teléfono aparece aquí sin recargar: es el momento clave de la demo.**
8. Inventario: stock contra demanda a 30 días, faltantes en rojo.
9. Zonas: alerta con 3 o más hogares en rojo en 7 días.

**Fuera:** cobros reales, integración con empresas de envío, mensajes o bot de WhatsApp, venta de datos, industria, cuentas de usuario complejas. El panel del operador se protege con un PIN simple tomado de `agua.env`.

**Si sobra tiempo:** (a) aviso a hogares de la zona en alerta, (b) voz con ElevenLabs (hay premio especial).

## 4. Infraestructura y stack (decidido por Leonardo)

- **Todo vive en el servidor de Leonardo**, en **https://agua.oydo.app**. **No se usa Supabase ni Vercel.**
- **Servidor:** compartido con otros proyectos; la aplicación corre en contenedores propios detrás del servidor web, con Postgres en contenedor propio sin puerto publicado y variables fuera del repositorio. El detalle operativo está en `infra/LEEME.md`.
- **Stack de la aplicación** (dentro de ese patrón):
  - Front: Vite + React + TypeScript + Tailwind.
  - API: Node + Fastify + TypeScript, validación con zod. Sirve también el front compilado.
  - Base de datos: PostgreSQL en contenedor propio del proyecto, migraciones SQL en `db/migraciones`.
  - Tiempo real: SSE (`/api/eventos`) alimentado por `LISTEN/NOTIFY` de Postgres. Respaldo: sondeo cada 5 s.
  - Visión: API del servicio de visión llamada **solo desde el servidor**. Clave en `.env` del servidor, nunca en el navegador ni en el repo.
  - Despliegue: `docker compose` + script `desplegar.sh` (subir, migrar, reiniciar, verificar `/api/salud`).
  - Pruebas: Vitest (unidad) y Playwright (flujo de la demo).
- **Idioma:** todo lo visible y el código en español venezolano.
- **Repo:** sin identificadores de modelos de IA en código, commits ni README. Sin secretos. `.env.example` completo.

## 5. Diseño

Fuente única: `grimuca-design/` (ya extraído de grimuca.com): `DESIGN.md`, `tokens.css`, logos y fuentes. Reglas que no se negocian: azul `#12437F` para estructura, `--accion #C94A0C` para el único CTA por zona, esquinas rectas (radio 2px en controles, 0 en tarjetas), sin sombras, solo modo claro, objetivos táctiles de 44px o más, Archivo para títulos y Source Sans 3 para texto.

| Patrón de grimuca.com | Uso en la app |
|---|---|
| Encabezado azul con logo blanco | Encabezado de cliente y operador |
| Barra inferior fija de 5 accesos | Medir, Resultados, Tiendas, WhatsApp, Mi lista |
| Pasos numerados "cómo comprar" | "Cómo medir tu agua en 4 pasos" |
| Botón "Enviar foto por WhatsApp" | Botón de subir la foto de la tira |
| Tarjeta de producto | Cartucho recomendado |
| Drawer "Mi lista de cotización" | Pedido de reposición |
| Tarjeta de tienda | Cada almacén en el panel del operador |
| Banda de confianza (números amarillos sobre azul) | Cifras del resumen del operador |

## 6. Modelo de datos

- `tiendas` (id, nombre, horario)
- `cartuchos` (codigo, nombre, marca, precio_usd, corrige text[])
- `stock` (tienda_id, cartucho_codigo, cantidad)
- `hogares` (id, nombre, zona, origen_agua [chorro|botellon|filtro|tanque|pozo], personas, tipo_filtro, etapas_filtro, fecha_ultimo_cambio, agua_turbia, whatsapp, direccion, consentimiento_fecha, tienda_id)
- `mediciones` (id, hogar_id, fecha, valores jsonb, semaforo, semaforo_por_parametro jsonb, origen [foto|manual])
- `pruebas_bacterias` (id, hogar_id, fecha_inicio, fecha_reporte, resultado [cambio|sin_cambio|pendiente])
- `pedidos` (id, hogar_id, tipo [sobre|cartucho], cartucho_codigo nulo si es sobre, modalidad [retiro|envio], direccion, pago [simulado|no_aplica], tienda_id, estado [pendiente|despachado], fecha)

Los datos personales de prueba son inventados: ningún nombre, teléfono ni dirección real en las semillas ni en el repo.

Datos de prueba: 30 hogares en Naguanagua, San Diego y Valencia norte, 1 a 4 mediciones cada uno, algunos pedidos pendientes. Catálogo en `db/semilla_cartuchos.sql`, **marcado como ejemplo hasta que llegue el real de Tulio**. No inventes códigos ni precios como si fueran reales.

## 7. Estructura del repositorio

```
app/                      front (Vite)
  src/features/{alta,medicion,resultado,pedido,operador}
  src/components/grimuca/
  src/lib/
api/                      Fastify
  src/rutas/  src/medicion/{config/tira.ts,config/umbrales.ts,leerTira,evaluarAgua,diasParaRecambio}
  src/logistica/{demanda,inventario,alertas}
db/migraciones/  db/semilla.sql  db/semilla_cartuchos.sql
pruebas/e2e/              Playwright
docs/{diseno,negocio,marketing,calidad,decisiones}/
infra/{docker-compose.yml,desplegar.sh}
README.md  .env.example  LICENCIAS.md
```

## 8. El equipo de agentes

Un agente por responsabilidad, cada uno con territorio propio de carpetas. **Dos agentes nunca escriben en la misma carpeta.** Tú integras; la integración no se delega. Cada agente recibe este documento, su encargo y la ruta de lo que debe leer.

| Agente | Encargo | Territorio | Entrega |
|---|---|---|---|
| **Orquestador** (tú) | Lanza tandas, integra, pasa compuertas, despliega, informa a Leonardo, atiende el correo de Tulio | raíz, `docs/decisiones/` | Informe por compuerta |
| **Infra** | Inspecciona el servidor, monta contenedores, sitio en el proxy, TLS, `desplegar.sh`, `/api/salud`, respaldo de la base antes de cada migración | `infra/` | URL pública viva desde la primera hora |
| **Diseño UX/UI** | Antes del código: flujo de pantallas, especificación por pantalla (móvil 375px y proyector), estados vacíos/carga/error, textos provisionales. Durante: construye `components/grimuca` con `tokens.css`. Después: revisa capturas de cada pantalla contra `DESIGN.md` y devuelve lista de correcciones | `docs/diseno/`, `app/src/components/grimuca/` | Especificación aprobada en Compuerta 0; revisión visual en cada compuerta |
| **Especialista de agua** | Una sola corrida, antes del código: umbrales por cada uno de los 8 parámetros con referencia (guías OMS, marcados "verificar"), qué tipo de cartucho corrige cada hallazgo, qué **no** puede afirmar la app (plomo y cobre en tira son orientativos; bacterias no se miden) | `docs/negocio/agua.md` | Tabla de umbrales y de parámetro → cartucho |
| **Asesor legal** | Dos corridas: antes del código y antes de congelar. Revisa: afirmaciones de salud y publicidad (nunca "potable", alcance real de la prueba de bacterias, plomo y cobre como orientativos); datos personales que se piden (nombre, WhatsApp, dirección) con consentimiento y aviso de privacidad breve; términos de uso de una pantalla; venta y envío de kits de prueba de agua en Venezuela; uso de la marca Grimuca y de fotos de productos de terceros; licencias open source junto con Calidad; reglas del hackatón. **No reemplaza a un abogado: cada punto sin fuente verificable se marca "confirmar con abogado"** y no se presenta como certeza | `docs/legal/` | Lista de lo que la app puede y no puede decir, textos legales cortos listos para pegar, y riesgos ordenados por gravedad |
| **Dev · Plataforma** | Esqueleto, API, migraciones, semillas, tipos compartidos, SSE, README | `api/src/rutas`, `db/`, `app/src/lib` | `npm test` en verde, API con datos |
| **Dev · Medición** | `config/tira.ts` (8 parámetros W-8, fácil de cambiar), `leerTira` con visión (JSON validado, `no_legible` en vez de adivinar), carga manual, `evaluarAgua`, `diasParaRecambio`, pruebas | `api/src/medicion`, `app/src/features/medicion` | Módulo con pruebas en verde |
| **Dev · Cliente** | Alta, 4 pasos con temporizador, resultado, tarjeta de cartucho, Mi lista, pedido | `app/src/features/{alta,resultado,pedido}` | Flujo de punta a punta |
| **Dev · Operador** | Resumen por tienda, despacho en vivo, inventario contra demanda, alertas por zona | `app/src/features/operador`, `api/src/logistica` | Pedido del teléfono visible sin recargar |
| **Calidad** | Independiente de Desarrollo: no arregla, reporta. Pruebas Playwright del guion de la demo en móvil y escritorio contra la URL pública, verificación de cada compuerta, revisión de secretos, licencias (`LICENCIAS.md`), README, accesibilidad básica, y que la app nunca diga "potable" | `pruebas/`, `docs/calidad/` | Informe de fallas ordenado: rompe la demo → confunde → cosmético |
| **Business** | Borradores para Tulio: botellón contra filtro + cartuchos por familia, margen por cartucho, tira de entrada a $1 (costo real $0,18 o 2 a 4 centavos), punto de equilibrio por tienda, costo de conseguir un cliente, potencial en Latinoamérica, respuestas a las preguntas del jurado. **Cada cifra con su fuente; lo que sea supuesto se marca como supuesto** | `docs/negocio/` | Tabla del modelo + una frase por pregunta |
| **Marketing** | Borradores para Tulio: textos de la app en tono de mostrador de Grimuca (sin términos técnicos), descripción para el portal, deck de 6 láminas, guion de 3 minutos, guion del video de respaldo | `docs/marketing/` | Textos listos para pegar; deck y guion |

Business y Marketing **no esperan** a Desarrollo: arrancan en la Tanda 0 y Tulio valida sus borradores por correo.

### Tandas

Las horas son orientativas: arranca en cuanto recibas este documento y encadena las tandas sin esperar el reloj.

**Primeros 30 minutos:** Infra publica el sitio vacío en `agua.oydo.app`. Tú creas el repositorio público con `gh`. Confirma a Leonardo en una línea cuando el sitio responda y sus otros sitios sigan arriba.

**Tanda 0 · especificación (en paralelo con lo anterior, ~45 minutos):** Diseño (especificación de pantallas), Especialista de agua, Asesor legal, Business, Marketing. Los textos de Marketing y las afirmaciones del Especialista de agua pasan por el Asesor legal antes de llegar a la app. **Nadie espera aprobación de Leonardo:** Desarrollo arranca con la especificación en cuanto esté.

**Tanda 1 (hasta ~11:30 p.m.), en paralelo:** Dev Plataforma, Dev Medición, Diseño (componentes), Infra (sitio vivo con un "hola" y despliegue automático). Calidad escribe las pruebas del guion contra la especificación.

**Tanda 2 (hasta ~2:00 a.m.), en paralelo:** Dev Cliente y Dev Operador sobre la base integrada. Calidad corre contra cada integración. Diseño revisa capturas.

**Madrugada (2:00 – 5:30 a.m.), autónoma:** ciclo integrar → desplegar → Calidad → corregir, hasta pasar la Compuerta 3. Informe de la mañana listo a las 5:30.

**Domingo:**
- 5:30 a.m. Leonardo lee el informe y prueba en su teléfono.
- 8:30 a.m. calibración con tiras reales: ajustar prompt de visión y `config/tira.ts`.
- 10:00 a.m. fallas de Tulio como cliente → correcciones (primero lo que rompe la demo).
- 12:00 m. **congelar.** Calidad hace la pasada final: README, pruebas, carpetas, licencias, secretos.
- 1:30 p.m. deck y guion finales (Marketing + Tulio). 3:30 p.m. ensayo técnico.
- 4:30 p.m. entrega. Último commit antes de las 5:00 p.m.

## 9. Compuertas

**0. Decisiones de Leonardo: pasada** (sección 0). No hay más aprobaciones previas al código.
1. Tras la Tanda 1: `npm test` en verde, API con datos, `https://agua.oydo.app` responde con el esqueleto.
2. Tras integrar Cliente: flujo completo con carga manual en la URL pública, en un teléfono.
3. Tras integrar Operador: un pedido creado en el teléfono aparece en despacho sin recargar.
4. Antes de congelar: probado con tira real y foto real en la URL pública.

Calidad certifica cada compuerta con evidencia (salida de pruebas, capturas). Si algo falla se dice tal cual; no se presenta como hecho.

## 10. Autonomía y cuándo interrumpir a Leonardo

**El equipo decide solo:** nombres, librerías con licencia permisiva, estructura interna, textos provisionales, orden de trabajo, recortes dentro de "si sobra tiempo". Cada decisión propia se anota en `docs/decisiones/registro.md` (una línea: qué, por qué).

**Lo que NO se hace sin Leonardo, pase lo que pase** (no se le despierta: se anota en `bloqueos.md`, se deja para el informe de las 5:30 y se sigue con otra cosa): cambiar el track; tocar algo del servidor fuera de `/opt/agua` o volver a tocar la configuración compartida después de la primera hora; gastar dinero o crear cuentas; publicar una afirmación de salud que el Asesor legal no haya aprobado.

**Si algo tuyo rompe otro sitio del servidor:** restaura de inmediato el respaldo de lo que cambiaste, verifica que los otros sitios respondan, deja de tocar el servidor y sigue trabajando en local. Va primero en el informe.

**Git:** commits pequeños y frecuentes a `main`, con la identidad de git de Leonardo, mensajes en español, sin identificadores de IA. Sin ramas largas, sin Actions.

**Página de estado:** artifact nuevo ("Estado Grimuca Agua"), actualizado en cada compuerta: qué funciona, qué está bloqueado, qué se recortó, enlace a la demo. A las 5:30 a.m., correo a Leonardo con el informe de la mañana.

## 11. Insumos de Tulio

Tulio decide producto, textos, precios, catálogo y tiras. Sus insumos se pasan al agente que corresponde y sus correcciones mandan sobre los borradores.

| Insumo de Tulio | Estado | Afecta a |
|---|---|---|
| Tira a usar (Qteeyou W-8, 8 parámetros) | Recibido sáb 7:53 p.m. | `config/tira.ts`, Especialista de agua |
| ¿Tienen las tiras físicamente para el domingo? | Respondido sáb 8:12 p.m.: la Qteeyou no llega; se usa la que consigan en Valencia, que Tulio trae el domingo temprano | Calibración, demo |
| Rangos por casilla de la Qteeyou (referencia) | Recibido sáb 8:12 p.m., en `insumos-tulio/` | `config/tira.ts`, Especialista de agua |
| Oferta de $9 y flujo nuevo del cliente | Recibido sáb 8:12 p.m.; **pendiente de decisión de Leonardo** | Alcance, Diseño, Business, Legal |
| Foto de la tabla de colores de la tira real | Pendiente (llega con la tira, domingo) | Prompt de visión |
| Catálogo real de cartuchos (sin línea Aqual) | Pendiente ("va aparte") | `semilla_cartuchos.sql`, Business |
| Costos de delivery, importación y empaque | Pendiente de Tulio | Business |
| Tiras y 3 muestras de agua | Dom 8:30 a.m. | Compuerta 4 |
| Lista de fallas como cliente | Dom 10:00 a.m. | Correcciones |

Mientras no lleguen, se usan marcadores claros y se sigue avanzando.

## 12. Guion de la demo (3 minutos)

1. Problema en una frase (Tulio).
2. Teléfono: alta rápida → foto de la tira → semáforo → cartucho de Grimuca → pedido con retiro en Mañongo.
3. Laptop: el pedido aparece en despacho de Mañongo; inventario y alerta de zona.
4. Números y potencial en Latinoamérica (Tulio).

**Respaldos:** video grabado (dom 11:00 a.m.), datos móviles si falla el Wi-Fi, carga manual si falla la foto.

## 13. Riesgos

- **Las tiras W-8 son de Amazon y no llegan para el domingo.** Si no las tienen en mano, se usa la tira que se consiga en Valencia: por eso `config/tira.ts` es intercambiable y la carga manual existe.
- La visión lee mal con mala luz: pedir foto junto a la tabla del empaque, devolver `no_legible`, ofrecer carga manual.
- Plomo y cobre en una tira casera son orientativos: el texto debe decir "posible presencia, confirma con laboratorio", nunca un diagnóstico.
- Servidor compartido: un error de Infra puede tumbar otros proyectos. Respaldo antes de tocar el proxy y cambios mínimos.
- Wi-Fi del lugar inestable: probar con datos móviles.
- Alcance: lo que no esté listo a las 12:00 m. se corta.
