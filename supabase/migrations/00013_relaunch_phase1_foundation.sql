-- ============================================
-- Relaunch Phase 1: Datamodel-fundament
-- ============================================
-- Tilføjer nye tabeller (gardens, placeringer, varieties, plant_events)
-- og nye kolonner på seeds/plants. Beholder ALT eksisterende data.
-- Gamle kolonner fjernes IKKE — de fjernes i en senere fase.
-- ============================================

-- ============================================
-- GARDENS (Have - bruger kan have flere)
-- ============================================
CREATE TABLE IF NOT EXISTS public.gardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own gardens" ON public.gardens;
CREATE POLICY "Users manage own gardens" ON public.gardens FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gardens_user ON public.gardens(user_id);

-- ============================================
-- PLACERINGER (Placering med flags)
-- ============================================
CREATE TABLE IF NOT EXISTS public.placeringer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Brugervendt info
  name TEXT NOT NULL,
  template TEXT, -- 'vindue_meget_sol', 'drivhus_uopvarmet', etc.

  -- Flags (auto-set fra template, manuelt overstyrbar)
  exposure TEXT CHECK (exposure IN ('indendoers', 'altan', 'friland', 'drivhus', 'tunnel', 'andet')),
  heated BOOLEAN DEFAULT false,
  min_temp_c NUMERIC(4,1), -- Hvis opvarmet: termostat-temp
  light_level TEXT CHECK (light_level IN ('lidt', 'noget', 'meget')),
  sheltered BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.placeringer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own placeringer" ON public.placeringer;
CREATE POLICY "Users manage own placeringer" ON public.placeringer FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_placeringer_garden ON public.placeringer(garden_id);
CREATE INDEX IF NOT EXISTS idx_placeringer_user ON public.placeringer(user_id);

-- ============================================
-- VARIETIES (Sort - førsteklasses entitet)
-- ============================================
CREATE TABLE IF NOT EXISTS public.varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = global/delt sort

  -- Identitet
  species_name TEXT NOT NULL, -- "Tomat"
  variety_name TEXT, -- "San Marzano" (NULL = bare arten)
  botanical_name TEXT, -- "Solanum lycopersicum"

  -- Reference til guide
  guide_id UUID REFERENCES public.plant_guides(id) ON DELETE SET NULL,

  -- Illustration (Flora Danica eller AI)
  illustration_url TEXT,
  illustration_source TEXT CHECK (illustration_source IN ('flora_danica', 'ai_generated', 'user_upload')),
  illustration_approved BOOLEAN DEFAULT true, -- AI starter false indtil kurator godkender

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.varieties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Varieties readable by all auth users" ON public.varieties;
CREATE POLICY "Varieties readable by all auth users" ON public.varieties
  FOR SELECT USING (auth.role() = 'authenticated' OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own varieties" ON public.varieties;
CREATE POLICY "Users manage own varieties" ON public.varieties
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- Unik per bruger pr. (species, variety) — håndterer NULL via COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS varieties_unique_user_species_variety
ON public.varieties (
  COALESCE(user_id::text, '__shared__'),
  species_name,
  COALESCE(variety_name, '__none__')
);

CREATE INDEX IF NOT EXISTS idx_varieties_user ON public.varieties(user_id);
CREATE INDEX IF NOT EXISTS idx_varieties_species ON public.varieties(species_name);

-- ============================================
-- PLANT_EVENTS (append-only tidslinje)
-- ============================================
CREATE TABLE IF NOT EXISTS public.plant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'soet',         -- Sået
    'spiret',       -- Spiret
    'priklet',      -- Priklet ud
    'udplantet',    -- Udplantet
    'vandet',       -- Vandet
    'goedet',       -- Gødet
    'flyttet',      -- Flyttet til ny placering
    'beskaaret',    -- Beskåret/knebet
    'hoestet',      -- Høstet (kan ske mange gange)
    'afsluttet',    -- Terminal: færdig/død/fjernet/gemt-til-frø
    'note',         -- Fri note
    'foto'          -- Foto-event
  )),

  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Fleksibel data per event-type:
  -- soet:      { antal: 3 }
  -- priklet:   { antal: 3 }
  -- flyttet:   { fra_placering_id, til_placering_id }
  -- hoestet:   { mængde: 1.2, enhed: 'kg' }
  -- afsluttet: { årsag: 'frost'|'sygdom'|'tørke'|'skadedyr'|'færdig'|'gemt_til_froe'|'ukendt', noter }
  data JSONB DEFAULT '{}',

  notes TEXT,
  photo_urls TEXT[],

  -- Hvor kommer eventen fra?
  auto_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.plant_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own plant events" ON public.plant_events;
