import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";
import { createAppEnv } from "./src/create-app-env.ts";
import { websitePwaOptions } from "./src/pwa-options.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Config runs in Node; skip bootstrap under Vitest (`mode === "test"`).
  if (mode !== "test") {
    createAppEnv(loadEnv(mode, rootDir, ""));
  }

  return {
    base: "/",
    build: {
      emptyOutDir: true,
    },
    preview: {
      port: 4173,
    },
    plugins: lazyPlugins(async () => {
      const { tanstackStart } = await import("@tanstack/react-start/plugin/vite");
      const { default: react, reactCompilerPreset } = await import("@vitejs/plugin-react");
      const { default: babel } = await import("@rolldown/plugin-babel");
      const { default: tailwindcss } = await import("@tailwindcss/vite");
      const { VitePWA } = await import("vite-plugin-pwa");
      return [
        tanstackStart({
          spa: {
            enabled: true,
            prerender: {
              // Static hosts and `vp preview` serve the prerendered shell as index.html.
              outputPath: "/index",
            },
          },
          client: {
            entry: "./client.tsx",
          },
          start: {
            entry: "./start.ts",
          },
          router: {
            entry: "./router.tsx",
            routesDirectory: "./routes",
            generatedRouteTree: "./routeTree.gen.ts",
          },
        }),
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        ...VitePWA(websitePwaOptions),
      ];
    }),
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    test: {
      // Fork workers can hang when Vitest runs as a subprocess of the Cursor
      // agent (piped stdout in Sandcastle Docker). Threads avoid that IPC stall.
      pool: "threads",
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      env: {
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      },
    },
  };
});
