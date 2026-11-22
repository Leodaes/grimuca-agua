import { expect, test } from '@playwright/test';
import {
  AVISO_FIJO,
  AVISO_SOLO_LECTURA,
  SOLO_LECTURA,
  hogarInventado,
  marca,
  obtenerTira,
  planDeValores,
} from './apoyo/datos';
import {
  accion,
  elegirEnLista,
  elegirOpcion,
  esperarPantalla,
  leerGuardado,
  marcarCasilla,
  palabra,
  sinPalabraProhibida,
} from './apoyo/pagina';

/**
 * Compuerta 2 · recorrido completo del cliente con carga manual (el camino seguro de la demo).
 *
 *   bienvenida → perfil → envío → pago simulado → "Ya me llegó el sobre" → /medir
 *   → carga manual → resultado → "Agregar a mi lista" → Mi lista → retiro en Mañongo → pedido.
 *
 * TEXTOS Y ROLES QUE SE ASUMEN (fuente: docs/diseno/especificacion.md y docs/marketing/textos-app.md).
 * Si Desarrollo o Marketing cambian una palabra, se ajusta la expresión en el objeto T de abajo.
 *
 * | Pantalla        | Elemento                 | Rol            | Texto aceptado (expresión)                                   |
 * |-----------------|--------------------------|----------------|--------------------------------------------------------------|
 * | /               | Título                   | heading 1      | Descubre la calidad del agua de tu casa                      |
 * | /               | Botón principal          | link o button  | Empezar                                                      |
 * | /perfil         | Nombre                   | textbox        | Nombre · ¿Cómo te llamas?                                    |
 * | /perfil         | Zona                     | combobox/chips | Zona → Naguanagua                                            |
 * | /perfil         | Origen del agua          | group de chips | ¿De dónde viene/sale el agua…? → Tanque                      |
 * | /perfil         | Personas                 | spinbutton     | ¿Cuántos viven…?                                             |
 * | /perfil         | Tiene filtro             | group de chips | ¿Tienen filtro…? → Sí                                        |
 * | /perfil         | Etapas (si hay filtro)   | combobox       | …etapas… → 3                                                 |
 * | /perfil         | Último cambio            | fecha          | ¿Cuándo cambiaron el cartucho…?                              |
 * | /perfil         | Agua turbia              | group de chips | …turbia o amarilla… → Sí                                     |
 * | /perfil         | WhatsApp                 | textbox        | WhatsApp                                                     |
 * | /perfil         | Consentimiento           | checkbox       | Acepto que Grimuca use estos datos…                          |
 * | /perfil         | Botón principal          | button         | Guardar y seguir · Continuar                                 |
 * | /envio          | Dirección                | textbox        | Dirección…                                                   |
 * | /envio          | Botón principal          | button o link  | Seguir al pago · Continuar al pago                           |
 * | /pago           | Rótulo                   | texto          | Simulación                                                   |
 * | /pago           | Botón principal          | button         | Pagar $9 (simulación)                                        |
 * | /pago (pagado)  | Botón de la demo         | button o link  | Ya me llegó el sobre                                         |
 * | /medir          | Enlace de respaldo       | link o button  | …colores a mano · Prefiero anotar los colores yo mismo       |
 * | /medir/manual   | Una lista por casilla    | combobox       | nombre del parámetro (viene de /api/config/tira)             |
 * | /medir/manual   | Botón principal          | button         | Ver mi resultado                                             |
 * | /resultado/:id  | Aviso fijo               | texto literal  | Esta tira no mide todo. Un buen resultado no significa…      |
 * | /resultado/:id  | Fila por parámetro       | listitem       | nombre + palabra del semáforo                                |
 * | /resultado/:id  | Palabras del semáforo    | texto          | Bien/En rango · Atención/Para vigilar · Alerta/Fuera de rango|
 * | /resultado/:id  | Producto sugerido        | button         | Agregar a mi lista                                           |
 * | barra inferior  | Acceso a la lista        | link           | Mi lista                                                     |
 * | /lista          | Modalidad                | chip (button)  | Retiro en tienda · Lo retiro en la tienda                    |
 * | /lista          | Tienda                   | combobox/chips | …tienda… → Mañongo                                           |
 * | /lista          | Botón principal          | button         | Confirmar pedido · Pedir                                     |
 * | /pedido/:id     | Confirmación             | texto          | Pedido recibido · Tu pedido ya está en la tienda · Listo, …  |
 *
 * Claves del dispositivo que se leen: localStorage `agua.hogar_id` y `agua.lista`.
 */
