import { expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { esperarPantalla, textosDePantalla } from './pagina';

/**
 * Revisión en vivo de una pantalla (compartida por 06 y 07): palabra prohibida, desborde horizontal,
 * botones de menos de 44 px, imágenes rotas o sin cargar, botones tapados por la barra inferior.
 * Guarda una captura de página completa en docs/calidad/capturas/ y anota los hallazgos.
 */
export const CARPETA = path.resolve(__dirname, '../../../docs/calidad/capturas');
fs.mkdirSync(CARPETA, { recursive: true });

export interface Hallazgo {
  pantalla: string;
  tipo: string;
  detalle: string;
}
export const hallazgos: Hallazgo[] = [];
export const erroresConsola: Array<{ pantalla: string; texto: string }> = [];
export const tiempos: Record<string, number> = {};
export const notas: Record<string, unknown> = {};

export function guardarRegistro(testInfo: TestInfo, nombre: string) {
  // Un archivo por prueba: si el proceso se reinicia tras una falla, no se pierde lo anterior.
  const corto = testInfo.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40).toLowerCase();
  const archivo = path.join(CARPETA, `revision-${nombre}-${corto}.json`);
  fs.writeFileSync(
    archivo,
    JSON.stringify({ prueba: testInfo.title, estado: testInfo.status, hallazgos, erroresConsola, tiempos, notas }, null, 2),
    'utf8',
  );
  hallazgos.length = 0;
  erroresConsola.length = 0;
  for (const clave of Object.keys(tiempos)) delete tiempos[clave];
  for (const clave of Object.keys(notas)) delete notas[clave];
  testInfo.annotations.push({ type: 'registro', description: archivo });
}

export function escucharConsola(page: Page, pantalla: () => string) {
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') erroresConsola.push({ pantalla: pantalla(), texto: mensaje.text().slice(0, 300) });
  });
  page.on('pageerror', (error) => erroresConsola.push({ pantalla: pantalla(), texto: `pageerror: ${error.message.slice(0, 300)}` }));
}

/** Revisa la pantalla actual y guarda su captura de página completa. */
export async function revisar(page: Page, archivo: string, opciones: { movil?: boolean; desborde?: boolean } = { movil: true }) {
  await esperarPantalla(page);
  await page.waitForTimeout(400);
  const pantalla = archivo.replace(/\.png$/, '');

  // 1. Palabra prohibida.
  const texto = await textosDePantalla(page);
  if (/potable/i.test(texto)) hallazgos.push({ pantalla, tipo: 'potable', detalle: 'La pantalla dice "potable"' });
  expect.soft(texto, `${pantalla} dice "potable"`).not.toMatch(/potable/i);

  // Las imágenes diferidas (loading=lazy) se cargan bajando la página.
  await page.evaluate(async () => {
    // La captura de página completa no dispara la carga diferida: se fuerza antes de revisar.
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'));
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);

  const datos = await page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const desborde = document.documentElement.scrollWidth - ancho;
    const anchos: string[] = [];
    if (desborde > 1) {
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > ancho + 1 && r.width > 0 && anchos.length < 5) {
          anchos.push(`${el.tagName.toLowerCase()}.${(el as HTMLElement).className || ''} (derecha ${Math.round(r.right)} px)`);
        }
      });
    }
    const rotas = Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width >= 0)
      .map((img) => img.currentSrc || img.src);
    const sinCargar = Array.from(document.images)
      .filter((img) => !img.complete)
      .map((img) => img.currentSrc || img.src);
    const barra = document.querySelector('.g-barra-inferior');
    const altoBarra = barra ? barra.getBoundingClientRect().height : 0;
    const botones = Array.from(document.querySelectorAll('main button, main a.g-boton, main .g-boton, main [role="button"]'))
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { texto: ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim().slice(0, 60), alto: Math.round(r.height), ancho: Math.round(r.width) };
      });
    return { desborde, anchos, rotas, sinCargar, altoBarra, botones };
  });

  if ((opciones.movil || opciones.desborde) && datos.desborde > 1) {
    hallazgos.push({ pantalla, tipo: 'desborde', detalle: `${datos.desborde} px de más. ${datos.anchos.join('; ')}` });
  }
  for (const src of datos.rotas) hallazgos.push({ pantalla, tipo: 'imagen rota', detalle: src });
  for (const src of datos.sinCargar) hallazgos.push({ pantalla, tipo: 'imagen sin cargar', detalle: src });
  if (opciones.movil) {
    for (const b of datos.botones) {
      if (b.alto < 44) hallazgos.push({ pantalla, tipo: 'botón < 44 px', detalle: `"${b.texto}" mide ${b.alto} px de alto` });
    }
  }

  // 2. Botones tapados por la barra inferior: se lleva cada botón al fondo de la vista y se mira
  //    qué elemento queda encima de su centro.
  if (opciones.movil && datos.altoBarra > 0) {
    const tapados = await page.evaluate(() => {
      const res: string[] = [];
      const botones = Array.from(document.querySelectorAll('main button, main a.g-boton, main .g-boton')).filter(
        (el) => (el as HTMLElement).offsetParent !== null,
      );
      // Al llegar al final de la página, el último botón no debe quedar debajo de la barra.
      window.scrollTo(0, document.body.scrollHeight);
      for (const el of botones) {
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
        const cx = r.left + r.width / 2;
        const cy = Math.min(r.top + r.height / 2, window.innerHeight - 1);
        const arriba = document.elementFromPoint(cx, cy);
        if (arriba && !el.contains(arriba) && arriba.closest('.g-barra-inferior')) {
          res.push(((el as HTMLElement).innerText || '').trim().slice(0, 60));
        }
      }
      window.scrollTo(0, 0);
      return res;
    });
    for (const t of tapados) hallazgos.push({ pantalla, tipo: 'tapado por la barra', detalle: `"${t}" queda debajo de la barra inferior al final de la página` });
  }

  await page.screenshot({ path: path.join(CARPETA, archivo), fullPage: true, scale: "css" });
  return datos;
}
