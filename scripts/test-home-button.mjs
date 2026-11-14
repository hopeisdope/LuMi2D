/**
 * Test van de thuisknop (naar de spelletjesportal op de root van het domein).
 * Gebruik (na `npm run build`; Playwright moet beschikbaar zijn, bv. globaal): node scripts/test-home-button.mjs
 *
 * Het spel draait onder /LuMi2D/ (zoals op GitHub Pages), de root `/` is een nep-portal. Per iPad-viewport
 * (1180×820 en 1133×744, hasTouch):
 * - de knop is zichtbaar op het startscherm en ontbreekt tijdens het spelen (pixel in de knop is oranje of niet);
 * - tikken op die plek tijdens het spelen navigeert niet;
 * - na een rit (pauze → Opnieuw → terug naar start) gaat de tik naar `/`, en het rittenboekje is daarbij
 *   niet nog eens bijgeschreven (geen dubbeltelling).
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html ontbreekt: eerst npm run build');
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
const PORTAL = '<!doctype html><title>Portal</title><h1 id="portal">Portal</h1>';

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(PORTAL);
    return;
  }
  if (!pathname.startsWith('/LuMi2D/')) {
    res.writeHead(404);
    res.end();
    return;
  }
  let path = normalize(pathname.slice('/LuMi2D'.length));
  if (path.endsWith('/')) path += 'index.html';
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
const origin = `http://localhost:${server.address().port}`;
const gameUrl = `${origin}/LuMi2D/`;

// Zelfde maten als config.ts (VIEW, UI.homeButton, UI.menuButton, UI.pauseButton) en Screen.resize().
const VIEW = { height: 540, minWidth: 720, maxWidth: 1280 };
const HOME = { x: 20, y: 20, size: 72 };
function mapping(w, h) {
  const width = Math.min(VIEW.maxWidth, Math.max(VIEW.minWidth, (w / h) * VIEW.height));
  const scale = Math.min(w / width, h / VIEW.height);
  const ox = (w - width * scale) / 2;
  const oy = (h - VIEW.height * scale) / 2;
  return { width, toCss: (x, y) => ({ x: ox + x * scale, y: oy + y * scale }) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(ok, message) {
  console.log(`${ok ? 'OK  ' : 'FOUT'} ${message}`);
  if (!ok) failures++;
}

/** Kleur (RGB) van de canvas op een CSS-punt. */
async function pixel(page, p) {
  return page.evaluate(({ x, y }) => {
    const c = document.querySelector('canvas#game');
    const r = c.width / c.getBoundingClientRect().width;
    const d = c.getContext('2d').getImageData(Math.round(x * r), Math.round(y * r), 1, 1).data;
    return [d[0], d[1], d[2]];
  }, p);
}
// Knopkleur UI_STYLE.button.fill = #ff9800.
const isOrange = ([r, g, b]) => Math.abs(r - 0xff) < 12 && Math.abs(g - 0x98) < 12 && b < 20;

const browser = await chromium.launch();
try {
  for (const [w, h] of [
    [1180, 820],
    [1133, 744],
  ]) {
    console.log(`— ${w}×${h}`);
    const page = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })).newPage();
    await page.goto(gameUrl);
    await sleep(500);
    const m = mapping(w, h);
    const homeCenter = m.toCss(HOME.x + HOME.size / 2, HOME.y + HOME.size / 2);
    // Punt binnen de knop maar naast het (witte) huisje.
    const homeSample = m.toCss(HOME.x + 5, HOME.y + HOME.size / 2);

    check(isOrange(await pixel(page, homeSample)), 'thuisknop zichtbaar op het startscherm');

    // Startscherm → kiesscherm → Rijden!
    const middle = m.toCss(m.width / 2, 420);
    await page.touchscreen.tap(middle.x, middle.y);
    await sleep(300);
    const go = m.toCss(m.width / 2, 392 + 42);
    await page.touchscreen.tap(go.x, go.y);
    await sleep(2500);

    check(!isOrange(await pixel(page, homeSample)), 'thuisknop ontbreekt tijdens het spelen');
    await page.touchscreen.tap(homeCenter.x, homeCenter.y); // = springen
    await sleep(400);
    check(page.url() === gameUrl, 'tik op die plek tijdens het spelen navigeert niet');

    // Pauze → Opnieuw (rit gaat in het boekje) → kiesscherm → terug → startscherm.
    const pause = m.toCss(m.width - 20 - 36, 20 + 36);
    await page.touchscreen.tap(pause.x, pause.y);
    await sleep(300);
    const restart = m.toCss(m.width / 2, 290 + 42);
    await page.touchscreen.tap(restart.x, restart.y);
    await sleep(300);
    const back = m.toCss(20 + 36, 20 + 36);
    await page.touchscreen.tap(back.x, back.y);
    await sleep(300);
    check(isOrange(await pixel(page, homeSample)), 'thuisknop weer zichtbaar op het startscherm');

    const before = await page.evaluate(() => localStorage.getItem('lumi2d.progress.v1'));
    check(before !== null && JSON.parse(before).distance > 0, 'rit staat in het rittenboekje');

    await Promise.all([page.waitForURL(`${origin}/`), page.touchscreen.tap(homeCenter.x, homeCenter.y)]);
    check((await page.locator('#portal').count()) === 1, `tik op de thuisknop gaat naar ${origin}/`);
    const after = await page.evaluate(() => localStorage.getItem('lumi2d.progress.v1'));
    check(after === before, 'rittenboekje ongewijzigd bij het weggaan (niets dubbel geteld)');
    await page.context().close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failures === 0 ? 0 : 1);
