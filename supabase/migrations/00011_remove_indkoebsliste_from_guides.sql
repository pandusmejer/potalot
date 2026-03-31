-- Remove 'indkoebsliste' from guide categories (keep only in frøbank/seeds)
-- First migrate any existing guides with indkoebsliste to 'froe'
UPDATE public.plant_guides
SET category = 'froe'
WHERE category = 'indkoebsliste';

-- Drop old constraint and add new one without indkoebsliste
ALTER TABLE public.plant_guides
  DROP CONSTRAINT IF EXISTS plant_guides_category_check;

ALTER TABLE public.plant_guides
  ADD CONSTRAINT plant_guides_category_check
  CHECK (category IN ('froe', 'loeg', 'knolde', 'buske', 'traeer', 'stauder'));
