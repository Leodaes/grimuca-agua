# Auditoría de marketing y ventas · Grimuca Agua

Agente de Marketing, con el lente del skill asesor de marketing y ventas · sáb 21 nov 2026, noche.
Revisado: `HANDOFF-hackaton.md`, insumos de Tulio, `docs/legal/`, `docs/negocio/modelo.md`, `docs/marketing/` y los textos reales de la app (`Bienvenida.tsx`, `Pago.tsx`, `Envio.tsx`, `PaginaResultado.tsx`, `PaginaBacterias.tsx`, `PaginaLista.tsx`, `PaginaPedido.tsx`, `textos.ts`).

Cada afirmación lleva una etiqueta:
- **[Material: autor]** viene de las referencias del skill, con su autor. Una cifra del material es un caso de un curso, no una ley.
- **[Tulio]** o **[Business]** viene de los insumos de Tulio o de `modelo.md`.
- **[Inferencia]** es lectura mía a partir de lo que vi.
- **[Recomendación]** es lo que propongo hacer.

---

## 1. Diagnóstico de etapa

Grimuca Agua es una línea nueva dentro de una ferretería que ya existe, con tres tiendas y confianza local ganada. Todavía no ha vendido un solo sobre: el modelo entero descansa en una hipótesis (de cada 100 sobres, 10 compran filtro, 30 ya tienen filtro y compran cartuchos, 60 solo se informan) que Tulio estima y nadie ha medido [Tulio; Business lo marca como "el supuesto más importante y el menos probado"].

**Etapa:** validación de la oferta de entrada antes de escalar. La pregunta de la etapa es cuántos hogares por tienda compran el sobre y cuántos de ellos compran algo después. Business ya encontró que esa cifra manda: la caja del año 1 cierra en cero con unos 34 hogares captados por tienda al mes si la conversión es la de Tulio, y con unos 57 si la conversión es la mitad [Business, `modelo.md` §6].

**Dónde está la fuga real.** Lo que se ve primero es el producto (la tira, la foto, el semáforo), y esa parte está bien resuelta. La fuga que más pesa está en el tramo siguiente: el cliente termina de medir, quiere comprar, y en ese punto la app lo manda a un chat de WhatsApp sin llevar consigo lo que acaba de contar. Ahí se pierde el contexto que el vendedor necesita y el cliente repite todo o pregunta "¿cuánto cuesta?" en frío. [Inferencia, a partir de `enlaceCotizar` en `textos.ts`: el mensaje solo trae el nombre del producto y su código.]

---

## 2. Qué funciona y por qué

1. **El sobre de $9 como producto de entrada.** Hace lo que el material pide a un imán de prospectos: crea la necesidad (descubrir qué hay en el agua) y deja el logro (filtrar, cambiar el cartucho) para el producto de pago. El material lo plantea así: "el lead magnet hace DESCUBRIR, no LOGRAR" [Material: Álvaro Luque, `sistema-lead-magnet.md`]. Además se paga solo: deja entre $3,56 y $6,06 por sobre antes de mirar un filtro [Business, `modelo.md` §1]. Un anuncio puede costar hasta $1,80 a $2,70 por sobre si se sigue la regla de dedicar 20% a 30% del ticket a conseguir cliente [Material: Convierte Más, `sistema-anuncios-ads.md`; Inferencia: cálculo sobre $9].
2. **La promesa y el lema de Tulio ponen al cliente de protagonista.** "Menos botellones: mide tu agua y cambia el cartucho cuando toca" habla de la carga y del tiempo del cliente y no de la empresa. "Saber qué tomas empieza en casa" le deja el primer paso en las manos. Es la regla central del mensaje de marca: el cliente es el héroe y la marca es el guía [Material: `contenido-comercial.md`].
3. **El plan en tres pasos ya existe** en la pieza `04-mide-entiende-filtra.jpg`. El material pide que el guía tenga un plan de 3 pasos que el cliente retenga [Material: `contenido-comercial.md`]. Mide, entiende, filtra cumple.
4. **El límite legal funciona como activo de venta.** "Somos una ferretería, no un laboratorio" y el aviso fijo colocan a Grimuca como un guía honesto. Para la venta consultiva, la honestidad pesa más que cualquier otro contexto de persuasión: "la autoridad moral absorbe a todos los demás" [Material: Velocity, `la-venta-elegante.md`].
5. **El semáforo con una frase por casilla** educa al cliente antes de ofrecerle nada. Mueve a la persona de "no sé qué tomo" a "sé qué mide cada cosa", que es el paso de nivel de consciencia que el material atribuye al imán [Material: Schwartz vía Luque].
6. **Las tiendas como mostrador y almacén.** Grimuca ya tiene tres puntos donde la gente la conoce. "Primero te compran a ti, luego al producto" [Material: filosofía del skill]. Es un canal propio que no depende de pauta.
7. **El piloto de 1.000 sobres está planteado como prueba**, con los supuestos marcados como supuestos [Business]. Eso coincide con "nadie sabe hacer marketing, solo sabemos hacer experimentos" [Material: Vilma Núñez/Convierte Más].

---

