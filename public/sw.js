/* Kaliakair ration service — offline support for the field-agent and citizen apps.
   Static build assets: cache-first. Pages and RSC payloads: network-first, fall back to cache. */
const VERSION = "kp-v2";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const PRECACHE = ["/agent", "/agent/new", "/agent/login", "/citizen", "/citizen/login", "/citizen/products", "/citizen/cart", "/citizen/orders", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(woff2?|svg|png|jpg|ico|css)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(STATIC).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  const isPage = req.mode === "navigate" || req.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (isPage && (url.pathname.startsWith("/agent") || url.pathname.startsWith("/citizen"))) {
    // RSC payloads differ per router state; key them by path + RSC flag only
    const key = req.headers.get("RSC") === "1" || url.searchParams.has("_rsc") ? new Request(`${url.pathname}?__rsc`) : new Request(url.pathname);
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(PAGES).then((c) => c.put(key, res.clone()));
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || caches.match(new Request(url.pathname)) || Response.error())),
    );
  }
});
