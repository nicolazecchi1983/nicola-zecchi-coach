-- STAFF 0.26.4 — SECURITY / RLS AUDIT (READ ONLY)
-- This script changes nothing. Run in Supabase SQL Editor and export/copy the result.

with app_tables(table_name) as (
  values
    ('analysis_templates'),
    ('events'),
    ('match_analysis'),
    ('player_profiles'),
    ('profiles'),
    ('team_facilities'),
    ('team_members'),
    ('team_players'),
    ('teams'),
    ('training_sheet_drafts')
), table_security as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls,
    count(p.policyname) as policy_count,
    string_agg(distinct concat(p.cmd, ':', p.policyname), ', ' order by concat(p.cmd, ':', p.policyname)) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (select table_name from app_tables)
  group by c.relname, c.relrowsecurity, c.relforcerowsecurity
)
select
  a.table_name,
  coalesce(s.rls_enabled, false) as rls_enabled,
  coalesce(s.force_rls, false) as force_rls,
  coalesce(s.policy_count, 0) as policy_count,
  coalesce(s.policies, 'NO POLICIES / TABLE NOT FOUND') as policies
from app_tables a
left join table_security s using (table_name)
order by a.table_name;

-- Storage buckets used by STAFF. Public means file downloads bypass access control.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('team-assets', 'training-sheets')
   or name in ('team-assets', 'training-sheets')
order by name;

-- Storage policies currently installed.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
