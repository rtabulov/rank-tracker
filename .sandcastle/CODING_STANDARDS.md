# Coding Standards

Sandcastle-facing digest of this repo's conventions. Prefer the linked docs when they go deeper; this file is what the reviewer loads every run.

## Tooling

- Package manager / toolchain: **Vite+** via `vp` (not raw npm/yarn for project scripts). See root `AGENTS.md`.
- Install: `vp install`. Validate: `vp check`, `vp test`, and for a full gate `vp run ready`.
- Workspace layout: `apps/*`, `packages/*`, `tools/*` (pnpm workspace + catalog).

## Testing (TDD)

Full detail: `docs/agents/tdd.md`.

- **Red → green** with Vitest + React Testing Library. No coverage gate.
- **Primary seam:** composed website app shell (`apps/website`) — assert observable UI behavior, not plugin wiring or private modules.
- **Secondary seam:** `packages/utils` for shared non-UI helpers.
- Name tests after capabilities (e.g. "invalid form input surfaces a visible validation error").
- Prefer known-good literals over recomputing the implementation in the assertion.
- Do not mock internal collaborators or test private methods.
- E2E / Playwright stays deferred unless an issue explicitly requires it.
- Implementation owns red → green only; **refactoring belongs to review**.

## Client state

Full detail: `docs/agents/client-state.md`.

1. **URL** — filters, selections, reload-stable / shareable state
2. **React Context** — app-level concerns that are not URL state (e.g. theme)
3. **Local component state** — everything else

Do **not** add Zustand, Redux, or similar global stores by default. Only consider a store library for high-frequency multi-subscriber updates or state that must live outside the React tree.

## Domain language

Full detail: `docs/agents/domain.md`.

- Read `CONTEXT.md` / `CONTEXT-MAP.md` and relevant ADRs under `docs/adr/` when they exist; proceed silently if missing.
- Use glossary terms as defined — do not invent synonyms the glossary avoids.
- If a change would contradict an ADR, surface that explicitly rather than silently overriding.

## TypeScript & React

- Prefer clear, boring code over clever abstractions.
- Do not add `useMemo` / `useCallback` by default; follow React Compiler guidance already in the codebase.
- Prefer named exports over default exports for app modules (UI kit files may follow their generator's defaults).
- Avoid `any` and unchecked casts; narrow at boundaries instead.
- Colocate tests next to the module under test (`*.test.ts` / `*.test.tsx`).

## Style & structure

- Keep diffs small and issue-scoped — no drive-by refactors in the implement phase.
- One job per module/function; prefer composition over deep inheritance.
- No commented-out code or TODO breadcrumbs in commits.
- Match existing file/folder naming and import style in the area you touch.
- Comments explain non-obvious intent, not what the next line obviously does.

## Issues & commits (Sandcastle)

- Work one Sandcastle-labelled issue per iteration (hard-pinned by the orchestrator).
- Follow `/implement` → `/tdd` → `/code-review` (see `.agents/skills/`). AFK: use default TDD seams unless the issue names others.
- Commits: Conventional Commits and include `#N` for the issue. Run `vp run ready` before committing.
- **Do not push or close the GitHub issue.** The host merges via Sandcastle `merge-to-head`, pushes `origin/main`, then closes `#N`.
- On implement/no-commit failure the host unclaims `#N` and deletes leftover `sandcastle/implementer/*` branches.
