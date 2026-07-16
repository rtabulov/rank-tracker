import type { VitePWAOptions } from "vite-plugin-pwa";

export const websitePwaOptions = {
  strategies: "generateSW",
  registerType: "autoUpdate",
  includeAssets: ["favicon.svg", "pwa-192x192.png", "pwa-512x512.png"],
  manifest: {
    name: "Rank Tracker",
    short_name: "Rank Tracker",
    description: "Rank Tracker",
    start_url: "/rank-tracker/",
    scope: "/rank-tracker/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    // Shell precache only — no API/offline data runtime routes.
    runtimeCaching: [],
    navigateFallback: "/rank-tracker/index.html",
  },
} satisfies Partial<VitePWAOptions>;
