import type { StorageAdapter } from "./types.ts";
import type { PendingOp } from "./pending-ops.ts";
import type { Entry } from "./types.ts";

export const SYNC_STATE_KEY = "rank-tracker-sync-state";

export type SyncState = {
  knownSyncedIds: string[];
  syncedEntries: Entry[];
  pendingOps: PendingOp[];
};

export function createEmptySyncState(): SyncState {
  return { knownSyncedIds: [], syncedEntries: [], pendingOps: [] };
}

function isPendingOp(value: unknown): value is PendingOp {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }

  if (value.kind === "delete") {
    return "id" in value && typeof value.id === "string";
  }

  if (value.kind === "upsert") {
    return (
      "entry" in value &&
      typeof value.entry === "object" &&
      value.entry !== null &&
      "id" in value.entry &&
      typeof value.entry.id === "string" &&
      "rs" in value.entry &&
      typeof value.entry.rs === "number" &&
      "recordedAt" in value.entry &&
      typeof value.entry.recordedAt === "string" &&
      "updatedAt" in value.entry &&
      typeof value.entry.updatedAt === "string"
    );
  }

  return false;
}

function isEntry(value: unknown): value is Entry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "rs" in value &&
    typeof value.rs === "number" &&
    "recordedAt" in value &&
    typeof value.recordedAt === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  );
}

export function parseSyncState(raw: string | null): SyncState {
  if (raw === null) {
    return createEmptySyncState();
  }

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    return createEmptySyncState();
  }

  const knownSyncedIds =
    "knownSyncedIds" in parsed &&
    Array.isArray(parsed.knownSyncedIds) &&
    parsed.knownSyncedIds.every((id) => typeof id === "string")
      ? [...parsed.knownSyncedIds]
      : [];

  const syncedEntries =
    "syncedEntries" in parsed &&
    Array.isArray(parsed.syncedEntries) &&
    parsed.syncedEntries.every(isEntry)
      ? parsed.syncedEntries.map((entry) => ({ ...entry }))
      : [];

  const pendingOps =
    "pendingOps" in parsed &&
    Array.isArray(parsed.pendingOps) &&
    parsed.pendingOps.every(isPendingOp)
      ? parsed.pendingOps.map((op) =>
          op.kind === "upsert" ? { kind: "upsert" as const, entry: { ...op.entry } } : { ...op },
        )
      : [];

  return { knownSyncedIds, syncedEntries, pendingOps };
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

export function withKnownSyncedIds(state: SyncState, ids: ReadonlySet<string>): SyncState {
  return { ...state, knownSyncedIds: [...ids] };
}

export function withPendingOps(state: SyncState, pendingOps: PendingOp[]): SyncState {
  return { ...state, pendingOps };
}

export function withSyncedEntries(state: SyncState, syncedEntries: Entry[]): SyncState {
  return { ...state, syncedEntries: syncedEntries.map((entry) => ({ ...entry })) };
}
