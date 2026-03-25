import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // disable PWA in dev
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {}, // prevents warning
  typescript: {
    ignoreBuildErrors: true, // ← skips type errors during build
  },
  
};

export default withPWA(nextConfig);