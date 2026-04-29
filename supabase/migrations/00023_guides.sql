-- ============================================================
-- Dyrkningsguides — fleksibel JSONB-struktur for AI-genereret indhold
-- ============================================================
-- Brugere kan have egne guides (auto-genereret eller manuelt oprettet).
-- Senere kan vi tilføje system-guides (user_id IS NULL) og delte guides.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                          -- NULL = system/shared, ellers ejer

  -- Identitet
  plant_name TEXT NOT NULL,
  variety TEXT,
  latin_name TEXT,
  guide_level TEXT NOT NULL DEFAULT 'art' CHECK (guide_level IN ('art', 'sort')),
  parent_guide_id UUID REFERENCES public.guides(id) ON DELETE SET NULL,

  -- Kategorisering
  primary_category_id TEXT NOT NULL CHECK (primary_category_id IN (
    'fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste'
  )),
  subcategory_id TEXT,

  -- Indhold
  summary TEXT,
  difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  quick_facts JSONB DEFAULT '{}',          -- sowingMonths, light, water, etc.
  sections JSONB DEFAULT '[]',             -- [{key, title, body}, ...]
  calendar_rules JSONB DEFAULT '[]',       -- [{taskType, title, recommendedMonths, ...}]

  -- Medier
  primary_image_url TEXT,
  source_links TEXT[] DEFAULT '{}',

  -- Admin
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guides_user        ON public.guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_plant_name  ON public.guides(plant_name);
CREATE INDEX IF NOT EXISTS idx_guides_category    ON public.guides(primary_category_id);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Brugere kan se egne guides + alle system-guides (user_id IS NULL)
DROP POLICY IF EXISTS "guides select own or system" ON public.guides;
CREATE POLICY "guides select own or system" ON public.guides
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Brugere kan kun ændre egne guides
DROP POLICY IF EXISTS "guides insert own" ON public.guides;
CREATE POLICY "guides insert own" ON public.guides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "guides update own" ON public.guides;
CREATE POLICY "guides update own" ON public.guides
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "guides delete own" ON public.guides;
CREATE POLICY "guides delete own" ON public.guides
  FOR DELETE USING (auth.uid() = user_id);

-- inventory_items.guide_id er allerede UUID — tilføj FK nu hvor guides findes
ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_guide_id_fkey;
ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_guide_id_fkey
  FOREIGN KEY (guide_id) REFERENCES public.guides(id) ON DELETE SET NULL;

-- Samme for plants_v2
ALTER TABLE public.plants_v2
  DROP CONSTRAINT IF EXISTS plants_v2_guide_id_fkey;
ALTER TABLE public.plants_v2
  ADD CONSTRAINT plants_v2_guide_id_fkey
  FOREIGN KEY (guide_id) REFERENCES public.guides(id) ON DELETE SET NULL;
