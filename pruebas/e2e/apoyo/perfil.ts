import { expect, type Page } from '@playwright/test';
import { elegirEnLista, elegirOpcion, marcarCasilla } from './pagina';

/**
 * Perfil del hogar con los campos vigentes (onboarding, 22 nov), en cuatro bloques:
 *   Tu casa: ¿En qué zona vives? · Urbanización (opcional; se habilita al elegir zona) ·
 *            ¿Cuántos viven en la casa? (− / + o escribir) · ¿Hay mascotas en casa?
 *   Tu agua: ¿De dónde sale el agua…? · ¿El agua a veces sale turbia o amarilla?
 *   Tu filtro: ¿Tienen filtro en casa? · (con filtro) ¿Cuándo cambiaste el cartucho por última vez?
 *   Cómo te contactamos: Nombre · Apellido · grupo "Tu WhatsApp": Código de país (+58 por defecto) ·
 *            con +58: Operadora (0412…0426, sin preselección) + Número (7 dígitos); con otro país: Número.
 *   Casilla "Acepto…" y botón "Continuar".
 * La API sigue guardando un solo `nombre` ("Nombre Apellido") y el WhatsApp como +58…
 * Con filtro ya no se piden etapas ni fecha: al guardar va a /mi-filtro?sigue=…
 */
export interface OpcionesPerfil {
  /** Nombre completo: la primera palabra va a "Nombre" y el resto a "Apellido" (si no hay, "Prueba"). */
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
  nombre: /^\s*nombre\s*$/i,
  apellido: /^\s*apellido/i,
  operadora: /^\s*operadora\s*$/i,
  numero: /^\s*n[uú]mero\s*$/i,
  zona: /zona/i,
  urbanizacion: /urbanizaci[oó]n/i,
  origen: /de d[oó]nde sale el agua/i,
  personas: /cu[aá]ntos viven/i,
  mascotas: /hay mascotas en casa/i,
  tieneFiltro: /tienen filtro/i,
  ultimoCambio: /cu[aá]ndo cambiaste el cartucho/i,
  turbia: /turbia o amarilla/i,
  codigoPais: /c[oó]digo de pa[ií]s/i,
  /** Grupo (fieldset) del teléfono. */
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

/** "Prueba Calidad 123 domicilio" → Nombre "Prueba", Apellido "Calidad 123 domicilio" (así se guarda igual). */
export async function llenarNombre(page: Page, completo: string): Promise<void> {
  const texto = completo.replace(/\s+/g, ' ').trim();
  const espacio = texto.indexOf(' ');
  const nombre = espacio < 0 ? texto : texto.slice(0, espacio);
  const apellido = espacio < 0 ? 'Prueba' : texto.slice(espacio + 1);
  await page.getByRole('textbox', { name: T_PERFIL.nombre }).fill(nombre);
  await page.getByRole('textbox', { name: T_PERFIL.apellido }).fill(apellido);
}

/**
 * Escribe el WhatsApp. Con +58 (por defecto) lo reparte: "0412 000 0000" → Operadora 0412 + Número 0000000.
 * Con otro código (+57 …) elige el país y lo escribe en el campo único "Número".
 */
export async function llenarWhatsapp(page: Page, numero: string): Promise<void> {
  const grupo = page.getByRole('group', { name: T_PERFIL.whatsapp });
  const digitos = numero.replace(/\D/g, '');
  const internacional = numero.trim().startsWith('+');
  if (internacional && !digitos.startsWith('58')) {
    const codigo = ['593', '507', '57', '56', '54', '52', '51', '34', '1'].find((c) => digitos.startsWith(c)) ?? '57';
    await grupo.getByRole('combobox', { name: T_PERFIL.codigoPais }).selectOption(codigo);
    await grupo.getByRole('textbox', { name: T_PERFIL.numero }).fill(digitos.slice(codigo.length));
    return;
  }
  const nacional = internacional ? `0${digitos.slice(2)}` : digitos;
  await grupo.getByRole('combobox', { name: T_PERFIL.codigoPais }).selectOption('58');
  await grupo.getByRole('combobox', { name: T_PERFIL.operadora }).selectOption(nacional.slice(0, 4));
  await grupo.getByRole('textbox', { name: T_PERFIL.numero }).fill(nacional.slice(4));
}

export async function llenarPerfil(page: Page, o: OpcionesPerfil): Promise<void> {
  await llenarNombre(page, o.nombre);
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
  await llenarWhatsapp(page, o.whatsapp ?? '0412 000 0000');
  if (o.consentimiento !== false) await marcarCasilla(page.getByRole('checkbox', { name: T_PERFIL.consentimiento }).first());
}

/** Desde /mi-filtro: "Cargarlo a mano" → Tres vasos (u otro) → "Guardar mi filtro" → "Continuar". */
export async function filtroAMano(page: Page, tipo: RegExp = /^\s*tres vasos/i, alGuardar?: () => Promise<void>) {
  await page.getByRole('link', { name: /c[aá]rg(alo|arlo) a mano/i }).first().click();
  await expect(page).toHaveURL(/\/mi-filtro\/manual/);
  await page.getByRole('group', { name: /c[oó]mo es tu filtro/i }).getByLabel(tipo).first().check();
  await page.getByRole('button', { name: /guardar mi filtro/i }).click();
  await expect(page.getByRole('heading', { name: /guardamos tu filtro/i })).toBeVisible({ timeout: 15_000 });
  if (alGuardar) await alGuardar();
  await page.getByRole('link', { name: /^\s*continuar\s*$/i }).or(page.getByRole('button', { name: /^\s*continuar\s*$/i })).first().click();
}
