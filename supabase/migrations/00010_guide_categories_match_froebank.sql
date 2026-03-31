-- Update plant_guides category to match frøbank primary categories
-- Drop old constraint
ALTER TABLE public.plant_guides DROP CONSTRAINT IF EXISTS plant_guides_category_check;

-- Add new constraint matching frøbank niveau 1
ALTER TABLE public.plant_guides ADD CONSTRAINT plant_guides_category_check
  CHECK (category IN ('froe', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste'));

-- Migrate existing data
UPDATE public.plant_guides SET category = 'froe' WHERE category = 'vegetable';
UPDATE public.plant_guides SET category = 'froe' WHERE category = 'herb';
UPDATE public.plant_guides SET category = 'froe' WHERE category = 'flower';
UPDATE public.plant_guides SET category = 'froe' WHERE category = 'fruit';
