# Informe de Calidad · Pasada 3 · domingo 22 nov 2026, mañana

**Probado en:** `https://agua.oydo.app`, en dos versiones:
1. Commit `c9b47f9`: onboarding nuevo, Mi filtro con tarjetas, resultado nuevo, recordatorios, WhatsApp simulado, "Cerrar sesión" y "Resultados de la tira".
2. Commit `af07b71`: resultado compacto y tira real (Qteeyou 8 en 1). Lo confirmé en el sitio: "Ver qué te recomendamos", casillas en verde plegadas y "Ver más opciones".

Calidad no usa git: los hash vienen del coordinador.

**Datos:** la base **no** se reinició ni se borró nada. Tulio probaba al mismo tiempo ("Prueba Tulio", en Miranda).
**Comando:** por archivo, `npx playwright test -c pruebas/playwright.config.ts --reporter=line --workers=2 <archivo>`, con los PIN cargados desde `.env.pruebas`.
**Incidente:** a las 10:14 a. m. se cayó internet a mitad de una corrida de `07`. Esa corrida no cuenta: se repitió completa.

**Veredicto:** con la versión `af07b71`, pasan `01`, `02`, `03`, `05`, `07` y `08`. **`09` falla 2 veces de 2** por una falla real de la app que rompe el momento clave de la demo (F1: el pedido se va a otra tienda). No hay "potable" en ninguna pantalla ni en la API.

## Resultado por archivo (última corrida)

| Archivo | Versión | Pasan | Fallan | Saltadas | Duración | Notas |
|---|---|---|---|---|---|---|
| `01-salud` | af07b71 | 66 | 0 | 0 | 1,9 min | |
| `02-cliente-manual` | af07b71 | 2 | 0 | 0 | 13 s | Se ajustó la prueba: fila "Nitrato" |
| `03-despacho-en-vivo` | c9b47f9 | 2 | 0 | 0 | 10 s | No toca el resultado; no se repitió |
| `05-accesibilidad` | af07b71 | 26 | 0 | 0 | 56 s | Se ajustó la prueba: foco en `/perfil` (falso positivo) |
| `07-funciones-nuevas` | af07b71 | 11 | 0 | 11 (a propósito) | 2,5 min | 2 pruebas nuevas y comprobaciones nuevas |
| `08-red-de-comercios` | af07b71 | 1 (12/12 pasos) | 0 | 1 (a propósito) | 57 s | Conteos ajustados a los datos de Tulio |
| `09-ensayo-demo` | af07b71 | 0 | **1 (tramos 04a y 04c)** | 1 (a propósito) | 1,3 min | **F1**. Con `c9b47f9` había pasado 22/22 |

Las pruebas saltadas son las que corren en un solo proyecto, por diseño.

## Fallas reales de la app (no se arreglaron)

### Rompen la demo

**F1 · "Hacer pedido" con envío manda el pedido a otra tienda si el hogar todavía no cargó (app)**
- **Qué pasa:** en `/lista`, el pedido con envío usa `hogar?.tienda_id || tiendaId || 'cem'` (`app/src/features/pedido/PaginaLista.tsx`). Si se toca "Hacer pedido" antes de que llegue `GET /api/hogares/:id`, se usa otra tienda:
  - la primera de `/api/tiendas` (Big Low), si la lista de tiendas ya llegó;
  - `cem`, si todavía no llegó nada.
- **Qué ve el comercio:** el pedido no entra en Despacho filtrado en Mañongo. Es el **momento clave del guion (Bloque 4)**.
- **Evidencia:** las dos corridas de `09` con `af07b71`. En ambas, el hogar (Naguanagua, El Naranjal) tiene `tienda_id = manongo` en la API:

  | Pedido | Tienda donde quedó | Tiempo de toda la acción |
  |---|---|---|
  | N.º 176 | `biglow` | 0,7 s |
  | N.º 178 | `cem` | 2,2 s |

  Si se abre `/lista` con calma, la tienda sale bien (`manongo`), así que es una carrera de tiempos.
