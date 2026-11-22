# Licencias

El código de Grimuca Agua es de sus autores, con **todos los derechos reservados** (archivo `LICENSE` en la raíz). Este documento lista las licencias de las librerías, fuentes y datos de terceros que usa, que no cambian.


Las licencias de esta página se leyeron del `package.json` de cada paquete instalado en `node_modules/`, el sáb 21 nov 2026. Solo se listan las **dependencias directas**; las indirectas se revisaron en bloque (ver "Dependencias indirectas").

## Resumen

- **Ninguna dependencia directa tiene licencia no permisiva.** Todas son MIT, Apache-2.0 o BSD-2-Clause (Leaflet).
- No hay licencias con copyleft (GPL, LGPL, AGPL, MPL) ni en las directas ni en las indirectas.
- Hay **cuatro puntos por resolver**, ninguno de dependencias de npm: falta el archivo `LICENSE`, falta el texto de la OFL junto a las fuentes, y están por confirmar la autorización de la marca Grimuca y la de las fotos y datos del catálogo.

## Raíz (`package.json`)

| Paquete | Versión instalada | Licencia | Uso |
|---|---|---|---|
| `@playwright/test` | 1.65.1 | Apache-2.0 | Pruebas de punta a punta (solo desarrollo) |

## API (`api/package.json`)

| Paquete | Versión instalada | Licencia | Uso |
|---|---|---|---|
| `fastify` | 5.12.8 | MIT | Servidor HTTP |
| `@fastify/multipart` | 9.4.0 | MIT | Recibir la foto de la tira |
| `@fastify/static` | 8.3.0 | MIT | Servir el front compilado |
| `pg` | 8.23.1 | MIT | Cliente de PostgreSQL |
| `tsx` | 4.23.15 | MIT | Ejecutar TypeScript sin compilar |
| `zod` | 3.25.76 | MIT | Validación de datos |
| `@types/node` | 22.20.5 | MIT | Tipos (solo desarrollo) |
| `@types/pg` | 8.23.1 | MIT | Tipos (solo desarrollo) |
| `pg-mem` | 3.0.14 | MIT | Base en memoria para pruebas (solo desarrollo). El paquete declara MIT pero no trae archivo de licencia |
| `typescript` | 5.9.3 | Apache-2.0 | Revisión de tipos (solo desarrollo) |
| `vitest` | 3.2.7 | MIT | Pruebas de unidad (solo desarrollo) |

## Aplicación (`app/package.json`)

| Paquete | Versión instalada | Licencia | Uso |
|---|---|---|---|
| `react` | 18.3.1 | MIT | Interfaz |
| `react-dom` | 18.3.1 | MIT | Interfaz |
| `react-router-dom` | 6.30.6 | MIT | Rutas del front |
| `leaflet` | 1.9.4 | BSD-2-Clause | Mapa real de las pestañas Rutas y Zonas del comercio. Permisiva: pide conservar su aviso de derechos al redistribuir (va dentro del paquete compilado) |
| `@types/leaflet` | 1.9.22 | MIT | Tipos (solo desarrollo) |
| `@testing-library/jest-dom` | 6.9.1 | MIT | Pruebas (solo desarrollo) |
| `@testing-library/react` | 16.3.3 | MIT | Pruebas (solo desarrollo) |
| `@testing-library/user-event` | 14.6.13 | MIT | Pruebas (solo desarrollo) |
| `@types/react` | 18.3.31 | MIT | Tipos (solo desarrollo) |
| `@types/react-dom` | 18.3.7 | MIT | Tipos (solo desarrollo) |
| `@vitejs/plugin-react` | 4.7.0 | MIT | Compilación (solo desarrollo) |
| `autoprefixer` | 10.7.0 | MIT | Compilación de estilos (solo desarrollo) |
| `jsdom` | 25.0.1 | MIT | Pruebas (solo desarrollo) |
| `postcss` | 8.5.33 | MIT | Compilación de estilos (solo desarrollo) |
| `tailwindcss` | 3.4.19 | MIT | Estilos (solo desarrollo) |
| `typescript` | 5.9.3 | Apache-2.0 | Revisión de tipos (solo desarrollo) |
| `vite` | 6.4.6 | MIT | Compilación del front (solo desarrollo) |
| `vitest` | 3.2.7 | MIT | Pruebas de unidad (solo desarrollo) |

Nota sobre Apache-2.0 (`@playwright/test`, `typescript`): es permisiva. Pide conservar sus avisos si se redistribuye el paquete; aquí solo se usan como herramientas y no se redistribuyen.

## Dependencias indirectas

