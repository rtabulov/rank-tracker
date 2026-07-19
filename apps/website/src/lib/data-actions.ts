import type { CloudEntriesClient } from "./cloud-entries.ts";
import { createEmptyLocalStore } from "./local-store.ts";
import type { Entry, LocalStore } from "./types.ts";

export function clearLocalDataOnDevice(input: { setStore: (store: LocalStore) => void }): void {
  input.setStore(createEmptyLocalStore());
}

export async function deleteAllCloudEntries(input: {
  userId: string;
  entriesClient: CloudEntriesClient;
}): Promise<{ error: string | null }> {
  return input.entriesClient.deleteAllEntries(input.userId);
}

export function localEntriesSnapshot(entries: Entry[]): Entry[] {
  return entries.map((entry) => ({ ...entry }));
}
