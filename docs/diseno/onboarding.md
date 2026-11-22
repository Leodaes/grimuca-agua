# Alta del cliente (onboarding): qué cambió

22 nov. Pedido del dueño: "El onboarding puede mejorar con reglas de UX/UI y buenas prácticas". Capturas a 375×812 en `docs/diseno/capturas/onboarding-*.png`. Los campos que guarda la API no cambian.

| Cambio | Regla |
|---|---|
| El perfil va en cuatro bloques con título: **Tu casa**, **Tu agua**, **Tu filtro** y **Cómo te contactamos**. Arriba dice para qué son los datos ("Con esto te damos un resultado hecho para tu casa. Toma un minuto.") y que todo hace falta salvo lo marcado "(opcional)". | 1 Menos esfuerzo · 5 Confianza |
| **Urbanización** queda deshabilitada hasta elegir la zona ("Primero elige tu zona."). "¿Cuándo cambiaste el cartucho…?" y el aviso de la foto solo salen si responde "Sí" a "¿Tienen filtro en casa?". | 2 Orden y dependencias |
| Las opciones son tarjetas grandes con radios accesibles. El origen del agua lleva un icono de línea. Sí/No van lado a lado. **Personas** se elige con − y + de 44 px y no trae un valor puesto. Mascotas sigue en "No". | 3 Controles adecuados |
| **Nombre** y **Apellido** van en campos separados (`given-name` y `family-name`) y se guardan juntos en `nombre`. Con +58, el WhatsApp va en **Operadora** (0412…0426, sin preselección) y **Número** (7 dígitos, `inputmode="numeric"`, acepta espacios y guiones). Con otro país queda un solo campo **Número**. Si pega el número completo, se reparte solo. | 3 · 7 Accesibilidad |
| Valida al salir del campo y al enviar, nunca mientras escribe. Al fallar el envío, arriba aparece un resumen (`role="alert"`) con un enlace a cada error, y el foco va al primero. El botón nunca se deshabilita, salvo mientras dice "Guardando…". | 4 Validación amable · 6 |
| El consentimiento literal de legal y el enlace al aviso de privacidad van junto al botón. Debajo del grupo "Tu WhatsApp" dice "Solo para coordinar tu pedido." | 5 Confianza |
| Hay **"Atrás"** en el perfil, el envío, el pago y Mi filtro. Lo escrito se guarda en `sessionStorage` (el consentimiento no) y vuelve al regresar. | 6 Progreso y salida |
| **Envío**: "Dirección de entrega" (`street-address`) con ejemplo de formato y "Punto de referencia (opcional)", que se guarda al final de la dirección como ". Referencia: …". La tienda se explica en una línea ("Lo enviamos desde Grimuca Mañongo, la más cercana a tu zona; puedes cambiarla.") y la lista de tiendas sale solo al pulsar "Cambiar tienda". | 9 Envío y pago · 1 |
| **Pago**: el resumen va en una ficha (qué trae, envío a, sale de, total) con "Cambiar dirección o tienda". Arriba del botón está el rótulo legal literal. | 9 |
| **Mi filtro**: la foto es la opción principal, con una ilustración de ejemplo (el filtro completo y la etiqueta visible). Debajo, "¿No puedes tomar la foto?" lleva a **"Cargarlo a mano"**. Dentro del alta lleva "Atrás" y "Paso 1 de N: tu filtro". | 10 Mi filtro · 6 |
| **Carga a mano**: el modelo es opcional y va al final. Solo salen los modelos del tipo elegido y nunca los comerciales (1200 GPD, 2000 L/h). Se muestran en filas con nombre corto y detalle ("200 GPD · OPW-200GPD-8TN"), de menor a mayor, 6 a la vista y "Ver más modelos". | 3 · 1 |
| Todo usa los colores de Grimuca: azul para la estructura y `--accion` solo en el botón principal. Esquinas rectas, sin sombras, foco visible en la tarjeta completa y objetivos de 44–48 px. | 7 · 8 Estética |

Nombres visibles que cambiaron: "¿Cómo te llamas?" ahora es **Nombre** y **Apellido**. "Tu WhatsApp" ya no es un campo de texto: es el grupo con **Código de país**, **Operadora** y **Número**. En el envío se agregó **Punto de referencia** y el botón **Cambiar tienda**. En Mi filtro, el enlace "¿No puedes tomar la foto? Cárgalo a mano" ahora es el botón **Cargarlo a mano**. El modelo ya no es un `select`: ahora es el grupo **Modelo (opcional)**. Los botones **Continuar**, **Continuar al pago** y **Simular pago de $9** no cambian. Las pruebas de navegador (`apoyo/perfil.ts`, `02`, `06`, `07` y `09`) ya usan estos nombres.
