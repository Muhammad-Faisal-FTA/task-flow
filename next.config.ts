// export default withPWA(nextConfig);

// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  customWorkerSrc:  "sw-custom.js",   // ← use our custom SW
  customWorkerDest: "public",

  // ── Only disable in dev when explicitly needed ──────────────────────────
  // Set DISABLE_PWA=true in .env to disable
  disable: process.env.DISABLE_PWA === "true",

  // ── Runtime caching ─────────────────────────────────────────────────────
  runtimeCaching: [
    // API routes — network first, fall back to cache
    {
      urlPattern: /^https?.*\/api\/.*/i,
      handler:    "NetworkFirst",
      options: {
        cacheName:          "api-cache",
        expiration: {
          maxEntries:       50,
          maxAgeSeconds:    5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Static assets — cache first
    {
      urlPattern: /\.(?:js|css|woff2|woff|ttf|png|jpg|jpeg|svg|ico)$/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries:    100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler:    "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts-stylesheets",
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries:    30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Pages — network first
    {
      urlPattern: /^https?.*$/,
      handler:    "NetworkFirst",
      options: {
        cacheName:             "pages-cache",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries:    50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
} as any);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ── Remove turbopack — conflicts with --webpack flag ────────────────────
  // turbopack: {},   ← REMOVED

  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Webpack config ───────────────────────────────────────────────────────
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);