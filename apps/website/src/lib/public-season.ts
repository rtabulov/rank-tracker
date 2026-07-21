import type { SupabaseClient } from "@supabase/supabase-js";
import { validateDisplayName } from "@/lib/display-name";
import { getCurrentSeason, getEntriesForSeason, getNavigableSeasons } from "@/lib/seasons";
import { supabase } from "@/supabase";
import type { Entry } from "./types.ts";

export type PublicSeasonIndex = {
  displayName: string;
  seasonNumbers: number[];
};

export type PublicSeasonEntries = {
  displayName: string;
  seasonNumber: number;
  entries: Entry[];
};

export type PublicSeasonClient = {
  getPublicSeasonIndex: (displayName: string) => Promise<PublicSeasonIndex | null>;
  getPublicSeasonEntries: (
    displayName: string,
    seasonNumber: number,
  ) => Promise<PublicSeasonEntries | null>;
};

type MemoryPublicPlayer = {
  displayName: string;
  isPublic: boolean;
  entries: Entry[];
};

function memoryPlayersMap(options?: {
  players?: Record<string, MemoryPublicPlayer>;
  livePlayers?: Map<string, MemoryPublicPlayer>;
}): Map<string, MemoryPublicPlayer> {
  return (
    options?.livePlayers ??
    new Map<string, MemoryPublicPlayer>(
      Object.entries(options?.players ?? {}).map(([displayName, player]) => [
        displayName.toLowerCase(),
        player,
      ]),
    )
  );
}

export function createMemoryPublicSeasonClient(options?: {
  players?: Record<string, MemoryPublicPlayer>;
  livePlayers?: Map<string, MemoryPublicPlayer>;
}): PublicSeasonClient {
  const players = memoryPlayersMap(options);

  return {
    getPublicSeasonIndex: async (displayName) => {
      const validationError = validateDisplayName(displayName.trim());
      if (validationError !== null) {
        return null;
      }

      const player = players.get(displayName.toLowerCase());
      if (player === undefined || !player.isPublic) {
        return null;
      }

      const seasonNumbers = getNavigableSeasons(player.entries).map((season) => season.number);
      return {
        displayName: player.displayName,
        seasonNumbers,
      };
    },
    getPublicSeasonEntries: async (displayName, seasonNumber) => {
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
        seasonNumber,
        entries: getEntriesForSeason(player.entries, seasonNumber),
      };
    },
  };
}

type RpcPublicSeasonIndex = {
  displayName: string;
  seasonNumbers: number[];
};

type RpcPublicSeasonEntries = {
  displayName: string;
  seasonNumber: number;
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
    getPublicSeasonIndex: async (displayName) => {
      const validationError = validateDisplayName(displayName.trim());
      if (validationError !== null) {
        return null;
      }

      const { data, error } = await client.rpc("get_public_season_index", {
        display_name_input: displayName.trim(),
      });

      if (error !== null) {
        throw new Error(error.message);
      }

      if (data === null) {
        return null;
      }

      const payload = data as RpcPublicSeasonIndex;
      const seasonNumbers = [...payload.seasonNumbers];
      const currentSeasonNumber = getCurrentSeason().number;
      if (!seasonNumbers.includes(currentSeasonNumber)) {
        seasonNumbers.push(currentSeasonNumber);
      }
      seasonNumbers.sort((a, b) => a - b);

      return {
        displayName: payload.displayName,
        seasonNumbers,
      };
    },
    getPublicSeasonEntries: async (displayName, seasonNumber) => {
      const validationError = validateDisplayName(displayName.trim());
      if (validationError !== null) {
        return null;
      }

      const { data, error } = await client.rpc("get_public_season_entries", {
        display_name_input: displayName.trim(),
        season_number_input: seasonNumber,
      });

      if (error !== null) {
        throw new Error(error.message);
      }

      if (data === null) {
        return null;
      }

      const payload = data as RpcPublicSeasonEntries;
      return {
        displayName: payload.displayName,
        seasonNumber: payload.seasonNumber,
        entries: (payload.entries ?? []).map(mapRpcEntry),
      };
    },
  };
}
