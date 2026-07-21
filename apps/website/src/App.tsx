import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { AppProviders, type AppProvidersProps } from "@/app-providers";
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
      <RouterProvider router={router} />
    </AppProviders>
  );
}
