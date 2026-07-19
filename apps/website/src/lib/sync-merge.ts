import type { Entry } from "./types.ts";

export type SyncMergeInput = {
  localEntries: Entry[];
  cloudEntries: Entry[];
  knownSyncedIds: ReadonlySet<string>;
};

export type SyncMergeResult = {
  entries: Entry[];
  upserts: Entry[];
  deletes: string[];
};

function entryById(entries: Entry[]): Map<string, Entry> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function isSameEntry(a: Entry, b: Entry): boolean {
  return (
    a.id === b.id && a.rs === b.rs && a.recordedAt === b.recordedAt && a.updatedAt === b.updatedAt
  );
}

function pickWinner(local: Entry, cloud: Entry): Entry {
  const localTime = Date.parse(local.updatedAt);
  const cloudTime = Date.parse(cloud.updatedAt);
  if (localTime > cloudTime) {
    return local;
  }
  if (cloudTime > localTime) {
    return cloud;
  }
  return local;
}

export function mergeSyncEntries(input: SyncMergeInput): SyncMergeResult {
  const localById = entryById(input.localEntries);
  const cloudById = entryById(input.cloudEntries);

  const allIds = new Set<string>([
    ...localById.keys(),
    ...cloudById.keys(),
    ...input.knownSyncedIds,
  ]);

  const entries: Entry[] = [];
  const upserts: Entry[] = [];
  const deletes: string[] = [];

  for (const id of allIds) {
    const local = localById.get(id);
    const cloud = cloudById.get(id);
    const wasSynced = input.knownSyncedIds.has(id);

    if (local !== undefined && cloud !== undefined) {
      const winner = pickWinner(local, cloud);
      entries.push(winner);
      if (winner === local && !isSameEntry(local, cloud)) {
        upserts.push(local);
      }
      continue;
    }

    if (local !== undefined) {
      if (wasSynced) {
        continue;
      }
      entries.push(local);
      upserts.push(local);
      continue;
    }

    if (cloud !== undefined) {
      if (wasSynced) {
        deletes.push(id);
        continue;
      }
      entries.push(cloud);
    }
  }

  return { entries, upserts, deletes };
}
