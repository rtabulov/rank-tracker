# Supabase security review

## Question

What is the security posture of this project's Supabase database surface—schema objects in API-exposed schemas, RLS and policies, `GRANT`/`REVOKE` for `anon` / `authenticated` / `PUBLIC`, `SECURITY DEFINER` RPCs, and current Security Advisor / database-linter findings—and what concrete remediations (if any) should become tickets? Seed finding: [#104](https://github.com/rtabulov/rank-tracker/issues/104) (`rls_disabled_in_public` on `public.season_bounds`). Scope is issue [#105](https://github.com/rtabulov/rank-tracker/issues/105).

## Inventory

### API exposure (`supabase/config.toml`)

- Data API schemas: `public`, `graphql_public`.
- `max_rows = 1000`.
- `auto_expose_new_tables` is unset → local CLI matches the new cloud default: new `public` entities are not auto-granted to Data API roles; explicit `GRANT`s are required. Platform enforcement for all existing projects is scheduled for **2026-10-30**. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api) [Changelog: tables not exposed automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- Auth: Discord + Google OAuth enabled; email signup/confirmations on; `enable_anonymous_sign_ins = false`; `jwt_expiry = 3600`; no session timebox/inactivity timeout (matches Sign-in language in `CONTEXT.md`). Browser client uses the publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`), not `service_role`. [Supabase: API Keys](https://supabase.com/docs/guides/api/api-keys)

### Tables (migrations)

| Object                 | RLS             | Policies                                                                                                                               | Grants (explicit in migrations)                                   | Client usage                                                                |
| ---------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `public.profiles`      | Enabled         | Owner-only `SELECT`/`INSERT`/`UPDATE` to `authenticated` via `(select auth.uid()) = user_id`; UPDATE has both `USING` and `WITH CHECK` | `SELECT, INSERT, UPDATE` → `authenticated` only (no `anon`)       | `apps/website/src/lib/profile.ts` → `.from("profiles")`                     |
| `public.entries`       | Enabled         | Owner-only `SELECT`/`INSERT`/`UPDATE`/`DELETE` to `authenticated`; UPDATE has `USING` + `WITH CHECK`                                   | `SELECT, INSERT, UPDATE, DELETE` → `authenticated` only           | `apps/website/src/lib/cloud-entries.ts` → `.from("entries")`                |
| `public.season_bounds` | **Not enabled** | None                                                                                                                                   | `REVOKE ALL … FROM PUBLIC`; then `SELECT` → `anon, authenticated` | No `.from("season_bounds")` in apps; read only inside SECURITY DEFINER RPCs |

`profiles` also has a uniqueness index on `lower(display_name)`, a format `CHECK`, and a before-update trigger that makes `display_name` immutable once set (domain: Display name).

### Functions

| Function                                          | Security                  | `search_path`         | Execute grants                                                               | Status / role                                                |
| ------------------------------------------------- | ------------------------- | --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `public.get_public_season(text)`                  | Was `SECURITY DEFINER`    | `pg_catalog, pg_temp` | Was `anon, authenticated` after `REVOKE ALL FROM PUBLIC`                     | **Dropped** by later migration; not present in live advisors |
| `public.get_public_season_index(text)`            | `SECURITY DEFINER`        | `pg_catalog, pg_temp` | `REVOKE ALL FROM PUBLIC`; `GRANT EXECUTE` → `anon, authenticated`            | Live public read API; returns JSON index or `null`           |
| `public.get_public_season_entries(text, integer)` | `SECURITY DEFINER`        | `pg_catalog, pg_temp` | Same                                                                         | Live public read API; returns JSON season payload or `null`  |
| `public.profiles_display_name_immutable()`        | Default invoker (trigger) | **Not set**           | Default Postgres `EXECUTE` to `PUBLIC` (trigger return type; not an app RPC) | Enforces Display-name immutability                           |

Public RPC authorization model (both live functions):

1. Resolve profile only when `lower(display_name) = lower(input) AND is_public = true` in one predicate.
2. Return a fixed JSON shape on hit; return SQL `null` for unknown **and** private (indistinguishability).
3. Projection allow-list: `displayName`, `seasonNumbers` / `seasonNumber`, and Entries `id` / `rs` / `recordedAt` — not `user_id`, `is_public`, or sync metadata.

This matches the intended model in [Public Season view read access](./public-season-view-read-access.md) and `CONTEXT.md` (Public Season view / Public link). Client: `apps/website/src/lib/public-season.ts` calls `.rpc("get_public_season_index")` and `.rpc("get_public_season_entries")` after Display-name validation.

### Live advisors (ran)

Command: `supabase db advisors --linked --type all --level info` (CLI **2.109.1**), against the linked project (`supabase/.temp/project-ref` present). Checked **2026-08-06**.

| Lint                                                        | Level     | Object                                                 | Notes                                          |
| ----------------------------------------------------------- | --------- | ------------------------------------------------------ | ---------------------------------------------- |
| `rls_disabled_in_public` (0013)                             | **ERROR** | `public.season_bounds`                                 | Same as #104                                   |
| `function_search_path_mutable` (0011)                       | WARN      | `public.profiles_display_name_immutable`               | Missing fixed `search_path`                    |
| `anon_security_definer_function_executable` (0028)          | WARN ×2   | `get_public_season_index`, `get_public_season_entries` | Intentional public API                         |
| `authenticated_security_definer_function_executable` (0029) | WARN ×2   | same two RPCs                                          | Intentional; same grant for signed-in visitors |
| `auth_leaked_password_protection`                           | WARN      | Auth product                                           | HaveIBeenPwned check disabled (Pro+)           |

No other security/performance advisor rows were returned. Supabase MCP tools were not available in this environment; the linked CLI advisors run is the live source of truth for this review.

## Audit detail

### `public.profiles`

- **Intended model:** Owner-only cloud profile row; public discovery only through SECURITY DEFINER RPCs, not table `SELECT` for `anon`. Matches prior research recommendation to keep base-table `SELECT` ungranted to `anon`. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- **RLS / policies:** Enabled; policies use `TO authenticated` plus ownership predicate (not deprecated `auth.role()`). UPDATE includes `WITH CHECK` so `user_id` cannot be reassigned. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Grants:** Explicit to `authenticated` only. No `DELETE` grant/policy — profile rows are expected to cascade from `auth.users` deletion; acceptable for current product.
- **Auth-adjacent:** Policies use `auth.uid()`, not `user_metadata` / JWT custom claims. Good. [Supabase product security index](https://supabase.com/docs/guides/security/product-security)

**Verdict:** OK for the intended access model. No change required for #104/#105 acceptance beyond ongoing review.

### `public.entries`

- **Intended model:** Owner-only sync store; public Entry history only via RPCs when the owning profile is public.
- **RLS / policies:** Full CRUD owner policies with UPDATE `USING` + `WITH CHECK`.
- **Grants:** `authenticated` only; no `anon` table access.
- **Client:** Lists/upserts/deletes scoped by `user_id`; RLS remains the real boundary if a caller tampers with filters.

**Verdict:** OK.

### `public.season_bounds`

- **What it is:** Static Season calendar (`number`, `start_utc`, `end_utc`) seeded in migration; comment says keep aligned with website `SEASONS`. Non-secret schedule data.
- **What is wrong:** Table lives in an API-exposed schema (`public`) with `SELECT` granted to `anon` and `authenticated`, but **RLS is not enabled**. Lint **0013** (`rls_disabled_in_public`) is ERROR: tables in schemas exposed to PostgREST must enable RLS. [Database linter — 0013](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Grant nuance vs linter wording:** Migrations revoked `PUBLIC` then granted **only** `SELECT` (no insert/update/delete). So the live Data API surface for this table is read-all-rows calendar data, not full CRUD. The advisor still correctly requires RLS once the table is reachable. Without RLS, Postgres privilege system alone governs access; with RLS enabled and no policy, default-deny applies for non-owners. [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Usage:** Apps never query the table directly; only DEFINER RPCs read it. Prior research preferred “no useful public table reads” for owner tables; the same least-privilege idea applies here even though the payload is non-sensitive.

**Verdict:** ERROR — #104 is real and should be fixed. Prefer closing the direct table surface rather than documenting an exception.

### SECURITY DEFINER RPCs (`get_public_season_index`, `get_public_season_entries`)

Checked against PostgreSQL and Supabase guidance for privileged functions:

| Checklist item                           | Status       | Evidence                                                                                                                                                                                         |
| ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Needed privilege (bypass owner-only RLS) | Intentional  | Must read public players' `profiles`/`entries` for visitors                                                                                                                                      |
| Fixed `search_path`                      | OK           | `set search_path = pg_catalog, pg_temp` (Postgres recommends trusted schemas then `pg_temp` last) [PostgreSQL: CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html) |
| Schema-qualified relations               | OK           | `public.profiles`, `public.entries`, `public.season_bounds`                                                                                                                                      |
| Revoke default `PUBLIC` execute          | OK           | `revoke all on function … from public`                                                                                                                                                           |
| Grant only intended roles                | OK           | `anon, authenticated` (visitor-independent Public Season view)                                                                                                                                   |
| Narrow return shape                      | OK           | No `user_id` / `is_public` / private columns                                                                                                                                                     |
| Private ≡ unknown                        | OK           | Single `is_public = true` predicate; else `null`                                                                                                                                                 |
| RLS does not cover functions             | Acknowledged | EXECUTE grants are the API; body is the authorization [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)                                                      |

Advisor lints **0028** / **0029** WARN that these DEFINER functions are executable by `anon` and `authenticated`. Official remediation Option 3: keep DEFINER + EXECUTE when the function is a deliberate public API endpoint, validate inputs, and limit what it returns. [Database linter — 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)

**Verdict:** Intentional WARNs. Do not revoke EXECUTE; document acceptance. Optional hardening later: rate limiting via Data API pre-request (out of DB schema scope unless pursued). [Supabase: Securing your API — pre-request](https://supabase.com/docs/guides/api/securing-your-api)

### Trigger function `profiles_display_name_immutable`

- SECURITY INVOKER by default; not used as an app RPC.
- Advisor **0011** WARN: mutable `search_path`. Fix by recreating with `set search_path = pg_catalog, pg_temp` (or `''` with fully qualified names). [Database linter — 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

**Verdict:** WARN — small hardening fix.

### Auth-adjacent product finding

- `auth_leaked_password_protection` WARN: HaveIBeenPwned leaked-password rejection is off. Feature is documented as Pro Plan and above. Email password signup remains enabled in `config.toml`, so the control is relevant if password accounts are used alongside OAuth. [Password security](https://supabase.com/docs/guides/auth/password-security)

**Verdict:** WARN — product/config ticket, not a migration for #104.

## Findings

### ERROR

1. **`public.season_bounds` — RLS disabled while SELECT is granted to Data API roles**
   - **Wrong:** Exposed-schema table without RLS (#104 / lint 0013).
   - **Evidence:** Migration grants `SELECT` to `anon`/`authenticated` and never `ENABLE ROW LEVEL SECURITY`; live advisors confirm.
   - **Remediation (preferred):** Treat calendar as RPC-internal only — revoke table `SELECT` from `anon`/`authenticated`, enable RLS (defense in depth; with no grants, API cannot reach the table regardless of policies). Keep DEFINER RPCs as the only readers.
   - **Remediation (if direct SELECT is desired):** Enable RLS and add a `SELECT` policy `TO anon, authenticated USING (true)` (and keep write privileges revoked). Still enable RLS even for “public read” tables. [Database linter — 0013](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

### WARN (fix)

2. **`profiles_display_name_immutable` — mutable search_path** (lint 0011)
   - Pin `search_path` on recreate/replace.

3. **Leaked password protection disabled** (Auth advisor)
   - Enable in Dashboard Auth settings if on Pro+; otherwise track as accepted risk / plan upgrade.

### WARN (intentional — accept with rationale)

4. **Public Season DEFINER RPCs executable by `anon` and `authenticated`** (lints 0028 / 0029 ×2 functions)
   - Required for Public link visitors (signed-out and signed-in). Body already enforces `is_public` and null-indistinguishability. Suppress/accept in advisor workflow; do not “fix” by revoking EXECUTE.

### INFO / OK

5. **`profiles` and `entries`** — RLS on, owner policies with proper `TO` + ownership, UPDATE `WITH CHECK`, no `anon` table grants, client uses publishable key. Aligns with prior public-read research and domain rules.
6. **Dropped `get_public_season`** — no leftover live advisor surface for the old all-entries RPC.
7. **Anonymous Auth sign-ins** — disabled; avoids `authenticated`-role confusion for anonymous users. [Supabase: Row Level Security — roles](https://supabase.com/docs/guides/database/postgres/row-level-security)

**#104 is not the only current finding.** Live advisors also report the trigger `search_path` WARN, four intentional DEFINER EXECUTE WARNs, and Auth leaked-password WARN. Only #104 is ERROR-level on the schema.

## Recommendations

Concrete fix list suitable for tickets:

1. **Fix #104 / season_bounds (ERROR)** — New migration intent:
   - `alter table public.season_bounds enable row level security;`
   - Prefer: `revoke select on table public.season_bounds from anon, authenticated;` (RPCs keep working as DEFINER).
   - Alternative if keeping direct reads: `create policy … for select to anon, authenticated using (true);`
   - Re-run `supabase db advisors --linked` and confirm lint 0013 is gone.

2. **Pin search_path on trigger function (WARN)** — `create or replace function public.profiles_display_name_immutable() … set search_path = pg_catalog, pg_temp` (same body). Clear lint 0011.

3. **Document acceptance of public Season RPCs (WARN 0028/0029)** — Short note in issue/PR that EXECUTE for `anon`/`authenticated` on `get_public_season_index` / `get_public_season_entries` is the Public Season view API; do not revoke. Optionally dismiss those advisor rows with that rationale.

4. **Auth leaked-password protection (WARN)** — Enable in project Auth settings when plan allows; otherwise accept and revisit.

5. **Optional follow-ups (not blocking #105):**
   - Confirm hosted project has opted into / will survive **2026-10-30** Data API auto-expose change (migrations already use explicit grants for the three tables). [Changelog 45329](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
   - Decide whether `graphql_public` should remain in exposed schemas if the app never uses GraphQL.
   - Abuse controls (rate limits) for public RPCs via pre-request if enumeration becomes a problem — separate from RLS correctness.

## Relation to #104 and #105

| Issue    | Role                                                                                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#104** | Narrow ERROR: `rls_disabled_in_public` on `public.season_bounds`. Fold into the first remediation migration (recommendation 1).                                                                                                                |
| **#105** | Full security review umbrella. This document is the research deliverable. Remaining acceptance items: apply ERROR/WARN fixes (1–2, optionally 4), document intentional DEFINER WARNs (3), re-run advisors until only accepted findings remain. |

## Changelog check

`https://supabase.com/changelog.md` scanned **2026-08-06**.

Relevant breaking / platform items for this review:

| Date                                | Item                                                                     | Relevance                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-04-28 / enforce **2026-10-30** | Tables/functions not auto-exposed to Data API; explicit `GRANT` required | Migrations already grant explicitly; confirm hosted defaults; local `config.toml` leaves `auto_expose_new_tables` unset |
| 2026-02-17 / Apr 2026               | OpenAPI spec no longer via anon key                                      | Client does not depend on OpenAPI discovery                                                                             |
| 2025-12-11                          | PostgREST v14 Data API                                                   | No breaking change noted for RLS/DEFINER grants                                                                         |
| Various 2026 self-hosted            | Envoy gateway, PG 15→17, Studio role                                     | Hosted Rank Tracker path; recheck only if self-hosting                                                                  |

No changelog entry undoes the need for RLS on exposed tables or safe `SECURITY DEFINER` `search_path` / EXECUTE discipline. Legacy `anon` / `service_role` JWT keys remain valid until disabled; publishable/secret keys are preferred and are already used by the website client. [Supabase: API Keys](https://supabase.com/docs/guides/api/api-keys)

## Sources

- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Database linter](https://supabase.com/docs/guides/database/database-linter)
- [Supabase — Lint 0013 `rls_disabled_in_public`](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- [Supabase — Lint 0011 `function_search_path_mutable`](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase — Lint 0028 `anon_security_definer_function_executable`](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Supabase — Lint 0029 `authenticated_security_definer_function_executable`](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Supabase — Product security](https://supabase.com/docs/guides/security/product-security)
- [Supabase — Understanding API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase — Password security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase — Changelog](https://supabase.com/changelog.md)
- [Changelog — Data API auto-expose breaking change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL — CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
- Repo primary sources: `supabase/migrations/*.sql`, `supabase/config.toml`, `CONTEXT.md`, `docs/research/public-season-view-read-access.md`, `apps/website/src/lib/{public-season,profile,cloud-entries}.ts`, `apps/website/src/supabase.ts`
- Live: `supabase db advisors --linked` (CLI 2.109.1), 2026-08-06
- Issues: [#104](https://github.com/rtabulov/rank-tracker/issues/104), [#105](https://github.com/rtabulov/rank-tracker/issues/105)
