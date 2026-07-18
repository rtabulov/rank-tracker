import { expect, test } from "vite-plus/test";
import {
  buildIssueCloseComment,
  decideAfterClaim,
  decideAfterImplement,
  decideAfterPicker,
  decideFailureCleanup,
  evaluateHostGate,
  parsePickerSelection,
} from "./orchestration.ts";

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

test("valid pick proceeds with issue number only", () => {
  expect(
    decideAfterPicker({
      attempt: 1,
      kind: "picked",
      issueNumber: 31,
    }),
  ).toEqual({
    action: "proceed",
    issueNumber: 31,
  });
});

test("claim conflict re-picks once then stops", () => {
  expect(
    decideAfterClaim({
      claimAttempt: 1,
      outcome: "already-assigned",
      issueNumber: 31,
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
    }),
  ).toEqual({
    action: "proceed",
    issueNumber: 31,
  });
});

test("host gate requires clean main that is latest", () => {
  expect(
    evaluateHostGate({
      currentBranch: "main",
      isDirty: false,
      isLatest: true,
    }),
  ).toEqual({ ok: true });

  expect(
    evaluateHostGate({
      currentBranch: "feature",
      isDirty: false,
      isLatest: true,
    }),
  ).toEqual({ ok: false, reason: "not-main", detail: "feature" });

  expect(
    evaluateHostGate({
      currentBranch: "main",
      isDirty: true,
      isLatest: true,
    }),
  ).toEqual({ ok: false, reason: "dirty" });

  expect(
    evaluateHostGate({
      currentBranch: "main",
      isDirty: false,
      isLatest: false,
      detail: "diverged",
    }),
  ).toEqual({ ok: false, reason: "not-latest", detail: "diverged" });
});

test("implement with commits publishes; empty work stops", () => {
  expect(decideAfterImplement({ commitCount: 2 })).toEqual({ action: "publish" });
  expect(decideAfterImplement({ commitCount: 0 })).toEqual({
    action: "stop",
    reason: "no-commits",
  });
});

test("failure cleanup unclaims and drops temp branches before publish", () => {
  expect(decideFailureCleanup("implement")).toEqual({
    unclaim: true,
    deleteImplementerBranches: true,
  });
  expect(decideFailureCleanup("no-commits")).toEqual({
    unclaim: true,
    deleteImplementerBranches: true,
  });
  expect(decideFailureCleanup("push")).toEqual({
    unclaim: false,
    deleteImplementerBranches: false,
  });
  expect(decideFailureCleanup("close")).toEqual({
    unclaim: false,
    deleteImplementerBranches: false,
  });
});

test("issue close comment references the issue", () => {
  expect(buildIssueCloseComment(31)).toContain("#31");
});

test("picker schema accepts picked shape and empty backlog", () => {
  expect(parsePickerSelection({ issueNumber: 31 })).toEqual({
    kind: "picked",
    issueNumber: 31,
  });
  expect(parsePickerSelection({ empty: true })).toEqual({ kind: "empty" });
});

test("picker schema rejects invalid structured output", () => {
  expect(parsePickerSelection({ issueNumber: 0 }).kind).toBe("invalid");
  expect(parsePickerSelection({ branchSlug: "log-rs" }).kind).toBe("invalid");
  expect(parsePickerSelection({ issueNumber: 31, branchSlug: "log-rs" }).kind).toBe("invalid");
  expect(parsePickerSelection(null).kind).toBe("invalid");
});
