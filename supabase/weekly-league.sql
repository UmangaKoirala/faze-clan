-- Weekly league: one squad per scout per week.
-- Run once in the Supabase SQL editor. It only adds things; the old
-- public.teams table is left untouched and is no longer used by the app.
--
-- Weeks start Monday 00:00 UTC. `week` is the date of that Monday,
-- matching lib/weeks.js.

create table if not exists public.weekly_drafts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week date not null check (extract(isodow from week) = 1),
  picks text[] not null check (cardinality(picks) = 4),
  changes integer not null default 0 check (changes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

create index if not exists weekly_drafts_week_idx
  on public.weekly_drafts (week);

-- The database, not the browser, counts changes. The API charges
-- $5 per change from this count, so writing to the table directly
-- cannot reset it.
create or replace function public.weekly_drafts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.changes := 0;
    new.created_at := now();
  else
    if new.user_id <> old.user_id or new.week <> old.week then
      raise exception 'A squad cannot move to another scout or week.';
    end if;

    if (select array_agg(p order by p) from unnest(new.picks) as p)
       is distinct from
       (select array_agg(p order by p) from unnest(old.picks) as p) then
      new.changes := old.changes + 1;
    else
      new.changes := old.changes;
    end if;

    new.created_at := old.created_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists weekly_drafts_guard on public.weekly_drafts;

create trigger weekly_drafts_guard
  before insert or update on public.weekly_drafts
  for each row execute function public.weekly_drafts_guard();

alter table public.weekly_drafts enable row level security;

drop policy if exists "Signed-in scouts can read weekly squads" on public.weekly_drafts;
create policy "Signed-in scouts can read weekly squads"
  on public.weekly_drafts for select
  to authenticated
  using (true);

drop policy if exists "Scouts draft for themselves this week" on public.weekly_drafts;
create policy "Scouts draft for themselves this week"
  on public.weekly_drafts for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and week = date_trunc('week', now() at time zone 'utc')::date
  );

drop policy if exists "Scouts change only this week's squad" on public.weekly_drafts;
create policy "Scouts change only this week's squad"
  on public.weekly_drafts for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and week = date_trunc('week', now() at time zone 'utc')::date
  )
  with check (
    user_id = (select auth.uid())
    and week = date_trunc('week', now() at time zone 'utc')::date
  );

-- No delete policy: a locked squad cannot be removed to dodge the fee.
