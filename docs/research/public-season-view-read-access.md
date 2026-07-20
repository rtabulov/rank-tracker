# Public Season view read access

## Question

How can anonymous and signed-in visitors read the public metadata and synced Entries for `/p/{displayName}` without granting them useful access to any Player whose public sharing is off? The required observable result is identical for an unknown Display name and a private Player: the application must render the same not-found state and must not distinguish the cases through its own API response.

The current schema exposes `public.profiles` and `public.entries` through the Data API only to `authenticated`, with RLS limiting each table to the owner. Supabase separates object reachability (Postgres `GRANT`) from row visibility (RLS); both must be deliberately configured for every public API object. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)

## Recommendation (concrete, pick one approach)

Use **one read-only `SECURITY DEFINER` RPC that returns a deliberately shaped public-Season payload, or `NULL`, and exposes no public table reads**. It should accept a Display name, find a profile only when `is_public` is true, and return only the fields required by the public Season view plus that Player's Entries. Return `NULL` for both “unknown” and “private”; the route must map either to the identical not-found UI and response behavior.

This gives the public feature one auditable capability instead of granting public `SELECT` over two owner tables. It also makes the public projection explicit: the function never returns `profiles.user_id`, timestamps, sync metadata, or any future private profile fields unless each is intentionally added to its return shape. RLS does not protect columns, and grants control whether a role can reach an object, so keeping base-table `SELECT` ungranted to `anon` is a useful boundary in addition to the function's authorization check. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api) [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

The function is intentionally privileged because it must inspect otherwise-private owner rows. Treat it as a narrow public API endpoint: schema-qualify its relations, set a safe `search_path` ending in `pg_temp`, revoke default `PUBLIC` execution, grant `EXECUTE` only to `anon` and `authenticated`, and return a fixed, non-diagnostic result for a private or unknown name. PostgreSQL documents that a security-definer function runs with its owner’s privileges and requires a secure `search_path`; Supabase notes that functions are not covered by RLS and must have narrowly reviewed `EXECUTE` grants. [PostgreSQL: CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html) [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)

Both `anon` and `authenticated` should receive the same `EXECUTE` grant. A signed-in Player visiting another Player's Public Season view is a public visitor for this capability; their identity must neither broaden the returned data nor change the private/unknown result. Supabase maps unauthenticated requests to `anon` and logged-in requests to `authenticated`; RLS policies can target both roles explicitly. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Why not the alternatives

### A) Direct `anon`/`authenticated` `SELECT` policies on `profiles` and `entries`

This is viable but not the recommended boundary here. A permissive public-profile `SELECT` policy plus an Entries policy such as `EXISTS (SELECT 1 FROM profiles ... is_public)` can correctly return zero rows for both private and unknown names, so it need not leak private existence by itself. However, it makes the two base tables browsable Data API surfaces: callers can request arbitrary exposed columns, enumerate all public profile rows unless application queries and privileges constrain that, and issue broad Entries queries. RLS is an implicit filter rather than a projection layer. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)

It also adds a cross-table authorization predicate to every visible Entry. RLS expressions run per row and with the requesting user's rights; Supabase specifically recommends minimizing policy joins, indexing policy columns, and measuring the result. Joining `entries` to an RLS-protected `profiles` table can lead to recursive-policy errors if profile policies later reference Entries, and it adds a policy/performance dependency that the simple public read does not need. [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) [Supabase: Row Level Security — performance](https://supabase.com/docs/guides/database/postgres/row-level-security) [Supabase: RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

### B) `SECURITY DEFINER` RPC

Recommended, with the restrictions above. It minimizes the public surface, allows one atomic “resolve public Player + Entries” query, and centralizes the requirement that private and unknown names have the same outcome. Its material risk is privilege escalation if its implementation, ownership, `search_path`, return shape, or `EXECUTE` grants are careless; a generic helper that can fetch arbitrary users is not acceptable. [PostgreSQL: CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html) [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)

### C) Edge Function using `service_role`

