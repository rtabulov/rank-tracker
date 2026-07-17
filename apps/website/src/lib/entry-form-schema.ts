import { z } from "zod";

export const entryRsFormSchema = z.object({
  rs: z
    .string()
    .trim()
    .min(1, "RS is required")
    .refine((value) => /^\d+$/.test(value), "RS must be a whole number")
    .refine((value) => Number(value) >= 0, "RS must be 0 or greater"),
  recordedAtLocal: z.string().min(1, "Recorded at is required"),
});
