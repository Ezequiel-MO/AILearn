// Capturas de la página de laboratorios: una imagen por muestra (data-testid).
// node --input-type=module - <outDir> [filtro] < labshot.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [outDir, filter] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4320';
const width = Number(process.env.W ?? 1100);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});
await page.goto(`${base}/#/dev/labs`);
await page.waitForSelector('[data-testid]', { timeout: 20000 });
await page.waitForTimeout(800);
const ids = await page.$$eval('[data-testid]', (els) => els.map((e) => e.getAttribute('data-testid')));
for (const id of ids) {
  if (filter && !id.includes(filter)) continue;
  const el = page.locator(`[data-testid="${id}"]`);
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: `${outDir}/${id}${width < 600 ? '-m' : ''}.png` });
  console.log('ok', id);
}
await browser.close();
