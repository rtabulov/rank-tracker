import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  LOCAL_STORE_KEY,
  createLocalStorageAdapter,
  loadLocalStore,
  saveLocalStore,
  type createMemoryStorageAdapter,
} from "@/lib/local-store.ts";
import type { LocalStore, StorageAdapter } from "@/lib/types.ts";

type LocalStoreContextValue = {
  store: LocalStore;
  setStore: (store: LocalStore) => void;
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
  initialStore?: LocalStore;
}) {
  const [store, setStoreState] = useState<LocalStore>(() => {
    const loaded = initialStore ?? loadLocalStore(storageAdapter);
    if (initialStore === undefined && storageAdapter.getItem(LOCAL_STORE_KEY) === null) {
      saveLocalStore(storageAdapter, loaded);
    }
    return loaded;
  });

  const value = useMemo(
    () => ({
      store,
      setStore: (next: LocalStore) => {
        setStoreState(next);
        saveLocalStore(storageAdapter, next);
      },
      storageAdapter,
    }),
    [store, storageAdapter],
  );

  return <LocalStoreContext.Provider value={value}>{children}</LocalStoreContext.Provider>;
}

export function useLocalStore(): LocalStoreContextValue {
  const context = useContext(LocalStoreContext);
  if (context === null) {
    throw new Error("useLocalStore must be used within LocalStoreProvider");
  }
  return context;
}

export type TestStorageAdapter = ReturnType<typeof createMemoryStorageAdapter>;
