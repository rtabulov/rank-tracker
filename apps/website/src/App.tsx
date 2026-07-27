import { type AnyRouter } from "@tanstack/react-router";
import { AppProviders, type AppProvidersProps } from "@/app-providers";
import { RouterWithAppContext } from "@/components/router-with-app-context";
import { createAppRouter, getRouter } from "@/router";

const defaultRouter = getRouter();

export { createAppRouter, getRouter };

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
