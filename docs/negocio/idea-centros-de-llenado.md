# Idea: centros de llenado en la red de aliados

**Análisis, sin código · dom 22 nov 2026 · para Leonardo y Tulio**
Idea de Leonardo: muchos hogares en Venezuela toman agua de botellón y no van a comprar un filtro. Por eso, además de ferreterías, la red debería tener centros de llenado con mediciones de la calidad del agua.
Cada cifra lleva su origen: **Tulio**, **modelo** (`docs/negocio/modelo.md`) o **SUPUESTO** (lo puse yo para poder razonar; hay que corregirlo).

## 1. Para quién es y cómo cobra Grimuca

**El hogar de botellón.** Compra de 10 a 12 botellones al mes, a unos $2 cada uno y hasta $4 con delivery: de $20 a $48 al mes (estimación de Tulio, sin medición). No sabe qué agua le venden, porque nadie le muestra una medición del centro. Con la idea, ve en el mapa qué centros cercanos tienen una medición reciente publicada, y puede medir su propio botellón con el sobre de $9.

**El centro de llenado.** Vende un producto que no se distingue de los demás y compite por precio y cercanía. La idea le da una razón para que lo elijan: una medición hecha por un tercero, con fecha y a la vista. El material de venta lo dice así: si no puedes mejorar el precio, mejora lo que rodea al producto. Además, un centro gasta todos los meses en cartuchos, membranas y lámparas, y eso es lo que Grimuca ya vende.

**Grimuca.** Llega a un segmento que hoy el modelo deja fuera, porque el hogar de botellón no compra filtro. Hay tres formas de cobrar:

| Forma | Cómo | Cifra | Lectura |
|---|---|---|---|
| Membresía del centro con una medición al mes | Cuota fija que incluye la visita y el sobre | $20 al mes (SUPUESTO) contra un costo de $2,94 del sobre (modelo) más unos $5 de la visita (SUPUESTO): deja unos $12 | Es la más simple de cobrar y de explicar |
| Cobro por cada medición | Pago por visita, sin cuota | $10 por medición (SUPUESTO) | Sirve para el piloto; cuesta cobrarlo seguido |
| Comisión por recarga | Un porcentaje de cada botellón | Sin cifra | **No la recomiendo en el año 1:** el ticket es de $1 a $2, casi todo se paga en efectivo y no queda rastro en la plataforma |
| Venta de repuestos al centro | Cartuchos, membranas y UV del sistema de tratamiento del centro | Sin dato | **Hipótesis más fuerte:** venta recurrente entre empresas con el catálogo que Grimuca ya tiene. Falta saber cuánto compra un centro (pregunta 1) |

**Comparación con la ferretería** (`modelo.md`, secciones 2 y 5):

| | Ferretería | Centro de llenado |
|---|---|---|
| Qué recibe | Familias medidas que compran filtros y cartuchos | Familias que buscan un centro con la medición a la vista |
| Valor de una familia para el comercio | Unos $7 al mes entre producto y sobre (modelo) | De $20 a $24 al mes en ventas de botellones (Tulio), con un margen que no conocemos |
| Cuota | $30 al mes (SUPUESTO) | $20 al mes con la medición incluida (SUPUESTO) |
| Qué compra a Grimuca | Sobres al mayor a $5,50 (SUPUESTO) | Repuestos de su sistema de tratamiento (hipótesis) |
| Riesgo principal | Que lleguen pocas familias | El sello: Grimuca pone su nombre sobre el agua de un tercero |

Con 20 familias al mes, el centro vendería de $400 a $480 en botellones (20 × $20 a $24, cálculo). Es un argumento de venta fuerte, pero todavía no está probado.

## 2. Cómo funcionaría la verificación

- **Quién mide.** El técnico de Grimuca, sin aviso previo, toma la muestra del grifo de despacho. Si mide el propio centro, el dato pierde valor ante el cliente.
- **Con qué.** Con lo mismo que trae el sobre: la tira Qteeyou 8 en 1 (pH, cloro, nitrato, nitrito, dureza y metales; **no mide bacterias**) y el frasco de coliformes, que da presencia o ausencia a las 48 horas. Nada de esto es un análisis de laboratorio. Si Grimuca quiere sostener algo más, tendría que agregar un análisis de laboratorio al trimestre (costo por cotizar).
- **Cada cuánto.** Una vez al mes. La medición queda vencida a los 35 días y deja de mostrarse (SUPUESTO).
- **Si sale en rojo.** Se retira la medición del mapa ese mismo día y se avisa al centro, que tiene 7 días para corregir y pedir otra visita (SUPUESTO). Si el frasco cambió de color, se retira la medición y se le recomienda un laboratorio. Al cliente no se le dice que el agua del centro "salió mala". La regla legal 9 prohíbe decir que el agua de una marca de botellón está contaminada. El centro solo deja de aparecer con medición vigente.
- **Qué ve el cliente.** Ejemplo: "Medido por Grimuca el 15 nov: 8 de 8 casillas en rango; la prueba de coliformes no cambió de color. Medición orientativa, no es un análisis de laboratorio." El aviso fijo va al lado.
- **Señal de los hogares.** Las mediciones de botellón de los clientes que digan dónde rellenan sirven como alerta para el panel de Red, igual que la alerta de zona. No se publican por centro, porque el botellón de la casa se ensucia en el transporte y en el envase.

