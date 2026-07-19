import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              name={field.name}
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
      <Button type="submit">Submit</Button>
    </form>
  );
}
