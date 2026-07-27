import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { AppProviders, type AppProvidersProps } from "@/app-providers";
import { RouterContextBridge } from "@/components/router-context-bridge";
import { appRouterContext } from "@/lib/router-context-bridge";
import { createAppRouter, getRouter } from "@/router";

const defaultRouter = getRouter();

export { createAppRouter, getRouter };

function RouterWithAppContext({ router }: { router: AnyRouter }) {
  return (
    <RouterContextBridge>
      <RouterProvider router={router} context={appRouterContext} />
    </RouterContextBridge>
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
      <RouterWithAppContext router={router} />
    </AppProviders>
  );
}
