import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readWranglerConfig(): {
  main?: string;
  compatibility_flags?: string[];
  workers_dev?: boolean;
  assets?: { not_found_handling?: string };
  routes?: Array<{ pattern?: string; custom_domain?: boolean }>;
} {
  const raw = readFileSync(path.join(websiteRoot, "wrangler.jsonc"), "utf8");
  const withoutLineComments = raw.replace(/^\s*\/\/.*$/gm, "");
  const withoutTrailingCommas = withoutLineComments.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(withoutTrailingCommas) as ReturnType<typeof readWranglerConfig>;
}

test("Wrangler uses Start server entry with nodejs_compat", () => {
  const config = readWranglerConfig();
  expect(config.main).toBe("@tanstack/react-start/server-entry");
  expect(config.compatibility_flags).toContain("nodejs_compat");
});

test("Wrangler binds production custom domain and disables workers.dev", () => {
  const config = readWranglerConfig();
  expect(config.workers_dev).toBe(false);
  expect(config.routes).toEqual([
    {
      pattern: "rank.rtabulov.dev",
      custom_domain: true,
    },
  ]);
});

test("Wrangler serves the SPA shell for unmatched document navigations", () => {
  const config = readWranglerConfig();
  expect(config.assets?.not_found_handling).toBe("single-page-application");
});
