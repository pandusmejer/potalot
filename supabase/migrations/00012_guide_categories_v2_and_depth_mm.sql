-- 1. Add depth_mm column (NOT NULL, default 0)
ALTER TABLE public.plant_guides
  ADD COLUMN IF NOT EXISTS depth_mm INTEGER NOT NULL DEFAULT 0;

-- 2. Migrate existing depth_cm data to depth_mm (cm → mm)
UPDATE public.plant_guides
SET depth_mm = ROUND(depth_cm * 10)::INTEGER
WHERE depth_cm IS NOT NULL AND depth_cm > 0;

-- 3. Migrate existing guide categories to new system
UPDATE public.plant_guides SET category = 'groentsager' WHERE category IN ('froe', 'loeg', 'knolde');
UPDATE public.plant_guides SET category = 'buske' WHERE category = 'buske';
UPDATE public.plant_guides SET category = 'traeer' WHERE category = 'traeer';
UPDATE public.plant_guides SET category = 'stauder' WHERE category = 'stauder';

-- 4. Drop old constraint and add new one with new categories
ALTER TABLE public.plant_guides
  DROP CONSTRAINT IF EXISTS plant_guides_category_check;

ALTER TABLE public.plant_guides
  ADD CONSTRAINT plant_guides_category_check
  CHECK (category IN (
    'groentsager', 'stauder', 'krydderurter', 'graesser',
    'traeer', 'buske', 'frugt', 'baer',
    'blomster_1aarige', 'blomster_fleraarige'
  ));