Do not use this for the normal public read. `service_role`/secret keys have `BYPASSRLS` and full data access, so every authorization and field-projection mistake becomes application-code exposure; the key must never reach a browser. An Edge Function can add rate limiting or abuse controls in front of the RPC later, but it does not improve the base authorization model and introduces a larger privileged credential and service boundary for a simple read. [Supabase: API Keys](https://supabase.com/docs/guides/api/api-keys) [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### D) `security_invoker` view / column-limited public surface

A column-limited view is a useful _secondary_ API-shaping technique, but not the authorization solution on its own. A `security_invoker` view evaluates underlying permissions and RLS as the caller, so it still requires public-read policies on the base tables—the same cross-table policy and browsing concerns as A. Ordinary views can otherwise apply the view owner's permissions/RLS, which is unsafe here; PostgreSQL 15+ offers `security_invoker = true` specifically to avoid that. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) [PostgreSQL: CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)

## Threat notes

- **Enumeration of Display names / existence:** No authorization design can prevent guesses from finding Players who deliberately made a predictable public link public. The RPC must not expose a lookup endpoint for private profiles, list Profiles, emit different errors/statuses, return different timing-sensitive messages, or return counts. It should normalize and validate the input once, use the existing unique `lower(display_name)` lookup index, and return the same `NULL` payload for nonexistent and private names. Rate limits and bot controls are a separate concern; Supabase's Data API pre-request checks can enforce request-wide checks, though they apply only to the Data API. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- **Private versus unknown indistinguishability:** Query `profiles` with `lower(display_name) = lower(p_display_name) AND is_public` in the same selection and make “no row” the only non-public result. Do not first look up the name and then branch on `is_public`; that structure invites differentiated errors, logging, metrics, and accidental client behavior. PostgreSQL's default-deny behavior for RLS supports withholding rows, but the public route still needs identical application semantics. [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Over-fetch:** Return a typed table/JSON object with an allow-list of exactly `display_name` and the Entry fields the Season view needs (`id`, `rs`, `recorded_at` under the current schema). Do not return `p.*`, `e.*`, `user_id`, `is_public`, or sync/audit fields. Keep base-table grants unchanged: current migrations grant `SELECT` only to `authenticated`, and the public RPC needs only `EXECUTE` for `anon, authenticated`.
- **Cross-user authenticated browsing:** Public sharing is deliberately viewer-independent. Grant both roles the same RPC and do not add `auth.uid() = profile.user_id` to it. Owner-only write and private-read policies remain in force for direct table access; authenticated visitors receive no additional private data merely because they have a session. Supabase distinguishes `anon` and `authenticated` by the request's user session and recommends using the policy `TO` clause to target roles. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Policy recursion and performance:** Avoid a public Entries RLS policy that queries `profiles`; it has to run while Entries are filtered and can interact badly with future policies on `profiles`. The recommended RPC performs one explicit, indexed join under its narrow privileged implementation instead. If direct policies are chosen later, index all policy/join columns, pass a selective Display-name filter from the client, use `EXPLAIN ANALYZE` with representative RLS roles, and avoid row-dependent security-definer functions unless tested. [Supabase: RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Changelog check

`https://supabase.com/changelog.md` was checked on 2026-07-20. Its currently listed relevant breaking changes are self-hosted API-gateway and PostgreSQL-upgrade items, rather than a change to hosted RLS, `SECURITY DEFINER`, `security_invoker`, or Data API grants. This recommendation therefore has no identified hosted-platform breaking-change dependency, but the changelog should be rechecked when upgrading a self-hosted stack or changing API-key/Edge Function infrastructure. [Supabase Changelog](https://supabase.com/changelog.md)

## Suggested policy/RPC sketch (SQL pseudocode only — not a migration)

```sql
-- Keep existing owner-only base-table RLS/grants. Do NOT grant anon SELECT
-- on public.profiles or public.entries for this feature.

create function public.get_public_season(display_name_input text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  with public_player as (
    select p.user_id, p.display_name
    from public.profiles p
    where lower(p.display_name) = lower(display_name_input)
      and p.is_public = true
  )
  select case
    when exists (select 1 from public_player) then jsonb_build_object(
      'displayName', (select display_name from public_player),
      'entries', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'rs', e.rs,
            'recordedAt', e.recorded_at
          )
          order by e.recorded_at asc, e.id asc
        )
        from public.entries e
        join public_player p on p.user_id = e.user_id
      ), '[]'::jsonb)
    )
    else null::jsonb -- exactly the same for unknown and private
  end;
$$;

revoke all on function public.get_public_season(text) from public;
grant execute on function public.get_public_season(text) to anon, authenticated;
```

The implementation must also validate the input to the Display-name format/length before calling the RPC, avoid logging raw lookup outcomes differently, and keep the route's HTTP status/body identical for a `NULL` result. If the function is kept in an API-exposed schema so that it is callable through RPC, its explicit `EXECUTE` grants and body are the public contract; do not add generic privileged helpers there. Supabase warns that RLS does not apply to functions and advises putting security-definer helpers that are not intended as API endpoints in an unexposed schema. [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api) [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Sources (links)

- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase — Understanding API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase — Changelog](https://supabase.com/changelog.md)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL — CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL — CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
