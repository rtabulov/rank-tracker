import { type ReactNode } from "react";
import { useLocalStore } from "@/components/local-store-provider";
import { usePublicSeasonClient } from "@/components/public-season-provider";
import { setAppRouterContextBridge } from "@/lib/router-context-bridge";

/** Keeps Start router context wired to React providers (runs before StartClient loaders). */
export function RouterContextBridge({ children }: { children: ReactNode }) {
  const { getEntries } = useLocalStore();
  const publicSeasonClient = usePublicSeasonClient();
  setAppRouterContextBridge({
    getLocalEntries: getEntries,
    publicSeasonClient,
  });
  return children;
}
