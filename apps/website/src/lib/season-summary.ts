import type { Entry } from "./types.ts";

const LAST_N_DAYS = 7;
const LAST_N_HOURS = 12;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export type SeasonSummary = {
  latestRs: number;
  seasonHigh: number;
  seasonLow: number;
  seasonNet: number;
  avgDeltaPerEntry: number | null;
  deltaLast12Hours: number | null;
  deltaLast7Days: number | null;
  daysSinceLastEntry: number | null;
};

function localCalendarDayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function deltaSinceCutoff(entries: Entry[], cutoffMs: number, latestRs: number): number | null {
  let baselineEntry: Entry | undefined;
  for (const entry of entries) {
    if (Date.parse(entry.recordedAt) <= cutoffMs) {
      baselineEntry = entry;
    }
  }
  if (baselineEntry === undefined) {
    return null;
  }
  return latestRs - baselineEntry.rs;
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
  let deltaLast12Hours: number | null = null;
  let deltaLast7Days: number | null = null;
  let daysSinceLastEntry: number | null = null;

  if (options.isCurrentSeason) {
    deltaLast12Hours = deltaSinceCutoff(entries, now.getTime() - LAST_N_HOURS * HOUR_MS, latestRs);
    deltaLast7Days = deltaSinceCutoff(entries, now.getTime() - LAST_N_DAYS * DAY_MS, latestRs);

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
    avgDeltaPerEntry,
    deltaLast12Hours,
    deltaLast7Days,
    daysSinceLastEntry,
  };
}
