import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { AppProviders } from "@/app-providers";
import "@/index.css";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <AppProviders>
        <StartClient />
      </AppProviders>
    </StrictMode>,
  );
});
