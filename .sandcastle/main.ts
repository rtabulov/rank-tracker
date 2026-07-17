// Sequential Reviewer — pick → implement → review → draft PR
//
// Phase 0 (Pick):    Host agent (no sandbox, head) chooses the next Sandcastle
//                    issue + branch slug. Orchestrator validates, claims, and
//                    builds sandcastle/<slug>-<N>.
// Phase 1 (Implement): Agent implements the pinned issue on that named branch.
//                      Does not close the issue.
// Phase 2 (Review):  Second agent reviews Standards + Spec on the same branch.
// Publish:           Host pushes the branch and opens a draft PR (Closes #N).
//
// Usage:
//   vp run sandcastle
//   # or: vp exec tsx .sandcastle/main.ts

import { execFileSync } from "node:child_process";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";
import {
  buildDraftPrMetadata,
  decideAfterBranchCheck,
  decideAfterClaim,
  decideAfterPicker,
  interpretPickerSelection,
  pickerSelectionSchema,
  type OrchestratorDecision,
} from "./orchestration.ts";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 10;
const AGENT_MODEL = "composer-latest";

const hooks = {
  sandbox: { onSandboxReady: [{ command: "vp install" }] },
};

const copyToWorktree = ["node_modules"];

// ---------------------------------------------------------------------------
// Host helpers (impure)
// ---------------------------------------------------------------------------

function logStop(decision: Extract<OrchestratorDecision, { action: "stop" }>) {
  const extra = decision.detail
    ? ` (${decision.detail})`
    : decision.branch
      ? ` (${decision.branch})`
      : "";
  console.log(`Stopping: ${decision.reason}${extra}`);
}

function currentGithubLogin(): string {
  return execFileSync("gh", ["api", "user", "--jq", ".login"], {
    encoding: "utf8",
  }).trim();
}