- **Captura:** `capturas/95-pedido-envio-sale-de-cem-con-hogar-de-manongo.png` ("Sale de Grimuca CC CEM").
- **Pasos:**
  1. Haz el perfil en Naguanagua.
  2. Mide y toca "Agregar a mi lista".
  3. Toca "Mi lista" en la barra.
  4. Toca "Envío a mi dirección", escribe la dirección y toca "Hacer pedido" enseguida.
  5. Mira la tienda del pedido.
- **Arreglo sugerido:** que "Hacer pedido" espere al hogar, o que mande el pedido sin `tienda_id` para que el servidor ponga la del hogar.
- **Limpieza:** los pedidos 176 y 178 quedaron despachados por la API para que no queden pendientes.

**F2 · El producto de prueba "PC-PRUEBA-MWRUZKJ5I4" sale como "La mejor opción para tu casa" (datos)**
- **Qué es:** un repuesto llamado "Prueba Calidad producto MWRUZKJ5I4", marcado "Pensado para: Bacterias", con 0 existencias y sin foto. Lo creó Calidad en la pasada 2 (`08`, paso j) dentro de Grimuca.
- **Dónde aparece:** en el catálogo de cada cliente de Grimuca (81 productos en lugar de 80). Además, es el **único sugerido** cuando un hogar de **tanque o pozo** sale todo en verde.
- **Captura:** `capturas/94-todo-verde-tanque-sugiere-producto-de-prueba.png`.
- **Pedido a Desarrollo:** borrarlo antes de la demo. Calidad no borra datos.

**F3 · La base no está como dice el guion (datos)**
- `/red` muestra **5 comercios en 5 estados**: se suman "Prueba Tulio" (Miranda) y "Prueba Calidad Comercio" (Zulia), pero el guion habla de 3.
- El Despacho de Grimuca (Mañongo) tiene **52 pedidos pendientes**, pero el guion dice "El despacho está vacío".
- **Qué hacer:** reiniciar los datos antes de la demo y borrar los comercios "Prueba …".

### Confunden

**F4 · Cualquier producto de un comercio marcado "Bacterias" entra a los sugeridos de la tira (app)**
- **Qué pasa:** con agua de tanque o pozo, la API agrega `bacterias` a `corrige` aunque todo salga verde. Un producto propio de cualquier tipo que no sea desinfección entra entonces como recomendado, aunque tenga 0 existencias.
- **Qué lee el cliente:** "Te recomendamos este producto porque está pensado para reducir bacterias según el fabricante", cuando la tira no mide bacterias.
- **Dónde está en el código:** `api/src/rutas/datos.ts`, en `ordenarCandidatos`.
- **Pasos:**
  1. Crea un hogar con agua de tanque, con filtro y con cambio reciente.
  2. Carga todo en rango y abre el resultado.
- **Captura:** la misma de F2.

**F5 · La lectura de la tira por foto es lenta y su tiempo varía**
- En los tramos 03c del `09` tardó **19,4 s**, 11,6 s y 12,9 s (el límite del guion es 15 s).
- La de 19,4 s fue poco antes de la caída de la red.

### Cosmético o sin confirmar

**F6 · Con red lenta, la carga manual del filtro puede guardar lo que venía de la foto (posible)**
- **Qué se vio:** en la corrida con la red cayéndose, el cliente marcó "Corto y delgado" y la API guardó `medida: null`, igual que la foto.
- **Causa probable:** en `PaginaFiltroManual.tsx`, la precarga de `filtroDeHogar` llega tarde y pisa lo que ya se marcó. Es el mismo tipo de carrera que F1.
- **Estado:** no se repitió con buena red. La foto del filtro de dos vasos se identificó en 4 de 4 corridas: la falla que había antes en `07` no se reprodujo.

## Qué se ajustó en las pruebas (no en la app)

