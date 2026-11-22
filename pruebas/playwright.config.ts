import { defineConfig } from '@playwright/test';
import { CONTEXTO_ESCRITORIO, CONTEXTO_MOVIL, REGION } from './e2e/apoyo/dispositivos';

/**
 * Pruebas de punta a punta de Grimuca Agua.
 *
 * Variables de entorno:
 *   URL_BASE       dirección contra la que se prueba (por defecto, la demo pública).
 *   PIN_OPERADOR   PIN del panel del operador. Nunca se escribe en el repositorio.
 *                  Si falta, las pruebas del operador se saltan con un mensaje claro.
 *   SOLO_LECTURA   con "1" se saltan las pruebas que crean hogares, mediciones o pedidos
 *                  (para la pasada final, cuando ya no se quiere ensuciar la base de la demo).
 *
 * Uso (desde la raíz del repositorio):
 *   npm run e2e                               todo, en móvil y escritorio
 *   npm run e2e -- --project=movil            solo el teléfono
 *   npm run e2e -- --project=escritorio 03    solo el despacho en vivo
 *
 * No se graban trazas a propósito: una traza guardaría el PIN y el token del operador.
 * La evidencia son las capturas (en fallo y las que adjuntan las pruebas) y el informe HTML.
 */

const URL_BASE = (process.env.URL_BASE ?? 'https://agua.oydo.app').replace(/\/+$/, '');

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  // Un solo proceso: las pruebas comparten la base de la demo y el despacho cuenta filas.
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'informe-html', open: 'never' }],
  ],
  use: {
    baseURL: URL_BASE,
    ...REGION,
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'movil',
      // El despacho abre sus dos contextos por su cuenta y el contrato de la API no depende
      // del dispositivo: ambos corren una sola vez, en el proyecto `escritorio`.
      testIgnore: [/03-despacho-en-vivo/, /04-api/],
      use: { browserName: 'chromium', ...CONTEXTO_MOVIL },
    },
    {
      name: 'escritorio',
      use: { browserName: 'chromium', ...CONTEXTO_ESCRITORIO },
    },
  ],
});
