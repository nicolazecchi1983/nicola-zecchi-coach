-- STAFF 0.26.4-R1 — Security / RLS Hardening R2
-- Scope: close live-audit findings without changing product workflows.
-- Apply in Supabase SQL Editor only after the 0.26.4-R1 code package has been validated locally.

begin;

-- ---------------------------------------------------------------------------
-- 1. ANALYSIS TEMPLATES — owner + active team access on every mutation
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. SHARED TEAM RESOLUTION — fail closed when a user has ambiguous context
-- ---------------------------------------------------------------------------
create or replace function public.current_user_single_team_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with accessible as (
    select t.id as team_id
    from public.teams t
    where t.owner_id = auth.uid()
    union
    select tm.team_id
    from public.team_members tm
    where tm.user_id = auth.uid()
      and tm.active = true
  ), resolved as (
    select count(*) as team_count,
           (array_agg(team_id order by team_id))[1] as team_id
    from accessible
  )
  select case when team_count = 1 then team_id else null end
  from resolved;
$$;

revoke all on function public.current_user_single_team_id() from public;
grant execute on function public.current_user_single_team_id() to authenticated;

create or replace function public.current_user_shares_team_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with requester_teams as (
    select t.id as team_id
    from public.teams t
    where t.owner_id = auth.uid()
    union
    select tm.team_id
    from public.team_members tm
    where tm.user_id = auth.uid()
      and tm.active = true
  ), target_teams as (
    select t.id as team_id
    from public.teams t
    where t.owner_id = target_user_id
    union
    select tm.team_id
    from public.team_members tm
    where tm.user_id = target_user_id
      and tm.active = true
  )
  select exists (
    select 1
    from requester_teams r
    join target_teams t using (team_id)
  );
$$;

revoke all on function public.current_user_shares_team_with_user(uuid) from public;
grant execute on function public.current_user_shares_team_with_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. MATCH ANALYSIS — add canonical team ownership without breaking old INSERTs
-- ---------------------------------------------------------------------------
alter table public.match_analysis
  add column if not exists team_id uuid references public.teams(id) on delete cascade;

create index if not exists match_analysis_team_id_idx
  on public.match_analysis(team_id);

-- Existing STAFF installations are mono-team. Backfill automatically only when
-- the database itself contains exactly one team; otherwise leave legacy rows
-- unassigned and visible only to an owner until they are assigned explicitly.
do $$
declare
  only_team_id uuid;
begin
  select case
    when count(*) = 1 then (array_agg(id order by id))[1]
    else null
  end
  into only_team_id
  from public.teams;

  if only_team_id is not null then
    update public.match_analysis
    set team_id = only_team_id
    where team_id is null;
  else
    raise notice 'match_analysis legacy rows not auto-assigned: database contains zero or multiple teams';
  end if;
end $$;

create or replace function public.staff_match_analysis_set_team()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.team_id is null then
    new.team_id := public.current_user_single_team_id();
  end if;

  if new.team_id is null then
    raise exception 'STAFF team context missing or ambiguous for match_analysis';
  end if;

  return new;
end;
$$;

drop trigger if exists staff_match_analysis_set_team on public.match_analysis;
create trigger staff_match_analysis_set_team
before insert on public.match_analysis
for each row execute function public.staff_match_analysis_set_team();

alter table public.match_analysis enable row level security;

drop policy if exists "Staff can read match analysis" on public.match_analysis;
drop policy if exists "Owners can insert match analysis" on public.match_analysis;
drop policy if exists match_analysis_select_team on public.match_analysis;
drop policy if exists match_analysis_insert_team on public.match_analysis;
drop policy if exists match_analysis_update_team on public.match_analysis;
drop policy if exists match_analysis_delete_team on public.match_analysis;

create policy match_analysis_select_team
  on public.match_analysis
  for select
  to authenticated
  using (
    (
      team_id is not null
      and (
        public.current_user_is_team_member(team_id)
        or public.current_user_is_team_owner(team_id)
      )
    )
    or (team_id is null and public.is_owner())
  );

create policy match_analysis_insert_team
  on public.match_analysis
  for insert
  to authenticated
  with check (
    team_id is not null
    and public.current_user_can_edit_team(team_id)
  );

create policy match_analysis_update_team
  on public.match_analysis
  for update
  to authenticated
  using (
    (team_id is not null and public.current_user_can_edit_team(team_id))
    or (team_id is null and public.is_owner())
  )
  with check (
    team_id is not null
    and public.current_user_can_edit_team(team_id)
  );

create policy match_analysis_delete_team
  on public.match_analysis
  for delete
  to authenticated
  using (
    (team_id is not null and public.current_user_can_edit_team(team_id))
    or (team_id is null and public.is_owner())
  );

-- ---------------------------------------------------------------------------
-- 4. PLAYER PROFILES — scope reads/writes through canonical player -> team FK
-- ---------------------------------------------------------------------------
alter table public.player_profiles enable row level security;

drop policy if exists "Authenticated staff can read player profiles" on public.player_profiles;
drop policy if exists "Administrators can manage player profiles" on public.player_profiles;
drop policy if exists player_profiles_select_team on public.player_profiles;
drop policy if exists player_profiles_insert_team on public.player_profiles;
drop policy if exists player_profiles_update_team on public.player_profiles;
drop policy if exists player_profiles_delete_team on public.player_profiles;

create policy player_profiles_select_team
  on public.player_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.team_players tp
      where tp.id = player_profiles.player_id
        and (
          public.current_user_is_team_member(tp.team_id)
          or public.current_user_is_team_owner(tp.team_id)
        )
    )
    or (player_id is null and public.is_owner())
  );

create policy player_profiles_insert_team
  on public.player_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.team_players tp
      where tp.id = player_profiles.player_id
        and public.current_user_can_edit_team(tp.team_id)
    )
    or (player_id is null and public.is_owner())
  );

create policy player_profiles_update_team
  on public.player_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.team_players tp
      where tp.id = player_profiles.player_id
        and public.current_user_can_edit_team(tp.team_id)
    )
    or (player_id is null and public.is_owner())
  )
  with check (
    exists (
      select 1
      from public.team_players tp
      where tp.id = player_profiles.player_id
        and public.current_user_can_edit_team(tp.team_id)
    )
    or (player_id is null and public.is_owner())
  );

create policy player_profiles_delete_team
  on public.player_profiles
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.team_players tp
      where tp.id = player_profiles.player_id
        and public.current_user_can_edit_team(tp.team_id)
    )
    or (player_id is null and public.is_owner())
  );

-- ---------------------------------------------------------------------------
-- 5. PROFILES — remove global authenticated reads and hard-coded owner bypass
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists profiles_read_authenticated on public.profiles;
drop policy if exists profiles_team_read on public.profiles;

create policy profiles_team_read
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_shares_team_with_user(id)
  );

-- Direct UPDATE is retained only for the current user's own row. Staff
-- administration already goes through the canonical admin_update_staff_profile RPC.
drop policy if exists "Owner can update profiles" on public.profiles;
drop policy if exists profiles_owner_update_all on public.profiles;

-- Guard self-service UPDATEs against role/access escalation while preserving
-- first/last name edits used by update_my_profile.
create or replace function public.staff_profiles_self_update_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and old.id = auth.uid() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.app_role is distinct from old.app_role
      or new.active is distinct from old.active then
      raise exception 'Self-service profile update cannot change identity, role, access role, email or active status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_profiles_self_update_guard on public.profiles;
create trigger staff_profiles_self_update_guard
before update on public.profiles
for each row execute function public.staff_profiles_self_update_guard();

commit;
