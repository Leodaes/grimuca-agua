# Registro de decisiones del equipo

Una línea por decisión: qué y por qué.

- sáb 21 nov, 8:25 p.m. · El sitio se publicó en `agua.oydo.app` con un vhost propio que hace proxy al puerto 3070 y usa el certificado comodín existente. Se respaldó la configuración del servidor web antes del cambio y se verificó que los demás sitios siguieran respondiendo.
- sáb 21 nov, 8:26 p.m. · Mientras no hay aplicación, el puerto 3070 sirve una página provisional, para comprobar el proxy de punta a punta desde la primera hora.
- sáb 21 nov, 8:30 p.m. · `insumos-tulio/` y el documento interno de traspaso no se suben al repositorio: pueden contener datos personales y detalles del servidor.
- sáb 21 nov, 8:30 p.m. · El modelo de visión y la URL del servicio se leen de variables de entorno; el código no fija ningún proveedor ni modelo.
- sáb 21 nov, 8:40 p.m. · Esta PC no tenía Node. Se descargó la versión estable desde el sitio oficial, se verificó su suma y se dejó en una carpeta aparte, fuera del repositorio y sin tocar la configuración del sistema. Sin esto no se podían correr las pruebas.
- sáb 21 nov, 8:45 p.m. · El documento de traspaso se sube al repositorio sin datos del servidor, sin correos y sin nombres de otros proyectos; la copia completa queda solo en local.
- sáb 21 nov, 8:50 p.m. · Versiones fijadas: React 18, React Router 6, Tailwind 3, Vite 6, Fastify 5, zod 3. Se prefirió lo conocido y estable a lo más nuevo.
- sáb 21 nov, 8:50 p.m. · La API corre con `tsx`, sin paso de compilación, para evitar errores de módulos a última hora.
- sáb 21 nov, 8:55 p.m. · Tienda por zona (supuesto por confirmar con Tulio): Naguanagua → Mañongo, San Diego → Big Low, Valencia norte → CC CEM.
- sáb 21 nov, 8:55 p.m. · Catálogo: se cargan Oasis y Aqual con un interruptor (`MARCAS_EXCLUIDAS`) para excluir una marca de las recomendaciones. Hay dos instrucciones distintas (Tulio: sin Aqual; Leonardo, después: con Aqual); vale la más reciente hasta que Tulio responda.
- sáb 21 nov, 8:55 p.m. · Las tarjetas de producto dicen "Cotizar por WhatsApp": grimuca.com no publica precios y no se inventan.
- sáb 21 nov, 9:00 p.m. · La alerta de zona cuenta solo rojos de parámetros de salud (cobre, nitrato, nitrito, plomo, cloro); dureza o hierro en rojo son demanda de equipos, no alerta.
- sáb 21 nov, 9:00 p.m. · La promesa "agua de calidad, monitoreada y permanente" no se usa dentro de la app; la revisión legal la considera una garantía. Se le propuso a Tulio una versión matizada.
- sáb 21 nov, 9:25 p.m. · Catálogo: decisión de Leonardo, solo marca Oasis. Aqual no se carga ni se recomienda. Reemplaza la decisión anterior de cargar las dos marcas.
- sáb 21 nov, 8:55 p.m. · Decisiones de Tulio aplicadas: lema "Saber qué tomas empieza en casa", semáforo con las palabras Verde, Amarillo y Rojo, frase de qué mide cada indicador, entrada por el QR del sobre con dos caminos, datos reales de las tiendas y recambio de cartucho cada 3 meses.
- sáb 21 nov, 8:55 p.m. · Dos ajustes a lo que pidió Tulio, por la revisión legal: el pie del resultado no usa la palabra que la app evita siempre ("…no certifica que el agua sea apta para tomar"), y en cobre y plomo no se dice "toca filtrar".
- sáb 21 nov, 8:55 p.m. · Los precios que mandó Tulio son de otras tiendas en línea; no se muestran en la app como precios de Grimuca. Se usan en el modelo de negocio como referencia de mercado.
- sáb 21 nov, 9:00 p.m. · Tienda por zona: Naguanagua y Valencia → Mañongo; San Diego → Big Low. CC CEM queda como opción que el cliente puede elegir.
- sáb 21 nov, 9:00 p.m. · El documento de traspaso público se recortó otra vez (sin detalle del servidor, de claves ni de correo) y el guion de despliegue ya no trae servidor ni llave por defecto, tras la revisión de secretos de Calidad.
- sáb 21 nov, 9:00 p.m. · Repositorio con licencia MIT; marca, logos y fotos de productos quedan fuera. Por confirmar con Leonardo.
- sáb 21 nov, 9:05 p.m. · Las cuatro imágenes de campaña que entregó Leonardo se usan en la portada y en la pantalla del sobre; la de los botellones queda solo para el deck porque su frase final suena a promesa sobre el agua.
- sáb 21 nov, 9:20 p.m. · Los productos sugeridos cubren cada hallazgo: si un parámetro en rojo queda sin producto que lo atienda, entra el equipo que lo trate aunque el hogar ya tenga filtro.
- sáb 21 nov, 9:20 p.m. · Marketing y Business trabajan con el método de asesoría de marketing y ventas del equipo (diagnóstico de fugas y plan numerado).
- sáb 21 nov, 10:00 p.m. · **Cambio de enfoque (decisión de Leonardo tras dos asesorías con jurados):** Grimuca Agua pasa a ser una plataforma para ferreterías que Grimuca opera, sin dejar al cliente final. La medición es la entrada; el valor grande está del lado de los comercios. El track sigue siendo Logística. Alcance de demo: cuatro módulos con su dirección (cliente, comercio, técnico y red), datos sembrados y un PIN por rol. Detalle en `docs/decisiones/contrato-red.md`.
- sáb 21 nov, 10:00 p.m. · Fuera del código y solo en el deck: cobro de la membresía, venta al mayor del sobre, comisión, plan premium, cuentas con contraseña y carga masiva de productos.
- sáb 21 nov, 10:05 p.m. · Orden de recorte si el cambio amenaza la estabilidad: primero el alta de productos, después el módulo del técnico. El recorrido del cliente no se toca.
- sáb 21 nov, 10:05 p.m. · La portada del cliente se rehace como página de venta, con heros y banners propios en la estética de Grimuca; las piezas de campaña con texto y logo incrustados dejan de usarse como bloques.
- dom 22 nov, 4:15 a.m. · Pasada legal final: se agregó el aviso fijo en el tablero del cliente y en el historial; nitrato y nitrito dejan de decir "contaminación" y pasan a "casilla para vigilar" con nota de laboratorio; la alerta de zona dice "Varios hogares de la zona reportaron resultados fuera de rango".
- dom 22 nov, 4:15 a.m. · No se aplicaron dos propuestas legales: (1) "Con esto no se juega" en cobre y plomo se mantiene porque es texto de Tulio ya revisado y no afirma nada sobre la salud; (2) "Calidad del agua" en el panel del comercio se mantiene porque es vocabulario interno y cambiarlo rompía las pruebas cerca del congelamiento. Ambas quedan para Leonardo y Tulio.
- dom 22 nov, 4:15 a.m. · Deck y documentos públicos usan $4,00 como costo base del sobre, con $2,94 como variante en nota, hasta que Leonardo decida.
- dom 22 nov · Leonardo decidió $2,94 como costo del sobre puesto en Venezuela; $4,00 queda como sensibilidad.
- dom 22 nov, 8:40 a.m. · Decisión de Leonardo: repositorio privado y "todos los derechos reservados" (antes MIT). Acceso como colaboradores para diegogallovich y Pleo2 (en una cuenta personal GitHub no ofrece rol de administrador; Leonardo confirmó que basta con colaborador). El repositorio `hackathon` no se comparte.
- dom 22 nov, 8:40 a.m. · Decisión de Leonardo: Big Low y CC CEM se ubican en Castillito (San Diego), según OpenStreetMap.
- dom 22 nov, 8:40 a.m. · Decisión de Leonardo: se quitan "Con esto no se juega" (cobre y plomo) y "Calidad del agua" en el panel del comercio pasa a "Resultados de la tira".
- dom 22 nov, 8:40 a.m. · El cliente puede cerrar sesión desde su tablero; se olvida el perfil en el teléfono y sus mediciones siguen guardadas.
- dom 22 nov, 9:10 a.m. · Decisión de Leonardo: el video de la demo se graba a eso de las 3:00 p.m., con aviso previo para confirmar que todo está listo. Tulio presenta al jurado. Se descargó ffmpeg en la PC (compilación oficial para Windows, suma verificada) para entregar el video en MP4. Se le pidió a Tulio la clave de ElevenLabs.
- dom 22 nov, 10:05 a.m. · Decisión de Leonardo: para la demo, los WhatsApp se muestran en pantalla como simulación (rotulados "Simulación: en la demo no se envía un WhatsApp real"), sin envíos reales. Aplica a pedidos, servicio técnico, recordatorios y al despacho del comercio. Reemplaza la regla anterior de no mostrar avisos por WhatsApp.
- dom 22 nov, 10:05 a.m. · Recordatorios de próxima medición y de cambio de cartucho: se agregan al calendario del teléfono (Google Calendar o archivo .ics) y se muestran como WhatsApp simulado.
- dom 22 nov, 10:30 a.m. · Llegó la tira real: Qteeyou "Drinking Water 8 in 1". Se configuró con los valores de su tabla (pH de 6,2 a 8,4; nitrato hasta 500, nitrito hasta 80 y cloro libre hasta 20). El semáforo sigue con los umbrales de la OMS y la EPA de `umbrales.ts`, no con los recuadros del fabricante. Falta probar con la tira mojada y una foto real (Compuerta 4).

