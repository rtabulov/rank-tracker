import { useEffect } from "react";
import { useState } from "react";
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
import { LocalStoreProvider } from "@/components/local-store-provider.tsx";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import { SeasonView } from "@/components/season-view.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { getCurrentSeason } from "@/lib/seasons.ts";
import type { LocalStore, StorageAdapter } from "@/lib/types.ts";

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
    return {
      season: typeof season === "number" ? season : undefined,
    };
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
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between gap-4 p-6">
          <h1 className="text-2xl font-medium tracking-tight">Rank Tracker</h1>
          <ModeToggle />
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
