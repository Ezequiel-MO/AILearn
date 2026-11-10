// Capturas de pantallas del juego: node shots.mjs <outDir> <ruta1> <ruta2> ...
// Cada ruta es un hash sin '#', p. ej. /j/matrices/p/columnas/ex/0
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [outDir, ...routes] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4319';
const width = Number(process.env.W ?? 1100);
const height = Number(process.env.H ?? 900);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width, height } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
for (const route of routes) {
  const [path, steps] = route.split('@');
  const game = path.split('/')[2];
  await page.goto(`${base}/#/j/${game}?abierto`);
  await page.waitForTimeout(500);
  await page.evaluate((p) => {
    window.location.hash = `#${p}`;
  }, path);
  await page.waitForTimeout(3200);
  // steps: número de preguntas a saltar revelando solución (no implementado: solo primera pantalla)
  const name = path.replace(/^\//, '').replace(/\//g, '_') + (steps ? `_${steps}` : '');
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log('ok', name);
}
await browser.close();
