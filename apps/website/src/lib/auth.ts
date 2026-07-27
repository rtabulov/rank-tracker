import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { SITE_BASEPATH } from "@/lib/paths";
import { supabase } from "@/supabase";

export type AuthSession = {
  userId: string;
  email: string | null;
};

export type OAuthProvider = "discord" | "google";

export type AuthClient = {
  getSession: () => Promise<AuthSession | null>;
  /** `event` is the Supabase auth change name (e.g. INITIAL_SESSION, SIGNED_OUT). */
  onAuthStateChange: (listener: (session: AuthSession | null, event: string) => void) => () => void;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

export function authRedirectTo(origin: string, basepath: string = SITE_BASEPATH): string {
  const normalizedBase = basepath.endsWith("/") ? basepath : `${basepath}/`;
  return `${origin}${normalizedBase}`;
}

function toAuthSession(session: Session | null): AuthSession | null {
  if (session === null) {
    return null;
  }
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
  };
}

export function createMemoryAuthClient(initialSession: AuthSession | null = null): AuthClient {
  let session = initialSession;
  const listeners = new Set<(next: AuthSession | null, event: string) => void>();

  const emit = (next: AuthSession | null, event: string) => {
    session = next;
    for (const listener of listeners) {
      listener(session, event);
    }
  };

  return {
    getSession: async () => session,
    onAuthStateChange: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    signInWithOAuth: async () => {
      // Real OAuth leaves the page; tests seed session via initialSession.
      return { error: null };
    },
    signInWithMagicLink: async () => {
      // Real magic link signs in only after the email link is opened.
      return { error: null };
    },
    signOut: async () => {
      emit(null, "SIGNED_OUT");
      return { error: null };
    },
  };
}

export function createSupabaseAuthClient(
  client: SupabaseClient = supabase,
  options?: { getRedirectTo?: () => string },
): AuthClient {
  const getRedirectTo =
    options?.getRedirectTo ?? (() => authRedirectTo(window.location.origin, SITE_BASEPATH));

  return {
    getSession: async () => {
      // getSession() refreshes when the access token is expired and a refresh
      // token remains; that is the cold-start restore path for indefinite Sign-in.
      const { data, error } = await client.auth.getSession();
      if (data.session) {
        return toAuthSession(data.session);
      }
      if (error) {
        return null;
      }
      return null;
    },
    onAuthStateChange: (listener) => {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        listener(toAuthSession(session), event);
      });
      return () => {
        data.subscription.unsubscribe();
      };
    },
    signInWithOAuth: async (provider) => {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectTo(),
        },
      });
      return { error: error?.message ?? null };
    },
    signInWithMagicLink: async (email) => {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectTo(),
        },
      });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      const { error } = await client.auth.signOut();
      return { error: error?.message ?? null };
    },
  };
}
