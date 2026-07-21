import { expect, test } from "vite-plus/test";
import { publicSeasonLinkPath } from "./public-link";

test("public season link path is rooted at site base path", () => {
  expect(publicSeasonLinkPath("FinalsFan")).toBe("/p/FinalsFan");
});
