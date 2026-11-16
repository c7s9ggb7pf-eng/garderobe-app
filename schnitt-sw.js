const CACHE = 'schnitt-v5';
const FONT_CACHE = 'schnitt-ext-v1';
const ASSETS = ['./outfit.html', './schnitt-manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Schriften, KI-Modell & Bibliotheken (feste Versionen): einmal laden, danach aus dem Cache – auch offline
  const ext = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
    || (url.hostname === 'cdn.jsdelivr.net' && /onnxruntime-web@|supabase-js@/.test(url.pathname))
    || (url.hostname === 'huggingface.co' && url.pathname.includes('/U-2-Netp/'));
  if (ext) {
    e.respondWith(caches.open(FONT_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // App: immer zuerst aus dem Netz (Updates), offline aus dem Cache
  e.respondWith(
    fetch(req)
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(m => m || caches.match('./outfit.html')))
  );
});
