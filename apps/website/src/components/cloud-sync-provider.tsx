import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLocalStore } from "@/components/local-store-provider";
import { useProfile } from "@/components/profile-provider";
import type { CloudEntriesClient } from "@/lib/cloud-entries";
import {
  diffLocalEntryChanges,
  entriesFingerprint,
  runSyncPull,
  runSyncPush,
} from "@/lib/cloud-sync";
import {
  mergeDiffIntoPendingOps,
  flushPendingOps,
  pendingOpsCount,
  pendingOpsAfterSuccessfulPush,
} from "@/lib/pending-ops";
import {
  createEmptySyncState,
  loadSyncState,
  saveSyncState,
  toKnownSyncedSet,
  withKnownSyncedIds,
  withPendingOps,
  withSyncedEntries,
  type SyncState,
} from "@/lib/sync-state";
import type { Entry } from "@/lib/types";

type CloudSyncContextValue = {
  pendingSyncCount: number;
};

const CloudSyncContext = createContext<CloudSyncContextValue>({ pendingSyncCount: 0 });

export function useCloudSync() {
  return useContext(CloudSyncContext);
}

export function CloudSyncProvider({
  children,
  entriesClient,
}: {
  children: ReactNode;
  entriesClient: CloudEntriesClient;
}) {
  const { session } = useAuth();
  const { isCloudSyncAllowed } = useProfile();
  const { store, setStore, storageAdapter } = useLocalStore();

  const syncStateRef = useRef(loadSyncState(storageAdapter));
  const syncedEntriesRef = useRef<Entry[]>(
    syncStateRef.current.syncedEntries.length > 0
      ? syncStateRef.current.syncedEntries
      : store.entries,
  );
  const storeEntriesRef = useRef(store.entries);
  const storeVersionRef = useRef(store.version);
  const skipPushRef = useRef(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(() =>
    pendingOpsCount(syncStateRef.current.pendingOps),
  );

  const saveSyncStateRef = (state: SyncState) => {
    syncStateRef.current = state;
    saveSyncState(storageAdapter, state);
    setPendingSyncCount(pendingOpsCount(state.pendingOps));
  };

  useEffect(() => {
    storeEntriesRef.current = store.entries;
    storeVersionRef.current = store.version;
  }, [store.entries, store.version]);

  useEffect(() => {
    if (session === null) {
      saveSyncStateRef(createEmptySyncState());
      syncedEntriesRef.current = storeEntriesRef.current;
    }
  }, [session, storageAdapter]);

  useEffect(() => {
    if (!isCloudSyncAllowed || session === null) {
      return;
    }

    let cancelled = false;

    const queueFailedPush = (pushResult: { failedUpserts: Entry[]; failedDeletes: string[] }) => {
      const nextPendingOps = mergeDiffIntoPendingOps(syncStateRef.current.pendingOps, {
        upserts: pushResult.failedUpserts,
        deletes: pushResult.failedDeletes,
      });
      saveSyncStateRef(withPendingOps(syncStateRef.current, nextPendingOps));
    };

    const flushPending = async () => {
      if (syncStateRef.current.pendingOps.length === 0 || !navigator.onLine) {
        return;
      }

      const flushResult = await flushPendingOps({
        pendingOps: syncStateRef.current.pendingOps,
        knownSyncedIds: toKnownSyncedSet(syncStateRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      saveSyncStateRef(
        withKnownSyncedIds(
          withPendingOps(syncStateRef.current, flushResult.pendingOps),
          flushResult.knownSyncedIds,
        ),
      );

      if (flushResult.pendingOps.length === 0) {
        syncedEntriesRef.current = storeEntriesRef.current;
        saveSyncStateRef(withSyncedEntries(syncStateRef.current, storeEntriesRef.current));
      }
    };

    const pushPending = async () => {
      const previousEntries = syncedEntriesRef.current;
      const nextEntries = storeEntriesRef.current;

      if (entriesFingerprint(previousEntries) === entriesFingerprint(nextEntries)) {
        return;
      }

      if (!navigator.onLine) {
        const diff = diffLocalEntryChanges(previousEntries, nextEntries);
        const syncedDeletes = diff.deletes.filter((id) =>
          toKnownSyncedSet(syncStateRef.current).has(id),
        );
        saveSyncStateRef(
          withPendingOps(
            syncStateRef.current,
            mergeDiffIntoPendingOps(syncStateRef.current.pendingOps, {
              upserts: diff.upserts,
              deletes: syncedDeletes,
            }),
          ),
        );
        return;
      }

      const pushResult = await runSyncPush({
        previousEntries,
        nextEntries,
        knownSyncedIds: toKnownSyncedSet(syncStateRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      if (pushResult.failedUpserts.length > 0 || pushResult.failedDeletes.length > 0) {
        saveSyncStateRef(withKnownSyncedIds(syncStateRef.current, pushResult.knownSyncedIds));
        queueFailedPush(pushResult);
        return;
      }

      syncedEntriesRef.current = nextEntries;
      saveSyncStateRef(
        withSyncedEntries(
          withKnownSyncedIds(
            withPendingOps(
              syncStateRef.current,
              pendingOpsAfterSuccessfulPush(
                syncStateRef.current.pendingOps,
                previousEntries,
                nextEntries,
                toKnownSyncedSet(syncStateRef.current),
              ),
            ),
            pushResult.knownSyncedIds,
          ),
          nextEntries,
        ),
      );
    };

    const pull = async () => {
      if (!navigator.onLine) {
        return;
      }

      const result = await runSyncPull({
        localEntries: storeEntriesRef.current,
        knownSyncedIds: toKnownSyncedSet(syncStateRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      saveSyncStateRef(withKnownSyncedIds(syncStateRef.current, result.knownSyncedIds));

      if (result.changed) {
        skipPushRef.current = true;
        syncedEntriesRef.current = result.entries;
        storeEntriesRef.current = result.entries;
        saveSyncStateRef(withSyncedEntries(syncStateRef.current, result.entries));
        setStore({ version: storeVersionRef.current, entries: result.entries });
      }
    };

    const syncFromCloud = async () => {
      await flushPending();
      await pull();
      await pushPending();
    };

    void syncFromCloud();

    const handleRetry = () => {
      void syncFromCloud();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncFromCloud();
      }
    };

    window.addEventListener("focus", handleRetry);
    window.addEventListener("online", handleRetry);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleRetry);
      window.removeEventListener("online", handleRetry);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [entriesClient, isCloudSyncAllowed, session, setStore, storageAdapter]);

  useEffect(() => {
    if (!isCloudSyncAllowed || session === null) {
      return;
    }

    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }

    const previousEntries = syncedEntriesRef.current;
    const nextEntries = store.entries;

    if (entriesFingerprint(previousEntries) === entriesFingerprint(nextEntries)) {
      return;
    }

    let cancelled = false;

    const pushChange = async () => {
      if (!navigator.onLine) {
        const diff = diffLocalEntryChanges(previousEntries, nextEntries);
        const syncedDeletes = diff.deletes.filter((id) =>
          toKnownSyncedSet(syncStateRef.current).has(id),
        );
        saveSyncStateRef(
          withPendingOps(
            syncStateRef.current,
            mergeDiffIntoPendingOps(syncStateRef.current.pendingOps, {
              upserts: diff.upserts,
              deletes: syncedDeletes,
            }),
          ),
        );
        return;
      }

      const pushResult = await runSyncPush({
        previousEntries,
        nextEntries,
        knownSyncedIds: toKnownSyncedSet(syncStateRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      if (pushResult.failedUpserts.length > 0 || pushResult.failedDeletes.length > 0) {
        saveSyncStateRef(withKnownSyncedIds(syncStateRef.current, pushResult.knownSyncedIds));
        saveSyncStateRef(
          withPendingOps(
            syncStateRef.current,
            mergeDiffIntoPendingOps(syncStateRef.current.pendingOps, {
              upserts: pushResult.failedUpserts,
              deletes: pushResult.failedDeletes,
            }),
          ),
        );
        return;
      }

      syncedEntriesRef.current = nextEntries;
      saveSyncStateRef(
        withSyncedEntries(
          withKnownSyncedIds(
            withPendingOps(
              syncStateRef.current,
              pendingOpsAfterSuccessfulPush(
                syncStateRef.current.pendingOps,
                previousEntries,
                nextEntries,
                toKnownSyncedSet(syncStateRef.current),
              ),
            ),
            pushResult.knownSyncedIds,
          ),
          nextEntries,
        ),
      );
    };

    void pushChange();

    return () => {
      cancelled = true;
    };
  }, [entriesClient, isCloudSyncAllowed, session, storageAdapter, store.entries]);

  return (
    <CloudSyncContext.Provider value={{ pendingSyncCount }}>{children}</CloudSyncContext.Provider>
  );
}
