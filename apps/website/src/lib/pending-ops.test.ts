import { describe, expect, test } from "vite-plus/test";
import { createMemoryCloudEntriesClient } from "./cloud-entries.ts";
import { flushPendingOps, mergeDiffIntoPendingOps, type PendingOp } from "./pending-ops.ts";
import type { Entry } from "./types.ts";

const entry: Entry = {
  id: "entry-1",
  rs: 42000,
  recordedAt: "2026-07-15T10:00:00.000Z",
  updatedAt: "2026-07-17T12:00:00.000Z",
};

describe("mergeDiffIntoPendingOps", () => {
  test("upsert then delete for the same id keeps only delete", () => {
    const pending: PendingOp[] = [{ kind: "upsert", entry }];
    const result = mergeDiffIntoPendingOps(pending, { upserts: [], deletes: ["entry-1"] });

    expect(result).toEqual([{ kind: "delete", id: "entry-1" }]);
  });

  test("delete then upsert for the same id keeps only upsert", () => {
    const pending: PendingOp[] = [{ kind: "delete", id: "entry-1" }];
    const result = mergeDiffIntoPendingOps(pending, { upserts: [entry], deletes: [] });

    expect(result).toEqual([{ kind: "upsert", entry }]);
  });
});

describe("flushPendingOps", () => {
  test("successful flush clears pending upserts and updates knownSyncedIds", async () => {
    const entriesClient = createMemoryCloudEntriesClient();

    const result = await flushPendingOps({
      pendingOps: [{ kind: "upsert", entry }],
      knownSyncedIds: new Set(),
      userId: "player-1",
      entriesClient,
    });

    expect(result.pendingOps).toEqual([]);
    expect(result.knownSyncedIds).toEqual(new Set(["entry-1"]));
    expect(entriesClient.getEntries("player-1")).toEqual([entry]);
  });

  test("failed flush keeps pending upserts", async () => {
    const entriesClient = createMemoryCloudEntriesClient(undefined, { failUpsert: true });

    const result = await flushPendingOps({
      pendingOps: [{ kind: "upsert", entry }],
      knownSyncedIds: new Set(),
      userId: "player-1",
      entriesClient,
    });

    expect(result.pendingOps).toEqual([{ kind: "upsert", entry }]);
    expect(entriesClient.getEntries("player-1")).toEqual([]);
  });
});
