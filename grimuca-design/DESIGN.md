# Grimuca — Sistema de diseño (copia local)

**Fuente:** CSS publicado de https://grimuca.com (Astro), extraído el 2026-11-21.
No existía un documento formal de reglas; esto es el sistema **tal como está implementado** en la tienda web.
Archivos: `tokens.css` (variables listas para usar), `assets/brand/` (logos), `assets/fonts/` (woff2 latin), `_raw/` (HTML y CSS originales).

> Marca: Grimuca — retail venezolano de plomería, griferías y ferretería (Big Low Center, Express, Hidrogriferías). Tema de color theme-color `#12437F`.

---

## 1. Principios (inferidos del código)

1. **Sobrio y funcional**: esquinas rectas, **sin sombras**, solo bordes finos. Parece un catálogo industrial, no una app "blanda".
2. **Accesibilidad primero**: objetivos táctiles ≥ **44px** (48px en móvil para botones de tarjeta), foco visible en todo, contrastes AA, `prefers-reduced-motion` respetado, skip-link, `aria-pressed` / `aria-current` para estados.
3. **Azul = identidad/estructura; naranja-rojizo = acción**. Un solo CTA primario por zona.
4. **Amarillo solo como acento de foco/detalle sobre azul** (nunca como fondo de botón).
5. **Solo modo claro** (`color-scheme: light`).
6. **WhatsApp es el canal de conversión** (cotizar / pedir por WhatsApp), con su icono verde.

## 2. Color

| Rol | Token | Hex | Uso |
|---|---|---|---|
| Primario | `--azul` | `#12437F` | h1–h4, enlaces, chips activos, bandas, bordes hover |
| Primario 700 | `--azul-700` | `#0E325F` | |
| Primario 900 | `--azul-900` | `#092240` | footer, sección "agua", toast |
| Primario 100 | `--azul-100` | `#DBE3EC` | estado `:active`, texto sobre azul |
| Primario 50 | `--azul-50` | `#ECF0F5` | hover, avisos, fondos suaves |
| **Acción (CTA)** | `--accion` | `#C94A0C` | botón principal, botón buscar |
| Acción hover | `--accion-700` | `#A63A06` | hover/active del CTA |
| Acento | `--amarillo` | `#FBE919` | foco sobre azul, números/iconos en banda azul, línea de eyebrow |
| Marca naranja | `--naranja` | `#EA5B13` | logo; no en UI |
| Turquesa | `--turquesa` / `-700` | `#53B4BA` / `#287379` | kicker de sección agua |
| Fondo | `--fondo` | `#FFFFFF` | |
| Papel | `--papel` | `#F6F6F6` | secciones alternas, topbar, miniaturas |
| Texto | `--tinta` | `#1B2430` | |
| Texto 2 | `--tinta-2` | `#3D3D3C` | |
| Apagado | `--apagado` | `#575756` | SKU, metadatos, placeholder |
| Línea | `--linea` | `#E0E0E0` | bordes decorativos |
| Borde control | `--borde-control` | `#8A8A89` | bordes de inputs/botones (3:1 mínimo) |
| OK | `--ok` / `--ok-bg` | `#166534` / `#E8F6EE` | disponible, "agregado" |
| Error | `--error` / `--error-bg` | `#B42318` / `#FDECEB` | cerrado/error |
| WhatsApp | `--wa` / `--wa-sobre-claro` | `#25D366` / `#128C4A` | icono (usar el oscuro sobre blanco) |

