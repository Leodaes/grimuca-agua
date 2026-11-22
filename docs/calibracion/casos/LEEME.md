# Fotos difíciles para el lector de la tira

Fotos de prueba hechas a partir de la idea de [`../tira-ejemplo.jpg`](../tira-ejemplo.jpg): tira de 8 casillas (W-8) junto a su tabla de colores. Se regeneran con `node docs/calibracion/casos/generar-casos.cjs` y se prueban contra el sitio con `node docs/calibracion/casos/probar-casos.mjs` (crea un hogar "Prueba Calidad" si no le pasas uno).

## Valor real de cada casilla

Orden de la tira, de arriba hacia abajo. "—" significa que la casilla no se puede leer en esa foto: lo correcto es "sin lectura".

| Foto | Alcalinidad | Dureza | Cobre | Nitrato | Cloro libre | Plomo | pH | Nitrito | Qué tiene de difícil | Lo correcto |
|---|---|---|---|---|---|---|---|---|---|---|
| `a-poca-luz.jpg` | 120 | 120 | 0 | 10 | 1 | 0 | 7,6 | 0 | Oscura (38 % de brillo) y con ruido | `no_legible` por luz, o valores correctos |
| `b-girada-desenfocada.jpg` | 80 | 250 | 0 | 50 | 0,5 | 0 | 7,2 | 0 | Tira girada 30° y desenfoque leve | Valores correctos o nulos |
| `c-tres-tapadas.jpg` | 80 | — (250) | 0 | — (50) | 0,5 | — (0) | 7,2 | 0 | Cinta encima de dureza, nitrato y plomo | Las tres tapadas en nulo |
| `d-sin-tira.jpg` | — | — | — | — | — | — | — | — | Solo la tabla, no hay tira | `no_legible`: falta la tira |
| `e-irrelevante.jpg` | — | — | — | — | — | — | — | — | Imagen de marca (`app/public/marca/og-01.jpg`) | `no_legible`: falta la tira |
| `f-tira-sin-tabla.jpg` | 80 | 250 | 0 | 50 | 0,5 | 0 | 7,2 | 0 | La tira sola, sin tabla al lado | `no_legible`: falta la tabla |
| `g-reflejo.jpg` | 80 | 250 | 0 | — (50) | 0,5 | 0 | 7,2 | — (10) | Reflejo que lava nitrato y nitrito (los dos en rojo de verdad: lavados parecen 0, verde) | Las dos lavadas en nulo, o `no_legible` |
| `h-otra-marca.jpg` | 120 | 200 | 0 | 40 | 1 | 0 | 6,5 | 0 | Tabla "AquaTest Pro" con otros valores impresos (pH 6, 6,5, 7, 7,5, 8, 9; dureza 0, 50, 100, 200, 400, 1000; nitrato 0, 20, 40, 80, 160, 500…) | Nulo en las filas cuyo valor no está en la tira configurada (dureza 200, nitrato 40, pH 6,5) |

En `h` los valores son los de la tabla de la foto (ppm). Los que coinciden con un nivel de la tira W-8 (alcalinidad 120, cobre 0, cloro 1, plomo 0, nitrito 0) se pueden aceptar; los otros no se pueden ajustar sin arriesgar el color: nitrato 40 es amarillo, pero ajustado a 50 sería rojo.

## Resultado contra el sitio publicado (22 nov, 3:55 a 4:05 a.m., antes del ajuste de `lector.ts`)

Tres rondas en los casos ambiguos y una en `f`. Mismo resultado en todas.

| Foto | Estado | Lo que leyó | ¿Valor inventado? | Motivo mostrado | Segundos |
|---|---|---|---|---|---|
| a | `no_legible` ×3 | — | No | Poca luz, sombras o reflejos | 5 a 6 |
| b | `ok` ×3 | 8 de 8 bien (en la 1.ª ronda plomo quedó nulo) | No | — | 9 a 10 |
| c | `ok` ×3 | Dureza, nitrato y plomo nulos; las otras 5 bien | No | — | 7 a 8 |
| d | `no_legible` ×3 | — | No | **"No se ve la tabla"** (equivocado: lo que falta es la tira) | 3 |
| e | `no_legible` ×3 | — | No | "No se ve la tabla" (mejor: pedir la tira) | 2,5 a 3 |
| f | `no_legible` | — | No | No se ve la tabla | 3 |
| g | `no_legible` ×3 | — | No | Poca luz, sombras o reflejos | 6 |
| h | `ok` ×3 | Dureza, nitrato y pH nulos; las otras 5 bien | No | — | 11 a 13 |

Una llamada de `d` respondió en 0,7 s con "No pudimos leer la foto. Intenta de nuevo…" (falla pasajera del servicio; al repetir respondió normal).

En `c` y `h` el semáforo dio verde con casillas "sin dato": no es un valor inventado, pero la persona debe ver que faltan casillas. En `c` el rojo real (nitrato 50) estaba tapado.

## Ajustes hechos en `api/src/medicion/lector.ts` (pendientes de desplegar)

- Nuevo campo `tira_visible`: si llega en `false`, la respuesta es `no_legible` con "No vemos la tira en la foto…" (o el motivo de luz o foco si esa es la causa), aunque traiga lecturas.
- El motivo busca primero qué falta (tira o tabla) y después cómo salió la foto: "solo se ve la tabla" ya no se confunde con "no se ve la tabla". Corrige `d` y `e`.
- Un valor que no es uno de los niveles de la casilla queda nulo (antes se ajustaba al más cercano): protege el caso `h` si el servicio devolviera el valor impreso de otra marca.
- Una casilla que llega dos veces con valores distintos, o con confianza baja en alguna copia, queda nula.
- Instrucciones nuevas: nulo en filas de otra marca y en casillas lavadas por un reflejo.

Después de desplegar, repite: `node docs/calibracion/casos/probar-casos.mjs`.
