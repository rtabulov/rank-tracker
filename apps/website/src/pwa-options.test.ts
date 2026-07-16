import { expect, test } from "vite-plus/test";
import { websitePwaOptions } from "./pwa-options.ts";

test("PWA manifest start and scope stay under the Pages base path", () => {
  expect(websitePwaOptions.manifest?.start_url).toBe("/rank-tracker/");
  expect(websitePwaOptions.manifest?.scope).toBe("/rank-tracker/");
});

test("PWA service worker precaches the static shell without API runtime caching", () => {
  expect(websitePwaOptions.strategies).toBe("generateSW");
  expect(websitePwaOptions.workbox?.runtimeCaching ?? []).toEqual([]);
});

test("PWA manifest includes installable PNG icon sizes", () => {
  const sizes = (websitePwaOptions.manifest?.icons ?? []).map((icon) => icon.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
});
