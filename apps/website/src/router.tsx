import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { SeasonViewSkeleton } from "@/components/season-view-skeleton";
import { createMemoryPublicSeasonClient } from "@/lib/public-season";
import type { AppRouterContext } from "@/lib/router-context";
import { SITE_BASEPATH } from "@/lib/paths";
import { routeTree } from "./routeTree.gen";

const placeholderContext: AppRouterContext = {
  getLocalEntries: () => [],
  publicSeasonClient: createMemoryPublicSeasonClient(),
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
  });
}

/** @deprecated Use `getRouter` — kept for composed-shell tests. */
export const createAppRouter = getRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
