// Builds catalogo_grimuca_agua.csv from the PUBLIC WooCommerce Store API of grimuca.com.
// No login, no credentials, read-only GETs. Usage: node insumos/catalogo/extraer.js
const fs = require('fs');
const path = require('path');

const API = 'https://grimuca.com/wp-json/wc/store/v1/products';
const BRANDS = { oasis: 'Oasis', aqual: 'Aqual' };
// Water-treatment categories (slugs). Faucet cartridges (repuestos-cartuchos) are excluded on purpose.
const WATER_CATS = new Set(['filtros', 'filtros-cartuchos', 'filtros-membranas', 'filtros-tanques-osmosis',
  'repuestos-filtros', 'filtros-ducha', 'filtros-griferia', 'filtros-nevera', 'filtros-regadera', 'regaderas-filtros']);

const strip = s => (s || '').replace(/<[^>]*>/g, ' ').replace(/&#8243;|&quot;/g, '"').replace(/&#8211;/g, '-')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();

const ACCESORIO = /^(v(á|a)lvula|manguera|rollo de manguera|grifo|panel|par de difusores|set de difusores|adaptador|atesador|llave|conector|codo|tee|uni(ó|o)n)/i;

// Web category first, then the product name.
function categoria(name, cats) {
  const n = name.toLowerCase(); const c = cats.map(x => x.name).join('|');
  if (ACCESORIO.test(name)) return 'accesorio';
  if (/Membranas/.test(c)) return /ultrafiltr|\buf\b/.test(n) ? 'membrana_ultrafiltracion' : 'membrana_osmosis';
  if (/Tanques de ósmosis/.test(c)) return 'tanque_osmosis';
  if (/Carcasas y portamembranas/.test(c)) return 'portafiltro';
  if (/Desbarradores/.test(c)) return 'filtro_desbarrador';
  if (/Suavizadores/.test(c)) return 'suavizador';
  if (/Repuestos para filtros/.test(c)) return 'repuesto';
  if (/Cartuchos/.test(c) || /cartucho/.test(n)) return 'cartucho';
  if (/(ó|o)smosis inversa/.test(n)) return 'sistema_osmosis_inversa';
  return 'filtro';
}

// Only what the listing itself states. Anything unclear stays "por_confirmar".
function corrige(text) {
  const t = text.toLowerCase(); const out = [];
  if (/sediment|polipropileno|\bpp\b|plisad|hilo bobinado|desbarr|micr(a|ó)n|turbidez/.test(t)) out.push('sedimentos');
  if (/carb(o|ó)n|\bgac\b|\bcto\b|cloro|sabor|olor/.test(t)) out.push('cloro_sabor');
  if (/suaviz|resina|dureza|sarro|calcio|magnesio|polifosfato/.test(t)) out.push('dureza');
  if (/plomo|cobre|metales pesados|\bkdf\b/.test(t)) out.push('metales');
  if (/nitrat/.test(t)) out.push('nitratos');
  if (/(o|ó)smosis/.test(t)) out.push('osmosis_inversa');
  return out.length ? out.join('|') : 'por_confirmar';
}

const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function fetchBrand(slug) {
  const rows = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}?brand=${slug}&per_page=100&page=${page}`);
    if (!res.ok) throw new Error(`${slug} p${page}: HTTP ${res.status}`);
    const batch = await res.json(); rows.push(...batch);
    if (batch.length < 100) return rows;
  }
}

async function main() {
  const cols = ['sku', 'nombre', 'marca', 'categoria', 'corrige', 'disponibilidad', 'precio', 'moneda', 'precio_publico', 'url_producto', 'url_foto', 'categorias_web', 'id_web'];
  const lines = [cols.join(',')]; const stats = {};
  for (const [slug, marca] of Object.entries(BRANDS)) {
    const items = (await fetchBrand(slug)).filter(p => p.categories.some(c => WATER_CATS.has(c.slug)));
    for (const p of items) {
      const name = strip(p.name);
      const minor = p.prices?.currency_minor_unit ?? 2;
      const raw = p.prices?.price;
      const hasPrice = raw !== undefined && raw !== '' && Number(raw) > 0;
      const cat = categoria(name, p.categories);
      // Desbarrador / Suavizador categories state what they treat; other category names would mislead.
      const catHint = p.categories.map(c => c.name).filter(x => /Desbarradores|Suavizadores/.test(x)).join(' ');
      const row = {
        sku: p.sku, nombre: name, marca, categoria: cat,
        corrige: cat === 'accesorio' ? 'no_aplica'
          : corrige([name, catHint, strip(p.short_description), strip(p.description)].join(' ')),
        // In stock / out of stock only: exact stock counts are not published here.
        disponibilidad: p.is_in_stock ? 'disponible' : 'agotado',
        precio: hasPrice ? (Number(raw) / 10 ** minor).toFixed(minor) : '',
        moneda: hasPrice ? p.prices.currency_code : '',
        precio_publico: hasPrice ? 'si' : 'no',
        url_producto: p.permalink, url_foto: p.images?.[0]?.src || '',
        categorias_web: p.categories.map(c => strip(c.name)).join('|'), id_web: p.id,
      };
      lines.push(cols.map(c => csvCell(row[c])).join(','));
      const s = stats[marca] ??= { total: 0, con_precio: 0, por_confirmar: 0, categorias: {} };
      s.total++; if (hasPrice) s.con_precio++; if (row.corrige === 'por_confirmar') s.por_confirmar++;
      s.categorias[row.categoria] = (s.categorias[row.categoria] || 0) + 1;
    }
  }
  const dir = __dirname;
  fs.writeFileSync(path.join(dir, 'catalogo_grimuca_agua.csv'), '﻿' + lines.join('\n') + '\n');
  console.log(JSON.stringify(stats, null, 2));
}

if (process.env.AUTOTEST) {
  const assert = require('assert');
  assert.strictEqual(corrige('Cartucho de Filtro Carbón Block 10"'), 'cloro_sabor');
  assert.strictEqual(corrige('Cartucho polipropileno 5 micras'), 'sedimentos');
  assert.strictEqual(corrige('Llave cromada'), 'por_confirmar');
  assert.strictEqual(categoria('Membrana de ósmosis 75 GPD', [{ name: 'Membranas de ósmosis y ultrafiltración' }]), 'membrana_osmosis');
  assert.strictEqual(categoria('Válvula Check ⅜» para Ósmosis Inversa', [{ name: 'Filtros y Purificadores' }]), 'accesorio');
  assert.strictEqual(categoria('Sistema de Ósmosis Inversa 5 etapas', [{ name: 'Filtros y Purificadores' }]), 'sistema_osmosis_inversa');
  console.log('autotest ok');
} else main().catch(e => { console.error(e.message); process.exit(1); });
