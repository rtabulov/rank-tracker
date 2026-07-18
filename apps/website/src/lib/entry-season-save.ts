import { getCurrentSeason, getSeasonForTimestamp } from "./seasons";

export type EntrySeasonChromeKind = "none" | "info" | "error";

export type EntrySeasonSaveAssessment = {
  derivedSeasonNumber: number | null;
  previewText: string;
  saveAllowed: boolean;
  chromeKind: EntrySeasonChromeKind;
  chromeMessage: string | null;
};

function formatSeasonPreview(seasonNumber: number, currentSeasonNumber: number): string {
  if (seasonNumber === currentSeasonNumber) {
    return `Season ${seasonNumber} (Current)`;
  }
  return `Season ${seasonNumber}`;
}

export function assessEntrySeasonSave(
  recordedAt: string,
  viewSeasonNumber: number,
  currentSeasonNumber = getCurrentSeason().number,
): EntrySeasonSaveAssessment {
  if (recordedAt.length === 0 || Number.isNaN(Date.parse(recordedAt))) {
    return {
      derivedSeasonNumber: null,
      previewText: "—",
      saveAllowed: false,
      chromeKind: "none",
      chromeMessage: null,
    };
  }

  const derivedSeason = getSeasonForTimestamp(recordedAt);

  if (derivedSeason === null) {
    return {
      derivedSeasonNumber: null,
      previewText: "Outside known Seasons",
      saveAllowed: false,
      chromeKind: "error",
      chromeMessage: "Recorded at falls outside every known Season.",
    };
  }

  const previewText = formatSeasonPreview(derivedSeason.number, currentSeasonNumber);
  const isCurrentSeasonView = viewSeasonNumber === currentSeasonNumber;

  if (!isCurrentSeasonView && derivedSeason.number !== viewSeasonNumber) {
    return {
      derivedSeasonNumber: derivedSeason.number,
      previewText,
      saveAllowed: false,
      chromeKind: "error",
      chromeMessage: `Entry belongs to ${formatSeasonPreview(derivedSeason.number, currentSeasonNumber)}, not the Season you're viewing.`,
    };
  }

  if (isCurrentSeasonView && derivedSeason.number !== currentSeasonNumber) {
    return {
      derivedSeasonNumber: derivedSeason.number,
      previewText,
      saveAllowed: true,
      chromeKind: "info",
      chromeMessage: `Saves to Season ${derivedSeason.number}`,
    };
  }

  return {
    derivedSeasonNumber: derivedSeason.number,
    previewText,
    saveAllowed: true,
    chromeKind: "none",
    chromeMessage: null,
  };
}
