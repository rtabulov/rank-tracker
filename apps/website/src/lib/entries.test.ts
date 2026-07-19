import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { createEntry, updateEntry } from "./entries.ts";

describe("createEntry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("stamps updatedAt as ISO-8601 UTC on create", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-17T12:34:56.789Z"));

    const entry = createEntry({
      id: "entry-1",
      rs: 42000,
      recordedAt: "2026-04-01T10:00:00.000Z",
    });

    expect(entry.updatedAt).toBe("2026-07-17T12:34:56.789Z");
    expect(entry.recordedAt).toBe("2026-04-01T10:00:00.000Z");
  });
});

describe("updateEntry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("stamps updatedAt as ISO-8601 UTC on edit", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-17T15:00:00.000Z"));

    const existing = createEntry({
      id: "entry-1",
      rs: 42000,
      recordedAt: "2026-04-01T10:00:00.000Z",
    });
    vi.setSystemTime(new Date("2026-07-17T16:00:00.000Z"));

    const updated = updateEntry([existing], "entry-1", {
      rs: 45000,
      recordedAt: "2026-04-02T10:00:00.000Z",
    });

    expect(updated[0]?.updatedAt).toBe("2026-07-17T16:00:00.000Z");
    expect(updated[0]?.recordedAt).toBe("2026-04-02T10:00:00.000Z");
  });
});
