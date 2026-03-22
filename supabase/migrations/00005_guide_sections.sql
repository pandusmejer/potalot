-- Dyrkningsguide fase 3: Prosa-sektioner for artikel-format

ALTER TABLE public.plant_guides
  ADD COLUMN IF NOT EXISTS sowing_info TEXT,
  ADD COLUMN IF NOT EXISTS repotting_info TEXT,
  ADD COLUMN IF NOT EXISTS planting_out_info TEXT,
  ADD COLUMN IF NOT EXISTS care_info TEXT,
  ADD COLUMN IF NOT EXISTS environment_info TEXT,
  ADD COLUMN IF NOT EXISTS biology_info TEXT,
  ADD COLUMN IF NOT EXISTS seed_type TEXT,
  ADD COLUMN IF NOT EXISTS seed_harvest_possible BOOLEAN,
  ADD COLUMN IF NOT EXISTS common_mistakes TEXT,
  ADD COLUMN IF NOT EXISTS warnings TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update category check to include more types
ALTER TABLE public.plant_guides DROP CONSTRAINT IF EXISTS plant_guides_category_check;
ALTER TABLE public.plant_guides
  ADD CONSTRAINT plant_guides_category_check
  CHECK (category IN ('vegetable', 'herb', 'flower', 'fruit', 'grass', 'berry', 'ornamental'));
