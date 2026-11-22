/**
 * Dispositivos de prueba. Los usa `playwright.config.ts` (proyectos `movil` y `escritorio`)
 * y las pruebas que abren dos contextos a la vez (03-despacho-en-vivo).
 */

/** Teléfono de la demo: 375×812, táctil, agente de usuario móvil. */
export const CONTEXTO_MOVIL = {
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
};

/** Laptop del operador conectada al proyector: 1366×768. */
export const CONTEXTO_ESCRITORIO = {
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
};

/** Idioma y hora de Caracas, iguales en todos los contextos. */
export const REGION = {
  locale: 'es-VE',
  timezoneId: 'America/Caracas',
};
