# Revisión legal final · Grimuca Agua

Asesor legal · domingo 22 nov 2026 · solo lectura sobre `app/src/` (sin `*.test.*`) y `api/src/rutas/motivos.ts`; pasada sobre `deck.md`, `portal.md`, `una-pagina.md` y `preguntas-jurado.md`.
**No reemplaza a un abogado.** Lo marcado "confirmar con abogado" no es certeza. Norma aplicada: `puede-y-no-puede-decir.md` y `textos.md`.

## 1. Documentos de marketing y negocio (ya corregidos)

- Deck, portal, página única y preguntas: sin "potable", "segura" ni "apta" como afirmación (aparecen solo en la lista de lo que no se dice y en negativo), sin "elimina", "purifica" ni promesas de salud. Plomo y cobre solo como "posible presencia, confirma con un laboratorio".
- Cambios hechos: pie legal en la lámina 3 (la lámina con resultados), frase de que la prueba de bacterias no certifica en la lámina 2, en el portal y en la pregunta 13, y el cliente final del portal pasa de "preocupados por el agua que toman sus hijos" a "que quieren saber más del agua de su casa" (se evita atar el mensaje a la salud de los hijos).
- Las cifras de rutas (15 entregas en 3 rutas, 51,0 km contra 109,4 km, 53% menos) se rotulan como cálculo sobre datos de demostración, no como ahorro medido.

## 2. App y API: lo que está bien

| Qué | Dónde | Veredicto |
|---|---|---|
| Aviso fijo literal "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar." | `components/grimuca/Aviso.tsx:31` (`TEXTO_AVISO_TIRA`) y `features/resultado/textos.ts:88-89` (`AVISO_FIJO`) | Literal, idéntico al aprobado. "Apta" solo en negativo |
| Pantalla de resultado | `PaginaResultado.tsx:165` (`<AvisoTira />`) y pie en `:166` (`PIE_ORIENTACION`, `textos.ts:34`) | Presente |
| Pantalla de la prueba de bacterias | `PaginaBacterias.tsx:236` (`<AvisoTira />`); textos `textos.ts:96` y `:98` | Presente. El frasco sin cambio dice que no certifica; el que cambió dice "posible presencia" y manda al laboratorio |
| Portada de venta | `PortadaVenta.tsx:156` (aviso literal) y `:199`, `:249` (línea orientativa) | Presente |
| Sugerencia de lámpara UV y catálogo | `PaginaBacterias.tsx:22`, `catalogo/filtros.ts:42` | "No significa que el agua quede apta para tomar": en negativo, bien |
| Legales | `alta/Legales.tsx:66-71, 79` | Dice que no certifica, no es consejo de salud y la posible presencia se confirma en laboratorio |
| Plomo y cobre | `components/grimuca/FilaParametro.tsx:58`; `operador/datosZonas.ts:16-17` | "Posible presencia. Confirma con un laboratorio" |
| Título de bienvenida "Descubre la calidad del agua de tu casa" | `alta/portada/Banners.tsx:10, 62` | Permitido porque la línea "Medición orientativa con tira. No es un análisis de laboratorio." va en la misma pantalla (`Banners.tsx:78`) |
| Resumen en verde | `textos.ts:67-70` | "Lo que midió la tira está en rango": no es un veredicto del agua |
| Frases de "por qué te lo recomendamos" | `api/src/rutas/motivos.ts` | Ver sección 4 |

Búsqueda de "potable", "segura", "apta", "elimina", "purifica", "garantiza", "100%", "sano", "saludable" en `app/src/` (sin pruebas): "potable", "elimina", "purifica", "garantiza", "sano" y "saludable" no aparecen. "Apta" aparece solo en los cuatro textos aprobados en negativo (`Aviso.tsx:31`, `Legales.tsx:68`, `filtros.ts:42`, `PaginaBacterias.tsx:22`, `textos.ts:34, 89, 98`). "Segura/seguros/Seguro" son nombres de código (`Temporizador.tsx`, `destinoSeguro`), no texto visible. "100%" son anchos de CSS.

## 3. Pantallas con resultado: dónde aparece el aviso fijo y dónde falta

| Pantalla | Muestra | Aviso fijo literal | Observación |
|---|---|---|---|
| `/resultado/:id` (`PaginaResultado`) | Semáforo, casillas, productos | Sí | Bien |
| Bacterias (`PaginaBacterias`) | Frasco, resultado a las 48 h | Sí | Bien |
| Portada de venta (`PortadaVenta`) | Ejemplo de tira | Sí | Bien |
| Portada con hogar (`Tablero.tsx:83-85`) | Semáforo de la última medición | **No** | Lleva al pie "Medición orientativa con tira. No es un análisis de laboratorio." (`:125`), no el literal. Ver cambio 1 |
| Historial (`PaginaHistorial.tsx:87-88`) | Semáforo por fecha | **No** | Sin aviso ni línea orientativa. Ver cambio 2 |
| Mensaje al comercio (`textos.ts:196-208`) | "Casillas para vigilar o atender" y "Todas las casillas medidas salieron en Verde" | No (es el texto que se envía a la tienda) | Plomo y cobre con "(orientativo)". Aceptable; no se afirma nada sobre el agua |
| Zonas del comercio (`operador/Zonas.tsx`) | Mapa y alertas por urbanización | Línea propia (`:376`) "señal para revisar, no un diagnóstico" | Ver cambio 4 |

## 4. Lo que hay que cambiar en la app (archivo, línea, texto actual → propuesto)

Prioridad alta (dos pantallas del cliente con semáforo y sin el aviso literal; cambios de una línea):

