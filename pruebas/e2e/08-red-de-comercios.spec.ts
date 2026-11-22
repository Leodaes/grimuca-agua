import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import {
  AVISO_FIJO,
  AVISO_SOLO_LECTURA,
  PINES_COMERCIOS,
  PIN_OPERADOR,
  PIN_SUPERADMIN,
  PIN_TECNICO,
  SIN_PINES_RED,
  SOLO_LECTURA,
  marca,
  obtenerTira,
  planDeValores,
  type ParametroTira,
} from './apoyo/datos';
import { CONTEXTO_ESCRITORIO, CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';
import { abrirPestana, accion, elegirNivel, entrarAlPanel, escribirPin, esperarPantalla, leerGuardado } from './apoyo/pagina';
import { llenarPerfil } from './apoyo/perfil';
import { CARPETA, escucharConsola, guardarRegistro, hallazgos, notas, revisar, tiempos } from './apoyo/revision';

/**
 * Pasada 2 · red de comercios: el recorrido de la demo, UN MISMO PEDIDO por los cuatro módulos.
 *
 *   a. /modulos: cuatro tarjetas y sus enlaces.
 *   b. Red (laptop, PIN_SUPERADMIN): 3 comercios en 3 estados con su membresía; cifras de la banda.
 *   c. Comercio Grimuca (contexto A, PIN_OPERADOR) y Aliado Lara (contexto B) abiertos en Despacho.
 *   d. Teléfono (contexto C): portada → "Ya tengo mi sobre" → perfil (Naguanagua, urbanización,
 *      mascotas, WhatsApp, sin filtro) → carga manual con nitrato 50 → resultado con el porqué →
 *      primer sugerido a Mi lista → "Hacer pedido" con envío.
 *   e. El pedido entra SIN RECARGAR en Grimuca (se miden los segundos) y NO en Aliado Lara.
 *   f. /experto → "Pedir el servicio" → entra en vivo en Grimuca como "Servicio técnico".
 *   g. Técnico (contexto D, teléfono, PIN_TECNICO): ve el servicio, "Ya fui", foto, "Guardar reporte",
 *      pasa a "Atendidos".
 *   h. Grimuca: "Reportes del técnico" muestra el reporte con su foto.
 *   i. La red refleja la actividad (pedidos del mes suben).
 *   j. Grimuca → Productos → "Guardar producto" PC-PRUEBA-<aleatorio>; aparece en la tabla.
 *   k. Red → "Dar de alta" "Prueba Calidad Comercio" en otro estado; aparece en la lista.
 *   l. Seguridad: PIN equivocado, aislamiento entre comercios y rutas sin token.
 *
 * Cada paso deja PASA / NO PASA en docs/calidad/capturas/revision-escritorio-08-*.json (notas.pasos),
 * con tiempos y lo que se vio. Un paso que falla no detiene los siguientes (salvo los que dependen
 * de él); la prueba falla al final si alguno no pasó.
 *
 * Datos que deja: un hogar "Prueba Calidad <marca> red", su medición, un pedido de cartucho (se
 * despacha al final), un servicio técnico atendido con foto, un producto PC-PRUEBA-<marca> en Grimuca
 * (tipo Repuesto, "Bacterias", existencias 0, para no meterse en las recomendaciones de la demo) y un
 * comercio "Prueba Calidad Comercio" en Zulia con su tienda "Prueba Calidad Tienda".
 *
 * Corre solo en el proyecto `escritorio` (abre sus propios contextos de teléfono).
 * Ningún PIN ni token se imprime ni se adjunta.
 */

const RAIZ = path.resolve(__dirname, '../..');
const FOTO_TRABAJO = path.join(RAIZ, 'docs/marketing/imagenes/02-botellones.jpg');
const LIMITE_EN_VIVO_MS = 10_000;
const TIENDAS_GRIMUCA = ['manongo', 'biglow', 'cem'];

type Estado = 'PASA' | 'NO PASA';
const pasos: Record<string, { titulo: string; estado: Estado; detalle: string }> = {};

function corto(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error);
  return texto.replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 3).join(' · ').slice(0, 400);
}

/** Corre un paso del recorrido y anota si pasó. Los errores no detienen el recorrido. */
async function paso(letra: string, titulo: string, cuerpo: () => Promise<void>): Promise<void> {
  await test.step(`${letra}. ${titulo}`, async () => {
    const antes = test.info().errors.length;
    try {
      await cuerpo();
    } catch (error) {
      pasos[letra] = { titulo, estado: 'NO PASA', detalle: corto(error) };
      return;
    }
    const blandos = test.info().errors.slice(antes);
    pasos[letra] = {
      titulo,
      estado: blandos.length ? 'NO PASA' : 'PASA',
      detalle: blandos.length ? blandos.map((e) => corto(e.message)).join(' | ') : 'ok',
    };
  });
}

function exigir<T>(valor: T | null | undefined, falta: string): T {
  if (valor === null || valor === undefined || valor === '') throw new Error(`Depende de un paso anterior: ${falta}`);
  return valor;
}

/** Nitrato en 50 (rojo) y el resto de las casillas en rango. */
function valoresConNitrato50(tira: ParametroTira[]): Record<string, number> {
  const plan = planDeValores(tira);
  const valores = { ...plan.valores };
  if (plan.claveRoja && plan.claveRoja !== 'nitrato') {
    const p = tira.find((x) => x.clave === plan.claveRoja)!;
    valores[plan.claveRoja] = p.niveles[0];
  }
  valores.nitrato = 50;
  return valores;
}

/** Cifras de la banda de la red: { "Pedidos del mes": 82, … }. */
async function cifrasDeLaRed(page: Page): Promise<Record<string, number>> {
  const banda = page.locator('dl[aria-label="Cifras de la red"]');
  await expect(banda).toBeVisible({ timeout: 15_000 });
  return banda.locator('.g-banda-cifras__cifra').evaluateAll((cifras) =>
    Object.fromEntries(
      cifras.map((c) => [
        (c.querySelector('dt')?.textContent ?? '').trim(),
        Number((c.querySelector('dd')?.textContent ?? '').replace(/\D/g, '')),
      ]),
    ),
  );
}

