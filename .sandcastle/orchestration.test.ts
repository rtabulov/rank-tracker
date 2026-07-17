import { expect, test } from "vite-plus/test";
import {
  buildBranchName,
  buildDraftPrMetadata,
  decideAfterBranchCheck,
  decideAfterClaim,
  decideAfterPicker,
  parsePickerSelection,
  validateBranchSlug,
} from "./orchestration.ts";

test("accepts kebab-case branch slug", () => {
  expect(validateBranchSlug("log-rs-current-season", 31)).toEqual({
    ok: true,
    slug: "log-rs-current-season",
  });
});

test("rejects empty slug", () => {
  expect(validateBranchSlug("", 31).ok).toBe(false);
  expect(validateBranchSlug("   ", 31).ok).toBe(false);
});

test("rejects reserved slugs", () => {
  for (const slug of ["main", "master", "head"]) {
    expect(validateBranchSlug(slug, 31).ok).toBe(false);
  }
});

test("rejects Conventional Commit type-prefix slugs", () => {
  expect(validateBranchSlug("feat-log-rs", 31).ok).toBe(false);
  expect(validateBranchSlug("fix-edit-entry", 32).ok).toBe(false);
  expect(validateBranchSlug("chore-cleanup", 1).ok).toBe(false);
});

test("rejects slug that already contains the issue number", () => {
  expect(validateBranchSlug("log-rs-31", 31).ok).toBe(false);
  expect(validateBranchSlug("31-log-rs", 31).ok).toBe(false);
  expect(validateBranchSlug("log-31-rs", 31).ok).toBe(false);
  expect(validateBranchSlug("31", 31).ok).toBe(false);
});

test("rejects non-kebab-case slugs", () => {
  expect(validateBranchSlug("Log-RS", 31).ok).toBe(false);
  expect(validateBranchSlug("log_rs", 31).ok).toBe(false);
  expect(validateBranchSlug("-log-rs", 31).ok).toBe(false);
  expect(validateBranchSlug("log-rs-", 31).ok).toBe(false);
});

test("builds sandcastle/<slug>-<N> branch name", () => {
  expect(buildBranchName("log-rs", 31)).toBe("sandcastle/log-rs-31");
});

test("truncates long slug to keep full branch name at most 60 chars", () => {
  const longSlug = "very-long-descriptive-slug-that-would-exceed-the-branch-name-limit";
  const branch = buildBranchName(longSlug, 31);
  expect(branch.length).toBeLessThanOrEqual(60);
  expect(branch.startsWith("sandcastle/")).toBe(true);
  expect(branch.endsWith("-31")).toBe(true);
  expect(branch).toBe("sandcastle/very-long-descriptive-slug-that-would-exceed-t-31");
});

test("empty backlog stops with no retry", () => {
  expect(decideAfterPicker({ attempt: 1, kind: "empty" })).toEqual({
    action: "stop",
    reason: "empty-backlog",
  });
});

test("invalid picker output retries once then stops", () => {
  expect(decideAfterPicker({ attempt: 1, kind: "invalid", detail: "bad schema" })).toEqual({
    action: "retry-picker",
    reason: "bad-picker",
    detail: "bad schema",
  });
  expect(decideAfterPicker({ attempt: 2, kind: "invalid", detail: "still bad" })).toEqual({
    action: "stop",
    reason: "bad-picker",
    detail: "still bad",
  });
});

test("invalid slug retries once then stops", () => {
  const first = decideAfterPicker({
    attempt: 1,
    kind: "picked",
    issueNumber: 31,
    branchSlug: "feat-log-rs",
  });
  expect(first.action).toBe("retry-picker");
  expect(first).toMatchObject({ reason: "bad-picker" });
  if (first.action === "retry-picker") {
    expect(first.detail).toContain("type-prefix");
  }
  expect(
    decideAfterPicker({
      attempt: 2,
      kind: "picked",
      issueNumber: 31,
      branchSlug: "feat-log-rs",
    }).action,
  ).toBe("stop");
});

test("valid pick proceeds with named branch", () => {
  expect(
    decideAfterPicker({
      attempt: 1,
      kind: "picked",
      issueNumber: 31,
      branchSlug: "log-rs",
    }),
  ).toEqual({
    action: "proceed",
    issueNumber: 31,
    branch: "sandcastle/log-rs-31",
  });
});

test("claim conflict re-picks once then stops", () => {
  expect(
    decideAfterClaim({
      claimAttempt: 1,
      outcome: "already-assigned",
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }),
  ).toEqual({
    action: "retry-picker",
    reason: "claim-conflict",
  });
  expect(
    decideAfterClaim({
      claimAttempt: 2,
      outcome: "already-assigned",
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }),
  ).toEqual({
    action: "stop",
    reason: "claim-conflict",
  });
});

test("successful claim proceeds", () => {
  expect(
    decideAfterClaim({
      claimAttempt: 1,
      outcome: "claimed",
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }),
  ).toEqual({
    action: "proceed",
    issueNumber: 31,
    branch: "sandcastle/log-rs-31",
  });
});

test("existing branch stops without delete", () => {
  expect(
    decideAfterBranchCheck({
      existsLocally: true,
      existsRemotely: false,
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }),
  ).toEqual({
    action: "stop",
    reason: "branch-exists",
    branch: "sandcastle/log-rs-31",
  });
  expect(
    decideAfterBranchCheck({
      existsLocally: false,
      existsRemotely: true,
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }).action,
  ).toBe("stop");
});

test("missing branch proceeds", () => {
  expect(
    decideAfterBranchCheck({
      existsLocally: false,
      existsRemotely: false,
      issueNumber: 31,
      branch: "sandcastle/log-rs-31",
    }),
  ).toEqual({
    action: "proceed",
    issueNumber: 31,
    branch: "sandcastle/log-rs-31",
  });
});

test("draft PR metadata uses issue title and Closes footer", () => {
  expect(
    buildDraftPrMetadata({
      issueNumber: 31,
      issueTitle: "Log RS on Current Season",
    }),
  ).toEqual({
    title: "Log RS on Current Season",
    body: ["## Summary", "", "Sandcastle implementation for #31.", "", "Closes #31", ""].join("\n"),
  });
});

test("picker schema accepts picked shape and empty backlog", () => {
  expect(parsePickerSelection({ issueNumber: 31, branchSlug: "log-rs" })).toEqual({
    kind: "picked",
    issueNumber: 31,
    branchSlug: "log-rs",
  });
  expect(parsePickerSelection({ empty: true })).toEqual({ kind: "empty" });
});

test("picker schema rejects invalid structured output", () => {
  expect(parsePickerSelection({ issueNumber: 0, branchSlug: "log-rs" }).kind).toBe("invalid");
  expect(parsePickerSelection({ issueNumber: 31 }).kind).toBe("invalid");
  expect(parsePickerSelection(null).kind).toBe("invalid");
});