1. `app/src/features/alta/portada/Tablero.tsx:124-126` (junto al semáforo de la portada con hogar). Actual: `{LEMA}. Medición orientativa con tira. No es un análisis de laboratorio.` → Propuesto: agregar debajo `<p className="g-apagado p-pie-tablero">{TEXTO_AVISO_TIRA}</p>` (importar `TEXTO_AVISO_TIRA` de `components/grimuca`). Texto: "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."
2. `app/src/features/resultado/PaginaHistorial.tsx` (después de la lista de mediciones, cerca de `:100`). Actual: sin aviso. → Propuesto: `<AvisoTira />`, con el mismo componente de `PaginaResultado`.

Prioridad media (palabras que dan certeza o alarma sobre el agua):

3. `app/src/features/resultado/textos.ts:26-27` (QUE_MIDE de cobre y plomo). Actual: "Vienen de las tuberías viejas. Con esto no se juega." → Propuesto: "Pueden venir de las tuberías. La tira solo marca una posible presencia: confirma con un laboratorio." (afirma un origen como hecho y usa un tono de alarma).
4. `app/src/features/resultado/textos.ts:28-29` (QUE_MIDE de nitrato y nitrito). Actual: "Vienen de la tierra, de abonos o del pozo séptico. Es una señal de alerta de contaminación." → Propuesto: "Pueden venir de la tierra, de abonos o del pozo séptico. Es una casilla para vigilar: confirma con un laboratorio." ("Contaminación" es una acusación sobre el agua del hogar; `puede-y-no-puede-decir.md`, NO puede decir 4).
5. `app/src/features/alta/portada/PortadaVenta.tsx:33-35`. Actual: Nitrito "Igual que el nitrato: señal de alerta."; Cobre y Plomo "Posible presencia, de tuberías viejas." → Propuesto: Nitrito "Igual que el nitrato: una casilla para vigilar."; Cobre y Plomo "Posible presencia; confirma con un laboratorio."
6. `api/src/rutas/motivos.ts:50-51`. Actual: nitrato y nitrito "es una señal de alerta que conviene atender" → Propuesto: "es una casilla para vigilar y confirmar con un laboratorio". Además, cuando el motivo nombre nitrato o nitrito, agregar la `NOTA_LABORATORIO` como ya se hace con plomo y cobre (`motivos.ts:268`: `p.clave === 'plomo' || p.clave === 'cobre'` → incluir `'nitrato'` y `'nitrito'`).

Prioridad baja (vocabulario del comercio, no del cliente):

7. `app/src/features/operador/Zonas.tsx:243`, `:289` y `MapaHexagonos.tsx:84`. Actual: "Calidad del agua por urbanización", "Calidad del agua", "Mapa de calidad del agua por urbanización" → Propuesto: "Resultados de la tira por urbanización", "Resultados de la tira", "Mapa de resultados de la tira por urbanización" (el mapa agrega mediciones caseras orientativas; "calidad del agua" suena a dictamen sobre una zona y roza la regla 9: no decir que el agua de una zona es mala).
8. `app/src/features/operador/Zonas.tsx:143`. Actual: título "Posible problema en la zona." → Propuesto: "Varios hogares de la zona reportaron resultados fuera de rango." (es la frase aprobada en la tabla de reemplazos).

Las frases de `motivos.ts` (revisadas completas): usan "Está pensado para", "reducir bacterias según el fabricante", "mejorar el sabor y el olor" y "retener la tierra y el sedimento"; no usan "elimina", "quita", "corrige", "purifica", "apta", "segura" ni "potable" (y una prueba con `PALABRAS_PROHIBIDAS` lo vigila, `motivos.ts:36`); plomo y cobre llevan la nota de laboratorio. Lo único a corregir es lo de nitrato y nitrito (cambio 6). El comentario de `motivos.ts:42` ("lo que más importa para la salud") es interno y no se muestra.

## 5. Lo que sigue marcado "confirmar con abogado"

1. Línea de precaución en rojo ("usa otra agua para tomar y cocinar"): si basta o si debe nombrar a bebés y embarazadas (`revision-2.md`, punto 1).
2. Venta de lámparas UV y cartuchos con propiedades sobre el agua de consumo: si exigen registro o permiso sanitario y qué puede decir su publicidad.
3. Publicidad engañosa: texto exacto y sanciones (art. 117 de la Constitución; art. 17 de la Ley Antimonopolio, de fuente secundaria).
4. Datos personales: aviso de privacidad, plazo de 12 meses, envío de la foto a un proveedor externo y servidor fuera del país (arts. 28 y 60 de la Constitución).
5. Forma de exhibir precios en divisas y en bolívares para la venta real.
6. Permisos de importación, rotulado en español y registro o notificación sanitaria para vender sobres y reactivos al mayor a las ferreterías (`riesgos.md`); esto toca la línea de ingreso de $5,50 por sobre al mayor.
7. Valores de la norma venezolana (Gaceta Oficial 36.395): no se citan cifras.
8. Marcadores sin llenar en `textos.md`: `[RESPONSABLE]`, `[CONTACTO]`, `[PROVEEDOR]`, `[FECHA]`.
9. Nuevo: membresía a ferreterías y comisión por transacción (contrato de adhesión, términos de la plataforma y responsabilidad de Grimuca como operador y comercio a la vez, pregunta 15 del jurado) y uso de la marca de un tercero en los comercios de demostración (Lara y Aragua).
10. Mapa de zonas: mostrar a un comercio qué urbanizaciones tienen resultados fuera de rango; confirmar que no equivale a señalar públicamente a una zona (hoy es un panel interno del comercio, no público).
