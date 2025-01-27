// import type { NextConfig } from "next";

import pwa from "next-pwa";

const withPWA = pwa({
  dest: "public", // Carpeta donde se generará el Service Worker
  disable: process.env.NODE_ENV === "development", // Desactiva PWA en modo desarrollo
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/_next\/static\//,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    {
      // Precaching para imágenes
      urlPattern: /^https:\/\/.*\/_next\/image\//, // Imágenes optimizadas de Next.js
      handler: "CacheFirst",
      options: {
        cacheName: "next-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },
    {
      // Cacheo para todas las demás rutas
      urlPattern: /^https:\/\/.*/, // Todas las demás rutas
      handler: "NetworkFirst",
      options: {
        cacheName: "dynamic-content",
        expiration: {
          maxEntries: 100,
        },
      },
    },
  ],
});

const nextConfig = withPWA({
  /* config options here */
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
});

export default nextConfig;
