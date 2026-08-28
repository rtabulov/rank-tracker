import { useEffect, useRef, useState } from "react";
import type { CompanionProposalClient } from "companion-bridge";

const POLL_INTERVAL_MS = 3_000;

type UseCompanionProposalPrefillResult = {
  prefillRs: number | undefined;
  onProposalDismissed: () => void;
  onProposalSaved: () => Promise<void>;
};

/**
 * Polls the companion loopback for the latest RS proposal and surfaces it for Log RS prefill.
 * Dismiss without save keeps the server proposal but suppresses auto-reopen for that capture.
 */
export function useCompanionProposalPrefill(
  client: CompanionProposalClient | null,
  enabled: boolean,
): UseCompanionProposalPrefillResult {
  const [prefillRs, setPrefillRs] = useState<number | undefined>(undefined);
  const lastSeenCapturedAtRef = useRef<string | null>(null);
  const dismissedCapturedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || client === null) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const proposal = await client.getProposal();
      if (cancelled || proposal === null) {
        return;
      }
      if (proposal.capturedAt === lastSeenCapturedAtRef.current) {
        return;
      }
      if (proposal.capturedAt === dismissedCapturedAtRef.current) {
        return;
      }
      lastSeenCapturedAtRef.current = proposal.capturedAt;
      setPrefillRs(proposal.rs);
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [client, enabled]);

  return {
    prefillRs,
    onProposalDismissed: () => {
      if (lastSeenCapturedAtRef.current !== null) {
        dismissedCapturedAtRef.current = lastSeenCapturedAtRef.current;
      }
      setPrefillRs(undefined);
    },
    onProposalSaved: async () => {
      if (client !== null) {
        await client.clearProposal();
      }
      lastSeenCapturedAtRef.current = null;
      dismissedCapturedAtRef.current = null;
      setPrefillRs(undefined);
    },
  };
}
