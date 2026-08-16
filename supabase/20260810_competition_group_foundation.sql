-- STAFF B2.7 M2.1 — Competition Group Foundation
-- Eseguire una sola volta nel SQL Editor di Supabase prima di usare il campo Girone.

alter table public.teams
  add column if not exists competition_group text;

comment on column public.teams.competition_group is
  'Girone della competizione per la stagione corrente (es. E). Metadato di squadra/stagione, non hardcoded nella UI.';
