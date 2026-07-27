import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { useLocalStore } from "@/components/local-store-provider";
import { usePublicSeasonClient } from "@/components/public-season-provider";

/** Injects provider-backed clients into router context (tests + Start hydrate). */
export function RouterWithAppContext({ router }: { router: AnyRouter }) {
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
