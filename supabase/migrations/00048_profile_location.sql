-- ============================================================
-- Havens placering — til vejr + natur-signaler
-- ============================================================
-- En haveapp vil have vejr for HAVEN, ikke for hvor telefonen er.
-- Brugeren sætter sin placering i indstillinger (by-søgning →
-- koordinater via Open-Meteo geocoding). Bruges til vejr-chip i
-- topbar og senere frostvarsel, jordtemp-estimat osv.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name TEXT;
