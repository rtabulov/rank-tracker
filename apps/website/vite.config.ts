import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/rank-tracker/",
  plugins: lazyPlugins(async () => {
    const { default: react, reactCompilerPreset } = await import("@vitejs/plugin-react");
    const { default: babel } = await import("@rolldown/plugin-babel");
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()];
  }),
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
