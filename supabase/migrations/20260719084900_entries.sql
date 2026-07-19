create table public.entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  rs integer not null,
  recorded_at timestamptz not null,
  updated_at timestamptz not null,
  constraint entries_rs_nonneg check (rs >= 0)
);

create index entries_user_id_idx on public.entries (user_id);

alter table public.entries enable row level security;

create policy "entries_select_own"
  on public.entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "entries_insert_own"
  on public.entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "entries_update_own"
  on public.entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "entries_delete_own"
  on public.entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.entries to authenticated;
