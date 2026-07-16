/** PROTOTYPE — in-memory fixture for Season view layout variants. Wipe with the route. */

export type PrototypeEntry = {
  id: string;
  rs: number;
  recordedAt: string;
  delta: number | null;
};

export type PrototypeSeason = {
  id: string;
  label: string;
  isCurrent: boolean;
  hasEntries: boolean;
};

export type PrototypeSummary = {
  latestRs: number;
  seasonHigh: number;
  seasonLow: number;
  seasonNet: number;
  entryCount: number;
  avgDelta: number;
  deltaLast7d: number;
  daysSinceLastEntry: number;
};

/** Navigable seasons only (past empty seasons omitted per v1). */
export const PROTOTYPE_SEASONS: PrototypeSeason[] = [
  { id: "s11", label: "Season 11", isCurrent: true, hasEntries: true },
  { id: "s10", label: "Season 10", isCurrent: false, hasEntries: true },
  { id: "s9", label: "Season 9", isCurrent: false, hasEntries: true },
  { id: "s8", label: "Season 8", isCurrent: false, hasEntries: true },
];

export const PROTOTYPE_ENTRIES: PrototypeEntry[] = [
  { id: "e1", rs: 38420, recordedAt: "2026-06-02T19:10:00.000Z", delta: null },
  { id: "e2", rs: 39110, recordedAt: "2026-06-08T21:40:00.000Z", delta: 690 },
  { id: "e3", rs: 38750, recordedAt: "2026-06-14T18:05:00.000Z", delta: -360 },
  { id: "e4", rs: 40200, recordedAt: "2026-06-22T20:15:00.000Z", delta: 1450 },
  { id: "e5", rs: 41180, recordedAt: "2026-07-01T22:30:00.000Z", delta: 980 },
  { id: "e6", rs: 40840, recordedAt: "2026-07-09T17:55:00.000Z", delta: -340 },
  { id: "e7", rs: 41960, recordedAt: "2026-07-14T20:05:00.000Z", delta: 1120 },
];

export const PROTOTYPE_SUMMARY: PrototypeSummary = {
  latestRs: 41960,
  seasonHigh: 41960,
  seasonLow: 38420,
  seasonNet: 3540,
  entryCount: 7,
  avgDelta: 590,
  deltaLast7d: 1120,
  daysSinceLastEntry: 2,
};

export function formatSigned(n: number): string {
  if (n > 0) return `+${n.toLocaleString()}`;
  return n.toLocaleString();
}

export function formatRs(n: number): string {
  return n.toLocaleString();
}

export function formatLocalWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
