import { createMemoryPublicSeasonClient, type PublicSeasonClient } from "@/lib/public-season";
import type { Entry } from "@/lib/types";
import type { AppRouterContext } from "@/lib/router-context";

/**
 * Mutable holder read by the router context created in `getRouter()`.
 * Start's `<StartClient />` mounts `RouterProvider` without a `context` prop,
 * so production must get Local store / public client through this bridge —
 * not via `App.tsx` (tests only).
 */
const bridge = {
  getLocalEntries: (): Entry[] => [],
  publicSeasonClient: createMemoryPublicSeasonClient() as PublicSeasonClient,
};

/** Stable identity for the life of the router — never replace this object. */
export const appRouterContext: AppRouterContext = {
  getLocalEntries: () => bridge.getLocalEntries(),
  get publicSeasonClient() {
    return bridge.publicSeasonClient;
  },
};

export function setAppRouterContextBridge(next: {
  getLocalEntries: () => Entry[];
  publicSeasonClient: PublicSeasonClient;
}) {
  bridge.getLocalEntries = next.getLocalEntries;
  bridge.publicSeasonClient = next.publicSeasonClient;
}
