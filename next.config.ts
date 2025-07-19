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
  swSrc: "service-worker.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
    image: "",
    audio: "",
    video: "",
    font: "",
  },
};

export default withPWA(pwaConfig)(baseConfig);
