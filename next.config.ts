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
  // Webpack optimizations to reduce memory usage
  webpack: (config, { dev, isServer }) => {
    // Reduce memory usage in development
    if (dev) {
      // Disable source maps in development to save memory
      config.devtool = false;
      
      // Reduce the number of files webpack processes
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      };
    }
    
    return config;
  },
};

export default withPWA(nextConfig);