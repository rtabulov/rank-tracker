import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["pnpm-workspace.yaml"],
  },
  lint: {
    ignorePatterns: [".agents/skills/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
  test: {
    pool: "threads",
    include: [".sandcastle/*.test.ts"],
    exclude: [".sandcastle/worktrees/**", "**/node_modules/**"],
  },
});
