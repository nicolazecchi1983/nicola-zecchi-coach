-- STAFF 0.26.4-R1 — post-hardening verification (READ ONLY)

-- Sensitive table policies: no authenticated USING(true) should remain on
-- match_analysis, player_profiles or profiles.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('analysis_templates', 'match_analysis', 'player_profiles', 'profiles')
order by tablename, cmd, policyname;

-- match_analysis must now have canonical team ownership and automatic assignment.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'match_analysis'
  and column_name = 'team_id';

select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('match_analysis', 'profiles')
order by event_object_table, trigger_name;

-- Legacy rows still needing assignment are surfaced explicitly.
select count(*) as unassigned_match_analysis_rows
from public.match_analysis
where team_id is null;

-- Verify helper functions are SECURITY DEFINER and executable by authenticated.
select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('current_user_single_team_id', 'current_user_shares_team_with_user')
order by p.proname;
