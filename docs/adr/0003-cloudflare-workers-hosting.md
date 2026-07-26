# Cloudflare Workers for website hosting

`apps/website` deploys to **Cloudflare Workers** (free tier) with the custom domain `rank.rtabulov.dev`. Chosen over Netlify/Vercel for a free Workers runtime that can later run selective SSR for Public Season views (#97), first-class TanStack Start support via `@cloudflare/vite-plugin`, and a smooth custom-domain path once `rtabulov.dev` DNS lives on Cloudflare. Prod deploys are GitHub Actions on `main` (plus `workflow_dispatch`); no PR preview hosts in v1. See #96.
