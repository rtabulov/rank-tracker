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
import { LocalStoreProvider } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { ThemeHotkey } from "@/components/theme-hotkey";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentSeason } from "@/lib/seasons";
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
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between gap-4 p-6">
          <h1 className="text-2xl font-medium tracking-tight">Rank Tracker</h1>
          <HeaderActions />
        </header>
        <Outlet />
      </div>
    </ThemeProvider>
  );
}

function SeasonViewPage() {
  const navigate = useNavigate({ from: indexRoute.id });
  const search = useSearch({ from: indexRoute.id });
  const currentSeason = getCurrentSeason();
  const selectedSeason = search.season ?? currentSeason.number;

  useEffect(() => {
    if (search.season === undefined) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
    }
  }, [currentSeason.number, navigate, search.season]);

  return <SeasonView seasonNumber={selectedSeason} />;
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
