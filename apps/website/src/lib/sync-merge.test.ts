import { describe, expect, test } from "vite-plus/test";
import { mergeSyncEntries } from "./sync-merge.ts";
import type { Entry } from "./types.ts";

const localOnly: Entry = {
  id: "local-only",
  rs: 41000,
  recordedAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-07-10T08:00:00.000Z",
};

const cloudOnly: Entry = {
  id: "cloud-only",
  rs: 42000,
  recordedAt: "2026-04-02T12:00:00.000Z",
  updatedAt: "2026-07-11T09:00:00.000Z",
};

describe("mergeSyncEntries", () => {
  test("union merge keeps Entry ids present on only one side", () => {
    const result = mergeSyncEntries({
      localEntries: [localOnly],
      cloudEntries: [cloudOnly],
      knownSyncedIds: new Set(),
    });

    expect(result.entries).toEqual([localOnly, cloudOnly]);
    expect(result.upserts).toEqual([localOnly]);
    expect(result.deletes).toEqual([]);
  });

  test("same id resolves by newer updatedAt, not recordedAt", () => {
    const localEntry: Entry = {
      id: "shared",
      rs: 40000,
      recordedAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-07-15T12:00:00.000Z",
    };
    const cloudEntry: Entry = {
      id: "shared",
      rs: 45000,
      recordedAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-14T12:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [localEntry],
      cloudEntries: [cloudEntry],
      knownSyncedIds: new Set(["shared"]),
    });

    expect(result.entries).toEqual([localEntry]);
    expect(result.upserts).toEqual([localEntry]);
    expect(result.deletes).toEqual([]);
  });

  test("cloud wins same-id conflict when updatedAt is newer", () => {
    const localEntry: Entry = {
      id: "shared",
      rs: 40000,
      recordedAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-07-14T12:00:00.000Z",
    };
    const cloudEntry: Entry = {
      id: "shared",
      rs: 45000,
      recordedAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-15T12:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [localEntry],
      cloudEntries: [cloudEntry],
      knownSyncedIds: new Set(["shared"]),
    });

    expect(result.entries).toEqual([cloudEntry]);
    expect(result.upserts).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  test("previously synced ids missing from cloud are removed locally", () => {
    const staleLocal: Entry = {
      id: "was-synced",
      rs: 43000,
      recordedAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-07-12T08:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [staleLocal],
      cloudEntries: [],
      knownSyncedIds: new Set(["was-synced"]),
    });

    expect(result.entries).toEqual([]);
    expect(result.upserts).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  test("never-synced local ids are kept when cloud lacks them", () => {
    const unsyncedLocal: Entry = {
      id: "offline-create",
      rs: 40500,
      recordedAt: "2026-07-18T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [unsyncedLocal],
      cloudEntries: [],
      knownSyncedIds: new Set(),
    });

    expect(result.entries).toEqual([unsyncedLocal]);
    expect(result.upserts).toEqual([unsyncedLocal]);
    expect(result.deletes).toEqual([]);
  });

  test("local delete of a synced Entry requests outbound cloud delete", () => {
    const cloudCopy: Entry = {
      id: "deleted-locally",
      rs: 44000,
      recordedAt: "2026-05-10T10:00:00.000Z",
      updatedAt: "2026-07-13T10:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [],
      cloudEntries: [cloudCopy],
      knownSyncedIds: new Set(["deleted-locally"]),
    });

    expect(result.entries).toEqual([]);
    expect(result.upserts).toEqual([]);
    expect(result.deletes).toEqual(["deleted-locally"]);
  });

  test("identical local and cloud copies produce no outbound mutations", () => {
    const entry: Entry = {
      id: "in-sync",
      rs: 46000,
      recordedAt: "2026-06-15T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z",
    };

    const result = mergeSyncEntries({
      localEntries: [entry],
      cloudEntries: [{ ...entry }],
      knownSyncedIds: new Set(["in-sync"]),
    });

    expect(result.entries).toEqual([entry]);
    expect(result.upserts).toEqual([]);
    expect(result.deletes).toEqual([]);
  });
});
