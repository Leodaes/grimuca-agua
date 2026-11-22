# Calibración con la tira real (domingo, 8:30 a.m.)

Objetivo: que la app lea bien la tira que Tulio trae de Valencia y que el semáforo use sus valores. Tiempo estimado: 45 minutos. Es la Compuerta 4.

## Estado de partida (probado el 22 nov, 1:55 a.m.)

- El lector funciona en el sitio publicado. Con la foto de ejemplo [`tira-ejemplo.jpg`](tira-ejemplo.jpg) (tira dibujada junto a una tabla de 8 casillas con valores conocidos) leyó **8 de 8 casillas bien en dos intentos, en 8 segundos cada uno**: alcalinidad 80, dureza 250, cobre 0, nitrato 50, cloro libre 0,5, plomo 0, pH 7,2, nitrito 0. El semáforo dio rojo por el nitrato.
- Esa foto es ideal: colores limpios y luz pareja. Una foto real de teléfono va a ser más difícil. Por eso existe la carga manual.
- La tira configurada hoy es la de referencia de 8 casillas (`tiraW8` en `api/src/medicion/config/tira.ts`).

## Casos difíciles probados (22 nov, 4 a.m.)

Ocho fotos difíciles en [`casos/`](casos/LEEME.md), enviadas al sitio publicado (de 1 a 3 rondas cada una). **En ningún caso apareció un valor inventado.** Lo que no se veía quedó en "sin lectura" o la foto se rechazó.

| Foto | Resultado | Segundos |
|---|---|---|
| a · Poca luz y ruido | No legible: "poca luz" | 5 a 6 |
| b · Girada 30° y desenfocada | 8 de 8 bien (una vez, plomo sin lectura) | 9 a 10 |
| c · 3 casillas tapadas | Las 3 tapadas sin lectura, las otras 5 bien | 7 a 8 |
| d · Solo la tabla, sin tira | No legible, pero decía "no se ve la tabla" → **corregido** | 3 |
| e · Foto que no tiene nada que ver | No legible ("no se ve la tabla" → ahora pide la tira) | 3 |
| f · Tira sin tabla | No legible: "no se ve la tabla" | 3 |
| g · Reflejo que lava 2 casillas | No legible: "reflejos" | 6 |
| h · Tabla de otra marca | Las filas con valores distintos sin lectura, las otras 5 bien | 11 a 13 |

Ajustes en `lector.ts` (hay que desplegarlos): campo `tira_visible` y motivo correcto cuando falta la tira; un valor que no es nivel de la casilla queda nulo, en vez de ajustarse al más cercano; las casillas repetidas con valores distintos quedan nulas. Detalle en [`casos/LEEME.md`](casos/LEEME.md).

Límite conocido: si hay casillas "sin lectura", el semáforo general se arma solo con las que se leyeron (en `c`, el rojo real estaba tapado y salió verde con 3 casillas sin dato). Por eso hay que ver siempre cuántas quedaron sin lectura.

## Pasos de la sesión de las 8:30 (lista para seguir)

1. **8:30 · Antes de mojar nada:** comprueba que el despliegue de anoche está arriba: `node docs/calibracion/casos/probar-casos.mjs`. Debe dar lo de la tabla de arriba y, en `d` y `e`, "No vemos la tira en la foto…". Si `b` no lee 8 de 8 (o 7 con una sin lectura), avisa antes de seguir.
2. **8:35 · Empaque y tabla (sección 1):** llena la tabla de casillas, revisa nitrato (NO3 o NO3-N), nitrito y pH alto. Foto de la tabla a `insumos-tulio/`.
3. **8:45 · Cambiar la tira (sección 2):** edita solo `tira` en `config/tira.ts`, con los valores **exactos** impresos en la tabla (el lector ya no ajusta valores que no estén en la lista: si falta uno, esa casilla saldrá "sin lectura"). Corre `npm run test -w api` y `npm run revisar -w api`; commit y `infra/desplegar.sh`.
4. **8:55 · Foto de control:** foto de la tabla real con una tira **seca** al lado. Envíala con `node docs/calibracion/casos/probar-casos.mjs nuevo ruta/de/la/foto.jpg`: debe leer lo mismo que ves tú a ojo o dejar casillas sin lectura, nunca un color distinto.
5. **9:00 · Tres muestras (sección 3):** moja, espera el tiempo del empaque, lee a ojo, toma la foto en el teléfono y anota la comparación. Toma también una foto mala a propósito (sin la tabla) para ver el mensaje.
6. **9:15 · Decide:** con al menos 2 de 3 muestras buenas (6 casillas bien o sin lectura y ningún color cambiado), la Compuerta 4 queda aprobada. Si no, la demo va con la carga manual (sección 4).
7. **9:20 · Demo (sección 5):** guarda en el teléfono la mejor foto de la tira real.

