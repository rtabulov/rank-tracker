# TDD default

Feature work on this repo should follow **red → green** with Vitest and React Testing Library.

## Defaults

- **Primary seam:** the composed website app shell (`apps/website`) — assert observable UI behavior, not plugin wiring or private module structure.
- **Secondary seam:** `packages/utils` for shared non-UI helpers.
- **No coverage gate.** Coverage numbers are optional signals, not a CI fail condition.
- **E2E / Playwright** stays deferred until a product need appears.

## What good tests look like

Name tests after capabilities ("invalid form input surfaces a visible validation error"). Prefer known-good literals over recomputing the implementation in the assertion.
