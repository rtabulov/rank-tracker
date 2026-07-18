// Sequential Sandcastle — pick → implement (/implement) → push main → close issue
//
// Phase 0 (Pick):    Host agent (no sandbox, head) chooses the next Sandcastle
//                    issue. Orchestrator validates and claims.
// Phase 1 (Implement): One agent run on merge-to-head follows /implement
//                      (TDD + /code-review + commit). Does not push or close.
// Publish:           Host pushes origin/main and closes the issue.
//
// Usage:
//   vp run sandcastle
//   # or: vp exec tsx .sandcastle/main.ts

import { execFileSync } from "node:child_process";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";
import {
  buildIssueCloseComment,
  decideAfterClaim,
  decideAfterImplement,
  decideAfterPicker,
  decideFailureCleanup,
  evaluateHostGate,
  interpretPickerSelection,
  pickerSelectionSchema,
  type FailureKind,
  type HostGate,
  type OrchestratorDecision,
} from "./orchestration.ts";

const IMPLEMENTER_BRANCH_PREFIX = "sandcastle/implementer/";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 10;
const AGENT_MODEL = "composer-latest";

// pnpm refuses to purge a copied node_modules without a TTY unless CI=true
// (ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY). Full install can exceed the
// default 60s hook timeout on a cold cache.
const hooks = {
  sandbox: {
    onSandboxReady: [{ command: "vp install", timeoutMs: 300_000 }],
  },
};

const copyToWorktree = ["node_modules"];

const dockerSandbox = docker({ env: { CI: "true" } });

// ---------------------------------------------------------------------------
// Host helpers (impure)
// ---------------------------------------------------------------------------

function logStop(
  decision: Extract<OrchestratorDecision, { action: "stop" }> | Extract<HostGate, { ok: false }>,
) {
  const extra = decision.detail ? ` (${decision.detail})` : "";
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

function unclaimIssue(issueNumber: number) {
  const me = currentGithubLogin();
  const raw = execFileSync("gh", ["issue", "view", String(issueNumber), "--json", "assignees"], {
    encoding: "utf8",
  });
  const parsed = JSON.parse(raw) as { assignees: { login: string }[] };
  if (!parsed.assignees.some((a) => a.login === me)) {
    return;
  }
  execFileSync("gh", ["issue", "edit", String(issueNumber), "--remove-assignee", "@me"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function listRefNames(args: string[]): string[] {
  const out = execFileSync("git", ["for-each-ref", "--format=%(refname:short)", ...args], {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function listLocalImplementerBranches(): string[] {
  return listRefNames([`refs/heads/${IMPLEMENTER_BRANCH_PREFIX}`]);
}

function listRemoteImplementerBranches(): string[] {
  // Ask the remote directly so stale fetch refs don't hide leftovers.
  const out = execFileSync(
    "git",
    ["ls-remote", "--heads", "origin", `${IMPLEMENTER_BRANCH_PREFIX}*`],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const ref = line.split("\t")[1] ?? "";
      return ref.replace(/^refs\/heads\//, "");
    })
    .filter((branch) => branch.startsWith(IMPLEMENTER_BRANCH_PREFIX));
}

function deleteImplementerBranches() {
  for (const branch of listLocalImplementerBranches()) {
    try {
      execFileSync("git", ["branch", "-D", branch], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      console.log(`Deleted leftover local branch ${branch}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.log(`Could not delete local ${branch}: ${detail}`);
    }
  }

  const remoteBranches = listRemoteImplementerBranches();
  if (remoteBranches.length === 0) {
    return;
  }
  try {
    execFileSync("git", ["push", "origin", "--delete", ...remoteBranches], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    for (const branch of remoteBranches) {
      console.log(`Deleted leftover remote branch origin/${branch}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(`Could not delete remote implementer branches: ${detail}`);
  }
}

function cleanupAfterFailure(issueNumber: number, kind: FailureKind) {
  const plan = decideFailureCleanup(kind);
  if (plan.unclaim) {
    try {
      unclaimIssue(issueNumber);
      console.log(`Unclaimed #${issueNumber}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.log(`Could not unclaim #${issueNumber}: ${detail}`);
    }
  }
  if (plan.deleteImplementerBranches) {
    deleteImplementerBranches();
  }
}

function ensureMainReady(): HostGate {
  const currentBranch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
  const isDirty =
    execFileSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
    }).trim().length > 0;

  const beforePull = evaluateHostGate({
    currentBranch,
    isDirty,
    isLatest: true,
  });
  if (!beforePull.ok) {
    return beforePull;
  }

  try {
    execFileSync("git", ["pull", "--ff-only", "origin", "main"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "git pull --ff-only failed";
    return evaluateHostGate({
      currentBranch,
      isDirty: false,
      isLatest: false,
      detail,
    });
  }

  return { ok: true };
}

function pushMain() {
  execFileSync("git", ["push", "origin", "main"], {
    stdio: "inherit",
  });
}

function closeIssue(issueNumber: number) {
  execFileSync(
    "gh",
    ["issue", "close", String(issueNumber), "--comment", buildIssueCloseComment(issueNumber)],
    { stdio: "inherit" },
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

async function selectClaimedIssue(): Promise<
  { ok: true; issueNumber: number } | { ok: false; reason: string }
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

    const { issueNumber } = pickDecision;
    console.log(`Picked #${issueNumber}`);

    const claimOutcome = claimIssue(issueNumber);
    const claimDecision = decideAfterClaim({
      claimAttempt,
      outcome: claimOutcome,
      issueNumber,
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
    };
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

const hostGate = ensureMainReady();
if (!hostGate.ok) {
  logStop(hostGate);
  console.log("\nAll done.");
  process.exitCode = 1;
} else {
  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

    if (iteration > 1) {
      const again = ensureMainReady();
      if (!again.ok) {
        logStop(again);
        break;
      }
    }

    const selected = await selectClaimedIssue();
    if (!selected.ok) {
      break;
    }

    const { issueNumber } = selected;

    try {
      const implement = await sandcastle.run({
        name: "implementer",
        maxIterations: 1,
        agent: sandcastle.cursor(AGENT_MODEL),
        sandbox: dockerSandbox,
        branchStrategy: { type: "merge-to-head" },
        hooks,
        copyToWorktree,
        promptFile: "./.sandcastle/implement-prompt.md",
        promptArgs: {
          ISSUE_NUMBER: issueNumber,
        },
        completionSignal: "<promise>COMPLETE</promise>",
      });

      const afterImplement = decideAfterImplement({
        commitCount: implement.commits.length,
      });
      if (afterImplement.action === "stop") {
        console.log("Implementation agent made no commits. Stopping (empty or blocked work).");
        cleanupAfterFailure(issueNumber, "no-commits");
        break;
      }

      console.log(`\nImplementation complete on main (${implement.commits.length} commit(s)).`);
      console.log("Pushing origin/main…");
      try {
        pushMain();
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.log(`Stopping: push failed (${detail})`);
        cleanupAfterFailure(issueNumber, "push");
        break;
      }

      console.log(`Closing #${issueNumber}…`);
      try {
        closeIssue(issueNumber);
        console.log(`Closed #${issueNumber}.`);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.log(`Stopping: push succeeded but close failed (${detail})`);
        cleanupAfterFailure(issueNumber, "close");
        break;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.log(`Stopping: implement or merge failed (${detail})`);
      cleanupAfterFailure(issueNumber, "implement");
      break;
    }
  }

  console.log("\nAll done.");
}
