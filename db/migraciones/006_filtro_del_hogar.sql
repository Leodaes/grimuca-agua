-- 006_filtro_del_hogar.sql · Filtro del hogar identificado por foto o cargado a mano.
-- `etapas_filtro` (001) se sigue usando para el número de etapas.
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS filtro_tipo text;
-- Código del catálogo (cartuchos.codigo); nulo si no se identificó un modelo exacto. Sin llave foránea:
-- el catálogo se recarga con la semilla y un código puede dejar de existir.
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS filtro_modelo_codigo text;
-- Largo x diámetro de los cartuchos en pulgadas: '10x2.5', '10x4.5', '20x2.5', '20x4.5'; nulo si no se sabe.
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS filtro_medida text;
-- Lo que devolvió la identificación (marca y modelo leídos, confianza, observaciones, nombre del modelo).
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS filtro_detalle jsonb;
-- 'foto' | 'manual'
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS filtro_origen text;
