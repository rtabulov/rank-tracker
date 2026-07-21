import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const SITE_TITLE = "Rank Tracker";
const SITE_DESCRIPTION = "Personal Rank Score history for The Finals ranked play.";
const PRODUCTION_URL = "https://rank.rtabulov.dev/";
const PRODUCTION_OG_IMAGE_URL = "https://rank.rtabulov.dev/og.png";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexHtmlPath = path.join(websiteRoot, "index.html");
const ogImagePath = path.join(websiteRoot, "public/og.png");

function readIndexHtml(): string {
  return readFileSync(indexHtmlPath, "utf-8");
}

function getTitle(html: string): string | undefined {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match?.[1];
}

function getMetaByName(html: string, name: string): string | undefined {
  const match = html.match(new RegExp(`<meta\\s+[^>]*name="${name}"[^>]*content="([^"]*)"`, "i"));
  if (match) return match[1];
  const altMatch = html.match(
    new RegExp(`<meta\\s+[^>]*content="([^"]*)"[^>]*name="${name}"`, "i"),
  );
  return altMatch?.[1];
}

function getMetaByProperty(html: string, property: string): string | undefined {
  const match = html.match(
    new RegExp(`<meta\\s+[^>]*property="${property}"[^>]*content="([^"]*)"`, "i"),
  );
  if (match) return match[1];
  const altMatch = html.match(
    new RegExp(`<meta\\s+[^>]*content="([^"]*)"[^>]*property="${property}"`, "i"),
  );
  return altMatch?.[1];
}

test("static document exposes theme-color metas aligned with the shell palette", () => {
  const html = readIndexHtml();

  expect(html).toMatch(
    /<meta\s+[^>]*name="theme-color"[^>]*content="#f4f4f8"[^>]*media="\(prefers-color-scheme:\s*light\)"/i,
  );
  expect(html).toMatch(
    /<meta\s+[^>]*name="theme-color"[^>]*content="#0a0a0f"[^>]*media="\(prefers-color-scheme:\s*dark\)"/i,
  );
});

test("static document boot script syncs theme-color to the resolved shell background", () => {
  const html = readIndexHtml();

  expect(html).toMatch(/data-shell-chrome/);
  expect(html).toMatch(/resolved === "dark" \? "#0a0a0f" : "#f4f4f8"/);
});

test("static document exposes the Rank Tracker title for crawlers", () => {
  expect(getTitle(readIndexHtml())).toBe(SITE_TITLE);
});

test("static document exposes the product pitch in plain description meta", () => {
  expect(getMetaByName(readIndexHtml(), "description")).toBe(SITE_DESCRIPTION);
});

test("static document exposes Open Graph text fields and production URL", () => {
  const html = readIndexHtml();

  expect(getMetaByProperty(html, "og:title")).toBe(SITE_TITLE);
  expect(getMetaByProperty(html, "og:description")).toBe(SITE_DESCRIPTION);
  expect(getMetaByProperty(html, "og:type")).toBe("website");
  expect(getMetaByProperty(html, "og:url")).toBe(PRODUCTION_URL);
});

test("static document exposes Open Graph and Twitter image tags for large-image unfurls", () => {
  const html = readIndexHtml();

  expect(getMetaByProperty(html, "og:image")).toBe(PRODUCTION_OG_IMAGE_URL);
  expect(getMetaByName(html, "twitter:card")).toBe("summary_large_image");
  expect(getMetaByName(html, "twitter:title")).toBe(SITE_TITLE);
  expect(getMetaByName(html, "twitter:description")).toBe(SITE_DESCRIPTION);
  expect(getMetaByName(html, "twitter:image")).toBe(PRODUCTION_OG_IMAGE_URL);
});

test("static document ships a non-empty og.png preview asset at the public path", () => {
  const png = readFileSync(ogImagePath);

  expect(png.length).toBeGreaterThan(0);
  expect(
    png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ).toBe(true);
});

test("static document preview fields omit personal Entry or Season data", () => {
  const html = readIndexHtml();
  const previewFields = [
    getTitle(html),
    getMetaByName(html, "description"),
    getMetaByProperty(html, "og:title"),
    getMetaByProperty(html, "og:description"),
    getMetaByProperty(html, "og:image"),
    getMetaByName(html, "twitter:title"),
    getMetaByName(html, "twitter:description"),
    getMetaByName(html, "twitter:image"),
  ]
    .filter(Boolean)
    .join("\n");

  expect(previewFields).not.toMatch(/Entry|Season|Latest RS|Local store/i);
});