Se recorrieron los 381 paquetes de terceros instalados (según la licencia que declara cada uno): MIT (325), ISC (25), Apache-2.0 (10), BlueOak-1.0.0 (8), BSD-3-Clause (7), BSD-2-Clause (2), MIT-0 (1), CC0-1.0 (1), CC-BY-4.0 (1) y "Public Domain" (1). Los dos que no son licencias de software habituales:

| Paquete | Licencia | Comentario |
|---|---|---|
| `caniuse-lite` | CC-BY-4.0 | Datos de compatibilidad de navegadores que usa `autoprefixer` al compilar. Pide atribución; no se redistribuye con la app. Sin acción |
| `jsonify` | Public Domain | Indirecta de las pruebas de la API. Sin restricciones. Sin acción |

## Imágenes de contenedor (`infra/`)

| Imagen | Licencia | Uso |
|---|---|---|
| `node:24-alpine` | Node.js: MIT. Alpine Linux incluye paquetes con otras licencias (entre ellas GPL) | Imagen base de la app. Se usa sin modificar y no se redistribuye |
| `postgres:16-alpine` | PostgreSQL License (permisiva, similar a MIT) | Base de datos |

## Datos y teselas del mapa

| Elemento | Dónde | Licencia | Estado |
|---|---|---|---|
| Teselas del mapa (`tile.openstreetmap.org`) | Se cargan en vivo en las pestañas Rutas y Zonas del comercio; no se copian al repositorio | Datos © colaboradores de OpenStreetMap, Open Database License (ODbL 1.0) | Atribución visible en el mapa: "© OpenStreetMap" con enlace a openstreetmap.org/copyright. Uso de demo, dentro de la política de uso de teselas de OSM (poco tráfico, sin descarga masiva). Para producción conviene un proveedor de teselas propio o contratado |
| Coordenadas de urbanizaciones y tiendas | `api/src/logistica/urbanizaciones.ts` (y su copia del front), tomadas de `docs/negocio/urbanizaciones-verificadas.md` | Datos © colaboradores de OpenStreetMap (ODbL 1.0) | Atribución en el mapa y en este archivo. Son coordenadas sueltas (3 decimales), no una copia de la base |

## Fuentes

| Fuente | Archivos | Licencia | Estado |
|---|---|---|---|
| Archivo (variable, subconjunto latino) | `app/public/fuentes/archivo-latin-wdth-normal.woff2`, `grimuca-design/assets/fonts/` | SIL Open Font License 1.1 (OFL-1.1) | **Falta** el texto de la licencia y el aviso de derechos junto a los archivos |
| Source Sans 3 (variable, subconjunto latino) | `app/public/fuentes/source-sans-3-latin-wght-normal.woff2`, `grimuca-design/assets/fonts/` | SIL Open Font License 1.1 (OFL-1.1) | **Falta** el texto de la licencia y el aviso de derechos junto a los archivos |

La OFL-1.1 permite usar, incrustar y redistribuir las fuentes, también en proyectos comerciales, con dos condiciones que aquí aplican porque los archivos `.woff2` van dentro del repositorio: **incluir el aviso de derechos de autor y el texto de la licencia**, y no vender las fuentes por sí solas. Acción: agregar `OFL.txt` (uno por fuente, con su aviso de derechos tomado del proyecto original) en `app/public/fuentes/`. Source Sans tiene además un nombre reservado: por confirmar que el subconjunto que se usa conserva el nombre de forma permitida.

## Marca, logos y contenido de terceros

| Elemento | Dónde | Estado |
|---|---|---|
| Marca **Grimuca**, logos e imagen de marca | `app/public/marca/`, `grimuca-design/assets/brand/`, colores y estilo de `grimuca-design/` | La marca y los logos de Grimuca pertenecen a su dueño y se usan con su autorización. **Por confirmar:** falta la autorización por escrito. No quedan cubiertos por la licencia MIT de este repositorio |
| Catálogo de productos (nombres, códigos, enlaces) | `insumos/catalogo/`, `db/` | Datos tomados de la web pública de la tienda. **Por confirmar** con Grimuca que se pueden publicar en un repositorio abierto |
| Fotos de productos | Se enlazan desde la web de la tienda (`foto_url`); no se copian al repositorio | Pertenecen a Grimuca o a los fabricantes. **Por confirmar** el permiso de uso en la demo |
| Marcas de fabricantes de filtros y de tiras reactivas | Textos de la app y documentos | Se nombran solo para identificar productos; pertenecen a sus dueños |

## Qué revisar otra vez antes de entregar

1. Si Desarrollo agrega una dependencia, sumarla aquí con su licencia (hoy nadie puede instalar paquetes sin avisar al orquestador).
2. Que exista `LICENSE` en la raíz.
3. Que existan los `OFL.txt` de las fuentes.
4. Que la autorización de la marca deje de decir "por confirmar", o que el README lo diga con claridad.