- **`02`:** las filas se buscan con `li` dentro de "Tu agua, casilla por casilla" y se exigen "Tu conclusión" y "Qué hacer hoy". Antes, el primer `li` con "Nitrato" era un paso de "Qué hacer hoy". Así también encuentra las casillas en verde dentro del `<details>` plegado del resultado compacto.
- **`05`:** el foco de un radio dentro de una tarjeta-etiqueta (`.alta-opcion:has(input:focus-visible)`) cuenta como indicador visible.
- **`07`:**
  - **Nitrato en 50:** "Tu conclusión", "Si no haces nada", "Qué hacer hoy" con "Protege a tu familia hoy" y la frase de mascotas, la fila Nitrato en Rojo y que no aparezca "Qué encontramos". Si la fila trae "Ver qué te recomendamos", exige que apunte a `#titulo-sugeridos`.
  - **Todo en verde:** el hogar usa agua de **chorro**, para no mezclarlo con F4. Comprueba "Tu conclusión" ("no certifica"), que no haya "Si no haces nada", "Vuelve a medir en 3 meses", que "Recuérdame cuándo hacer mi próxima medición" abra "Dónde guardar el recordatorio", y "Lo que sigue".
  - **Catálogo:** se compara con `/api/cartuchos?hogar_id=…` (incluye los productos propios del comercio).
  - **Perfil:** Operadora sin preselección, "Apellido" aparte y la API guarda `+584145550199` y "Nombre Apellido".
  - **Nueva · pedido confirmado:** "Te escribimos por WhatsApp" y la tarjeta "WhatsApp simulado de Grimuca …" con "Simulación: en la demo no se envía un WhatsApp real". El pedido se despacha al final.
  - **Nueva · tablero:** "Cerrar sesión" está. "Registrar cambio de cartucho" guarda la fecha, `menos_de_un_mes` y "Sedimentos", y luego muestra el WhatsApp simulado y "Crear recordatorio de cambio de cartucho".
  - **Experto:** Despacho muestra "WhatsApp simulado enviado a Prueba Calidad … servicio".
- **`08`:** cuenta solo los comercios que no empiezan por "Prueba" (deben ser 3: Grimuca, Aliado Lara y Aliado Aragua). Exige "Estados cubiertos" ≥ 3 y "Comercios en la red" igual a las filas de la tabla. Los pasos j (producto) y k (alta de comercio) reusan lo de la pasada 2 y no crean duplicados.
- **Tira real:** ninguna prueba usa pH 8,8. Los niveles salen de `/api/config/tira`.

**Todavía sin prueba en el resultado compacto:** "Sin lectura: X." con "Completarlas a mano", y los `<summary>` "Ver más opciones" y "Ver todas". Conviene sumarlos a `07` en la próxima pasada.

## Datos "Prueba Calidad" creados en esta pasada (aprox.)

Ningún comercio ni producto nuevo: `08` reusó los de la pasada 2. Todos los pedidos y servicios de `03`, `07`, `08` y `09` quedaron despachados o atendidos.

| Corridas | Hogares | Mediciones | Pedidos | Servicios técnicos |
|---|---|---|---|---|
| `01` ×2 | 4 | 4 | 4 | — |
| `02` ×4 (2 con reintento) | 10 | 10 | 6 | — |
| `03` ×1 | 2 | 1 | 2 | — |
| `05` ×3 | 6 | 6 | 6 | — |
| `07` ×5, más 2 verificaciones (una corrida con la red caída) | ≈ 50 | ≈ 36 | 3 | ≈ 4 |
| `08` ×2 | 2 | 2 | 2 | 2 |
| `09` ×3 | 3 | 6 | 3 | 3 |
| Reproducción de F2 y F4 | 1 | 1 | — | — |

**Total aproximado: 78 hogares, 66 mediciones, 26 pedidos y 9 servicios técnicos.** El conteo exacto no se puede sacar de la API sin contar también los datos de Tulio.
