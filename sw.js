/* Bida-Vibe offline helper (service worker).
   Keeps a copy of the app on the device so games, plan, timer, scoreboard, raffle and sound pads work with no signal.
   - App files (html/js/css/json): internet first, so updates arrive right away; the saved copy is used only when offline.
   - Sounds and fonts: saved copy first (they rarely change), refreshed in the background.
   - Never touches YouTube, Firebase, Google sign-in, the payment Worker, or anything that isn't a plain GET. */
const CACHE = 'bida-v1';
const CORE = ['./', 'index.html', 'bida-app.js', 'bida.css', 'bida-content.js', 'vk-avatars.js', 'legal.html'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  // the list of free sound pads (read from GitHub) is kept too, so the pads still show offline
  if (url.hostname === 'api.github.com' && /\/contents\/sounds\/free$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;          // YouTube, Firebase, Google, Worker: straight to the network
  if (same && /\/(sing|remote)\.html$/.test(url.pathname)) return;     // guest pages and the remote are live-only
  if (req.headers.has('range')) return;                                // streamed audio/video parts can't be saved
  const isMedia = /\.(mp3|m4a|ogg|wav|webm|woff2?)$/i.test(url.pathname) || FONT_HOSTS.includes(url.hostname);
  e.respondWith(isMedia ? cacheFirst(req) : networkFirst(req));
});

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.status === 200) c.put(req, res.clone()).catch(() => { });
    return res;
  } catch (err) {
    // ?v=... changes on every update, so fall back to the same file without the query
    return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) ||
      (req.mode === 'navigate' ? (await c.match('index.html')) || (await c.match('./')) : Response.error());
  }
}
async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const fresh = fetch(req).then(res => { if (res.status === 200 || res.type === 'opaque') c.put(req, res.clone()).catch(() => { }); return res; }).catch(() => null);
  return hit || (await fresh) || Response.error();
}
