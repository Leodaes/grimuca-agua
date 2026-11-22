# Calibración con la tira real (domingo, 8:30 a.m.)

Objetivo: que la app lea bien la tira que Tulio trae de Valencia y que el semáforo use sus valores. Tiempo estimado: 45 minutos. Es la Compuerta 4.

## Estado de partida (probado el 22 nov, 1:55 a.m.)

- El lector funciona en el sitio publicado. Con la foto de ejemplo [`tira-ejemplo.jpg`](tira-ejemplo.jpg) (tira dibujada junto a una tabla de 8 casillas con valores conocidos) leyó **8 de 8 casillas bien en dos intentos, en 8 segundos cada uno**: alcalinidad 80, dureza 250, cobre 0, nitrato 50, cloro libre 0,5, plomo 0, pH 7,2, nitrito 0. El semáforo dio rojo por el nitrato.
- Esa foto es ideal: colores limpios y luz pareja. Una foto real de teléfono va a ser más difícil. Por eso existe la carga manual.
- La tira configurada hoy es la de referencia de 8 casillas (`tiraW8` en `api/src/medicion/config/tira.ts`).

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