## 3. Dónde se fuga el cliente

Recorrido: anuncio o mostrador → sobre de $9 → medición → resultado → cotizar por WhatsApp → filtro → recambio.

| # | Tramo | Qué pasa hoy | Costo probable |
|---|---|---|---|
| F1 | Resultado → cotizar por WhatsApp | La tarjeta no muestra precio (decisión de Tulio) y el link abre un chat con el mensaje "Hola, quiero cotizar: {producto} (código {codigo})". El resultado, la zona, cuántos son en casa y el filtro que tiene no viajan. | El vendedor parte de cero; el cliente pregunta el precio sin contexto y compara con lo más barato. **[Material: Botero]**: "sin contexto de valor el cliente lo compara con opciones más baratas y concluye que es caro". **[Inferencia]** |
| F2 | Resultado todo en verde | La app dice "Con esta medición no tenemos un cartucho que recomendarte" y "¿Dudas? Pasa por la tienda". La tarjeta "Tu cartucho" enlaza a "Ver mi lista", que está vacía. | Callejón sin salida para el hogar que ya tiene filtro y no sabe cuándo cambiarlo, que es el segundo mercado de Tulio (30 de cada 100) y el motor de los cartuchos. **[Inferencia sobre `PaginaResultado.tsx`]** |
| F3 | Hogar sin filtro | Las tarjetas sugieren cartuchos. No hay ninguna ruta a "qué filtro me conviene". | El filtro (10 de cada 100 según Tulio, margen de 20%) no tiene puerta dentro de la app. **[Inferencia]** |
| F4 | Después de pedir | "La tienda te contactará para confirmar" no dice quién, cuándo ni por dónde. En `Pago.tsx` aparece "Te avisaremos cuando salga de la tienda" y la app no envía avisos. | Promesa incumplida en una pantalla de dinero; el cliente espera un aviso que no llega. **[Inferencia; Legal ya fijó que la app no envía WhatsApp]** |
| F5 | Cliente que mide el domingo o de noche | Las tiendas atienden lunes a viernes de 8:30 a. m. a 4:30 p. m., sábados de 9:00 a. m. a 2:00 p. m., domingos cerrado **[Tulio]**. Un cotizar enviado fuera de horario espera hasta la mañana siguiente. | El prospecto se enfría. **[Material: Trejo]** pide responder por WhatsApp en menos de 10 minutos y **[Material: Botero]** en 1 a 2 horas como máximo; son criterios de dos ponentes, y piden además una respuesta automática fuera de horario. |
| F6 | Los 60 de cada 100 que solo se informan | No hay vía de regreso. El recordatorio por WhatsApp es "Próximamente". El consentimiento actual cubre enviar el sobre, mostrar resultados y atender pedidos, y Legal pide una casilla aparte para cualquier aviso comercial. | Cada hogar que no vuelve es una recompra de sobre y un recambio que no ocurre. El modelo con "cero recambios después del primero" baja la caja del año 1 de $65.500 a $41.400, una caída de 37% [Business, `modelo.md` §6, escenario base]. |
| F7 | Arriba del embudo: mostrador y anuncio | No hay un guion de mostrador para ofrecer el sobre ni una frase que explique por qué cuesta $9. Las piezas de campaña son cuatro imágenes. | Sin datos de cuántas personas se ofrecen y cuántas aceptan, la captación (la variable que tumba el modelo) no se puede corregir. **[Inferencia]** |
| F8 | Medición del embudo | En los archivos que revisé no hay una medición por etapa documentada (QR escaneado, medición completa, resultado visto, clic en cotizar, pedido, compra). | Sin esos números el piloto de 1.000 sobres no puede decir en qué tramo se pierde la gente. **[Inferencia; si existe analítica, no está documentada]** |

**Coherencia entre lo que se promete y lo que está en la app.** Dos textos de la app contradicen las decisiones ya tomadas: la bienvenida todavía lleva el título "Descubre la calidad del agua de tu casa" (Tulio pidió retirar "agua de calidad" y Legal lo marcó), y `Envio.tsx` y `Pago.tsx` listan "prueba de bacterias (E. coli y coliformes)" cuando Legal condicionó esa mención a lo que diga la caja del frasco real. Ambos van en `cambios-para-la-app.md`.

**El precio del sobre frente a la recarga.** La recarga de 20 L se reportó entre $0,50 y $2,50 [Bloomberg Línea, 2022, citado en `modelo.md`]. Un sobre de $9 equivale a entre 3,6 y 18 recargas **[Inferencia: $9 ÷ $2,50 y $9 ÷ $0,50]**. La compra del sobre se justifica por saber, no por ahorrar. El mensaje del mostrador y del anuncio debe vender el "saber qué tomas" y el filtro como el paso siguiente, y dejar las cuentas del botellón para cuando el cliente ya midió.

---

## 4. Abogado del diablo

