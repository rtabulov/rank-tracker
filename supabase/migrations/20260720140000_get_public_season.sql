create or replace function public.get_public_season(display_name_input text)
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
    else null::jsonb
  end;
$$;

revoke all on function public.get_public_season(text) from public;
grant execute on function public.get_public_season(text) to anon, authenticated;