## 22 nov, 11:20 a.m. · Estudios por zona y aviso a vecinos (pedido de Leonardo vía planificación)
- App (antes del congelamiento, desplegado 912aa1c): en Comercio → Zonas, cada alerta por zona tiene "Avisar a los vecinos de la zona". Solo muestra el WhatsApp simulado con el texto aprobado en `docs/legal/riesgos.md` (M3) y "Enviado (simulado)"; no envía nada ni toca la lógica de alertas.
- Deck: lámina 5 pasa a cuatro líneas de ingreso; la cuarta, estudios por zona para universidades e instituciones públicas, va rotulada SUPUESTO y sin precio. La alerta temprana va en la nota del orador de la lámina 6 (la lámina ya tiene 3 viñetas).
- Guiones: frase de Tulio de unos 10 s en Zonas (demo en vivo y video), primera en cortarse si falta tiempo.
- Legal: respuesta 23 de `preguntas-jurado.md`. Revisado contra `riesgos.md` M3 y `puede-y-no-puede-decir.md`: agregado y anónimo, con consentimiento aparte (la demo no lo tiene todavía), sin nombrar hogares, "medición casera orientativa", sin "potable", "certificado" ni "verificado". Mínimo de hogares por zona y encaje legal: confirmar con abogado.

## 22 nov, 1:40 p.m. · Compuerta 4: la foto propone, la persona confirma (pedido de Leonardo)
- Con la tira real mojada, la app leyó plomo 5 (a ojo, 0) y alcalinidad 0 (a ojo, entre 0 y 40); el semáforo salió amarillo. Detalle en `docs/calibracion/guia-calibracion.md`, Compuerta 4.
- Leonardo pidió que la app no dé por buena la lectura: después de la foto se muestra lo leído para confirmar o corregir. Si no cambia nada, se usa la medición de la foto; si corrige, se guarda una medición a mano.
- También "Corrígela a mano" en todo resultado por foto, y "Completarlas a mano" de las casillas sin lectura llega con lo leído ya marcado.
