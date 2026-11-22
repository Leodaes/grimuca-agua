-- 003_tiendas.sql · Horario y dirección de las tres tiendas (datos públicos de grimuca.com).
-- Reemplaza los marcadores "Por confirmar" de la migración inicial.
UPDATE tiendas
   SET horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
       direccion = 'C.C. Profesional Paseo Orquídea, local A-3, Av. Salvador Feo La Cruz, Naguanagua'
 WHERE id = 'manongo';

UPDATE tiendas
   SET horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
       direccion = 'C.C. Big Low Center, nivel 1, nave F, locales 1-3 y 35-37, calle 101, San Diego'
 WHERE id = 'biglow';

UPDATE tiendas
   SET horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
       direccion = 'C.C. CEM I, nivel 1, local 06, Av. Don Julio Centeno, San Diego'
 WHERE id = 'cem';
