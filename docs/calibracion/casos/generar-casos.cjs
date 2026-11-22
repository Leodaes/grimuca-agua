// Genera las fotos difíciles de esta carpeta con Playwright (ya instalado en la raíz).
// Uso, desde la raíz del repo: node docs/calibracion/casos/generar-casos.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '../../..');
const SALIDA = __dirname;
fs.mkdirSync(SALIDA, { recursive: true });

// Tabla configurada (tiraW8), colores como en tira-ejemplo.jpg.
const W8 = [
  ['Alcalinidad (mg/L)', [0, 40, 80, 120, 180, 240], ['#f2e68a', '#d9e07a', '#a9d07a', '#7fbf8a', '#4f9e8e', '#2f7a8a']],
  ['Dureza (mg/L)', [0, 25, 50, 120, 250, 425], ['#3b6fb5', '#5a5fa8', '#74559e', '#8b4c92', '#a24680', '#b83f6e']],
  ['Cobre (mg/L)', [0, 0.2, 0.5, 1, 2, 5], ['#f5eecf', '#e6dfc0', '#ccccb0', '#b0b8b0', '#91a2b4', '#6d86ab']],
  ['Nitrato (mg/L)', [0, 10, 25, 50, 100, 250], ['#fbf0ee', '#f7d6de', '#f0bed2', '#e89cbf', '#d870aa', '#c4438f']],
  ['Cloro libre (mg/L)', [0, 0.5, 1, 3, 5, 10], ['#fafaf2', '#e8dff0', '#d4c4e6', '#b89ade', '#9b74cc', '#7c4cb8']],
  ['Plomo (ppb)', [0, 5, 15, 30, 50], ['#f4e6cf', '#ecd2b4', '#dfb898', '#d09c80', '#bd7d68']],
  ['pH', [6.2, 6.8, 7.2, 7.6, 8.4, 8.8], ['#e9a23b', '#ecc24a', '#c9c94a', '#8fba4f', '#5a9e63', '#3f7d74']],
  ['Nitrito (mg/L)', [0, 1, 5, 10, 20, 40], ['#fafaf6', '#f8e2ea', '#f2c6d6', '#e8a2c0', '#d877a8', '#c4508e']],
];

// Tabla de "otra marca": mismos colores, otros valores impresos.
const OTRA = [
  ['Alcalinidad total (ppm)', [0, 80, 120, 240, 360, 500], W8[0][2]],
  ['Dureza total (ppm)', [0, 50, 100, 200, 400, 1000], W8[1][2]],
  ['Cobre (ppm)', [0, 1, 2, 3, 5, 10], W8[2][2]],
  ['Nitrato (ppm)', [0, 20, 40, 80, 160, 500], W8[3][2]],
  ['Cloro libre (ppm)', [0, 1, 2, 4, 8, 20], W8[4][2]],
  ['Plomo (ppb)', [0, 20, 50, 100, 200], W8[5][2]],
  ['pH', [6, 6.5, 7, 7.5, 8, 9], W8[6][2]],
  ['Nitrito (ppm)', [0, 2, 4, 8, 16, 80], W8[7][2]],
];

