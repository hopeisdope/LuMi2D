/**
 * Genereert de PNG-iconen voor de PWA uit public/icons/icon.svg.
 * Gebruik (Playwright moet beschikbaar zijn, bv. globaal): node scripts/generate-icons.mjs
 * De uitvoer staat in public/icons/ en wordt meegecommit; dit script is alleen nodig na een wijziging van het icoon.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');

const outputs = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png', size: 32 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size } of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: join(root, 'public/icons', file), omitBackground: false });
  console.log('✓', file);
}
await browser.close();
