-- STAFF B2.3 R9 — Player Identity Foundation
-- Eseguire una sola volta nel SQL Editor di Supabase PRIMA di installare la release R9.
--
-- Regola di dominio:
-- l'identita persistente di un giocatore e team_players.id (UUID).
-- Nome e player_key sono attributi/riferimenti legacy e non determinano l'identita.
-- Due giocatori della stessa squadra possono quindi avere lo stesso nome.

alter table public.team_players
  drop constraint if exists team_players_team_key_unique;

-- player_key resta indicizzato per compatibilita e ricerche legacy, ma NON e unico.
create index if not exists team_players_team_player_key_idx
  on public.team_players (team_id, player_key);

comment on column public.team_players.id is
  'Canonical player identity. UUID remains stable when name, number, role or other attributes change.';

comment on column public.team_players.player_key is
  'Legacy/compatibility key derived historically from player name. Not a player identity and not unique from R9 onward.';
