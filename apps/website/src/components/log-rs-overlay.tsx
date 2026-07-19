import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntrySeasonChrome } from "@/components/entry-season-chrome";
import { ViewportOverlay } from "@/components/viewport-overlay";
import { createEntry } from "@/lib/entries";
import { assessEntrySeasonSave } from "@/lib/entry-season-save";
import { entryRsFormSchema } from "@/lib/entry-form-schema";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { getCurrentSeason } from "@/lib/seasons";
import type { Entry } from "@/lib/types";

type LogRsOverlayProps = {
  open: boolean;
  seasonNumber: number;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
};

export function LogRsOverlay({ open, seasonNumber, onClose, onSaved }: LogRsOverlayProps) {
  const currentSeasonNumber = getCurrentSeason().number;

  const form = useForm({
    defaultValues: {
      rs: "",
      recordedAtLocal: toDatetimeLocalValue(new Date()),
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

      const entry = createEntry({
        rs: Number(value.rs),
        recordedAt,
      });
      onSaved(entry);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      rs: "",
      recordedAtLocal: toDatetimeLocalValue(new Date()),
    });
  }, [form, open]);

  return (
    <ViewportOverlay open={open} title="Log RS" titleId="log-rs-title" onClose={onClose}>
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
              <Label htmlFor={field.name}>RS</Label>
              <Input
                id={field.name}
                name={field.name}
                inputMode="numeric"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
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
              <Label htmlFor={field.name}>Recorded at</Label>
              <Input
                id={field.name}
                name={field.name}
                type="datetime-local"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
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

        <Button type="submit">Save</Button>
      </form>
    </ViewportOverlay>
  );
}
