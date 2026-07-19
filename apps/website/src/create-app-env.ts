import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export function createAppEnv(
  runtimeEnv: Record<string, string | undefined>,
  options?: { skipValidation?: boolean },
) {
  return createEnv({
    clientPrefix: "VITE_",
    client: {
      VITE_SUPABASE_URL: z.url(),
      VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    },
    runtimeEnvStrict: {
      VITE_SUPABASE_URL: runtimeEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    emptyStringAsUndefined: true,
    skipValidation: options?.skipValidation ?? false,
  });
}
