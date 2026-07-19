const LEAGUES = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;
const RS_STEP = 2_500;
const MAX_TIER_INDEX = LEAGUES.length * 4 - 1;

export function rankFromRs(rs: number): string {
  const tierIndex = Math.min(Math.max(0, Math.floor(rs / RS_STEP)), MAX_TIER_INDEX);
  const league = LEAGUES[Math.floor(tierIndex / 4)]!;
  const subTier = 4 - (tierIndex % 4);
  return `${league} ${subTier}`;
}
