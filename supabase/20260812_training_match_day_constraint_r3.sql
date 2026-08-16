-- STAFF 0.26.4-R3
-- Allinea il vincolo DB events.match_day al dominio Training corrente.
-- events.match_day appartiene esclusivamente al Training domain.

begin;

alter table public.events
  drop constraint if exists events_match_day_check;

alter table public.events
  add constraint events_match_day_check
  check (
    match_day is null
    or match_day in (
      'PREPARAZIONE',
      'MD+1', 'MD+2', 'MD+3',
      'MD-3', 'MD-2', 'MD-1',
      'MD'
    )
  );

commit;
