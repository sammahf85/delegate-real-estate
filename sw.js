/* Delegate Real Estate — offline support. Change the version to force an update. */
const CACHE = "delegate-v3";
const SHELL = ["./", "index.html", "demo-listings.js", "listings.js", "logo.jpg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

/* The property list and photos: newest from the network, cached copy when offline.
   Everything else: cached copy at once, refreshed in the background. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const fresh = /\/(listings\.js|photos\/[^/]+)$/.test(url.pathname);
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const net = fetch(fresh ? new Request(req.url, { cache: "no-cache" }) : req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit || Response.error());
      return fresh ? net : hit || net;
    })
  );
});
