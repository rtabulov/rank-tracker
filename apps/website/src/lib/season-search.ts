export function parseSeasonSearchParam(search: unknown): number | undefined {
  if (typeof search !== "object" || search === null) {
    return undefined;
  }

  const season = (search as Record<string, unknown>).season;
  if (typeof season === "number" && Number.isInteger(season)) {
    return season;
  }
  if (typeof season === "string" && /^\d+$/.test(season)) {
    return Number(season);
  }
  return undefined;
}
