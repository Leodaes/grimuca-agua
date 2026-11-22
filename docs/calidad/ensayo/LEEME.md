# Ensayo de la demo y respaldo (plan B)

Material del ensayo cronometrado del 22 nov (4:00 a.m.) contra `agua.oydo.app`, hecho con `pruebas/e2e/09-ensayo-demo.spec.ts` siguiendo `docs/marketing/guion-demo.md`. Todo con datos inventados: el hogar se llama "Prueba Calidad … ensayo"; los demás nombres que se ven (Sofía K., Jorge C.…) son de la semilla de demostración.

## Qué hay

- `NN-tramo.png`: una captura por tramo del guion (laptop a 1366×768, teléfono a 375×812).
- `ensayo.json`: tiempos de la app por tramo, lo que se vio en pantalla y los datos que se crearon.
- `informe.md`: tiempos, total contra los 3 minutos, diferencias guion ↔ app y fallas.
- `respaldo/`: la misma secuencia de capturas, numerada, y cinco videos del recorrido completo (WebM, se abren con Chrome, Edge o VLC):
  - `video-cliente.webm`: el teléfono del cliente, de la portada al pedido del técnico.
  - `video-comercio.webm`: la laptop en `/comercio` (Despacho, Inventario, Zonas, Productos; el pedido llega en vivo; "Despachado"; el reporte del técnico).
  - `video-comercio-rutas.webm`: la pestaña Rutas abierta todo el recorrido; se ve cómo sube de 15 a 16 entregas sola.
  - `video-red.webm`: `/red` al inicio y al final, con las cifras que suben y la actividad.
  - `video-tecnico.webm`: `/tecnico`, el servicio que llega, "Ya fui", la foto y "Atendidos".

Los videos son de la máquina, sin voz y a velocidad real (el recorrido completo dura unos 30 s): sirven para mostrar que todo pasó en vivo, no reemplazan el video de respaldo narrado (`docs/marketing/guion-video-respaldo.md`).

## Si falla la red: en qué orden mostrarlo

Primero el video narrado de respaldo, si está. Si no, Tulio narra el guion encima de estas capturas, en este orden (las que dicen "antes de subir" no se muestran):

| Bloque del guion | Capturas (en `respaldo/`) | Video |
|---|---|---|
| 1. La Red | `01-red.png` | `video-red.webm` (primeros segundos) |
| 2. Comercio | `02a-comercio-despacho.png` → `02b-comercio-inventario.png` → `02c-comercio-zonas-mapa.png` → `02e-comercio-rutas.png` (`02d-comercio-productos.png` es opcional) | `video-comercio.webm` |
| 3. Cliente | `03c-cliente-medir.png` → `03d-cliente-foto-se-ve-bien.png` → `03f-cliente-resultado-semaforo.png` → `03g-cliente-casilla-por-casilla.png` → `03h-cliente-por-que-te-lo-recomendamos.png` → `03i-cliente-mi-lista.png` → `03j-cliente-pedido-confirmado.png` | `video-cliente.webm` |
| 4. Momento clave | `04a-comercio-pedido-en-vivo.png` → `04b-comercio-rutas-recalculada.png` → `04c-comercio-despachado.png` | `video-comercio.webm` (el pedido entra sin recargar) |
| 5. Técnico | `05a-cliente-pide-tecnico.png` → `05b-cliente-servicio-pedido.png` → `05c-tecnico-servicio-asignado.png` → `05d-tecnico-ya-fui-con-foto.png` → `05e-tecnico-atendido.png` → `05f-comercio-reporte-del-tecnico.png` | `video-tecnico.webm` |
| 6. La Red refleja | `06-red-refleja.png` → `06b-red-actividad.png` | `video-red.webm` (final) |
| 7. Cierre | Láminas 5 y 6 del deck | — |

Antes de subir (no se muestran): `00-modulos.png`, `03a-cliente-portada.png` (portada sin perfil, con "Ya tengo mi sobre"), `03b-cliente-perfil.png`. `03-resultado-completo.png` es el resultado entero en una sola imagen larga, por si preguntan por una casilla.

Copiar la carpeta `respaldo/` a la laptop y al teléfono antes de salir: no depende de internet.

## El mapa sin internet

Zonas y Rutas funcionan sin internet para el fondo: si no cargan las teselas de OpenStreetMap, el mapa queda en **fondo liso** con el aviso "Sin mapa de fondo: se muestran solo los puntos y las rutas", y los círculos por urbanización, la tienda y las líneas de la ruta se siguen viendo (así lo define `docs/decisiones/contrato-red.md`; en este ensayo, con red, el fondo cargó en 0,4 s y no se probó sin ella). Ojo: eso cubre solo el fondo. Los datos del panel sí necesitan conexión con `agua.oydo.app`; sin ninguna conexión, se pasa a las capturas.

## Volver a correr el ensayo

```bash
export PATH="/c/Users/lede4/Valenhack/herramientas/node:$PATH"
set -a; . ./.env.pruebas; set +a
npx playwright test -c pruebas/playwright.config.ts --project=escritorio --reporter=line --workers=1 09-ensayo-demo
```

Cada corrida crea 1 hogar "Prueba Calidad <marca> ensayo" con su filtro, 1 medición, 1 pedido de cartucho (queda despachado) y 1 servicio técnico (queda atendido con foto), y reemplaza las capturas y los videos. No correrlo después de restablecer la demo para la tarima: suma pedidos y mediciones del mes y deja un reporte más en "Reportes del técnico".
