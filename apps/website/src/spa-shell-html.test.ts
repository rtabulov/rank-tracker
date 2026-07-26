import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const indexHtmlPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/client/index.html",
);

test.skipIf(!existsSync(indexHtmlPath))(
  "prerendered SPA shell is a full document with layout chrome and bootstrap tags",
  () => {
    const html = readFileSync(indexHtmlPath, "utf8");

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
    expect(html).toContain("Rank Tracker");
    expect(html).toContain('property="og:url"');
    expect(html).toMatch(/rel="stylesheet"/);
    expect(html).toMatch(/type="module"/);
    expect(html).toMatch(/src="\/assets\/index-[^"]+\.js"/);
  },
);
