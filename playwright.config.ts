import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// La prueba de humo corre sobre la compilación (`dist/`), servida con `npm run preview`, en el Chrome
// del sistema: no se descargan navegadores. Antes hay que compilar (`npm run build`).
if (!existsSync('dist/index.html')) {
  throw new Error('No existe dist/index.html: ejecuta `npm run build` antes de `npm run e2e`.');
}

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  // La primera carga de Pyodide tarda de 7 a 14 s (más con la máquina cargada) y alguna prueba la
  // paga dos veces (plazo agotado + recarga del ejecutor).
  timeout: 180_000,
  expect: { timeout: 20_000 },
  // Un solo trabajador: cada prueba que ejecuta Python carga Pyodide y en paralelo se estorban.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    headless: true,
    trace: 'off',
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
