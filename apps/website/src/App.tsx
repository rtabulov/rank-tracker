import { useEffect } from "react";
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
import { AppProviders, type AppProvidersProps } from "@/app-providers";
import { DisplayNameGate } from "@/components/display-name-gate";
import { HeaderActions } from "@/components/header-actions";
import { HeaderEyebrow } from "@/components/header-eyebrow";
import {
  parsePublicSeasonSearch,
  PublicSeasonRoutePage,
} from "@/components/public-season-route-page";
import { useLocalStore } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { ThemeHotkey } from "@/components/theme-hotkey";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_BASEPATH } from "@/lib/paths";
import { resolveSelectedSeason } from "@/lib/resolve-selected-season";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";
export { SITE_BASEPATH };

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

const publicSeasonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$displayName",
  validateSearch: (search: Record<string, unknown>): SeasonSearch =>
    parsePublicSeasonSearch(search),
  component: PublicSeasonViewPage,
});

function PublicSeasonViewPage() {
  return <PublicSeasonRoutePage routeId={publicSeasonRoute.id} />;
}

const routeTree = rootRoute.addChildren([indexRoute, publicSeasonRoute]);

export function createAppRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: SITE_BASEPATH,
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
  ...providerProps
}: {
  router?: AnyRouter;
} & Omit<AppProvidersProps, "children">) {
  return (
    <AppProviders {...providerProps}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
