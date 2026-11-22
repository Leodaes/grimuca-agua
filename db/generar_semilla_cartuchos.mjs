// Genera db/semilla_cartuchos.sql a partir del catálogo público de Grimuca
// (insumos/catalogo/catalogo_grimuca_agua.csv). Uso: node db/generar_semilla_cartuchos.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const texto = readFileSync('insumos/catalogo/catalogo_grimuca_agua.csv', 'utf8').replace(/^﻿/, '');

function leerCsv(t) {
  const filas = [];
  let celda = '', fila = [], enComillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"') { if (t[i + 1] === '"') { celda += '"'; i++; } else enComillas = false; }
      else celda += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { fila.push(celda); celda = ''; }
    else if (c === '\n') { fila.push(celda); filas.push(fila); fila = []; celda = ''; }
    else if (c !== '\r') celda += c;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  const cabecera = filas.shift();
  return filas.filter((f) => f.length > 3).map((f) => Object.fromEntries(cabecera.map((k, i) => [k, f[i]])));
}

// Del vocabulario del catálogo a las claves que usa la evaluación del agua.
const equivalencias = {
  sedimentos: ['sedimentos'],
  cloro_sabor: ['cloro_libre', 'sabor_olor'],
  dureza: ['dureza'],
  metales: ['plomo', 'cobre'],
  nitratos: ['nitrato', 'nitrito'],
  osmosis_inversa: ['nitrato', 'nitrito', 'plomo', 'cobre', 'dureza'],
};
// Categorías que se pueden sugerir al cliente; las demás son repuestos o piezas de soporte.
const recomendables = new Set(['cartucho', 'filtro', 'filtro_desbarrador', 'sistema_osmosis_inversa', 'suavizador']);
// Vida útil orientativa en meses (docs/negocio/agua.md); por confirmar con la ficha del fabricante.
const vidaUtil = { cartucho: 3, filtro: 3, filtro_desbarrador: 12, sistema_osmosis_inversa: 12, membrana_osmosis: 24, membrana_ultrafiltracion: 12, suavizador: 12 };

const sql = (v) => (v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

const productos = leerCsv(texto).filter((p) => p.marca === 'Oasis' && p.categoria !== 'accesorio');
const lineas = [];
for (const p of productos) {
  let corrige = [];
  let recomendable = recomendables.has(p.categoria);
  const esLamparaUv = /^L[áa]mpara .*UV|^Esterilizador ultravioleta/i.test(p.nombre);
  if (p.corrige === 'por_confirmar') {
    if (esLamparaUv) { corrige = ['bacterias']; recomendable = true; }
    else recomendable = false; // sin confirmar qué trata: no se sugiere
  } else if (p.corrige !== 'no_aplica') {
    // "osmosis_inversa" en el catálogo marca también piezas y postfiltros que solo acompañan a un equipo de ósmosis.
    // Solo el equipo completo se toma como opción para nitrato, nitrito, plomo, cobre y dureza.
    const etiquetas = p.corrige.split('|').filter((c) => c !== 'osmosis_inversa' || p.categoria === 'sistema_osmosis_inversa');
    corrige = [...new Set(etiquetas.flatMap((c) => equivalencias[c] ?? []))];
  }
  if (corrige.length === 0) recomendable = false;
  // Equipos de capacidad comercial (1200 GPD, 2000 L/h): están en el catálogo, pero no se sugieren a un hogar.
  if (/1200 GPD|2000 L\/h/i.test(p.nombre)) recomendable = false;
  const categoria = esLamparaUv ? 'lampara_uv' : p.categoria;
  lineas.push(
    `  (${sql(p.sku)}, ${sql(p.nombre)}, ${sql(p.marca)}, NULL, ARRAY[${corrige.map(sql).join(', ')}]::text[], false, ${sql(p.url_foto)}, ${vidaUtil[p.categoria] ?? 'NULL'}, ${sql(categoria)}, ${recomendable}, ${sql(p.url_producto)}, ${p.disponibilidad === 'disponible'})`,
  );
}

const salida = `-- Catálogo de productos de agua de Grimuca, marca Oasis.
-- Generado por db/generar_semilla_cartuchos.mjs desde insumos/catalogo/catalogo_grimuca_agua.csv. No editar a mano.
-- Sin precios: grimuca.com no los publica; la tarjeta dice "Cotizar por WhatsApp".
-- "corrige" se dedujo del nombre y la descripción pública; por confirmar con la ficha del fabricante.
INSERT INTO cartuchos (codigo, nombre, marca, precio_usd, corrige, es_ejemplo, foto_url, vida_util_meses, categoria, recomendable, url_producto, disponible) VALUES
${lineas.join(',\n')}
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, marca = EXCLUDED.marca, corrige = EXCLUDED.corrige, es_ejemplo = false,
  foto_url = EXCLUDED.foto_url, vida_util_meses = EXCLUDED.vida_util_meses, categoria = EXCLUDED.categoria,
  recomendable = EXCLUDED.recomendable, url_producto = EXCLUDED.url_producto, disponible = EXCLUDED.disponible;
`;
writeFileSync('db/semilla_cartuchos.sql', salida);
console.log(`${productos.length} productos; ${lineas.filter((l) => l.includes(', true, ')).length} recomendables`);
