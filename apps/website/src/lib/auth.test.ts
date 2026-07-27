import { createClient, type Session, type User } from "@supabase/supabase-js";
import { expect, test, vi } from "vite-plus/test";
import { authRedirectTo, createSupabaseAuthClient } from "./auth";
import { SITE_BASEPATH } from "./paths";

test("auth redirect targets site root on custom domain", () => {
  expect(authRedirectTo("https://rank.rtabulov.dev", SITE_BASEPATH)).toBe(
    "https://rank.rtabulov.dev/",
  );
});

test("auth redirect normalizes base path without trailing slash", () => {
  expect(authRedirectTo("http://localhost:5173", "/")).toBe("http://localhost:5173/");
});

const STORAGE_KEY = "rank-tracker-auth-test";

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

function makeUser(overrides?: Partial<User>): User {
  return {
    id: "user-1",
    email: "player@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as User;
}

function makeSession(overrides?: Partial<Session>): Session {
  const expiresAt = overrides?.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user: makeUser(),
    ...overrides,
  };
}

function createAuthTestClient(fetchImpl: typeof fetch) {
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
  return { client, storage };
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

test("cold start with expired access token restores Sign-in when refresh token is valid", async () => {
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

  const { client, storage } = createAuthTestClient(fetchImpl);
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

  await expect(authClient.getSession()).resolves.toEqual({
    userId: "user-1",
    email: "player@example.com",
  });
});

test("cold start clears Sign-in when Auth rejects the refresh token", async () => {
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes("/auth/v1/token") && url.includes("grant_type=refresh_token")) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", error_description: "revoked" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ message: `unexpected fetch: ${url}` }), { status: 500 });
  }) as unknown as typeof fetch;

  const { client, storage } = createAuthTestClient(fetchImpl);
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      makeSession({
        access_token: "expired-access",
        refresh_token: "revoked-refresh",
        expires_at: Math.floor(Date.now() / 1000) - 120,
      }),
    ),
  );

  const authClient = createSupabaseAuthClient(client, {
    getRedirectTo: () => "https://rank.rtabulov.dev/",
  });

  await expect(authClient.getSession()).resolves.toBeNull();
  expect(storage.getItem(STORAGE_KEY)).toBeNull();
});