## 1. Con la tira en la mano (10 min)

Anota del empaque y de la tabla de colores, casilla por casilla y en el orden de la tira:

| Orden en la tira | Parámetro | Unidad | Valores impresos en la tabla |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| … | | | |

Revisa en especial:
- **Nitrato:** si la tabla dice "NO3" o "NO3-N" (como nitrógeno). Si es NO3-N, el valor 10 equivale a unos 44 de NO3: avísale al equipo antes de cambiar nada, porque los cortes del semáforo están en NO3.
- **Nitrito y la parte alta del pH:** estaban "por confirmar".
- **Hierro u otras casillas** que la app no evalúa todavía.
- **Tiempo de lectura** que pide el empaque (la app dice de 30 a 60 segundos).

Toma una foto clara de la tabla de colores y guárdala en `insumos-tulio/`.

## 2. Cambiar la tira en la app (10 min)

Edita **solo** la constante `tira` al final de `api/src/medicion/config/tira.ts`:

```ts
// Ejemplo: la tira de Valencia trae 6 casillas y el pH con otros valores.
export const tira: ParametroTira[] = [
  conNiveles(parametros.ph, [6.0, 6.5, 7.0, 7.5, 8.0, 8.5]),
  parametros.dureza,
  parametros.cloro_libre,
  conNiveles(parametros.nitrato, [0, 10, 25, 50, 100]),
  parametros.nitrito,
  parametros.alcalinidad,
];
```

- Para quitar una casilla, borra su línea.
- Para cambiar sus valores, usa `conNiveles(parametros.<clave>, [valores de la tabla])`.
- Claves válidas: `alcalinidad`, `dureza`, `cobre`, `nitrato`, `cloro_libre`, `plomo`, `ph`, `nitrito`, `hierro`.
- Ordénalas como vienen en la tira, de arriba hacia abajo: ese orden se le da al lector.
- **No toques** `umbrales.ts`: los cortes del semáforo son por valor y no dependen de la tira.

Después:

```bash
npm run test -w api      # deben seguir en verde
npm run revisar          # sin errores
```

Haz commit y despliega con `infra/desplegar.sh` (ver `infra/LEEME.md`).

## 3. Probar con fotos reales (20 min)

Para cada una de las 3 muestras de agua que trae Tulio:

1. Moja la tira como dice el empaque y espera el tiempo indicado.
2. **Lee tú la tira a ojo** contra la tabla y anota los valores.
3. En el teléfono, en https://agua.oydo.app, entra por "Ya tengo mi sobre", llena el perfil y en "Medir" toma la foto **con la tira al lado de la tabla de colores**, cerca de una ventana, sin flash y sin sombras.
4. Compara lo que leyó la app con tu lectura y anótalo:

| Muestra | Casilla | A ojo | La app | ¿Coincide? |
|---|---|---|---|---|
| | | | | |

Criterio para dar por buena la Compuerta 4: en al menos 2 de las 3 muestras, la app lee bien o deja en "sin lectura" (nunca un valor equivocado que cambie el color del semáforo) al menos 6 de las casillas.

## 4. Si lee mal

- **Dice "no legible" muy seguido:** mejora la foto (luz natural, tira y tabla en la misma foto, sin reflejos). Si sigue, la demo se hace con la **carga manual**, que es el respaldo previsto.
- **Confunde dos valores vecinos de la misma casilla:** es normal en tiras caseras. Si cambia el color del semáforo, anótalo para el pitch como límite conocido.
- **Lee una casilla que la tira no tiene:** revisa que esa casilla no esté en `tira`.
- No cambies el modelo de visión ni el texto de instrucciones del lector el domingo sin probarlo antes con la foto de ejemplo.

## 5. Para la demo

- Deja lista una foto buena de la tira real en el teléfono que se use en la demo, por si la luz del lugar es mala.
- Si la foto falla en vivo: "Cargar los colores a mano" y seguir. El recorrido es el mismo.
