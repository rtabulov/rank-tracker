import { computeSeasonSummary } from "@/lib/season-summary";
import { rankFromRs } from "@/lib/rank-from-rs";
import { getEntriesForSeason } from "@/lib/seasons";
import type { Entry } from "@/lib/types";

export function formatHeaderEyebrow(input: {
  displayName: string | null | undefined;
  entries: Entry[];
  seasonNumber: number;
}): string {
  const left =
    input.displayName !== null && input.displayName !== undefined && input.displayName.length > 0
      ? input.displayName
      : "SYS";

  const seasonEntries = getEntriesForSeason(input.entries, input.seasonNumber);
  if (seasonEntries.length === 0) {
    return `${left} // RANK`;
  }

  const summary = computeSeasonSummary(seasonEntries, { isCurrentSeason: false });
  if (summary === null) {
    return `${left} // RANK`;
  }

  const rank = rankFromRs(summary.latestRs);
  return `${left} // ${rank}`;
}
