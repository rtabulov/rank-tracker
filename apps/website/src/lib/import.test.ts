import { describe, expect, test } from "vite-plus/test";
import { APP_SCHEMA_VERSION } from "./schema.ts";
import { validateImportDocument } from "./import.ts";

describe("validateImportDocument migration", () => {
  test("migrates v1 Import by adding updatedAt from recordedAt", () => {
    const raw = JSON.stringify({
      version: 1,
      entries: [
        {
          id: "legacy-entry",
          rs: 42000,
          recordedAt: "2026-07-16T10:00:00.000Z",
        },
      ],
    });

    const result = validateImportDocument(raw);

    expect(result).toEqual({
      ok: true,
      store: {
        version: APP_SCHEMA_VERSION,
        entries: [
          {
            id: "legacy-entry",
            rs: 42000,
            recordedAt: "2026-07-16T10:00:00.000Z",
            updatedAt: "2026-07-16T10:00:00.000Z",
          },
        ],
      },
    });
  });

  test("preserves updatedAt when present on Import", () => {
    const raw = JSON.stringify({
      version: APP_SCHEMA_VERSION,
      entries: [
        {
          id: "synced-entry",
          rs: 55000,
          recordedAt: "2026-07-16T10:00:00.000Z",
          updatedAt: "2026-07-17T08:00:00.000Z",
        },
      ],
    });

    const result = validateImportDocument(raw);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.store.entries[0]?.updatedAt).toBe("2026-07-17T08:00:00.000Z");
    }
  });
});
