import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import {
  LOCAL_STORE_KEY,
  createLocalStorageAdapter,
  loadLocalStore,
  saveLocalStore,
} from "@/lib/local-store";
import { migrateLocalStore } from "@/lib/import";
import type { Entry, LocalStore, StorageAdapter, UnmigratedLocalStore } from "@/lib/types";

type LocalStoreContextValue = {
  store: LocalStore;
  setStore: (store: LocalStore) => void;
  getEntries: () => Entry[];
  storageAdapter: StorageAdapter;
};

const LocalStoreContext = createContext<LocalStoreContextValue | null>(null);

export function LocalStoreProvider({
  children,
  storageAdapter = createLocalStorageAdapter(),
  initialStore,
}: {
  children: ReactNode;
  storageAdapter?: StorageAdapter;
  initialStore?: UnmigratedLocalStore;
}) {
  const [store, setStoreState] = useState<LocalStore>(() => {
    if (initialStore !== undefined) {
      return migrateLocalStore(initialStore);
    }

    const raw = storageAdapter.getItem(LOCAL_STORE_KEY);
    const migrated = loadLocalStore(storageAdapter);
    if (raw === null) {
      saveLocalStore(storageAdapter, migrated);
    } else {
      const parsed = JSON.parse(raw) as UnmigratedLocalStore;
      if (parsed.version < migrated.version) {
        saveLocalStore(storageAdapter, migrated);
      }
    }
    return migrated;
  });

  const storeRef = useRef(store);
  storeRef.current = store;

  const value: LocalStoreContextValue = {
    store,
    getEntries: () => storeRef.current.entries,
    setStore: (next: LocalStore) => {
      storeRef.current = next;
      setStoreState(next);
      saveLocalStore(storageAdapter, next);
    },
    storageAdapter,
  };

  return <LocalStoreContext.Provider value={value}>{children}</LocalStoreContext.Provider>;
}

export function useLocalStore(): LocalStoreContextValue {
  const context = useContext(LocalStoreContext);
  if (context === null) {
    throw new Error("useLocalStore must be used within LocalStoreProvider");
  }
  return context;
}