function claimIssue(issueNumber: number): "claimed" | "already-assigned" {
  const me = currentGithubLogin();
  const raw = execFileSync("gh", ["issue", "view", String(issueNumber), "--json", "assignees"], {
    encoding: "utf8",
  });
  const parsed = JSON.parse(raw) as { assignees: { login: string }[] };
  const assignees = parsed.assignees.map((a) => a.login);
  if (assignees.some((login) => login !== me)) {
    return "already-assigned";
  }
  if (!assignees.includes(me)) {
    execFileSync("gh", ["issue", "edit", String(issueNumber), "--add-assignee", "@me"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  return "claimed";
}

function branchExists(branch: string): {
  existsLocally: boolean;
  existsRemotely: boolean;
} {
  let existsLocally = false;
  try {
    execFileSync("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], {
      stdio: "ignore",
    });
    existsLocally = true;
  } catch {
    existsLocally = false;
  }

  let existsRemotely = false;
  try {
    const out = execFileSync("git", ["ls-remote", "--heads", "origin", branch], {
      encoding: "utf8",
    });
    existsRemotely = out.trim().length > 0;
  } catch {
    existsRemotely = false;
  }

  return { existsLocally, existsRemotely };
}

function fetchIssueTitle(issueNumber: number): string {
  const raw = execFileSync("gh", ["issue", "view", String(issueNumber), "--json", "title"], {
    encoding: "utf8",
  });
  return (JSON.parse(raw) as { title: string }).title;
}

function publishDraftPr(input: {
  branch: string;
  worktreePath: string;
  issueNumber: number;
  issueTitle: string;
}) {
  const meta = buildDraftPrMetadata({
    issueNumber: input.issueNumber,
    issueTitle: input.issueTitle,
  });

  execFileSync("git", ["push", "-u", "origin", input.branch], {
    cwd: input.worktreePath,
    stdio: "inherit",
  });

  execFileSync(
    "gh",
    ["pr", "create", "--draft", "--title", meta.title, "--body", meta.body, "--head", input.branch],
    { cwd: input.worktreePath, stdio: "inherit" },
  );
}

async function pickIssue(attempt: 1 | 2): Promise<OrchestratorDecision> {
  try {
    const result = await sandcastle.run({
      name: `picker-${attempt}`,
      maxIterations: 1,
      agent: sandcastle.cursor(AGENT_MODEL),
      sandbox: noSandbox(),
      branchStrategy: { type: "head" },
      promptFile: "./.sandcastle/pick-prompt.md",
      output: sandcastle.Output.object({
        tag: "pick",
        schema: pickerSelectionSchema,
      }),
      completionSignal: "<promise>COMPLETE</promise>",
    });

    const kind = interpretPickerSelection(result.output);
    return decideAfterPicker({ attempt, ...kind });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "picker failed without details";
    return decideAfterPicker({
      attempt,
      kind: "invalid",
      detail,
    });
  }
}

async function selectClaimedBranch(): Promise<
  | { ok: true; issueNumber: number; branch: string; issueTitle: string }
  | { ok: false; reason: string }
> {
  let pickAttempt: 1 | 2 = 1;
  let claimAttempt: 1 | 2 = 1;

  while (true) {
    const pickDecision = await pickIssue(pickAttempt);
    if (pickDecision.action === "stop") {
      logStop(pickDecision);
      return { ok: false, reason: pickDecision.reason };
    }
    if (pickDecision.action === "retry-picker") {
      if (pickAttempt === 2) {
        logStop({
          action: "stop",
          reason: pickDecision.reason,
          detail: pickDecision.detail,
        });
        return { ok: false, reason: pickDecision.reason };
      }
      console.log(
        `Picker retry (${pickDecision.reason}${pickDecision.detail ? `: ${pickDecision.detail}` : ""})`,
      );
      pickAttempt = 2;
      continue;
    }

    const { issueNumber, branch } = pickDecision;
    console.log(`Picked #${issueNumber} → ${branch}`);

    // Check branch existence before claiming so a stop does not leave a stale assignee.
    const existence = branchExists(branch);
    const branchDecision = decideAfterBranchCheck({
      ...existence,
      issueNumber,
      branch,
    });
    if (branchDecision.action === "stop") {
      logStop(branchDecision);
      return { ok: false, reason: branchDecision.reason };
    }

    const claimOutcome = claimIssue(issueNumber);
    const claimDecision = decideAfterClaim({
      claimAttempt,
      outcome: claimOutcome,
      issueNumber,
      branch,
    });

    if (claimDecision.action === "retry-picker") {
      console.log("Claim conflict — re-picking once.");
      claimAttempt = 2;
      pickAttempt = 1;
      continue;
    }
    if (claimDecision.action === "stop") {
      logStop(claimDecision);
      return { ok: false, reason: claimDecision.reason };
    }

    return {
      ok: true,
      issueNumber,
      branch,
      issueTitle: fetchIssueTitle(issueNumber),
    };
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

  const selected = await selectClaimedBranch();
  if (!selected.ok) {
    break;
  }

  const { issueNumber, branch, issueTitle } = selected;
  const sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: docker(),
    hooks,
    copyToWorktree,
  });

  try {
    const implement = await sandbox.run({
      name: "implementer",
      maxIterations: 1,
      agent: sandcastle.cursor(AGENT_MODEL),
      promptFile: "./.sandcastle/implement-prompt.md",
      promptArgs: {
        ISSUE_NUMBER: issueNumber,
      },
    });

    if (!implement.commits.length) {
      console.log("Implementation agent made no commits. Stopping (empty or blocked work).");
      break;
    }

    console.log(`\nImplementation complete on branch: ${branch}`);
    console.log(`Commits: ${implement.commits.length}`);

    await sandbox.run({
      name: "reviewer",
      maxIterations: 1,
      agent: sandcastle.cursor(AGENT_MODEL),
      promptFile: "./.sandcastle/review-prompt.md",
      promptArgs: {
        BRANCH: branch,
      },
    });

    console.log("\nReview complete. Publishing draft PR…");
    publishDraftPr({
      branch,
      worktreePath: sandbox.worktreePath,
      issueNumber,
      issueTitle,
    });
    console.log(`Draft PR opened for #${issueNumber} (${branch}).`);
  } finally {
    await sandbox.close();
  }
}

console.log("\nAll done.");
