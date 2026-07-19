import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useSearch,
  type AnyRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { HeaderActions } from "@/components/header-actions";
import { LocalStoreProvider, useLocalStore } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { ThemeHotkey } from "@/components/theme-hotkey";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";
import type { LocalStore, StorageAdapter } from "@/lib/types";

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
    const season = search.season;
    if (typeof season === "number" && Number.isInteger(season)) {
      return { season };
    }
    if (typeof season === "string" && /^\d+$/.test(season)) {
      return { season: Number(season) };
    }
    return {};
  },
  component: SeasonViewPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const PAGES_BASEPATH = "/rank-tracker";

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
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeHotkey />
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="border-b-4 border-primary bg-background">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Unofficial companion
              </p>
              <h1 className="font-heading text-3xl font-bold uppercase leading-none tracking-tight">
                Rank Tracker
              </h1>
            </div>
            <HeaderActions />
          </div>
        </header>
        <Outlet />
      </div>
    </ThemeProvider>
  );
}

function SeasonViewPage() {
  const navigate = useNavigate({ from: indexRoute.id });
  const search = useSearch({ from: indexRoute.id });
  const { store } = useLocalStore();
  const currentSeason = getCurrentSeason();
  const requestedSeason = search.season ?? currentSeason.number;
  const selectedSeason = isSeasonNavigable(requestedSeason, store.entries)
    ? requestedSeason
    : currentSeason.number;

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
}: {
  router?: AnyRouter;
  storageAdapter?: StorageAdapter;
  initialStore?: LocalStore;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LocalStoreProvider storageAdapter={storageAdapter} initialStore={initialStore}>
        <RouterProvider router={router} />
      </LocalStoreProvider>
    </QueryClientProvider>
  );
}
