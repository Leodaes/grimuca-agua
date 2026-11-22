import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { PIN_OPERADOR, SIN_PIN, SOLO_LECTURA, prepararCliente, type ClienteDePrueba } from './apoyo/datos';
import { abrirPestana, entrarAlPanel, esperarPantalla, sembrarDispositivo } from './apoyo/pagina';

/**
 * Accesibilidad básica, sin librerías extra. Por cada pantalla:
 *   1. <html> declara el idioma (lang="es…").
 *   2. Hay un solo h1 visible.
 *   3. Todo input, select y textarea tiene etiqueta (label, aria-label o aria-labelledby;
 *      el placeholder no cuenta).
 *   4. Todo botón y enlace tiene nombre accesible.
 *   5. Los botones principales miden 44 px o más de alto y de ancho (solo en el proyecto `movil`).
 *   6. Al tabular, el elemento enfocado muestra un indicador de foco (contorno o sombra).
 *
 * Límites conocidos: el nombre accesible se calcula con una aproximación (no es el algoritmo
 * completo), y el foco de un control oculto que se dibuja con su etiqueta puede dar falso
 * positivo. Lo que falle aquí se revisa a mano antes de reportarlo como falla.
 *
 * Selectores que se asumen (componentes de app/src/components/grimuca):
 *   | Qué                  | Selector                                                        |
 *   |----------------------|-----------------------------------------------------------------|
 *   | Botones principales  | .g-boton y button[type=submit]; si no hay, todos los <button>    |
 *   | Otros objetivos      | .g-chip, enlaces de <nav>, el resto de <button> (solo se anotan) |
 */

const RUTAS_SIN_PERFIL = ['/', '/perfil', '/tiendas', '/privacidad', '/terminos', '/operador'];

function rutasConHogar(cliente: ClienteDePrueba): string[] {
  return [
    '/envio',
    '/pago',
    '/medir',
    '/medir/manual',
    `/resultado/${cliente.medicion.id}`,
    '/lista',
    `/pedido/${cliente.pedido.id}`,
    '/bacterias',
  ];
}

interface InformeDePantalla {
  idioma: string;
  titulosH1: string[];
  sinEtiqueta: string[];
  sinNombre: string[];
  principalesPequenos: string[];
  otrosPequenos: string[];
}