async function filaComercio(page: Page, nombre: RegExp): Promise<Locator> {
  return page.locator('table[aria-label="Comercios de la red"] tbody tr').filter({ has: page.locator('th', { hasText: nombre }) });
}

/** Marca la ventana: si la página se recarga, la marca se pierde. */
async function marcarVentana(page: Page) {
  await page.evaluate(() => ((window as any).__e2eSinRecargar = true));
}
async function sinRecargar(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).__e2eSinRecargar === true);
}

async function tokenDe(api: APIRequestContext, ruta: string, pin: string): Promise<string> {
  const r = await api.post(ruta, { data: { pin } });
  expect(r.status(), `POST ${ruta} con el PIN del entorno debe responder 200`).toBe(200);
  return (await r.json()).token as string;
}

const conToken = (token: string) => ({ Authorization: `Bearer ${token}` });

/** PIN de 6 dígitos que no es ninguno de los reales. */
function pinEquivocado(): string {
  const reales = new Set([PIN_OPERADOR, PIN_SUPERADMIN, PIN_TECNICO, ...Object.values(PINES_COMERCIOS)]);
  for (const d of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    const pin = d.repeat(6);
    if (!reales.has(pin)) return pin;
  }
  return '1029384756';
}

async function fotosQueCargan(page: Page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'));
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const cajas = Array.from(document.querySelectorAll('.producto-foto'));
    const sinFoto = cajas.filter((c) => c.querySelector('.producto-foto__falta')).length;
    const imgs = cajas.map((c) => c.querySelector('img')).filter(Boolean) as HTMLImageElement[];
    const rotas = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
    const pendientes = imgs.filter((i) => !i.complete).map((i) => i.src);
    return { total: cajas.length, cargadas: imgs.length - rotas.length - pendientes.length, sinFoto, rotas, pendientes };
  });
}

