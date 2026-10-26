/* Clarity service worker, makes the app open offline.
   Network-first for our own files (always latest when online, cache when
   offline); cache-first for fonts and the OCR bundle. */
const CACHE = 'clarity-v78';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/i18n.js', './js/data.js', './js/store.js', './js/game.js', './js/games.js', './js/engine.js',
  './js/ocr.js', './js/camera.js', './js/speech.js',
  './js/ui.js', './js/app.js',
  './img/logo-brain.png', './img/understanding-dyslexia.jpg', './img/dyslexia-advocacy.jpg', './img/library-services.jpg', './img/lesson-read.jpg', './img/lesson-library.jpg', './img/lesson-focus.jpg', './img/lesson-study.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Network-first for our own files: always load the latest when online,
    // fall back to cache (then the shell) when offline. This stops stale
    // cached CSS/JS from sticking around after an update.
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Cross-origin (fonts, OCR bundle): cache-first, they rarely change.
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.hostname)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
