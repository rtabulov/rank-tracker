import { createClient } from "@supabase/supabase-js";
import { env } from "./env.ts";

/**
 * Browser Supabase client for Sign-in and cloud sync.
 *
 * Sign-in persistence (see CONTEXT.md "Sign-in"):
 * - Access token (JWT) TTL is short (`jwt_expiry` in supabase/config.toml; typically 1h).
 * - Refresh tokens do not expire by calendar idle; `persistSession` + `autoRefreshToken`
 *   keep Sign-in across restarts and long idle. Auth has no timebox / inactivity timeout.
 * - Logout for normal use is explicit Sign out only. Auth may still end Sign-in when a
 *   refresh token is revoked or otherwise rejected (security invalidation).
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
