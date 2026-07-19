export type Entry = {
  id: string;
  rs: number;
  recordedAt: string;
  updatedAt: string;
};

export type Season = {
  number: number;
  title: string;
  startUtc: string;
  endUtc: string | null;
};

export type LocalStore = {
  version: number;
  entries: Entry[];
};

/** Pre-migration store shape (e.g. v1 Imports or legacy localStorage). */
export type UnmigratedLocalStore = {
  version: number;
  entries: Array<{ id: string; rs: number; recordedAt: string; updatedAt?: string }>;
};

export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};
