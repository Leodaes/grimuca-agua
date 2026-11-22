import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  AVISO_FIJO,
  AVISO_SOLO_LECTURA,
  PIN_OPERADOR,
  PIN_SUPERADMIN,
  PIN_TECNICO,
  SIN_PINES_RED,
  SOLO_LECTURA,
  marca,
  obtenerTira,
  planDeValores,
} from './apoyo/datos';
import { CONTEXTO_ESCRITORIO, CONTEXTO_MOVIL, REGION } from './apoyo/dispositivos';
import { abrirPestana, accion, elegirNivel, entrarAlPanel, escribirPin, leerGuardado } from './apoyo/pagina';
import { filtroAMano, llenarPerfil } from './apoyo/perfil';

/**
 * Ensayo cronometrado de la demo (docs/marketing/guion-demo.md), contra el sitio publicado,
 * en el orden del guion y con cuatro contextos: Red y Comercio Grimuca en la laptop (1366×768),
 * Cliente y Técnico en teléfono (375×812).
 *
 * Mide lo que tarda la APP en cada tramo (desde el toque hasta que se ve lo que el guion promete;
 * no cuenta lo que se habla). Guarda una captura por tramo en docs/calidad/ensayo/NN-tramo.png,
 * copia la secuencia a docs/calidad/ensayo/respaldo/ y graba video del teléfono del cliente y de
 * la laptop del comercio (y de la red y el técnico) en docs/calidad/ensayo/respaldo/.
 * El registro (tiempos, lo que se vio, diferencias con el guion) va a docs/calidad/ensayo/ensayo.json.
 *
 * Datos que deja (todos con "Prueba Calidad <marca>" en el hogar): 1 hogar con su filtro, 1 medición
 * por foto (y 1 manual si la foto falla o tarda más de 15 s), 1 pedido de cartucho con envío
 * (se despacha en el tramo 4, como dice el guion) y 1 servicio técnico atendido con foto y nota.
 * No crea productos ni comercios.
 *
 * Corre solo en el proyecto `escritorio`. Ningún PIN ni token se imprime ni se adjunta.
 */

const RAIZ = path.resolve(__dirname, '../..');
const ENSAYO = path.join(RAIZ, 'docs/calidad/ensayo');
const RESPALDO = path.join(ENSAYO, 'respaldo');
const VIDEO_TMP = path.join(__dirname, '../test-results/ensayo-video');
const FOTO_TIRA = path.join(RAIZ, 'docs/calibracion/tira-ejemplo.jpg');
const FOTO_TRABAJO = path.join(RAIZ, 'docs/marketing/imagenes/02-botellones.jpg');
const LIMITE_FOTO_MS = 15_000;
fs.mkdirSync(RESPALDO, { recursive: true });

interface Tramo {
  n: string;
  bloque: string;
  titulo: string;
  ms: number | null;
  estado: 'PASA' | 'NO PASA';
  detalle: string;
  vio: Record<string, unknown>;
}
const tramos: Tramo[] = [];
const diferencias: string[] = [];
const capturas: string[] = [];

function corto(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error);
  return texto.replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 3).join(' · ').slice(0, 400);
}

/** Corre un tramo, mide su tiempo de app (lo que devuelve el cuerpo, o el total) y anota si pasó. */
async function tramo(n: string, bloque: string, titulo: string, cuerpo: (vio: Record<string, unknown>) => Promise<number | void>) {
  await test.step(`${n}. ${titulo}`, async () => {
    const vio: Record<string, unknown> = {};
    const antes = test.info().errors.length;
    const desde = Date.now();
    let ms: number | null = null;
    let estado: Tramo['estado'] = 'PASA';
    let detalle = 'ok';
    try {
      const medido = await cuerpo(vio);
      ms = typeof medido === 'number' ? medido : Date.now() - desde;
      const blandos = test.info().errors.slice(antes);
      if (blandos.length) {
        estado = 'NO PASA';
        detalle = blandos.map((e) => corto(e.message)).join(' | ');
      }
    } catch (error) {
      estado = 'NO PASA';
      detalle = corto(error);
      vio.msHastaFallar = Date.now() - desde;
    }
    tramos.push({ n, bloque, titulo, ms, estado, detalle, vio });
    test.info().annotations.push({ type: `tramo ${n}`, description: `${ms === null ? '—' : (ms / 1000).toFixed(1) + ' s'} · ${estado} · ${titulo}` });
  });
}

/** Cronometra una espera de la app. */
async function reloj(fn: () => Promise<unknown>): Promise<number> {
  const d = Date.now();
  await fn();
  return Date.now() - d;
}

async function captura(page: Page, nombre: string, opciones: { completa?: boolean } = {}) {
  const archivo = path.join(ENSAYO, nombre);
  await page.screenshot({ path: archivo, fullPage: opciones.completa ?? false, scale: 'css' }).catch(() => undefined);
  if (fs.existsSync(archivo)) capturas.push(nombre);
}

