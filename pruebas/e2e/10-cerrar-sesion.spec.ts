import { expect, test } from '@playwright/test';
import { SOLO_LECTURA, AVISO_SOLO_LECTURA, crearHogar, medirManual, obtenerTira, planDeValores } from './apoyo/datos';
import { leerGuardado } from './apoyo/pagina';

/**
 * Cerrar sesión desde el tablero del cliente (falla reportada por Leonardo el 22 nov, Chrome de escritorio a 1920 px,
 * hogar con filtro sin fecha de cambio y una medición en rojo).
 *
 * El botón queda al final del tablero; la confirmación debe quedar a la vista (no debajo del borde de la pantalla),
 * "Sí, cerrar sesión" debe recibir el foco, y después de confirmar y recargar debe verse la portada sin perfil.
 *
 * No se usa `sembrarDispositivo` (pagina.ts): siembra el hogar en cada carga y volvería a "iniciar sesión".
 */
for (const [nombre, viewport] of [
  ['escritorio 1920', { width: 1920, height: 1080 }],
  ['teléfono 375', { width: 375, height: 812 }],
] as const) {
  test(`cerrar sesión con medición en rojo · ${nombre}`, async ({ browser, request }) => {
    test.skip(SOLO_LECTURA, AVISO_SOLO_LECTURA);
    const hogar = await crearHogar(request, { tiene_filtro: true, fecha_ultimo_cambio: null, ultimo_cambio: 'no_me_acuerdo' });
    const { valores } = planDeValores(await obtenerTira(request));
    await medirManual(request, hogar.id, valores);

    const contexto = await browser.newContext({ viewport });
    const page = await contexto.newPage();
    await page.goto('/');
    await page.evaluate((id) => window.localStorage.setItem('agua.hogar_id', id), hogar.id);
    await page.goto('/');

    const cerrar = page.getByRole('button', { name: 'Cerrar sesión', exact: true });
    await cerrar.scrollIntoViewIfNeeded();
    await cerrar.click();

    const si = page.getByRole('button', { name: 'Sí, cerrar sesión' });
    await expect(si).toBeVisible();
    await expect(si).toBeInViewport();
    await expect(si).toBeFocused();

    await si.click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.reload();
    expect(await leerGuardado(page, 'agua.hogar_id')).toBeNull();
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Pedir el sobre a domicilio ($9)' }).first()).toBeVisible();
    await contexto.close();
  });
}
