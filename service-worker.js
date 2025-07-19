import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";

// Precarga los assets generados por next.js (workbox injecta aquí)
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache para navegación (páginas HTML SSR/dinámicas)
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-pages",
    networkTimeoutSeconds: 10,
    plugins: [
      // puedes añadir plugins si quieres (ejemplo: expiration)
    ],
  })
);

// Cache para archivos estáticos Next.js (_next/static/)
registerRoute(
  /\/_next\/static\//,
  new CacheFirst({
    cacheName: "static-resources",
    plugins: [
      // puedes poner expiration aquí también si quieres
    ],
  })
);

// Cache para Google Fonts
registerRoute(
  /^https:\/\/fonts\.(gstatic|googleapis)\.com\//,
  new CacheFirst({
    cacheName: "google-fonts",
  })
);

// Aquí puedes añadir más reglas runtime si quieres (imágenes, APIs, etc)
