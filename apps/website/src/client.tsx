import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { AppProviders } from "@/app-providers";
import { RouterContextBridge } from "@/components/router-context-bridge";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <AppProviders>
        <RouterContextBridge>
          <StartClient />
        </RouterContextBridge>
      </AppProviders>
    </StrictMode>,
  );
});
