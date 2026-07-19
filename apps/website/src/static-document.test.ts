import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const SITE_TITLE = "Rank Tracker";
const SITE_DESCRIPTION = "Personal Rank Score history for The Finals ranked play.";
const PRODUCTION_URL = "https://rank.rtabulov.dev/";

const indexHtmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../index.html");

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

test("static document exposes Twitter text card fields without image tags", () => {
  const html = readIndexHtml();

  expect(getMetaByName(html, "twitter:card")).toBe("summary");
  expect(getMetaByName(html, "twitter:title")).toBe(SITE_TITLE);
  expect(getMetaByName(html, "twitter:description")).toBe(SITE_DESCRIPTION);
  expect(getMetaByName(html, "twitter:image")).toBeUndefined();
});

test("static document preview fields omit personal Entry or Season data", () => {
  const html = readIndexHtml();
  const previewFields = [
    getTitle(html),
    getMetaByName(html, "description"),
    getMetaByProperty(html, "og:title"),
    getMetaByProperty(html, "og:description"),
    getMetaByName(html, "twitter:title"),
    getMetaByName(html, "twitter:description"),
  ]
    .filter(Boolean)
    .join("\n");

  expect(previewFields).not.toMatch(/Entry|Season|Latest RS|Local store/i);
});
