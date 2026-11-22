import { expect, test } from '@playwright/test';
import {
  AVISO_FIJO,
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  SIN_PIN,
  SOLO_LECTURA,
  crearHogar,
  marca,
  obtenerTira,
  planDeValores,
} from './apoyo/datos';
import {
  abrirPestana,
  accion,
  elegirEnLista,
  elegirNivel,
  entrarAlPanel,
  sembrarDispositivo,
} from './apoyo/pagina';
import { CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';
import { llenarPerfil } from './apoyo/perfil';
import { escucharConsola, guardarRegistro, revisar, tiempos } from './apoyo/revision';

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

// Pasada 2: la revisión y el registro viven en apoyo/revision.ts (los usa también 07).
// El perfil se llena con apoyo/perfil.ts (urbanización, mascotas, último cambio cerrado, WhatsApp +58).
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
    await llenarPerfil(page, { nombre: `Prueba Calidad ${m} con sobre`, urbanizacion: /^\s*otra\s*$/i, mascotas: true });
    await revisar(page, '03-perfil-lleno.png');
    await page.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
    // Con filtro: primero "Mi filtro" y después sigue a /medir.
    await expect(page, 'Con filtro y ?ya=1 debe ir a /mi-filtro?sigue=/medir').toHaveURL(/\/mi-filtro\?sigue=%2Fmedir/);
    actual = '03b-mi-filtro';
    await expect(page.getByRole('button', { name: /tomar una foto de mi filtro/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /elegir una foto del tel[eé]fono/i })).toBeVisible();
    await revisar(page, '03b-mi-filtro-inicio.png');
    await page.getByRole('link', { name: /c[aá]rgalo a mano/i }).first().click();
    await expect(page).toHaveURL(/\/mi-filtro\/manual\?sigue=%2Fmedir/);
    actual = '03c-mi-filtro-manual';
    await page.getByRole('group', { name: /c[oó]mo es tu filtro/i }).getByLabel(/^\s*tres vasos/i).check();
    await page.getByRole('group', { name: /c[oó]mo son los cartuchos/i }).getByLabel(/^\s*corto y delgado/i).check();
    await revisar(page, '03c-mi-filtro-manual.png');
    await page.getByRole('button', { name: /guardar mi filtro/i }).click();
    await expect(page.getByRole('heading', { name: /guardamos tu filtro/i })).toBeVisible({ timeout: 15_000 });
    actual = '03d-mi-filtro-guardado';
    await revisar(page, '03d-mi-filtro-guardado.png');
    await accion(page, /^\s*continuar\s*$/i).click();
    await expect(page, '"Continuar" tras guardar el filtro debe llevar a /medir').toHaveURL(/\/medir\/?$/);

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
    await llenarPerfil(page, { nombre: `Prueba Calidad ${m} domicilio`, filtro: false });
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
        // Pasada 2: antes de 48 h no deja reportar; solo con "Saltar la espera (demostración)".
        const saltar = page.getByRole('link', { name: /saltar la espera \(demostraci[oó]n\)/i });
        await expect(saltar, 'Antes de 48 h debe ofrecer "Saltar la espera (demostración)"').toBeVisible();
        await expect(page.getByRole('button', { name: boton }), 'Antes de 48 h no se puede reportar').toHaveCount(0);
        if (archivo.startsWith('21')) await revisar(page, '20-bacterias-pendiente.png');
        await saltar.click();
        await expect(page.getByRole('button', { name: boton })).toBeVisible();
        if (archivo.startsWith('21')) await revisar(page, '20b-bacterias-saltar-espera.png');
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

  // Pasada 2: el panel es /comercio (Grimuca, PIN_OPERADOR) y tiene 5 pestañas, con "Productos".
  test('las 5 pestañas del comercio en 1366×768', async ({ page }) => {
    let actual = '30-operador-entrada';
    escucharConsola(page, () => actual);
    await page.goto('/comercio');
    await expect(page.getByRole('heading', { level: 1, name: /panel del comercio/i })).toBeVisible();
    await revisar(page, '30-operador-entrada.png', { movil: false });
    await entrarAlPanel(page);
    await expect(page.getByTestId('ficha-comercio'), 'El nombre del comercio arriba').toContainText(/grimuca/i);
    for (const [n, nombre] of [
      ['31', 'Despacho'],
      ['32', 'Resumen'],
      ['33', 'Inventario'],
      ['35', 'Productos'],
      ['34', 'Zonas'],
    ] as const) {
      actual = `${n}-operador-${nombre.toLowerCase()}`;
      await abrirPestana(page, nombre);
      await page.waitForTimeout(1500);
      await revisar(page, `${actual}.png`, { movil: false });
    }
  });
});
