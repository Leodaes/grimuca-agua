import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { PALABRA_PROHIBIDA, PIN_OPERADOR } from './datos';

/**
 * Ayudas de interfaz. Todo se busca por rol y texto accesible, con expresiones regulares
 * tolerantes: los textos de Diseño y de Marketing todavía pueden cambiar.
 */

/** Escapa un texto para usarlo dentro de una expresión regular. */
export function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expresión que encuentra una palabra o frase completa, sin importar mayúsculas. */
export function palabra(texto: string): RegExp {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(texto)}([^\\p{L}\\p{N}]|$)`, 'iu');
}

/** Un botón de la app puede dibujarse como <button> o como enlace: se aceptan los dos. */
export function accion(raiz: Page | Locator, nombre: RegExp): Locator {
  return raiz.getByRole('button', { name: nombre }).or(raiz.getByRole('link', { name: nombre })).first();
}

/** Espera a que la pantalla termine de pedir datos (sin fallar si queda una conexión abierta). */
export async function esperarPantalla(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
}

/** Texto visible de la pantalla más los textos accesibles (aria-label, alt, title, placeholder, título). */
export async function textosDePantalla(page: Page): Promise<string> {
  const visible = await page.locator('body').innerText();
  const accesible = await page.evaluate(() => {
    const atributos = ['aria-label', 'alt', 'title', 'placeholder'];
    const partes: string[] = [document.title];
    document.querySelectorAll('[aria-label],[alt],[title],[placeholder]').forEach((elemento) => {
      atributos.forEach((atributo) => {
        const valor = elemento.getAttribute(atributo);
        if (valor) partes.push(valor);
      });
    });
    return partes.join('\n');
  });
  return `${visible}\n${accesible}`;
}

/** La app nunca dice la palabra prohibida. `estricto: false` deja seguir el recorrido y falla al final. */
export async function sinPalabraProhibida(page: Page, pantalla: string, estricto = true): Promise<void> {
  const texto = await textosDePantalla(page);
  const mensaje = `La pantalla ${pantalla} muestra la palabra prohibida`;
  if (estricto) expect(texto, mensaje).not.toMatch(PALABRA_PROHIBIDA);
  else expect.soft(texto, mensaje).not.toMatch(PALABRA_PROHIBIDA);
}

function primerNumero(texto: string): number {
  const hallado = texto.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return hallado ? Number(hallado[0]) : Number.NaN;
}

/**
 * Elige una opción de una lista desplegable por su texto (expresión regular) o por su número
 * (un nivel de la tabla de colores: se compara con el texto de la opción y con su valor).
 */
export async function elegirEnLista(lista: Locator, opcion: RegExp | number): Promise<void> {
  // La lista puede estar todavía cargando ("Cargando tiendas…"): se espera a que aparezca la opción.
  if (opcion instanceof RegExp) {
    await expect
      .poll(async () => (await lista.locator('option').allTextContents()).some((t) => opcion.test(t.trim())), {
        timeout: 10_000,
      })
      .toBe(true)
      .catch(() => undefined);
  }
  const opciones = await lista.locator('option').evaluateAll((elementos) =>
    elementos.map((elemento) => ({
      valor: (elemento as HTMLOptionElement).value,
      texto: (elemento.textContent ?? '').trim(),
    })),
  );
  let elegida: { valor: string; texto: string } | undefined;
  if (typeof opcion === 'number') {
    const conValor = opciones.filter((o) => o.valor !== '');
    elegida =
      conValor.find((o) => primerNumero(o.texto) === opcion && Number(o.valor) === opcion) ??
      conValor.find((o) => primerNumero(o.texto) === opcion) ??
      conValor.find((o) => Number(o.valor) === opcion);
  } else {
    elegida = opciones.find((o) => opcion.test(o.texto));
  }
  expect(
    elegida,
    `No hay una opción "${opcion}" en la lista. Opciones: ${opciones.map((o) => o.texto).join(' | ')}`,
  ).toBeTruthy();
  await lista.selectOption({ value: elegida!.valor });
}

/**
 * Elige una opción de una pregunta, sea una lista desplegable (select con etiqueta) o un grupo
 * de chips (fieldset con leyenda y botones `aria-pressed`, o radios).
 */
export async function elegirOpcion(page: Page, pregunta: RegExp, opcion: RegExp): Promise<void> {
  await expect(page.getByText(pregunta).first(), `No se ve la pregunta ${pregunta}`).toBeVisible();

  const lista = page.getByRole('combobox', { name: pregunta }).first();
  if (await lista.count()) {
    await elegirEnLista(lista, opcion);
    return;
  }

  const grupo = page.getByRole('group', { name: pregunta }).or(page.getByRole('radiogroup', { name: pregunta })).first();
  const raiz = (await grupo.count())
    ? grupo
    : // Sin fieldset ni leyenda: el contenedor más pequeño que tenga la pregunta y la opción.
      page.locator('fieldset, section, div').filter({ hasText: pregunta }).filter({ has: page.getByText(opcion) }).last();

  const candidato = raiz
    .getByRole('button', { name: opcion })
    .or(raiz.getByRole('radio', { name: opcion }))
    .or(raiz.getByText(opcion))
    .first();
  await candidato.click();
}

/**
 * Elige el nivel de una casilla en la carga manual. Acepta las dos formas posibles:
 * un grupo de chips por casilla (fieldset con el nombre del parámetro como leyenda y un botón
 * por nivel, con coma decimal) o una lista desplegable con el nombre del parámetro como etiqueta.
 * Devuelve false si la pantalla no tiene esa casilla.
 */
export async function elegirNivel(page: Page, nombreParametro: string, valor: number): Promise<boolean> {
  const nombre = palabra(nombreParametro);

  const grupo = page.getByRole('group', { name: nombre }).or(page.getByRole('radiogroup', { name: nombre })).first();
  if (await grupo.count()) {
    // 0,5 o 0.5; "50" no puede confundirse con "500" ni con "50,5".
    const numero = escapar(String(valor)).replace('\\.', '[.,]');
    const nivel = new RegExp(`^\\s*${numero}(?!\\d|[.,]\\d)`);
    await grupo.getByRole('button', { name: nivel }).or(grupo.getByRole('radio', { name: nivel })).first().click();
    return true;
  }

  const lista = page.getByRole('combobox', { name: nombre }).first();
  if (await lista.count()) {
    await elegirEnLista(lista, valor);
    return true;
  }
  return false;
}

/** Marca una casilla de verificación; si el control nativo está tapado, usa el teclado. */
export async function marcarCasilla(casilla: Locator): Promise<void> {
  try {
    await casilla.check({ timeout: 5_000 });
  } catch {
    await casilla.focus();
    await casilla.press('Space');
  }
  await expect(casilla).toBeChecked();
}

/** Lee una clave de localStorage; acepta que el valor esté guardado tal cual o como JSON. */
export async function leerGuardado(page: Page, clave: string): Promise<any> {
  const crudo = await page.evaluate((k) => window.localStorage.getItem(k), clave);
  if (crudo === null) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return crudo;
  }
}

/**
 * Deja el hogar (y, si se pasa, "Mi lista") guardados en el dispositivo antes de que cargue la app,
 * como si el cliente ya hubiera llenado su perfil. Solo se escribe una vez por pestaña, para no
 * pisar lo que la app cambie después.
 * Supuesto: `agua.hogar_id` guarda el UUID tal cual y `agua.lista` un arreglo en JSON.
 */
export async function sembrarDispositivo(
  contexto: BrowserContext,
  hogarId: string,
  lista?: Array<{ codigo: string; nombre: string; cantidad: number }>,
): Promise<void> {
  await contexto.addInitScript(
    ([id, listaJson]) => {
      try {
        if (window.sessionStorage.getItem('e2e.sembrado')) return;
        window.localStorage.setItem('agua.hogar_id', id as string);
        if (listaJson) window.localStorage.setItem('agua.lista', listaJson as string);
        window.sessionStorage.setItem('e2e.sembrado', '1');
      } catch {
        /* almacenamiento no disponible: la app mandará a /perfil */
      }
    },
    [hogarId, lista ? JSON.stringify(lista) : null],
  );
}

/**
 * Escribe el PIN en el campo enfocado sin que quede en el informe: se inserta por el canal
 * de depuración del navegador, que no registra el texto como paso de la prueba.
 */
async function escribirEnSecreto(page: Page, campo: Locator, secreto: string): Promise<void> {
  await campo.click();
  const sesion = await page.context().newCDPSession(page);
  await sesion.send('Input.insertText', { text: secreto });
  await sesion.detach();
  const largo = await campo.evaluate((elemento) => (elemento as HTMLInputElement).value.length);
  expect(
    largo,
    'El campo del PIN no recibió el texto completo (si el campo solo acepta dígitos, el PIN debe ser numérico)',
  ).toBe(secreto.length);
}

/**
 * Escribe un PIN en la pantalla de entrada de un módulo (comercio, red o técnico) y pulsa "Entrar".
 * No espera nada después: quien llama decide qué debe pasar (entrar o "PIN incorrecto").
 */
export async function escribirPin(page: Page, ruta: string, pin: string): Promise<void> {
  await page.goto(ruta);
  const campo = page.getByLabel(/^\s*pin\s*$/i).first();
  await expect(campo, `No se ve el campo del PIN en ${ruta}`).toBeVisible();
  await escribirEnSecreto(page, campo, pin);
  await accion(page, /^\s*entrar\s*$/i).click();
}

/**
 * Entra al panel del comercio por la interfaz. Por defecto en /comercio (la dirección principal
 * desde la red de comercios) con PIN_OPERADOR, que es el PIN de Grimuca. `/operador` sigue igual.
 */
export async function entrarAlPanel(page: Page, opciones: { base?: '/comercio' | '/operador'; pin?: string } = {}): Promise<void> {
  const base = opciones.base ?? '/comercio';
  await escribirPin(page, base, opciones.pin ?? PIN_OPERADOR);
  await expect(page, 'Después de entrar con el PIN debe abrirse el panel').toHaveURL(
    new RegExp(`${base}/(resumen|despacho|inventario|productos|zonas)`),
  );
}

export type PestanaPanel = 'Resumen' | 'Despacho' | 'Inventario' | 'Productos' | 'Zonas';

/** Abre una pestaña del panel del comercio, en la misma dirección base donde se entró. */
export async function abrirPestana(page: Page, nombre: PestanaPanel): Promise<void> {
  const base = /\/operador(\/|$)/.test(new URL(page.url()).pathname) ? '/operador' : '/comercio';
  // La pestaña puede llevar un contador: "Despacho (2 nuevos)".
  const empiezaCon = new RegExp(`^\\s*${nombre}(\\s|$)`, 'i');
  await page
    .getByRole('link', { name: empiezaCon })
    .or(page.getByRole('tab', { name: empiezaCon }))
    .or(page.getByRole('button', { name: empiezaCon }))
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`${base}/${nombre.toLowerCase()}`));
}
