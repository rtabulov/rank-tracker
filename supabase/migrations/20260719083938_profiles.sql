create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_format check (
    display_name is null
    or (
      char_length(display_name) between 3 and 24
      and display_name ~ '^[A-Za-z0-9_-]+$'
    )
  )
);

create unique index profiles_display_name_lower_unique on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to authenticated;

create or replace function public.profiles_display_name_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.display_name is not null and new.display_name is distinct from old.display_name then
    raise exception 'display_name is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_display_name_immutable
before update on public.profiles
for each row
execute function public.profiles_display_name_immutable();
