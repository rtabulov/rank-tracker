import { expect, test } from "vite-plus/test";
import { rankFromRs } from "./rank-from-rs";

test("rankFromRs maps known ladder samples", () => {
  expect(rankFromRs(0)).toBe("BRONZE 4");
  expect(rankFromRs(2500)).toBe("BRONZE 3");
  expect(rankFromRs(20000)).toBe("GOLD 4");
  expect(rankFromRs(27500)).toBe("GOLD 1");
  expect(rankFromRs(47500)).toBe("DIAMOND 1");
  expect(rankFromRs(50000)).toBe("DIAMOND 1");
});
