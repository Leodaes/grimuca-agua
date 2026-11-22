# Grimuca Agua

**Saber qué tomas empieza en casa.**

Grimuca Agua es una plataforma para ferreterías que Grimuca opera. Una familia mide el agua de su casa con una tira reactiva y una foto; la aplicación lee la tira, explica cada indicador con un semáforo y recomienda el filtro o el cartucho que corresponde a ese hogar, diciendo por qué. Ese hogar queda asignado a la ferretería de su zona, y los centros de llenado de la red publican sus propias mediciones para las familias que siguen con botellón. La ferretería recibe el pedido en vivo, ve su inventario contra la demanda prevista, sus rutas de despacho agrupadas por urbanización y las visitas de su técnico. La medición es la puerta de entrada; el valor grande está del lado del comercio.

Proyecto del Hackatón ValenValley 2026 (Valencia, Venezuela), track **Logística**.

- **Demo:** https://agua.oydo.app
- **Los cuatro módulos:** https://agua.oydo.app/modulos (los paneles de comercio, técnico y red piden un PIN, que no está en este repositorio)

## Los cuatro módulos

| Módulo | Dirección | Quién lo usa | Qué hace |
|---|---|---|---|
| Cliente | `/` | La familia | Pide o escanea el sobre, mide con foto y confirma lo que leyó la foto, ve su resultado (primero el agua, después lo que se le recomienda y por qué), pide con retiro o envío, registra el cambio de cartucho, sigue tutoriales, pide un técnico y ve el centro de llenado más cercano con sus mediciones |
| Comercio | `/comercio` | La ferretería | Despacho en vivo, resumen, inventario contra demanda, productos propios con foto, búsqueda y orden, rutas de despacho por las calles y mapa por urbanización con "Zonas para invitar a medir". Cada comercio ve solo lo suyo. Los centros de llenado publican aquí sus resultados |
| Técnico | `/tecnico` | El técnico de la ferretería | Servicios asignados en el orden de la ruta, "Ya fui" y foto de cómo quedó, que queda como reporte para el comercio |
| Red | `/red` | Grimuca, como operador de la red | Ferreterías y centros de llenado por estado, plan y periodo gratis, cifras de toda la red y alta de un comercio nuevo |

## El problema

En Valencia muchas familias dependen del botellón o de filtros que nadie sabe cuándo cambiar, y casi nadie mide el agua que sale por su chorro. Cada hogar con botellón mueve más de dos toneladas de agua al año en entregas semanales.

## La solución

1. El cliente compra un **sobre de $9** en el mostrador o lo pide a domicilio. Trae una tira reactiva, una prueba casera de bacterias, la tabla de colores y un código QR.
2. Escanea el QR, cuenta cómo es su casa (zona, urbanización, cuántos viven, mascotas, origen del agua) y, si ya tiene filtro, le toma una foto: la aplicación identifica el tipo de filtro y los cartuchos que usa.
3. Mide y sube la foto de la tira (la de la demo es la Qteeyou 8 en 1). La lectura depende de la luz, así que la aplicación muestra lo que leyó la foto y la persona lo confirma o lo corrige antes de ver el resultado ("¿Esto es lo que ves en tu tira?"). Si la foto no se puede leer, carga los colores a mano.
4. Ve un resultado **por indicador** (verde, amarillo o rojo) en lenguaje simple, con productos recomendados y la razón de cada uno: *"Te recomendamos esta ósmosis inversa porque tu medición dio Nitrato en Rojo…"*.
5. Cotiza por WhatsApp con la tienda, agrega productos a su lista y hace el pedido con retiro o envío. También puede ver el catálogo completo, seguir un tutorial para cambiar el cartucho o pedir que un técnico lo haga.

### Por qué es logística

Hoy la ferretería compra, guarda y despacha repuestos sin saber cuándo le toca el cambio a cada cartucho. Con la medición y la fecha del último cambio, cada recambio tiene fecha y referencia conocidas con semanas de anticipación. Grimuca es el comercio de Carabobo, con tres tiendas (Mañongo, Big Low y CC CEM) que funcionan como almacenes de despacho; en otros estados entran ferreterías aliadas. Cada comercio ve:

- **Despacho en vivo:** sobres por enviar, cartuchos y servicios técnicos, por tienda y zona. El pedido hecho en el teléfono aparece sin recargar la página.
- **Resumen por tienda:** hogares, pedidos pendientes y recambios previstos a 7 y 30 días.
- **Inventario contra demanda:** existencias frente a la demanda de los próximos 30 días, con los faltantes en rojo.
- **Rutas de despacho:** las entregas con envío y las visitas técnicas pendientes se agrupan por urbanización y se ordenan en una ruta por tienda, trazada por las calles sobre un mapa real, con la distancia de la ruta contra la de los viajes sueltos. Con los datos de demostración: 15 entregas en 3 rutas, 51,0 km contra 109,4 km (53 % menos).
- **Mapa por urbanización:** el estado del agua y las zonas donde hay o no hay clientes, sobre un mapa real o un tablero de hexágonos; cuando tres o más hogares de una urbanización tienen casillas en rojo en una semana, la urbanización pasa a "Zonas para invitar a medir" y la ferretería puede invitar a los vecinos que aceptaron avisos (WhatsApp simulado en la demo, sin nombrar hogares).
- **Centros de llenado:** publican cada mes la medición de su grifo de despacho, siempre, también cuando sale fuera de rango; el cliente ve el más cercano a su casa.

Se reemplaza el reparto semanal de botellones por envíos pequeños de cartuchos, solo cuando la medición o el calendario de recambio lo piden.

