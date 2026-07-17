const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["main", "master", "head"]);
const CONVENTIONAL_TYPE_PREFIXES = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
]);

const BRANCH_PREFIX = "sandcastle/";
const MAX_BRANCH_LENGTH = 60;

export type SlugValidation = { ok: true; slug: string } | { ok: false; reason: string };

export type PickerKind =
  | { kind: "empty" }
  | { kind: "invalid"; detail: string }
  | { kind: "picked"; issueNumber: number; branchSlug: string };

export type OrchestratorDecision =
  | { action: "proceed"; issueNumber: number; branch: string }
  | { action: "retry-picker"; reason: "bad-picker" | "claim-conflict"; detail?: string }
  | {
      action: "stop";
      reason: "empty-backlog" | "bad-picker" | "claim-conflict" | "branch-exists";
      detail?: string;
      branch?: string;
    };

export type ClaimOutcome = "claimed" | "already-assigned";

/** Validate a picker-provided branch slug for issue `issueNumber`. */
export function validateBranchSlug(rawSlug: string, issueNumber: number): SlugValidation {
  const slug = rawSlug.trim();
  if (slug.length === 0) {
    return { ok: false, reason: "empty slug" };
  }
  if (!KEBAB_CASE.test(slug)) {
    return { ok: false, reason: "slug must be kebab-case" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, reason: `reserved slug: ${slug}` };
  }
  const firstSegment = slug.split("-")[0] ?? slug;
  if (CONVENTIONAL_TYPE_PREFIXES.has(firstSegment)) {
    return {
      ok: false,
      reason: `slug looks like a Conventional Commit type-prefix: ${firstSegment}`,
    };
  }
  if (slugContainsIssueNumber(slug, issueNumber)) {
    return {
      ok: false,
      reason: `slug already contains issue number ${issueNumber}`,
    };
  }
  return { ok: true, slug };
}

function slugContainsIssueNumber(slug: string, issueNumber: number): boolean {
  const n = String(issueNumber);
  if (slug === n) return true;
  const segments = slug.split("-");
  return segments.includes(n);
}

/** Build `sandcastle/<slug>-<N>`, truncating the slug so the full name is ≤60. */
export function buildBranchName(slug: string, issueNumber: number): string {
  const suffix = `-${issueNumber}`;
  const maxSlugLength = MAX_BRANCH_LENGTH - BRANCH_PREFIX.length - suffix.length;
  const truncated = slug.slice(0, Math.max(0, maxSlugLength)).replace(/-+$/u, "");
  return `${BRANCH_PREFIX}${truncated}${suffix}`;
}

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

  const validated = validateBranchSlug(input.branchSlug, input.issueNumber);
  if (!validated.ok) {
    return badPickerDecision(input.attempt, validated.reason);
  }

  return {
    action: "proceed",
    issueNumber: input.issueNumber,
    branch: buildBranchName(validated.slug, input.issueNumber),
  };
}

export function decideAfterClaim(input: {
  claimAttempt: 1 | 2;
  outcome: ClaimOutcome;
  issueNumber: number;
  branch: string;
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
    branch: input.branch,
  };
}

export function decideAfterBranchCheck(input: {
  existsLocally: boolean;
  existsRemotely: boolean;
  issueNumber: number;
  branch: string;
}): OrchestratorDecision {
  if (input.existsLocally || input.existsRemotely) {
    return {
      action: "stop",
      reason: "branch-exists",
      branch: input.branch,
    };
  }
  return {
    action: "proceed",
    issueNumber: input.issueNumber,
    branch: input.branch,
  };
}

export function buildDraftPrMetadata(input: { issueNumber: number; issueTitle: string }): {
  title: string;
  body: string;
} {
  return {
    title: input.issueTitle,
    body: [
      "## Summary",
      "",
      `Sandcastle implementation for #${input.issueNumber}.`,
      "",
      `Closes #${input.issueNumber}`,
      "",
    ].join("\n"),
  };
}

/** Picked shape from the spec; `{ empty: true }` for an empty backlog. */
export type PickerSelection = { empty: true } | { issueNumber: number; branchSlug: string };

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
      if (record.empty === true) {
        return { value: { empty: true } };
      }
      const { issueNumber, branchSlug } = record;
      if (typeof issueNumber !== "number" || !Number.isInteger(issueNumber) || issueNumber < 1) {
        return {
          issues: [{ message: "issueNumber must be a positive integer" }],
        };
      }
      if (typeof branchSlug !== "string") {
        return { issues: [{ message: "branchSlug must be a string" }] };
      }
      return { value: { issueNumber, branchSlug } };
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
    branchSlug: selection.branchSlug,
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
