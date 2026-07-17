import type { LocalStore, StorageAdapter } from "./types.ts";

export const LOCAL_STORE_KEY = "rank-tracker-local-store";

export function createEmptyLocalStore(): LocalStore {
  return { version: 1, entries: [] };
}

export function parseLocalStore(raw: string | null): LocalStore {
  if (raw === null) {
    return createEmptyLocalStore();
  }

  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    "entries" in parsed &&
    typeof parsed.version === "number" &&
    Array.isArray(parsed.entries)
  ) {
    return { version: parsed.version, entries: parsed.entries };
  }

  return createEmptyLocalStore();
}

export function loadLocalStore(adapter: StorageAdapter): LocalStore {
  return parseLocalStore(adapter.getItem(LOCAL_STORE_KEY));
}

export function saveLocalStore(adapter: StorageAdapter, store: LocalStore): void {
  adapter.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
}

export function createMemoryStorageAdapter(initial?: LocalStore): StorageAdapter {
  const map = new Map<string, string>();
  if (initial) {
    map.set(LOCAL_STORE_KEY, JSON.stringify(initial));
  }

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  };
}
