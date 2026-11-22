// External QA of the demo flow, written against docs/diseno/especificacion.md
// (routes in §1, CTA labels per screen). Text selectors on purpose: QA is independent of the markup.
const { test, expect } = require('@playwright/test');

const DISCLAIMER = 'Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';

async function checkPageRules(page) {
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect.soft(text, `«potable» aparece en ${page.url()}`).not.toContain('potable');
}

async function checkTapTargets(page, testInfo) {
  if (testInfo.project.name !== 'telefono') return;
  // Inline links inside running text and the skip link are exempt (WCAG 2.5.8 inline exception).
  const small = await page.$$eval('button, a[href], [role="button"], input[type="submit"], select', els =>
    els.filter(e => e.offsetParent !== null && !(e.tagName === 'A' && e.closest('p')) && e.getAttribute('href') !== '#contenido')
       .map(e => ({ t: (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 40), h: Math.round(e.getBoundingClientRect().height) }))
       .filter(b => b.h < 44));
  expect.soft(small, `Controles de menos de 44 px de alto en ${page.url()}`).toEqual([]);
}

// Click the visible button or link whose accessible name matches.
async function clickText(page, re, step) {
  const el = page.getByRole('button', { name: re }).or(page.getByRole('link', { name: re })).first();
  await expect(el, `Paso «${step}»: no se encontró ${re}`).toBeVisible({ timeout: 15_000 });
  await el.click();
}

// Fill every visible field with fake, obviously-invented data (HANDOFF §6: no real personal data).
async function fillForm(page) {
  for (const input of await page.locator('input:visible[type=text], input:visible:not([type]), input:visible[type=tel], input:visible[type=number], input:visible[type=date], textarea:visible').all()) {
    if (await input.inputValue()) continue;
    const type = await input.getAttribute('type');
    const hint = ((await input.getAttribute('name')) || (await input.getAttribute('aria-label')) || '').toLowerCase();
    await input.fill(type === 'date' ? '2026-08-01' : type === 'number' ? '3'
      : /whats|tel/.test(hint) || type === 'tel' ? '04141234567'
      : /direc/.test(hint) ? 'Calle Prueba 123, Naguanagua' : 'Prueba Calidad');
  }
  // Choice chips: pick the first option of every group that has nothing chosen yet.
  for (const group of await page.locator('[role=group]:visible, [role=radiogroup]:visible, fieldset:visible').all()) {
    const chosen = await group.locator('[aria-pressed=true], [aria-checked=true], input:checked').count();
    const first = group.locator('button, [role=radio]').first();
    if (!chosen && await first.count()) await first.click();
  }
  const radioGroups = new Set(await page.locator('input[type=radio]').evaluateAll(rs => rs.map(r => r.name).filter(Boolean)));
  for (const name of radioGroups) {
    if (await page.locator(`input[type=radio][name="${name}"]:checked`).count()) continue;
    // Hidden native radio styled as a card: click its label, like a person would.
    const id = await page.locator(`input[type=radio][name="${name}"]`).first().getAttribute('id');
    const label = page.locator(`label[for="${id}"]`);
    if (id && await label.count()) await label.first().click();
    else await page.locator(`input[type=radio][name="${name}"]`).first().click({ force: true }).catch(() => {});
  }
  // Selects last: some only appear after a choice above (e.g. filter stages). Native selects may be visually styled, so no :visible.
  for (const sel of await page.locator('select').all()) {
    const opts = await sel.locator('option').evaluateAll(os => os.filter(o => o.value && !o.disabled).map(o => o.value));
    if (opts.length && !(await sel.inputValue())) await sel.selectOption(opts[0], { force: true });
  }
  for (const cb of await page.getByRole('checkbox').all()) {
    if (await cb.isChecked()) continue;
    await cb.click({ force: true });
  }
}

test('la bienvenida carga y cumple las reglas fijas', async ({ page }, testInfo) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: /Descubre la calidad del agua de tu casa/i }), 'La bienvenida no muestra su título').toBeVisible();
  await checkPageRules(page);
  await checkTapTargets(page, testInfo);
});

// Same PIN variable as the team's own suite (pruebas/e2e/apoyo/datos.ts). Never committed.
const PIN = (process.env.PIN_OPERADOR || process.env.PANEL_PIN || '').trim();

test('el panel del operador carga y pide PIN', async ({ page }) => {
  await page.goto('/operador');
  await expect(page.getByRole('heading', { level: 1, name: /Panel de/i }), 'El panel del operador (/operador) no carga').toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('textbox', { name: /PIN/i }), 'El panel no pide PIN').toBeVisible();
});

