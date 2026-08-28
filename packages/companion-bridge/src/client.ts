import {
  COMPANION_BRIDGE_BASE_URL,
  COMPANION_BRIDGE_ROUTES,
  type CompanionHealth,
  type CompanionProposal,
} from "./contract.ts";

export type CompanionProposalClient = {
  getHealth: () => Promise<CompanionHealth | null>;
  getProposal: () => Promise<CompanionProposal | null>;
  clearProposal: () => Promise<void>;
};

type MemoryClientState = {
  proposal: CompanionProposal | null;
  health: CompanionHealth | null;
};

export function createMemoryCompanionProposalClient(
  initial: Partial<MemoryClientState> = {},
): CompanionProposalClient {
  const state: MemoryClientState = {
    proposal: initial.proposal ?? null,
    health: initial.health ?? null,
  };

  return {
    async getHealth() {
      return state.health;
    },
    async getProposal() {
      return state.proposal;
    },
    async clearProposal() {
      state.proposal = null;
    },
  };
}

export function createFetchCompanionProposalClient(
  baseUrl: string = COMPANION_BRIDGE_BASE_URL,
): CompanionProposalClient {
  function fetchOrigin(): string {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:5173";
  }

  async function bridgeFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (!headers.has("Origin")) {
      headers.set("Origin", fetchOrigin());
    }
    return fetch(`${baseUrl}${path}`, { ...init, headers });
  }

  return {
    async getHealth() {
      try {
        const response = await bridgeFetch(COMPANION_BRIDGE_ROUTES.health);
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as CompanionHealth;
      } catch {
        return null;
      }
    },
    async getProposal() {
      try {
        const response = await bridgeFetch(COMPANION_BRIDGE_ROUTES.proposal);
        if (response.status === 204) {
          return null;
        }
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as CompanionProposal;
      } catch {
        return null;
      }
    },
    async clearProposal() {
      try {
        await bridgeFetch(COMPANION_BRIDGE_ROUTES.clear, { method: "POST" });
      } catch {
        // Companion may already be gone; idempotent from the PWA side.
      }
    },
  };
}
