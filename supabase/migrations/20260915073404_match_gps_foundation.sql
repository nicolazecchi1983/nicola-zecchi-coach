-- STAFF R3.1 — Match GPS Excel Foundation
-- One current, atomic GPS import per canonical Calendar match.

create extension if not exists pgcrypto;

-- Composite keys make team ownership part of referential integrity instead of
-- relying only on client filters or RLS predicates.
create unique index if not exists events_id_team_type_uidx
  on public.events (id, team_id, event_type);

create unique index if not exists team_players_id_team_uidx
  on public.team_players (id, team_id);

create table if not exists public.match_gps_imports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  event_id uuid not null,
  event_type text not null default 'match' check (event_type = 'match'),
  schema_version integer not null default 1 check (schema_version > 0),
  source_file_name text not null check (char_length(btrim(source_file_name)) between 1 and 255),
  source_sheet_name text not null check (char_length(btrim(source_sheet_name)) between 1 and 120),
  source_header_row integer not null check (source_header_row > 0),
  source_headers jsonb not null default '[]'::jsonb check (jsonb_typeof(source_headers) = 'array'),
  source_row_count integer not null default 0 check (source_row_count >= 0),
  imported_by uuid default auth.uid() references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_gps_imports_team_event_unique unique (team_id, event_id),
  constraint match_gps_imports_event_team_type_fkey
    foreign key (event_id, team_id, event_type)
    references public.events(id, team_id, event_type)
    on delete cascade
);

create unique index if not exists match_gps_imports_id_team_uidx
  on public.match_gps_imports (id, team_id);

create table if not exists public.match_gps_player_metrics (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null,
  team_id uuid not null,
  player_id uuid not null,
  source_row integer not null check (source_row > 0),
  source_ordinal integer check (source_ordinal is null or source_ordinal > 0),
  source_player_name text not null check (char_length(btrim(source_player_name)) between 1 and 180),
  source_birth_date date,
  resting_heart_rate smallint check (resting_heart_rate is null or resting_heart_rate >= 0),
  max_heart_rate smallint check (max_heart_rate is null or max_heart_rate >= 0),
  max_speed_ms numeric check (max_speed_ms is null or max_speed_ms >= 0),
  distance_max_speed_km numeric check (distance_max_speed_km is null or distance_max_speed_km >= 0),
  average_speed numeric check (average_speed is null or average_speed >= 0),
  acceleration_ms2 numeric check (acceleration_ms2 is null or acceleration_ms2 >= 0),
  acceleration_count integer check (acceleration_count is null or acceleration_count >= 0),
  deceleration_count integer check (deceleration_count is null or deceleration_count >= 0),
  distance_km numeric check (distance_km is null or distance_km >= 0),
  source_values jsonb not null default '{}'::jsonb check (jsonb_typeof(source_values) = 'object'),
  created_at timestamptz not null default now(),
  constraint match_gps_player_metrics_import_team_fkey
    foreign key (import_id, team_id)
    references public.match_gps_imports(id, team_id)
    on delete cascade,
  constraint match_gps_player_metrics_player_team_fkey
    foreign key (player_id, team_id)
    references public.team_players(id, team_id)
    on delete restrict,
  constraint match_gps_player_metrics_import_player_unique unique (import_id, player_id)
);

create index if not exists match_gps_player_metrics_team_player_idx
  on public.match_gps_player_metrics (team_id, player_id);

alter table public.match_gps_imports enable row level security;
alter table public.match_gps_player_metrics enable row level security;

drop policy if exists match_gps_imports_select_team on public.match_gps_imports;
create policy match_gps_imports_select_team
  on public.match_gps_imports
  for select
  to authenticated
  using (team_id in (select public.current_user_team_ids()));

drop policy if exists match_gps_imports_insert_team on public.match_gps_imports;
create policy match_gps_imports_insert_team
  on public.match_gps_imports
  for insert
  to authenticated
  with check (
    public.current_user_can_edit_team(team_id)
    and imported_by = (select auth.uid())
  );

drop policy if exists match_gps_imports_update_team on public.match_gps_imports;
create policy match_gps_imports_update_team
  on public.match_gps_imports
  for update
  to authenticated
  using (public.current_user_can_edit_team(team_id))
  with check (
    public.current_user_can_edit_team(team_id)
    and imported_by = (select auth.uid())
  );

drop policy if exists match_gps_imports_delete_team on public.match_gps_imports;
create policy match_gps_imports_delete_team
  on public.match_gps_imports
  for delete
  to authenticated
  using (public.current_user_can_edit_team(team_id));

drop policy if exists match_gps_player_metrics_select_team on public.match_gps_player_metrics;
create policy match_gps_player_metrics_select_team
  on public.match_gps_player_metrics
  for select
  to authenticated
  using (team_id in (select public.current_user_team_ids()));

drop policy if exists match_gps_player_metrics_insert_team on public.match_gps_player_metrics;
create policy match_gps_player_metrics_insert_team
  on public.match_gps_player_metrics
  for insert
  to authenticated
  with check (public.current_user_can_edit_team(team_id));

