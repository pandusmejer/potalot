-- ============================================================
-- Performance: cache badge-backfill-tidspunkt på profiler
-- ============================================================
-- backfillAllBadges kører 24 SELECT-queries pr. besøg på Havebog.
-- Det er overhead vi kan reducere ved at gemme last_badge_backfill_at
-- og skippe backfill hvis det er <1 time siden sidst.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_badge_backfill_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_backfill
  ON public.profiles(last_badge_backfill_at);
