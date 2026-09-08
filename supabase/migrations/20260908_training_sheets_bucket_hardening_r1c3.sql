-- R1C3: finalize Training Storage after Match cutover.
-- New Training uploads are PDF-only and capped at 25 MiB.
-- Existing objects are intentionally preserved; this migration performs no object delete/update.
update storage.buckets
set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['application/pdf']::text[]
where id = 'training-sheets';