**Riesgo legal.** Es más alto que el de la app actual. Hoy Grimuca informa al hogar sobre su propia agua. Con esta idea, Grimuca respalda el agua que vende otro negocio. Si alguien se enferma con agua de un centro marcado por Grimuca, la responsabilidad le puede llegar (confirmar con abogado). Los centros de llenado tienen sus propios permisos sanitarios, y Grimuca no debe dar a entender que los reemplaza (confirmar con abogado cuáles aplican).

**Palabras a evitar** (`docs/legal/puede-y-no-puede-decir.md`): "verificado", "certificado", "aprobado", "garantizado", "potable", "segura", "agua de calidad" y "cumple la norma". La palabra "verificado" de la idea original hay que cambiarla. **Nombre propuesto: "Centro con medición publicada".** También sirve "Medido por Grimuca cada mes".

## 3. Cómo encaja en la plataforma

La base ya existe: el perfil del hogar tiene la opción "Botellón" (`app/src/features/alta/comun.tsx:11`; `OrigenAgua` en `api/src/tipos.ts:19`), el técnico ya marca "Ya fui" con foto y el semáforo ya evalúa la tira.

| Pieza | Cambio | Tamaño |
|---|---|---|
| Datos | `comercios.tipo` (`ferreteria` o `centro_llenado`) y una tabla nueva de mediciones del centro (fecha, técnico, colores, frasco, foto y vigencia) | Chico |
| `/red` | Elegir el tipo en el alta; en la lista, el estado de la medición (vigente, vencida o retirada) | Chico |
| `/tecnico` | Un servicio nuevo, "medición de centro": cargar los colores (reusa la carga a mano), el frasco y la foto | Mediano |
| `/` cliente | Si el hogar es de botellón: "¿Dónde rellenas?" (opcional), centros cercanos con medición vigente y el sobre para medir el propio botellón | Mediano; necesita revisión legal de cada texto |
| `/comercio` | Un panel corto para el centro: sus mediciones y cuántos hogares lo eligieron. No usa inventario de filtros ni rutas | Chico |
| Mapa de zonas | El centro como punto con su estado | Chico |

Total estimado: unas 2 semanas de una persona, con pruebas, más la revisión legal (SUPUESTO).

## 4. ¿Va en la demo de hoy?

**Recomendación:** no va en el código, ni como pantalla ni como dato sembrado, y tampoco necesita una lámina propia. Basta una línea en la lámina de hoja de ruta y una respuesta preparada por si el jurado pregunta por las familias que no van a comprar filtro.

Las razones:
1. Las funciones se congelan a las 12:00 m.
2. No hay ningún centro aliado real ni cifras.
3. La palabra de la idea, "verificado", es justo la que la revisión legal prohíbe.
4. La portada promete "Menos botellones" (`Banners.tsx:8`). Mostrar centros de llenado como aliados en el mismo recorrido confunde el mensaje.

Línea para la lámina: "Siguiente: centros de llenado con medición mensual publicada, para las familias que siguen con botellón."

## 5. Preguntas que solo pueden responder Leonardo o Tulio

1. ¿Grimuca les vende hoy cartuchos, membranas o lámparas a centros de llenado? ¿A cuántos y por cuánto al mes?
2. ¿Cuántos centros de Naguanagua y San Diego conocen por nombre? ¿Aceptarían que se publique su medición, aunque algún mes salga en rojo?
3. ¿Se mantiene la promesa "Menos botellones" junto con esta idea? ¿O el mensaje para el hogar de botellón será otro?
4. ¿Quién mide: un técnico de Grimuca o el centro bajo supervisión? ¿Se paga un laboratorio una vez por trimestre?
5. ¿Cuánto pagaría un centro: $20 al mes, $10 por visita o nada, a cambio de comprar los repuestos a Grimuca?
6. Para el abogado: ¿qué responsabilidad asume Grimuca al publicar la medición de un tercero? ¿Qué permisos sanitarios tiene que tener el centro para entrar a la red?

---

**Otras cosas vistas, sin trabajar:** `modelo.md` sección 4 todavía nombra la tira HORYZON, aunque la tira real es Qteeyou. En el encargo, "sobre de $2,94" es el costo; el cliente paga $9.
