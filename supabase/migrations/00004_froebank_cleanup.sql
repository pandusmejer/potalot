-- Frøbank fase 2: Nye felter + status udløbet

-- Add new fields to seeds
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS botanical_name TEXT,
  ADD COLUMN IF NOT EXISTS purchase_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS germination_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update status CHECK to include 'expired'
ALTER TABLE public.seeds DROP CONSTRAINT IF EXISTS seeds_status_check;
ALTER TABLE public.seeds
  ADD CONSTRAINT seeds_status_check
  CHECK (status IN ('in_stock', 'sown', 'depleted', 'expired'));
