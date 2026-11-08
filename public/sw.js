/* Luna only caches its public app shell and assets. Personal records stay in localStorage. */
const CACHE = /* CACHE_NAME */ "luna-shell-dev-v3"; /* END_CACHE_NAME */
const PRECACHE = /* PRECACHE_URLS */ [
  "/",
  "/favicon.svg",
  "/manifest.webmanifest",
]; /* END_PRECACHE_URLS */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("luna-shell-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok && !response.redirected) await cache.put("/", response.clone());
          return response;
        } catch {
          return (
            (await cache.match("/")) ||
            new Response("Luna: Please connect once to prepare offline access.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }
  if (PRECACHE.includes(url.pathname) && url.pathname !== "/" && !url.search) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(url.pathname);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && !response.redirected) await cache.put(url.pathname, response.clone());
        return response;
      })(),
    );
  }
});
