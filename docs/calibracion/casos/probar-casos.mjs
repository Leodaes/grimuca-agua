// Envía las fotos de esta carpeta al lector publicado y muestra qué respondió en cada caso.
// Uso, desde la raíz del repo:
//   node docs/calibracion/casos/probar-casos.mjs [hogar_id] [foto.jpg ...]
// Sin hogar_id crea un hogar "Prueba Calidad" (el orquestador los limpia; aquí no se borra nada).
// Se puede pasar una foto propia (por ejemplo, la de la tira real) en lugar de los casos.
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITIO = process.env.SITIO ?? 'https://agua.oydo.app';
const CARPETA = dirname(fileURLToPath(import.meta.url));
let [hogarId, ...fotos] = process.argv.slice(2);

if (!hogarId || hogarId === 'nuevo') {
  const r = await fetch(`${SITIO}/api/hogares`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Prueba Calidad Medición',
      zona: 'Naguanagua',
      urbanizacion: 'Tazajal',
      origen_agua: 'chorro',
      personas: 3,
      tiene_filtro: false,
      agua_turbia: false,
      whatsapp: '04145550199',
      consentimiento: true,
    }),
  });
  hogarId = (await r.json()).id;
  console.log(`Hogar de prueba: ${hogarId}`);
}
if (fotos.length === 0) {
  fotos = readdirSync(CARPETA).filter((f) => f.endsWith('.jpg')).sort().map((f) => join(CARPETA, f));
}

for (const ruta of fotos) {
  const formulario = new FormData();
  formulario.append('hogar_id', hogarId);
  formulario.append('foto', new Blob([readFileSync(resolve(ruta))], { type: 'image/jpeg' }), basename(ruta));
  const inicio = Date.now();
  const r = await fetch(`${SITIO}/api/mediciones/foto`, { method: 'POST', body: formulario });
  const cuerpo = await r.json();
  const seg = ((Date.now() - inicio) / 1000).toFixed(1);
  const detalle =
    cuerpo.estado === 'ok'
      ? `${JSON.stringify(cuerpo.medicion.valores)} · semáforo ${cuerpo.medicion.evaluacion?.semaforo}`
      : (cuerpo.motivo ?? JSON.stringify(cuerpo));
  console.log(`${basename(ruta)} · ${cuerpo.estado ?? r.status} · ${seg} s\n  ${detalle}`);
}
