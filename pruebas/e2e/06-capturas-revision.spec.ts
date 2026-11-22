import { expect, test, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import {
  AVISO_FIJO,
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  SIN_PIN,
  SOLO_LECTURA,
  crearHogar,
  hogarInventado,
  marca,
  obtenerTira,
  planDeValores,
} from './apoyo/datos';
import {
  abrirPestana,
  accion,
  elegirEnLista,
  elegirNivel,
  elegirOpcion,
  entrarAlPanel,
  esperarPantalla,
  marcarCasilla,
  sembrarDispositivo,
  textosDePantalla,
} from './apoyo/pagina';
import { CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';

/**
 * Compuertas 2 y 3 · capturas y revisión en vivo de cada pantalla.
 *
 * Recorre los DOS caminos del cliente en el teléfono con los nombres visibles actuales de los
 * botones (21 nov) y, en cada pantalla, revisa: palabra prohibida, desborde horizontal a 375 px,
 * botones principales de 44 px o más, imágenes rotas, botones tapados por la barra inferior y
 * errores de consola. Guarda una captura por pantalla en docs/calidad/capturas/ y un registro
 * de hallazgos en docs/calidad/capturas/revision-<proyecto>.json.
 *
 * Nada de esto falla la prueba por un hallazgo cosmético: se anota con expect.soft y en el JSON.
 */

const CARPETA = path.resolve(__dirname, '../../docs/calidad/capturas');
fs.mkdirSync(CARPETA, { recursive: true });

interface Hallazgo {
  pantalla: string;
  tipo: string;
  detalle: string;
}
const hallazgos: Hallazgo[] = [];
const erroresConsola: Array<{ pantalla: string; texto: string }> = [];
const tiempos: Record<string, number> = {};

function guardarRegistro(testInfo: TestInfo, nombre: string) {
  // Un archivo por prueba: si el proceso se reinicia tras una falla, no se pierde lo anterior.
  const corto = testInfo.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40).toLowerCase();
  const archivo = path.join(CARPETA, `revision-${nombre}-${corto}.json`);
  fs.writeFileSync(archivo, JSON.stringify({ prueba: testInfo.title, estado: testInfo.status, hallazgos, erroresConsola, tiempos }, null, 2), 'utf8');
  hallazgos.length = 0;
  erroresConsola.length = 0;
  for (const clave of Object.keys(tiempos)) delete tiempos[clave];
  testInfo.annotations.push({ type: 'registro', description: archivo });
}

function escucharConsola(page: Page, pantalla: () => string) {
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') erroresConsola.push({ pantalla: pantalla(), texto: mensaje.text().slice(0, 300) });
  });
  page.on('pageerror', (error) => erroresConsola.push({ pantalla: pantalla(), texto: `pageerror: ${error.message.slice(0, 300)}` }));
}

