-- ============================================================
-- Frøbank-spec v3 + "Så et frø"-regel
-- ============================================================
-- Sektion 12: udvider inventory_items med latinsk navn, antal frø,
-- købsår, "købt her"-URL.
-- Sektion 13: introducerer sowing_events så én plante under Mine planter
-- kan have flere såningshændelser (i stedet for én plante pr. såning).
-- ============================================================

-- 1) inventory_items: nye felter
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS latin_name    TEXT,
  ADD COLUMN IF NOT EXISTS seed_count    INTEGER,
  ADD COLUMN IF NOT EXISTS purchase_year INTEGER,
  ADD COLUMN IF NOT EXISTS purchase_url  TEXT;

-- Migrér eksisterende `quantity` til seed_count for frø-elementer
-- (quantity beholdes som legacy felt så fx løg/knolde stadig kan tælle stk.)
UPDATE public.inventory_items
SET seed_count = quantity
WHERE primary_category_id = 'fro'
  AND seed_count IS NULL
  AND quantity IS NOT NULL;

-- 2) plants_v2: tilføj growing_year til match-logik
ALTER TABLE public.plants_v2
  ADD COLUMN IF NOT EXISTS growing_year INTEGER;

-- Sæt growing_year for eksisterende planter ud fra sow_date eller created_at
UPDATE public.plants_v2
SET growing_year = COALESCE(EXTRACT(YEAR FROM sow_date)::INTEGER, EXTRACT(YEAR FROM created_at)::INTEGER)
WHERE growing_year IS NULL;

CREATE INDEX IF NOT EXISTS idx_plants_v2_inventory_year
  ON public.plants_v2(source_inventory_id, growing_year)
  WHERE source_inventory_id IS NOT NULL;

-- 3) Sowing events tabel — én row pr. faktisk såningshændelse
CREATE TABLE IF NOT EXISTS public.sowing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  plant_id UUID NOT NULL REFERENCES public.plants_v2(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,

  sown_count INTEGER NOT NULL CHECK (sown_count > 0),
  sowing_date DATE NOT NULL,
  container_type TEXT,           -- "Såbakke", "Potte", "Plugbox", "Direkte friland", etc.
  location TEXT,                 -- "Drivhus", "Vindueskarm", "Højbed 2"
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sowing_events_user      ON public.sowing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sowing_events_plant     ON public.sowing_events(plant_id);
CREATE INDEX IF NOT EXISTS idx_sowing_events_inventory ON public.sowing_events(inventory_item_id);

ALTER TABLE public.sowing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sowing_events rw own" ON public.sowing_events;
CREATE POLICY "sowing_events rw own" ON public.sowing_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) View til hurtig "antal sået / antal tilbage"-opslag
CREATE OR REPLACE VIEW public.inventory_seed_counts AS
SELECT
  i.id AS inventory_item_id,
  i.user_id,
  COALESCE(i.seed_count, 0) AS seed_count,
  COALESCE(SUM(s.sown_count), 0)::INTEGER AS seeds_sown,
  GREATEST(COALESCE(i.seed_count, 0) - COALESCE(SUM(s.sown_count), 0), 0)::INTEGER AS seeds_remaining
FROM public.inventory_items i
LEFT JOIN public.sowing_events s ON s.inventory_item_id = i.id
GROUP BY i.id, i.user_id, i.seed_count;

-- View arver RLS fra underliggende tabeller, men eksplicit grant for klarhed
GRANT SELECT ON public.inventory_seed_counts TO authenticated;