function html({ tabla = W8, titulo = 'TABLA DE COLORES · WATER TEST 8 EN 1', casillas, conTira = true, conTabla = true,
  filtro = '', giroTira = -2, izqTira = null, izqTabla = 140, topTira = 50, tapadas = [], reflejos = [], ruido = 0, oscuro = 0 }) {
  const pad = (i) => {
    const c = casillas[i];
    if (c === null) return `<div class="pad" style="background:#fff"></div>`;
    const [, , colores] = tabla[i];
    return `<div class="pad" style="background:${colores[c]}"></div>`;
  };
  const tira = conTira
    ? `<div class="tira" style="transform:rotate(${giroTira}deg)">
        <div class="mango"></div>${casillas.map((_, i) => pad(i)).join('')}
        ${tapadas.map((i) => `<div class="cinta" style="top:${70 + i * 62}px"></div>`).join('')}
        ${reflejos.map((i) => `<div class="reflejo" style="top:${52 + i * 62}px"></div>`).join('')}
      </div>`
    : '';
  const filas = tabla
    .map(([nombre, valores, colores]) => `<div class="fila"><div class="nom">${nombre}</div>${valores
      .map((v, j) => `<div class="celda"><div class="col" style="background:${colores[j]}"></div><div>${v}</div></div>`)
      .join('')}</div>`)
    .join('');
  const tablaHtml = conTabla ? `<div class="tabla"><h1>${titulo}</h1>${filas}</div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;width:1000px;height:760px;background:#000;font-family:Arial,sans-serif;overflow:hidden}
    #escena{position:absolute;inset:0;background:#cfc0aa;filter:${filtro}}
    .tira{position:absolute;left:${izqTira ?? (conTabla ? 40 : 420)}px;top:${topTira}px;width:62px;padding:8px 6px;background:#fff;box-shadow:2px 3px 6px rgba(0,0,0,.25)}
    .mango{height:62px;background:#eee;margin-bottom:6px}
    .pad{width:48px;height:48px;margin:0 auto 14px;border:1px solid rgba(0,0,0,.06)}
    .cinta{position:absolute;left:-8px;width:78px;height:62px;background:#d8c59a;opacity:.97;transform:rotate(-4deg);box-shadow:0 1px 3px rgba(0,0,0,.3)}
    .reflejo{position:absolute;left:-30px;width:130px;height:96px;background:radial-gradient(ellipse at center,rgba(255,255,255,1) 0%,rgba(255,255,255,.97) 38%,rgba(255,255,255,.6) 60%,rgba(255,255,255,0) 75%)}
    .tabla{position:absolute;left:${izqTabla}px;top:40px;width:510px;padding:14px 18px;background:#faf8f4;transform:rotate(-2deg);box-shadow:2px 3px 8px rgba(0,0,0,.25)}
    h1{font-size:17px;margin:4px 0 10px}
    .fila{display:flex;align-items:center;height:58px}
    .nom{width:140px;font-weight:bold;font-size:13px}
    .celda{width:58px;text-align:center;font-size:13px}
    .col{width:46px;height:32px;margin:0 auto 3px;border:1px solid rgba(0,0,0,.08)}
    #oscuro{position:absolute;inset:0;background:rgba(0,0,0,${oscuro});pointer-events:none}
    canvas{position:absolute;inset:0;pointer-events:none}
  </style></head><body><div id="escena">${tira}${tablaHtml}</div><div id="oscuro"></div>
  <canvas id="ruido" width="1000" height="760"></canvas>
  <script>
    const n=${ruido}; if(n>0){const c=document.getElementById('ruido').getContext('2d');const d=c.createImageData(1000,760);
    let s=7;const r=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648};
    for(let i=0;i<d.data.length;i+=4){const v=r()*255;d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;d.data[i+3]=r()*n}
    c.putImageData(d,0,0);}
  </script></body></html>`;
}

// Índices de nivel por casilla (orden W8). Ver LEEME.md.
const CASOS = {
  'a-poca-luz': { casillas: [3, 3, 0, 1, 2, 0, 3, 0], filtro: 'brightness(0.38) contrast(0.85) saturate(0.75) sepia(0.25)', ruido: 55 },
  'b-girada-desenfocada': { casillas: [2, 4, 0, 3, 1, 0, 2, 0], giroTira: 30, izqTira: 150, topTira: 70, izqTabla: 420, filtro: 'blur(1.6px)' },
  'c-tres-tapadas': { casillas: [2, 4, 0, 3, 1, 0, 2, 0], tapadas: [1, 3, 5] },
  'd-sin-tira': { casillas: [2, 4, 0, 3, 1, 0, 2, 0], conTira: false },
  'f-tira-sin-tabla': { casillas: [2, 4, 0, 3, 1, 0, 2, 0], conTabla: false },
  'g-reflejo': { casillas: [2, 4, 0, 3, 1, 0, 2, 3], reflejos: [3, 7] },
  'h-otra-marca': { casillas: [2, 3, 0, 2, 1, 0, 1, 0], tabla: OTRA, titulo: 'AQUATEST PRO · COLOR CHART 8-WAY' },
};

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1000, height: 760 } });
  for (const [nombre, caso] of Object.entries(CASOS)) {
    await pagina.setContent(html(caso));
    await pagina.screenshot({ path: path.join(SALIDA, `${nombre}.jpg`), type: 'jpeg', quality: 85 });
    console.log('ok', nombre);
  }
  fs.copyFileSync(path.join(RAIZ, 'app/public/marca/og-01.jpg'), path.join(SALIDA, 'e-irrelevante.jpg'));
  await navegador.close();
})();
