import { expect, test } from "vite-plus/test";
import { authRedirectTo } from "./auth";
import { PAGES_BASEPATH } from "./paths";

test("auth redirect targets GitHub Pages base path", () => {
  expect(authRedirectTo("https://rtabulov.github.io", PAGES_BASEPATH)).toBe(
    "https://rtabulov.github.io/rank-tracker/",
  );
});

test("auth redirect normalizes base path without trailing slash", () => {
  expect(authRedirectTo("http://localhost:5173", "/rank-tracker")).toBe(
    "http://localhost:5173/rank-tracker/",
  );
});
