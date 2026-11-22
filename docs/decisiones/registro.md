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
