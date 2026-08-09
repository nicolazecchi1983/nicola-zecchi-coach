-- STAFF B2.3 R11 — Team Facilities Foundation
-- Eseguire una sola volta nel SQL Editor di Supabase PRIMA di installare R11.

create extension if not exists pgcrypto;

create table if not exists public.team_facilities (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_facilities_team_active_idx
  on public.team_facilities (team_id, active);

create unique index if not exists team_facilities_team_name_active_unique
  on public.team_facilities (team_id, lower(btrim(name)))
  where active = true;

alter table public.team_facilities enable row level security;

drop policy if exists "team_facilities_select_team" on public.team_facilities;
create policy "team_facilities_select_team"
on public.team_facilities
for select
to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_facilities.team_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.team_members tm
    where tm.team_id = team_facilities.team_id
      and tm.user_id = auth.uid()
      and tm.active = true
  )
);

drop policy if exists "team_facilities_write_team" on public.team_facilities;
create policy "team_facilities_write_team"
on public.team_facilities
for all
to authenticated
using (
  (
    exists (select 1 from public.teams t where t.id = team_facilities.team_id and t.owner_id = auth.uid())
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_facilities.team_id
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
    exists (select 1 from public.teams t where t.id = team_facilities.team_id and t.owner_id = auth.uid())
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_facilities.team_id
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

create or replace function public.replace_team_facilities(p_team_id uuid, p_names text[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name text;
  v_existing uuid;
begin
  if p_team_id is null then
    raise exception 'team_id richiesto';
  end if;

  -- Soft-delete prima: la sostituzione è atomica perché la funzione gira in una singola transazione.
  update public.team_facilities
  set active = false, updated_at = now()
  where team_id = p_team_id and active = true;

  for v_name in
    select distinct btrim(value)
    from unnest(coalesce(p_names, array[]::text[])) as value
    where btrim(value) <> '' and length(btrim(value)) <= 100
  loop
    select id into v_existing
    from public.team_facilities
    where team_id = p_team_id
      and lower(btrim(name)) = lower(v_name)
    order by active desc, updated_at desc
    limit 1;

    if v_existing is not null then
      update public.team_facilities
      set name = v_name, active = true, updated_at = now()
      where id = v_existing;
    else
      insert into public.team_facilities (team_id, name, active)
      values (p_team_id, v_name, true);
    end if;

    v_existing := null;
  end loop;
end;
$$;

-- Migrazione di compatibilità limitata alla squadra legacy già esistente.
-- Serve solo a non lasciare vuoto il menu al primo avvio R11; non è logica runtime del prodotto.
insert into public.team_facilities (team_id, name)
select t.id, seed.name
from public.teams t
cross join (values ('Mezzolara'), ('Budrio')) as seed(name)
where lower(coalesce(t.name, '')) like '%mezzolara%'
  and not exists (
    select 1 from public.team_facilities tf
    where tf.team_id = t.id
      and tf.active = true
      and lower(btrim(tf.name)) = lower(seed.name)
  );
