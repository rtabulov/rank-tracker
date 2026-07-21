import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SITE_BASEPATH } from "@/lib/paths";

export function getRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: SITE_BASEPATH,
    history: options?.history,
    scrollRestoration: true,
  });
}

/** @deprecated Use `getRouter` — kept for composed-shell tests. */
export const createAppRouter = getRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
