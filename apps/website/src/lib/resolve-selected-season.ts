import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";
import type { Entry } from "@/lib/types";

export function resolveSelectedSeason(
  requestedSeason: number | undefined,
  entries: Entry[],
  now = new Date(),
): number {
  const currentSeason = getCurrentSeason(now);
  const seasonNumber = requestedSeason ?? currentSeason.number;
  return isSeasonNavigable(seasonNumber, entries, now) ? seasonNumber : currentSeason.number;
}
