import { Alert, AlertDescription } from "@/components/ui/alert";
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
        <Alert variant="destructive" className="rounded-none">
          <AlertDescription>{assessment.chromeMessage}</AlertDescription>
        </Alert>
      )}
      {assessment.chromeMessage !== null && assessment.chromeKind === "info" && (
        <p className="text-sm text-muted-foreground" role="status">
          {assessment.chromeMessage}
        </p>
      )}
    </div>
  );
}
