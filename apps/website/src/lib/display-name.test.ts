import { expect, test } from "vite-plus/test";
import { normalizeDisplayName, validateDisplayName } from "./display-name";

test("validateDisplayName accepts a known-good display name", () => {
  expect(validateDisplayName("FinalsFan_42")).toBeNull();
});

test("validateDisplayName rejects names shorter than 3 characters", () => {
  expect(validateDisplayName("ab")).toBe("Display name must be at least 3 characters.");
});

test("validateDisplayName rejects names longer than 24 characters", () => {
  expect(validateDisplayName("a".repeat(25))).toBe("Display name must be at most 24 characters.");
});

test("validateDisplayName rejects invalid characters", () => {
  expect(validateDisplayName("bad name")).toBe(
    "Use letters, numbers, underscores, or hyphens only.",
  );
});

test("normalizeDisplayName trims surrounding whitespace", () => {
  expect(normalizeDisplayName("  FinalsFan  ")).toBe("FinalsFan");
});
