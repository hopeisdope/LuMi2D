/**
 * Regressietest voor de service worker: een foutpagina van de server mag de bewaarde offline-versie
 * van het spel niet vervangen.
 * Gebruik (na `npm run build`; Playwright moet beschikbaar zijn, bv. globaal): node scripts/test-offline.mjs
 *
 * Stappen: spel laden (service worker installeert) → server geeft 500 op de pagina → server uit (offline)
 * → de pagina moet nog steeds het spel zijn. localhost telt als beveiligde omgeving, dus de service worker draait echt.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(join(dist, 'sw.js'))) {
  console.error('dist/sw.js ontbreekt: eerst npm run build');
  process.exit(2);
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};
let failPages = false;

const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  if (failPages && path.endsWith('.html')) {
    res.writeHead(500, { 'content-type': 'text/html' });
    res.end('<h1>Serverfout</h1>');
    return;
  }
  const file = join(dist, path);
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
let ok = false;
try {
  const page = await browser.newPage();
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  failPages = true;
  const failed = await page.goto(url);
  console.log(`pagina met serverfout: status ${failed.status()}`);

  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await page.goto(url);
  ok = (await page.locator('canvas#game').count()) === 1;
  console.log(ok ? 'OK: offline start het spel nog' : `FOUT: offline staat er "${(await page.textContent('body')).trim()}"`);
} finally {
  await browser.close();
  server.close();
}
process.exit(ok ? 0 : 1);