drop policy if exists match_gps_player_metrics_update_team on public.match_gps_player_metrics;
create policy match_gps_player_metrics_update_team
  on public.match_gps_player_metrics
  for update
  to authenticated
  using (public.current_user_can_edit_team(team_id))
  with check (public.current_user_can_edit_team(team_id));

drop policy if exists match_gps_player_metrics_delete_team on public.match_gps_player_metrics;
create policy match_gps_player_metrics_delete_team
  on public.match_gps_player_metrics
  for delete
  to authenticated
  using (public.current_user_can_edit_team(team_id));

-- Explicit Data API grants are required for newly created public tables.
grant select, insert, update, delete on public.match_gps_imports to authenticated;
grant select, insert, update, delete on public.match_gps_player_metrics to authenticated;

create or replace function public.replace_match_gps_import(
  p_team_id uuid,
  p_event_id uuid,
  p_schema_version integer,
  p_source_file_name text,
  p_source_sheet_name text,
  p_source_header_row integer,
  p_source_headers jsonb,
  p_source_row_count integer,
  p_rows jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_import_id uuid;
  v_row_count integer;
begin
  if not public.current_user_can_edit_team(p_team_id) then
    raise exception 'MATCH_GPS_FORBIDDEN' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.team_id = p_team_id
      and e.event_type = 'match'
  ) then
    raise exception 'MATCH_GPS_EVENT_INVALID' using errcode = '23514';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'MATCH_GPS_ROWS_INVALID' using errcode = '22023';
  end if;

  v_row_count := jsonb_array_length(p_rows);
  if v_row_count < 1 or v_row_count > 100 then
    raise exception 'MATCH_GPS_ROWS_OUT_OF_RANGE' using errcode = '22023';
  end if;

  if (
    select count(distinct row_data.player_id)
    from jsonb_to_recordset(p_rows) as row_data(player_id uuid)
  ) <> v_row_count then
    raise exception 'MATCH_GPS_PLAYER_DUPLICATE' using errcode = '23505';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as row_data(player_id uuid)
    left join public.team_players tp
      on tp.id = row_data.player_id
     and tp.team_id = p_team_id
    where tp.id is null
  ) then
    raise exception 'MATCH_GPS_PLAYER_INVALID' using errcode = '23503';
  end if;

  insert into public.match_gps_imports (
    team_id,
    event_id,
    schema_version,
    source_file_name,
    source_sheet_name,
    source_header_row,
    source_headers,
    source_row_count,
    imported_by,
    imported_at,
    updated_at
  ) values (
    p_team_id,
    p_event_id,
    p_schema_version,
    p_source_file_name,
    p_source_sheet_name,
    p_source_header_row,
    p_source_headers,
    p_source_row_count,
    auth.uid(),
    now(),
    now()
  )
  on conflict (team_id, event_id) do update set
    schema_version = excluded.schema_version,
    source_file_name = excluded.source_file_name,
    source_sheet_name = excluded.source_sheet_name,
    source_header_row = excluded.source_header_row,
    source_headers = excluded.source_headers,
    source_row_count = excluded.source_row_count,
    imported_by = excluded.imported_by,
    imported_at = excluded.imported_at,
    updated_at = excluded.updated_at
  returning id into v_import_id;

  delete from public.match_gps_player_metrics
  where import_id = v_import_id
    and team_id = p_team_id;

  insert into public.match_gps_player_metrics (
    import_id,
    team_id,
    player_id,
    source_row,
    source_ordinal,
    source_player_name,
    source_birth_date,
    resting_heart_rate,
    max_heart_rate,
    max_speed_ms,
    distance_max_speed_km,
    average_speed,
    acceleration_ms2,
    acceleration_count,
    deceleration_count,
    distance_km,
    source_values
  )
  select
    v_import_id,
    p_team_id,
    row_data.player_id,
    row_data.source_row,
    row_data.source_ordinal,
    row_data.source_player_name,
    row_data.source_birth_date,
    row_data.resting_heart_rate,
    row_data.max_heart_rate,
    row_data.max_speed_ms,
    row_data.distance_max_speed_km,
    row_data.average_speed,
    row_data.acceleration_ms2,
    row_data.acceleration_count,
    row_data.deceleration_count,
    row_data.distance_km,
    coalesce(row_data.source_values, '{}'::jsonb)
  from jsonb_to_recordset(p_rows) as row_data(
    player_id uuid,
    source_row integer,
    source_ordinal integer,
    source_player_name text,
    source_birth_date date,
    resting_heart_rate smallint,
    max_heart_rate smallint,
    max_speed_ms numeric,
    distance_max_speed_km numeric,
    average_speed numeric,
    acceleration_ms2 numeric,
    acceleration_count integer,
    deceleration_count integer,
    distance_km numeric,
    source_values jsonb
  );

  return v_import_id;
end;
$$;

revoke all on function public.replace_match_gps_import(uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb) from public, anon;
grant execute on function public.replace_match_gps_import(uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb) to authenticated;

comment on table public.match_gps_imports is
  'Current source metadata for the Excel GPS import linked to one canonical Calendar match.';

comment on table public.match_gps_player_metrics is
  'Typed match GPS metrics linked to canonical team_players identities; source labels and values remain preserved in source_values.';
