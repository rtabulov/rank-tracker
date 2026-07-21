import { expect, test } from "vite-plus/test";
import { websitePwaOptions } from "./pwa-options.ts";

type NavigationMatchPattern = (ctx: { request: Request; url: URL }) => boolean;

function matchesNavigationPattern(pattern: unknown, mode: RequestMode): boolean {
  if (typeof pattern !== "function") {
    return false;
  }

  const request = { mode } as Request;
  return (pattern as NavigationMatchPattern)({
    request,
    url: new URL("https://rank.rtabulov.dev/"),
  });
}

test("PWA manifest chrome colors match the app shell palette", () => {
  expect(websitePwaOptions.manifest?.background_color).toBe("#0a0a0f");
  expect(websitePwaOptions.manifest?.theme_color).toBe("#f4f4f8");
  expect(websitePwaOptions.manifest?.background_color).not.toBe("#ffffff");
  expect(websitePwaOptions.manifest?.theme_color).not.toBe("#ffffff");
});

test("PWA manifest start and scope stay at site root", () => {
  expect(websitePwaOptions.manifest?.start_url).toBe("/");
  expect(websitePwaOptions.manifest?.scope).toBe("/");
});

test("PWA manifest includes installable PNG icon sizes", () => {
  const sizes = (websitePwaOptions.manifest?.icons ?? []).map((icon) => icon.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
});

test("PWA precache excludes the SPA shell while keeping default hashed asset patterns", () => {
  expect(websitePwaOptions.workbox?.globIgnores).toContain("**/_shell.html");
  expect(websitePwaOptions.workbox?.globIgnores).toContain("**/index.html");
  expect(websitePwaOptions.workbox).not.toHaveProperty("globPatterns");
});

test("PWA navigation uses NetworkFirst with single-entry offline fallback and no API runtime rules", () => {
  expect(websitePwaOptions.strategies).toBe("generateSW");
  expect(websitePwaOptions.workbox?.navigateFallback).toBe("/index.html");

  const runtimeCaching = websitePwaOptions.workbox?.runtimeCaching ?? [];
  expect(runtimeCaching).toHaveLength(1);

  const navigationRule = runtimeCaching[0];
  expect(navigationRule?.handler).toBe("NetworkFirst");
  expect(navigationRule?.options?.expiration?.maxEntries).toBe(1);
  expect(navigationRule?.options).not.toHaveProperty("networkTimeoutSeconds");
  expect(typeof navigationRule?.urlPattern).toBe("function");
  expect(matchesNavigationPattern(navigationRule?.urlPattern, "navigate")).toBe(true);
  expect(matchesNavigationPattern(navigationRule?.urlPattern, "cors")).toBe(false);
});