**Reglas de uso**
- Texto sobre `--azul`/`--azul-900`: blanco o `--texto-sobre-azul-2/3`; foco en **amarillo**.
- Enlaces en texto corrido: azul + subrayado con `text-underline-offset: 3px`.
- Nunca usar `--naranja` (#EA5B13) como fondo de botón con texto blanco: no cumple contraste; para eso existe `--accion`.
- Alternar secciones `--fondo` ↔ `--papel`; secciones de énfasis en `--azul` o `--azul-900`.

## 3. Tipografía

- **Títulos:** *Archivo Variable* — h1/h2 peso **800/700**, `font-stretch: 112%` (ensanchada), `letter-spacing: -0.01em`. Fallback "Arial Narrow".
- **Texto/UI:** *Source Sans 3 Variable* — fallback "Segoe UI", Arial. Base 17px, `line-height: 1.55`, `-webkit-font-smoothing: antialiased`.

| Token | Tamaño | Uso | Línea |
|---|---|---|---|
| `--t4` | clamp 32→56px | h1 (peso 800, `max-width:16ch`) | 1.05 |
| `--t3` | clamp 26→36px | h2 (peso 700) | 1.15 |
| `--t2` | clamp 20→24px | h3 (600) | 1.25 |
| `--t1` | 19px | h4 / lead / sub-hero | 1.5 |
| `--t0` | 17px | cuerpo, botones | 1.55 |
| `--t-1` | 15px | meta, chips, SKU, small | — |

- Todos los títulos van en `--azul`. Dentro de tarjetas, el nombre del producto usa Source Sans 400/700 (no Archivo) en `--tinta`.
- Kickers/eyebrows: 15px, 600, mayúsculas con `letter-spacing: .06em`, color `--apagado` (o `--turquesa` en agua).
- Números tabulares (`font-variant-numeric: tabular-nums`) para SKU, precios, cantidades.

## 4. Espaciado, layout y forma

- Escala 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.
- Contenedor `.wrap`: `width: min(1240px, 100% − 2·gutter)`, gutter 16px (24px ≥ 900px).
- Secciones: `padding: clamp(48px, 6vw, 88px) 0`.
- Grids: cuadrículas de 4 col (categorías/destacados) → 2 col (≤860px) → 1 col (≤560px). Hero 1.1fr / 1fr.
- Breakpoints observados: **560, 720, 860, 900, 1080px**.
- **Radios:** controles (botón, input, chip, badge) **2px**; tarjetas/paneles/badges "nuevo" **0**. Círculo solo para puntos de estado (8px) y muestras de acabado (16px).
- **Sombras:** ninguna, salvo drawer de lista (`-8px 0 32px rgba(0,0,0,.18)`) y dropdown de autocompletar.
- **Header:** sticky, topbar 36px en `--papel`, buscador grande (60px desktop / 56px móvil); al hacer scroll se "pliega" y su borde inferior pasa a amarillo.

## 5. Componentes

**Botón primario** `.btn-primary/.btn-solid/.btn-wa` — fondo `--accion`, texto blanco, 600, `padding 12px 24px`, `min-height 44px`, radio 2px; hover/active `--accion-700`. Con icono 20px y gap 8px. Variante WhatsApp con subtítulo `small` en dos líneas.
**Botón secundario** `.btn-outline/.btn-ghost` — fondo blanco, texto `--azul`, borde `--borde-control`; hover borde azul + fondo `--azul-50`; active `--azul-100`.
**Sobre azul** `.b-ghost` — transparente, texto blanco, borde `rgba(255,255,255,.35)`, hover borde blanco.
**Deshabilitado** — fondo y borde `--linea`, texto `--apagado`, sin eventos.

**Chip / filtro** — 36px (44px en navegación), borde `--borde-control`, radio 2px, 15px/600. Activo (`aria-pressed`/`aria-current`): fondo `--azul`, texto blanco.
**Badge** — 15px/600, padding 2×8. `open` verde, `closed` rojo (con punto de 8px); `nuevo` azul y `descontinuado` azul-900, ambos radio 0.

**Input / select / textarea** — min-height 44px, padding 0 12px, borde 1px `--borde-control`, radio 2px, fondo blanco. Foco: `outline 2px var(--foco)`, offset 2px.
**Buscador** — borde 1px; hover azul; `:focus-within` borde 2px azul + outline. Botón buscar en `--accion`, radio `0 1px 1px 0`. Autocompletado: panel con borde, cabeceras de grupo en `--azul-50`, opciones 44px, miniatura 40×40, seleccionado con `--azul-50` y outline de foco.

**Tarjeta de producto** — borde 1px `--linea`, radio 0, sin sombra; hover/focus-within borde `--azul`; active fondo `--azul-50`. Miniatura cuadrada sobre `--papel`, imagen `object-fit: contain` con `mix-blend-mode: multiply` al 84% (hover: segunda imagen). Cuerpo con padding 16px (12px móvil): nombre (2 líneas, clamp) → SKU (15px/600 apagado) → disponibilidad (punto verde 7px) → muestras de acabado (círculos 16px) → acciones "Cotizar" (icono WhatsApp) y "Agregar a lista" (secundarios, 44–48px). Estado de carga: parpadeo `papel ↔ linea` 1.2s (desactivado con reduced-motion). Sin foto: texto "Foto no disponible".
**Tarjeta de necesidad** — fondo `--papel`, borde `--linea` + **borde superior 3px `--azul`**, icono azul, h3 19px.
**Banda de confianza** (`.franja`) — fondo `--azul`, texto blanco, números en Archivo 800 28px color `--amarillo` (4 col desktop, 2 móvil).
**Footer** — `--azul-900`, texto `#DFE7F2`, secundario `#A3B1C4`, bordes `rgba(255,255,255,.12)`; acordeones en móvil (summary 52px con chevron de borde rotado), columnas en desktop; foco amarillo.
**Drawer "Mi lista"** — `dialog` pegado a la derecha, ancho `min(440px,100%)`, alto 100dvh, header 56px, backdrop `rgba(0,0,0,.45)`, stepper de cantidad con botones 44px, aviso con borde izquierdo 3px azul.
**Toast** — centrado abajo, fondo `--azul-900`, texto blanco 600, acción en amarillo subrayada; entra con fade+8px (0.18s) solo si no hay reduced-motion.
**Banner de campaña** — fondo `--azul-50`, borde inferior `--linea`, 44px mín., enlace azul subrayado, cierre 44×44.
**Eyebrow en secciones azules** — texto `--texto-sobre-azul-2` con barra amarilla de 18×3px antes.

## 6. Interacción y movimiento

- Transiciones cortas: 0.1–0.18s `ease-out` (autocompletar, toast); `border-color/background .15s` en chips y tarjetas. **Siempre** envueltas en `@media (prefers-reduced-motion: no-preference)`.
- Foco: `outline: 2px solid var(--foco); outline-offset: 2px` global; 3px en banners; amarillo en superficies azules.
- Hover = borde `--azul` + fondo `--azul-50`; Active = `--azul-100`.
- Scroll suave y `scroll-padding-top` = alto del header + 8px.

## 7. Iconografía e imagen

- Iconos de línea (SVG, 18–28px, `currentColor`): azul en navegación/tarjetas, amarillo sobre banda azul, verde WhatsApp en CTA de cotizar.
- Fotografía de producto sobre fondo blanco/papel con `multiply`; imagen social `og-01.jpg`.
- Logos: `assets/brand/logo-horizontal-azul.png` (sobre claro) y `logo-horizontal-blanco.png` (sobre azul; altura 40px en footer). Favicon 32px y apple-touch-icon.

## 8. Cómo usarlo en otro proyecto (ej. Oydo / apps de Grimuca)

```html
<link rel="stylesheet" href="grimuca-design/tokens.css">
```
Y a partir de ahí: `background: var(--accion)` para CTA, `color: var(--azul)` para títulos, `border: 1px solid var(--borde-control)` para controles, `border-radius: var(--radio-control)`, sin `box-shadow`.

## 9. Límites de esta copia

- Derivada del CSS público de la tienda; **no** incluye reglas de la app interna `grimuca.oydo.app` (si tiene su propia UI, habría que extraerla aparte).
- Las fuentes incluidas son solo el subset *latin* (suficiente para español). Licencias: Archivo y Source Sans 3 son OFL.
- `_raw/` contiene el HTML y CSS minificados originales para consultar cualquier regla no resumida aquí.
