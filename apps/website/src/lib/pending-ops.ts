import type { CloudEntriesClient } from "./cloud-entries.ts";
import { diffLocalEntryChanges } from "./cloud-sync.ts";
import type { Entry } from "./types.ts";

export type PendingOp = { kind: "upsert"; entry: Entry } | { kind: "delete"; id: string };

export function createEmptyPendingOps(): PendingOp[] {
  return [];
}

export function pendingOpsAfterSuccessfulPush(
  pendingOps: PendingOp[],
  previousEntries: Entry[],
  nextEntries: Entry[],
  knownSyncedIds: ReadonlySet<string>,
): PendingOp[] {
  const diff = diffLocalEntryChanges(previousEntries, nextEntries);
  const successfulDeleteIds = diff.deletes.filter((id) => knownSyncedIds.has(id));

  return removeSuccessfulOpsFromPending(
    pendingOps,
    diff.upserts.map((entry) => entry.id),
    successfulDeleteIds,
  );
}

export function mergeDiffIntoPendingOps(
  pendingOps: PendingOp[],
  diff: { upserts: Entry[]; deletes: string[] },
): PendingOp[] {
  const byId = new Map<string, PendingOp>();

  for (const op of pendingOps) {
    const id = op.kind === "upsert" ? op.entry.id : op.id;
    byId.set(id, op);
  }

  for (const entry of diff.upserts) {
    byId.set(entry.id, { kind: "upsert", entry });
  }

  for (const id of diff.deletes) {
    byId.set(id, { kind: "delete", id });
  }

  return [...byId.values()];
}

export function pendingOpsCount(pendingOps: PendingOp[]): number {
  return pendingOps.length;
}

export function removeSuccessfulOpsFromPending(
  pendingOps: PendingOp[],
  successfulUpsertIds: readonly string[],
  successfulDeleteIds: readonly string[],
): PendingOp[] {
  const upsertIds = new Set(successfulUpsertIds);
  const deleteIds = new Set(successfulDeleteIds);

  return pendingOps.filter((op) => {
    if (op.kind === "upsert") {
      return !upsertIds.has(op.entry.id);
    }
    return !deleteIds.has(op.id);
  });
}

export async function flushPendingOps(input: {
  pendingOps: PendingOp[];
  knownSyncedIds: ReadonlySet<string>;
  userId: string;
  entriesClient: CloudEntriesClient;
}): Promise<{
  pendingOps: PendingOp[];
  knownSyncedIds: Set<string>;
}> {
  if (input.pendingOps.length === 0) {
    return { pendingOps: [], knownSyncedIds: new Set(input.knownSyncedIds) };
  }

  const remaining: PendingOp[] = [];
  let knownSyncedIds = new Set(input.knownSyncedIds);

  const upserts = input.pendingOps
    .filter((op): op is { kind: "upsert"; entry: Entry } => op.kind === "upsert")
    .map((op) => op.entry);

  if (upserts.length > 0) {
    const pushResult = await input.entriesClient.upsertEntries(input.userId, upserts);
    if (pushResult.error === null) {
      for (const entry of upserts) {
        knownSyncedIds.add(entry.id);
      }
    } else {
      remaining.push(...upserts.map((entry) => ({ kind: "upsert" as const, entry })));
    }
  }

  const deleteOps = input.pendingOps.filter(
    (op): op is { kind: "delete"; id: string } => op.kind === "delete",
  );

  const cloudDeletes = deleteOps.filter((op) => knownSyncedIds.has(op.id)).map((op) => op.id);

  if (cloudDeletes.length > 0) {
    const deleteResult = await input.entriesClient.deleteEntries(input.userId, cloudDeletes);
    if (deleteResult.error === null) {
      for (const id of cloudDeletes) {
        knownSyncedIds.delete(id);
      }
    } else {
      for (const id of cloudDeletes) {
        remaining.push({ kind: "delete", id });
      }
    }
  }

  return { pendingOps: remaining, knownSyncedIds };
}
