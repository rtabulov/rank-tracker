# Context

## Pinned issue

You are hard-pinned to issue **#{{ISSUE_NUMBER}}**. Do not pick a different issue. Fetch it with:

!`gh issue view {{ISSUE_NUMBER}} --comments`

If the issue references a parent PRD/spec, fetch that too.

## Skills (source of truth)

Follow these skills for the full build → review → commit flow:

@.agents/skills/implement/SKILL.md
@.agents/skills/tdd/SKILL.md
@.agents/skills/code-review/SKILL.md

Also respect project digests:

@.sandcastle/CODING_STANDARDS.md
@docs/agents/tdd.md
@docs/agents/client-state.md
@docs/agents/domain.md

# Task

Implement **#{{ISSUE_NUMBER}}** by following `/implement` (which drives `/tdd`, then `/code-review`, then commit).

## AFK overrides (Sandcastle)

These override HITL bits in the skills above:

1. **Seams** — Do **not** ask a human to confirm seams. Use the repo defaults from `docs/agents/tdd.md` (website app shell primary; `packages/utils` secondary) unless the **issue itself** names different seams.
2. **Fixed point for `/code-review`** — You are on Sandcastle's temp worktree branch. Review with `git diff {{TARGET_BRANCH}}...HEAD` before the host merges. Spec source is issue **#{{ISSUE_NUMBER}}**. Run both Standards and Spec axes in this session (parallel sub-agents optional).
3. **Do not push** to remotes. Do not open or merge PRs.
4. **Do not close** issue #{{ISSUE_NUMBER}}. The host orchestrator pushes `main` and closes it after this run.
5. **Commits** — Conventional Commits; include `#{{ISSUE_NUMBER}}` in the subject or body (e.g. `Refs #{{ISSUE_NUMBER}}`). Run `vp run ready` before committing.
6. If blocked (missing context, failing tests you cannot fix, external dependency), leave a comment on the issue and signal complete **without** committing empty work.

# Done

When the pinned issue is implemented and committed (or you are blocked), output:

<promise>COMPLETE</promise>
