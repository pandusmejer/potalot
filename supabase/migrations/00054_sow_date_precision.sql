-- Track the precision of a plant's sow_date so an approximate month is never
-- stored as an apparently-precise day. Preserves the user's intent:
--   'exact'   = user gave a precise date
--   'approx'  = month-level; the day component is filler (first of month)
--   'unknown' = user stated they don't know (sow_date is NULL)
--   NULL      = legacy row / provenance not recorded (treat as unspecified)
ALTER TABLE public.plants_v2
  ADD COLUMN IF NOT EXISTS sow_date_precision TEXT;

ALTER TABLE public.plants_v2
  DROP CONSTRAINT IF EXISTS plants_v2_sow_date_precision_check;

ALTER TABLE public.plants_v2
  ADD CONSTRAINT plants_v2_sow_date_precision_check
  CHECK (sow_date_precision IS NULL OR sow_date_precision IN ('exact', 'approx', 'unknown'));