async function cifras(page: Page, etiqueta: string): Promise<Record<string, string>> {
  const banda = page.locator(`dl[aria-label="${etiqueta}"]`);
  await expect(banda).toBeVisible({ timeout: 20_000 });
  return banda.locator('.g-banda-cifras__cifra').evaluateAll((cs) =>
    Object.fromEntries(cs.map((c) => [(c.querySelector('dt')?.textContent ?? '').trim(), (c.querySelector('dd')?.textContent ?? '').trim()])),
  );
}
const num = (t: string | undefined) => Number(String(t ?? '').replace(/[^\d]/g, '')) || 0;
/** La etiqueta de una cifra puede traer su detalle pegado ("Entregas con envíoincluye…"): se busca por el comienzo. */
const cifra = (c: Record<string, string>, comienzo: string) => num(Object.entries(c).find(([k]) => k.startsWith(comienzo))?.[1]);

function filaPedido(page: Page, hogar: string): Locator {
  return page.locator('li.g-fila-pedido').filter({ hasText: hogar });
}

test.describe('Ensayo de la demo · guion de 3 minutos', () => {
  test.skip(({ isMobile }) => isMobile, 'El ensayo abre sus propios contextos de teléfono: corre en escritorio.');
  test.skip(() => !PIN_OPERADOR || !PIN_SUPERADMIN || !PIN_TECNICO, SIN_PINES_RED);
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);
  test.describe.configure({ retries: 0 });

  test('el guion, tramo por tramo, cronometrado', async ({ browser, request, baseURL }) => {
    test.setTimeout(600_000);
    const m = marca();
    const nombreHogar = `Prueba Calidad ${m} ensayo`;
    const direccion = `Calle Inventada ${m}, casa 00, El Naranjal`;
    const datosCreados: string[] = [];

    fs.rmSync(VIDEO_TMP, { recursive: true, force: true });
    const abiertos: Array<{ contexto: BrowserContext; nombre: string; video: boolean }> = [];
    const nuevo = async (tipo: 'escritorio' | 'movil', nombre: string) => {
      const dispositivo = tipo === 'movil' ? CONTEXTO_MOVIL : CONTEXTO_ESCRITORIO;
      const contexto = await browser.newContext({
        ...dispositivo,
        ...REGION,
        baseURL,
        recordVideo: { dir: path.join(VIDEO_TMP, nombre), size: dispositivo.viewport },
      });
      abiertos.push({ contexto, nombre, video: true });
      return contexto;
    };

    // Contexto R (red), A (comercio Grimuca), C (cliente), D (técnico).
    const ctxRed = await nuevo('escritorio', 'red');
    const ctxComercio = await nuevo('escritorio', 'comercio');
    const ctxCliente = await nuevo('movil', 'cliente');
    const ctxTecnico = await nuevo('movil', 'tecnico');
    const red = await ctxRed.newPage();
    const comercio = await ctxComercio.newPage();
    const telefono = await ctxCliente.newPage();
    const tecnico = await ctxTecnico.newPage();
    const errores: string[] = [];
    for (const [p, n] of [[red, 'red'], [comercio, 'comercio'], [telefono, 'cliente'], [tecnico, 'tecnico']] as const) {
      p.on('pageerror', (e) => errores.push(`${n}: ${e.message.slice(0, 200)}`));
    }

    let redAntes: Record<string, string> = {};
    let rutasAntes: Record<string, string> = {};
    let rutasPestana: Page | null = null;
    let pedidoId = '';
    let servicioId = '';
    let desdeHacerPedido = 0;
    let comercioRutasRow = '';

    try {
      // ================================================================ Antes de subir
      await tramo('00', 'Antes de subir', '/modulos: las cuatro tarjetas', async (vio) => {
        const ms = await reloj(async () => {
          await red.goto('/modulos');
          await expect(red.locator('a.mod-tarjeta')).toHaveCount(4, { timeout: 20_000 });
        });
        vio.tarjetas = (await red.locator('a.mod-tarjeta').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').slice(0, 80));
        await captura(red, '00-modulos.png');
        return ms;
      });

      await tramo('00b', 'Antes de subir', 'Entrar con PIN en /red, /comercio y /tecnico (se hace antes de subir)', async (vio) => {
        const d = Date.now();
        await escribirPin(red, '/red', PIN_SUPERADMIN);
        await expect(red.getByRole('heading', { level: 1, name: /comercios de la red/i })).toBeVisible({ timeout: 20_000 });
        vio.redMs = Date.now() - d;
        const d2 = Date.now();
        await entrarAlPanel(comercio);
        await abrirPestana(comercio, 'Despacho');
        vio.comercioMs = Date.now() - d2;
        const d3 = Date.now();
        await escribirPin(tecnico, '/tecnico', PIN_TECNICO);
        await expect(tecnico.getByRole('heading', { level: 1, name: /servicios asignados/i })).toBeVisible({ timeout: 20_000 });
        vio.tecnicoMs = Date.now() - d3;
        return Date.now() - d;
      });

      // ================================================================ Bloque 1
      await tramo('01', 'Bloque 1 · La Red', '/red: comercios con plan y membresía, cifras de la red', async (vio) => {
        // En tarima la pestaña ya está abierta; se mide una recarga (peor caso: alguien la recargó).
        const ms = await reloj(async () => {
          await red.reload();
          redAntes = await cifras(red, 'Cifras de la red');
          await expect(red.locator('table[aria-label="Comercios de la red"] tbody tr').first()).toBeVisible();
        });
        vio.cifras = redAntes;
        vio.comercios = (await red.locator('table[aria-label="Comercios de la red"] tbody tr').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
        vio.enVivo = await red.getByText(/en vivo/i).first().isVisible().catch(() => false);
        const filas = vio.comercios as string[];
        const conPeriodoGratis = filas.filter((f) => /periodo gratis/i.test(f)).length;
        vio.conPeriodoGratis = conPeriodoGratis;
        if (conPeriodoGratis < filas.length) {
          diferencias.push(`Bloque 1: el guion dice "cada uno con su plan y su periodo gratis", pero solo ${conPeriodoGratis} de ${filas.length} comercios está en periodo gratis (Grimuca sale "Activa" y Aliado Aragua "Vencida").`);
        }
        await captura(red, '01-red.png');
        return ms;
      });

      // ================================================================ Bloque 2
      await tramo('02a', 'Bloque 2 · Comercio', 'Despacho de Grimuca, filtro en Mañongo', async (vio) => {
        const ms = await reloj(async () => {
          await abrirPestana(comercio, 'Despacho');
          await expect(comercio.getByText(/^\s*en vivo\s*$/i).first()).toBeVisible({ timeout: 20_000 });
          await comercio.getByRole('button', { name: /^\s*ma[ñn]ongo\s*$/i }).first().click();
          await expect(comercio.getByRole('heading', { level: 1, name: /^\s*despacho\s*$/i })).toBeVisible();
        });
        await comercio.waitForTimeout(800);
        const filas = await comercio.locator('li.g-fila-pedido').count();
        vio.filasPendientesManongo = filas;
        vio.porDespachar = await comercio.getByText(/\d+ por despachar/i).first().innerText().catch(() => '');
        if (filas > 0) diferencias.push(`Bloque 2: el guion dice "El despacho está vacío", pero Despacho de Grimuca (Mañongo) muestra ${filas} pedidos pendientes de la semilla.`);
        await captura(comercio, '02a-comercio-despacho.png');
        return ms;
      });

      await tramo('02b', 'Bloque 2 · Comercio', 'Inventario: faltantes de los próximos 30 días en rojo', async (vio) => {
        const ms = await reloj(async () => {
          await abrirPestana(comercio, 'Inventario');
          await expect(comercio.getByRole('heading', { level: 1, name: /inventario/i })).toBeVisible();
          await expect(comercio.locator('table tbody tr').first()).toBeVisible({ timeout: 20_000 });
        });
        vio.insigniasFaltan = await comercio.getByText(/^\s*faltan \d+\s*$/i).count();
        vio.avisos = (await comercio.getByText(/faltan \d+ cartuchos en/i).allInnerTexts()).slice(0, 3);
        expect.soft(vio.insigniasFaltan as number, 'Inventario muestra faltantes en rojo').toBeGreaterThan(0);
        await captura(comercio, '02b-comercio-inventario.png');
        return ms;
      });

      await tramo('02c', 'Bloque 2 · Comercio', 'Zonas: mapa por urbanización (resultados de la tira)', async (vio) => {
        let msMapa = 0;
        const ms = await reloj(async () => {
          await abrirPestana(comercio, 'Zonas');
          await cifras(comercio, 'Cifras del mapa');
          msMapa = await reloj(async () => {
            await expect
              .poll(
                async () =>
                  (await comercio.locator('img.leaflet-tile-loaded').count()) > 0 ||
                  (await comercio.getByText(/sin mapa de fondo/i).count()) > 0,
                { timeout: 20_000 },
              )
              .toBe(true);
          });
        });
        vio.cifras = await cifras(comercio, 'Cifras del mapa');
        vio.teselas = await comercio.locator('img.leaflet-tile-loaded').count();
        vio.sinFondo = (await comercio.getByText(/sin mapa de fondo/i).count()) > 0;
        vio.msTeselas = msMapa;
        await comercio.waitForTimeout(1200);
        await captura(comercio, '02c-comercio-zonas-mapa.png');
        return ms;
      });

      await tramo('02d', 'Bloque 2 · Comercio', 'Productos: un segundo en la tabla', async (vio) => {
        const ms = await reloj(async () => {
          await abrirPestana(comercio, 'Productos');
          await expect(comercio.locator('table[aria-label="Productos del comercio"] tbody tr').first()).toBeVisible({ timeout: 20_000 });
        });
        vio.productos = await comercio.locator('table[aria-label="Productos del comercio"] tbody tr').count();
        await captura(comercio, '02d-comercio-productos.png');
        return ms;
      });

      await tramo('02e', 'Bloque 2 · Comercio (fuera del guion)', 'Rutas: una ruta por tienda (pestaña aparte, queda abierta)', async (vio) => {
        rutasPestana = await ctxComercio.newPage();
        const ms = await reloj(async () => {
          await rutasPestana!.goto('/comercio/rutas');
          rutasAntes = await cifras(rutasPestana!, 'Cifras de las rutas');
        });
        vio.cifras = rutasAntes;
        await rutasPestana.waitForTimeout(1500);
        await captura(rutasPestana, '02e-comercio-rutas.png');
        await comercio.bringToFront();
        await abrirPestana(comercio, 'Despacho');
        await comercio.getByRole('button', { name: /^\s*ma[ñn]ongo\s*$/i }).first().click();
        await comercio.evaluate(() => ((window as any).__e2eSinRecargar = true));
        return ms;
      });

      // ================================================================ Bloque 3
      await tramo('03a', 'Bloque 3 · Cliente', 'Portada → "Ya tengo mi sobre"', async (vio) => {
        const ms = await reloj(async () => {
          await telefono.goto('/');
          await expect(telefono.getByRole('heading', { level: 1, name: /descubre la calidad del agua/i })).toBeVisible({ timeout: 20_000 });
        });
        vio.botones = (await telefono.locator('.p-hero__acciones').getByRole('link').allInnerTexts()).map((t) => t.trim());
        await captura(telefono, '03a-cliente-portada.png');
        const ms2 = await reloj(async () => {
          await telefono.locator('.p-hero__acciones').getByRole('link', { name: /^\s*ya tengo mi sobre\s*$/i }).click();
          await expect(telefono).toHaveURL(/\/perfil\?ya=1/);
          await expect(telefono.getByRole('textbox', { name: /c[oó]mo te llamas/i })).toBeVisible();
        });
        return ms + ms2;
      });

      await tramo('03b', 'Bloque 3 · Cliente (antes de subir)', 'Perfil: familia de 4 en Naguanagua, filtro de 3 etapas', async (vio) => {
        const d = Date.now();
        await llenarPerfil(telefono, { nombre: nombreHogar, zona: /naguanagua/i, urbanizacion: /el naranjal/i, personas: 4, mascotas: false, filtro: true, whatsapp: '0412 000 0000' });
        await captura(telefono, '03b-cliente-perfil.png');
        await telefono.getByRole('button', { name: /^\s*continuar\s*$/i }).click();
        await expect(telefono).toHaveURL(/\/mi-filtro/, { timeout: 20_000 });
        datosCreados.push(`hogar "${nombreHogar}"`);
        await filtroAMano(telefono, /^\s*tres vasos/i);
        await expect(telefono).toHaveURL(/\/medir\/?$/, { timeout: 20_000 });
        vio.hogarId = String((await leerGuardado(telefono, 'agua.hogar_id')) ?? '');
        datosCreados.push('su filtro "Tres vasos"');
        return Date.now() - d;
      });

      let porFoto = false;
      await tramo('03c', 'Bloque 3 · Cliente', 'Medir con foto: "Elegir una foto del teléfono" → "Leer mi tira" → resultado', async (vio) => {
        await expect(telefono.getByRole('heading', { level: 1, name: /c[oó]mo medir tu agua/i })).toBeVisible();
        await captura(telefono, '03c-cliente-medir.png');
        await telefono.locator('input[aria-label="Elegir una foto de la tira"]').setInputFiles(FOTO_TIRA);
        await expect(telefono.getByRole('heading', { name: /se ve bien/i })).toBeVisible();
        await captura(telefono, '03d-cliente-foto-se-ve-bien.png');
        const d = Date.now();
        await telefono.getByRole('button', { name: /^\s*leer mi tira\s*$/i }).click();
        const hallado = await Promise.race([
          telefono.waitForURL(/\/resultado\/[\w-]+/, { timeout: 60_000 }).then(() => 'resultado'),
          telefono.getByRole('heading', { name: /no pudimos leer bien la foto/i }).waitFor({ timeout: 60_000 }).then(() => 'no_legible'),
          telefono.getByText(/^\s*(no se pudo leer la foto|no hay conexi[oó]n)\s*$/i).first().waitFor({ timeout: 60_000 }).then(() => 'error'),
        ]).catch(() => 'tiempo agotado (60 s)');
        const ms = Date.now() - d;
        vio.lectura = hallado;
        vio.msLectura = ms;
        if (hallado === 'resultado') {
          await expect(telefono.getByText(AVISO_FIJO)).toBeVisible({ timeout: 20_000 });
          porFoto = true;
          datosCreados.push('1 medición por foto');
        } else {
          await captura(telefono, '03e-cliente-foto-no-leida.png');
          throw new Error(`La foto no llegó al resultado: ${hallado} en ${(ms / 1000).toFixed(1)} s`);
        }
        if (ms > LIMITE_FOTO_MS) vio.lenta = true;
        return ms;
      });

      const lecturaLenta = !porFoto || Boolean(tramos.find((t) => t.n === '03c')?.vio.lenta);
      if (lecturaLenta) {
        await tramo('03c2', 'Bloque 3 · Cliente (plan B)', 'Carga manual de colores → resultado', async (vio) => {
          await telefono.goto('/medir/manual');
          const tira = await obtenerTira(request);
          const plan = planDeValores(tira);
          const valores = { ...plan.valores, nitrato: 50 };
          await expect(telefono.getByRole('button', { name: /ver mi resultado/i })).toBeVisible();
          for (const p of tira) if (valores[p.clave] !== undefined) await elegirNivel(telefono, p.nombre, valores[p.clave]);
          const ms = await reloj(async () => {
            await telefono.getByRole('button', { name: /ver mi resultado/i }).click();
            await expect(telefono).toHaveURL(/\/resultado\/[\w-]+/, { timeout: 20_000 });
            await expect(telefono.getByText(AVISO_FIJO)).toBeVisible({ timeout: 20_000 });
          });
          vio.casillas = Object.keys(valores).length;
          datosCreados.push('1 medición manual');
          return ms;
        });
      }

      await tramo('03e', 'Bloque 3 · Cliente', 'Resultado: semáforo por casilla, aviso fijo y "Por qué te lo recomendamos"', async (vio) => {
        const ms = await reloj(async () => {
          await expect(telefono.getByRole('heading', { name: /lo que te recomendamos/i })).toBeVisible({ timeout: 20_000 });
          await expect(telefono.getByText(/por qu[eé] te lo recomendamos/i).first()).toBeVisible();
        });
        const texto = await telefono.locator('main').innerText();
        vio.verde = (texto.match(/\bVerde\b/g) ?? []).length;
        vio.amarillo = (texto.match(/\bAmarillo\b/g) ?? []).length;
        vio.rojo = (texto.match(/\bRojo\b/g) ?? []).length;
        vio.avisoFijo = await telefono.getByText(AVISO_FIJO).isVisible();
        const mejor = telefono.locator('article.g-tarjeta-producto--destacado').first();
        vio.primerSugerido = (await mejor.locator('.g-tarjeta-producto__nombre').innerText().catch(() => '')).trim();
        vio.porque = await mejor.locator('.producto-porque__frase').innerText().catch(() => '');
        await telefono.evaluate(() => window.scrollTo(0, 0));
        await captura(telefono, '03f-cliente-resultado-semaforo.png');
        const casillas = telefono.getByRole('heading', { name: /casilla por casilla/i }).first();
        await casillas.evaluate((e) => e.scrollIntoView({ block: 'start' })).catch(() => undefined);
        await telefono.evaluate(() => window.scrollBy(0, -70));
        await captura(telefono, '03g-cliente-casilla-por-casilla.png');
        await mejor.scrollIntoViewIfNeeded();
        await captura(telefono, '03h-cliente-por-que-te-lo-recomendamos.png');
        await captura(telefono, '03-resultado-completo.png', { completa: true });
        return ms;
      });

      await tramo('03i', 'Bloque 3 · Cliente', '"Agregar a mi lista" → Mi lista → "Envío a mi dirección" → "Hacer pedido"', async (vio) => {
        const mejor = telefono.locator('article.g-tarjeta-producto--destacado').first();
        let ms = await reloj(async () => {
          await mejor.getByRole('button', { name: /agregar a mi lista/i }).click();
          await expect(mejor.getByRole('button', { name: /^\s*agregado\s*$/i })).toBeVisible();
        });
        const acceso = telefono.getByRole('navigation').getByRole('link', { name: /mi lista/i }).first();
        vio.accesoMiListaVisible = await acceso.isVisible().catch(() => false);
        ms += await reloj(async () => {
          if (vio.accesoMiListaVisible) await acceso.click();
          else await telefono.goto('/lista');
          await expect(telefono.getByRole('button', { name: /^\s*hacer pedido\s*$/i })).toBeVisible({ timeout: 20_000 });
        });
        await telefono.getByRole('button', { name: /env[ií]o a mi direcci[oó]n/i }).click();
        const campo = telefono.getByRole('textbox', { name: /direcci[oó]n de entrega/i });
        vio.direccionPrellenada = await campo.inputValue();
        await campo.fill(direccion);
        await captura(telefono, '03i-cliente-mi-lista.png');
        desdeHacerPedido = Date.now();
        ms += await reloj(async () => {
          await telefono.getByRole('button', { name: /^\s*hacer pedido\s*$/i }).click();
          await expect(telefono).toHaveURL(/\/pedido\/\d+/, { timeout: 20_000 });
          await expect(telefono.getByRole('heading', { level: 1 })).toBeVisible();
        });
        pedidoId = telefono.url().split('?')[0].split('/').pop() ?? '';
        vio.pedidoId = pedidoId;
        vio.titulo = await telefono.getByRole('heading', { level: 1 }).innerText();
        const api = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
        vio.pedido = { tienda: api.tienda_id, modalidad: api.modalidad, cartucho: api.cartucho_codigo };
        datosCreados.push(`1 pedido de cartucho con envío (N.º ${pedidoId})`);
        await captura(telefono, '03j-cliente-pedido-confirmado.png');
        return ms;
      });

      // ================================================================ Bloque 4
      await tramo('04a', 'Bloque 4 · MOMENTO CLAVE', 'El pedido aparece en Despacho sin recargar, con "Nuevo"', async (vio) => {
        const fila = filaPedido(comercio, nombreHogar);
        await expect(fila, 'El pedido entra en Despacho (Mañongo)').toBeVisible({ timeout: 15_000 });
        const ms = Date.now() - desdeHacerPedido;
        vio.sinRecargar = await comercio.evaluate(() => (window as any).__e2eSinRecargar === true);
        vio.conNuevo = /nuevo/i.test(await fila.innerText());
        vio.posicion = (await comercio.locator('li.g-fila-pedido').allInnerTexts()).findIndex((t) => t.includes(nombreHogar)) + 1;
        vio.fila = (await fila.innerText()).replace(/\s+/g, ' ');
        vio.pestana = await comercio.getByRole('link', { name: /^\s*despacho/i }).first().innerText().catch(() => '');
        expect.soft(vio.sinRecargar, 'Despacho no se recargó').toBe(true);
        expect.soft(vio.conNuevo, 'La fila llega con "Nuevo"').toBe(true);
        if (vio.posicion !== 1) diferencias.push(`Bloque 4: el guion dice que el pedido aparece "arriba"; en Despacho (Mañongo) quedó en la posición ${vio.posicion}.`);
        await fila.scrollIntoViewIfNeeded();
        await captura(comercio, '04a-comercio-pedido-en-vivo.png');
        return ms; // desde "Hacer pedido" en el teléfono
      });

      await tramo('04b', 'Bloque 4 · (fuera del guion)', 'La ruta se recalcula sola en la pestaña Rutas', async (vio) => {
        const p = rutasPestana!;
        const antes = cifra(rutasAntes, 'Entregas con envío');
        expect(antes, 'Rutas tenía entregas antes del pedido').toBeGreaterThan(0);
        const ms = await reloj(async () => {
          await expect.poll(async () => cifra(await cifras(p, 'Cifras de las rutas'), 'Entregas con envío'), { timeout: 15_000 }).toBeGreaterThan(antes);
        });
        vio.antes = rutasAntes;
        vio.despues = await cifras(p, 'Cifras de las rutas');
        comercioRutasRow = JSON.stringify(vio.despues);
        await p.bringToFront();
        await p.waitForTimeout(1000);
        await captura(p, '04b-comercio-rutas-recalculada.png');
        await comercio.bringToFront();
        vio.msDesdeHacerPedido = Date.now() - desdeHacerPedido;
        return ms;
      });

      await tramo('04c', 'Bloque 4 · MOMENTO CLAVE', 'Toca "Despachado"', async (vio) => {
        const fila = filaPedido(comercio, nombreHogar);
        const ms = await reloj(async () => {
          await fila.first().getByRole('button', { name: /despachado/i }).click();
          await expect(fila).toHaveCount(0, { timeout: 15_000 });
        });
        const api = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
        vio.estado = api.estado;
        await captura(comercio, '04c-comercio-despachado.png');
        return ms;
      });

      // ================================================================ Bloque 5
      await tramo('05a', 'Bloque 5 · Técnico', 'El cliente pide un técnico ("¿No sabes hacerlo? Contrata a un experto" → "Pedir el servicio")', async (vio) => {
        const enlace = telefono.getByRole('link', { name: /contrata a un experto/i });
        vio.enlaceEnPedido = await enlace.isVisible().catch(() => false);
        let ms = await reloj(async () => {
          if (vio.enlaceEnPedido) await enlace.click();
          else await telefono.goto('/experto');
          await expect(telefono.getByRole('button', { name: /^\s*pedir el servicio\s*$/i })).toBeVisible({ timeout: 20_000 });
        });
        const campo = telefono.getByRole('textbox', { name: /^\s*direcci[oó]n/i });
        vio.direccionPrellenada = (await campo.inputValue()).length > 0;
        if (!vio.direccionPrellenada) await campo.fill(direccion);
        vio.servicioElegido = await telefono.getByRole('radio', { checked: true }).first().evaluate((e) => (e as HTMLInputElement).labels?.[0]?.innerText ?? '').catch(() => '');
        await captura(telefono, '05a-cliente-pide-tecnico.png');
        const fila = filaPedido(comercio, nombreHogar).filter({ hasText: /servicio t[eé]cnico/i });
        const d = Date.now();
        await telefono.getByRole('button', { name: /^\s*pedir el servicio\s*$/i }).click();
        await expect(telefono).toHaveURL(/\/pedido\/\d+/, { timeout: 20_000 });
        ms += Date.now() - d;
        servicioId = telefono.url().split('?')[0].split('/').pop() ?? '';
        datosCreados.push(`1 servicio técnico (N.º ${servicioId})`);
        await expect.soft(fila, 'El servicio entra en vivo en Despacho').toBeVisible({ timeout: 15_000 });
        vio.msHastaDespacho = Date.now() - d;
        await captura(telefono, '05b-cliente-servicio-pedido.png');
        return ms;
      });

      await tramo('05c', 'Bloque 5 · Técnico', 'El servicio aparece en /tecnico (sin recargar)', async (vio) => {
        const tarjeta = tecnico.locator('li.tec-tarjeta').filter({ hasText: nombreHogar });
        const d = Date.now();
        let sinRecargar = true;
        try {
          await expect(tarjeta).toBeVisible({ timeout: 15_000 });
        } catch {
          sinRecargar = false;
          await tecnico.reload();
          await expect(tarjeta).toBeVisible({ timeout: 15_000 });
        }
        vio.sinRecargar = sinRecargar;
        vio.msDesdeElPedido = Date.now() - d + (Number(tramos.at(-1)?.vio.msHastaDespacho) || 0);
        vio.tarjeta = (await tarjeta.innerText()).replace(/\s+/g, ' ').slice(0, 200);
        expect.soft(sinRecargar, 'El técnico ve el servicio sin recargar').toBe(true);
        await tarjeta.scrollIntoViewIfNeeded();
        await captura(tecnico, '05c-tecnico-servicio-asignado.png');
        return Date.now() - d;
      });

      await tramo('05d', 'Bloque 5 · Técnico', '"Ya fui" → foto → "Guardar reporte" → Atendidos', async (vio) => {
        const tarjeta = tecnico.locator('li.tec-tarjeta').filter({ hasText: nombreHogar });
        let ms = await reloj(async () => {
          await tarjeta.getByRole('button', { name: /ya fui/i }).click();
          await expect(tarjeta.locator('input[type="file"]')).toHaveCount(1);
        });
        await tarjeta.locator('input[type="file"]').setInputFiles(FOTO_TRABAJO);
        await expect(tarjeta.locator('img.tec-vista')).toBeVisible({ timeout: 15_000 });
        await tarjeta.getByRole('textbox', { name: /^\s*nota/i }).fill(`Prueba Calidad ${m}: cambié el cartucho.`);
        await captura(tecnico, '05d-tecnico-ya-fui-con-foto.png');
        ms += await reloj(async () => {
          await tarjeta.getByRole('button', { name: /^\s*guardar reporte\s*$/i }).click();
          await expect(tecnico.getByRole('button', { name: /^\s*atendidos \(\d+\)\s*$/i })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
          await expect(tecnico.locator('li.tec-tarjeta--atendida').filter({ hasText: nombreHogar })).toBeVisible();
        });
        await captura(tecnico, '05e-tecnico-atendido.png');
        return ms;
      });

      await tramo('05f', 'Bloque 5 · Técnico', 'El comercio ve el reporte con la foto ("Reportes del técnico")', async (vio) => {
        const d = Date.now();
        const resumen = comercio.locator('details.op-reportes > summary');
        await resumen.scrollIntoViewIfNeeded();
        if (!(await comercio.locator('details.op-reportes').evaluate((x) => (x as HTMLDetailsElement).open))) await resumen.click();
        const reporte = comercio.locator('li.op-reporte').filter({ hasText: nombreHogar });
        let sinRecargar = true;
        try {
          await expect(reporte).toBeVisible({ timeout: 10_000 });
        } catch {
          sinRecargar = false;
          await comercio.reload();
          await comercio.locator('details.op-reportes > summary').click();
          await expect(reporte).toBeVisible({ timeout: 10_000 });
        }
        vio.sinRecargar = sinRecargar;
        await reporte.getByRole('button', { name: /ver reporte/i }).click();
        const foto = reporte.locator('img.op-reporte__foto');
        await expect.poll(() => foto.evaluate((i) => (i as HTMLImageElement).naturalWidth).catch(() => 0), { timeout: 15_000 }).toBeGreaterThan(0);
        const ms = Date.now() - d;
        vio.resumen = await resumen.innerText();
        expect.soft(sinRecargar, 'El reporte aparece sin recargar').toBe(true);
        await reporte.scrollIntoViewIfNeeded();
        await captura(comercio, '05f-comercio-reporte-del-tecnico.png');
        return ms;
      });

      // ================================================================ Bloque 6
      await tramo('06', 'Bloque 6 · La Red refleja', '/red: pedidos y mediciones del mes actualizados', async (vio) => {
        await red.bringToFront();
        const pedAntes = num(redAntes['Pedidos del mes']);
        const medAntes = num(redAntes['Mediciones del mes']);
        let sinRecargar = true;
        const d = Date.now();
        try {
          await expect.poll(async () => num((await cifras(red, 'Cifras de la red'))['Pedidos del mes']), { timeout: 10_000 }).toBeGreaterThanOrEqual(pedAntes + 2);
        } catch {
          sinRecargar = false;
          await red.reload();
        }
        const ms = Date.now() - d;
        const despues = await cifras(red, 'Cifras de la red');
        vio.sinRecargar = sinRecargar;
        vio.antes = redAntes;
        vio.despues = despues;
        vio.subenPedidos = num(despues['Pedidos del mes']) - pedAntes;
        vio.subenMediciones = num(despues['Mediciones del mes']) - medAntes;
        vio.filaGrimuca = (await red.locator('table[aria-label="Comercios de la red"] tbody tr').first().innerText()).replace(/\s+/g, ' ');
        vio.actividad = (await red.locator('ol.red-actividad').innerText().catch(() => '')).split('\n').slice(0, 6);
        expect.soft(vio.subenPedidos as number, 'Pedidos del mes sube en 2').toBeGreaterThanOrEqual(2);
        expect.soft(vio.subenMediciones as number, 'Mediciones del mes sube').toBeGreaterThanOrEqual(1);
        expect.soft(sinRecargar, 'La red se actualiza sin recargar').toBe(true);
        await captura(red, '06-red-refleja.png');
        await red.locator('ol.red-actividad').scrollIntoViewIfNeeded().catch(() => undefined);
        await captura(red, '06b-red-actividad.png');
        return ms;
      });
    } finally {
      // Videos: se guardan al cerrar cada contexto.
      const pagsVideo: Array<[Page | null, string]> = [
        [red, 'video-red.webm'],
        [comercio, 'video-comercio.webm'],
        [rutasPestana, 'video-comercio-rutas.webm'],
        [telefono, 'video-cliente.webm'],
        [tecnico, 'video-tecnico.webm'],
      ];
      for (const { contexto } of abiertos) await contexto.close().catch(() => undefined);
      const videos: string[] = [];
      for (const [p, nombre] of pagsVideo) {
        const v = p?.video();
        if (!v) continue;
        try {
          await v.saveAs(path.join(RESPALDO, nombre));
          videos.push(nombre);
        } catch {
          /* sin video */
        }
      }
      fs.rmSync(VIDEO_TMP, { recursive: true, force: true });

      // Secuencia del plan B: las capturas numeradas.
      for (const c of capturas) fs.copyFileSync(path.join(ENSAYO, c), path.join(RESPALDO, c));

      const suma = (filtro: (t: Tramo) => boolean) => tramos.filter(filtro).reduce((n, t) => n + (t.ms ?? 0), 0);
      fs.writeFileSync(
        path.join(ENSAYO, 'ensayo.json'),
        JSON.stringify(
          {
            fecha: new Date().toISOString(),
            sitio: baseURL,
            marca: m,
            hogar: nombreHogar,
            pedidoId,
            servicioId,
            tramos,
            totalAppEnTarimaMs: suma((t) => !t.bloque.startsWith('Antes') && !/antes de subir|fuera del guion|plan B/i.test(t.bloque)),
            totalAppConTodoMs: suma(() => true),
            diferencias,
            datosCreados,
            capturas,
            videos,
            erroresDeLaPagina: errores,
            rutasDespues: comercioRutasRow,
          },
          null,
          2,
        ),
        'utf8',
      );
    }

    const fallidos = tramos.filter((t) => t.estado !== 'PASA').map((t) => `${t.n}: ${t.detalle}`);
    expect(fallidos, 'Tramos del ensayo que no pasaron').toEqual([]);
  });
});
