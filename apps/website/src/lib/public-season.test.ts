import { describe, expect, test } from "vite-plus/test";
import { createMemoryPublicSeasonClient } from "./public-season.ts";

const s11Entry = {
  id: "s11",
  rs: 33000,
  recordedAt: "2026-07-16T10:00:00.000Z",
  updatedAt: "2026-07-16T10:00:00.000Z",
};

const s10Entry = {
  id: "s10",
  rs: 28000,
  recordedAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z",
};

describe("createMemoryPublicSeasonClient", () => {
  test("index returns null for unknown or private players", async () => {
    const client = createMemoryPublicSeasonClient({
      players: {
        Hidden: {
          displayName: "Hidden",
          isPublic: false,
          entries: [s11Entry],
        },
      },
    });

    expect(await client.getPublicSeasonIndex("nobody")).toBeNull();
    expect(await client.getPublicSeasonIndex("Hidden")).toBeNull();
  });

  test("index returns displayName and navigable season numbers including Current Season", async () => {
    const client = createMemoryPublicSeasonClient({
      players: {
        FinalsFan: {
          displayName: "FinalsFan",
          isPublic: true,
          entries: [s10Entry],
        },
      },
    });

    const index = await client.getPublicSeasonIndex("finalsfan");
    expect(index).toEqual({
      displayName: "FinalsFan",
      seasonNumbers: expect.arrayContaining([10, 11]),
    });
    expect(index?.seasonNumbers).toHaveLength(2);
  });

  test("entries returns only the requested season rows", async () => {
    const client = createMemoryPublicSeasonClient({
      players: {
        FinalsFan: {
          displayName: "FinalsFan",
          isPublic: true,
          entries: [s10Entry, s11Entry],
        },
      },
    });

    const season10 = await client.getPublicSeasonEntries("FinalsFan", 10);
    expect(season10).toEqual({
      displayName: "FinalsFan",
      seasonNumber: 10,
      entries: [s10Entry],
    });

    const season11 = await client.getPublicSeasonEntries("FinalsFan", 11);
    expect(season11).toEqual({
      displayName: "FinalsFan",
      seasonNumber: 11,
      entries: [s11Entry],
    });
  });

  test("entries returns null for private players", async () => {
    const client = createMemoryPublicSeasonClient({
      players: {
        Hidden: {
          displayName: "Hidden",
          isPublic: false,
          entries: [s11Entry],
        },
      },
    });

    expect(await client.getPublicSeasonEntries("Hidden", 11)).toBeNull();
  });
});
