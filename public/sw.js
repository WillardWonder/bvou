const CACHE = "merrill-wrestling-shell-v2";
const scopeRoot = new URL("./", self.registration.scope);
const asset = (path) => new URL(path, scopeRoot).toString();
const HOME = asset("./");
const SHELL = [
  HOME,
  asset("manifest.webmanifest"),
  asset("favicon.png"),
  asset("apple-touch-icon.png"),
  asset("brand/merrill-girls-bluejay.png"),
  asset("brand/merrill-girls-wrestling.png"),
  asset("icons/icon-192.png"),
  asset("icons/icon-512.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(scopeRoot.href)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(HOME, copy));
          return response;
        })
        .catch(() => caches.match(HOME))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
