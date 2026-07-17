import type { Entry } from "./types.ts";

const LAST_N_DAYS = 7;
const DAY_MS = 86_400_000;

export type SeasonSummary = {
  latestRs: number;
  seasonHigh: number;
  seasonLow: number;
  seasonNet: number;
  entryCount: number;
  avgDeltaPerEntry: number | null;
  deltaLast7Days: number | null;
  daysSinceLastEntry: number | null;
};

function localCalendarDayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function computeSeasonSummary(
  entries: Entry[],
  options: { isCurrentSeason: boolean; now?: Date },
): SeasonSummary | null {
  if (entries.length === 0) {
    return null;
  }

  const rsValues = entries.map((entry) => entry.rs);
  const latestRs = rsValues.at(-1)!;
  const firstRs = rsValues[0]!;
  const seasonNet = latestRs - firstRs;

  let avgDeltaPerEntry: number | null = null;
  if (entries.length > 1) {
    let deltaTotal = 0;
    for (let index = 1; index < entries.length; index += 1) {
      deltaTotal += entries[index]!.rs - entries[index - 1]!.rs;
    }
    avgDeltaPerEntry = deltaTotal / (entries.length - 1);
  }

  const now = options.now ?? new Date();
  let deltaLast7Days: number | null = null;
  let daysSinceLastEntry: number | null = null;

  if (options.isCurrentSeason) {
    const cutoffMs = now.getTime() - LAST_N_DAYS * DAY_MS;
    let baselineEntry: Entry | undefined;
    for (const entry of entries) {
      if (Date.parse(entry.recordedAt) <= cutoffMs) {
        baselineEntry = entry;
      }
    }
    if (baselineEntry !== undefined) {
      deltaLast7Days = latestRs - baselineEntry.rs;
    }

    const lastRecordedAt = entries.at(-1)!.recordedAt;
    daysSinceLastEntry = Math.floor(
      (localCalendarDayStart(now) - localCalendarDayStart(new Date(lastRecordedAt))) / DAY_MS,
    );
  }

  return {
    latestRs,
    seasonHigh: Math.max(...rsValues),
    seasonLow: Math.min(...rsValues),
    seasonNet,
    entryCount: entries.length,
    avgDeltaPerEntry,
    deltaLast7Days,
    daysSinceLastEntry,
  };
}
