# Grimuca Agua

**Saber qué tomas empieza en casa.**

Grimuca Agua le permite a una familia medir el agua de su casa con una tira reactiva y una foto. La aplicación lee la tira, explica cada indicador con un semáforo y recomienda el filtro o el cartucho que corresponde a ese hogar, diciendo por qué. El pedido sale de la tienda Grimuca más cercana y aparece en vivo en el panel del operador, junto con el inventario que hace falta y un mapa de la calidad del agua por urbanización.

Proyecto del Hackatón ValenValley 2026 (Valencia, Venezuela), track **Logística**.

- **Demo:** https://agua.oydo.app
- **Panel del operador:** https://agua.oydo.app/operador (pide un PIN)

## El problema

En Valencia muchas familias dependen del botellón o de filtros que nadie sabe cuándo cambiar, y casi nadie mide el agua que sale por su chorro. Cada hogar con botellón mueve más de dos toneladas de agua al año en entregas semanales.

## La solución

1. El cliente compra un **sobre de $9** en el mostrador o lo pide a domicilio. Trae una tira reactiva, una prueba casera de bacterias, la tabla de colores y un código QR.
2. Escanea el QR, cuenta cómo es su casa (zona, urbanización, cuántos viven, mascotas, origen del agua) y, si ya tiene filtro, le toma una foto: la aplicación identifica el tipo de filtro y los cartuchos que usa.
3. Mide y sube la foto de la tira. Si la foto no se puede leer, carga los colores a mano.
4. Ve un resultado **por indicador** (verde, amarillo o rojo) en lenguaje simple, con productos recomendados y la razón de cada uno: *"Te recomendamos esta ósmosis inversa porque tu medición dio Nitrato en Rojo…"*.
5. Cotiza por WhatsApp con la tienda, agrega productos a su lista y hace el pedido con retiro o envío. También puede ver el catálogo completo, seguir un tutorial para cambiar el cartucho o pedir que un técnico lo haga.

### Por qué es logística

Las tres tiendas de Grimuca (Mañongo, Big Low y CC CEM) funcionan como almacenes de despacho. El operador ve:

- **Despacho en vivo:** sobres por enviar, cartuchos y servicios técnicos, por tienda y zona. El pedido hecho en el teléfono aparece sin recargar la página.
- **Resumen por tienda:** hogares, pedidos pendientes y recambios previstos a 7 y 30 días.
- **Inventario contra demanda:** existencias frente a la demanda de los próximos 30 días, con los faltantes en rojo.
- **Mapa por urbanización:** hexágonos con el estado del agua y con las zonas donde hay o no hay clientes; alerta cuando tres o más hogares de una urbanización miden en rojo en una semana.

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
| Despliegue | Contenedores con Docker Compose y un guion de despliegue por SSH |
| Pruebas | Vitest (unidad y componentes) y Playwright (recorrido de la demo en teléfono y escritorio) |

La tira en uso se define como una lista de parámetros en [`api/src/medicion/config/tira.ts`](api/src/medicion/config/tira.ts), para cambiarla sin tocar el resto del código, y el lector tolera casillas que falten.

## Estructura del repositorio

```
app/                  front
  src/features/       alta, medicion, resultado, pedido, catalogo, filtro, tutoriales, operador
  src/components/grimuca/   componentes del sistema de diseño
  src/lib/            cliente de la API, sesión y tipos
api/                  API
  src/rutas/          rutas HTTP
  src/medicion/       tira, umbrales, lectura de la foto y evaluación del agua
  src/filtro/         identificación del filtro del hogar y cartuchos compatibles
  src/logistica/      demanda, inventario, alertas y mapa por urbanización
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
cp .env.example .env          # completa DATABASE_URL, PIN_OPERADOR y SECRETO_SESION
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

## Datos

Los hogares, teléfonos, direcciones, mediciones y pedidos de demostración son inventados. El catálogo es el público de la marca Oasis en grimuca.com, sin precios: la aplicación invita a cotizar por WhatsApp. La lista de urbanizaciones del mapa se verificó contra OpenStreetMap y sus posiciones en el tablero son aproximadas ([`docs/negocio/urbanizaciones-verificadas.md`](docs/negocio/urbanizaciones-verificadas.md)).

## Documentos

- Modelo de negocio: [`docs/negocio/modelo.md`](docs/negocio/modelo.md) y [`docs/negocio/una-pagina.md`](docs/negocio/una-pagina.md)
- Deck y guion de la demo: [`docs/marketing/`](docs/marketing/)
- Especificación de pantallas y componentes: [`docs/diseno/`](docs/diseno/)
- Decisiones del equipo y pendientes: [`docs/decisiones/`](docs/decisiones/)

## Licencias

El código se publica bajo la licencia MIT ([`LICENSE`](LICENSE)). Las dependencias y sus licencias están en [`LICENCIAS.md`](LICENCIAS.md). La marca Grimuca, sus logos y las fotos de productos pertenecen a sus dueños y no quedan cubiertos por la licencia del código.

## Equipo

Leonardo Dávila y Tulio Dávila.
