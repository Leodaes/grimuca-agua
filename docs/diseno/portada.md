# Portada del cliente (/)

Diseño UX/UI · sáb 21 nov 2026. Código en `app/src/features/alta/portada/`. Capturas en `docs/diseno/capturas/`.

## Diagnóstico de la portada anterior

- El botón de compra quedaba a 1.389 px de alto en un teléfono de 375×740: nadie lo veía sin bajar dos pantallas.
- Tres titulares decían lo mismo (foto con el lema, "Descubre la calidad…" y el lema otra vez).
- Casi todo era texto corrido: no mostraba qué trae el sobre, cuánto gasta hoy la familia en botellones ni cómo se ve un resultado.
- La barra de navegación (Medir, Resultados, Mi lista) le hablaba a un cliente que todavía no existe.
- Las piezas de campaña traían otro logo y otra tipografía incrustados.

## Estructura elegida y por qué

Sigue el orden de la página de venta del material del asesor (`arquitectura-funnels.md` §3.7 y §4.1: nombre, promesa, llamado inmediato, beneficios, entregables, precio, llamado, preguntas frecuentes y llamado final) y el mensaje de marca de `contenido-comercial.md` (la familia es la protagonista; Grimuca la guía con un plan de tres pasos).

1. **Hero** con la foto de la madre y la niña recortada por CSS (sin el texto incrustado), el lema como título, una promesa concreta (tira, foto, minutos, qué filtro va), el precio y los dos caminos. El botón de compra queda a 454 px en el teléfono. Con `?sobre=1` (QR del sobre) el principal pasa a ser "Ya tengo mi sobre".
2. **El problema en cifras** (estimación de Tulio: 5 a 6 botellones por quincena, $20 a $48 al mes, hasta $576 al año). El curso dice que hablar de problemas interesa a más gente que hablar de oportunidades; aquí el problema es el gasto, no el miedo, por las reglas de Legal.
3. **Cómo funciona** en tres pasos (el plan de tres pasos del guion de marca).
4. **Qué trae el sobre** (entregables + precio + botón), con una ilustración propia del sobre.
5. **Qué vas a saber**: ocho indicadores y una muestra del resultado hecha con los componentes reales (`Semaforo`, `FilaParametro`, "Por qué te lo recomendamos"), rotulada "Ejemplo" y con el aviso fijo.
6. **¿Ya tienes filtro?** para el segundo mercado de Tulio (recambio de cartuchos).
7. **Confianza** sin datos inventados: las tres tiendas, el WhatsApp, "no pagas nada hasta confirmar con la tienda" y la línea de medición orientativa.
8. **Dudas frecuentes** en `<details>` y **cierre** con el botón y los enlaces legales.

Barra fija de compra en lugar de la barra de navegación. Solo aparece cuando no se ve ningún bloque con el botón principal, así nunca hay dos botones naranja a la vez en pantalla. Quien ya tiene hogar en el teléfono ve un tablero corto (último resultado, aviso de recambio, "Medir mi agua" y accesos) con su barra de navegación de siempre.

Los banners se construyeron en código con la estética de grimuca.com (azul, amarillo de acento, esquinas rectas, sin sombras) y se exportan desde `portada/index.ts`. `Pago.tsx` ya usa la ilustración del sobre en lugar de `sobre.jpg`.

## Qué hay que medir

| Métrica | Cómo | Para decidir |
|---|---|---|
| Clic en comprar sobre visitas a `/` sin hogar | Contar clics en cada botón: hero, bloque del sobre, cierre y barra fija | Qué bloque vende y si la barra fija aporta |
| Clic en "Ya tengo mi sobre" con `?sobre=1` | Visitas con `?sobre=1` contra llegadas a `/perfil?ya=1` | Si el QR del sobre funciona |
| Avance por paso | Llegadas a `/perfil` → `/envio` → `/pago` → pedido creado | Dónde se cae el pedido (indicador "Paso 1 de 3") |
| Lectura de la página | Hasta qué bloque baja la gente (cifras, muestra del resultado, dudas) | Si la muestra del resultado se ve antes de comprar |
| Dudas abiertas | Cuántas veces se abre cada `<details>` | Qué objeción pesa más; se responde más arriba |

Sin estas mediciones, los cambios siguientes serían opinión. Primera prueba barata: con los primeros 100 visitantes, comparar la tasa de clic del botón del hero con la de la portada anterior (0 % visible en el primer pantallazo).
