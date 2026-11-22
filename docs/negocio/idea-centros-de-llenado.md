# Idea: centros de llenado en la red de aliados

**Análisis, sin código · dom 22 nov 2026 · para Leonardo y Tulio**
Cada cifra lleva su origen: **Tulio**, **modelo** (`docs/negocio/modelo.md`) o **SUPUESTO** (lo puse yo para poder razonar; hay que corregirlo).

**Decisión de Leonardo (22 nov), tras la validación del hackatón:** la mayoría de las personas consultadas dijo que solo compra botellón y que no va a cambiar a un filtro en casa. Por eso, los centros de llenado entran a la red como comercios afiliados, con tres condiciones:
- publican sus resultados de calidad del agua;
- venden el sobre en su mostrador;
- al registrarse, cada cliente ve el centro con resultados públicos más cercano a su casa o a su negocio.

Se descarta pedir el botellón por la app.

## 1. Para quién es y cómo cobra Grimuca

**El hogar de botellón.** Compra de 10 a 12 botellones al mes, a unos $2 cada uno y hasta $4 con delivery: de $20 a $48 al mes (estimación de Tulio, sin medición). Hoy no ve ninguna medición del agua que compra. Con esta idea, al registrarse se entera de qué centro cercano publica sus resultados, y puede comprar ahí mismo el sobre para medir su propio botellón.

**El centro de llenado.** Vende un producto difícil de distinguir y compite por precio y cercanía. Con la idea gana tres cosas:
- clientes que llegan desde la app;
- una medición hecha por un tercero, con fecha y a la vista;
- unos $3,50 por cada sobre que vende ($9 menos $5,50 al mayor; ambos precios vienen del modelo y el de $5,50 es SUPUESTO).

Hay un argumento de venta propio: el centro que publica sus resultados también le vende al cliente la prueba para que lo compruebe por su cuenta.

**Por qué el centro es buen canal para el sobre.** Una familia de botellón va al centro varias veces al mes (10 a 12 botellones según Tulio), mucho más que a una ferretería. Es una inferencia y hay que medirla en el piloto.

**Cómo cobra Grimuca:**

| Línea | Cifra | Origen |
|---|---|---|
| Membresía del centro, con una medición al mes incluida | $20 al mes, menos $2,94 del sobre y unos $5 de la visita: deja unos $12 | SUPUESTO, con el costo del sobre del modelo |
| Sobres al mayor que el centro revende a $9 | Grimuca gana $2,31 por sobre (sobre a $2,94) o $1,25 (sobre a $4,00) | Modelo, sección 5 |
| Repuestos del sistema de tratamiento del centro (cartuchos, membranas, UV) | Sin dato | Hipótesis (pregunta 2) |
| Comisión por recarga | No se recomienda en el año 1: cada recarga es de $1 o $2 y se paga casi siempre en efectivo | — |

**Ejemplo por centro al mes** (cálculo; los 15 sobres son SUPUESTO): con 15 sobres vendidos, Grimuca gana $35 por los sobres y $12 por la membresía, unos **$47**. Al centro le quedan $52 por los sobres. Con el sobre a $4,00, Grimuca baja a unos $30.

**Comparación con la ferretería:** una ferretería del escenario base deja unos $87 al mes (modelo). Un centro deja menos, pero cuesta menos de convencer: no tiene que convencer a nadie de comprar un filtro. Además llega a las familias que, según la validación, nunca van a comprar uno.

## 2. Los resultados públicos: cómo se mide y qué se muestra

- **Quién mide.** El técnico de Grimuca, sin aviso previo, toma la muestra del grifo de despacho. Si mide el propio centro, el dato pierde valor.
- **Con qué.** Con lo mismo que trae el sobre: la tira Qteeyou 8 en 1, que **no mide bacterias**, y el frasco de coliformes, que da presencia o ausencia a las 48 horas. Nada de esto es un análisis de laboratorio.
- **Cada cuánto.** Una vez al mes. La medición vence a los 35 días y deja de mostrarse (SUPUESTO).
- **Qué ve el cliente.** El nombre del centro, la distancia y la fecha de la medición, con el resultado de cada casilla. Ejemplo: "Medido por Grimuca el 15 nov: 8 de 8 casillas en rango; la prueba de coliformes no cambió de color. Medición orientativa, no es un análisis de laboratorio."
- **Si sale fuera de rango, se puede hacer de dos formas:**
  - (a) Publicarlo tal cual, casilla por casilla. Es lo más transparente, pero tiene el mayor riesgo legal, y muchos centros no van a querer entrar.
  - (b) Retirar la medición ese mismo día, mostrar el centro como "medición en revisión" y darle 7 días para corregir y pedir otra visita (SUPUESTO).

  **Recomiendo la (b)**, porque la regla legal 9 prohíbe decir que el agua de una marca de botellón está contaminada.