/** Revisa la pantalla actual dentro del navegador y devuelve lo que encontró. */
async function revisarPantalla(page: Page): Promise<InformeDePantalla> {
  return page.evaluate(() => {
    const MINIMO = 43.5; // 44 px con medio píxel de tolerancia por redondeo

    const texto = (elemento: Element | null) => (elemento && elemento.textContent ? elemento.textContent : '').replace(/\s+/g, ' ').trim();

    const expuesto = (elemento: Element) => {
      if (elemento.closest('[aria-hidden="true"], [hidden], [inert]')) return false;
      const estilo = window.getComputedStyle(elemento);
      return estilo.visibility !== 'hidden' && elemento.getClientRects().length > 0;
    };

    const porReferencias = (elemento: Element, atributo: string) =>
      (elemento.getAttribute(atributo) || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => texto(document.getElementById(id)))
        .join(' ')
        .trim();

    const nombreAccesible = (elemento: Element) => {
      const referido = porReferencias(elemento, 'aria-labelledby');
      if (referido) return referido;
      const directo = (elemento.getAttribute('aria-label') || '').trim();
      if (directo) return directo;
      if (elemento instanceof HTMLInputElement || elemento instanceof HTMLSelectElement || elemento instanceof HTMLTextAreaElement) {
        const etiquetas = Array.from(elemento.labels || []).map((etiqueta) => texto(etiqueta)).join(' ').trim();
        if (etiquetas) return etiquetas;
        if (elemento instanceof HTMLInputElement && ['submit', 'button', 'reset'].indexOf(elemento.type) >= 0 && elemento.value) {
          return elemento.value.trim();
        }
        return (elemento.getAttribute('title') || '').trim();
      }
      const propio = texto(elemento);
      if (propio) return propio;
      const imagen = elemento.querySelector('img[alt]');
      if (imagen && (imagen.getAttribute('alt') || '').trim()) return (imagen.getAttribute('alt') || '').trim();
      const tituloSvg = elemento.querySelector('svg title');
      if (tituloSvg && texto(tituloSvg)) return texto(tituloSvg);
      const interno = elemento.querySelector('[aria-label]');
      if (interno && (interno.getAttribute('aria-label') || '').trim()) return (interno.getAttribute('aria-label') || '').trim();
      return (elemento.getAttribute('title') || '').trim();
    };

    const describir = (elemento: Element) => {
      const clases = typeof elemento.className === 'string' && elemento.className ? `.${elemento.className.trim().split(/\s+/).join('.')}` : '';
      const identificador = elemento.id ? `#${elemento.id}` : '';
      const tipo = elemento.getAttribute('type') ? `[type=${elemento.getAttribute('type')}]` : '';
      const nombre = texto(elemento).slice(0, 40);
      return `<${elemento.tagName.toLowerCase()}${identificador}${clases}${tipo}>${nombre ? ` "${nombre}"` : ''}`;
    };

    const medidas = (elemento: Element) => {
      const caja = elemento.getBoundingClientRect();
      return `${describir(elemento)} ${Math.round(caja.width)}×${Math.round(caja.height)} px`;
    };
    const pequeno = (elemento: Element) => {
      const caja = elemento.getBoundingClientRect();
      return caja.width < MINIMO || caja.height < MINIMO;
    };

    const todos = (selector: string) => Array.from(document.querySelectorAll(selector)).filter(expuesto);

    const campos = todos('input:not([type="hidden"]), select, textarea');
    const accionables = todos('button, [role="button"], a[href], input[type="submit"], input[type="button"]');

    let principales = todos('.g-boton, button[type="submit"]');
    if (principales.length === 0) principales = todos('button');
    const otros = todos('.g-chip, nav a, button, [role="button"]').filter((elemento) => principales.indexOf(elemento) < 0);

    return {
      idioma: document.documentElement.getAttribute('lang') || '',
      titulosH1: todos('h1').map((h1) => texto(h1)),
      sinEtiqueta: campos.filter((campo) => !nombreAccesible(campo)).map(describir),
      sinNombre: accionables.filter((elemento) => !nombreAccesible(elemento)).map(describir),
      principalesPequenos: principales.filter(pequeno).map(medidas),
      otrosPequenos: otros.filter(pequeno).map(medidas),
    };
  });
}

/** Tabula por la pantalla y devuelve los elementos enfocados que no muestran indicador de foco. */
async function revisarFoco(page: Page, pasos = 8): Promise<{ recorridos: number; sinIndicador: string[] }> {
  const sinIndicador: string[] = [];
  let recorridos = 0;
  // Se parte sin nada enfocado, como al abrir la pantalla.
  await page.evaluate(() => {
    const activo = document.activeElement;
    if (activo instanceof HTMLElement) activo.blur();
  });
  for (let paso = 0; paso < pasos; paso += 1) {
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => {
      const elemento = document.activeElement;
      if (!elemento || elemento === document.body || elemento === document.documentElement) return null;
      const estilo = window.getComputedStyle(elemento);
      const contorno = estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0;
      const sombra = estilo.boxShadow !== 'none' && estilo.boxShadow !== '';
      const clases = typeof elemento.className === 'string' && elemento.className ? `.${elemento.className.trim().split(/\s+/).join('.')}` : '';
      const nombre = (elemento.textContent || elemento.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      return { visible: contorno || sombra, descripcion: `<${elemento.tagName.toLowerCase()}${clases}>${nombre ? ` "${nombre}"` : ''}` };
    });
    if (!foco) continue;
    recorridos += 1;
    if (!foco.visible && sinIndicador.indexOf(foco.descripcion) < 0) sinIndicador.push(foco.descripcion);
  }
  return { recorridos, sinIndicador };
}

