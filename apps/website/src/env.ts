import { createAppEnv } from "./create-app-env.ts";

export const env = createAppEnv(import.meta.env, {
  skipValidation: import.meta.env.MODE === "test",
});
