self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("mi-app-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/offline", // Una página offline personalizada
        "/icons/*",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