/** Aplica todas las comprobaciones a la pantalla abierta. Usa aserciones suaves para listar todo de una vez. */
async function comprobarAccesibilidad(page: Page, pantalla: string, esMovil: boolean): Promise<void> {
  const informe = await revisarPantalla(page);

  expect.soft(informe.idioma, `${pantalla}: <html> debe declarar lang="es"`).toMatch(/^es\b/i);
  expect.soft(informe.titulosH1, `${pantalla}: debe haber un solo h1 (hay ${informe.titulosH1.length})`).toHaveLength(1);
  expect.soft(informe.sinEtiqueta, `${pantalla}: campos sin etiqueta`).toEqual([]);
  expect.soft(informe.sinNombre, `${pantalla}: botones o enlaces sin nombre accesible`).toEqual([]);

  if (esMovil) {
    expect.soft(informe.principalesPequenos, `${pantalla}: botones principales de menos de 44 px`).toEqual([]);
    if (informe.otrosPequenos.length > 0) {
      test.info().annotations.push({
        type: 'objetivos táctiles menores de 44 px (no principales)',
        description: `${pantalla}: ${informe.otrosPequenos.join(' · ')}`,
      });
    }
  }

  const foco = await revisarFoco(page);
  expect.soft(foco.recorridos, `${pantalla}: al tabular debe poder enfocarse algún control`).toBeGreaterThan(0);
  expect.soft(foco.sinIndicador, `${pantalla}: elementos sin indicador de foco visible al tabular`).toEqual([]);
}

test.describe('Accesibilidad básica · pantallas sin perfil', () => {
  for (const ruta of RUTAS_SIN_PERFIL) {
    test(`accesibilidad: ${ruta}`, async ({ page, isMobile }) => {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status() ?? 0, `${ruta} debe cargar la aplicación`).toBeLessThan(400);
      await esperarPantalla(page);
      await comprobarAccesibilidad(page, ruta, Boolean(isMobile));
    });
  }
});

test.describe('Accesibilidad básica · pantallas con hogar, medición y pedido', () => {
  test.skip(() => SOLO_LECTURA, 'SOLO_LECTURA=1: no se crea el hogar de prueba.');

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

  test('accesibilidad del recorrido del cliente', async ({ page, context, isMobile }) => {
    test.setTimeout(120_000);
    expect(cliente, `No se pudo preparar el cliente de prueba por la API: ${errorAlPreparar}`).toBeTruthy();
    const sugerido = cliente!.medicion.sugeridos?.[0];
    await sembrarDispositivo(
      context,
      cliente!.hogar.id,
      sugerido ? [{ codigo: sugerido.codigo, nombre: sugerido.nombre, cantidad: 1 }] : undefined,
    );

    for (const ruta of rutasConHogar(cliente!)) {
      await test.step(`accesibilidad: ${ruta}`, async () => {
        await page.goto(ruta);
        await esperarPantalla(page);
        await comprobarAccesibilidad(page, ruta, Boolean(isMobile));
      });
    }
  });
});

test.describe('Accesibilidad básica · panel del operador', () => {
  test.skip(() => !PIN_OPERADOR, SIN_PIN);

  test('accesibilidad de las pestañas del operador', async ({ page }) => {
    await entrarAlPanel(page);
    for (const pestana of ['Resumen', 'Despacho', 'Inventario', 'Zonas'] as const) {
      await test.step(`accesibilidad: /operador/${pestana.toLowerCase()}`, async () => {
        await abrirPestana(page, pestana);
        await esperarPantalla(page);
        // El panel se usa en laptop: no se miden objetivos táctiles.
        await comprobarAccesibilidad(page, `/operador/${pestana.toLowerCase()}`, false);
      });
    }
  });
});
