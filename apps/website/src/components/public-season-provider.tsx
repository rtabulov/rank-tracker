import { createContext, useContext, type ReactNode } from "react";
import type { PublicSeasonClient } from "@/lib/public-season";

const PublicSeasonContext = createContext<PublicSeasonClient | null>(null);

export function PublicSeasonProvider({
  children,
  publicSeasonClient,
}: {
  children: ReactNode;
  publicSeasonClient: PublicSeasonClient;
}) {
  return (
    <PublicSeasonContext.Provider value={publicSeasonClient}>
      {children}
    </PublicSeasonContext.Provider>
  );
}

export function usePublicSeasonClient(): PublicSeasonClient {
  const client = useContext(PublicSeasonContext);
  if (client === null) {
    throw new Error("usePublicSeasonClient must be used within PublicSeasonProvider");
  }
  return client;
}
