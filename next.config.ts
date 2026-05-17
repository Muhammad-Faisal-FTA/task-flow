// next.config.ts
import type { NextConfig } from "next";
import withPWAInit         from "next-pwa";

const withPWA = withPWAInit({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.DISABLE_PWA === "true",

  runtimeCaching: [
    // API routes — network first, 5 min cache
    {
      urlPattern: /^https?.*\/api\/.*/i,
      handler:    "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries:    50,
          maxAgeSeconds: 5 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },

    // Static assets — cache first, 30 days
    {
      urlPattern: /\.(?:js|css|woff2|woff|ttf|png|jpg|jpeg|svg|ico)$/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries:    100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },

    // Google Fonts stylesheets — stale while revalidate
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler:    "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts-stylesheets",
      },
    },

    // Google Fonts files — cache first, 1 year
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler:    "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries:    30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },

    // All other pages — network first, 24h cache
    {
      urlPattern: /^https?.*$/,
      handler:    "NetworkFirst",
      options: {
        cacheName:             "pages-cache",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries:    50,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool  = false;
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);