-- 002_catalogo.sql · Campos del catálogo real: categoría, si se puede sugerir, enlace público y disponibilidad.
ALTER TABLE cartuchos ADD COLUMN categoria text;
ALTER TABLE cartuchos ADD COLUMN recomendable boolean NOT NULL DEFAULT true;
ALTER TABLE cartuchos ADD COLUMN url_producto text;
ALTER TABLE cartuchos ADD COLUMN disponible boolean NOT NULL DEFAULT true;
