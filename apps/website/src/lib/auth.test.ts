import { expect, test } from "vite-plus/test";
import { authRedirectTo } from "./auth";
import { PAGES_BASEPATH } from "./paths";

test("auth redirect targets site root on custom domain", () => {
  expect(authRedirectTo("https://rank.rtabulov.dev", PAGES_BASEPATH)).toBe(
    "https://rank.rtabulov.dev/",
  );
});

test("auth redirect normalizes base path without trailing slash", () => {
  expect(authRedirectTo("http://localhost:5173", "/")).toBe("http://localhost:5173/");
});
