-- STAFF B2.3 R13 — Player Profile Identity
-- Canonical relation: player_profiles.player_id -> team_players.id
-- player_key remains legacy compatibility metadata only.

alter table public.player_profiles
  add column if not exists player_id uuid;

-- Backfill 1: R9 persistent profiles already stored the team_players UUID
-- inside the historical player_key field.
update public.player_profiles pp
set player_id = tp.id
from public.team_players tp
where pp.player_id is null
  and pp.player_key = tp.id::text;

-- Backfill 2: older slug-based profiles may be linked only when that
-- legacy key identifies exactly one team_players row globally.
with unique_legacy_keys as (
  select player_key, min(id::text)::uuid as player_id
  from public.team_players
  where player_key is not null
  group by player_key
  having count(*) = 1
)
update public.player_profiles pp
set player_id = u.player_id
from unique_legacy_keys u
where pp.player_id is null
  and pp.player_key = u.player_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_profiles_player_id_fkey'
      and conrelid = 'public.player_profiles'::regclass
  ) then
    alter table public.player_profiles
      add constraint player_profiles_player_id_fkey
      foreign key (player_id)
      references public.team_players(id)
      on delete restrict;
  end if;
end $$;

-- PostgreSQL UNIQUE allows multiple NULL values, preserving unresolved
-- legacy rows while guaranteeing one canonical profile per persistent player.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_profiles_player_id_key'
      and conrelid = 'public.player_profiles'::regclass
  ) then
    alter table public.player_profiles
      add constraint player_profiles_player_id_key unique (player_id);
  end if;
end $$;

create index if not exists player_profiles_player_id_idx
  on public.player_profiles (player_id);

comment on column public.player_profiles.player_id is
  'Canonical player profile identity. References team_players.id. player_key is legacy compatibility only.';
