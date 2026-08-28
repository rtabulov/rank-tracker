import { createContext, useContext, type ReactNode } from "react";
import {
  createFetchCompanionProposalClient,
  createMemoryCompanionProposalClient,
  type CompanionProposalClient,
} from "companion-bridge";

const CompanionProposalContext = createContext<CompanionProposalClient | null>(null);

export function CompanionProposalProvider({
  children,
  companionProposalClient,
}: {
  children: ReactNode;
  companionProposalClient: CompanionProposalClient;
}) {
  return (
    <CompanionProposalContext.Provider value={companionProposalClient}>
      {children}
    </CompanionProposalContext.Provider>
  );
}

export function useCompanionProposalClient(): CompanionProposalClient {
  const client = useContext(CompanionProposalContext);
  if (client === null) {
    throw new Error("useCompanionProposalClient must be used within CompanionProposalProvider");
  }
  return client;
}

export function useOptionalCompanionProposalClient(): CompanionProposalClient | null {
  return useContext(CompanionProposalContext);
}

export function createDefaultCompanionProposalClient(): CompanionProposalClient {
  if (import.meta.env.MODE === "test") {
    return createMemoryCompanionProposalClient();
  }
  return createFetchCompanionProposalClient();
}
