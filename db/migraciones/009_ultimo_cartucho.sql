-- 009_ultimo_cartucho.sql · "Registrar cambio de cartucho": cuál cartucho se cambió la última vez (opcional).
-- Texto libre o nombre del catálogo; nulo si no se anotó. La fecha sigue en fecha_ultimo_cambio.
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS ultimo_cartucho text;