/** Revisa la pantalla actual y guarda su captura de página completa. */
async function revisar(page: Page, archivo: string, opciones: { movil?: boolean } = { movil: true }) {
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

  if (opciones.movil && datos.desborde > 1) {
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

  await page.screenshot({ path: path.join(CARPETA, archivo), fullPage: true, scale: 'css' });
}

async function llenarPerfil(page: Page, nombre: string) {
  const perfil = hogarInventado();
  await page.getByRole('textbox', { name: /c[oó]mo te llamas/i }).fill(nombre);
  await elegirOpcion(page, /zona/i, /naguanagua/i);
  await page.getByLabel(/^\s*tanque/i).first().check();
  await page.getByLabel(/cu[aá]ntos viven/i).first().fill('4');
  await page.getByRole('group', { name: /tienen filtro/i }).getByLabel(/^s[ií]$/i).check();
  await elegirEnLista(page.getByRole('combobox', { name: /etapas/i }).first(), /^\s*3\b/);
  await page.getByLabel(/cu[aá]ndo cambiaron/i).first().fill(perfil.fecha_ultimo_cambio);
  await page.getByRole('group', { name: /turbia o amarilla/i }).getByLabel(/^s[ií]$/i).check();
  await page.getByRole('textbox', { name: /whatsapp/i }).fill(perfil.whatsapp);
  await marcarCasilla(page.getByRole('checkbox', { name: /acepto/i }).first());
}

test.describe('Revisión en vivo · teléfono', () => {
  test.skip(({ isMobile }) => !isMobile, 'Las capturas del cliente son en el teléfono.');
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);
  test.describe.configure({ retries: 0 });

  let actual = '';
  test.beforeEach(({ page }) => escucharConsola(page, () => actual));
  test.afterEach(({}, info) => { if (info.project.name === 'movil') guardarRegistro(info, 'movil'); });

  test('camino "Ya tengo mi sobre": bienvenida → perfil → medir → manual → resultado → lista → pedido en Mañongo', async ({ page }) => {
    test.setTimeout(180_000);
    const m = marca();
    actual = '01-bienvenida';
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Descubre la calidad/i })).toBeVisible();
    await revisar(page, '01-bienvenida.png');

    await accion(page, /^\s*ya tengo mi sobre\s*$/i).click();
    await expect(page).toHaveURL(/\/perfil\?ya=1/);
    actual = '02-perfil';
    await revisar(page, '02-perfil-vacio.png');
    await llenarPerfil(page, `Prueba Calidad ${m} con sobre`);
    await revisar(page, '03-perfil-lleno.png');
    await page.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
    await expect(page, '"Continuar" con ?ya=1 debe llevar a /medir').toHaveURL(/\/medir\/?$/);

    actual = '04-medir';
    await expect(page.getByRole('button', { name: /^\s*tomar la foto\s*$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /elegir una foto del tel[eé]fono/i })).toBeVisible();
    await revisar(page, '04-medir.png');
    await page.getByRole('link', { name: /colores a mano/i }).first().click();
    await expect(page).toHaveURL(/\/medir\/manual/);

    actual = '05-manual';
    const tira = await obtenerTira(page.request);
    const plan = planDeValores(tira);
    await expect(page.getByRole('button', { name: /ver mi resultado/i })).toBeVisible();
    for (const p of tira) {
      const v = plan.valores[p.clave];
      if (v !== undefined) await elegirNivel(page, p.nombre, v);
    }
    await revisar(page, '05-carga-manual.png');
    await page.getByRole('button', { name: /ver mi resultado/i }).click();
    await expect(page).toHaveURL(/\/resultado\/[\w-]+/);

    actual = '06-resultado';
    await expect(page.getByText(AVISO_FIJO), 'Aviso fijo literal en el resultado').toBeVisible();
    const cuerpo = await page.locator('main').innerText();
    expect(cuerpo, 'El resultado debe mostrar al menos un "Rojo"').toMatch(/\bRojo\b/);
    expect.soft(cuerpo, 'El semáforo usa la palabra "Verde"').toMatch(/\bVerde\b/);
    await expect(page.getByRole('link', { name: /cotizar por whatsapp/i }).first()).toBeVisible();
    await revisar(page, '06-resultado-con-rojo.png');
    await page.getByRole('button', { name: /^\s*agregar a mi lista\s*$/i }).first().click();
    await expect(page.getByRole('button', { name: /^\s*agregado\s*$/i }).first(), 'El botón pasa a "Agregado"').toBeVisible();
    await revisar(page, '07-resultado-agregado.png');

    actual = '08-lista';
    await page.getByRole('navigation', { name: /navegaci[oó]n principal/i }).getByRole('link', { name: /mi lista/i }).click();
    await expect(page).toHaveURL(/\/lista/);
    await page.getByRole('button', { name: /retiro en tienda/i }).click();
    await elegirEnLista(page.getByRole('combobox', { name: /tienda/i }).first(), /ma[ñn]ongo/i);
    await revisar(page, '08-lista-retiro-manongo.png');
    await page.getByRole('button', { name: /^\s*hacer pedido\s*$/i }).click();
    await expect(page).toHaveURL(/\/pedido\/\d+/);

    actual = '09-pedido';
    await expect(page.getByText(/tu pedido ya est[aá] en la tienda/i).first()).toBeVisible();
    await expect(page.getByText(/ma[ñn]ongo/i).first()).toBeVisible();
    await expect(accion(page, /volver a mis resultados/i)).toBeVisible();
    await expect(accion(page, /ir al inicio/i)).toBeVisible();
    await revisar(page, '09-pedido-confirmado.png');

    // Pantallas secundarias del cliente con este hogar.
    for (const [ruta, archivo] of [
      ['/resultados', '10-historial.png'],
      ['/tiendas', '11-tiendas.png'],
      ['/privacidad', '12-privacidad.png'],
      ['/terminos', '13-terminos.png'],
      ['/', '14-bienvenida-con-hogar.png'],
    ] as const) {
      actual = archivo;
      await page.goto(ruta);
      await revisar(page, archivo);
    }
  });

  test('camino "Pedir el sobre a domicilio": perfil → envío → pago simulado → "Ya me llegó el sobre" → medir', async ({ page }) => {
    test.setTimeout(120_000);
    const m = marca();
    await page.goto('/');
    await accion(page, /pedir el sobre a domicilio/i).click();
    await expect(page).toHaveURL(/\/perfil\/?$/);
    actual = '15-perfil-domicilio';
    await llenarPerfil(page, `Prueba Calidad ${m} domicilio`);
    await page.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
    await expect(page).toHaveURL(/\/envio/);

    actual = '15-envio';
    await page.getByRole('textbox', { name: /direcci[oó]n/i }).first().fill(`Calle Inventada ${m}, casa 00`);
    await expect.soft(page.getByText(/ma[ñn]ongo/i).first()).toBeVisible();
    await revisar(page, '15-envio.png');
    await page.getByRole('button', { name: /continuar al pago/i }).click();
    await expect(page).toHaveURL(/\/pago/);

    actual = '16-pago';
    await expect(page.getByText(/simulaci[oó]n/i).first()).toBeVisible();
    await revisar(page, '16-pago.png');
    await page.getByRole('button', { name: /simular pago de \$9/i }).click();
    const yaLlego = accion(page, /ya me lleg[oó] el sobre/i);
    await expect(yaLlego).toBeVisible();
    actual = '17-pago-hecho';
    await revisar(page, '17-pago-hecho.png');
    await yaLlego.click();
    await expect(page).toHaveURL(/\/medir\/?$/);
    await expect(page.getByRole('button', { name: /^\s*tomar la foto\s*$/i })).toBeVisible();
  });

  test('lectura por foto con una imagen que no es una tira: "no legible" y ofrece la carga manual', async ({ page }) => {
    test.setTimeout(120_000);
    const hogar = await crearHogar(page.request, {}, `${marca()} foto`);
    await sembrarDispositivo(page.context(), hogar.id);
    await page.goto('/medir');
    actual = '18-foto';
    // Imagen cualquiera: una captura de la propia pantalla de medir.
    const captura = await page.screenshot({ type: 'jpeg', quality: 80 });
    await page.locator('input[type="file"]:not([capture])').setInputFiles({ name: 'captura.jpg', mimeType: 'image/jpeg', buffer: captura });
    await expect(page.getByRole('button', { name: /^\s*leer mi tira\s*$/i })).toBeVisible();
    await revisar(page, '18-foto-vista-previa.png');
    const desde = Date.now();
    await page.getByRole('button', { name: /^\s*leer mi tira\s*$/i }).click();
    const final = page
      .getByRole('heading', { name: /no pudimos leer bien la foto/i })
      .or(page.getByRole('heading', { name: /foto de tu tira/i }).and(page.locator(':scope')))
      .or(page.getByText(/no se pudo leer la foto|no hay conexi[oó]n/i));
    await expect(page.getByText(/leyendo tu tira/i).first().or(final.first())).toBeVisible();
    await expect(page.getByText(/leyendo tu tira/i)).toHaveCount(0, { timeout: 90_000 });
    tiempos.fotoNoLegibleSegundos = (Date.now() - desde) / 1000;
    test.info().annotations.push({ type: 'tiempo de lectura', description: `${tiempos.fotoNoLegibleSegundos.toFixed(1)} s` });
    actual = '19-foto-no-legible';
    await revisar(page, '19-foto-no-legible.png');
    expect(page.url(), 'Una foto que no es una tira no debe dar un resultado').not.toMatch(/\/resultado\//);
    await expect(page.getByRole('heading', { name: /no pudimos leer bien la foto/i }), 'Debe decir que no pudo leer la foto').toBeVisible();
    await expect(accion(page, /cargar los colores a mano/i), 'Debe ofrecer la carga manual').toBeVisible();
  });

  test('prueba de bacterias: sus dos resultados', async ({ browser }) => {
    test.setTimeout(120_000);
    for (const [boton, archivo] of [
      [/^\s*cambi[oó] de color\s*$/i, '21-bacterias-cambio.png'],
      [/^\s*sigue igual\s*$/i, '22-bacterias-sin-cambio.png'],
    ] as const) {
      const contexto = await browser.newContext({ ...CONTEXTO_MOVIL, ...REGION, baseURL: test.info().project.use.baseURL });
      const page = await contexto.newPage();
      escucharConsola(page, () => archivo);
      try {
        const hogar = await crearHogar(page.request, {}, `${marca()} bacterias`);
        await sembrarDispositivo(contexto, hogar.id);
        await page.goto('/bacterias');
        actual = archivo;
        await page.getByRole('button', { name: /ya llen[eé] el frasco/i }).click();
        await expect(page.getByRole('button', { name: boton })).toBeVisible();
        if (archivo.startsWith('21')) await revisar(page, '20-bacterias-pendiente.png');
        await page.getByRole('button', { name: boton }).click();
        await expect(page.getByText(archivo.startsWith('21') ? /el frasco cambi[oó] de color/i : /el frasco no cambi[oó] de color/i).first()).toBeVisible();
        await revisar(page, archivo);
      } finally {
        await contexto.close();
      }
    }
  });
});

test.describe('Revisión en vivo · panel del operador', () => {
  test.skip(({ isMobile }) => isMobile, 'El panel se captura en la laptop.');
  test.skip(() => !PIN_OPERADOR, SIN_PIN);
  test.describe.configure({ retries: 0 });
  test.afterEach(({}, info) => { if (info.project.name === 'escritorio') guardarRegistro(info, 'escritorio'); });

  test('las 4 pestañas en 1366×768', async ({ page }) => {
    let actual = '30-operador-entrada';
    escucharConsola(page, () => actual);
    await page.goto('/operador');
    await revisar(page, '30-operador-entrada.png', { movil: false });
    await entrarAlPanel(page);
    for (const [n, nombre] of [
      ['31', 'Despacho'],
      ['32', 'Resumen'],
      ['33', 'Inventario'],
      ['34', 'Zonas'],
    ] as const) {
      actual = `${n}-operador-${nombre.toLowerCase()}`;
      await abrirPestana(page, nombre);
      await page.waitForTimeout(1500);
      await revisar(page, `${actual}.png`, { movil: false });
    }
  });
});
