import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EntrySeasonChrome } from "@/components/entry-season-chrome";
import { ViewportOverlay } from "@/components/viewport-overlay";
import { createEntry } from "@/lib/entries";
import { assessEntrySeasonSave } from "@/lib/entry-season-save";
import { entryRsFormSchema } from "@/lib/entry-form-schema";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { getCurrentSeason } from "@/lib/seasons";
import type { Entry } from "@/lib/types";

type EditEntryOverlayProps = {
  open: boolean;
  entry: Entry;
  seasonNumber: number;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
  onDeleteRequest: () => void;
};

export function EditEntryOverlay({
  open,
  entry,
  seasonNumber,
  onClose,
  onSaved,
  onDeleteRequest,
}: EditEntryOverlayProps) {
  const currentSeasonNumber = getCurrentSeason().number;

  const form = useForm({
    defaultValues: {
      rs: String(entry.rs),
      recordedAtLocal: toDatetimeLocalValue(new Date(entry.recordedAt)),
    },
    validators: {
      onSubmit: entryRsFormSchema,
    },
    onSubmit: async ({ value }) => {
      const recordedAt = fromDatetimeLocalValue(value.recordedAtLocal);
      const assessment = assessEntrySeasonSave(recordedAt, seasonNumber, currentSeasonNumber);
      if (!assessment.saveAllowed) {
        return;
      }

      const updated = createEntry({
        id: entry.id,
        rs: Number(value.rs),
        recordedAt,
      });
      onSaved(updated);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      rs: String(entry.rs),
      recordedAtLocal: toDatetimeLocalValue(new Date(entry.recordedAt)),
    });
  }, [entry.id, entry.recordedAt, entry.rs, form, open]);

  return (
    <ViewportOverlay open={open} title="Edit Entry" titleId="edit-entry-title" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="rs">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={field.name}>
                RS
              </label>
              <input
                id={field.name}
                name={field.name}
                inputMode="numeric"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive" role="alert">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="recordedAtLocal">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={field.name}>
                Recorded at
              </label>
              <input
                id={field.name}
                name={field.name}
                type="datetime-local"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive" role="alert">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.recordedAtLocal}>
          {(recordedAtLocal) => (
            <EntrySeasonChrome
              assessment={assessEntrySeasonSave(
                fromDatetimeLocalValue(recordedAtLocal),
                seasonNumber,
                currentSeasonNumber,
              )}
            />
          )}
        </form.Subscribe>

        <div className="flex flex-col gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={onDeleteRequest}>
            Delete
          </Button>
        </div>
      </form>
    </ViewportOverlay>
  );
}
