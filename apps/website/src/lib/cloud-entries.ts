import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/supabase";
import type { Entry } from "./types.ts";

export type CloudEntriesClient = {
  listEntries: (userId: string) => Promise<Entry[]>;
  upsertEntries: (userId: string, entries: Entry[]) => Promise<{ error: string | null }>;
  deleteEntries: (userId: string, ids: string[]) => Promise<{ error: string | null }>;
};

type CloudEntryRow = {
  id: string;
  user_id: string;
  rs: number;
  recorded_at: string;
  updated_at: string;
};

function mapRowToEntry(row: CloudEntryRow): Entry {
  return {
    id: row.id,
    rs: row.rs,
    recordedAt: row.recorded_at,
    updatedAt: row.updated_at,
  };
}

function mapEntryToRow(userId: string, entry: Entry): CloudEntryRow {
  return {
    id: entry.id,
    user_id: userId,
    rs: entry.rs,
    recorded_at: entry.recordedAt,
    updated_at: entry.updatedAt,
  };
}

export type MemoryCloudEntriesStore = Map<string, Map<string, Entry>>;

export function createMemoryCloudEntriesStore(): MemoryCloudEntriesStore {
  return new Map();
}

export function createMemoryCloudEntriesClient(
  store: MemoryCloudEntriesStore = createMemoryCloudEntriesStore(),
  options?: { failUpsert?: boolean; failDelete?: boolean },
): CloudEntriesClient & {
  getEntries: (userId: string) => Entry[];
  setEntries: (userId: string, entries: Entry[]) => void;
  store: MemoryCloudEntriesStore;
} {
  const getUserEntries = (userId: string): Map<string, Entry> => {
    let entries = store.get(userId);
    if (entries === undefined) {
      entries = new Map();
      store.set(userId, entries);
    }
    return entries;
  };

  return {
    store,
    getEntries: (userId) => [...getUserEntries(userId).values()],
    setEntries: (userId, entries) => {
      store.set(userId, new Map(entries.map((entry) => [entry.id, entry])));
    },
    listEntries: async (userId) => [...getUserEntries(userId).values()],
    upsertEntries: async (userId, entries) => {
      if (options?.failUpsert) {
        return { error: "Cloud upsert failed." };
      }
      const userEntries = getUserEntries(userId);
      for (const entry of entries) {
        userEntries.set(entry.id, entry);
      }
      return { error: null };
    },
    deleteEntries: async (userId, ids) => {
      if (options?.failDelete) {
        return { error: "Cloud delete failed." };
      }
      const userEntries = getUserEntries(userId);
      for (const id of ids) {
        userEntries.delete(id);
      }
      return { error: null };
    },
  };
}

export function createSupabaseCloudEntriesClient(
  client: SupabaseClient = supabase,
): CloudEntriesClient {
  return {
    listEntries: async (userId) => {
      const { data, error } = await client
        .from("entries")
        .select("id,rs,recorded_at,updated_at")
        .eq("user_id", userId);

      if (error !== null) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) =>
        mapRowToEntry({
          id: row.id,
          user_id: userId,
          rs: row.rs,
          recorded_at: row.recorded_at,
          updated_at: row.updated_at,
        }),
      );
    },
    upsertEntries: async (userId, entries) => {
      if (entries.length === 0) {
        return { error: null };
      }

      const { error } = await client.from("entries").upsert(
        entries.map((entry) => mapEntryToRow(userId, entry)),
        { onConflict: "id" },
      );

      return { error: error?.message ?? null };
    },
    deleteEntries: async (userId, ids) => {
      if (ids.length === 0) {
        return { error: null };
      }

      const { error } = await client.from("entries").delete().eq("user_id", userId).in("id", ids);

      return { error: error?.message ?? null };
    },
  };
}
