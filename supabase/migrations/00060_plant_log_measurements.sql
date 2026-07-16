-- 00060: Trivsel + højde som ÆGTE logdata (generelt observations-lag)
--
-- Trivsel og højde vises på plantekortet, men kunne ikke registreres — de blev
-- udledt (trivsel fra status, højde hardcodet "Ikke målt"). Nu bliver de rigtige
-- plante-logs med værdi og dato, så Havebogen bevarer udviklingen over tid
-- (12 cm i maj → 85 cm i juli).
--
-- Datamodel (Anna 16/7): rene værdikolonner frem for genbrug af `title`.
--   value_numeric — målinger: højde (cm) nu; temp/pH/fugtighed senere.
--   value_text    — enum-tilstande: trivsel ('good'|'okay'|'attention').
-- Ét generelt observationssystem, ikke en særregel pr. felt.

ALTER TABLE public.plant_logs_v2
  ADD COLUMN IF NOT EXISTS value_numeric numeric NULL,
  ADD COLUMN IF NOT EXISTS value_text    text    NULL;

-- To nye logtyper: 'health' (trivsel) og 'height_measurement' (måling).
ALTER TABLE public.plant_logs_v2
  DROP CONSTRAINT IF EXISTS plant_logs_v2_type_check;
ALTER TABLE public.plant_logs_v2
  ADD CONSTRAINT plant_logs_v2_type_check CHECK (type = ANY (ARRAY[
    'sowing','germination','repotting','planting_out','watering',
    'fertilizing','pruning','pest_disease','harvest','note',
    'status_change','archive','health','height_measurement'
  ]::text[]));

-- Trivsel er en enum, ikke fritekst — ellers 47 stavemåder af samme begreb.
-- Håndhæves kun for health-logs; andre typer må have value_text = null.
ALTER TABLE public.plant_logs_v2
  DROP CONSTRAINT IF EXISTS plant_logs_v2_health_value_check;
ALTER TABLE public.plant_logs_v2
  ADD CONSTRAINT plant_logs_v2_health_value_check CHECK (
    type <> 'health' OR value_text = ANY (ARRAY['good','okay','attention']::text[])
  );

-- En højdemåling giver kun mening med et tal.
ALTER TABLE public.plant_logs_v2
  DROP CONSTRAINT IF EXISTS plant_logs_v2_height_value_check;
ALTER TABLE public.plant_logs_v2
  ADD CONSTRAINT plant_logs_v2_height_value_check CHECK (
    type <> 'height_measurement' OR value_numeric IS NOT NULL
  );
