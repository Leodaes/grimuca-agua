// External QA against the live demo. Never touches app code.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'resultados/ultimo.json' }]],
  outputDir: 'resultados/artefactos',
  use: {
    baseURL: process.env.DEMO_URL || 'https://agua.oydo.app',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'telefono', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'escritorio', use: { browserName: 'chromium', viewport: { width: 1366, height: 900 } } },
  ],
});
