-- STAFF B2.3 R8 — Team/Roster Consolidation
-- Eseguire una sola volta nel SQL Editor di Supabase PRIMA di installare la release R8.
--
-- Regola di dominio:
-- una Rosa vuota puo essere una Rosa valida gia inizializzata.
-- Il fallback legacy Mezzolara e ammesso soltanto per la vecchia squadra non ancora migrata.

alter table public.teams
  add column if not exists roster_initialized boolean not null default true;

-- Compatibilita con la sola squadra Mezzolara pre-R7 ancora priva di record persistenti.
-- Le squadre nuove partono invece con roster_initialized = true e quindi Rosa realmente vuota.
update public.teams t
set roster_initialized = false
where (
  lower(coalesce(t.name, '')) like '%mezzolara%'
  or lower(coalesce(t.short_name, '')) like '%mezzolara%'
)
and not exists (
  select 1
  from public.team_players tp
  where tp.team_id = t.id
);

comment on column public.teams.roster_initialized is
  'True once the team roster is authoritative in team_players. Prevents legacy fallback from reappearing for an intentionally empty roster.';
