-- 004_servicios.sql · Pedidos de servicio técnico ("Contrata a un experto"): cambio de cartucho o instalación de filtro.
-- No se cobra nada en la app: la tienda contacta al cliente para confirmar costo y fecha.
-- El CHECK en línea de 001 lo nombra Postgres `pedidos_tipo_check`.
-- (En las pruebas, pg-mem lo nombra distinto: el ayudante de pruebas traduce el nombre del DROP.)
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_tipo_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_tipo_check CHECK (tipo IN ('sobre', 'cartucho', 'servicio'));

-- Solo los pedidos de tipo 'servicio' las llenan; en los demás quedan nulas.
ALTER TABLE pedidos ADD COLUMN servicio text;
ALTER TABLE pedidos ADD COLUMN fecha_preferida date;
ALTER TABLE pedidos ADD COLUMN momento text;
ALTER TABLE pedidos ADD COLUMN nota text;

ALTER TABLE pedidos ADD CONSTRAINT pedidos_servicio_check CHECK (servicio IS NULL OR servicio IN ('cambio_cartucho', 'instalacion_filtro'));
-- Momento del día preferido: 'manana' | 'tarde'.
ALTER TABLE pedidos ADD CONSTRAINT pedidos_momento_check CHECK (momento IS NULL OR momento IN ('manana', 'tarde'));
