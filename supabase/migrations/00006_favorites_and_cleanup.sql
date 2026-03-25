-- Migration 00006: Add favorites/pin and clean up primary_category
-- Adds is_favorite and is_pinned to seeds table
-- Updates primary_category constraint

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Update primary_category constraint: remove aktive_planter
ALTER TABLE public.seeds DROP CONSTRAINT IF EXISTS seeds_primary_category_check;
ALTER TABLE public.seeds
  ADD CONSTRAINT seeds_primary_category_check
  CHECK (primary_category IN (
    'froe', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste'
  ));

-- Index for fast favorite queries
CREATE INDEX IF NOT EXISTS idx_seeds_favorite ON public.seeds (user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_seeds_pinned ON public.seeds (user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_seeds_primary_category ON public.seeds (user_id, primary_category);
