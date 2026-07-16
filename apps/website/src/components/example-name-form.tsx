import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const exampleNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export function ExampleNameForm() {
  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: exampleNameSchema,
    },
    onSubmit: async () => {
      // Scaffold example — product submit handling comes later.
    },
  });

  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor={field.name}>
              Name
            </label>
            <input
              id={field.name}
              name={field.name}
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
      <Button type="submit">Submit</Button>
    </form>
  );
}
