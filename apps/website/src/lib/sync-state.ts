import type { StorageAdapter } from "./types.ts";

export const SYNC_STATE_KEY = "rank-tracker-sync-state";

export type SyncState = {
  knownSyncedIds: string[];
};

export function createEmptySyncState(): SyncState {
  return { knownSyncedIds: [] };
}

export function parseSyncState(raw: string | null): SyncState {
  if (raw === null) {
    return createEmptySyncState();
  }

  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "knownSyncedIds" in parsed &&
    Array.isArray(parsed.knownSyncedIds) &&
    parsed.knownSyncedIds.every((id) => typeof id === "string")
  ) {
    return { knownSyncedIds: [...parsed.knownSyncedIds] };
  }

  return createEmptySyncState();
}

export function loadSyncState(adapter: StorageAdapter): SyncState {
  return parseSyncState(adapter.getItem(SYNC_STATE_KEY));
}

export function saveSyncState(adapter: StorageAdapter, state: SyncState): void {
  adapter.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

export function toKnownSyncedSet(state: SyncState): Set<string> {
  return new Set(state.knownSyncedIds);
}

export function fromKnownSyncedSet(ids: ReadonlySet<string>): SyncState {
  return { knownSyncedIds: [...ids] };
}
