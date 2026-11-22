# Registro de decisiones del equipo

Una línea por decisión: qué y por qué.

- sáb 21 nov, 8:25 p.m. · El sitio se publicó en `agua.oydo.app` con un vhost propio que hace proxy al puerto 3070 y usa el certificado comodín existente. Se respaldó la configuración del servidor web antes del cambio y se verificó que los demás sitios siguieran respondiendo.
- sáb 21 nov, 8:26 p.m. · Mientras no hay aplicación, el puerto 3070 sirve una página provisional, para comprobar el proxy de punta a punta desde la primera hora.
- sáb 21 nov, 8:30 p.m. · `insumos-tulio/` y el documento interno de traspaso no se suben al repositorio: pueden contener datos personales y detalles del servidor.
- sáb 21 nov, 8:30 p.m. · El modelo de visión y la URL del servicio se leen de variables de entorno; el código no fija ningún proveedor ni modelo.
