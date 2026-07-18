import type { EntrySeasonSaveAssessment } from "@/lib/entry-season-save";

type EntrySeasonChromeProps = {
  assessment: EntrySeasonSaveAssessment;
};

export function EntrySeasonChrome({ assessment }: EntrySeasonChromeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm">
        <span className="font-medium">Season preview: </span>
        <span aria-label="Season preview">{assessment.previewText}</span>
      </p>
      {assessment.chromeMessage !== null && assessment.chromeKind === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {assessment.chromeMessage}
        </p>
      )}
      {assessment.chromeMessage !== null && assessment.chromeKind === "info" && (
        <p className="text-sm text-muted-foreground" role="status">
          {assessment.chromeMessage}
        </p>
      )}
    </div>
  );
}
