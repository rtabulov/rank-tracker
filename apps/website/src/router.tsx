import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/not-found-page";
import { SITE_BASEPATH } from "@/lib/paths";
import { appRouterContext } from "@/lib/router-context-bridge";
import { routeTree } from "./routeTree.gen";

export function getRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: SITE_BASEPATH,
    history: options?.history,
    scrollRestoration: true,
    context: appRouterContext,
    defaultPreload: "intent",
    // Do NOT set defaultPendingComponent: ssr:false routes use it as ClientOnly
    // hydration fallback (see Match.js), which flashed the Season skeleton on `/`.
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
