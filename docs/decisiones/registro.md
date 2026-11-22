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
