alter table public.match_gps_player_metrics
  add column if not exists minutes_played integer
  check (minutes_played is null or minutes_played >= 0);

comment on column public.match_gps_player_metrics.minutes_played is
  'Real match minutes imported from the GPS workbook; contextual exposure data, not an activity-presence signal.';

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
    minutes_played,
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
    row_data.minutes_played,
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
    minutes_played integer,
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

revoke all on function public.replace_match_gps_import(
  uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb
) from public, anon;

grant execute on function public.replace_match_gps_import(
  uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb
) to authenticated;