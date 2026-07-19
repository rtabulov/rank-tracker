import { expect, test } from "vite-plus/test";
import { formatHeaderEyebrow } from "./header-eyebrow";

test("formatHeaderEyebrow uses placeholders when display name and entries are missing", () => {
  expect(
    formatHeaderEyebrow({
      displayName: null,
      entries: [],
      seasonNumber: 11,
    }),
  ).toBe("SYS // RANK");
});

test("formatHeaderEyebrow preserves display name casing and uses rank placeholder without entries", () => {
  expect(
    formatHeaderEyebrow({
      displayName: "FinalsFan",
      entries: [],
      seasonNumber: 11,
    }),
  ).toBe("FinalsFan // RANK");
});

test("formatHeaderEyebrow derives rank from selected season latest RS", () => {
  expect(
    formatHeaderEyebrow({
      displayName: null,
      entries: [
        {
          id: "entry-a",
          rs: 27500,
          recordedAt: "2026-07-14T10:00:00.000Z",
          updatedAt: "2026-07-14T10:00:00.000Z",
        },
      ],
      seasonNumber: 11,
    }),
  ).toBe("SYS // GOLD 1");
});

test("formatHeaderEyebrow combines display name and rank for populated season", () => {
  expect(
    formatHeaderEyebrow({
      displayName: "MyPlayer",
      entries: [
        {
          id: "entry-a",
          rs: 20000,
          recordedAt: "2026-07-14T10:00:00.000Z",
          updatedAt: "2026-07-14T10:00:00.000Z",
        },
      ],
      seasonNumber: 11,
    }),
  ).toBe("MyPlayer // GOLD 4");
});
