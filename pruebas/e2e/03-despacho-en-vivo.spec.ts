import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import {
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  SIN_PIN,
  SOLO_LECTURA,
  cabeceraOperador,
  crearHogar,
  crearPedido,
  entrarOperador,
  marca,
  medirManual,
  obtenerTira,
  planDeValores,
  primerCartucho,
} from './apoyo/datos';
import { CONTEXTO_ESCRITORIO, CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';
import { abrirPestana, accion, elegirEnLista, entrarAlPanel, sembrarDispositivo } from './apoyo/pagina';

/**
 * Compuerta 3 · el momento clave de la demo.
 *
 * Contexto A (laptop, 1366×768): entra a /operador con el PIN y deja abierta la pestaña Despacho.
 * Contexto B (teléfono, 375×812): crea un pedido.
 * Se verifica que el pedido aparece en A SIN RECARGAR en menos de 10 s y que al pulsar
 * "Despachado" sale de los pendientes.
 *
 * Dos variantes:
 *   1. El pedido se crea directo por la API (aísla el tiempo real del resto de la interfaz).
 *   2. El pedido se confirma en el teléfono, en Mi lista, con retiro en Mañongo (como en la demo).
 *
 * Corre una sola vez, en el proyecto `escritorio`. Necesita PIN_OPERADOR.
 *
 * TEXTOS Y ROLES QUE SE ASUMEN:
 * | Dónde               | Elemento                 | Rol              | Texto aceptado                      |
 * |---------------------|--------------------------|------------------|-------------------------------------|
 * | /operador           | Campo del PIN            | textbox (label)  | PIN                                 |
 * | /operador           | Botón                    | button           | Entrar                              |
 * | panel               | Pestaña                  | link/tab/button  | Despacho                            |
 * | /operador/despacho  | Botón por pedido pendiente | button         | Despachado                          |
 * | /operador/despacho  | Marca de fila nueva      | texto            | Nuevo                               |
 * | /operador/despacho  | Indicador de conexión    | texto            | En vivo                             |
 * | /lista (teléfono)   | Modalidad, tienda, botón | ver 02-cliente-manual.spec.ts                          |
 *
 * Cómo se reconoce "un pedido pendiente": cada fila pendiente tiene exactamente un botón
 * "Despachado" (los despachados no lo llevan). Se cuentan esos botones antes y después.
 */
const T = {
  despachado: /^\s*despachado\s*$|marcar.*despachad|^\s*despachar\s*$/i,
  nuevo: /\bnuevo\b/i,
  enVivo: /en vivo/i,
  miLista: /mi lista/i,
  retiro: /retir/i,
  tienda: /tienda/i,
  manongo: /ma[ñn]ongo/i,
  confirmarPedido: /confirmar pedido|^\s*pedir\s*$|hacer (el )?pedido/i,
};

const LIMITE_APARICION_MS = 10_000;

function botonesDespachado(page: Page): Locator {
  return page.getByRole('button', { name: T.despachado });
}

/** Abre el contexto A: laptop con el panel en la pestaña Despacho. */
async function abrirDespacho(browser: Browser, baseURL: string | undefined): Promise<{ contexto: BrowserContext; pagina: Page }> {
  const contexto = await browser.newContext({ ...CONTEXTO_ESCRITORIO, ...REGION, baseURL });
  const pagina = await contexto.newPage();
  await entrarAlPanel(pagina);
  await abrirPestana(pagina, 'Despacho');
  await expect(pagina.getByText(T.manongo).first(), 'Despacho debe mostrar la tienda Mañongo').toBeVisible();
  await expect.soft(pagina.getByText(T.enVivo).first(), 'El panel debe indicar que está "En vivo"').toBeVisible();
  return { contexto, pagina };
}

/** Cuenta los pedidos pendientes cuando la lista deja de moverse (dos lecturas iguales seguidas). */
async function contarPendientes(page: Page): Promise<number> {
  let anterior = -1;
  for (let intento = 0; intento < 15; intento += 1) {
    const actual = await botonesDespachado(page).count();
    if (actual === anterior) return actual;
    anterior = actual;
    await page.waitForTimeout(700);
  }
  return anterior;
}

/** Deja una marca en la ventana: si la página se recarga, la marca desaparece. */
async function marcarVentana(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).e2eSinRecargar = true;
  });
}
async function sigueSinRecargar(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).e2eSinRecargar === true);
}

/**
 * Texto de cada fila pendiente. La fila es el <li> o <tr> que contiene el botón; si no hay,
 * se sube desde el botón mientras el contenedor tenga un solo botón "Despachado".
 */
