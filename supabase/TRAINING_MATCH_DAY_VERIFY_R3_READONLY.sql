select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.events'::regclass
  and conname = 'events_match_day_check';
