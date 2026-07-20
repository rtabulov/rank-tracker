import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useRouterState,
  useSearch,
  type AnyRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth-provider";
import { CloudSyncProvider } from "@/components/cloud-sync-provider";
import { DisplayNameGate } from "@/components/display-name-gate";
import { HeaderActions } from "@/components/header-actions";
import { HeaderEyebrow } from "@/components/header-eyebrow";
import {
  PublicSeasonViewPrototypePage,
  type PublicSeasonViewPrototypeSearch,
} from "@/components/prototype/public-season-view/page";
import { ProfileProvider } from "@/components/profile-provider";
import { LocalStoreProvider, useLocalStore } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { ThemeHotkey } from "@/components/theme-hotkey";
import { ThemeProvider } from "@/components/theme-provider";
import { createMemoryAuthClient, createSupabaseAuthClient, type AuthClient } from "@/lib/auth";
import {
  createMemoryCloudEntriesClient,
  createSupabaseCloudEntriesClient,
  type CloudEntriesClient,
} from "@/lib/cloud-entries";
import {
  createMemoryProfileClient,
  createSupabaseProfileClient,
  type ProfileClient,
} from "@/lib/profile";
import { PAGES_BASEPATH } from "@/lib/paths";
import { resolveSelectedSeason } from "@/lib/resolve-selected-season";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";
import type { StorageAdapter, UnmigratedLocalStore } from "@/lib/types";

export { PAGES_BASEPATH };

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

type SeasonSearch = {
  season?: number;
};

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): SeasonSearch => {
    const season = parseSeasonSearchParam(search);
    return season === undefined ? {} : { season };
  },
  component: SeasonViewPage,
});

/** PROTOTYPE — throwaway Public Season view / Public link controls. */
const publicSeasonViewPrototypeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/prototype/public-season-view",
  validateSearch: (search: Record<string, unknown>): PublicSeasonViewPrototypeSearch => ({
    variant: typeof search.variant === "string" ? search.variant : undefined,
    screen: typeof search.screen === "string" ? search.screen : undefined,
  }),
  component: PublicSeasonViewPrototypePage,
});

const routeTree = rootRoute.addChildren([indexRoute, publicSeasonViewPrototypeRoute]);

export function createAppRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: PAGES_BASEPATH,
    history: options?.history,
  });
}

const defaultRouter = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof defaultRouter;
  }
}

function RootLayout() {
  const isPrototypeRoute = useRouterState({
    select: (state) => state.location.pathname.includes("/prototype/"),
  });

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeHotkey />
      {isPrototypeRoute ? (
        <Outlet />
      ) : (
        <div className="relative flex min-h-svh flex-col bg-background text-foreground">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] hud-scanlines"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--hud-cyan)_12%,transparent),transparent_55%)]"
            aria-hidden="true"
          />
          <header className="relative z-10 mx-auto w-full max-w-lg px-4 pt-4">
            <div className="hud-chamfer flex items-start justify-between gap-3 border border-primary/30 bg-card/80 p-3">
              <div>
                <HeaderEyebrow />
                <h1 className="font-heading text-lg font-black uppercase tracking-[0.2em] text-primary hud-glow-primary">
                  Rank Tracker
                </h1>
              </div>
              <HeaderActions />
            </div>
          </header>
          <DisplayNameGate />
          <div className="relative z-10 flex flex-1 flex-col">
            <Outlet />
          </div>
          <footer className="relative z-0 mx-auto w-full max-w-lg px-4 pb-28 pt-2">
            <nav
              aria-label="Project links"
              className="flex items-center justify-center gap-3 font-sans text-xs text-muted-foreground"
            >
              <a
                href="https://github.com/rtabulov/rank-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Source
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://github.com/rtabulov/rank-tracker/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Report a problem
              </a>
            </nav>
          </footer>
        </div>
      )}
    </ThemeProvider>
  );
}

function SeasonViewPage() {
  const navigate = useNavigate({ from: indexRoute.id });
  const search = useSearch({ from: indexRoute.id });
  const { store } = useLocalStore();
  const currentSeason = getCurrentSeason();
  const selectedSeason = resolveSelectedSeason(search.season, store.entries);

  useEffect(() => {
    if (search.season === undefined) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
      return;
    }

    if (!isSeasonNavigable(search.season, store.entries)) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
    }
  }, [currentSeason.number, navigate, search.season, store.entries]);

  return (
    <SeasonView
      seasonNumber={selectedSeason}
      onSeasonSelect={(seasonNumber) => {
        void navigate({ search: { season: seasonNumber } });
      }}
    />
  );
}

export function App({
  router = defaultRouter,
  storageAdapter,
  initialStore,
  authClient,
  profileClient,
  entriesClient,
}: {
  router?: AnyRouter;
  storageAdapter?: StorageAdapter;
  initialStore?: UnmigratedLocalStore;
  authClient?: AuthClient;
  profileClient?: ProfileClient;
  entriesClient?: CloudEntriesClient;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [resolvedAuthClient] = useState(() => authClient ?? createDefaultAuthClient());
  const [resolvedProfileClient] = useState(() => profileClient ?? createDefaultProfileClient());
  const [resolvedEntriesClient] = useState(
    () => entriesClient ?? createDefaultCloudEntriesClient(),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authClient={resolvedAuthClient}>
        <ProfileProvider profileClient={resolvedProfileClient}>
          <LocalStoreProvider storageAdapter={storageAdapter} initialStore={initialStore}>
            <CloudSyncProvider entriesClient={resolvedEntriesClient}>
              <RouterProvider router={router} />
            </CloudSyncProvider>
          </LocalStoreProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
