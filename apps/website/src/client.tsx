import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { Await } from "@tanstack/react-router";
import { hydrateStart } from "@tanstack/react-start/client";
import { AppProviders } from "@/app-providers";
import { RouterWithAppContext } from "@/components/router-with-app-context";

let hydrationPromise: ReturnType<typeof hydrateStart> | undefined;

function StartClientWithAppContext() {
  if (!hydrationPromise) {
    hydrationPromise = hydrateStart();
  }

  return (
    <Await promise={hydrationPromise}>{(router) => <RouterWithAppContext router={router} />}</Await>
  );
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <AppProviders>
        <StartClientWithAppContext />
      </AppProviders>
    </StrictMode>,
  );
});
