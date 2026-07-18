# Rank Tracker

A personal Rank Score (RS) history for [The Finals](https://www.reachthefinals.com/) ranked play. Log RS after sessions, review progress per Season, and back up your data locally.

**Live app:** [rtabulov.github.io/rank-tracker](https://rtabulov.github.io/rank-tracker/)

## Features

- **Season view** — latest RS as the hero, RS sparkline, Season summary, and Entry timeline
- **Log RS** — record your current Rank Score with a timestamp
- **Edit & delete** — fix or remove Entries from the timeline
- **Season navigation** — browse past Seasons; opens on the Current Season by default
- **Export & Import** — full JSON backup and restore via the Data sheet (replace-or-nothing)
- **PWA** — installable on mobile and desktop; data stays in your browser

All data is stored in `localStorage` on your device. There is no account or server sync.

## Development

Requires Node ≥ 22.18 and pnpm 11.13 (managed by Vite+).

```bash
vp install
```

Run the dev server:

```bash
vp run dev
```

Check, test, and build:

```bash
vp run ready      # check + test + build (all packages)
vp check          # format, lint, typecheck
vp test           # run tests
vp run -r build   # build all packages
```

Run website tests only:

```bash
vp run website#test
```

## Project layout

| Path              | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `apps/website/`   | React SPA (TanStack Router, shadcn/ui, Tailwind v4) |
| `packages/utils/` | Shared utilities                                    |
| `.sandcastle/`    | Agent orchestration (Sandcastle)                    |
| `docs/adr/`       | Architecture decisions                              |
| `CONTEXT.md`      | Domain glossary and product language                |

## Domain docs

Product terminology and behaviour are defined in [`CONTEXT.md`](./CONTEXT.md). Data model and Export/Import format are recorded in [`docs/adr/`](./docs/adr/).

## Deployment

Pushes to `main` deploy the website to GitHub Pages via [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml).
