import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth-provider";
import { CloudSyncProvider } from "@/components/cloud-sync-provider";
import { LocalStoreProvider } from "@/components/local-store-provider";
import { ProfileProvider } from "@/components/profile-provider";
import { PublicSeasonProvider } from "@/components/public-season-provider";
import { createMemoryAuthClient, createSupabaseAuthClient, type AuthClient } from "@/lib/auth";
import {
  createMemoryCloudEntriesClient,
  createSupabaseCloudEntriesClient,
  type CloudEntriesClient,
} from "@/lib/cloud-entries";
import {
  createMemoryPublicSeasonClient,
  createSupabasePublicSeasonClient,
  type PublicSeasonClient,
} from "@/lib/public-season";
import {
  createMemoryProfileClient,
  createSupabaseProfileClient,
  type ProfileClient,
} from "@/lib/profile";
import type { StorageAdapter, UnmigratedLocalStore } from "@/lib/types";

function createDefaultAuthClient(): AuthClient {
  if (import.meta.env.MODE === "test") {
    return createMemoryAuthClient();
  }
  return createSupabaseAuthClient();
}

function createDefaultProfileClient(): ProfileClient {
  if (import.meta.env.MODE === "test") {
    return createMemoryProfileClient();
  }
  return createSupabaseProfileClient();
}

function createDefaultCloudEntriesClient(): CloudEntriesClient {
  if (import.meta.env.MODE === "test") {
    return createMemoryCloudEntriesClient();
  }
  return createSupabaseCloudEntriesClient();
}

function createDefaultPublicSeasonClient(): PublicSeasonClient {
  if (import.meta.env.MODE === "test") {
    return createMemoryPublicSeasonClient();
  }
  return createSupabasePublicSeasonClient();
}

export type AppProvidersProps = {
  children: ReactNode;
  storageAdapter?: StorageAdapter;
  initialStore?: UnmigratedLocalStore;
  authClient?: AuthClient;
  profileClient?: ProfileClient;
  entriesClient?: CloudEntriesClient;
  publicSeasonClient?: PublicSeasonClient;
};

export function AppProviders({
  children,
  storageAdapter,
  initialStore,
  authClient,
  profileClient,
  entriesClient,
  publicSeasonClient,
}: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [resolvedAuthClient] = useState(() => authClient ?? createDefaultAuthClient());
  const [resolvedProfileClient] = useState(() => profileClient ?? createDefaultProfileClient());
  const [resolvedEntriesClient] = useState(
    () => entriesClient ?? createDefaultCloudEntriesClient(),
  );
  const [resolvedPublicSeasonClient] = useState(
    () => publicSeasonClient ?? createDefaultPublicSeasonClient(),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authClient={resolvedAuthClient}>
        <ProfileProvider profileClient={resolvedProfileClient}>
          <LocalStoreProvider storageAdapter={storageAdapter} initialStore={initialStore}>
            <CloudSyncProvider entriesClient={resolvedEntriesClient}>
              <PublicSeasonProvider publicSeasonClient={resolvedPublicSeasonClient}>
                {children}
              </PublicSeasonProvider>
            </CloudSyncProvider>
          </LocalStoreProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