const T = {
  tituloPortada: /Descubre la calidad del agua de tu casa/i,
  empezar: /^\s*(empezar|comenzar)\s*$/i,
  nombre: /nombre|c[oó]mo te llamas/i,
  zona: /zona/i,
  origenAgua: /de d[oó]nde (viene|sale) el agua/i,
  personas: /cu[aá]nt[oa]s (personas )?viven/i,
  tieneFiltro: /tienen filtro/i,
  etapas: /etapas/i,
  ultimoCambio: /cu[aá]ndo cambiaron/i,
  aguaTurbia: /turbia o amarilla/i,
  whatsapp: /whatsapp/i,
  consentimiento: /acepto/i,
  guardarPerfil: /guardar y seguir|^\s*continuar\s*$|^\s*guardar\s*$/i,
  direccion: /direcci[oó]n/i,
  seguirAlPago: /(seguir|continuar)\s+al\s+pago/i,
  simulacion: /simulaci[oó]n/i,
  pagar: /pagar/i,
  yaLlegoElSobre: /ya me lleg[oó] el sobre/i,
  cargaManual: /colores\s+(a mano|yo mismo|t[uú] mismo)/i,
  verResultado: /ver mi resultado/i,
  nivelVerde: /\b(bien|en rango)\b/i,
  nivelAmarillo: /atenci[oó]n|para vigilar/i,
  nivelRojo: /alerta|fuera de rango/i,
  agregarALista: /agregar a mi lista/i,
  agregado: /agregado a tu lista|en tu lista/i,
  miLista: /mi lista/i,
  retiro: /retir/i,
  tienda: /tienda/i,
  manongo: /ma[ñn]ongo/i,
  confirmarPedido: /confirmar pedido|^\s*pedir\s*$|hacer (el )?pedido/i,
  pedidoConfirmado: /pedido recibido|tu pedido ya est[aá]|^\s*listo\b/i,
};

