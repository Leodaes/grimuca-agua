// External QA of the demo flow, written against docs/diseno/especificacion.md
// (routes in §1, CTA labels per screen). Text selectors on purpose: QA is independent of the markup.
const { test, expect } = require('@playwright/test');

// Fixed name for everything this suite creates, so the cleanup can find it.
const NOMBRE_PRUEBA = 'Prueba Calidad externa';

// Sunday 22 nov, Caracas time (UTC-4), from 00:00 on.
function despuesDeMedianoche(now = new Date()) {
  return now.getTime() >= Date.parse('2026-11-22T00:00:00-04:00');
}

const DISCLAIMER ='Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar.';

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
    const hint = ((await input.getAttribute('name')) || (await input.getAttribute('aria-label'))
      || (await input.evaluate(e => e.labels?.[0]?.innerText || '')) || '').toLowerCase();
    // Phone split into operator select + 7-digit number since the 9:12 a.m. onboarding change.
    await input.fill(type === 'date' ? '2026-08-01' : type === 'number' ? '3'
      : /n[uú]mero/.test(hint) ? '5550199'
      : /whats|tel/.test(hint) || type === 'tel' ? '04141234567'
      : /direc/.test(hint) ? 'Calle Prueba 123, Naguanagua' : NOMBRE_PRUEBA);
  }
  // Twice: some questions only appear after an earlier answer (e.g. "last cartridge change" after "has a filter").
  for (let pass = 0; pass < 2; pass++) await chooseOptions(page);
  // Selects last: some only appear after a choice above (e.g. filter stages). Native selects may be visually styled, so no :visible.
  for (const sel of await page.locator('select').all()) {
    const opts = await sel.locator('option').evaluateAll(os => os.filter(o => o.value && !o.disabled).map(o => o.value));
    if (opts.length && !(await sel.inputValue())) await sel.selectOption(opts[0], { force: true });
  }
  for (const cb of await page.getByRole('checkbox').all()) {
    if (await cb.isChecked()) continue;
    // Normal click first; on phones the fixed bottom bar can cover it, so fall back to the element's own click
    // (a forced coordinate click would land on the bar's "Medir" link).
    await cb.check({ timeout: 3_000 }).catch(() => cb.evaluate(el => el.click()));
  }
}

async function chooseOptions(page) {
  // Toggle chips only (buttons with aria-pressed); other buttons in a group may be tutorials or links.
  for (const group of await page.locator('[role=group]:visible, [role=radiogroup]:visible, fieldset:visible').all()) {
    const chips = group.locator('button[aria-pressed]');
    if (await chips.count() && !(await group.locator('[aria-pressed=true]').count())) await chips.first().click();
  }
  const radioGroups = new Set(await page.locator('input[type=radio]').evaluateAll(rs => rs.map(r => r.name).filter(Boolean)));
  for (const name of radioGroups) {
    if (await page.locator(`input[type=radio][name="${name}"]:checked`).count()) continue;
    // Hidden native radio styled as a card: click its label, like a person would.
    const id = await page.locator(`input[type=radio][name="${name}"]`).first().getAttribute('id');
    const label = page.locator(`label[for="${id}"]`);
    if (id && await label.count()) await label.first().click();
    else await page.locator(`input[type=radio][name="${name}"]`).first().evaluate(el => el.click());
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

// Read-only sweep of public pages (routes from app/src/features/*/rutas.tsx). Creates nothing.
const PAGINAS_PUBLICAS = ['/tiendas', '/catalogo', '/tutoriales', '/experto', '/modulos', '/privacidad', '/terminos'];
for (const ruta of PAGINAS_PUBLICAS) {
  test(`página pública ${ruta} carga y cumple las reglas fijas`, async ({ page }, testInfo) => {
    const res = await page.goto(ruta);
    expect(res.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 }).first(), `${ruta} no muestra título`).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Página no encontrada/i), `${ruta} da «Página no encontrada»`).toHaveCount(0);
    await checkPageRules(page);
    await checkTapTargets(page, testInfo);
  });
}

// Each role (store, technician, network) has its own PIN.
for (const ruta of ['/comercio', '/tecnico', '/red']) {
  test(`panel ${ruta} carga y pide PIN`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 }).first(), `${ruta} no muestra título`).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('textbox', { name: /PIN/i }), `${ruta} no pide PIN`).toBeVisible();
    await checkPageRules(page);
  });
}

test('recorrido completo del cliente y, con PIN, el pedido en vivo en Despacho', async ({ browser, baseURL }, testInfo) => {
  // Each run creates real orders in the production database. Skipped with SOLO_LECTURA=1,
  // and always from midnight on (agreed with the orchestrator so the pre-demo cleanup holds).
  test.skip(process.env.SOLO_LECTURA === '1', 'SOLO_LECTURA=1: se salta el recorrido para no crear pedidos de prueba.');
  // RECORRIDO=1: Leonardo asked for a daytime run (Sun 22 nov morning); the order is named NOMBRE_PRUEBA for cleanup.
  test.skip(despuesDeMedianoche() && process.env.RECORRIDO !== '1', 'Después de la medianoche no se crean pedidos en el sitio publicado.');
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

  // Households with a filter get an extra step (photo of the filter, or by hand).
  await page.waitForURL(/\/(mi-filtro|envio)/, { timeout: 15_000 }).catch(() => {});
  if (/\/mi-filtro/.test(page.url())) {
    await clickText(page, /a mano/i, 'mi filtro: cargar a mano');
    await fillForm(page); await checkTapTargets(page, testInfo);
    await clickText(page, /^Continuar|Guardar|Seguir|Listo/i, 'mi filtro');
    // Confirmation screen "Listo, guardamos tu filtro" with its own Continuar.
    await expect(page.getByRole('heading', { level: 1, name: /guardamos tu filtro/i }), 'No confirma que guardó el filtro').toBeVisible({ timeout: 15_000 });
    await checkTapTargets(page, testInfo);
    await clickText(page, /^Continuar$/i, 'filtro guardado');
  }
  await expect(page, 'El perfil no lleva a /envio').toHaveURL(/\/envio/);
  await expect(page.getByRole('textbox', { name: /Direcci/i }), 'La pantalla de envío no muestra el campo de dirección').toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
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
  // The order page loads with placeholders first; wait for the real content before judging it.
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('main [class*="esqueleto"], main [aria-busy="true"]'), 'El pedido se queda cargando').toHaveCount(0, { timeout: 15_000 }).catch(() => {});
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
  await expect(panel.getByText(NOMBRE_PRUEBA).first(), 'El pedido nuevo no se ve en Despacho').toBeVisible({ timeout: 10_000 });
  await snap(panel, 'panel-despacho');
  await opCtx.close();
});
