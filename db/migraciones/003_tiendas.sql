-- 003_tiendas.sql · Datos públicos de las tres tiendas (fuente: grimuca.com).
UPDATE tiendas SET nombre = 'Mañongo', horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
  direccion = 'C.C. Profesional Paseo Orquídea, local A-3, Av. Salvador Feo La Cruz, Naguanagua' WHERE id = 'manongo';
UPDATE tiendas SET nombre = 'Big Low', horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
  direccion = 'C.C. Big Low Center, nivel 1, nave F, locales 1–3 y 35–37, calle 101, diagonal al terminal, San Diego' WHERE id = 'biglow';
UPDATE tiendas SET nombre = 'CC CEM', horario = 'Lunes a viernes de 8:30 a.m. a 4:30 p.m. Sábados de 9:00 a.m. a 2:00 p.m.',
  direccion = 'C.C. CEM I, nivel 1, local 06, Av. Don Julio Centeno, frente al Big Low, San Diego' WHERE id = 'cem';
