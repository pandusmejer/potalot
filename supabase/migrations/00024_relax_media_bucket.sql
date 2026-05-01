-- Løsn restriktioner på media-bucketten:
-- - Tillad alle billed-formater (HEIC fra iPhone, m.fl.) — server-action
--   afviser stadig non-image
-- - 10 MB i stedet for 5 MB (rå iPhone-fotos kan være 6-8 MB)

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = NULL
WHERE id = 'media';
