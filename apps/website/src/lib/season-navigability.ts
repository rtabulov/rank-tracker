import { getCurrentSeason, getSeasonByNumber } from "@/lib/seasons";

export function isSeasonNumberNavigable(
  seasonNumber: number,
  seasonNumbers: number[],
  now = new Date(),
): boolean {
  const currentSeasonNumber = getCurrentSeason(now).number;
  if (seasonNumber === currentSeasonNumber) {
    return true;
  }
  return seasonNumbers.includes(seasonNumber);
}

export function seasonsFromNumbers(seasonNumbers: number[]) {
  return seasonNumbers
    .map((number) => getSeasonByNumber(number))
    .filter((season): season is NonNullable<typeof season> => season !== undefined)
    .sort((a, b) => b.number - a.number);
}
