-- Season calendar bounds for public RPCs (keep aligned with apps/website SEASONS).
create table public.season_bounds (
  number integer primary key,
  start_utc timestamptz not null,
  end_utc timestamptz
);

insert into public.season_bounds (number, start_utc, end_utc) values
  (1,  '2023-12-08T04:19:48Z', '2024-03-14T09:39:20Z'),
  (2,  '2024-03-14T09:39:20Z', '2024-06-13T12:15:37Z'),
  (3,  '2024-06-13T12:15:37Z', '2024-09-26T09:02:44Z'),
  (4,  '2024-09-26T09:02:44Z', '2024-12-12T07:30:00Z'),
  (5,  '2024-12-12T07:30:00Z', '2025-03-20T10:37:56Z'),
  (6,  '2025-03-20T10:37:56Z', '2025-06-12T10:03:08Z'),
  (7,  '2025-06-12T10:03:08Z', '2025-09-10T15:49:49Z'),
  (8,  '2025-09-10T15:49:49Z', '2025-12-10T16:05:12Z'),
  (9,  '2025-12-10T16:05:12Z', '2026-03-26T13:30:00Z'),
  (10, '2026-03-26T13:30:00Z', '2026-07-09T13:01:22Z'),
  (11, '2026-07-09T13:01:22Z', null);

revoke all on table public.season_bounds from public;
grant select on table public.season_bounds to anon, authenticated;

-- Replace all-entries public read with index + per-season entries.
drop function if exists public.get_public_season(text);

create or replace function public.get_public_season_index(display_name_input text)
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
  ),
  current_season as (
    select sb.number
    from public.season_bounds sb
    where sb.start_utc <= now()
      and (sb.end_utc is null or now() < sb.end_utc)
    order by sb.number desc
    limit 1
  ),
  seasons_with_entries as (
    select distinct sb.number
    from public.season_bounds sb
    join public.entries e
      on e.user_id = (select user_id from public_player)
     and e.recorded_at >= sb.start_utc
     and (sb.end_utc is null or e.recorded_at < sb.end_utc)
  )
  select case
    when exists (select 1 from public_player) then jsonb_build_object(
      'displayName', (select display_name from public_player),
      'seasonNumbers', coalesce((
        select jsonb_agg(number order by number)
        from (
          select number from seasons_with_entries
          union
          select number from current_season
        ) navigable
      ), '[]'::jsonb)
    )
    else null::jsonb
  end;
$$;

create or replace function public.get_public_season_entries(
  display_name_input text,
  season_number_input integer
)
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
  ),
  season_window as (
    select sb.start_utc, sb.end_utc
    from public.season_bounds sb
    where sb.number = season_number_input
  )
  select case
    when exists (select 1 from public_player) and exists (select 1 from season_window) then
      jsonb_build_object(
        'displayName', (select display_name from public_player),
        'seasonNumber', season_number_input,
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
          join season_window w on true
          where e.recorded_at >= w.start_utc
            and (w.end_utc is null or e.recorded_at < w.end_utc)
        ), '[]'::jsonb)
      )
    else null::jsonb
  end;
$$;

revoke all on function public.get_public_season_index(text) from public;
grant execute on function public.get_public_season_index(text) to anon, authenticated;

revoke all on function public.get_public_season_entries(text, integer) from public;
grant execute on function public.get_public_season_entries(text, integer) to anon, authenticated;
