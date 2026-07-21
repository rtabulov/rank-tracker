import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { AppProviders, type AppProvidersProps } from "@/app-providers";
import { useLocalStore } from "@/components/local-store-provider";
import { usePublicSeasonClient } from "@/components/public-season-provider";
import { createAppRouter, getRouter } from "@/router";

const defaultRouter = getRouter();

export { createAppRouter, getRouter };

function RouterWithAppContext({ router }: { router: AnyRouter }) {
  const { getEntries } = useLocalStore();
  const publicSeasonClient = usePublicSeasonClient();

  return (
    <RouterProvider
      router={router}
      context={{
        getLocalEntries: getEntries,
        publicSeasonClient,
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
      <RouterWithAppContext router={router} />
    </AppProviders>
  );
}
