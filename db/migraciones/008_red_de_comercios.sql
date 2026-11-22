-- 008_red_de_comercios.sql · Plataforma para ferreterías que Grimuca opera (docs/decisiones/contrato-red.md).
-- Cada tienda pertenece a un comercio; un hogar pertenece al comercio de su tienda (sin tienda: grimuca).
-- `cartuchos.comercio_id` nulo = catálogo general; con valor = producto cargado por ese comercio.

CREATE TABLE comercios (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  estado_pais text NOT NULL,
  ciudad text NOT NULL,
  plan text NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'premium')),
  -- Nulo en la demo: el precio de la membresía todavía no está fijado.
  membresia_usd numeric(10, 2),
  fecha_alta timestamptz NOT NULL DEFAULT now(),
  fin_periodo_gratis date,
  activo boolean NOT NULL DEFAULT true,
  es_demostracion boolean NOT NULL DEFAULT false
);

-- Grimuca existe aunque no se cargue la semilla (como las tres tiendas de 001).
INSERT INTO comercios (id, nombre, estado_pais, ciudad, plan, membresia_usd, fin_periodo_gratis, activo, es_demostracion)
VALUES ('grimuca', 'Grimuca', 'Carabobo', 'Valencia', 'premium', NULL, NULL, true, false);

ALTER TABLE tiendas ADD COLUMN comercio_id text REFERENCES comercios (id);
UPDATE tiendas SET comercio_id = 'grimuca' WHERE comercio_id IS NULL;
CREATE INDEX tiendas_comercio_idx ON tiendas (comercio_id);

ALTER TABLE cartuchos ADD COLUMN comercio_id text;

CREATE TABLE reportes_servicio (
  pedido_id integer PRIMARY KEY REFERENCES pedidos (id) ON DELETE CASCADE,
  fecha_visita timestamptz NOT NULL DEFAULT now(),
  nota text,
  foto bytea,
  foto_tipo text
);
