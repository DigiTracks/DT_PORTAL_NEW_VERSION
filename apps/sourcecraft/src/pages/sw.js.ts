const CACHE = "sourcecraft-shell-v1";
const SHELL = ["/", "/explore/", "/data/library.json", "/manifest.webmanifest"];

export function GET() {
  const source = `const CACHE = ${JSON.stringify(CACHE)};
const SHELL = ${JSON.stringify(SHELL)};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && (url.pathname.startsWith("/_astro/") || url.pathname === "/data/library.json")) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});`;
  return new Response(source, {
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate", "Service-Worker-Allowed": "/" }
  });
}
