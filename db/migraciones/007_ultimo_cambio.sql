-- 007_ultimo_cambio.sql · Respuesta cerrada del perfil: "¿Cuándo cambiaste el cartucho por última vez?"
-- 'menos_de_un_mes' | 'mas_de_tres_meses' | 'no_me_acuerdo'; nulo si no hay filtro o no se preguntó.
-- La API deriva además fecha_ultimo_cambio (hoy − 15 días, hoy − 100 días o nulo) para el recordatorio y la logística.
ALTER TABLE hogares ADD COLUMN IF NOT EXISTS ultimo_cambio text;
