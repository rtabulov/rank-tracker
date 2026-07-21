import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import {
  PRODUCTION_OG_IMAGE_URL,
  PRODUCTION_URL,
  SHELL_CRITICAL_CSS,
  SITE_DESCRIPTION,
  SITE_TITLE,
  THEME_BOOT_SCRIPT,
  staticDocumentHead,
} from "./lib/static-document.ts";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ogImagePath = path.join(websiteRoot, "public/og.png");

function metaValue(
  meta: ReadonlyArray<Record<string, string | undefined>>,
  key: "name" | "property",
  value: string,
): string | undefined {
  return meta.find((entry) => entry[key] === value)?.content;
}

test("static document exposes theme-color metas aligned with the shell palette", () => {
  const { meta } = staticDocumentHead();

  expect(metaValue(meta, "name", "theme-color")).toBe("#f4f4f8");
  expect(
    meta.find(
      (entry) =>
        entry.name === "theme-color" &&
        entry.media === "(prefers-color-scheme: light)" &&
        entry.content === "#f4f4f8",
    ),
  ).toBeDefined();
  expect(
    meta.find(
      (entry) =>
        entry.name === "theme-color" &&
        entry.media === "(prefers-color-scheme: dark)" &&
        entry.content === "#0a0a0f",
    ),
  ).toBeDefined();
});

test("static document boot script syncs theme-color to the resolved shell background", () => {
  expect(THEME_BOOT_SCRIPT).toMatch(/data-shell-chrome/);
  expect(THEME_BOOT_SCRIPT).toMatch(/resolved === "dark" \? "#0a0a0f" : "#f4f4f8"/);
});

test("static document ships critical shell background CSS for first paint", () => {
  const { styles } = staticDocumentHead();
  expect(styles).toEqual([{ children: SHELL_CRITICAL_CSS }]);
  expect(SHELL_CRITICAL_CSS).toContain("background-color:#f4f4f8");
  expect(SHELL_CRITICAL_CSS).toContain("html.dark");
  expect(SHELL_CRITICAL_CSS).toContain("background-color:#0a0a0f");
});

test("static document exposes the Rank Tracker title for crawlers", () => {
  expect(staticDocumentHead().title).toBe(SITE_TITLE);
});

test("static document exposes the product pitch in plain description meta", () => {
  const { meta } = staticDocumentHead();
  expect(metaValue(meta, "name", "description")).toBe(SITE_DESCRIPTION);
});

test("static document exposes Open Graph text fields and production URL", () => {
  const { meta } = staticDocumentHead();

  expect(metaValue(meta, "property", "og:title")).toBe(SITE_TITLE);
  expect(metaValue(meta, "property", "og:description")).toBe(SITE_DESCRIPTION);
  expect(metaValue(meta, "property", "og:type")).toBe("website");
  expect(metaValue(meta, "property", "og:url")).toBe(PRODUCTION_URL);
});

test("static document exposes Open Graph and Twitter image tags for large-image unfurls", () => {
  const { meta } = staticDocumentHead();

  expect(metaValue(meta, "property", "og:image")).toBe(PRODUCTION_OG_IMAGE_URL);
  expect(metaValue(meta, "name", "twitter:card")).toBe("summary_large_image");
  expect(metaValue(meta, "name", "twitter:title")).toBe(SITE_TITLE);
  expect(metaValue(meta, "name", "twitter:description")).toBe(SITE_DESCRIPTION);
  expect(metaValue(meta, "name", "twitter:image")).toBe(PRODUCTION_OG_IMAGE_URL);
});

test("static document ships a non-empty og.png preview asset at the public path", () => {
  const png = readFileSync(ogImagePath);

  expect(png.length).toBeGreaterThan(0);
  expect(
    png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ).toBe(true);
});

test("static document preview fields omit personal Entry or Season data", () => {
  const { meta, title } = staticDocumentHead();
  const previewFields = [
    title,
    metaValue(meta, "name", "description"),
    metaValue(meta, "property", "og:title"),
    metaValue(meta, "property", "og:description"),
    metaValue(meta, "property", "og:image"),
    metaValue(meta, "name", "twitter:title"),
    metaValue(meta, "name", "twitter:description"),
    metaValue(meta, "name", "twitter:image"),
  ]
    .filter(Boolean)
    .join("\n");

  expect(previewFields).not.toMatch(/Entry|Season|Latest RS|Local store/i);
});
