-- ============================================
-- Mine Planter v2 — frisk schema iht. ny spec
-- ============================================
-- Aktive dyrkninger + dyrkningslog. Kobler til inventory_items via source_inventory_id.
-- ============================================

CREATE TABLE IF NOT EXISTS public.plants_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Reference til frøbank-element (kan være null hvis manuelt oprettet)
  source_inventory_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  variety TEXT,
  status TEXT NOT NULL DEFAULT 'saaet' CHECK (status IN (
    'planlagt', 'saaet', 'spirer', 'i_vaekst', 'klar_til_udplantning',
    'udplantet', 'hoestklar', 'afsluttet'
  )),
  location TEXT,
  sow_date DATE,
  planting_out_date DATE,
  first_harvest_date DATE,
  quantity INTEGER NOT NULL DEFAULT 1,

  image_urls TEXT[] DEFAULT '{}',
  primary_image_url TEXT,
  guide_id UUID,

  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_year INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plants_v2_user        ON public.plants_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_v2_inventory   ON public.plants_v2(source_inventory_id);
CREATE INDEX IF NOT EXISTS idx_plants_v2_status      ON public.plants_v2(status);
CREATE INDEX IF NOT EXISTS idx_plants_v2_archived    ON public.plants_v2(is_archived);

ALTER TABLE public.plants_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plants_v2 all" ON public.plants_v2;
CREATE POLICY "plants_v2 all" ON public.plants_v2 FOR ALL USING (true) WITH CHECK (true);


-- PLANT_LOGS_V2
CREATE TABLE IF NOT EXISTS public.plant_logs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN (
    'sowing', 'germination', 'repotting', 'planting_out', 'watering',
    'fertilizing', 'pruning', 'pest_disease', 'harvest', 'note',
    'status_change', 'archive'
  )),
  title TEXT,
  note TEXT,

  image_urls TEXT[] DEFAULT '{}',
  linked_task_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plant_logs_v2_plant ON public.plant_logs_v2(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_logs_v2_user  ON public.plant_logs_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_logs_v2_date  ON public.plant_logs_v2(date DESC);

ALTER TABLE public.plant_logs_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plant_logs_v2 all" ON public.plant_logs_v2;
CREATE POLICY "plant_logs_v2 all" ON public.plant_logs_v2 FOR ALL USING (true) WITH CHECK (true);
