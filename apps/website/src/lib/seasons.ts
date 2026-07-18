import type { Entry, Season } from "./types.ts";

export const SEASONS: Season[] = [
  {
    number: 1,
    title: "Season 1",
    startUtc: "2023-12-08T04:19:48Z",
    endUtc: "2024-03-14T09:39:20Z",
  },
  {
    number: 2,
    title: "Season 2",
    startUtc: "2024-03-14T09:39:20Z",
    endUtc: "2024-06-13T12:15:37Z",
  },
  {
    number: 3,
    title: "Season 3",
    startUtc: "2024-06-13T12:15:37Z",
    endUtc: "2024-09-26T09:02:44Z",
  },
  {
    number: 4,
    title: "IT'S SHOWTIME!",
    startUtc: "2024-09-26T09:02:44Z",
    endUtc: "2024-12-12T07:30:00Z",
  },
  {
    number: 5,
    title: "NEXT STAGE",
    startUtc: "2024-12-12T07:30:00Z",
    endUtc: "2025-03-20T10:37:56Z",
  },
  {
    number: 6,
    title: "RISING STARS",
    startUtc: "2025-03-20T10:37:56Z",
    endUtc: "2025-06-12T10:03:08Z",
  },
  {
    number: 7,
    title: "THE DIVIDE",
    startUtc: "2025-06-12T10:03:08Z",
    endUtc: "2025-09-10T15:49:49Z",
  },
  {
    number: 8,
    title: "GAME TIME",
    startUtc: "2025-09-10T15:49:49Z",
    endUtc: "2025-12-10T16:05:12Z",
  },
  {
    number: 9,
    title: "Dragon rising",
    startUtc: "2025-12-10T16:05:12Z",
    endUtc: "2026-03-26T13:30:00Z",
  },
  {
    number: 10,
    title: "FANTASY LEAGUE",
    startUtc: "2026-03-26T13:30:00Z",
    endUtc: "2026-07-09T13:01:22Z",
  },
  {
    number: 11,
    title: "GALAXY MASTERS",
    startUtc: "2026-07-09T13:01:22Z",
    endUtc: null,
  },
];

export function getSeasonForTimestamp(recordedAt: string): Season | null {
  const instant = Date.parse(recordedAt);
  if (Number.isNaN(instant)) {
    return null;
  }

  for (const season of SEASONS) {
    const start = Date.parse(season.startUtc);
    const end = season.endUtc === null ? Number.POSITIVE_INFINITY : Date.parse(season.endUtc);
    if (instant >= start && instant < end) {
      return season;
    }
  }

  return null;
}

export function getCurrentSeason(now = new Date()): Season {
  const season = getSeasonForTimestamp(now.toISOString());
  if (season === null) {
    throw new Error("No Current Season for today's date");
  }
  return season;
}

export function getSeasonByNumber(number: number): Season | undefined {
  return SEASONS.find((season) => season.number === number);
}

export function getEntriesForSeason(entries: Entry[], seasonNumber: number): Entry[] {
  return entries
    .filter((entry) => getSeasonForTimestamp(entry.recordedAt)?.number === seasonNumber)
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
}

export function seasonHasEntries(entries: Entry[], seasonNumber: number): boolean {
  return entries.some((entry) => getSeasonForTimestamp(entry.recordedAt)?.number === seasonNumber);
}

export function isSeasonNavigable(
  seasonNumber: number,
  entries: Entry[],
  now = new Date(),
): boolean {
  const currentSeason = getCurrentSeason(now);
  if (seasonNumber === currentSeason.number) {
    return true;
  }
  return seasonHasEntries(entries, seasonNumber);
}

export function getNavigableSeasons(entries: Entry[], now = new Date()): Season[] {
  const currentSeason = getCurrentSeason(now);
  return SEASONS.filter(
    (season) => season.number === currentSeason.number || seasonHasEntries(entries, season.number),
  ).sort((a, b) => b.number - a.number);
}
