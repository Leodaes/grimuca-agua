import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';
import {
  AVISO_FIJO,
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
  type ParametroTira,
} from './apoyo/datos';
import { CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';
import { abrirPestana, entrarAlPanel, esperarPantalla, leerGuardado, sembrarDispositivo } from './apoyo/pagina';
import { llenarPerfil } from './apoyo/perfil';
import { CARPETA, erroresConsola, escucharConsola, guardarRegistro, hallazgos, notas, revisar, tiempos } from './apoyo/revision';

/**
 * Pasada 2 · funciones nuevas (21 nov, noche).
 *
 *   Perfil nuevo (urbanización, mascotas, WhatsApp +58) · Mi filtro por foto y a mano ·
 *   "Por qué te lo recomendamos" en el resultado · mensaje de "Cotizar por WhatsApp" ·
 *   catálogo · tutoriales → experto → pedido de servicio en Despacho en vivo → "Atendido" ·
 *   mapa de hexágonos del operador · revisión de enlaces internos.
 *
 * Todo hogar se llama "Prueba Calidad <marca> …". Cada prueba deja su registro en
 * docs/calidad/capturas/revision-<proyecto>-<prueba>.json (frases, tiempos, hallazgos).
 */

const RAIZ = path.resolve(__dirname, '../..');
const FOTO_FILTRO = path.join(RAIZ, 'docs/marketing/imagenes/02-botellones.jpg');
const FOTO_NO_FILTRO = path.join(RAIZ, 'app/public/marca/og-01.jpg');
const WHATSAPP_TIENDA = '584144409396';
/** Palabras que ninguna frase de "Por qué te lo recomendamos" puede decir. */
const PROHIBIDAS_FRASE = /potable|elimina|purifica|segura|apta/i;

/** Valores de la tira: nitrato en 50 (rojo) o todo en rango. */
function valoresTira(tira: ParametroTira[], nitrato: number | null): Record<string, number> {
  const plan = planDeValores(tira);
  const valores = { ...plan.valores };
  if (plan.claveRoja && plan.claveRoja !== 'nitrato') {
    const p = tira.find((x) => x.clave === plan.claveRoja)!;
    valores[plan.claveRoja] = p.niveles[0];
  }
  if (nitrato === null) valores.nitrato = 0;
  else valores.nitrato = nitrato;
  return valores;
}

/** GET con JSON y dos reintentos cortos si la conexión se corta (ECONNRESET, socket hang up); no reintenta por el código HTTP. */
async function getJson(request: APIRequestContext, url: string): Promise<any> {
  for (let intento = 1; ; intento += 1) {
    try {
      return await (await request.get(url)).json();
    } catch (error) {
      if (intento >= 3 || !/ECONNRESET|socket hang up|ECONNREFUSED|ETIMEDOUT/i.test(String(error))) throw error;
      await new Promise((listo) => setTimeout(listo, 1_000 * intento));
    }
  }
}

async function frasesPorQue(page: Page): Promise<string[]> {
  return page.locator('.producto-porque__frase').allInnerTexts();
}

async function fotosDeProducto(page: Page) {
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

// ---------------------------------------------------------------------------------------------
// Teléfono
// ---------------------------------------------------------------------------------------------
test.describe('Funciones nuevas · teléfono', () => {
  test.skip(({ isMobile }) => !isMobile, 'Las pantallas del cliente se prueban en el teléfono.');
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);
  test.describe.configure({ retries: 0 });

  let actual = '';
  test.beforeEach(({ page }) => escucharConsola(page, () => actual));
  test.afterEach(({}, info) => { if (info.status !== 'skipped') guardarRegistro(info, 'movil-07'); });

  test('perfil: WhatsApp +58, número inválido, urbanización y mascotas', async ({ page }) => {
    const m = marca();
    actual = '50-perfil-nuevo';
    await page.goto('/perfil?ya=1');
    await expect(page.getByRole('combobox', { name: /c[oó]digo de pa[ií]s/i }), '+58 por defecto').toHaveValue('58');
    await expect.soft(page.getByRole('combobox', { name: /^\s*operadora\s*$/i }), 'Operadora sin preselección').toHaveValue('');
    await expect(page.getByRole('textbox', { name: /^\s*apellido/i }), 'El perfil pide "Apellido" aparte').toBeVisible();
    await llenarPerfil(page, {
      nombre: `Prueba Calidad ${m} telefono`,
      urbanizacion: /el naranjal/i,
      mascotas: true,
      filtro: false,
      whatsapp: '0414-55',
    });
    // Número inválido: muestra error y no avanza.
    await page.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
    // 22 nov: con +58 el número va en dos partes (Operadora + Número de 7 dígitos).
    await expect(page.getByText(/revisa el n[uú]mero|7 d[ií]gitos del n[uú]mero/i).first(), 'Número inválido → mensaje de error').toBeVisible();
    await expect(page, 'Con número inválido no avanza').toHaveURL(/\/perfil/);
    expect(await leerGuardado(page, 'agua.hogar_id'), 'Con número inválido no se crea el hogar').toBeNull();
    await revisar(page, '50b-perfil-telefono-invalido.png');

    await page.getByRole('combobox', { name: /^\s*operadora\s*$/i }).selectOption('0414');
    const numero = page.getByRole('textbox', { name: /^\s*n[uú]mero\s*$/i });
    await numero.fill('555-0199');
    await numero.blur();
    // Al salir del campo quita espacios y guiones: queda 5550199.
    notas.whatsappAlSalir = await numero.inputValue();
    await revisar(page, '50-perfil-nuevo.png');
    await page.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
    await expect(page, 'Sin filtro y ?ya=1 va directo a /medir').toHaveURL(/\/medir\/?$/);

    const id = String(await leerGuardado(page, 'agua.hogar_id'));
    const hogar = await getJson(page.request, `/api/hogares/${id}`);
    notas.hogarGuardado = { whatsapp: hogar.whatsapp, urbanizacion: hogar.urbanizacion, mascotas: hogar.mascotas, tiene_filtro: hogar.tiene_filtro };
    expect(hogar.whatsapp, 'Operadora 0414 + Número 555-0199 se guarda armado como +584145550199').toBe('+584145550199');
    expect(hogar.nombre, 'Nombre y Apellido se guardan juntos').toBe(`Prueba Calidad ${m} telefono`);
    expect(hogar.urbanizacion).toBe('El Naranjal');
    expect(hogar.mascotas).toBe(true);
  });

  test('mi filtro: foto de un filtro, foto que no es un filtro y carga a mano', async ({ page }) => {
    test.setTimeout(150_000);
    const m = marca();
    const hogar = await crearHogar(page.request, { tiene_filtro: true, etapas_filtro: null, ultimo_cambio: 'no_me_acuerdo' }, `${m} filtro`);
    await sembrarDispositivo(page.context(), hogar.id);

    actual = '51-mi-filtro-inicio';
    await page.goto('/mi-filtro');
    await expect(page.getByRole('button', { name: /tomar una foto de mi filtro/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /elegir una foto del tel[eé]fono/i })).toBeVisible();
    await revisar(page, '51-mi-filtro-inicio.png');

    // 1. Foto de un filtro de dos vasos bajo el fregadero.
    const galeria = page.locator('input[type="file"]:not([capture])');
    let desde = Date.now();
    await galeria.setInputFiles(FOTO_FILTRO);
    await expect(page.getByText(/mirando tu filtro/i).first()).toBeVisible().catch(() => undefined);
    await page.screenshot({ path: path.join(CARPETA, '52-mi-filtro-leyendo.png'), fullPage: true, scale: 'css' }).catch(() => undefined);
    const identificado = page.getByRole('heading', { name: /es este tu filtro/i });
    const noReconocido = page.getByRole('heading', { name: /no pudimos reconocer tu filtro/i });
    await expect(identificado.or(noReconocido)).toBeVisible({ timeout: 90_000 });
    tiempos.fotoFiltroSegundos = (Date.now() - desde) / 1000;
    actual = '53-mi-filtro-identificado';
    notas.fotoFiltroPantalla = (await page.locator('main').innerText()).slice(0, 2500);
    await revisar(page, '53-mi-filtro-identificado.png');
    await expect(identificado, 'La foto de un filtro de dos vasos debe identificarse').toBeVisible();
    const ficha = await page.getByRole('region', { name: /datos de tu filtro/i }).innerText();
    notas.fotoFiltroFicha = ficha;
    expect(ficha, 'Debe identificar un portafiltro').toMatch(/portafiltro/i);
    const cartuchos = await page.locator('section[aria-labelledby="titulo-cartuchos-filtro"] .g-tarjeta-producto__nombre').allInnerTexts();
    notas.fotoFiltroCartuchos = cartuchos;
    expect(cartuchos.length, 'Debe listar los cartuchos que necesita').toBeGreaterThan(0);

    // ¿Se guarda antes de que el cliente confirme?
    const antesDeConfirmar = await getJson(page.request, `/api/hogares/${hogar.id}/filtro`);
    notas.filtroAntesDeConfirmar = antesDeConfirmar?.filtro ?? null;
    expect.soft(antesDeConfirmar?.filtro ?? null, 'La foto no debería guardar el filtro antes de "Sí, es este"').toBeNull();

    await page.getByRole('button', { name: /s[ií], es este/i }).click();
    await expect(page, '"Sí, es este" sin ?sigue vuelve al inicio').toHaveURL(/\/$/);
    const confirmado = await getJson(page.request, `/api/hogares/${hogar.id}/filtro`);
    notas.filtroConfirmado = confirmado?.filtro ?? null;
    expect(confirmado?.filtro?.tipo).toMatch(/^portafiltro_/);

    // 2. Imagen que no es un filtro.
    actual = '54-mi-filtro-no-reconocido';
    await page.goto('/mi-filtro');
    await expect(page.getByText(/tienes registrado/i).first(), 'Debe recordar el filtro registrado').toBeVisible();
    desde = Date.now();
    await page.locator('input[type="file"]:not([capture])').setInputFiles(FOTO_NO_FILTRO);
    await expect(identificado.or(noReconocido)).toBeVisible({ timeout: 90_000 });
    tiempos.fotoNoFiltroSegundos = (Date.now() - desde) / 1000;
    notas.fotoNoFiltroPantalla = (await page.locator('main').innerText()).slice(0, 800);
    await revisar(page, '54-mi-filtro-no-reconocido.png');
    await expect(noReconocido, 'Una imagen que no es un filtro no debe identificarse').toBeVisible();
    await expect(page.getByRole('link', { name: /cargarlo a mano/i }).or(page.getByRole('button', { name: /cargarlo a mano/i })).first()).toBeVisible();
    const filtroTrasNoFiltro = await getJson(page.request, `/api/hogares/${hogar.id}/filtro`);
    notas.filtroTrasFotoNoFiltro = filtroTrasNoFiltro?.filtro?.tipo ?? null;

    // 3. Carga manual.
    actual = '55-mi-filtro-manual';
    await page.getByRole('link', { name: /cargarlo a mano/i }).or(page.getByRole('button', { name: /cargarlo a mano/i })).first().click();
    await expect(page).toHaveURL(/\/mi-filtro\/manual/);
    await page.getByRole('group', { name: /c[oó]mo es tu filtro/i }).getByLabel(/^\s*dos vasos/i).check();
    await page.getByRole('group', { name: /c[oó]mo son los cartuchos/i }).getByLabel(/^\s*corto y delgado/i).check();
    await revisar(page, '55-mi-filtro-manual.png');
    await page.getByRole('button', { name: /guardar mi filtro/i }).click();
    await expect(page.getByRole('heading', { name: /guardamos tu filtro/i })).toBeVisible({ timeout: 15_000 });
    actual = '56-mi-filtro-guardado';
    await revisar(page, '56-mi-filtro-guardado.png');
    const manual = await getJson(page.request, `/api/hogares/${hogar.id}/filtro`);
    notas.filtroManual = manual?.filtro ?? null;
    expect(manual?.filtro?.tipo).toBe('portafiltro_doble');
    expect(manual?.filtro?.medida).toBe('10x2.5');
  });

  test('resultado sin filtro con nitrato 50: ósmosis inversa, "Nitrato en Rojo" y mensaje de WhatsApp', async ({ page }) => {
    test.setTimeout(120_000);
    const m = marca();
    const hogar = await crearHogar(page.request, { tiene_filtro: false, etapas_filtro: null, fecha_ultimo_cambio: null, mascotas: true }, `${m} sin filtro`);
    const tira = await obtenerTira(page.request);
    const medicion = await medirManual(page.request, hogar.id, valoresTira(tira, 50));
    await sembrarDispositivo(page.context(), hogar.id);

    actual = '57-resultado-porque';
    await page.goto(`/resultado/${medicion.id}`);
    await expect(page.getByRole('heading', { name: /lo que te recomendamos/i })).toBeVisible();
    await expect(page.getByText(AVISO_FIJO), 'Aviso fijo literal').toBeVisible();
    // Resultado del 22 nov: conclusión, "Si no haces nada", "Qué hacer hoy" y casillas con "Qué mide y por qué importa".
    const conclusion = page.getByRole('region', { name: /tu conclusi[oó]n/i });
    await expect(conclusion, '"Tu conclusión"').toBeVisible();
    notas.conclusionNitrato = await conclusion.innerText();
    await expect(page.getByRole('heading', { name: /si no haces nada/i }), 'Nitrato en rojo → "Si no haces nada"').toBeVisible();
    const hoy = page.getByRole('list', { name: /qu[eé] hacer hoy/i });
    await expect(hoy, '"Qué hacer hoy"').toBeVisible();
    notas.queHacerHoyNitrato = (await hoy.innerText()).replace(/\n+/g, ' | ').slice(0, 800);
    await expect(hoy.getByRole('heading', { name: /protege a tu familia hoy/i }), 'Nitrato en rojo → paso 1 "Protege a tu familia hoy"').toBeVisible();
    // El paso 1 se completa cuando carga el hogar (llega después de la medición): la aserción espera.
    await expect(hoy.getByRole('listitem').first(), 'Con mascotas, el paso 1 las nombra').toContainText(/dales esa misma agua a tus mascotas/i);
    const casillas = page.getByRole('region', { name: /casilla por casilla/i });
    const filaNitrato = casillas.locator('li').filter({ hasText: /^\s*Nitrato\b/ }).first();
    await expect(filaNitrato, 'Fila "Nitrato" con su palabra').toContainText(/Rojo/);
    // Resultado compacto (en camino): la fila roja trae "Ver qué te recomendamos" → #titulo-sugeridos. Tolera ambas versiones.
    const verRecomendados = filaNitrato.getByRole('link', { name: /ver qu[eé] te recomendamos/i });
    if (await verRecomendados.count()) await expect(verRecomendados.first()).toHaveAttribute('href', /#titulo-sugeridos$/);
    await expect.soft(casillas.getByText(/qu[eé] mide y por qu[eé] importa/i).first(), 'Detalle desplegable por casilla').toBeVisible();
    expect(await page.locator('main').innerText(), 'Se quitó "Qué encontramos"').not.toMatch(/qu[eé] encontramos/i);
    const mejor = page.locator('article.g-tarjeta-producto--destacado').first();
    await expect(mejor.getByText(/la mejor opci[oó]n para tu casa/i)).toBeVisible();
    const nombreMejor = await mejor.locator('.g-tarjeta-producto__nombre').innerText();
    const fraseMejor = await mejor.locator('.producto-porque__frase').innerText();
    const frases = await frasesPorQue(page);
    notas.sinFiltro = { nombreMejor, fraseMejor, frases, sugeridosApi: medicion.sugeridos?.map((s: any) => `${s.codigo} · ${s.categoria}`) };
    expect(nombreMejor, 'El primer sugerido debe tratar nitrato (ósmosis inversa)').toMatch(/[oó]smosis/i);
    expect(fraseMejor, 'El porqué del primero debe nombrar "Nitrato en Rojo"').toContain('Nitrato en Rojo');
    for (const f of frases) expect.soft(f, `Frase con palabra prohibida: ${f}`).not.toMatch(PROHIBIDAS_FRASE);
    await expect(page.getByRole('link', { name: /preguntar por filtros por whatsapp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ver todos los productos de la tienda/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /aprende a cambiar tu cartucho/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contrata a un experto/i })).toBeVisible();

    // Altura de "Cotizar por WhatsApp" y fotos de producto.
    const altos = await page.getByRole('link', { name: /^\s*cotizar por whatsapp\s*$/i }).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    notas.altoCotizar = altos;
    for (const a of altos) expect.soft(a, '"Cotizar por WhatsApp" debe medir 44 px o más').toBeGreaterThanOrEqual(44);
    notas.fotosSugeridos = await fotosDeProducto(page);
    await revisar(page, '57-resultado-porque.png');

    // Mensaje de WhatsApp.
    actual = '58-mensaje-whatsapp';
    const cotizar = mejor.getByRole('link', { name: /^\s*cotizar por whatsapp\s*$/i });
    const href = (await cotizar.getAttribute('href')) ?? '';
    expect(href, 'Abre wa.me/584144409396').toMatch(new RegExp(`^https://wa\\.me/${WHATSAPP_TIENDA}\\?text=`));
    const texto = decodeURIComponent(href.split('?text=')[1] ?? '');
    notas.mensajeWhatsApp = texto;
    expect(texto).toContain(hogar.nombre);
    expect(texto).toContain('Naguanagua');
    expect(texto, 'Incluye el resumen de la medición').toMatch(/Nitrato: Rojo/);
    expect(texto).not.toMatch(/undefined|null|NaN/);
    expect(texto, 'Sin huecos (dobles espacios, " ." o ", ,")').not.toMatch(/ {2}| \.|, ,|\.\./);
    await mejor.getByText(/ver o editar el mensaje/i).click();
    await expect(mejor.getByLabel(/tu mensaje para la tienda/i)).toHaveValue(texto);
    await mejor.scrollIntoViewIfNeeded();
    await mejor.screenshot({ path: path.join(CARPETA, '58-mensaje-whatsapp.png'), scale: 'css' });
    const preguntar = (await page.getByRole('link', { name: /preguntar por filtros por whatsapp/i }).getAttribute('href')) ?? '';
    notas.mensajePreguntarFiltros = decodeURIComponent(preguntar.split('?text=')[1] ?? '');
    expect(notas.mensajePreguntarFiltros as string).not.toMatch(/undefined|null/);
  });

  test('resultado con filtro identificado: el porqué menciona su filtro; todo en verde: "Lo que sigue"', async ({ page }) => {
    test.setTimeout(120_000);
    const m = marca();
    const tira = await obtenerTira(page.request);

    // A. Con filtro registrado (portafiltro triple 10 x 2.5) y nitrato 50.
    const hogar = await crearHogar(page.request, { tiene_filtro: true, etapas_filtro: 3, ultimo_cambio: 'mas_de_tres_meses' }, `${m} con filtro`);
    const put = await page.request.put(`/api/hogares/${hogar.id}/filtro`, { data: { tipo: 'portafiltro_triple', etapas: 3, medida: '10x2.5', modelo_codigo: null } });
    expect(put.status(), 'PUT /filtro').toBe(200);
    const medicion = await medirManual(page.request, hogar.id, valoresTira(tira, 50));
    await sembrarDispositivo(page.context(), hogar.id);
    actual = '59-resultado-con-filtro';
    await page.goto(`/resultado/${medicion.id}`);
    await expect(page.getByRole('heading', { name: /lo que te recomendamos/i })).toBeVisible();
    const frases = await frasesPorQue(page);
    const nombres = await page.locator('article.g-tarjeta-producto .g-tarjeta-producto__nombre').allInnerTexts();
    notas.conFiltro = { nombres, frases, lineaFiltro: await page.getByText(/tu filtro/i).first().innerText().catch(() => null) };
    expect.soft(frases.some((f) => /tu filtro/i.test(f)), 'Alguna frase debe mencionar su filtro').toBe(true);
    for (const f of frases) expect.soft(f, `Frase con palabra prohibida: ${f}`).not.toMatch(PROHIBIDAS_FRASE);
    notas.fotosSugeridosConFiltro = await fotosDeProducto(page);
    await revisar(page, '59-resultado-con-filtro.png');

    // B. Todo en verde, con filtro, sin agua turbia y cambio reciente. Agua de chorro: con tanque o pozo la API
    // pide "bacterias" (desinfección) y cualquier producto de un comercio marcado "Pensado para: Bacterias"
    // entra a los sugeridos; eso se anota aparte como falla de la app (pasada 3), no se mezcla con este caso.
    const verde = await crearHogar(page.request, { origen_agua: 'chorro', tiene_filtro: true, etapas_filtro: 3, agua_turbia: false, ultimo_cambio: 'menos_de_un_mes', fecha_ultimo_cambio: null }, `${m} verde`);
    const mv = await medirManual(page.request, verde.id, valoresTira(tira, null));
    notas.todoVerde = { semaforo: mv.evaluacion?.semaforo, sugeridos: (mv.sugeridos ?? []).map((s: any) => s.codigo) };
    const ctx = await page.context().browser()!.newContext({ ...CONTEXTO_MOVIL, ...REGION, baseURL: test.info().project.use.baseURL });
    const p2 = await ctx.newPage();
    escucharConsola(p2, () => '60-resultado-todo-verde');
    await sembrarDispositivo(ctx, verde.id);
    await p2.goto(`/resultado/${mv.id}`);
    await esperarPantalla(p2);
    await revisar(p2, '60-resultado-todo-verde.png');
    expect.soft(mv.evaluacion?.semaforo, 'Todo en rango → semáforo verde').toBe('verde');
    // Todo en verde (22 nov): conclusión prudente, sin "Si no haces nada", y "Qué hacer hoy" con volver a medir.
    const conclusionVerde = p2.getByRole('region', { name: /tu conclusi[oó]n/i });
    await expect(conclusionVerde, '"Tu conclusión" en todo verde').toBeVisible();
    notas.conclusionVerde = await conclusionVerde.innerText();
    await expect(conclusionVerde, 'Todo verde no certifica el agua').toContainText(/no certifica/i);
    await expect(p2.getByRole('heading', { name: /si no haces nada/i }), 'Todo verde no lleva "Si no haces nada"').toHaveCount(0);
    const hoyVerde = p2.getByRole('list', { name: /qu[eé] hacer hoy/i });
    await expect(hoyVerde.getByRole('heading', { name: /vuelve a medir en 3 meses/i }), '"Qué hacer hoy" → volver a medir').toBeVisible();
    const recordar = hoyVerde.getByRole('button', { name: /recu[eé]rdame cu[aá]ndo hacer mi pr[oó]xima medici[oó]n/i });
    await expect(recordar).toBeVisible();
    await recordar.click();
    await expect(p2.getByRole('group', { name: /d[oó]nde guardar el recordatorio/i }), 'El recordatorio ofrece dónde guardarlo').toBeVisible();
    notas.sugeridosVerde = (mv.sugeridos ?? []).map((s: any) => s.codigo);
    await expect(p2.getByRole('heading', { name: /lo que sigue/i }), 'Todo en verde → "Lo que sigue"').toBeVisible();
    const recambio = p2.getByRole('link', { name: /cotizar el recambio de mi filtro por whatsapp/i });
    await expect(recambio).toBeVisible();
    const href = (await recambio.getAttribute('href')) ?? '';
    notas.mensajeRecambio = decodeURIComponent(href.split('?text=')[1] ?? '');
    expect(href).toContain(`wa.me/${WHATSAPP_TIENDA}`);
    expect(notas.mensajeRecambio as string).not.toMatch(/undefined|null/);
    await ctx.close();
  });

  test('catálogo: carga, filtra por tipo, busca por código y agrega a mi lista', async ({ page }) => {
    test.setTimeout(120_000);
    const m = marca();
    const hogar = await crearHogar(page.request, { tiene_filtro: false, etapas_filtro: null, fecha_ultimo_cambio: null }, `${m} catalogo`);
    await medirManual(page.request, hogar.id, valoresTira(await obtenerTira(page.request), 50));
    await sembrarDispositivo(page.context(), hogar.id);
    // Con hogar, el catálogo es el general más los productos propios del comercio de su tienda (Mañongo → Grimuca).
    const catalogoApi = await (await page.request.get(`/api/cartuchos?hogar_id=${hogar.id}`)).json();

    actual = '61-catalogo';
    const desde = Date.now();
    await page.goto('/catalogo');
    const conteo = page.getByRole('status').filter({ hasText: /\d+ productos?/ }).first();
    await expect(conteo).toBeVisible({ timeout: 20_000 });
    tiempos.catalogoCargaSegundos = (Date.now() - desde) / 1000;
    const total = Number((await conteo.innerText()).match(/\d+/)![0]);
    notas.catalogo = { totalPantalla: total, totalApi: catalogoApi.length };
    expect(total, 'El catálogo muestra todos los productos de la API').toBe(catalogoApi.length);
    await expect(page.getByRole('heading', { name: /recomendados para ti/i }), 'Con medición: "Recomendados para ti"').toBeVisible();
    await expect(page.getByRole('button', { name: /ver m[aá]s/i })).toBeVisible();
    notas.fotosCatalogo = await fotosDeProducto(page);
    await revisar(page, '61-catalogo.png');

    // Filtro por tipo.
    actual = '62-catalogo-filtrado';
    await page.getByRole('group', { name: /tipo de producto/i }).getByRole('button', { name: /^\s*cartuchos\s*$/i }).click();
    const cartuchosApi = catalogoApi.filter((c: any) => c.categoria === 'cartucho').length;
    await expect(conteo).toHaveText(new RegExp(`^\\s*${cartuchosApi} productos?`));
    notas.catalogoCartuchos = { pantalla: await conteo.innerText(), api: cartuchosApi };
    await revisar(page, '62-catalogo-filtrado.png');

    // Búsqueda por código.
    await page.getByRole('group', { name: /tipo de producto/i }).getByRole('button', { name: /^\s*todos\s*$/i }).click();
    const objetivo = catalogoApi.find((c: any) => c.codigo === 'OPW-102INFC') ?? catalogoApi[0];
    await page.getByRole('searchbox', { name: /buscar por nombre o c[oó]digo/i }).fill(objetivo.codigo);
    await expect(conteo).toHaveText(/^\s*1 producto\b/);
    const tarjeta = page.locator('ul.catalogo-rejilla article').filter({ hasText: objetivo.nombre }).first();
    await expect(tarjeta).toBeVisible();
    await tarjeta.getByRole('button', { name: new RegExp(`agregar .* a mi lista`, 'i') }).click();
    await expect(tarjeta.getByRole('button', { name: /agregado/i })).toBeVisible();
    const lista = await leerGuardado(page, 'agua.lista');
    expect(Array.isArray(lista) && lista.some((a: any) => a.codigo === objetivo.codigo), 'Queda en Mi lista').toBe(true);
    await revisar(page, '63-catalogo-busqueda-agregado.png');
  });

  test('pedido confirmado: WhatsApp simulado con su rótulo "Simulación"', async ({ page }) => {
    const m = marca();
    const hogar = await crearHogar(page.request, {}, `${m} whatsapp`);
    const cartucho = await primerCartucho(page.request);
    expect(cartucho, 'El catálogo tiene al menos un cartucho').toBeTruthy();
    const pedido = await crearPedido(page.request, {
      hogar_id: hogar.id, tipo: 'cartucho', cartucho_codigo: cartucho!.codigo, cantidad: 1, modalidad: 'retiro', tienda_id: 'manongo',
    });
    await sembrarDispositivo(page.context(), hogar.id);
    try {
      actual = '73-pedido-whatsapp-simulado';
      await page.goto(`/pedido/${pedido.id}`);
      await expect(page.getByRole('heading', { name: /te escribimos por whatsapp/i }), 'El pedido muestra "Te escribimos por WhatsApp"').toBeVisible({ timeout: 15_000 });
      const wa = page.getByRole('status', { name: /whatsapp simulado de grimuca/i });
      await expect(wa, 'Tarjeta "WhatsApp simulado de Grimuca …"').toBeVisible();
      await expect(wa, 'Rótulo "Simulación"').toContainText(/simulaci[oó]n:\s*en la demo no se env[ií]a un whatsapp real/i);
      notas.whatsappPedido = (await wa.innerText()).replace(/\n+/g, ' | ');
      expect(notas.whatsappPedido as string).not.toMatch(/undefined|null|NaN|potable/i);
      await revisar(page, '73-pedido-whatsapp-simulado.png');
    } finally {
      // Que el pedido de prueba no quede pendiente en el Despacho de Grimuca (no se borra: se despacha).
      if (PIN_OPERADOR) {
        const token = await entrarOperador(page.request).catch(() => '');
        if (token) await page.request.post(`/api/operador/pedidos/${pedido.id}/despachar`, { headers: cabeceraOperador(token) }).catch(() => undefined);
      }
    }
  });

  test('tablero: "Registrar cambio de cartucho" guarda la fecha', async ({ page }) => {
    const m = marca();
    const hogar = await crearHogar(page.request, { tiene_filtro: true, etapas_filtro: 3, ultimo_cambio: 'mas_de_tres_meses' }, `${m} cartucho`);
    await sembrarDispositivo(page.context(), hogar.id);
    const fecha = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    actual = '74-registrar-cambio';
    await page.goto('/');
    const seccion = page.getByRole('region', { name: /^\s*tu cartucho\s*$/i });
    await expect(seccion, 'Con filtro, el tablero muestra "Tu cartucho"').toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /cerrar sesi[oó]n/i }), 'El tablero tiene "Cerrar sesión"').toBeVisible();
    await seccion.getByRole('button', { name: /registrar cambio de cartucho/i }).click();
    const formulario = seccion.getByRole('form', { name: /registrar cambio de cartucho/i });
    await formulario.getByLabel(/qu[eé] d[ií]a lo cambiaste/i).fill(fecha);
    const cual = formulario.getByRole('textbox', { name: /cu[aá]l cartucho cambiaste/i });
    if (await cual.count()) await cual.fill('Sedimentos');
    await formulario.getByRole('button', { name: /guardar el cambio/i }).click();
    await expect(seccion.getByText(/listo\. registramos el cambio/i), 'Confirma "Listo. Registramos el cambio…"').toBeVisible({ timeout: 15_000 });
    await expect(seccion.getByText(/simulaci[oó]n:/i).first(), 'WhatsApp simulado de la tienda con su rótulo').toBeVisible();
    await expect(seccion.getByRole('button', { name: /crear recordatorio de cambio de cartucho/i }), 'Ofrece el recordatorio del próximo cambio').toBeVisible();
    await revisar(page, '74-registrar-cambio.png');

    const guardado = await getJson(page.request, `/api/hogares/${hogar.id}`);
    notas.cambioRegistrado = { fecha_ultimo_cambio: guardado.fecha_ultimo_cambio, ultimo_cambio: guardado.ultimo_cambio, ultimo_cartucho: guardado.ultimo_cartucho };
    expect(String(guardado.fecha_ultimo_cambio ?? ''), 'La API guarda la fecha del cambio').toContain(fecha);
    expect.soft(guardado.ultimo_cambio, 'Hace 10 días → "menos de un mes"').toBe('menos_de_un_mes');
  });

  test('tutoriales, tutorial y experto: pantallas', async ({ page }) => {
    const m = marca();
    const hogar = await crearHogar(page.request, {}, `${m} tutoriales`);
    await sembrarDispositivo(page.context(), hogar.id);
    actual = '64-tutoriales';
    await page.goto('/tutoriales');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await revisar(page, '64-tutoriales.png');
    await page.getByRole('link', { name: /ver la gu[ií]a/i }).first().click();
    await expect(page).toHaveURL(/\/tutoriales\/[\w-]+/);
    actual = '65-tutorial';
    await revisar(page, '65-tutorial.png');
    await page.getByRole('link', { name: /no sabes hacerlo\? contrata a un experto/i }).click();
    await expect(page).toHaveURL(/\/experto/);
    actual = '66-experto';
    await expect(page.getByRole('button', { name: /pedir el servicio/i })).toBeVisible({ timeout: 15_000 });
    await revisar(page, '66-experto.png');
  });

  test('revisión en vivo: enlaces internos, "potable", desbordes y consola', async ({ page }) => {
    test.setTimeout(240_000);
    const m = marca();
    const hogar = await crearHogar(page.request, { tiene_filtro: true, etapas_filtro: 3, ultimo_cambio: 'no_me_acuerdo' }, `${m} enlaces`);
    const medicion = await medirManual(page.request, hogar.id, valoresTira(await obtenerTira(page.request), 50));
    await sembrarDispositivo(page.context(), hogar.id);
    const rutas = [
      '/', '/perfil', '/medir', '/medir/manual', `/resultado/${medicion.id}`, '/resultado/ultimo', '/resultados', '/lista',
      '/bacterias', '/tiendas', '/privacidad', '/terminos', '/catalogo', '/tutoriales', '/tutoriales/sedimentos',
      '/tutoriales/carbon', '/tutoriales/membrana', '/tutoriales/cuando', '/experto', '/mi-filtro', '/mi-filtro/manual',
    ];
    const enlaces = new Map<string, string>(); // href → pantalla donde se vio
    const potable: string[] = [];
    const desbordes: string[] = [];
    for (const ruta of rutas) {
      actual = ruta;
      await page.goto(ruta);
      await esperarPantalla(page);
      await page.waitForTimeout(500);
      const texto = await page.locator('body').innerText();
      if (/potable/i.test(texto)) potable.push(ruta);
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (desborde > 1) desbordes.push(`${ruta}: ${desborde} px`);
      const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) =>
        as.filter((a) => (a as HTMLElement).offsetParent !== null || a.getClientRects().length > 0).map((a) => a.getAttribute('href') ?? ''),
      );
      for (const h of hrefs) if (!enlaces.has(h)) enlaces.set(h, ruta);
    }
    const rotos: string[] = [];
    for (const [href, origen] of enlaces) {
      if (href.startsWith('/api')) continue;
      actual = `enlace ${href}`;
      await page.goto(href);
      await esperarPantalla(page);
      if (await page.getByRole('heading', { name: /p[aá]gina no encontrada/i }).count()) rotos.push(`${href} (visto en ${origen})`);
    }
    notas.enlacesRevisados = [...enlaces.keys()];
    notas.enlacesRotos = rotos;
    notas.potable = potable;
    notas.desbordes375 = desbordes;
    notas.erroresConsola = erroresConsola.length;
    expect.soft(potable, 'Ninguna pantalla dice "potable"').toEqual([]);
    expect.soft(desbordes, 'Sin desborde horizontal a 375 px').toEqual([]);
    expect.soft(rotos, 'Enlaces internos que dan "Página no encontrada"').toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Laptop del operador
// ---------------------------------------------------------------------------------------------
test.describe('Funciones nuevas · operador', () => {
  test.skip(({ isMobile }) => isMobile, 'El panel se prueba en la laptop.');
  test.skip(() => !PIN_OPERADOR, SIN_PIN);
  test.describe.configure({ retries: 0 });
  test.afterEach(({}, info) => { if (info.status !== 'skipped') guardarRegistro(info, 'escritorio-07'); });

  test('experto: "Pedir el servicio" aparece en Despacho en vivo con "Servicio técnico" y "Atendido" lo cierra', async ({ page, browser }) => {
    test.skip(SOLO_LECTURA, AVISO_SOLO_LECTURA);
    test.setTimeout(150_000);
    escucharConsola(page, () => 'despacho');
    await entrarAlPanel(page);
    await abrirPestana(page, 'Despacho');
    await expect(page.getByText(/en vivo/i).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    const urlAntes = page.url();
    await page.evaluate(() => ((window as any).__sinRecargar = true));

    const m = marca();
    const direccion = `Calle Inventada ${m}, casa servicio`;
    const telefono = await browser.newContext({ ...CONTEXTO_MOVIL, ...REGION, baseURL: test.info().project.use.baseURL });
    const movil = await telefono.newPage();
    escucharConsola(movil, () => 'experto');
    try {
      const hogar = await crearHogar(movil.request, { direccion }, `${m} servicio`);
      await sembrarDispositivo(telefono, hogar.id);
      await movil.goto('/tutoriales/sedimentos');
      await movil.getByRole('link', { name: /no sabes hacerlo\? contrata a un experto/i }).click();
      await expect(movil).toHaveURL(/\/experto/);
      const pedir = movil.getByRole('button', { name: /pedir el servicio/i });
      await expect(pedir).toBeVisible({ timeout: 15_000 });
      await expect(movil.getByRole('textbox', { name: /^\s*direcci[oó]n/i })).toHaveValue(direccion);

      const fila = page.locator('li.g-fila-pedido').filter({ hasText: m });
      const desde = Date.now();
      await pedir.click();
      await expect(fila, 'El pedido de servicio debe aparecer en Despacho sin recargar').toBeVisible({ timeout: 15_000 });
      tiempos.servicioAparicionSegundos = (Date.now() - desde) / 1000;
      test.info().annotations.push({ type: 'tiempo de aparición del servicio', description: `${tiempos.servicioAparicionSegundos.toFixed(1)} s` });
      await expect(fila.getByText(/^\s*servicio t[eé]cnico\s*$/i), 'Insignia "Servicio técnico"').toBeVisible();
      expect(await page.evaluate(() => (window as any).__sinRecargar), 'La página no se recargó').toBe(true);
      expect(page.url()).toBe(urlAntes);
      notas.filaServicio = await fila.innerText();

      await expect(movil).toHaveURL(/\/pedido\/\d+/);
      const pedidoId = movil.url().split('/').pop();
      await esperarPantalla(movil);
      await movil.screenshot({ path: path.join(CARPETA, '67-pedido-servicio.png'), fullPage: true, scale: 'css' });
      notas.pantallaPedidoServicio = (await movil.locator('main').innerText()).slice(0, 600);
      await fila.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(CARPETA, '68-despacho-servicio-tecnico.png'), scale: 'css' });

      const api = await (await movil.request.get(`/api/pedidos/${pedidoId}`)).json();
      notas.pedidoServicioApi = { id: api.id, tipo: api.tipo, servicio: api.servicio, estado: api.estado, tienda_id: api.tienda_id, fecha_preferida: api.fecha_preferida };
      expect(api.tipo).toBe('servicio');

      await fila.getByRole('button', { name: /atendido/i }).click();
      // 22 nov: al despachar sale un aviso "WhatsApp simulado enviado a <hogar>" (dura unos 6 s).
      const avisoWa = page.getByText(/whatsapp simulado enviado a/i).first();
      await expect.soft(avisoWa, 'Despacho muestra "WhatsApp simulado enviado a …"').toBeVisible({ timeout: 5_000 });
      notas.avisoWhatsAppDespacho = await avisoWa.innerText().catch(() => null);
      await expect(fila, '"Atendido" lo saca de pendientes').toHaveCount(0, { timeout: 10_000 });
      const despues = await (await movil.request.get(`/api/pedidos/${pedidoId}`)).json();
      notas.estadoTrasAtendido = despues.estado;
      expect(despues.estado).toBe('despachado');
    } finally {
      await telefono.close();
    }
  });

  test('mapa de zonas: vistas, detalle de La Begoña, cifras y desbordes', async ({ page, request }) => {
    test.setTimeout(120_000);
    escucharConsola(page, () => 'zonas');
    await entrarAlPanel(page);
    await abrirPestana(page, 'Zonas');
    const nombreMapa = /mapa de resultados de la tira por urbanizaci[oó]n/i;
    const mapa = page.getByRole('group', { name: nombreMapa }).or(page.getByRole('region', { name: nombreMapa })).first();
    await expect(mapa).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('list', { name: /leyenda del mapa/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /alertas por zona/i })).toBeVisible();
    await page.waitForTimeout(800);
    await revisar(page, '69-zonas-calidad.png', { movil: false, desborde: true });

    // Cifras de arriba contra la API.
    const token = await entrarOperador(request);
    const datos: any[] = await (await request.get('/api/operador/mapa', { headers: cabeceraOperador(token) })).json();
    const alertasApi: any[] = await (await request.get('/api/operador/zonas', { headers: cabeceraOperador(token) })).json();
    const tablero = datos.filter((u) => u.en_tablero);
    const esperado = {
      conClientes: tablero.filter((u) => u.hogares > 0).length,
      enAlerta: datos.filter((u) => u.alerta).length,
      porCaptar: tablero.filter((u) => u.estado === 'sin_clientes').length,
    };
    const banda = await page.getByRole('region', { name: /cifras del mapa/i }).or(page.getByLabel(/cifras del mapa/i)).first().innerText();
    const numeros = (banda.match(/\d+/g) ?? []).map(Number);
    notas.cifras = { pantalla: banda.replace(/\s+/g, ' '), esperado, urbanizaciones: datos.length, enTablero: tablero.length, hogaresTotales: datos.reduce((s, u) => s + u.hogares, 0) };
    notas.alertasZona = alertasApi.map((z) => `${z.zona}: ${z.hogares_en_rojo_7_dias} en rojo, alerta ${z.alerta}`);
    expect(numeros.slice(0, 3), 'Las cifras de arriba cuadran con /api/operador/mapa').toEqual([esperado.conClientes, esperado.enAlerta, esperado.porCaptar]);

    // Vista de clientes.
    await page.getByRole('group', { name: /vista del mapa/i }).getByRole('button', { name: /^\s*clientes\s*$/i }).click();
    const nombreClientes = /mapa de clientes por urbanizaci[oó]n/i;
    await expect(page.getByRole('group', { name: nombreClientes }).or(page.getByRole('region', { name: nombreClientes })).first()).toBeVisible();
    await revisar(page, '70-zonas-clientes.png', { movil: false, desborde: true });

    // Detalle de La Begoña (en la vista de calidad).
    await page.getByRole('group', { name: /vista del mapa/i }).getByRole('button', { name: /resultados de la tira/i }).click();
    const begona = datos.find((u) => u.nombre === 'La Begoña');
    notas.laBegonaApi = begona;
    await page.getByRole('button', { name: /^La Bego[ñn]a,/ }).click();
    const detalle = page.getByRole('complementary', { name: /detalle de la bego[ñn]a/i });
    await expect(detalle).toBeVisible();
    notas.laBegonaDetalle = (await detalle.innerText()).replace(/\n+/g, ' | ');
    expect(begona?.alerta, 'Con los datos sembrados La Begoña está en alerta').toBe(true);
    await expect(
      detalle.getByText(/varios hogares de la zona tienen casillas en rojo esta semana/i),
      'El detalle muestra la alerta',
    ).toBeVisible();
    await expect(detalle).toContainText(String(begona.hogares_en_rojo_7_dias));
    await revisar(page, '71-zonas-detalle-la-begona.png', { movil: false, desborde: true });

    const desborde1366 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(800);
    const desborde375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await revisar(page, '72-zonas-375.png', { movil: false, desborde: true });
    await page.setViewportSize({ width: 1366, height: 768 });
    notas.desborde = { a1366: desborde1366, a375: desborde375 };
    expect.soft(desborde1366, 'Sin desborde horizontal a 1366 px').toBeLessThanOrEqual(1);
    expect.soft(desborde375, 'Sin desborde horizontal a 375 px').toBeLessThanOrEqual(1);
    expect.soft(hallazgos.filter((h) => h.tipo === 'potable')).toEqual([]);
  });
});

