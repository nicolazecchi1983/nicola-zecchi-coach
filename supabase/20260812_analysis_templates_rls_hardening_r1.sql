-- STAFF 0.26.4 — Analysis Templates RLS Hardening R1
-- Safe hardening: UPDATE/DELETE must keep the same team-access rule used by SELECT/INSERT.
-- Execute once in Supabase SQL Editor after validating 0.26.4 locally.

alter table public.analysis_templates enable row level security;

drop policy if exists analysis_templates_update_own on public.analysis_templates;
create policy analysis_templates_update_own
  on public.analysis_templates
  for update
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
  )
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

drop policy if exists analysis_templates_delete_own on public.analysis_templates;
create policy analysis_templates_delete_own
  on public.analysis_templates
  for delete
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
