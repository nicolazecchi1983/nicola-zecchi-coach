-- STAFF B2.3 R7 — Team & Roster Foundation
-- Eseguire una sola volta nel SQL Editor di Supabase.

create extension if not exists pgcrypto;

create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_key text not null,
  full_name text not null,
  initials text,
  role text not null check (role in ('Portiere','Difensore','Centrocampista','Attaccante')),
  birth_year integer,
  preferred_foot text check (preferred_foot is null or preferred_foot in ('DX','SX','AMB')),
  status text not null default 'Disponibile',
  shirt_number integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_players_team_key_unique unique (team_id, player_key)
);

create index if not exists team_players_team_active_idx
  on public.team_players (team_id, active);

alter table public.team_players enable row level security;

drop policy if exists "team_players_select_team" on public.team_players;
create policy "team_players_select_team"
on public.team_players
for select
to authenticated
using (
  exists (
    select 1
    from public.teams t
    where t.id = team_players.team_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.team_members tm
    where tm.team_id = team_players.team_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
);

drop policy if exists "team_players_write_team" on public.team_players;
create policy "team_players_write_team"
on public.team_players
for all
to authenticated
using (
  (
    exists (
      select 1 from public.teams t
      where t.id = team_players.team_id and t.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_players.team_id
        and tm.user_id = auth.uid()
        and tm.active = true
    )
  )
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.app_role in ('owner','admin','collaborator')
  )
)
with check (
  (
    exists (
      select 1 from public.teams t
      where t.id = team_players.team_id and t.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_players.team_id
        and tm.user_id = auth.uid()
        and tm.active = true
    )
  )
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.app_role in ('owner','admin','collaborator')
  )
);
