-- STAFF 0.20.0 · Analysis Template Engine
-- Template personali per utente, scoped alla squadra.

create table if not exists public.analysis_templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  schema_version integer not null default 2 check (schema_version > 0),
  schema_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists analysis_templates_owner_team_name_uidx
  on public.analysis_templates(owner_user_id, team_id, lower(name));

create index if not exists analysis_templates_team_owner_idx
  on public.analysis_templates(team_id, owner_user_id);

alter table public.analysis_templates enable row level security;

drop policy if exists analysis_templates_select_own on public.analysis_templates;
create policy analysis_templates_select_own
  on public.analysis_templates
  for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    and (
      exists (
        select 1 from public.team_members tm
        where tm.team_id = analysis_templates.team_id
          and tm.user_id = auth.uid()
          and tm.active = true
      )
      or exists (
        select 1 from public.teams t
        where t.id = analysis_templates.team_id
          and t.owner_id = auth.uid()
      )
    )
  );

drop policy if exists analysis_templates_insert_own on public.analysis_templates;
create policy analysis_templates_insert_own
  on public.analysis_templates
  for insert
  to authenticated
  with check (
    owner_user_id = auth.uid()
    and (
      exists (
        select 1 from public.team_members tm
        where tm.team_id = analysis_templates.team_id
          and tm.user_id = auth.uid()
          and tm.active = true
      )
      or exists (
        select 1 from public.teams t
        where t.id = analysis_templates.team_id
          and t.owner_id = auth.uid()
      )
    )
  );

drop policy if exists analysis_templates_update_own on public.analysis_templates;
create policy analysis_templates_update_own
  on public.analysis_templates
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists analysis_templates_delete_own on public.analysis_templates;
create policy analysis_templates_delete_own
  on public.analysis_templates
  for delete
  to authenticated
  using (owner_user_id = auth.uid());
