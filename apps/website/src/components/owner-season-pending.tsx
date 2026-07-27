import { SeasonView } from "@/components/season-view";
import { useLocalStore } from "@/components/local-store-provider";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";

/**
 * ClientOnly hydration fallback for `/` (ssr:false).
 * Must mirror Local store content — not the Season skeleton — so cold boot
 * does not flash bones or a blank main under the shell.
 */
export function OwnerSeasonPending() {
  if (typeof window === "undefined") {
    return null;
  }

  return <OwnerSeasonPendingClient />;
}

function OwnerSeasonPendingClient() {
  const { store } = useLocalStore();
  const rawSeason = new URLSearchParams(window.location.search).get("season");
  const parsed = parseSeasonSearchParam({ season: rawSeason });
  const current = getCurrentSeason().number;
  const seasonNumber =
    parsed !== undefined && isSeasonNavigable(parsed, store.entries) ? parsed : current;

  return <SeasonView seasonNumber={seasonNumber} onSeasonSelect={() => {}} />;
}
