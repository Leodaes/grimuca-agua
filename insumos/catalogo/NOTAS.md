# Catálogo de productos de agua de Grimuca · Oasis y Aqual

Extraído el sáb 21 nov 2026, 9:00 p.m. (hora de Caracas). Archivo: `catalogo_grimuca_agua.csv`. Para regenerarlo: `node insumos/catalogo/extraer.js` desde la raíz.

## De dónde sale cada dato

Todo sale de la API pública de la tienda de grimuca.com (`/wp-json/wc/store/v1/products`), la misma que alimenta la web. No se usó ninguna credencial ni sesión iniciada, y todas las consultas fueron de solo lectura.

| Columna | Origen |
|---|---|
| `sku`, `nombre`, `id_web` | Ficha pública del producto |
| `marca` | Marca asignada en la tienda (filtro `brand=oasis` / `brand=aqual`) |
| `categorias_web` | Categorías públicas del producto |
| `categoria` | Deducida: primero la categoría web, después el nombre. Ver `extraer.js` |
| `corrige` | Deducida de palabras del nombre y la descripción pública (ver abajo) |
| `disponibilidad` | Solo «disponible» o «agotado». Las cantidades no se copian |
| `url_producto` | Enlace público que da la tienda. Hoy apunta a `wp.grimuca.com` |
| `url_foto` | Primera foto pública. No se descargó ninguna foto |

Solo se incluyen productos de las categorías de tratamiento de agua: Filtros y Purificadores con sus subcategorías, y Repuestos para filtros. Los cartuchos de grifería de la misma marca (por ejemplo, el cartucho de monomando Minioasis) quedan fuera a propósito.

## Cuántos hay

| Marca | Productos | Con precio público | `corrige` por confirmar |
|---|---|---|---|
| Oasis | 104 | 0 | 16 |
| Aqual | 34 | 0 | 4 |
| **Total** | **138** | **0** | **20** |

Por categoría:
- **Oasis:** 18 cartuchos, 13 portafiltros, 10 filtros, 10 membranas de ósmosis, 9 filtros desbarradores, 7 membranas de ultrafiltración, 5 tanques de ósmosis, 4 sistemas de ósmosis inversa, 2 suavizadores, 2 repuestos y 24 accesorios.
- **Aqual:** 22 cartuchos, 5 filtros, 3 sistemas de ósmosis inversa, 2 membranas de ósmosis y 2 portafiltros.

## Precios

**Ningún precio es público.** Las fichas de grimuca.com dicen «Precio y stock por WhatsApp», y la API pública no devuelve precio. Todas las filas tienen `precio` vacío y `precio_publico: no`. Si la demo necesita precios, alguien de Grimuca tiene que decidir cuáles se pueden publicar.

## Cómo se dedujo `corrige`

Por palabras que aparecen en el nombre o la descripción pública:
- `sedimentos`: sedimentos, polipropileno, PP, micras, plisado, desbarrador.
- `cloro_sabor`: carbón, GAC, CTO, cloro, sabor, olor.
- `dureza`: suavizador, resina, dureza, sarro, polifosfato.
- `metales`: plomo, cobre, metales pesados, KDF.
- `nitratos`: nitrato. Ningún producto lo menciona.
- `osmosis_inversa`: ósmosis.

Un producto puede corregir varias cosas; se separan con `|`. Los 24 accesorios (válvulas, mangueras, grifos, difusores y similares) llevan `no_aplica`, porque no tratan el agua por sí solos.

## Qué quedó «por_confirmar» (20)

- **Lámparas ultravioleta, sus repuestos y un esterilizador (10):** tratan bacterias, y esa opción no está en la lista de `corrige`. Como la demo incluye una prueba de bacterias, conviene agregar `bacterias` a esa lista. Esa decisión le toca al equipo.
- **Membranas y cartuchos de ultrafiltración (3):** la ficha no dice qué retienen.
- **Portamembranas, carcasas y un anillo O-ring (7):** son piezas de soporte; la ficha no dice qué tratan.

## Lo que no se copió

Costos, márgenes, precios de proveedor, cantidades en inventario y cualquier dato que no se vea en la web pública.
