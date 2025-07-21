import withPWA from "next-pwa";

const baseConfig = {
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
};

const pwaConfig = {
  dest: "public",
  // La opción 'additionalManifestEntries' se mueve aquí, al nivel superior.
  // Ya no está dentro de 'workboxOptions'.
  additionalManifestEntries: [{ url: "/offline.html", revision: null }],
  swSrc: "service-worker.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
};

export default withPWA(pwaConfig)(baseConfig);
