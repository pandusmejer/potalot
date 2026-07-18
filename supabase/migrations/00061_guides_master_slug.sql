-- ============================================================
-- guides_master_slug — stabil menneskelig nøgle på master-rækker
-- ============================================================
-- DB-tabellen public.guides bruger tilfældige UUID'er som id. Den statiske
-- IMPORTED_GUIDES-kilde bruger slug ("tomat-sungold") som id. For at kunne
-- spejle masters idempotent ind i DB (én master pr. slug) mangler vi en stabil
-- nøgle. Denne migration tilføjer den.
--
-- Additiv og ikke-destruktiv: bruger-guides beholder slug = NULL og røres ikke.
-- Slug er kun meningsfuld for master-rækker (user_id IS NULL) — derfor et
-- PARTIELT unikt indeks, så to masters aldrig kan dele slug, mens bruger-rækker
-- (alle slug = NULL) er urørte.
-- Se: Docs/product/guides-master-sync-spec.md §4
-- ============================================================

ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guides_master_slug
  ON public.guides (slug)
  WHERE user_id IS NULL AND slug IS NOT NULL;
