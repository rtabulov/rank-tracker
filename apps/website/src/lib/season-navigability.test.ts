import { expect, test } from "vite-plus/test";
import { isSeasonNumberNavigable, seasonsFromNumbers } from "./season-navigability.ts";

test("Current Season is always navigable even when absent from the index list", () => {
  expect(isSeasonNumberNavigable(11, [10])).toBe(true);
  expect(isSeasonNumberNavigable(10, [10])).toBe(true);
  expect(isSeasonNumberNavigable(9, [10])).toBe(false);
});

test("seasonsFromNumbers maps to Season rows newest-first", () => {
  expect(seasonsFromNumbers([10, 11]).map((season) => season.number)).toEqual([11, 10]);
});
