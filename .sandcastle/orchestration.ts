export type PickerKind =
  | { kind: "empty" }
  | { kind: "invalid"; detail: string }
  | { kind: "picked"; issueNumber: number };

export type OrchestratorDecision =
  | { action: "proceed"; issueNumber: number }
  | { action: "retry-picker"; reason: "bad-picker" | "claim-conflict"; detail?: string }
  | {
      action: "stop";
      reason: "empty-backlog" | "bad-picker" | "claim-conflict";
      detail?: string;
    };

export type ClaimOutcome = "claimed" | "already-assigned";

export type HostGate =
  | { ok: true }
  | { ok: false; reason: "not-main" | "dirty" | "not-latest"; detail?: string };

export type ImplementDecision = { action: "publish" } | { action: "stop"; reason: "no-commits" };

/** Where the iteration failed — drives host cleanup. */
export type FailureKind = "implement" | "no-commits" | "push" | "close";

export type FailureCleanup = {
  unclaim: boolean;
  deleteImplementerBranches: boolean;
};

function badPickerDecision(attempt: 1 | 2, detail: string): OrchestratorDecision {
  if (attempt === 1) {
    return { action: "retry-picker", reason: "bad-picker", detail };
  }
  return { action: "stop", reason: "bad-picker", detail };
}

export function decideAfterPicker(input: PickerKind & { attempt: 1 | 2 }): OrchestratorDecision {
  if (input.kind === "empty") {
    return { action: "stop", reason: "empty-backlog" };
  }
  if (input.kind === "invalid") {
    return badPickerDecision(input.attempt, input.detail);
  }
  return {
    action: "proceed",
    issueNumber: input.issueNumber,
  };
}

export function decideAfterClaim(input: {
  claimAttempt: 1 | 2;
  outcome: ClaimOutcome;
  issueNumber: number;
}): OrchestratorDecision {
  if (input.outcome === "already-assigned") {
    if (input.claimAttempt === 1) {
      return { action: "retry-picker", reason: "claim-conflict" };
    }
    return { action: "stop", reason: "claim-conflict" };
  }
  return {
    action: "proceed",
    issueNumber: input.issueNumber,
  };
}

/** Host must be on clean `main` that successfully fast-forwarded to `origin/main`. */
export function evaluateHostGate(input: {
  currentBranch: string;
  isDirty: boolean;
  isLatest: boolean;
  detail?: string;
}): HostGate {
  if (input.currentBranch !== "main") {
    return { ok: false, reason: "not-main", detail: input.currentBranch };
  }
  if (input.isDirty) {
    return { ok: false, reason: "dirty" };
  }
  if (!input.isLatest) {
    return { ok: false, reason: "not-latest", detail: input.detail };
  }
  return { ok: true };
}

export function decideAfterImplement(input: { commitCount: number }): ImplementDecision {
  if (input.commitCount < 1) {
    return { action: "stop", reason: "no-commits" };
  }
  return { action: "publish" };
}

/**
 * Pre-publish failures should free the issue and drop merge-to-head temp branches
 * (local and origin). After a successful push, leave the claim so a human can
 * finish close / inspect main.
 */
export function decideFailureCleanup(kind: FailureKind): FailureCleanup {
  if (kind === "push" || kind === "close") {
    return { unclaim: false, deleteImplementerBranches: false };
  }
  return { unclaim: true, deleteImplementerBranches: true };
}

export function buildIssueCloseComment(issueNumber: number): string {
  return `Sandcastle landed #${issueNumber} on main.`;
}

/** Picked shape from the spec; `{ empty: true }` for an empty backlog. */
export type PickerSelection = { empty: true } | { issueNumber: number };

/** Standard Schema for picker structured output (`Output.object`). */
export const pickerSelectionSchema: {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types: { readonly input: unknown; readonly output: PickerSelection };
    readonly validate: (
      value: unknown,
    ) => { value: PickerSelection } | { issues: ReadonlyArray<{ message: string }> };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "rank-tracker-sandcastle",
    types: {
      input: 0 as unknown,
      output: { empty: true },
    },
    validate(value: unknown) {
      if (typeof value !== "object" || value === null) {
        return { issues: [{ message: "expected object" }] };
      }
      const record = value as Record<string, unknown>;
      if ("branchSlug" in record) {
        return { issues: [{ message: "branchSlug is not allowed" }] };
      }
      if (record.empty === true) {
        return { value: { empty: true } };
      }
      const { issueNumber } = record;
      if (typeof issueNumber !== "number" || !Number.isInteger(issueNumber) || issueNumber < 1) {
        return {
          issues: [{ message: "issueNumber must be a positive integer" }],
        };
      }
      return { value: { issueNumber } };
    },
  },
};

export function interpretPickerSelection(selection: PickerSelection): PickerKind {
  if ("empty" in selection && selection.empty) {
    return { kind: "empty" };
  }
  if (!("issueNumber" in selection)) {
    return { kind: "invalid", detail: "picker selection missing issueNumber" };
  }
  return {
    kind: "picked",
    issueNumber: selection.issueNumber,
  };
}

/** Validate raw JSON (e.g. after `Output.object`) through the picker schema. */
export function parsePickerSelection(value: unknown): PickerKind {
  const result = pickerSelectionSchema["~standard"].validate(value);
  if ("issues" in result) {
    const detail = result.issues.map((issue) => issue.message).join("; ");
    return { kind: "invalid", detail: detail || "invalid picker selection" };
  }
  return interpretPickerSelection(result.value);
}
