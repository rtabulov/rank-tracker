import { expect, test } from "vite-plus/test";
import {
  SHELL_BACKGROUND_DARK,
  SHELL_BACKGROUND_LIGHT,
  shellBackgroundForEffectiveTheme,
  syncThemeColorMeta,
} from "./shell-chrome-colors.ts";

test("shell background for effective light theme matches the light UI shell", () => {
  expect(shellBackgroundForEffectiveTheme("light")).toBe(SHELL_BACKGROUND_LIGHT);
  expect(SHELL_BACKGROUND_LIGHT).toBe("#f4f4f8");
});

test("shell background for effective dark theme matches the dark UI shell", () => {
  expect(shellBackgroundForEffectiveTheme("dark")).toBe(SHELL_BACKGROUND_DARK);
  expect(SHELL_BACKGROUND_DARK).toBe("#0a0a0f");
});

test("syncThemeColorMeta sets document theme-color to the resolved shell background", () => {
  syncThemeColorMeta("dark");

  const meta = document.querySelector('meta[name="theme-color"][data-shell-chrome]');
  expect(meta?.getAttribute("content")).toBe(SHELL_BACKGROUND_DARK);

  syncThemeColorMeta("light");
  expect(meta?.getAttribute("content")).toBe(SHELL_BACKGROUND_LIGHT);
});