CREATE POLICY "Users manage own plant events" ON public.plant_events FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_plant_events_plant_date ON public.plant_events(plant_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_plant_events_user_date ON public.plant_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_plant_events_type ON public.plant_events(event_type);

-- ============================================
-- TILFØJ KOLONNER til seeds og plants
-- ============================================
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS variety_id UUID REFERENCES public.varieties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL;
  -- parent_plant_id = "denne frøpose blev høstet fra denne plante" (lineage)

CREATE INDEX IF NOT EXISTS idx_seeds_variety ON public.seeds(variety_id);

ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS variety_id UUID REFERENCES public.varieties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS garden_id UUID REFERENCES public.gardens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placering_id UUID REFERENCES public.placeringer(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS livscyklus TEXT DEFAULT 'planlagt' CHECK (livscyklus IN (
    'i_froebank', 'planlagt', 'soet', 'spiret', 'priklet', 'udplantet', 'i_vaekst', 'afsluttet'
  ));

CREATE INDEX IF NOT EXISTS idx_plants_variety ON public.plants(variety_id);
CREATE INDEX IF NOT EXISTS idx_plants_garden ON public.plants(garden_id);
CREATE INDEX IF NOT EXISTS idx_plants_placering ON public.plants(placering_id);
CREATE INDEX IF NOT EXISTS idx_plants_livscyklus ON public.plants(livscyklus);

-- ============================================
-- BACKFILL: Migrér eksisterende data
-- ============================================
DO $$
DECLARE
  demo_user_id UUID;
  default_garden_id UUID;
BEGIN
  -- Find demo-bruger (første profil)
  SELECT id INTO demo_user_id FROM public.profiles ORDER BY created_at LIMIT 1;

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'Ingen brugere fundet — skipper backfill';
    RETURN;
  END IF;

  -- Opret default-have hvis ingen findes
  SELECT id INTO default_garden_id FROM public.gardens WHERE user_id = demo_user_id LIMIT 1;
  IF default_garden_id IS NULL THEN
    INSERT INTO public.gardens (user_id, name, latitude, longitude, is_default)
    VALUES (demo_user_id, 'Min have', 55.6761, 12.5683, true)
    RETURNING id INTO default_garden_id;
  END IF;

  -- Opret standard-placeringer hvis tabellen er tom
  IF NOT EXISTS (SELECT 1 FROM public.placeringer WHERE garden_id = default_garden_id) THEN
    INSERT INTO public.placeringer (garden_id, user_id, name, template, exposure, light_level, sheltered, heated)
    VALUES
      (default_garden_id, demo_user_id, 'Vindueskarm (meget sol)', 'vindue_meget_sol', 'indendoers', 'meget', true, true),
      (default_garden_id, demo_user_id, 'Drivhus (uopvarmet)', 'drivhus_uopvarmet', 'drivhus', 'meget', true, false),
      (default_garden_id, demo_user_id, 'Friland (solrigt og eksponeret)', 'friland_solrigt_eksponeret', 'friland', 'meget', false, false),
      (default_garden_id, demo_user_id, 'Højbed', 'hoejbed', 'friland', 'meget', false, false),
      (default_garden_id, demo_user_id, 'Krukker på terrasse', 'krukker_terrasse', 'altan', 'meget', false, false);
  END IF;

  -- Opret varieties fra unikke seed-kombinationer (name + variety + botanical)
  INSERT INTO public.varieties (user_id, species_name, variety_name, botanical_name, guide_id)
  SELECT DISTINCT
    s.user_id,
    s.name,
    NULLIF(TRIM(s.variety), ''),
    NULLIF(TRIM(s.botanical_name), ''),
    s.guide_id
  FROM public.seeds s
  WHERE s.name IS NOT NULL AND TRIM(s.name) != ''
  ON CONFLICT DO NOTHING;

  -- Opret varieties fra unikke plant-kombinationer (dem der ikke allerede findes via seeds)
  INSERT INTO public.varieties (user_id, species_name, variety_name, guide_id)
  SELECT DISTINCT
    p.user_id,
    p.name,
    NULLIF(TRIM(p.variety), ''),
    p.guide_id
  FROM public.plants p
  WHERE p.name IS NOT NULL AND TRIM(p.name) != ''
  ON CONFLICT DO NOTHING;

  -- Link seeds til varieties
  UPDATE public.seeds s
  SET variety_id = v.id
  FROM public.varieties v
  WHERE s.variety_id IS NULL
    AND v.user_id = s.user_id
    AND v.species_name = s.name
    AND COALESCE(v.variety_name, '__none__') = COALESCE(NULLIF(TRIM(s.variety), ''), '__none__');

  -- Link plants til varieties + default garden
  UPDATE public.plants p
  SET
    variety_id = v.id,
    garden_id = COALESCE(p.garden_id, default_garden_id)
  FROM public.varieties v
  WHERE p.variety_id IS NULL
    AND v.user_id = p.user_id
    AND v.species_name = p.name
    AND COALESCE(v.variety_name, '__none__') = COALESCE(NULLIF(TRIM(p.variety), ''), '__none__');

  -- Map gammel status til ny livscyklus
  UPDATE public.plants SET livscyklus = CASE
    WHEN status = 'planned' THEN 'planlagt'
    WHEN status = 'sown' THEN 'soet'
    WHEN status = 'germinated' THEN 'spiret'
    WHEN status = 'pricked' THEN 'priklet'
    WHEN status IN ('hardening', 'planted_out') THEN 'udplantet'
    WHEN status IN ('growing', 'flowering', 'harvesting') THEN 'i_vaekst'
    WHEN status IN ('done', 'dead') THEN 'afsluttet'
    ELSE 'planlagt'
  END
  WHERE livscyklus IS NULL OR livscyklus = 'planlagt';

  -- Backfill events fra eksisterende dato-felter på plants
  INSERT INTO public.plant_events (plant_id, user_id, event_type, event_date, data, auto_generated)
  SELECT p.id, p.user_id, 'soet', p.sow_date, '{"backfilled": true}'::jsonb, true
  FROM public.plants p
  WHERE p.sow_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plant_events e
      WHERE e.plant_id = p.id AND e.event_type = 'soet'
    );

  INSERT INTO public.plant_events (plant_id, user_id, event_type, event_date, data, auto_generated)
  SELECT p.id, p.user_id, 'spiret', p.germination_date, '{"backfilled": true}'::jsonb, true
  FROM public.plants p
  WHERE p.germination_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plant_events e
      WHERE e.plant_id = p.id AND e.event_type = 'spiret'
    );

  INSERT INTO public.plant_events (plant_id, user_id, event_type, event_date, data, auto_generated)
  SELECT p.id, p.user_id, 'priklet', p.prick_date, '{"backfilled": true}'::jsonb, true
  FROM public.plants p
  WHERE p.prick_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plant_events e
      WHERE e.plant_id = p.id AND e.event_type = 'priklet'
    );

  INSERT INTO public.plant_events (plant_id, user_id, event_type, event_date, data, auto_generated)
  SELECT p.id, p.user_id, 'udplantet', p.plant_out_date, '{"backfilled": true}'::jsonb, true
  FROM public.plants p
  WHERE p.plant_out_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plant_events e
      WHERE e.plant_id = p.id AND e.event_type = 'udplantet'
    );

  INSERT INTO public.plant_events (plant_id, user_id, event_type, event_date, data, auto_generated)
  SELECT p.id, p.user_id, 'hoestet', p.first_harvest_date, '{"backfilled": true, "first_harvest": true}'::jsonb, true
  FROM public.plants p
  WHERE p.first_harvest_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plant_events e
      WHERE e.plant_id = p.id AND e.event_type = 'hoestet'
    );

  RAISE NOTICE 'Backfill færdig for bruger %', demo_user_id;
END $$;
