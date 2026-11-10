// Capturas de las preguntas de un proyecto (o del despegue) en la página de desarrollo de contenido:
// una imagen por pregunta abierta y, de cada laboratorio, otra cerrada con «Ver una solución» pulsado.
//   node --input-type=module - <outDir> <juego> <proyecto|despegue> [filtro] < contenidoshot.mjs
// Con `npx vite --port 4320 --strictPort` en marcha, desde la raíz del worktree. BASE y W (ancho) por
// variables de entorno; con W < 600 el fichero acaba en «-m».
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [outDir, game, group, filter] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4320';
const width = Number(process.env.W ?? 1100);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
// Tras tocar código, Vite recarga módulos a media carga y la primera visita puede quedarse en blanco
// (ERR_NETWORK_CHANGED): se reintenta, y solo se enseñan los errores del último intento.
for (let attempt = 1; ; attempt++) {
  errors.length = 0;
  await page.goto(`${base}/#/dev/contenido/${game}/${group}`);
  if (attempt > 1) await page.reload();
  try {
    await page.waitForSelector('[data-testid]', { timeout: 15000 });
    break;
  } catch (e) {
    if (attempt === 3) {
      console.log(errors.join('\n'));
      throw e;
    }
  }
}
for (const e of errors) console.log(e);
await page.waitForTimeout(1200);
const ids = await page.$$eval('[data-testid]', (els) => els.map((e) => e.getAttribute('data-testid')));
for (const id of ids) {
  if (filter && !id.includes(filter)) continue;
  const el = page.locator(`[data-testid="${id}"]`);
  await el.scrollIntoViewIfNeeded();
  if (id.endsWith('--cerrada')) {
    await el.getByRole('button', { name: 'Ver una solución' }).click();
    await page.waitForTimeout(700);
  }
  await el.screenshot({ path: `${outDir}/${id}${width < 600 ? '-m' : ''}.png` });
  console.log('ok', id);
}
await browser.close();
