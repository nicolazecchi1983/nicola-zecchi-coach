-- R1C phase 1: additive server contract.
-- Apply BEFORE the application switches new Match uploads to these buckets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('match-study-documents', 'match-study-documents', false, 26214400, array['application/*','image/*','text/*']::text[]),
  ('match-study-videos', 'match-study-videos', false, 262144000, array['video/*']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "match study team read" on storage.objects;
create policy "match study team read"
on storage.objects for select to authenticated
using (
  bucket_id in ('match-study-documents','match-study-videos')
  and storage_object_team_id(name) is not null
  and storage_object_team_id(name) in (select current_user_team_ids())
);

drop policy if exists "match study team insert" on storage.objects;
create policy "match study team insert"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('match-study-documents','match-study-videos')
  and storage_object_team_id(name) is not null
  and current_user_can_edit_team(storage_object_team_id(name))
);

drop policy if exists "match study team update" on storage.objects;
create policy "match study team update"
on storage.objects for update to authenticated
using (
  bucket_id in ('match-study-documents','match-study-videos')
  and storage_object_team_id(name) is not null
  and current_user_can_edit_team(storage_object_team_id(name))
)
with check (
  bucket_id in ('match-study-documents','match-study-videos')
  and storage_object_team_id(name) is not null
  and current_user_can_edit_team(storage_object_team_id(name))
);

drop policy if exists "match study team delete" on storage.objects;
create policy "match study team delete"
on storage.objects for delete to authenticated
using (
  bucket_id in ('match-study-documents','match-study-videos')
  and storage_object_team_id(name) is not null
  and current_user_can_edit_team(storage_object_team_id(name))
);
