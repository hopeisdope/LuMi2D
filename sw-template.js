/* LuMi2d service worker — gegenereerd bij de build (zie vite.config.ts). Maakt het spel offline speelbaar. */
const CACHE = '__CACHE_NAME__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Oude versies opruimen zodat er geen verouderde bestanden blijven hangen.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lumi2d-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Pagina: eerst netwerk (nieuwste versie), offline de bewaarde versie.
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Alleen een geslaagde HTML-pagina bewaren: een foutpagina mag de offline-versie niet vervangen.
          const type = response.headers.get('content-type') ?? '';
          if (response.ok && type.includes('text/html')) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('./', copy));
          }
          return response;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // Overige bestanden: eerst cache (snel en offline), anders netwerk en bewaren.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
