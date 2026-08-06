-- Season calendar is RPC-internal only (Public Season DEFINER readers).
-- Clears lint 0013 rls_disabled_in_public on public.season_bounds (#104).
alter table public.season_bounds enable row level security;
revoke all on table public.season_bounds from anon, authenticated;

-- Pin search_path on Display-name immutability trigger (lint 0011).
create or replace function public.profiles_display_name_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if old.display_name is not null and new.display_name is distinct from old.display_name then
    raise exception 'display_name is immutable';
  end if;
  return new;
end;
$$;