async function filasPendientes(page: Page): Promise<Array<{ indice: number; texto: string }>> {
  return botonesDespachado(page).evaluateAll((botones) => {
    const esDespachar = (elemento: Element) => /despachad|despachar/i.test(elemento.textContent ?? '');
    return botones.map((boton, indice) => {
      const marcada = boton.closest('li, tr, [role="listitem"], [role="row"]');
      if (marcada) return { indice, texto: (marcada as HTMLElement).innerText ?? '' };
      let fila: Element = boton;
      while (
        fila.parentElement &&
        fila.parentElement !== document.body &&
        Array.from(fila.parentElement.querySelectorAll('button')).filter(esDespachar).length === 1
      ) {
        fila = fila.parentElement;
      }
      return { indice, texto: (fila as HTMLElement).innerText ?? '' };
    });
  });
}

/** Espera el pedido nuevo en A, sin recargar, y devuelve cuántos segundos tardó. */
async function esperarPedidoNuevo(paginaA: Page, antes: number, desde: number): Promise<number> {
  await expect(
    botonesDespachado(paginaA),
    `El pedido nuevo debe aparecer en Despacho sin recargar en menos de ${LIMITE_APARICION_MS / 1000} s`,
  ).toHaveCount(antes + 1, { timeout: LIMITE_APARICION_MS });
  const segundos = (Date.now() - desde) / 1000;
  expect(await sigueSinRecargar(paginaA), 'La pantalla de Despacho se recargó: el pedido debe entrar en vivo').toBe(true);
  return segundos;
}

/** Pulsa "Despachado" en la fila del pedido y verifica que sale de pendientes. */
async function despacharYVerificar(
  paginaA: Page,
  pistas: string[],
  antes: number,
  comprobarEstado: () => Promise<string>,
  producto = '',
): Promise<void> {
  const filas = await filasPendientes(paginaA);
  const fila =
    pistas.map((pista) => filas.find((f) => f.texto.includes(pista))).find(Boolean) ??
    (producto ? filas.find((f) => T.nuevo.test(f.texto) && f.texto.includes(producto)) : undefined) ??
    filas.find((f) => T.nuevo.test(f.texto));
  expect(
    fila,
    'No se pudo reconocer la fila del pedido nuevo (por dirección, nombre, producto o la marca "Nuevo")',
  ).toBeTruthy();
  expect.soft(fila!.texto, 'La fila recién llegada debe llevar la marca "Nuevo"').toMatch(T.nuevo);

  await botonesDespachado(paginaA).nth(fila!.indice).click();
  await expect(botonesDespachado(paginaA), 'Al despachar, el pedido debe salir de los pendientes').toHaveCount(antes, {
    timeout: 10_000,
  });
  await expect
    .poll(comprobarEstado, { message: 'El pedido creado por la prueba debe quedar "despachado" en la API', timeout: 10_000 })
    .toBe('despachado');
  expect(await sigueSinRecargar(paginaA), 'Despacho no debe recargarse al despachar').toBe(true);
}

