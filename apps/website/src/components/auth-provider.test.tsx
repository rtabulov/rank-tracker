import { createClient, type Session, type User } from "@supabase/supabase-js";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";
import { createSupabaseAuthClient, type AuthClient, type AuthSession } from "@/lib/auth";
import { AuthProvider, useAuth } from "./auth-provider";

function AuthProbe() {
  const { session, status } = useAuth();
  if (status === "loading") {
    return <div>loading</div>;
  }
  if (session === null) {
    return <div>signed-out</div>;
  }
  return <div>{`signed-in:${session.email}`}</div>;
}

function createRacingAuthClient(restored: AuthSession): AuthClient {
  const listeners = new Set<(session: AuthSession | null, event: string) => void>();

  return {
    getSession: async () => restored,
    onAuthStateChange: (listener) => {
      listeners.add(listener);
      // Simulate supabase-js INITIAL_SESSION(null) after getSession restored Sign-in.
      setTimeout(() => {
        listener(null, "INITIAL_SESSION");
      }, 0);
      return () => {
        listeners.delete(listener);
      };
    },
    signInWithOAuth: async () => ({ error: null }),
    signInWithMagicLink: async () => ({ error: null }),
    signOut: async () => {
      for (const listener of listeners) {
        listener(null, "SIGNED_OUT");
      }
      return { error: null };
    },
  };
}

const STORAGE_KEY = "rank-tracker-auth-provider-test";

function createMemoryAuthStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

function makeUser(): User {
  return {
    id: "user-1",
    email: "player@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
  } as User;
}

function makeSession(overrides?: Partial<Session>): Session {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: makeUser(),
    ...overrides,
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

test("restored Sign-in survives a racing null auth event during cold start", async () => {
  const authClient = createRacingAuthClient({
    userId: "user-1",
    email: "player@example.com",
  });

  render(
    <AuthProvider authClient={authClient}>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText("signed-in:player@example.com")).toBeInTheDocument();
  });

  // Let the delayed INITIAL_SESSION(null) race land, then confirm Sign-in sticks.
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.getByText("signed-in:player@example.com")).toBeInTheDocument();
  expect(screen.queryByText("signed-out")).not.toBeInTheDocument();
});

test("explicit Sign out still clears restored Sign-in", async () => {
  const authClient = createRacingAuthClient({
    userId: "user-1",
    email: "player@example.com",
  });

  render(
    <AuthProvider authClient={authClient}>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText("signed-in:player@example.com")).toBeInTheDocument();
  });

  await authClient.signOut();

  await waitFor(() => {
    expect(screen.getByText("signed-out")).toBeInTheDocument();
  });
});

test("cold start with expired access token shows signed-in after refresh", async () => {
  const refreshed = makeSession({
    access_token: "fresh-access",
    refresh_token: "fresh-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes("/auth/v1/token") && url.includes("grant_type=refresh_token")) {
      return new Response(
        JSON.stringify({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: refreshed.expires_at,
          user: refreshed.user,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ message: `unexpected fetch: ${url}` }), { status: 500 });
  }) as unknown as typeof fetch;

  const storage = createMemoryAuthStorage();
  const client = createClient("https://test.supabase.co", "test-anon-key", {
    auth: {
      storage,
      storageKey: STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: { fetch: fetchImpl },
  });

  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      makeSession({
        access_token: "expired-access",
        refresh_token: "still-valid-refresh",
        expires_at: Math.floor(Date.now() / 1000) - 120,
      }),
    ),
  );

  const authClient = createSupabaseAuthClient(client, {
    getRedirectTo: () => "https://rank.rtabulov.dev/",
  });

  render(
    <AuthProvider authClient={authClient}>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText("signed-in:player@example.com")).toBeInTheDocument();
  });
});
