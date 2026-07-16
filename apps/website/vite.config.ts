import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  base: "/rank-tracker/",
  plugins: lazyPlugins(async () => {
    const { default: react, reactCompilerPreset } = await import("@vitejs/plugin-react");
    const { default: babel } = await import("@rolldown/plugin-babel");
    return [react(), babel({ presets: [reactCompilerPreset()] })];
  }),
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
