import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

// --------------------------------------------------
// Configuración Básica
// --------------------------------------------------

self.skipWaiting();
clientsClaim();

// --------------------------------------------------
// Precaché (Archivos estáticos del build)
// --------------------------------------------------

// next-pwa inyectará aquí el manifest de los archivos de tu app.
precacheAndRoute(self.__WB_MANIFEST || []);

// ==================================================================
// RUTA DE NAVEGACIÓN (La solución a tu problema)
// ==================================================================

// Esta regla intercepta TODAS las peticiones de navegación (cargas de página).
registerRoute(
  // Solo aplica cuando el modo de la petición es 'navigate'.
  new NavigationRoute(
    // Usa la estrategia CacheFirst.
    new CacheFirst({
      // Dale un nombre a tu caché de páginas.
      cacheName: "pages-cache",
      plugins: [
        // Asegura que solo se cacheen respuestas HTML exitosas.
        new CacheableResponsePlugin({
          statuses: [200],
          headers: { "Content-Type": "text/html; charset=utf-p" },
        }),
      ],
      // ¡ESTA ES LA MAGIA!
      // Le dice a Workbox que ignore los parámetros de búsqueda (?id=123, ?user=abc)
      // al buscar una coincidencia en la caché.
      matchOptions: {
        ignoreSearch: true,
      },
    })
  )
);

// --------------------------------------------------
// Estrategia para Assets (CSS, JS, Imágenes)
// --------------------------------------------------

// Es una buena práctica manejar los assets con StaleWhileRevalidate
// para que se muestren rápido desde caché pero se actualicen en segundo plano.
registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font",

  new StaleWhileRevalidate({
    cacheName: "static-assets-cache",
    plugins: [
      // Limita la vida y el número de assets en caché.
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
      }),
    ],
  })
);