## Lo que la aplicación no dice

La medición con tira es orientativa. La aplicación nunca afirma que el agua se puede tomar, y lo repite en cada resultado: *"Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."* Plomo y cobre se informan como posible presencia que debe confirmar un laboratorio. La prueba de bacterias no certifica el agua. Los criterios están en [`docs/legal/`](docs/legal/) y los umbrales, con sus referencias, en [`docs/negocio/agua.md`](docs/negocio/agua.md).

## Arquitectura

| Parte | Tecnología |
|---|---|
| Front | Vite, React, TypeScript y Tailwind, con el sistema de diseño de grimuca.com |
| API | Node, Fastify y TypeScript, con validación de entradas |
| Base de datos | PostgreSQL, con migraciones SQL numeradas |
| Tiempo real | Eventos enviados por el servidor (SSE) alimentados por `LISTEN/NOTIFY` de PostgreSQL, con sondeo de respaldo |
| Lectura de fotos | Servicio de visión llamado solo desde el servidor; devuelve "no legible" en lugar de adivinar |
| Mapa | Leaflet con teselas de OpenStreetMap; rutas por las calles con OSRM (código abierto). Si OSRM no responde, las rutas se dibujan en línea recta; sin conexión, el mapa sigue con fondo liso |
| Despliegue | Contenedores con Docker Compose y un guion de despliegue por SSH |
| Pruebas | Vitest (unidad y componentes) y Playwright (recorrido de la demo en teléfono y escritorio) |

La tira en uso se define como una lista de parámetros en [`api/src/medicion/config/tira.ts`](api/src/medicion/config/tira.ts), para cambiarla sin tocar el resto del código, y el lector tolera casillas que falten.

## Estructura del repositorio

```
app/                  front
  src/features/       alta, medicion, resultado, pedido, catalogo, filtro, tutoriales (cliente); operador (comercio); tecnico; red
  src/components/grimuca/   componentes del sistema de diseño
  src/lib/            cliente de la API, sesión y tipos
api/                  API
  src/rutas/          rutas HTTP
  src/medicion/       tira, umbrales, lectura de la foto y evaluación del agua
  src/filtro/         identificación del filtro del hogar y cartuchos compatibles
  src/logistica/      demanda, inventario, alertas, mapa por urbanización y rutas de despacho
db/                   migraciones, catálogo y datos de demostración
pruebas/e2e/          recorrido de la demo con Playwright
infra/                contenedores y guion de despliegue
docs/                 diseño, negocio, marketing, legal, calidad y decisiones
grimuca-design/       tokens, fuentes y logos del sistema de diseño
insumos/catalogo/     catálogo público de productos de agua de Grimuca
```

## Cómo correrlo

Requisitos: Node 22 o superior y PostgreSQL 16 (o Docker).

```bash
npm install
cp .env.example .env          # completa DATABASE_URL, SECRETO_SESION y los PIN de cada rol
npm run migrar -w api -- --semilla   # crea las tablas y carga el catálogo y los datos de demostración
npm run build                 # compila el front
npm run start -w api          # sirve la API y el front en http://localhost:3070
```

Para desarrollo: `npm run dev:api` y `npm run dev:app` (el front reenvía `/api` al puerto 3070).

Sin clave del servicio de visión, o con `LECTOR_SIMULADO=1`, la lectura de la foto devuelve un ejemplo fijo y todo el recorrido funciona con la carga manual. Las variables están explicadas en [`.env.example`](.env.example).

Con Docker: `docker compose --env-file <archivo de variables> -f infra/docker-compose.yml up -d --build`. El despliegue al servidor está descrito en [`infra/LEEME.md`](infra/LEEME.md).

## Pruebas

```bash
npm test          # unidad y componentes (API y front)
npm run revisar   # tipos
npm run e2e       # recorrido de la demo contra la dirección pública (URL_BASE para cambiarla)
```

Los informes de calidad, con la evidencia de cada compuerta y las capturas, están en [`docs/calidad/`](docs/calidad/).

## Videos de la demo

Clips cortos grabados del sitio real, uno por momento del guion, en [`docs/marketing/video/clips/`](docs/marketing/video/clips/LEEME.md).

## Datos

Los hogares, teléfonos, direcciones, mediciones y pedidos de demostración son inventados. El catálogo es el público de la marca Oasis en grimuca.com, sin precios: la aplicación invita a cotizar por WhatsApp. La lista de urbanizaciones del mapa se verificó contra OpenStreetMap y sus posiciones en el tablero son aproximadas ([`docs/negocio/urbanizaciones-verificadas.md`](docs/negocio/urbanizaciones-verificadas.md)).

## Documentos

- Modelo de negocio: [`docs/negocio/modelo.md`](docs/negocio/modelo.md) y [`docs/negocio/una-pagina.md`](docs/negocio/una-pagina.md)
- Deck y guion de la demo: [`docs/marketing/`](docs/marketing/)
- Especificación de pantallas y componentes: [`docs/diseno/`](docs/diseno/)
- Decisiones del equipo y pendientes: [`docs/decisiones/`](docs/decisiones/)

## Licencias

Todos los derechos reservados ([`LICENSE`](LICENSE)). El acceso a este repositorio para la evaluación del hackatón no concede derechos de uso. Las dependencias de terceros conservan sus propias licencias, listadas en [`LICENCIAS.md`](LICENCIAS.md). La marca Grimuca, sus logos y las fotos de productos pertenecen a sus dueños.

## Equipo

Leonardo Dávila y Tulio Dávila.
