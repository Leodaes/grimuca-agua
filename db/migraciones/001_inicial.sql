-- 001_inicial.sql · Esquema inicial de Grimuca Agua.
-- Lo aplica api/src/migrar.ts dentro de una transacción y lo registra en la tabla "migraciones".
-- Fuente: docs/decisiones/contrato-api.md (sección "Base de datos").

CREATE TABLE tiendas (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  horario text NOT NULL,
  direccion text
);

CREATE TABLE cartuchos (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  marca text NOT NULL,
  precio_usd numeric(10, 2),
  corrige text[] NOT NULL DEFAULT '{}',
  es_ejemplo boolean NOT NULL DEFAULT false,
  foto_url text,
  vida_util_meses integer
);

CREATE TABLE stock (
  tienda_id text NOT NULL REFERENCES tiendas (id),
  cartucho_codigo text NOT NULL REFERENCES cartuchos (codigo),
  cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  PRIMARY KEY (tienda_id, cartucho_codigo)
);

CREATE TABLE hogares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  zona text NOT NULL,
  origen_agua text NOT NULL CHECK (origen_agua IN ('chorro', 'botellon', 'filtro', 'tanque', 'pozo')),
  personas integer NOT NULL CHECK (personas > 0),
  tiene_filtro boolean NOT NULL DEFAULT false,
  etapas_filtro integer,
  fecha_ultimo_cambio date,
  agua_turbia boolean NOT NULL DEFAULT false,
  whatsapp text NOT NULL,
  direccion text,
  tienda_id text REFERENCES tiendas (id),
  consentimiento_fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX hogares_zona_idx ON hogares (zona);

CREATE TABLE mediciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hogar_id uuid NOT NULL REFERENCES hogares (id) ON DELETE CASCADE,
  fecha timestamptz NOT NULL DEFAULT now(),
  origen text NOT NULL CHECK (origen IN ('foto', 'manual')),
  valores jsonb NOT NULL,
  semaforo text NOT NULL CHECK (semaforo IN ('verde', 'amarillo', 'rojo', 'sin_dato')),
  semaforo_por_parametro jsonb NOT NULL,
  evaluacion jsonb NOT NULL
);

CREATE INDEX mediciones_hogar_fecha_idx ON mediciones (hogar_id, fecha);
CREATE INDEX mediciones_fecha_idx ON mediciones (fecha);

CREATE TABLE pruebas_bacterias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hogar_id uuid NOT NULL UNIQUE REFERENCES hogares (id) ON DELETE CASCADE,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_reporte timestamptz,
  resultado text NOT NULL DEFAULT 'pendiente' CHECK (resultado IN ('cambio', 'sin_cambio', 'pendiente'))
);

CREATE TABLE pedidos (
  id serial PRIMARY KEY,
  hogar_id uuid NOT NULL REFERENCES hogares (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('sobre', 'cartucho')),
  cartucho_codigo text REFERENCES cartuchos (codigo),
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  modalidad text NOT NULL CHECK (modalidad IN ('retiro', 'envio')),
  direccion text,
  pago text NOT NULL CHECK (pago IN ('simulado', 'no_aplica')),
  tienda_id text NOT NULL REFERENCES tiendas (id),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'despachado')),
  fecha timestamptz NOT NULL DEFAULT now(),
  fecha_despacho timestamptz
);

CREATE INDEX pedidos_estado_fecha_idx ON pedidos (estado, fecha);
CREATE INDEX pedidos_hogar_idx ON pedidos (hogar_id);
CREATE INDEX pedidos_tienda_idx ON pedidos (tienda_id);

-- Las tres tiendas son identificadores fijos del contrato: existen aunque no se cargue la semilla.
-- Horario y dirección son marcadores hasta que Grimuca confirme los datos reales.
INSERT INTO tiendas (id, nombre, horario, direccion) VALUES
  ('manongo', 'Mañongo', 'Por confirmar', NULL),
  ('biglow', 'Big Low', 'Por confirmar', NULL),
  ('cem', 'CC CEM', 'Por confirmar', NULL);