test.describe('Compuerta 2 · recorrido del cliente con carga manual', () => {
  test.skip(() => SOLO_LECTURA, AVISO_SOLO_LECTURA);

  test('de la bienvenida al pedido confirmado con retiro en Mañongo', async ({ page, request }, testInfo) => {
    // Son unas diez pantallas seguidas contra la URL pública: se le da el doble del límite general.
    test.setTimeout(120_000);

    const m = marca();
    const perfil = hogarInventado(m);
    let hogarId = '';
    let medicionId = '';
    let claveRoja: string | null = null;
    let valoresElegidos: Record<string, number> = {};

    await test.step('1. Bienvenida', async () => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: T.tituloPortada })).toBeVisible();
      await sinPalabraProhibida(page, '/', false);
      await accion(page, T.empezar).click();
      await expect(page).toHaveURL(/\/perfil/);
    });

    await test.step('2. Perfil del hogar: todos los campos y el consentimiento', async () => {
      await page.getByRole('textbox', { name: T.nombre }).first().fill(perfil.nombre);
      await elegirOpcion(page, T.zona, /naguanagua/i);
      await elegirOpcion(page, T.origenAgua, /^\s*tanque\b/i);
      await page.getByLabel(T.personas).first().fill(String(perfil.personas));
      await elegirOpcion(page, T.tieneFiltro, /^\s*s[ií]\s*$/i);

      // Campos que aparecen al decir que sí hay filtro. Si no están, se anota y se sigue.
      const etapas = page.getByRole('combobox', { name: T.etapas }).first();
      if (await etapas.isVisible().catch(() => false)) await elegirEnLista(etapas, /^\s*3\b/);
      else expect.soft(false, 'No apareció "¿De cuántas etapas?" al marcar que hay filtro').toBe(true);

      const ultimoCambio = page.getByLabel(T.ultimoCambio).first();
      if (await ultimoCambio.isVisible().catch(() => false)) {
        const llenado = await ultimoCambio.fill(perfil.fecha_ultimo_cambio).then(() => true, () => false);
        expect.soft(llenado, 'La fecha del último cambio no aceptó una fecha AAAA-MM-DD').toBe(true);
      } else {
        expect.soft(false, 'No apareció la fecha del último cambio de cartucho').toBe(true);
      }

      await elegirOpcion(page, T.aguaTurbia, /^\s*s[ií]\s*$/i);
      await page.getByRole('textbox', { name: T.whatsapp }).first().fill(perfil.whatsapp);

      const consentimiento = page.getByRole('checkbox', { name: T.consentimiento }).first();
      await expect(consentimiento, 'La casilla de consentimiento no puede venir marcada').not.toBeChecked();
      await marcarCasilla(consentimiento);
      await expect
        .soft(page.getByRole('link', { name: /privacidad/i }).first(), 'Falta el enlace al aviso de privacidad')
        .toBeVisible();

      await sinPalabraProhibida(page, '/perfil', false);
      await accion(page, T.guardarPerfil).click();
      await expect(page, 'Al guardar el perfil debe pasar al envío').toHaveURL(/\/envio/);

      hogarId = String((await leerGuardado(page, 'agua.hogar_id')) ?? '');
      expect(hogarId, 'El dispositivo debe recordar el hogar en localStorage (agua.hogar_id)').toMatch(/^[0-9a-f-]{36}$/i);

      const guardado = await (await request.get(`/api/hogares/${hogarId}`)).json();
      expect.soft(guardado.nombre).toBe(perfil.nombre);
      expect.soft(guardado.zona).toBe('Naguanagua');
      expect.soft(guardado.origen_agua).toBe('tanque');
      expect.soft(guardado.tiene_filtro).toBe(true);
      expect.soft(guardado.agua_turbia).toBe(true);
      expect.soft(Boolean(guardado.consentimiento_fecha), 'Debe quedar la fecha del consentimiento').toBe(true);
    });

    await test.step('3. Dirección de envío y tienda', async () => {
      await page.getByRole('textbox', { name: T.direccion }).first().fill(perfil.direccion);
      await expect.soft(page.getByText(T.manongo).first(), 'Para Naguanagua la tienda sugerida es Mañongo').toBeVisible();
      await sinPalabraProhibida(page, '/envio', false);
      await accion(page, T.seguirAlPago).click();
      await expect(page).toHaveURL(/\/pago/);
    });

    await test.step('4. Pago simulado del sobre de $9', async () => {
      await expect(page.getByText(T.simulacion).first(), 'El pago debe estar rotulado como simulación').toBeVisible();
      await expect.soft(page.getByText(/\$\s?9/).first(), 'Debe verse el precio de $9').toBeVisible();
      await sinPalabraProhibida(page, '/pago', false);
      await page.getByRole('button', { name: T.pagar }).first().click();

      const yaLlego = accion(page, T.yaLlegoElSobre);
      await expect(yaLlego, 'Después de pagar debe aparecer "Ya me llegó el sobre"').toBeVisible();
      await expect.soft(page.getByText(T.simulacion).first(), 'El rótulo de simulación sigue después de pagar').toBeVisible();

      const pedidos = await (await request.get(`/api/hogares/${hogarId}/pedidos`)).json();
      const sobre = Array.isArray(pedidos) ? pedidos.find((p: any) => p.tipo === 'sobre') : undefined;
      expect(sobre, 'El pago simulado debe crear un pedido de tipo "sobre"').toBeTruthy();
      expect.soft(sobre.pago).toBe('simulado');
      expect.soft(sobre.estado).toBe('pendiente');

      await yaLlego.click();
      await expect(page, '"Ya me llegó el sobre" debe llevar a /medir').toHaveURL(/\/medir\/?(\?.*)?$/);
    });

    await test.step('5. Medir: pasar a la carga manual', async () => {
      await expect.soft(page.getByRole('heading', { level: 1, name: /4 pasos/i })).toBeVisible();
      await sinPalabraProhibida(page, '/medir', false);
      await accion(page, T.cargaManual).click();
      await expect(page).toHaveURL(/\/medir\/manual/);
    });

    await test.step('6. Carga manual: un nivel por casilla, con una en rojo', async () => {
      const tira = await obtenerTira(request);
      const plan = planDeValores(tira);
      claveRoja = plan.claveRoja;
      valoresElegidos = plan.valores;
      expect(claveRoja, 'La tira configurada debe traer al menos una casilla que pueda dar rojo').toBeTruthy();

      for (const parametro of tira) {
        const valor = plan.valores[parametro.clave];
        if (valor === undefined) continue;
        const lista = page.getByRole('combobox', { name: palabra(parametro.nombre) }).first();
        const esLaRoja = parametro.clave === claveRoja;
        if (esLaRoja) await expect(lista, `Falta la lista de "${parametro.nombre}"`).toBeVisible();
        if (await lista.isVisible().catch(() => false)) {
          await elegirEnLista(lista, valor);
        } else {
          expect.soft(false, `No hay una lista con la etiqueta "${parametro.nombre}" en la carga manual`).toBe(true);
          delete valoresElegidos[parametro.clave];
        }
      }

      await sinPalabraProhibida(page, '/medir/manual', false);
      await page.getByRole('button', { name: T.verResultado }).first().click();
      await expect(page).toHaveURL(/\/resultado\/[\w-]+/);
    });

    await test.step('7. Resultado: semáforo por parámetro, aviso fijo y producto sugerido', async () => {
      await esperarPantalla(page);
      medicionId = new URL(page.url()).pathname.split('/').pop() ?? '';
      if (medicionId === 'ultimo') {
        const mediciones = await (await request.get(`/api/hogares/${hogarId}/mediciones`)).json();
        medicionId = mediciones[0].id;
      }
      const medicion = await (await request.get(`/api/mediciones/${medicionId}`)).json();
      expect(medicion.origen, 'La medición debe quedar como carga manual').toBe('manual');
      expect(Array.isArray(medicion.evaluacion?.porParametro), 'La medición trae evaluacion.porParametro').toBe(true);
      for (const [clave, valor] of Object.entries(valoresElegidos)) {
        expect.soft(medicion.valores?.[clave], `El valor guardado de ${clave} debe ser el que se eligió`).toBe(valor);
      }
      const roja = medicion.evaluacion.porParametro.find((p: any) => p.clave === claveRoja);
      expect(roja?.nivel, `La casilla ${claveRoja} con valor ${valoresElegidos[claveRoja!]} debe salir en rojo`).toBe('rojo');
      expect(medicion.evaluacion.semaforo, 'El semáforo general es el peor nivel').toBe('rojo');

      // Aviso fijo, literal.
      await expect(page.getByText(AVISO_FIJO), 'Falta el aviso fijo literal en el resultado').toBeVisible();

      // Semáforo por parámetro: cada casilla con su nombre y su palabra (nunca solo color).
      const palabraDe: Record<string, RegExp> = {
        verde: T.nivelVerde,
        amarillo: T.nivelAmarillo,
        rojo: T.nivelRojo,
      };
      for (const resultado of medicion.evaluacion.porParametro) {
        if (!palabraDe[resultado.nivel]) continue;
        const fila = page
          .locator('li, tr, [role="listitem"], [role="row"]')
          .filter({ hasText: palabra(resultado.nombre) })
          .first();
        const mensaje = `La fila de "${resultado.nombre}" debe mostrar su semáforo (${resultado.nivel}) con palabra`;
        if (resultado.clave === claveRoja) await expect(fila, mensaje).toContainText(palabraDe.rojo);
        else await expect.soft(fila, mensaje).toContainText(palabraDe[resultado.nivel]);
      }

      // Al menos un producto sugerido.
      expect(medicion.sugeridos?.length ?? 0, 'Con una casilla en rojo la API debe sugerir al menos un producto').toBeGreaterThan(0);
      const agregar = page.getByRole('button', { name: T.agregarALista });
      await expect(agregar.first(), 'Debe haber al menos un producto con "Agregar a mi lista"').toBeVisible();

      await sinPalabraProhibida(page, '/resultado', false);
      await testInfo.attach('resultado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

      await agregar.first().click();
      await expect.soft(page.getByText(T.agregado).first(), 'Debe confirmar que se agregó a la lista').toBeVisible();
      const lista = await leerGuardado(page, 'agua.lista');
      expect(Array.isArray(lista) && lista.length > 0, 'Mi lista (localStorage agua.lista) debe tener el producto').toBe(true);
    });

    await test.step('8. Mi lista: retiro en Mañongo y confirmar', async () => {
      const acceso = page.getByRole('navigation').getByRole('link', { name: T.miLista }).first();
      if (await acceso.isVisible().catch(() => false)) {
        await acceso.click();
      } else {
        expect.soft(false, 'No se encontró el acceso "Mi lista" en la barra inferior; se entra por la ruta').toBe(true);
        await page.goto('/lista');
      }
      await expect(page).toHaveURL(/\/lista/);
      await expect(page.getByRole('heading', { name: T.miLista }).first()).toBeVisible();

      const lista = await leerGuardado(page, 'agua.lista');
      await expect(page.getByText(lista[0].nombre).first(), 'El producto agregado debe verse en Mi lista').toBeVisible();

      await page.getByRole('button', { name: T.retiro }).or(page.getByRole('radio', { name: T.retiro })).first().click();

      const tienda = page.getByRole('combobox', { name: T.tienda }).first();
      if (await tienda.isVisible().catch(() => false)) {
        await elegirEnLista(tienda, T.manongo);
      } else {
        const chip = page.getByRole('button', { name: T.manongo }).or(page.getByRole('radio', { name: T.manongo })).first();
        if (await chip.isVisible().catch(() => false)) await chip.click();
        else expect.soft(false, 'No se encontró cómo elegir la tienda de retiro (lista o chips)').toBe(true);
      }
      await expect(page.getByText(T.manongo).first(), 'Debe verse la tienda Mañongo como punto de retiro').toBeVisible();

      await sinPalabraProhibida(page, '/lista', false);
      await accion(page, T.confirmarPedido).click();
      await expect(page, 'Al confirmar debe abrirse el pedido').toHaveURL(/\/pedido\/\d+/);
    });

    await test.step('9. Pedido confirmado', async () => {
      await esperarPantalla(page);
      const pedidoId = new URL(page.url()).pathname.split('/').pop();
      const pedido = await (await request.get(`/api/pedidos/${pedidoId}`)).json();
      expect(pedido.hogar_id).toBe(hogarId);
      expect(pedido.tipo).toBe('cartucho');
      expect(pedido.modalidad).toBe('retiro');
      expect(pedido.tienda_id, 'El retiro debe quedar en Mañongo').toBe('manongo');
      expect(pedido.estado).toBe('pendiente');
      expect.soft(pedido.pago, 'Un pedido de cartucho no lleva cobro').toBe('no_aplica');

      await expect(page.getByText(T.pedidoConfirmado).first(), 'Debe confirmar el pedido en pantalla').toBeVisible();
      await expect(page.getByText(T.manongo).first(), 'Debe decir en qué tienda se retira').toBeVisible();
      await sinPalabraProhibida(page, '/pedido', false);
      await testInfo.attach('pedido-confirmado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    });
  });
});