test.describe('Red de comercios · el recorrido de la demo', () => {
  test.skip(({ isMobile }) => isMobile, 'El recorrido abre sus propios contextos de teléfono: corre en escritorio.');
  test.skip(() => !PIN_OPERADOR || !PIN_SUPERADMIN || !PIN_TECNICO || !PINES_COMERCIOS['aliado-lara'], SIN_PINES_RED);
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);
  test.describe.configure({ retries: 0 });
  test.afterEach(({}, info) => {
    if (info.status !== 'skipped') {
      notas.pasos = pasos;
      guardarRegistro(info, 'escritorio-08');
    }
  });

  test('un mismo pedido por los cuatro módulos (a–l)', async ({ browser, request, baseURL }) => {
    test.setTimeout(480_000);
    const m = marca();
    const nombreHogar = `Prueba Calidad ${m} red`;
    const direccion = `Calle Inventada ${m}, casa 00, sector de prueba`;
    const codigoProducto = `PC-PRUEBA-${m}`;
    const nombreComercioNuevo = 'Prueba Calidad Comercio';
    notas.marca = m;
    notas.hogar = nombreHogar;

    const abiertos: BrowserContext[] = [];
    const nuevoContexto = async (tipo: 'escritorio' | 'movil', etiqueta: string) => {
      const contexto = await browser.newContext({ ...(tipo === 'movil' ? CONTEXTO_MOVIL : CONTEXTO_ESCRITORIO), ...REGION, baseURL });
      abiertos.push(contexto);
      const pagina = await contexto.newPage();
      escucharConsola(pagina, () => etiqueta);
      return pagina;
    };

    let red!: Page; // contexto R: la red (laptop)
    let grimuca!: Page; // contexto A
    let lara!: Page; // contexto B
    let telefono!: Page; // contexto C
    let tecnico!: Page; // contexto D
    let cifrasAntes: Record<string, number> = {};
    let hogarId = '';
    let pedidoId = '';
    let servicioId = '';
    let nombreSugerido = '';

    try {
      // ------------------------------------------------------------------ a
      await paso('a', '/modulos muestra las cuatro tarjetas y sus enlaces funcionan', async () => {
        red = await nuevoContexto('escritorio', 'modulos');
        await red.goto('/modulos');
        await expect(red.getByRole('heading', { level: 1, name: /cuatro m[oó]dulos/i })).toBeVisible();
        const tarjetas = red.locator('a.mod-tarjeta');
        await expect(tarjetas, 'Cuatro tarjetas').toHaveCount(4);
        await revisar(red, '80-modulos.png', { movil: false, desborde: true });
        const esperados: Array<[RegExp, RegExp, RegExp]> = [
          [/^cliente:/i, /\/$/, /descubre la calidad del agua de tu casa/i],
          [/^comercio:/i, /\/comercio$/, /panel del comercio/i],
          [/^t[eé]cnico:/i, /\/tecnico$/, /servicio t[eé]cnico/i],
          [/^red:/i, /\/red$/, /red grimuca agua/i],
        ];
        const vistos: string[] = [];
        for (const [nombre, url, titulo] of esperados) {
          await red.goto('/modulos');
          const enlace = red.getByRole('link', { name: nombre });
          await expect(enlace).toBeVisible();
          vistos.push(`${await enlace.getAttribute('href')} · ${(await enlace.innerText()).replace(/\s+/g, ' ')}`);
          await enlace.click();
          await expect(red, `La tarjeta ${nombre} lleva a ${url}`).toHaveURL(url);
          await expect.soft(red.getByRole('heading', { level: 1, name: titulo }), `La tarjeta ${nombre} abre su pantalla`).toBeVisible();
        }
        notas.modulos = vistos;
      });

      // ------------------------------------------------------------------ b
      await paso('b', 'Red: entra con PIN_SUPERADMIN, 3 comercios en 3 estados con su membresía, cifras', async () => {
        red ??= await nuevoContexto('escritorio', 'red');
        await escribirPin(red, '/red', PIN_SUPERADMIN);
        await expect(red.getByRole('heading', { level: 1, name: /comercios de la red grimuca agua/i })).toBeVisible({ timeout: 15_000 });
        cifrasAntes = await cifrasDeLaRed(red);
        notas.cifrasRedAntes = cifrasAntes;
        const filas = red.locator('table[aria-label="Comercios de la red"] tbody tr');
        await expect(filas.first()).toBeVisible();
        notas.comerciosRed = (await filas.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
        // La base de la demo no se reinicia mientras el equipo prueba: puede haber comercios "Prueba …"
        // (de Calidad o de Tulio). Se cuentan solo los de la demo y se exige que estén los tres.
        const deLaDemo = (notas.comerciosRed as string[]).filter((t) => !/^prueba\b/i.test(t));
        notas.comerciosDeLaDemo = deLaDemo.length;
        expect.soft(deLaDemo.length, 'Sin contar los "Prueba …", hay 6 comercios (Grimuca, 2 aliados y 3 de centros de llenado)').toBe(6);

        const g = await filaComercio(red, /^\s*grimuca\s*$/i);
        const l = await filaComercio(red, /aliado lara/i);
        const a = await filaComercio(red, /aliado aragua/i);
        await expect(g, 'Grimuca en Carabobo').toContainText(/carabobo/i);
        await expect(l, 'Aliado Lara en Lara').toContainText(/,\s*lara/i);
        await expect(a, 'Aliado Aragua en Aragua').toContainText(/aragua/i);
        await expect.soft(g, 'Grimuca: membresía activa').toContainText(/activa/i);
        await expect.soft(l, 'Aliado Lara: periodo gratis con días').toContainText(/periodo gratis: quedan \d+ d[ií]as?/i);
        await expect.soft(a, 'Aliado Aragua: vencida').toContainText(/vencida/i);
        expect.soft(cifrasAntes['Estados cubiertos'], 'Estados cubiertos: al menos 3').toBeGreaterThanOrEqual(3);
        expect.soft(cifrasAntes['Comercios en la red'], 'Comercios en la red = filas de la tabla').toBe(await filas.count());
        await expect.soft(red.getByText(/en vivo/i).first(), 'La red se ve "En vivo"').toBeVisible({ timeout: 10_000 });

        // Contraste con la API.
        const tokenRed = await tokenDe(request, '/api/red/entrar', PIN_SUPERADMIN);
        const resumen = await (await request.get('/api/red/resumen', { headers: conToken(tokenRed) })).json();
        notas.totalesApiAntes = resumen.totales;
        expect.soft(cifrasAntes['Pedidos del mes'], 'La banda dice lo mismo que la API').toBe(resumen.totales.pedidos_mes);
        expect.soft(cifrasAntes['Hogares'], 'Hogares de la banda = API').toBe(resumen.totales.hogares);
        await revisar(red, '81-red.png', { movil: false, desborde: true });
      });

      // ------------------------------------------------------------------ c
      await paso('c', 'Grimuca (A) y Aliado Lara (B) abiertos en /comercio/despacho', async () => {
        grimuca = await nuevoContexto('escritorio', 'comercio-grimuca');
        await entrarAlPanel(grimuca);
        await abrirPestana(grimuca, 'Despacho');
        await expect(grimuca.getByTestId('ficha-comercio'), 'Arriba dice el comercio').toContainText(/grimuca/i);
        await expect(grimuca.getByText(/ma[ñn]ongo/i).first()).toBeVisible();
        await expect(grimuca.getByText(/^\s*en vivo\s*$/i).first(), 'Grimuca "En vivo"').toBeVisible({ timeout: 15_000 });

        lara = await nuevoContexto('escritorio', 'comercio-lara');
        await entrarAlPanel(lara, { pin: PINES_COMERCIOS['aliado-lara'] });
        await abrirPestana(lara, 'Despacho');
        await expect(lara.getByTestId('ficha-comercio'), 'Arriba dice Aliado Lara').toContainText(/aliado lara/i);
        await expect(lara.getByText(/^\s*en vivo\s*$/i).first(), 'Aliado Lara "En vivo"').toBeVisible({ timeout: 15_000 });
        notas.tiendasLara = await lara.locator('.g-rejilla-tiendas').innerText().then((t) => t.slice(0, 300)).catch(() => '');
        expect.soft(await lara.getByText(/ma[ñn]ongo/i).count(), 'Aliado Lara no ve las tiendas de Grimuca').toBe(0);
        await grimuca.waitForTimeout(1000);
        await marcarVentana(grimuca);
        await marcarVentana(lara);
      });

      // ------------------------------------------------------------------ d
      await paso('d', 'Teléfono: portada → "Ya tengo mi sobre" → perfil → nitrato 50 → resultado con el porqué → pedido con envío', async () => {
        telefono = await nuevoContexto('movil', 'telefono');
        await telefono.goto('/');
        await expect(telefono.getByRole('heading', { level: 1, name: /descubre la calidad del agua de tu casa/i })).toBeVisible();
        const hero = telefono.locator('.p-hero__acciones');
        await expect(hero.getByRole('link').first()).toHaveText(/pedir el sobre a domicilio \(\$9\)/i);
        await esperarPantalla(telefono);
        await telefono.waitForTimeout(600);
        await telefono.screenshot({ path: path.join(CARPETA, '84-portada-sin-hogar-primer-pantallazo.png'), scale: 'css' });
        await revisar(telefono, '85-portada-sin-hogar-completa.png');
        await telefono.evaluate(() => window.scrollTo(0, 0));

        await hero.getByRole('link', { name: /^\s*ya tengo mi sobre\s*$/i }).click();
        await expect(telefono).toHaveURL(/\/perfil\?ya=1/);
        await expect.soft(telefono.getByText(/paso 1 de 2/i).first(), '"Paso 1 de 2" en el perfil con ?ya=1').toBeVisible();
        await llenarPerfil(telefono, {
          nombre: nombreHogar,
          zona: /naguanagua/i,
          urbanizacion: /el naranjal/i,
          mascotas: true,
          filtro: false,
          whatsapp: '0412 000 0000',
        });
        await telefono.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
        await expect(telefono, 'Sin filtro y con ?ya=1 va directo a /medir').toHaveURL(/\/medir\/?$/);
        hogarId = String((await leerGuardado(telefono, 'agua.hogar_id')) ?? '');
        expect(hogarId).toMatch(/^[0-9a-f-]{36}$/i);
        const hogar = await (await request.get(`/api/hogares/${hogarId}`)).json();
        notas.hogarApi = { zona: hogar.zona, urbanizacion: hogar.urbanizacion, mascotas: hogar.mascotas, tiene_filtro: hogar.tiene_filtro, whatsapp: hogar.whatsapp, tienda_id: hogar.tienda_id };
        expect.soft(hogar.zona).toBe('Naguanagua');
        expect.soft(hogar.urbanizacion).toBe('El Naranjal');
        expect.soft(hogar.mascotas).toBe(true);
        expect.soft(hogar.tiene_filtro).toBe(false);
        expect.soft(hogar.whatsapp).toBe('+584120000000');

        await accion(telefono, /colores\s+(a mano|yo mismo|t[uú] mismo)/i).click();
        await expect(telefono).toHaveURL(/\/medir\/manual/);
        const tira = await obtenerTira(request);
        const valores = valoresConNitrato50(tira);
        await expect(telefono.getByRole('button', { name: /ver mi resultado/i })).toBeVisible();
        for (const parametro of tira) {
          if (valores[parametro.clave] === undefined) continue;
          const elegido = await elegirNivel(telefono, parametro.nombre, valores[parametro.clave]);
          if (parametro.clave === 'nitrato') expect(elegido, 'La carga manual tiene la casilla Nitrato').toBe(true);
        }
        await telefono.getByRole('button', { name: /ver mi resultado/i }).click();
        await expect(telefono).toHaveURL(/\/resultado\/[\w-]+/);
        await expect(telefono.getByRole('heading', { name: /lo que te recomendamos/i })).toBeVisible({ timeout: 15_000 });
        await expect(telefono.getByText(AVISO_FIJO), 'Aviso fijo literal').toBeVisible();
        await expect(telefono.getByText(/por qu[eé] te lo recomendamos/i).first()).toBeVisible();
        await expect(telefono.getByRole('link', { name: /ver todos los productos de la tienda/i })).toBeVisible();
        const mejor = telefono.locator('article.g-tarjeta-producto--destacado').first();
        nombreSugerido = (await mejor.locator('.g-tarjeta-producto__nombre').innerText()).trim();
        notas.primerSugerido = nombreSugerido;
        notas.porqueDelPrimero = await mejor.locator('.producto-porque__frase').innerText().catch(() => '');
        notas.sugeridosEnPantalla = (await telefono.locator('.g-tarjeta-producto__nombre').allInnerTexts()).map((t) => t.trim());
        notas.marcasSugeridos = (await telefono.locator('article.g-tarjeta-producto').allInnerTexts()).map((t) => t.split('\n').slice(0, 3).join(' · '));
        expect.soft(notas.porqueDelPrimero as string, 'El porqué del primero nombra "Nitrato en Rojo"').toContain('Nitrato en Rojo');
        notas.fotosResultado = await fotosQueCargan(telefono);
        await revisar(telefono, '89-resultado-porque.png');

        await mejor.getByRole('button', { name: /agregar a mi lista/i }).click();
        await expect(mejor.getByRole('button', { name: /^\s*agregado\s*$/i })).toBeVisible();
        const acceso = telefono.getByRole('navigation').getByRole('link', { name: /mi lista/i }).first();
        if (await acceso.isVisible().catch(() => false)) await acceso.click();
        else await telefono.goto('/lista');
        await expect(telefono).toHaveURL(/\/lista/);
        await expect(telefono.getByText(nombreSugerido).first()).toBeVisible();
        await telefono.getByRole('button', { name: /env[ií]o a mi direcci[oó]n/i }).click();
        await telefono.getByRole('textbox', { name: /direcci[oó]n de entrega/i }).fill(direccion);

        // Desde aquí corre el reloj del paso e.
        tiempos.desdeHacerPedido = Date.now();
        await telefono.getByRole('button', { name: /^\s*hacer pedido\s*$/i }).click();
        await expect(telefono, 'Al confirmar abre el pedido').toHaveURL(/\/pedido\/\d+/, { timeout: 15_000 });
        pedidoId = telefono.url().split('?')[0].split('/').pop() ?? '';
        const pedido = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
        notas.pedidoApi = { id: pedido.id, tipo: pedido.tipo, modalidad: pedido.modalidad, tienda_id: pedido.tienda_id, estado: pedido.estado, cartucho: pedido.cartucho_codigo };
        expect.soft(pedido.modalidad).toBe('envio');
        expect.soft(TIENDAS_GRIMUCA, 'El pedido sale de una tienda de Grimuca').toContain(pedido.tienda_id);
      });

      // ------------------------------------------------------------------ e
      await paso('e', 'El pedido aparece sin recargar en Grimuca y NO en Aliado Lara', async () => {
        exigir(pedidoId, 'el pedido del paso d');
        const fila = grimuca.locator('li.g-fila-pedido').filter({ hasText: nombreHogar });
        await expect(fila, `El pedido entra en Despacho de Grimuca en menos de ${LIMITE_EN_VIVO_MS / 1000} s`).toBeVisible({ timeout: LIMITE_EN_VIVO_MS });
        tiempos.pedidoEnGrimucaSegundos = (Date.now() - Number(tiempos.desdeHacerPedido)) / 1000;
        test.info().annotations.push({ type: 'tiempo de aparición (red)', description: `${tiempos.pedidoEnGrimucaSegundos.toFixed(1)} s (pedido ${pedidoId})` });
        expect(await sinRecargar(grimuca), 'Despacho de Grimuca no se recargó').toBe(true);
        await expect.soft(fila, 'La fila llega marcada "Nuevo"').toContainText(/nuevo/i);
        notas.filaPedidoGrimuca = (await fila.innerText()).replace(/\s+/g, ' ');
        await fila.scrollIntoViewIfNeeded();
        await grimuca.screenshot({ path: path.join(CARPETA, '90-despacho-grimuca-pedido-en-vivo.png'), scale: 'css' });

        await lara.waitForTimeout(4000);
        await expect(lara.locator('li.g-fila-pedido').filter({ hasText: m }), 'Aliado Lara NO ve el pedido de Grimuca').toHaveCount(0);
        expect(await sinRecargar(lara), 'Despacho de Aliado Lara sigue abierto sin recargar').toBe(true);
        notas.contadorNuevosLara = await lara.getByText(/^\s*nuevos:\s*\d+/i).first().innerText().catch(() => '');
        await lara.screenshot({ path: path.join(CARPETA, '91-despacho-aliado-lara-sin-el-pedido.png'), scale: 'css' });
      });

      // ------------------------------------------------------------------ f
      await paso('f', 'Teléfono: /experto → "Pedir el servicio" → en vivo en Grimuca como "Servicio técnico"', async () => {
        exigir(hogarId, 'el hogar del paso d');
        await telefono.goto('/experto');
        const pedir = telefono.getByRole('button', { name: /^\s*pedir el servicio\s*$/i });
        await expect(pedir).toBeVisible({ timeout: 15_000 });
        const campoDireccion = telefono.getByRole('textbox', { name: /^\s*direcci[oó]n/i });
        notas.direccionPrellenadaExperto = await campoDireccion.inputValue();
        if (!(await campoDireccion.inputValue()).trim()) await campoDireccion.fill(direccion);
        notas.tiendaExperto = await telefono.getByRole('combobox', { name: /tienda que coordina/i }).inputValue().catch(() => '');
        const fila = grimuca.locator('li.g-fila-pedido').filter({ hasText: nombreHogar }).filter({ hasText: /servicio t[eé]cnico/i });
        const desde = Date.now();
        await pedir.click();
        await expect(fila, 'El servicio entra en vivo en Grimuca').toBeVisible({ timeout: LIMITE_EN_VIVO_MS });
        tiempos.servicioEnGrimucaSegundos = (Date.now() - desde) / 1000;
        test.info().annotations.push({ type: 'tiempo de aparición del servicio (red)', description: `${tiempos.servicioEnGrimucaSegundos.toFixed(1)} s` });
        expect(await sinRecargar(grimuca), 'Despacho de Grimuca no se recargó').toBe(true);
        await expect(telefono).toHaveURL(/\/pedido\/\d+/, { timeout: 15_000 });
        servicioId = telefono.url().split('?')[0].split('/').pop() ?? '';
        notas.filaServicioGrimuca = (await fila.innerText()).replace(/\s+/g, ' ');
        await fila.scrollIntoViewIfNeeded();
        await grimuca.screenshot({ path: path.join(CARPETA, '92-despacho-grimuca-servicio-tecnico.png'), scale: 'css' });
        await expect(lara.locator('li.g-fila-pedido').filter({ hasText: m }), 'Aliado Lara tampoco ve el servicio').toHaveCount(0);

        // Portada con hogar (tablero) en el teléfono, ya con resultado.
        await telefono.goto('/');
        await expect(telefono.getByRole('heading', { level: 1, name: new RegExp(`hola, ${nombreHogar}`, 'i') })).toBeVisible();
        for (const t of [/^\s*medir mi agua\s*$/i, /ver mis resultados/i, /^\s*mi filtro\s*$/i, /productos de la tienda/i]) {
          await expect.soft(accion(telefono, t), `El tablero tiene ${t}`).toBeVisible();
        }
        await revisar(telefono, '86-portada-con-hogar.png');
      });

      // ------------------------------------------------------------------ g
      await paso('g', 'Técnico: ve el servicio, "Ya fui", foto, "Guardar reporte", pasa a "Atendidos"', async () => {
        exigir(servicioId, 'el servicio del paso f');
        tecnico = await nuevoContexto('movil', 'tecnico');
        await escribirPin(tecnico, '/tecnico', PIN_TECNICO);
        await expect(tecnico.getByRole('heading', { level: 1, name: /servicios asignados/i })).toBeVisible({ timeout: 15_000 });
        const chipPendientes = tecnico.getByRole('button', { name: /^\s*pendientes \(\d+\)\s*$/i });
        const chipAtendidos = tecnico.getByRole('button', { name: /^\s*atendidos \(\d+\)\s*$/i });
        await expect(chipPendientes).toBeVisible();
        const tarjeta = tecnico.locator('li.tec-tarjeta').filter({ hasText: nombreHogar });
        await expect(tarjeta, 'El técnico ve el servicio recién pedido').toBeVisible({ timeout: 15_000 });
        const antesPend = Number((await chipPendientes.innerText()).replace(/\D/g, ''));
        const antesAt = Number((await chipAtendidos.innerText()).replace(/\D/g, ''));
        notas.tecnicoAntes = { pendientes: antesPend, atendidos: antesAt, comercio: await tecnico.getByText(/servicio t[eé]cnico de/i).first().innerText().catch(() => '') };
        await revisar(tecnico, '87-tecnico-pendientes.png');

        await tarjeta.getByRole('button', { name: /ya fui/i }).click();
        await expect(tarjeta.getByText(/sube una foto de c[oó]mo qued[oó]/i).first()).toBeVisible();
        await tarjeta.locator('input[type="file"]').setInputFiles(FOTO_TRABAJO);
        await expect(tarjeta.locator('img.tec-vista'), 'Vista previa de la foto').toBeVisible({ timeout: 15_000 });
        await tarjeta.getByRole('textbox', { name: /^\s*nota/i }).fill(`Prueba Calidad ${m}: cambié el cartucho de sedimentos.`);
        const desde = Date.now();
        await tarjeta.getByRole('button', { name: /^\s*guardar reporte\s*$/i }).click();
        await expect(chipAtendidos, 'Pasa a "Atendidos"').toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
        tiempos.guardarReporteSegundos = (Date.now() - desde) / 1000;
        const atendida = tecnico.locator('li.tec-tarjeta--atendida').filter({ hasText: nombreHogar });
        await expect(atendida).toBeVisible();
        await expect(atendida.locator('img.tec-miniatura'), 'La atendida muestra la miniatura de la foto').toBeVisible();
        await expect.soft(chipAtendidos).toHaveText(new RegExp(`atendidos \\(${antesAt + 1}\\)`, 'i'));
        await expect.soft(chipPendientes).toHaveText(new RegExp(`pendientes \\(${antesPend - 1}\\)`, 'i'));
        await revisar(tecnico, '88-tecnico-atendidos.png');
        const api = await (await request.get(`/api/pedidos/${servicioId}`)).json();
        notas.servicioApi = { id: api.id, tipo: api.tipo, estado: api.estado, tienda_id: api.tienda_id };
        expect(api.estado, 'El servicio queda despachado (atendido) en la API').toBe('despachado');
        // El servicio sale solo del Despacho de Grimuca.
        await expect
          .soft(grimuca.locator('li.g-fila-pedido').filter({ hasText: nombreHogar }).filter({ hasText: /servicio t[eé]cnico/i }), 'Al atenderlo sale del Despacho de Grimuca sin recargar')
          .toHaveCount(0, { timeout: 10_000 });
      });

      // ------------------------------------------------------------------ h
      await paso('h', 'Grimuca: "Reportes del técnico" muestra el reporte con su foto', async () => {
        exigir(servicioId, 'el servicio del paso f');
        const resumen = grimuca.locator('details.op-reportes > summary');
        await resumen.scrollIntoViewIfNeeded();
        notas.reportesResumenAntes = await resumen.innerText();
        if (!(await grimuca.locator('details.op-reportes').evaluate((d) => (d as HTMLDetailsElement).open))) await resumen.click();
        const reporte = grimuca.locator('li.op-reporte').filter({ hasText: nombreHogar });
        let sinRecargarVe = true;
        try {
          await expect(reporte).toBeVisible({ timeout: 10_000 });
        } catch {
          sinRecargarVe = false;
          await grimuca.reload();
          await esperarPantalla(grimuca);
          const r2 = grimuca.locator('details.op-reportes > summary');
          await r2.click();
        }
        notas.reporteAparecioSinRecargar = sinRecargarVe;
        expect.soft(sinRecargarVe, 'El reporte aparece sin recargar el panel').toBe(true);
        await expect(reporte).toBeVisible({ timeout: 10_000 });
        await reporte.getByRole('button', { name: /ver reporte/i }).click();
        const foto = reporte.locator('img.op-reporte__foto');
        await expect(foto, 'El reporte trae la foto').toBeVisible();
        await expect.poll(() => foto.evaluate((i) => (i as HTMLImageElement).naturalWidth), { message: 'La foto del reporte carga', timeout: 15_000 }).toBeGreaterThan(0);
        notas.reporteGrimuca = (await reporte.innerText()).replace(/\s+/g, ' ').slice(0, 300);
        await expect.soft(reporte, 'El reporte trae la nota del técnico').toContainText(m);
        await reporte.scrollIntoViewIfNeeded();
        await grimuca.screenshot({ path: path.join(CARPETA, '83-comercio-reportes-del-tecnico.png'), scale: 'css' });
        await marcarVentana(grimuca);
      });

      // ------------------------------------------------------------------ i
      await paso('i', 'La red refleja la actividad: pedidos del mes subieron', async () => {
        exigir(pedidoId, 'el pedido del paso d');
        const enVivo = await cifrasDeLaRed(red);
        notas.cifrasRedEnVivo = enVivo;
        notas.actividadRed = await red.locator('ol.red-actividad').innerText().catch(() => '(sin actividad en pantalla)');
        const subioEnVivo = enVivo['Pedidos del mes'] - (cifrasAntes['Pedidos del mes'] ?? NaN);
        notas.subidaEnVivo = subioEnVivo;
        expect.soft(subioEnVivo, 'Sin recargar, "Pedidos del mes" sube en 2 (el cartucho y el servicio)').toBeGreaterThanOrEqual(2);
        await red.reload();
        const recargada = await cifrasDeLaRed(red);
        notas.cifrasRedRecargada = recargada;
        expect(recargada['Pedidos del mes'] - (cifrasAntes['Pedidos del mes'] ?? NaN), 'Tras recargar, "Pedidos del mes" subió').toBeGreaterThanOrEqual(2);
        const g = await filaComercio(red, /^\s*grimuca\s*$/i);
        notas.filaGrimucaRed = (await g.innerText()).replace(/\s+/g, ' ');
      });

      // ------------------------------------------------------------------ j
      await paso('j', `Grimuca → Productos → "Guardar producto" ${codigoProducto}; aparece en la tabla`, async () => {
        await abrirPestana(grimuca, 'Productos');
        await expect(grimuca.getByRole('heading', { level: 1, name: /^\s*productos\s*$/i })).toBeVisible();
        const tabla = grimuca.locator('table[aria-label="Productos del comercio"]');
        await expect(tabla).toBeVisible({ timeout: 15_000 });
        notas.productosAntes = await tabla.locator('tbody tr').count();
        // Pasada 3: la base no se reinicia y no se borra nada. Si ya hay un PC-PRUEBA de una pasada anterior,
        // no se crea otro (cada producto de prueba entra a los sugeridos y al catálogo de los clientes de Grimuca).
        const previo = tabla.locator('tbody tr').filter({ hasText: /PC-PRUEBA-/ });
        if (await previo.count()) {
          notas.productoReusado = (await previo.first().innerText()).replace(/\s+/g, ' ');
          test.info().annotations.push({ type: 'producto de prueba reusado', description: String(notas.productoReusado) });
          await expect(previo.first(), 'El producto de prueba anterior sigue en la tabla').toBeVisible();
          await expect.soft(previo.first(), 'Marcado "Cargado por ti"').toContainText(/cargado por ti/i);
          await revisar(grimuca, '82-comercio-productos.png', { movil: false, desborde: true });
          return;
        }
        await grimuca.getByRole('textbox', { name: /^\s*c[oó]digo/i }).fill(codigoProducto);
        await grimuca.getByRole('textbox', { name: /^\s*nombre/i }).fill(`Prueba Calidad producto ${m}`);
        await grimuca.getByRole('combobox', { name: /^\s*tipo/i }).selectOption({ label: 'Repuesto' });
        await grimuca.getByRole('group', { name: /pensado para/i }).getByRole('checkbox', { name: /bacterias/i }).check();
        const existencias = grimuca.getByRole('textbox', { name: /existencias en ma[ñn]ongo/i });
        await expect(existencias, 'Campo "Existencias en Mañongo"').toBeVisible();
        await existencias.fill('0');
        notas.camposExistencias = await grimuca.getByRole('textbox', { name: /^\s*existencias en/i }).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? ''));
        await expect(grimuca.getByRole('textbox', { name: /enlace de la foto/i })).toBeVisible();
        await grimuca.getByRole('button', { name: /^\s*guardar producto\s*$/i }).click();
        await expect(grimuca.getByText(/producto agregado/i).first()).toBeVisible({ timeout: 15_000 });
        const fila = tabla.locator('tbody tr').filter({ hasText: codigoProducto });
        await expect(fila, 'El producto nuevo aparece en la tabla').toBeVisible();
        await expect.soft(fila, 'Marcado "Cargado por ti"').toContainText(/cargado por ti/i);
        notas.filaProducto = (await fila.innerText()).replace(/\s+/g, ' ');
        await grimuca.reload();
        await expect(grimuca.locator('table[aria-label="Productos del comercio"] tbody tr').filter({ hasText: codigoProducto }), 'Sigue en la tabla al recargar').toBeVisible({ timeout: 15_000 });
        await revisar(grimuca, '82-comercio-productos.png', { movil: false, desborde: true });
      });

      // ------------------------------------------------------------------ k
      await paso('k', `Red → "Dar de alta" "${nombreComercioNuevo}" en Zulia; aparece en la lista`, async () => {
        // Pasada 3: si "Prueba Calidad Comercio" ya existe (de una pasada anterior), no se da de alta otro igual.
        const yaExiste = await filaComercio(red, new RegExp(nombreComercioNuevo, 'i'));
        if (await yaExiste.count()) {
          notas.comercioReusado = (await yaExiste.first().innerText()).replace(/\s+/g, ' ');
          test.info().annotations.push({ type: 'comercio de prueba reusado', description: String(notas.comercioReusado) });
          await expect.soft(yaExiste.first(), 'En Zulia').toContainText(/zulia/i);
          await expect(red.getByRole('heading', { name: /dar de alta un comercio/i }), 'El formulario "Dar de alta" está').toBeVisible();
          const cifras = await cifrasDeLaRed(red);
          notas.cifrasTrasAlta = cifras;
          expect.soft(cifras['Estados cubiertos'], 'Con el comercio de Zulia, al menos 4 estados').toBeGreaterThanOrEqual(4);
          await red.screenshot({ path: path.join(CARPETA, '93-red-tras-dar-de-alta.png'), fullPage: true, scale: 'css' });
          return;
        }
        const formulario = red.locator('form').filter({ has: red.getByRole('heading', { name: /dar de alta un comercio/i }) });
        await formulario.getByRole('textbox', { name: /nombre del comercio/i }).fill(nombreComercioNuevo);
        await formulario.getByRole('combobox', { name: /^\s*estado/i }).selectOption({ label: 'Zulia' });
        await formulario.getByRole('textbox', { name: /^\s*ciudad/i }).fill('Maracaibo');
        await formulario.getByRole('combobox', { name: /^\s*plan/i }).selectOption({ label: 'Básico' });
        await formulario.getByRole('combobox', { name: /meses gratis/i }).selectOption({ label: '3 meses' });
        await formulario.getByRole('textbox', { name: /nombre de su primera tienda/i }).fill('Prueba Calidad Tienda');
        await formulario.getByRole('textbox', { name: /direcci[oó]n de la tienda/i }).fill(`Calle Inventada ${m}, Maracaibo`);
        await formulario.getByRole('button', { name: /^\s*dar de alta\s*$/i }).click();
        await expect(red.getByText(/comercio dado de alta/i).first()).toBeVisible({ timeout: 15_000 });
        notas.avisoAlta = await red.getByText(/comercio dado de alta/i).first().innerText();
        const fila = await filaComercio(red, new RegExp(nombreComercioNuevo, 'i'));
        await expect(fila.first(), 'El comercio nuevo aparece en la lista').toBeVisible();
        await expect.soft(fila.first(), 'En Zulia').toContainText(/zulia/i);
        await expect.soft(fila.first(), 'Con periodo gratis').toContainText(/periodo gratis/i);
        const cifras = await cifrasDeLaRed(red);
        notas.cifrasTrasAlta = cifras;
        expect.soft(cifras['Estados cubiertos'], 'Estados cubiertos sube a 4').toBeGreaterThanOrEqual(4);
        await red.reload();
        await expect((await filaComercio(red, new RegExp(nombreComercioNuevo, 'i'))).first(), 'Sigue en la lista al recargar').toBeVisible({ timeout: 15_000 });
        await red.screenshot({ path: path.join(CARPETA, '93-red-tras-dar-de-alta.png'), fullPage: true, scale: 'css' });
      });

      // ------------------------------------------------------------------ l
      await paso('l', 'Seguridad: PIN equivocado, aislamiento entre comercios y rutas sin token', async () => {
        const malo = pinEquivocado();
        const intruso = await nuevoContexto('escritorio', 'pin-equivocado');
        await escribirPin(intruso, '/comercio', malo);
        await expect(intruso.getByText(/pin incorrecto/i).first(), 'Un PIN equivocado no entra').toBeVisible({ timeout: 10_000 });
        await expect(intruso).not.toHaveURL(/\/comercio\/despacho/);
        const r1 = await request.post('/api/red/entrar', { data: { pin: malo } });
        const r2 = await request.post('/api/tecnico/entrar', { data: { pin: malo } });
        notas.pinEquivocado = { comercioUi: 'PIN incorrecto', red: r1.status(), tecnico: r2.status() };
        expect.soft(r1.status(), 'Red con PIN equivocado → 401').toBe(401);
        expect.soft(r2.status(), 'Técnico con PIN equivocado → 401').toBe(401);

        const tLara = await tokenDe(request, '/api/operador/entrar', PINES_COMERCIOS['aliado-lara']);
        const deLara = await (await request.get('/api/operador/pedidos?estado=todos', { headers: conToken(tLara) })).json();
        const ajenos = (deLara as any[]).filter((p) => TIENDAS_GRIMUCA.includes(p.tienda_id) || (p.comercio_id && p.comercio_id !== 'aliado-lara'));
        notas.aislamiento = { pedidosDeLara: deLara.length, ajenos: ajenos.length, tiendasLara: [...new Set((deLara as any[]).map((p) => p.tienda_id))] };
        expect(ajenos.length, 'Con el token de Aliado Lara no salen pedidos de Grimuca').toBe(0);
        if (pedidoId) {
          expect((deLara as any[]).some((p) => String(p.id) === pedidoId), 'El pedido de la demo no sale en Aliado Lara').toBe(false);
          const desp = await request.post(`/api/operador/pedidos/${pedidoId}/despachar`, { headers: conToken(tLara) });
          notas.despacharAjeno = desp.status();
          expect(desp.status(), 'Aliado Lara no puede despachar un pedido de Grimuca (4xx)').toBeGreaterThanOrEqual(400);
          expect(desp.status()).toBeLessThan(500);
          const sigue = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
          expect(sigue.estado, 'El pedido de Grimuca sigue pendiente').toBe('pendiente');
        }
        const reportesLara = await (await request.get('/api/operador/reportes', { headers: conToken(tLara) })).json();
        expect.soft((reportesLara as any[]).some((s) => String(s.id) === servicioId), 'Aliado Lara no ve el reporte de Grimuca').toBe(false);
        if (servicioId) {
          const fotoAjena = await request.get(`/api/servicios/${servicioId}/foto?token=${encodeURIComponent(tLara)}`);
          notas.fotoAjena = fotoAjena.status();
          expect.soft(fotoAjena.status(), 'Aliado Lara no puede ver la foto del reporte de Grimuca').toBeGreaterThanOrEqual(400);
        }

        const sinToken: Array<[string, 'get' | 'post']> = [
          ['/api/red/resumen', 'get'],
          ['/api/red/comercios', 'post'],
          ['/api/tecnico/servicios', 'get'],
          [`/api/tecnico/servicios/${servicioId || 1}/atender`, 'post'],
          [`/api/servicios/${servicioId || 1}/foto`, 'get'],
          ['/api/operador/productos', 'get'],
          ['/api/operador/reportes', 'get'],
        ];
        const estados: Record<string, number> = {};
        for (const [ruta, metodo] of sinToken) {
          const r = metodo === 'get' ? await request.get(ruta) : await request.post(ruta, { data: {} });
          estados[`${metodo.toUpperCase()} ${ruta}`] = r.status();
          expect.soft(r.status(), `${metodo.toUpperCase()} ${ruta} sin token → 401`).toBe(401);
        }
        // Un rol no entra en las rutas de otro.
        const tTec = await tokenDe(request, '/api/tecnico/entrar', PIN_TECNICO);
        estados['GET /api/red/resumen con token de comercio'] = (await request.get('/api/red/resumen', { headers: conToken(tLara) })).status();
        estados['GET /api/operador/pedidos con token de técnico'] = (await request.get('/api/operador/pedidos', { headers: conToken(tTec) })).status();
        estados['GET /api/tecnico/servicios con token de comercio'] = (await request.get('/api/tecnico/servicios', { headers: conToken(tLara) })).status();
        notas.rutasSinPermiso = estados;
        expect.soft(estados['GET /api/red/resumen con token de comercio'], 'Comercio en la red → 403').toBe(403);
        expect.soft(estados['GET /api/operador/pedidos con token de técnico'], 'Técnico en el comercio → 403').toBe(403);
        expect.soft(estados['GET /api/tecnico/servicios con token de comercio'], 'Comercio en el técnico → 403').toBe(403);
      });

      // Limpieza: el pedido de cartucho de la demo se despacha desde Grimuca para no dejarlo pendiente.
      await test.step('limpieza: despachar el pedido de la prueba en Grimuca', async () => {
        if (!pedidoId) return;
        await abrirPestana(grimuca, 'Despacho');
        const fila = grimuca.locator('li.g-fila-pedido').filter({ hasText: nombreHogar });
        if (await fila.count()) {
          await fila.first().getByRole('button', { name: /despachado/i }).click();
          await expect(fila).toHaveCount(0, { timeout: 10_000 });
        }
        const final = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
        notas.estadoFinalPedido = final.estado;
      });
    } finally {
      for (const c of abiertos) await c.close().catch(() => undefined);
    }

    notas.hallazgosRevision = hallazgos.length;
    const fallidos = Object.entries(pasos)
      .filter(([, p]) => p.estado !== 'PASA')
      .map(([letra, p]) => `${letra}: ${p.detalle}`);
    expect(fallidos, 'Pasos del recorrido que no pasaron').toEqual([]);
  });
});
