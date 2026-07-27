import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { SeasonViewSkeleton } from "@/components/season-view-skeleton";
import { NotFoundPage } from "@/components/not-found-page";
import {
  createMemoryPublicSeasonClient,
  createSupabasePublicSeasonClient,
} from "@/lib/public-season";
import type { AppRouterContext } from "@/lib/router-context";
import { SITE_BASEPATH } from "@/lib/paths";
import { routeTree } from "./routeTree.gen";

/**
 * Start's hydrateStart runs loaders before React can inject provider context.
 * Seed a real public-season client here (memory only in tests); App / Start
 * still override via RouterProvider when providers are ready.
 */
function createRouterPublicSeasonClient() {
  if (import.meta.env.MODE === "test") {
    return createMemoryPublicSeasonClient();
  }
  return createSupabasePublicSeasonClient();
}

const placeholderContext: AppRouterContext = {
  getLocalEntries: () => [],
  publicSeasonClient: createRouterPublicSeasonClient(),
};

export function getRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: SITE_BASEPATH,
    history: options?.history,
    scrollRestoration: true,
    context: placeholderContext,
    defaultPreload: "intent",
    defaultPendingComponent: SeasonViewSkeleton,
    defaultPendingMs: 250,
    defaultPendingMinMs: 350,
    defaultNotFoundComponent: NotFoundPage,
  });
}

/** @deprecated Use `getRouter` — kept for composed-shell tests. */
export const createAppRouter = getRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