- **Las mediciones que hacen los clientes de su propio botellón no se publican por centro.** El botellón de la casa se ensucia en el envase y en el transporte. Esas mediciones solo sirven como alerta interna para Red.

**Riesgo legal.** Con esta idea, Grimuca pone su nombre sobre el agua de un tercero. Si alguien se enferma con agua de un centro publicado, la responsabilidad le puede llegar (confirmar con abogado). Grimuca tampoco debe dar a entender que su medición reemplaza los permisos sanitarios del centro.

**Palabras a evitar** (`docs/legal/puede-y-no-puede-decir.md`): "verificado", "certificado", "aprobado", "garantizado", "potable", "segura" y "agua de calidad". **Nombre propuesto: "Centro con resultados públicos".** También sirve "Medido por Grimuca cada mes".

## 3. Cómo encaja en la plataforma

La base ya existe:
- el perfil tiene "Botellón" y la urbanización (`api/src/tipos.ts`, `Hogar.urbanizacion`);
- cada urbanización tiene coordenadas (`api/src/logistica/urbanizaciones.ts`);
- la distancia ya se calcula para las rutas (`api/src/logistica/rutas-despacho.ts`);
- el técnico ya marca "Ya fui" con foto.

| Pieza | Cambio | Tamaño |
|---|---|---|
| Datos | `comercios.tipo` (`ferreteria` o `centro_llenado`), la coordenada del centro (hoy solo las tiendas de Grimuca tienen) y una tabla de mediciones del centro (fecha, técnico, colores, frasco, foto, vigencia y estado) | Chico |
| Registro del cliente | Al guardar el perfil, una tarjeta "Centro con resultados públicos más cercano", calculada desde la urbanización (si no la dio, desde la zona). Si no hay ninguno cerca: "Todavía no hay centros con resultados públicos cerca de ti". Para un hogar de botellón, esa tarjeta va primero y los filtros después | Mediano; cada texto pasa por Legal |
| Cliente que es un negocio | Hoy el perfil es solo de hogar. Para un restaurante o una oficina haría falta un tipo de cliente (pregunta 4) | Chico, si se decide |
| `/tecnico` | Un servicio nuevo, "medición de centro", que reusa la carga a mano de colores, el frasco y la foto | Mediano |
| `/comercio` | Para un centro, un panel corto: sus mediciones, el inventario de sobres y cuántos clientes lo tienen como centro más cercano | Chico |
| `/red` | Elegir el tipo en el alta y ver el estado de la medición en la lista | Chico |
| Mapa de zonas | El centro como punto, con el estado de su medición | Chico |

Total estimado: unas 2 semanas de una persona, con pruebas, más la revisión legal (SUPUESTO).

## 4. ¿Va en la demo de hoy?

**Recomendación:** no va en el código, porque las funciones se congelan a las 12:00 m. y no hay ningún centro real. Sí va en el pitch, en una línea de la hoja de ruta, junto con el hallazgo de la validación:

"La mayoría nos dijo que solo compra botellón. Por eso, el siguiente paso es sumar centros de llenado a la red, con resultados públicos de su agua y el sobre en su mostrador. Al registrarse, cada familia ve el más cercano."

**Cuidado en la demo:** hoy la app le sugiere filtros también a un hogar de botellón. Si el recorrido usa "Botellón", el jurado va a ver justo lo que la validación dice que esas familias no compran. Conviene grabar la demo con otro origen del agua, o explicar ese punto en voz.

La promesa de la portada, "Menos botellones" (`Banners.tsx:8`), choca con esta idea. Para la demo de hoy se puede dejar, pero después hay que revisarla (pregunta 3).

## 5. Preguntas que solo pueden responder Leonardo o Tulio

1. Validación: ¿a cuántas personas se les preguntó, quiénes eran y cuántas dijeron que solo compran botellón? Ese número cambia la conversión a filtro del modelo (10% compra filtro y 30% compra cartuchos, según Tulio).
2. ¿Grimuca les vende hoy repuestos a centros de llenado? ¿A cuántos y por cuánto al mes?
3. ¿Se mantiene "Menos botellones" como promesa principal, o el mensaje cambia para el cliente de botellón?
4. ¿El cliente que es un negocio (restaurante, oficina) entra en esta versión?
5. Si un centro sale fuera de rango, ¿se publica tal cual (a) o se retira y se revisa (b)?
6. ¿Cuántos centros de Naguanagua y San Diego conocen? ¿Cuánto pagarían: $20 al mes con la medición incluida, o solo comprar sobres al mayor?
7. Para el abogado: ¿qué responsabilidad asume Grimuca al publicar la medición de un tercero? ¿Qué permisos tiene que tener el centro para entrar a la red?

---

**Otras cosas vistas, sin trabajar:** `modelo.md` sección 4 todavía nombra la tira HORYZON, aunque la tira real es Qteeyou. En el encargo original, "sobre de $2,94" es el costo; el cliente paga $9.
