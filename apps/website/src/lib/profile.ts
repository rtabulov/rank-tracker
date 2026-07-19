import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDisplayName, validateDisplayName } from "@/lib/display-name";
import { supabase } from "@/supabase";

export type PlayerProfile = {
  displayName: string | null;
  isPublic: boolean;
};

export type SetDisplayNameResult =
  | { ok: true; profile: PlayerProfile }
  | { ok: false; error: string };

export type ProfileClient = {
  getProfile: (userId: string) => Promise<PlayerProfile | null>;
  setDisplayName: (userId: string, displayName: string) => Promise<SetDisplayNameResult>;
};

export function isProfileComplete(profile: PlayerProfile | null): boolean {
  return profile !== null && profile.displayName !== null && profile.displayName.length > 0;
}

export function isCloudSyncAllowed(
  session: { userId: string } | null,
  profile: PlayerProfile | null,
): boolean {
  return session !== null && isProfileComplete(profile);
}

type MemoryProfileRow = {
  displayName: string | null;
  isPublic: boolean;
};

export function createMemoryProfileClient(options?: {
  profiles?: Record<string, MemoryProfileRow | null>;
  takenDisplayNames?: string[];
}): ProfileClient {
  const profiles = new Map<string, MemoryProfileRow | null>(
    Object.entries(options?.profiles ?? {}),
  );
  const takenNames = new Set((options?.takenDisplayNames ?? []).map((name) => name.toLowerCase()));

  return {
    getProfile: async (userId) => {
      if (!profiles.has(userId)) {
        return null;
      }
      const row = profiles.get(userId);
      if (row === null || row === undefined) {
        return null;
      }
      return { displayName: row.displayName, isPublic: row.isPublic };
    },
    setDisplayName: async (userId, displayName) => {
      const normalized = normalizeDisplayName(displayName);
      const validationError = validateDisplayName(normalized);
      if (validationError !== null) {
        return { ok: false, error: validationError };
      }

      const existing = profiles.get(userId);
      if (existing?.displayName !== null && existing?.displayName !== undefined) {
        return { ok: false, error: "Display name is already set." };
      }

      const lower = normalized.toLowerCase();
      if (takenNames.has(lower)) {
        return { ok: false, error: "That display name is already taken." };
      }

      for (const [, row] of profiles) {
        if (row?.displayName?.toLowerCase() === lower) {
          return { ok: false, error: "That display name is already taken." };
        }
      }

      const profile: PlayerProfile = { displayName: normalized, isPublic: false };
      profiles.set(userId, profile);
      takenNames.add(lower);
      return { ok: true, profile };
    },
  };
}

function mapProfileRow(row: { display_name: string | null; is_public: boolean }): PlayerProfile {
  return {
    displayName: row.display_name,
    isPublic: row.is_public,
  };
}

function mapSupabaseError(message: string): string {
  if (message.includes("profiles_display_name_lower_unique")) {
    return "That display name is already taken.";
  }
  if (message.includes("profiles_display_name_format")) {
    return "Use letters, numbers, underscores, or hyphens only.";
  }
  return message;
}

export function createSupabaseProfileClient(client: SupabaseClient = supabase): ProfileClient {
  return {
    getProfile: async (userId) => {
      const { data, error } = await client
        .from("profiles")
        .select("display_name,is_public")
        .eq("user_id", userId)
        .maybeSingle();

      if (error !== null) {
        throw new Error(error.message);
      }

      if (data === null) {
        return null;
      }

      return mapProfileRow(data);
    },
    setDisplayName: async (userId, displayName) => {
      const normalized = normalizeDisplayName(displayName);
      const validationError = validateDisplayName(normalized);
      if (validationError !== null) {
        return { ok: false, error: validationError };
      }

      const existing = await client
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing.data?.display_name !== null && existing.data?.display_name !== undefined) {
        return { ok: false, error: "Display name is already set." };
      }

      const { data, error } = await client
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            display_name: normalized,
            is_public: false,
          },
          { onConflict: "user_id" },
        )
        .select("display_name,is_public")
        .single();

      if (error !== null) {
        return { ok: false, error: mapSupabaseError(error.message) };
      }

      return { ok: true, profile: mapProfileRow(data) };
    },
  };
}
