// External QA of the demo flow. Selectors are text-based on purpose:
// the app is being built tonight and its markup is unknown.
// ponytail: text selectors; swap for data-testid once the app exposes them.
const { test, expect } = require('@playwright/test');

const DISCLAIMER = 'Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';
const PANEL_PATH = process.env.PANEL_PATH || '/operador';

async function checkPageRules(page) {
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text, 'La app no debe decir "potable"').not.toContain('potable');
}

async function checkTapTargets(page, testInfo) {
  if (testInfo.project.name !== 'telefono') return;
  const small = await page.$$eval('button, a, [role="button"], input[type="submit"]', els =>
    els.filter(e => e.offsetParent !== null)
       .map(e => ({ t: (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 40), h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width }))
       .filter(b => b.h < 44 || b.w < 44));
  expect(small, `Botones de menos de 44 px: ${JSON.stringify(small)}`).toEqual([]);
}

// Click the first visible control whose text matches.
async function clickText(page, re, step) {
  const el = page.getByRole('button', { name: re }).or(page.getByRole('link', { name: re })).first();
  await expect(el, `Paso "${step}": no se encontró un botón o enlace que diga ${re}`).toBeVisible({ timeout: 15_000 });
  await el.click();
}

test('la página carga y cumple las reglas fijas', async ({ page }, testInfo) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await checkPageRules(page);
  await checkTapTargets(page, testInfo);
});

test('recorrido completo y el pedido aparece en vivo en el panel', async ({ browser, baseURL }, testInfo) => {
  // Two contexts at once: operator panel stays open, customer orders.
  const opCtx = await browser.newContext();
  const panel = await opCtx.newPage();
  await panel.goto(baseURL + PANEL_PATH);
  await expect(panel.locator('body'), `El panel del operador (${PANEL_PATH}) no carga`).not.toContainText('404');

  const page = await browser.newPage();
  await page.goto('/');

  await clickText(page, /empezar|comenzar|iniciar|medir/i, 'bienvenida');
  await checkPageRules(page);

  // Household profile, address, payment: fill whatever text inputs show up, then continue.
  for (const step of ['perfil del hogar', 'dirección', 'pago simulado']) {
    for (const input of await page.locator('input:visible:not([type=file]):not([type=checkbox]):not([type=radio]), textarea:visible').all()) {
      if (!(await input.inputValue())) await input.fill(step === 'dirección' ? 'Av. Bolívar Norte, Valencia' : '3');
    }
    await checkTapTargets(page, testInfo);
    await clickText(page, /continuar|siguiente|pagar|confirmar/i, step);
  }

  // Photo or manual entry: prefer manual so the run is deterministic.
  const manual = page.getByRole('button', { name: /manual/i }).or(page.getByRole('link', { name: /manual/i })).first();
  await expect(manual, 'Paso "foto o carga manual": no hay opción de carga manual').toBeVisible({ timeout: 15_000 });
  await manual.click();
  await clickText(page, /ver resultado|continuar|analizar|listo/i, 'carga manual');

  // Traffic light result.
  await expect(page.locator('body'), 'Falta el aviso fijo en el resultado').toContainText(DISCLAIMER, { timeout: 20_000 });
  await checkPageRules(page);
  await page.screenshot({ path: testInfo.outputPath('resultado.png'), fullPage: true });

  // Suggested product and order.
  await expect(page.locator('body'), 'No se ve un cartucho sugerido').toContainText(/cartucho/i);
  const before = await panel.locator('body').innerText();
  await clickText(page, /pedir|comprar|ordenar|hacer pedido/i, 'pedido');
  await checkPageRules(page);

  // The key check: panel updates WITHOUT reload.
  await expect.poll(async () => (await panel.locator('body').innerText()) !== before,
    { message: 'El pedido no apareció en el panel sin recargar', timeout: 30_000 }).toBe(true);
  await panel.screenshot({ path: testInfo.outputPath('panel.png'), fullPage: true });

  await opCtx.close();
});
