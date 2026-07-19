import type { CloudEntriesClient } from "./cloud-entries.ts";
import { mergeSyncEntries } from "./sync-merge.ts";
import type { Entry } from "./types.ts";

export function entriesFingerprint(entries: Entry[]): string {
  return entries
    .map((entry) => `${entry.id}:${entry.updatedAt}`)
    .sort()
    .join("|");
}

export type SyncCycleResult = {
  entries: Entry[];
  knownSyncedIds: Set<string>;
  changed: boolean;
};

function entriesEqual(a: Entry[], b: Entry[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const byId = new Map(b.map((entry) => [entry.id, entry]));
  for (const entry of a) {
    const other = byId.get(entry.id);
    if (
      other === undefined ||
      other.rs !== entry.rs ||
      other.recordedAt !== entry.recordedAt ||
      other.updatedAt !== entry.updatedAt
    ) {
      return false;
    }
  }

  return true;
}

export async function runSyncPull(input: {
  localEntries: Entry[];
  knownSyncedIds: ReadonlySet<string>;
  userId: string;
  entriesClient: CloudEntriesClient;
  applyMergeToCloud?: boolean;
}): Promise<SyncCycleResult> {
  const applyMergeToCloud = input.applyMergeToCloud ?? true;
  const cloudEntries = await input.entriesClient.listEntries(input.userId);
  const mergeResult = mergeSyncEntries({
    localEntries: input.localEntries,
    cloudEntries,
    knownSyncedIds: input.knownSyncedIds,
  });

  const nextKnownSyncedIds = new Set(input.knownSyncedIds);

  if (applyMergeToCloud && mergeResult.upserts.length > 0) {
    const pushResult = await input.entriesClient.upsertEntries(input.userId, mergeResult.upserts);
    if (pushResult.error === null) {
      for (const entry of mergeResult.upserts) {
        nextKnownSyncedIds.add(entry.id);
      }
    }
  }

  if (applyMergeToCloud && mergeResult.deletes.length > 0) {
    const deleteResult = await input.entriesClient.deleteEntries(input.userId, mergeResult.deletes);
    if (deleteResult.error === null) {
      for (const id of mergeResult.deletes) {
        nextKnownSyncedIds.delete(id);
      }
    }
  }

  const cloudIds = new Set(cloudEntries.map((entry) => entry.id));
  for (const entry of mergeResult.entries) {
    if (cloudIds.has(entry.id)) {
      nextKnownSyncedIds.add(entry.id);
    }
  }

  return {
    entries: mergeResult.entries,
    knownSyncedIds: nextKnownSyncedIds,
    changed: !entriesEqual(input.localEntries, mergeResult.entries),
  };
}

export function diffLocalEntryChanges(
  previous: Entry[],
  next: Entry[],
): { upserts: Entry[]; deletes: string[] } {
  const previousById = new Map(previous.map((entry) => [entry.id, entry]));
  const nextById = new Map(next.map((entry) => [entry.id, entry]));
  const upserts: Entry[] = [];
  const deletes: string[] = [];

  for (const [id, entry] of nextById) {
    const old = previousById.get(id);
    if (old === undefined || old.updatedAt !== entry.updatedAt) {
      upserts.push(entry);
    }
  }

  for (const [id] of previousById) {
    if (!nextById.has(id)) {
      deletes.push(id);
    }
  }

  return { upserts, deletes };
}

export async function runSyncPush(input: {
  previousEntries: Entry[];
  nextEntries: Entry[];
  knownSyncedIds: ReadonlySet<string>;
  userId: string;
  entriesClient: CloudEntriesClient;
}): Promise<{
  knownSyncedIds: Set<string>;
  failedUpserts: Entry[];
  failedDeletes: string[];
}> {
  const { upserts, deletes } = diffLocalEntryChanges(input.previousEntries, input.nextEntries);
  const nextKnownSyncedIds = new Set(input.knownSyncedIds);
  let failedUpserts: Entry[] = [];
  let failedDeletes: string[] = [];

  if (upserts.length > 0) {
    const pushResult = await input.entriesClient.upsertEntries(input.userId, upserts);
    if (pushResult.error === null) {
      for (const entry of upserts) {
        nextKnownSyncedIds.add(entry.id);
      }
    } else {
      failedUpserts = upserts;
    }
  }

  const syncedDeletes = deletes.filter((id) => input.knownSyncedIds.has(id));
  if (syncedDeletes.length > 0) {
    const deleteResult = await input.entriesClient.deleteEntries(input.userId, syncedDeletes);
    if (deleteResult.error === null) {
      for (const id of syncedDeletes) {
        nextKnownSyncedIds.delete(id);
      }
    } else {
      failedDeletes = syncedDeletes;
    }
  }

  return { knownSyncedIds: nextKnownSyncedIds, failedUpserts, failedDeletes };
}
