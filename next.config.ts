// import type { NextConfig } from "next";

import pwa from "next-pwa";

const withPWA = pwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  disableDevLogs: true,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Next static files
    {
      urlPattern: /^\/_next\/static\//,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    // Next image optimizer
    {
      urlPattern: /^\/_next\/image\//,
      handler: "CacheFirst",
      options: {
        cacheName: "next-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 30,
        },
      },
    },
    // Firestore API (solo lectura)
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "firestore-api",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    // HTML/SSR pages
    {
      urlPattern: /^\/$/, // raíz
      handler: "NetworkFirst",
      options: {
        cacheName: "html-cache",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    // Tu dominio general
    {
      urlPattern: /^https:\/\/disgom-app\.web\.app\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "app-pages",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
  // fallbacks: {
  //   document: "/offline.html", // crea este archivo en /public
  // },
});

const nextConfig = withPWA({
  /* config options here */
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
});

export default nextConfig;
