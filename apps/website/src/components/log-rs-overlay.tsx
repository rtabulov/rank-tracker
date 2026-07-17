import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";
import { createEntry } from "@/lib/entries";
import { entryRsFormSchema } from "@/lib/entry-form-schema";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { getSeasonForTimestamp } from "@/lib/seasons";
import type { Entry } from "@/lib/types";

type LogRsOverlayProps = {
  open: boolean;
  seasonNumber: number;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
};

export function LogRsOverlay({ open, seasonNumber, onClose, onSaved }: LogRsOverlayProps) {
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
      const derivedSeason = getSeasonForTimestamp(recordedAt);
      if (derivedSeason === null || derivedSeason.number !== seasonNumber) {
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

        <Button type="submit">Save</Button>
      </form>
    </ViewportOverlay>
  );
}
