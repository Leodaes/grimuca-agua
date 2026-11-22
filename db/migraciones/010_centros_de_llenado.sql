-- 010_centros_de_llenado.sql · Centros de llenado de botellones como comercios afiliados (docs/negocio/idea-centros-de-llenado.md).
-- Decisión de Leonardo (22 nov): sus resultados se publican siempre, también los fuera de rango; Grimuca no dice si el
-- agua es buena o mala. El cliente (hogar o negocio) ve al registrarse el centro con resultados públicos más cercano.

-- Tipo de comercio: ferretería (vende filtros y cartuchos) o centro de llenado de botellones.
ALTER TABLE comercios ADD COLUMN tipo text NOT NULL DEFAULT 'ferreteria';
ALTER TABLE comercios ADD CONSTRAINT comercios_tipo_check CHECK (tipo IN ('ferreteria', 'centro_llenado'));

-- Urbanización donde queda la tienda (nombre de la lista de api/src/logistica/urbanizaciones.ts).
-- Ubica al centro (centro aproximado de la urbanización) para calcular el más cercano. Nulo en las ferreterías.
ALTER TABLE tiendas ADD COLUMN urbanizacion text;

-- Tipo de cliente: hogar o negocio (restaurante, oficina…). El negocio indica su rubro.
ALTER TABLE hogares ADD COLUMN tipo_cliente text NOT NULL DEFAULT 'hogar';
ALTER TABLE hogares ADD CONSTRAINT hogares_tipo_cliente_check CHECK (tipo_cliente IN ('hogar', 'negocio'));
ALTER TABLE hogares ADD COLUMN rubro text;

-- Mediciones del técnico de Grimuca en el grifo de despacho de un centro. Se publican siempre y no se borran:
-- una medición nueva no reemplaza a la anterior, queda en el historial.
-- `valores` guarda las casillas de la tira tal como se leyeron; la comparación con la referencia se calcula al leer.
-- `bacterias`: el frasco se lee a las 48 horas, por eso empieza en 'pendiente'.
CREATE TABLE mediciones_centro (
  id serial PRIMARY KEY,
  tienda_id text NOT NULL REFERENCES tiendas (id) ON DELETE CASCADE,
  fecha timestamptz NOT NULL DEFAULT now(),
  valores jsonb NOT NULL,
  bacterias text NOT NULL DEFAULT 'pendiente' CHECK (bacterias IN ('cambio', 'sin_cambio', 'pendiente')),
  fecha_bacterias timestamptz,
  nota text,
  medido_por text NOT NULL DEFAULT 'Técnico de Grimuca'
);

CREATE INDEX mediciones_centro_tienda_fecha_idx ON mediciones_centro (tienda_id, fecha);
