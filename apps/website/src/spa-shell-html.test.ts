import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const indexHtmlPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/client/index.html",
);

// Without SPA mode there is no prerendered shell index.html; the Worker
// emits the document at request time. Keep this probe so a future
// accidental SPA/prerender re-enable still has a smoke check.
test.skipIf(!existsSync(indexHtmlPath))(
  "built client index.html is a full document with bootstrap tags when present",
  () => {
    const html = readFileSync(indexHtmlPath, "utf8");

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
    expect(html).toMatch(/rel="stylesheet"/);
    expect(html).toMatch(/type="module"/);
  },
);
