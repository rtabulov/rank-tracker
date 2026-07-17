export type Entry = {
  id: string;
  rs: number;
  recordedAt: string;
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

export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};
