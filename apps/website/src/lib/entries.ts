import type { Entry } from "./types.ts";

export function createEntryId(): string {
  return crypto.randomUUID();
}

export function createEntry(input: { rs: number; recordedAt: string; id?: string }): Entry {
  return {
    id: input.id ?? createEntryId(),
    rs: input.rs,
    recordedAt: input.recordedAt,
  };
}

export function addEntry(entries: Entry[], entry: Entry): Entry[] {
  return [...entries, entry];
}
