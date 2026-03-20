-- Frøbank upgrade: Categories, quantity tracking, expiry date
-- ============================================

-- Add new columns to seeds table
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS seeds_total INT,
  ADD COLUMN IF NOT EXISTS seeds_sown INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS primary_category TEXT NOT NULL DEFAULT 'froe',
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS plant_type TEXT;

-- Add CHECK constraint for primary_category
ALTER TABLE public.seeds
  ADD CONSTRAINT seeds_primary_category_check
  CHECK (primary_category IN (
    'froe', 'aktive_planter', 'loeg', 'knolde',
    'buske', 'traeer', 'stauder', 'indkoebsliste'
  ));

-- Migrate existing quantity data to seeds_total
UPDATE public.seeds SET seeds_total = quantity WHERE quantity IS NOT NULL AND seeds_total IS NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_seeds_category ON public.seeds(user_id, primary_category);

-- ============================================
-- CUSTOM SUBCATEGORIES (user-created)
-- ============================================
CREATE TABLE IF NOT EXISTS public.seed_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_category TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, primary_category, name)
);

ALTER TABLE public.seed_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subcategories" ON public.seed_subcategories
  FOR ALL USING (auth.uid() = user_id);