test('recorrido completo del cliente y, con PIN, el pedido en vivo en Despacho', async ({ browser, baseURL }, testInfo) => {
  // Each run creates real orders ("Prueba Calidad") in the production database, so it is opt-out.
  test.skip(process.env.SOLO_LECTURA === '1', 'SOLO_LECTURA=1: se salta el recorrido para no crear pedidos de prueba.');
  test.setTimeout(180_000);
  const snap = async (p, name) => p.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });

  // Operator first, left open (two contexts at once). Only possible with the PIN.
  let panel, opCtx, before;
  if (PIN) {
    opCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    panel = await opCtx.newPage();
    await panel.goto(baseURL + '/operador');
    await panel.getByRole('textbox', { name: /PIN/i }).fill(PIN);
    await clickText(panel, /^Entrar$/i, 'PIN del operador');
    await panel.goto(baseURL + '/operador/despacho');
    await expect(panel.getByText(/Despacho/i).first(), 'La pestaña Despacho no carga').toBeVisible({ timeout: 15_000 });
    before = await panel.locator('body').innerText();
  }

  // Customer.
  const { viewport, isMobile, hasTouch } = testInfo.project.use;
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch });
  const page = await ctx.newPage();
  await page.goto(baseURL + '/');
  await checkPageRules(page); await checkTapTargets(page, testInfo);
  await clickText(page, /Pedir el sobre|^Empezar$|Seguir donde qued/i, 'bienvenida');

  await expect(page, 'Empezar no lleva a /perfil').toHaveURL(/\/perfil/);
  await fillForm(page); await checkTapTargets(page, testInfo);
  await clickText(page, /Guardar y seguir|^Continuar/i, 'perfil del hogar');

  await expect(page, 'El perfil no lleva a /envio').toHaveURL(/\/envio/);
  await fillForm(page); await checkTapTargets(page, testInfo);
  await clickText(page, /Seguir al pago|^Continuar/i, 'dirección');

  await expect(page, 'La dirección no lleva a /pago').toHaveURL(/\/pago/);
  await expect(page.getByText(/simulaci/i).first(), 'El pago no dice que es una simulación').toBeVisible();
  await clickText(page, /Pagar \$9|Simular pago/i, 'pago simulado');
  await clickText(page, /Ya me lleg(ó|o) el sobre/i, 'ya me llegó el sobre');

  await expect(page, 'No llega a /medir').toHaveURL(/\/medir/);
  await checkTapTargets(page, testInfo);
  await clickText(page, /colores a mano/i, 'ir a carga manual');
  await expect(page, 'No llega a /medir/manual').toHaveURL(/\/medir\/manual/);
  const groups = page.getByRole('group');
  await expect(groups.first(), 'La carga manual no muestra las casillas de la tira').toBeVisible({ timeout: 15_000 });
  // Highest value of each square, so at least one parameter goes red and products get suggested.
  for (const g of await groups.all()) {
    const values = g.getByRole('button').filter({ hasNotText: /no la tiene|no se ve/i });
    const n = await values.count();
    if (n) await values.nth(n - 1).click();
  }
  await clickText(page, /Ver mi resultado|^Continuar/i, 'carga manual');

  await expect(page, 'No llega a /resultado').toHaveURL(/\/resultado\//, { timeout: 20_000 });
  await expect(page.getByText(DISCLAIMER), 'Falta el aviso fijo en el resultado').toBeVisible({ timeout: 20_000 });
  await checkPageRules(page); await checkTapTargets(page, testInfo);
  await snap(page, 'resultado');

  await clickText(page, /Agregar a mi lista/i, 'producto sugerido');
  await page.goto(baseURL + '/lista');
  await fillForm(page);
  await clickText(page, /Confirmar pedido|Confirmar|Hacer pedido/i, 'confirmar pedido');
  await expect(page, 'Confirmar no lleva a /pedido').toHaveURL(/\/pedido\//, { timeout: 20_000 });
  await checkPageRules(page);
  await snap(page, 'pedido');

  await ctx.close();
  if (!PIN) {
    testInfo.annotations.push({ type: 'sin_pin', description: 'Sin PIN_OPERADOR: no se pudo verificar el pedido en vivo en Despacho.' });
    return;
  }
  // The key moment: the order shows up in Despacho WITHOUT reloading the panel.
  await expect.poll(async () => (await panel.locator('body').innerText()) !== before,
    { message: 'El pedido no apareció en Despacho sin recargar', timeout: 30_000 }).toBe(true);
  await expect(panel.getByText(/Prueba Calidad/).first(), 'El pedido nuevo no se ve en Despacho').toBeVisible({ timeout: 10_000 });
  await snap(panel, 'panel-despacho');
  await opCtx.close();
});
