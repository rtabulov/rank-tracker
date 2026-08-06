-- Hosted DB still had non-SELECT privileges on season_bounds for Data API roles
-- after SELECT was revoked (platform/default grants). Close the full table surface.
revoke all on table public.season_bounds from anon, authenticated;
