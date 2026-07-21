import type { Entry } from "@/lib/types";
import type { PublicSeasonClient, PublicSeasonIndex } from "@/lib/public-season";

export type AppRouterContext = {
  getLocalEntries: () => Entry[];
  publicSeasonClient: PublicSeasonClient;
  /** Set by `/p/$displayName` beforeLoad when the Public link resolves. */
  publicIndex?: PublicSeasonIndex;
};