1. **Precio oculto puede ser lo correcto.** Los precios cambian por tienda y por tasa, y Tulio decidió que ninguno es público. Mi plan mantiene esa decisión. Lo que cuesta es que en la demo el jurado ve una tarjeta sin cifra y puede concluir que el modelo de ingreso no está en el producto. La respuesta en tarima es "el precio lo confirma la tienda por WhatsApp, con tu resultado ya escrito", y mostrarlo.
2. **Enviar el resultado por WhatsApp comparte datos del hogar con la tienda.** Lo manda el propio cliente, que puede editar el mensaje antes de enviarlo, y la casilla de consentimiento cubre "atender mis pedidos". Aun así, es un uso nuevo y **el Asesor legal debe confirmarlo**. El mensaje solo nombra la casilla y el color que la app ya mostró; nunca dice "tu agua tiene plomo".
3. **El 60% que solo se informa puede ser el diseño correcto.** El sobre ya se pagó solo. Empujarles cartuchos que no necesitan gasta la confianza que sostiene la marca. Por eso la recomendación para ellos es repetir la medición y pedir referidos, y la oferta de recambio queda para hogares con filtro.
4. **La conversión 10/30/60 es una estimación.** Mi plan y el modelo de Business descansan sobre ella. Si resulta 3/10/87, el cambio de textos no arregla el negocio; lo arregla la captación.
5. **Cotizar por WhatsApp pide una persona atenta.** Si el responsable de la tienda no contesta en horas, mejorar el mensaje no sirve. La decisión de quién atiende, con qué horario y en cuánto tiempo es de Tulio y va en su resumen.
6. **"Cotizar el recambio" a los hogares en verde puede parecer venta forzada.** Lo limito a hogares que dijeron tener filtro, y lo presento como información de recambio, con un enlace de pregunta y sin presión.
7. **El miedo vende.** La Secuencia del Dolor del material, que arma el pre-framing de un lanzamiento, usa consecuencias fuertes [Material: `arquitectura-funnels.md`]. Legal lo prohíbe en este producto (nada de niños enfermos, hospitales ni "veneno"). Las consecuencias que sí se pueden usar son la carga de botellones, el gasto quincenal y no saber qué se toma.
8. **Lo que no pude comprobar.** No vi la app corriendo. Los textos citados vienen de los archivos fuente, y Desarrollo debe confirmar cada "texto actual" de `cambios-para-la-app.md` antes de reemplazarlo.

---

## 5. Plan de corrección, en orden de impacto

### Cabe antes del domingo 12:00 m.

1. **Que el mensaje de "Cotizar por WhatsApp" lleve el resultado y el perfil.** Plantilla en `cambios-para-la-app.md`, cambio 1. Cierra F1. Por qué primero: es lo que más separa una cotización fría de una conversación de venta, y es un cambio pequeño en `enlaceCotizar`.
2. **Explicar qué pasa al tocar "Cotizar por WhatsApp".** Una línea bajo el link: el precio lo confirma la tienda, sin compromiso (cambio 2). Reduce el abandono por incertidumbre.
3. **Sacar al hogar en verde del callejón.** Si tiene filtro, ofrecer cotizar el recambio; si no, dejar la pregunta por filtros abierta (cambios 3 y 4). Cierra F2 y F3 con texto y un par de enlaces.
4. **Retirar los dos textos que contradicen decisiones:** "Descubre la calidad del agua de tu casa" y "E. coli" (cambios 5 y 6).
5. **Quitar la promesa de aviso que la app no cumple** ("Te avisaremos…") y volver concreto el texto de "no se cobra nada ahora" (cambios 7 y 8). Este último espera la decisión 1 de Tulio.
6. **Fuera de la app, antes del sábado de la entrega:** Tulio activa una respuesta automática fuera de horario en el WhatsApp de las tiendas, si el número es WhatsApp Business, e imprime `guion-whatsapp-tiendas.md` para quien atiende. Cierra F5 sin tocar código.
7. **Demo y deck:** contar la historia con el cliente como protagonista y mostrar el mensaje de WhatsApp ya escrito con el resultado (`deck.md`, `guion-demo.md`).

### Siguiente paso, después del hackatón y dentro del piloto

8. **Medir el embudo.** Eventos mínimos por etapa y un QR con origen (mostrador Mañongo, mostrador San Diego, domicilio, aliado). Los experimentos están en `embudo.md`. Cierra F7 y F8.
9. **Casilla opcional de recordatorio por WhatsApp**, separada del consentimiento del sobre, con texto que apruebe Legal, y un recordatorio real a los 75 días. Cierra F6.
10. **Recordatorio manual para los primeros 30 hogares que ya tienen filtro.** Ya dieron la fecha del último cambio en el perfil, así que el recambio se puede medir en semanas y no en meses.
11. **Probar precio "desde" visible contra precio oculto** en dos tiendas del piloto, cuando Tulio tenga los precios internos.
12. **Seguimiento de valor cada 15 días durante 60 días** para quien cotizó y no compró [Material: Goncalves, `proceso-closer-y-seguimiento.md`], con contenido nuevo cada vez (guion en `guion-whatsapp-tiendas.md`).

### Acción para hoy

Pedirle a Desarrollo el cambio 1 de `cambios-para-la-app.md` y, mientras tanto, que quien atiende las tiendas lea el guion de WhatsApp en voz alta una vez, con el celular en la mano.