test.describe('Compuerta 3 · despacho en vivo', () => {
  test.skip(() => !PIN_OPERADOR, SIN_PIN);
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);

  test('un pedido creado por la API aparece en Despacho sin recargar y sale al despacharlo', async ({ browser, request, baseURL }, testInfo) => {
    const { contexto, pagina: paginaA } = await abrirDespacho(browser, baseURL);
    try {
      const antes = await contarPendientes(paginaA);
      await marcarVentana(paginaA);

      // "Teléfono": hogar y pedido por la API. Envío con una dirección única para reconocer la fila.
      const m = marca();
      const direccion = `Calle Despacho ${m}, casa 00`;
      const hogar = await crearHogar(request, { direccion }, m);
      const cartucho = await primerCartucho(request);
      const desde = Date.now();
      const pedido = await crearPedido(request, cartucho
        ? { hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: cartucho.codigo, cantidad: 1, modalidad: 'envio', direccion, tienda_id: 'manongo' }
        : { hogar_id: hogar.id, tipo: 'sobre', modalidad: 'envio', direccion, tienda_id: 'manongo' });

      const segundos = await esperarPedidoNuevo(paginaA, antes, desde);
      testInfo.annotations.push({ type: 'tiempo de aparición', description: `${segundos.toFixed(1)} s (pedido ${pedido.id})` });
      await testInfo.attach('despacho-con-pedido-nuevo', { body: await paginaA.screenshot(), contentType: 'image/png' });

      // La API del operador también lo lista como pendiente, con nombre y zona.
      const token = await entrarOperador(request);
      const pendientes = await (await request.get('/api/operador/pedidos?estado=pendiente', { headers: cabeceraOperador(token) })).json();
      const enLista = pendientes.find((p: any) => p.id === pedido.id);
      expect(enLista, 'GET /api/operador/pedidos?estado=pendiente debe incluir el pedido').toBeTruthy();
      expect.soft(enLista.hogar_nombre).toBe(hogar.nombre);
      expect.soft(enLista.zona).toBe(hogar.zona);

      await despacharYVerificar(paginaA, [m, hogar.nombre], antes, async () =>
        (await (await request.get(`/api/pedidos/${pedido.id}`)).json()).estado,
      );
      await testInfo.attach('despacho-despues-de-despachar', { body: await paginaA.screenshot(), contentType: 'image/png' });
    } finally {
      await contexto.close();
    }
  });

  test('un pedido confirmado en el teléfono (Mi lista, retiro en Mañongo) aparece en Despacho sin recargar', async ({ browser, request, baseURL }, testInfo) => {
    test.setTimeout(120_000);

    // Preparación por la API: hogar con una medición y un producto sugerido listo en "Mi lista".
    const m = marca();
    const hogar = await crearHogar(request, {}, m);
    const plan = planDeValores(await obtenerTira(request));
    const medicion = await medirManual(request, hogar.id, plan.valores);
    const producto = medicion.sugeridos?.[0] ?? (await primerCartucho(request));
    expect(producto, 'Hace falta al menos un cartucho en el catálogo para armar el pedido').toBeTruthy();

    const { contexto: contextoA, pagina: paginaA } = await abrirDespacho(browser, baseURL);
    const contextoB = await browser.newContext({ ...CONTEXTO_MOVIL, ...REGION, baseURL });
    try {
      await sembrarDispositivo(contextoB, hogar.id, [{ codigo: producto.codigo, nombre: producto.nombre, cantidad: 1 }]);
      const paginaB = await contextoB.newPage();

      // Teléfono: Mi lista → retiro en Mañongo, sin confirmar todavía.
      await paginaB.goto('/lista');
      await expect(paginaB.getByRole('heading', { name: T.miLista }).first()).toBeVisible();
      await expect(paginaB.getByText(producto.nombre).first(), 'El producto debe verse en Mi lista').toBeVisible();
      await paginaB.getByRole('button', { name: T.retiro }).or(paginaB.getByRole('radio', { name: T.retiro })).first().click();
      const tienda = paginaB.getByRole('combobox', { name: T.tienda }).first();
      if (await tienda.isVisible().catch(() => false)) {
        await elegirEnLista(tienda, T.manongo);
      } else {
        const chip = paginaB.getByRole('button', { name: T.manongo }).or(paginaB.getByRole('radio', { name: T.manongo })).first();
        if (await chip.isVisible().catch(() => false)) await chip.click();
      }

      // Laptop: se cuenta lo pendiente justo antes de confirmar.
      const antes = await contarPendientes(paginaA);
      await marcarVentana(paginaA);

      const desde = Date.now();
      await accion(paginaB, T.confirmarPedido).click();
      await expect(paginaB, 'El teléfono debe mostrar el pedido confirmado').toHaveURL(/\/pedido\/\d+/);
      const pedidoId = new URL(paginaB.url()).pathname.split('/').pop();

      const segundos = await esperarPedidoNuevo(paginaA, antes, desde);
      testInfo.annotations.push({ type: 'tiempo de aparición', description: `${segundos.toFixed(1)} s (pedido ${pedidoId})` });
      await testInfo.attach('telefono-pedido-confirmado', { body: await paginaB.screenshot({ path: 'docs/calidad/capturas/41-telefono-pedido-para-despacho.png' }), contentType: 'image/png' });
      await testInfo.attach('despacho-con-pedido-del-telefono', { body: await paginaA.screenshot({ path: 'docs/calidad/capturas/40-despacho-pedido-del-telefono-en-vivo.png' }), contentType: 'image/png' });

      const pedido = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
      expect(pedido.tienda_id, 'El pedido del teléfono debe salir de Mañongo').toBe('manongo');
      expect(pedido.modalidad).toBe('retiro');

      await despacharYVerificar(
        paginaA,
        [hogar.nombre, m],
        antes,
        async () => (await (await request.get(`/api/pedidos/${pedidoId}`)).json()).estado,
        producto.nombre,
      );
      await testInfo.attach('despacho-despues-de-despachar', { body: await paginaA.screenshot({ path: 'docs/calidad/capturas/42-despacho-despues-de-despachar.png' }), contentType: 'image/png' });
    } finally {
      await contextoB.close();
      await contextoA.close();
    }
  });
});
