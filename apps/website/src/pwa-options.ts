import type { VitePWAOptions } from "vite-plugin-pwa";

export const websitePwaOptions = {
  strategies: "generateSW",
  registerType: "autoUpdate",
  includeAssets: ["favicon.svg", "pwa-192x192.png", "pwa-512x512.png"],
  manifest: {
    name: "Rank Tracker",
    short_name: "Rank Tracker",
    description: "Rank Tracker",
    start_url: "/",
    scope: "/",
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
    // Exclude the HTML shell from precache; navigation uses NetworkFirst below.
    // Hashed /assets/* and root static files still use default precache patterns.
    globIgnores: ["**/index.html"],
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "shell-navigation",
          expiration: {
            maxEntries: 1,
          },
        },
      },
    ],
    navigateFallback: "/index.html",
  },
} satisfies Partial<VitePWAOptions>;
