-- Preserve existing four-pick squads.
-- Require five picks for new or updated squads.
begin;

alter table public.weekly_drafts
  drop constraint if exists weekly_drafts_picks_check;

alter table public.weekly_drafts
  add constraint weekly_drafts_picks_check
  check (cardinality(picks) = 5)
  not valid;

notify pgrst, 'reload schema';

commit;
