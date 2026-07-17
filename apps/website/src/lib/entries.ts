import { nanoid } from "nanoid";
import type { Entry } from "./types.ts";

export function createEntryId(): string {
  return nanoid();
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

export function updateEntry(
  entries: Entry[],
  id: string,
  updates: { rs: number; recordedAt: string },
): Entry[] {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, rs: updates.rs, recordedAt: updates.recordedAt } : entry,
  );
}

export function deleteEntry(entries: Entry[], id: string): Entry[] {
  return entries.filter((entry) => entry.id !== id);
}
