import { useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLocalStore } from "@/components/local-store-provider";
import { useProfile } from "@/components/profile-provider";
import type { CloudEntriesClient } from "@/lib/cloud-entries";
import { entriesFingerprint, runSyncPull, runSyncPush } from "@/lib/cloud-sync";
import {
  fromKnownSyncedSet,
  loadSyncState,
  saveSyncState,
  toKnownSyncedSet,
} from "@/lib/sync-state";

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

  const knownSyncedIdsRef = useRef(loadSyncState(storageAdapter));
  const syncedEntriesRef = useRef(store.entries);
  const storeEntriesRef = useRef(store.entries);
  const storeVersionRef = useRef(store.version);
  const skipPushRef = useRef(false);

  useEffect(() => {
    storeEntriesRef.current = store.entries;
    storeVersionRef.current = store.version;
  }, [store.entries, store.version]);

  useEffect(() => {
    if (session === null) {
      knownSyncedIdsRef.current = { knownSyncedIds: [] };
      saveSyncState(storageAdapter, knownSyncedIdsRef.current);
      syncedEntriesRef.current = storeEntriesRef.current;
    }
  }, [session, storageAdapter]);

  useEffect(() => {
    if (!isCloudSyncAllowed || session === null) {
      return;
    }

    let cancelled = false;

    const pushPending = async () => {
      if (!navigator.onLine) {
        return;
      }

      const previousEntries = syncedEntriesRef.current;
      const nextEntries = storeEntriesRef.current;

      if (entriesFingerprint(previousEntries) === entriesFingerprint(nextEntries)) {
        return;
      }

      const nextKnownSyncedIds = await runSyncPush({
        previousEntries,
        nextEntries,
        knownSyncedIds: toKnownSyncedSet(knownSyncedIdsRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      knownSyncedIdsRef.current = fromKnownSyncedSet(nextKnownSyncedIds);
      saveSyncState(storageAdapter, knownSyncedIdsRef.current);
      syncedEntriesRef.current = nextEntries;
    };

    const pull = async () => {
      const result = await runSyncPull({
        localEntries: storeEntriesRef.current,
        knownSyncedIds: toKnownSyncedSet(knownSyncedIdsRef.current),
        userId: session.userId,
        entriesClient,
      });

      if (cancelled) {
        return;
      }

      knownSyncedIdsRef.current = fromKnownSyncedSet(result.knownSyncedIds);
      saveSyncState(storageAdapter, knownSyncedIdsRef.current);

      if (result.changed) {
        skipPushRef.current = true;
        syncedEntriesRef.current = result.entries;
        storeEntriesRef.current = result.entries;
        setStore({ version: storeVersionRef.current, entries: result.entries });
      }
    };

    const syncFromCloud = async () => {
      await pull();
      await pushPending();
    };

    void syncFromCloud();

    const handleOnline = () => {
      void syncFromCloud();
    };

    const handleFocus = () => {
      void syncFromCloud();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncFromCloud();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
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

    if (!navigator.onLine) {
      return;
    }

    let cancelled = false;

    void runSyncPush({
      previousEntries,
      nextEntries,
      knownSyncedIds: toKnownSyncedSet(knownSyncedIdsRef.current),
      userId: session.userId,
      entriesClient,
    }).then((nextKnownSyncedIds) => {
      if (cancelled) {
        return;
      }

      knownSyncedIdsRef.current = fromKnownSyncedSet(nextKnownSyncedIds);
      saveSyncState(storageAdapter, knownSyncedIdsRef.current);
      syncedEntriesRef.current = nextEntries;
    });

    return () => {
      cancelled = true;
    };
  }, [entriesClient, isCloudSyncAllowed, session, storageAdapter, store.entries]);

  return children;
}
