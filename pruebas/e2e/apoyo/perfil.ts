import { expect, type Page } from '@playwright/test';
import { elegirEnLista, elegirOpcion, marcarCasilla } from './pagina';

/**
 * Perfil del hogar con los campos vigentes (pasada 2, 21 nov):
 *   ¿Cómo te llamas? · ¿En qué zona vives? · Urbanización (según la zona, opcional) ·
 *   ¿De dónde sale el agua…? · ¿Cuántos viven…? · ¿Hay mascotas en casa? · ¿Tienen filtro en casa? ·
 *   (con filtro) ¿Cuándo cambiaste el cartucho por última vez? · ¿El agua a veces sale turbia o amarilla? ·
 *   Código de país (+58 por defecto) · Tu WhatsApp · casilla "Acepto…".
 * Con filtro ya no se piden etapas ni fecha: al guardar va a /mi-filtro?sigue=…
 */
export interface OpcionesPerfil {
  nombre: string;
  zona?: RegExp;
  urbanizacion?: RegExp | null;
  origen?: RegExp;
  personas?: number;
  mascotas?: boolean;
  filtro?: boolean;
  ultimoCambio?: RegExp;
  turbia?: boolean;
  whatsapp?: string;
  consentimiento?: boolean;
}

export const T_PERFIL = {
  nombre: /c[oó]mo te llamas/i,
  zona: /zona/i,
  urbanizacion: /urbanizaci[oó]n/i,
  origen: /de d[oó]nde sale el agua/i,
  personas: /cu[aá]ntos viven/i,
  mascotas: /hay mascotas en casa/i,
  tieneFiltro: /tienen filtro/i,
  ultimoCambio: /cu[aá]ndo cambiaste el cartucho/i,
  turbia: /turbia o amarilla/i,
  codigoPais: /c[oó]digo de pa[ií]s/i,
  whatsapp: /tu whatsapp/i,
  consentimiento: /acepto/i,
  continuar: /^\s*continuar\s*$/i,
};

// Ojo: \b no sirve después de "í" (no es letra para \b sin la bandera u).
const SI = /^\s*s[ií]\s*$/i;
const NO = /^\s*no\s*$/i;

async function radio(page: Page, grupo: RegExp, opcion: RegExp) {
  await page.getByRole('group', { name: grupo }).getByLabel(opcion).first().check();
}

export async function llenarPerfil(page: Page, o: OpcionesPerfil): Promise<void> {
  await page.getByRole('textbox', { name: T_PERFIL.nombre }).fill(o.nombre);
  await elegirOpcion(page, T_PERFIL.zona, o.zona ?? /naguanagua/i);
  if (o.urbanizacion) {
    await elegirEnLista(page.getByRole('combobox', { name: T_PERFIL.urbanizacion }).first(), o.urbanizacion);
  }
  await radio(page, T_PERFIL.origen, o.origen ?? /^\s*tanque/i);
  await page.getByLabel(T_PERFIL.personas).first().fill(String(o.personas ?? 4));
  await radio(page, T_PERFIL.mascotas, o.mascotas ? SI : NO);
  await radio(page, T_PERFIL.tieneFiltro, o.filtro === false ? NO : SI);
  if (o.filtro !== false) {
    await expect(page.getByRole('group', { name: T_PERFIL.ultimoCambio }), 'Con filtro debe preguntar cuándo cambió el cartucho').toBeVisible();
    await radio(page, T_PERFIL.ultimoCambio, o.ultimoCambio ?? /m[aá]s de tres meses/i);
  }
  await radio(page, T_PERFIL.turbia, o.turbia === false ? NO : SI);
  await page.getByRole('textbox', { name: T_PERFIL.whatsapp }).fill(o.whatsapp ?? '0412 000 0000');
  if (o.consentimiento !== false) await marcarCasilla(page.getByRole('checkbox', { name: T_PERFIL.consentimiento }).first());
}

/** Desde /mi-filtro: "Cárgalo a mano" → Tres vasos (u otro) → "Guardar mi filtro" → "Continuar". */
export async function filtroAMano(page: Page, tipo: RegExp = /^\s*tres vasos/i, alGuardar?: () => Promise<void>) {
  await page.getByRole('link', { name: /c[aá]rgalo a mano/i }).first().click();
  await expect(page).toHaveURL(/\/mi-filtro\/manual/);
  await page.getByRole('group', { name: /c[oó]mo es tu filtro/i }).getByLabel(tipo).first().check();
  await page.getByRole('button', { name: /guardar mi filtro/i }).click();
  await expect(page.getByRole('heading', { name: /guardamos tu filtro/i })).toBeVisible({ timeout: 15_000 });
  if (alGuardar) await alGuardar();
  await page.getByRole('link', { name: /^\s*continuar\s*$/i }).or(page.getByRole('button', { name: /^\s*continuar\s*$/i })).first().click();
}
