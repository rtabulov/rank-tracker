import type { CompanionProposal } from "./contract.ts";

export type ProposalStore = {
  set: (proposal: CompanionProposal) => void;
  get: () => CompanionProposal | null;
  clear: () => void;
};

/** Latest-only RS proposal slot; new capture overwrites pending. */
export function createProposalStore(initial: CompanionProposal | null = null): ProposalStore {
  let slot = initial;

  return {
    set(proposal) {
      slot = proposal;
    },
    get() {
      return slot;
    },
    clear() {
      slot = null;
    },
  };
}
