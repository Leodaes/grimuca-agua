import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  SIN_PIN,
  SOLO_LECTURA,
  prepararCliente,
  type ClienteDePrueba,
} from './apoyo/datos';
import { abrirPestana, entrarAlPanel, esperarPantalla, sembrarDispositivo, sinPalabraProhibida } from './apoyo/pagina';

/**
 * Compuerta 1 · salud del sitio.
 *
 * Qué certifica:
 *   1. /api/salud responde ok (y con la base conectada).
 *   2. La portada carga y muestra "Descubre la calidad del agua de tu casa".
 *   3. Ninguna pantalla muestra la palabra "potable": se recorren las rutas del contrato
 *      sin perfil, con un hogar ya guardado y, si hay PIN, las pestañas del operador.
 *
 * Textos y rutas que se asumen (ajustar aquí si cambian):
 *   | Qué                   | Valor                                                    |
 *   |-----------------------|----------------------------------------------------------|
 *   | Título de la portada  | h1 con /Descubre la calidad del agua de tu casa/         |
 *   | Rutas del cliente     | RUTAS_SIN_PERFIL y rutasConHogar() (contrato-api.md)     |
 *   | Pestañas del operador | Resumen, Despacho, Inventario, Zonas                     |
 */

const TITULO_PORTADA = /Descubre la calidad del agua de tu casa/i;

/** Rutas públicas visitadas sin perfil guardado (varias mandan a /perfil: también se revisa lo que muestran). */
const RUTAS_SIN_PERFIL = [
  '/',
  '/perfil',
  '/perfil?ya=1',
  '/envio',
  '/pago',
  '/tiendas',
  '/privacidad',
  '/terminos',
  '/medir',
  '/medir/manual',
  '/resultado/ultimo',
  '/resultados',
  '/bacterias',
  '/lista',
  '/operador',
  '/una-ruta-que-no-existe',
];

/** Rutas que solo muestran su contenido real cuando ya hay un hogar, una medición y un pedido. */
function rutasConHogar(cliente: ClienteDePrueba): string[] {
  return [
    '/',
    '/envio',
    '/pago',
    '/medir',
    '/medir/manual',
    `/resultado/${cliente.medicion.id}`,
    '/resultado/ultimo',
    '/resultados',
    '/lista',
    `/pedido/${cliente.pedido.id}`,
    '/bacterias',
    '/tiendas',
  ];
}

test.describe('Salud del sitio', () => {
  test('/api/salud responde ok', async ({ request }) => {
    const respuesta = await request.get('/api/salud');
    expect(respuesta.status(), 'GET /api/salud debe responder 200').toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.ok, 'El cuerpo debe traer ok: true').toBe(true);
    expect.soft(cuerpo.bd, 'La base de datos debe estar conectada (bd: true)').toBe(true);
    expect.soft(typeof cuerpo.version, 'Debe informar la versión').toBe('string');
  });

  test('la portada carga y muestra el título de bienvenida', async ({ page }) => {
    const respuesta = await page.goto('/');
    expect(respuesta?.status(), 'La portada debe responder 200').toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: TITULO_PORTADA })).toBeVisible();
    await expect.soft(page, 'El título de la pestaña debe nombrar la app').toHaveTitle(/Grimuca/i);
    await expect.soft(page.getByRole('link', { name: /ya tengo mi sobre|pedir el sobre a domicilio|medir mi agua/i }).or(
      page.getByRole('button', { name: /ya tengo mi sobre|pedir el sobre a domicilio|medir mi agua/i }),
    ).first(), 'La portada debe tener el botón para arrancar').toBeVisible();
  });
});

test.describe('La app nunca dice "potable" · sin perfil', () => {
  for (const ruta of RUTAS_SIN_PERFIL) {
    test(`sin perfil: ${ruta}`, async ({ page }) => {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status() ?? 0, `${ruta} debe cargar la aplicación (no un error del servidor)`).toBeLessThan(400);
      await esperarPantalla(page);
      const texto = (await page.locator('body').innerText()).trim();
      expect(texto.length, `${ruta} quedó en blanco`).toBeGreaterThan(0);
      await sinPalabraProhibida(page, ruta);
    });
  }
});

test.describe('La app nunca dice "potable" · con hogar, medición y pedido', () => {
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);

  let api: APIRequestContext;
  let cliente: ClienteDePrueba | undefined;
  let errorAlPreparar = '';

  test.beforeAll(async ({ playwright }, testInfo) => {
    api = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      cliente = await prepararCliente(api);
    } catch (error) {
      errorAlPreparar = error instanceof Error ? error.message.split('\n')[0] : String(error);
    }
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test('recorre las pantallas del cliente con datos reales', async ({ page, context }) => {
    expect(cliente, `No se pudo preparar el cliente de prueba por la API: ${errorAlPreparar}`).toBeTruthy();
    const lista = cliente!.medicion.sugeridos?.[0]
      ? [{ codigo: cliente!.medicion.sugeridos[0].codigo, nombre: cliente!.medicion.sugeridos[0].nombre, cantidad: 1 }]
      : undefined;
    await sembrarDispositivo(context, cliente!.hogar.id, lista);

    for (const ruta of rutasConHogar(cliente!)) {
      await test.step(`con hogar: ${ruta}`, async () => {
        const respuesta = await page.goto(ruta);
        expect.soft(respuesta?.status() ?? 0, `${ruta} debe cargar la aplicación`).toBeLessThan(400);
        await esperarPantalla(page);
        await sinPalabraProhibida(page, ruta, false);
      });
    }
  });

  test('la API tampoco devuelve la palabra en frases ni hallazgos', async () => {
    expect(cliente, `No se pudo preparar el cliente de prueba por la API: ${errorAlPreparar}`).toBeTruthy();
    expect(JSON.stringify(cliente!.medicion), 'La medición trae la palabra prohibida').not.toMatch(/potable/i);
    const cartuchos = await api.get('/api/cartuchos');
    expect(await cartuchos.text(), 'El catálogo trae la palabra prohibida').not.toMatch(/potable/i);
  });
});

test.describe('La app nunca dice "potable" · panel del operador', () => {
  test.skip(() => !PIN_OPERADOR, SIN_PIN);

  test('recorre las pestañas del operador', async ({ page }) => {
    await page.goto('/operador');
    await esperarPantalla(page);
    await sinPalabraProhibida(page, '/operador', false);

    await entrarAlPanel(page);
    for (const pestana of ['Resumen', 'Despacho', 'Inventario', 'Zonas'] as const) {
      await test.step(`operador: ${pestana}`, async () => {
        await abrirPestana(page, pestana);
        await esperarPantalla(page);
        await sinPalabraProhibida(page, `/operador/${pestana.toLowerCase()}`, false);
      });
    }
  });
});
