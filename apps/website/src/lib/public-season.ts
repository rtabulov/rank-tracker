import type { SupabaseClient } from "@supabase/supabase-js";
import { validateDisplayName } from "@/lib/display-name";
import { supabase } from "@/supabase";
import type { Entry } from "./types.ts";

export type PublicSeasonPayload = {
  displayName: string;
  entries: Entry[];
};

export type PublicSeasonClient = {
  getPublicSeason: (displayName: string) => Promise<PublicSeasonPayload | null>;
};

type MemoryPublicPlayer = {
  displayName: string;
  isPublic: boolean;
  entries: Entry[];
};

export function createMemoryPublicSeasonClient(options?: {
  players?: Record<string, MemoryPublicPlayer>;
}): PublicSeasonClient {
  const players = new Map<string, MemoryPublicPlayer>(
    Object.entries(options?.players ?? {}).map(([displayName, player]) => [
      displayName.toLowerCase(),
      player,
    ]),
  );

  return {
    getPublicSeason: async (displayName) => {
      const validationError = validateDisplayName(displayName.trim());
      if (validationError !== null) {
        return null;
      }

      const player = players.get(displayName.toLowerCase());
      if (player === undefined || !player.isPublic) {
        return null;
      }

      return {
        displayName: player.displayName,
        entries: player.entries,
      };
    },
  };
}

type RpcPublicSeasonPayload = {
  displayName: string;
  entries: Array<{ id: string; rs: number; recordedAt: string }>;
};

function mapRpcEntry(entry: { id: string; rs: number; recordedAt: string }): Entry {
  return {
    id: entry.id,
    rs: entry.rs,
    recordedAt: entry.recordedAt,
    updatedAt: entry.recordedAt,
  };
}

export function createSupabasePublicSeasonClient(
  client: SupabaseClient = supabase,
): PublicSeasonClient {
  return {
    getPublicSeason: async (displayName) => {
      const validationError = validateDisplayName(displayName.trim());
      if (validationError !== null) {
        return null;
      }

      const { data, error } = await client.rpc("get_public_season", {
        display_name_input: displayName.trim(),
      });

      if (error !== null) {
        throw new Error(error.message);
      }

      if (data === null) {
        return null;
      }

      const payload = data as RpcPublicSeasonPayload;
      return {
        displayName: payload.displayName,
        entries: (payload.entries ?? []).map(mapRpcEntry),
      };
    },
  };
}
