-- 005_urbanizacion.sql · Urbanización del hogar (opcional) para el mapa de hexágonos del operador.
-- El nombre debe coincidir con la lista de api/src/logistica/urbanizaciones.ts; si no coincide o es nulo,
-- el hogar se cuenta en "Otras de <zona>".
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS urbanizacion text;
CREATE INDEX IF NOT EXISTS hogares_urbanizacion_idx ON hogares (urbanizacion);

-- ¿Hay mascotas en casa? (pregunta del perfil; ellas también toman de esa agua).
ALTER TABLE hogares ADD COLUMN mascotas boolean NOT NULL DEFAULT false;
