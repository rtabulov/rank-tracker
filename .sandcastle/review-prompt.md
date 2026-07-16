# TASK

Two-axis review of the code on branch `{{BRANCH}}` (diff against `{{TARGET_BRANCH}}`). Improve the branch when findings warrant it; preserve observable behavior unless a Spec finding requires a behavior fix that the issue already asked for.

# CONTEXT

## Branch diff

!`git diff {{TARGET_BRANCH}}...{{BRANCH}}`

## Commits on this branch

!`git log {{TARGET_BRANCH}}..{{BRANCH}} --oneline`

## Spec source

Issue numbers referenced in this branch's commits:

!`git log {{TARGET_BRANCH}}..{{BRANCH}} --format=%B | grep -oE '#[0-9]+' | sort -u`

Fetch the first (or only) issue with `gh issue view <N> --comments`. If no `#N` appears above, skip the Spec axis and note that in your summary.

## Project standards

@.sandcastle/CODING_STANDARDS.md

Also respect `docs/agents/tdd.md`, `docs/agents/client-state.md`, and `docs/agents/domain.md` when they apply to the diff.

# REVIEW PROCESS

Run both axes. Do not let one axis mask the other.

## 1. Standards axis

Does the diff conform to project standards and avoid baseline smells?

**Project standards** — hard violations when the change clearly breaks a rule in `CODING_STANDARDS.md` or the agent docs above. Skip anything tooling already enforces (`vp check`, formatter, linter, types).

**Smell baseline** (judgement calls only; a documented repo standard overrides these):

- **Mysterious Name** — name doesn't reveal what it does → rename; if no honest name comes, the design is murky.
- **Duplicated Code** — same logic shape in more than one hunk → extract the shared shape.
- **Feature Envy** — method reaches into another object's data more than its own → move it onto the data it envies.
- **Data Clumps** — same few fields/params travel together → bundle into one type.
- **Primitive Obsession** — primitive standing in for a domain concept → give it a small type.
- **Repeated Switches** — same switch/if-cascade on the same type → polymorphism or one shared map.
- **Shotgun Surgery** — one logical change forces scattered edits → gather what changes together.
- **Divergent Change** — one module edited for several unrelated reasons → split by reason.
- **Speculative Generality** — abstraction for needs the spec doesn't have → delete; inline until a real need shows.
- **Message Chains** — long `a.b().c().d()` the caller shouldn't depend on → hide behind one method.
- **Middle Man** — mostly just delegates → cut it, call the real target.
- **Refused Bequest** — subclass ignores most of what it inherits → drop inheritance, use composition.

Also check TDD quality on new/changed tests: seams (not internals), no tautological asserts, no horizontal-slice leftovers, capability-named tests.

## 2. Spec axis

Against the fetched issue/PRD:

- (a) Requirements that are missing or only partial
- (b) Behavior in the diff that wasn't asked for (scope creep)
- (c) Requirements that look implemented but look wrong

Quote the issue/spec line for each finding. If there is no spec source, skip this axis.

## 3. Maintain balance

Avoid "improvements" that reduce clarity, create cleverness, smash unrelated concerns together, or strip helpful abstractions. Prefer explicit over cute.

# EXECUTION

Refactoring and structural cleanup belong here (not in the implement phase), as long as observable behavior stays intact — except Spec fixes that restore behavior the issue required.

If you find improvements or Spec gaps to fix:

1. Make the changes directly on this branch
2. Run focused tests for touched files, then `vp run ready`
3. Commit describing the refinements (mention the issue `#N` if known)

If the code already satisfies both axes, do nothing.

Once complete, output <promise>COMPLETE</promise>.
