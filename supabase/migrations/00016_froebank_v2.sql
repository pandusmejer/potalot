-- ============================================
-- Frøbank v2 — frisk schema iht. ny spec
-- ============================================
-- Bygger nye tabeller frem for at modificere de gamle. Gamle (seeds, plants, varieties)
-- ignoreres og kan ryddes senere når alle moduler er migreret.
-- ============================================

-- INVENTORY_ITEMS
-- Erstatter gamle 'seeds'-tabel. Indeholder alle frøbank-elementer:
-- frø, løg, knolde, buske, træer, stauder, ønskeliste.
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Basis
  name TEXT NOT NULL,
  variety TEXT,
  supplier TEXT,
  primary_category_id TEXT NOT NULL CHECK (primary_category_id IN (
    'fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste'
  )),
  subcategory_id TEXT,                 -- null = ingen, system-id eller custom-uuid
  quantity INTEGER,
  purchase_date DATE,
  expiry_date DATE,
  notes TEXT,

  -- Dyrkning
  sowing_months INTEGER[] DEFAULT '{}',
  sowing_depth_mm INTEGER NOT NULL DEFAULT 0,
  pre_cultivation BOOLEAN,
  planting_out_months INTEGER[] DEFAULT '{}',
  harvest_months INTEGER[] DEFAULT '{}',
  light TEXT CHECK (light IS NULL OR light IN ('full_sun', 'partial_shade', 'shade')),
  water TEXT CHECK (water IS NULL OR water IN ('low', 'regular', 'high')),
  soil TEXT,
  germination_temperature TEXT,
  germination_days TEXT,
  plant_spacing TEXT,
  row_spacing TEXT,
  growing_locations TEXT[] DEFAULT '{}',

  -- Status og flags
  status TEXT NOT NULL DEFAULT 'i_froebank' CHECK (status IN (
    'i_froebank', 'planlagt', 'saaet', 'i_jord', 'i_vaekst', 'afsluttet', 'arkiveret'
  )),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,

  -- Medier (URLs til Supabase Storage)
  image_urls TEXT[] DEFAULT '{}',
  primary_image_url TEXT,

  -- Relationer
  guide_id UUID,                       -- TODO: ref til guides-tabel når den oprettes

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user        ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category    ON public.inventory_items(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_subcategory ON public.inventory_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status      ON public.inventory_items(status);

-- RLS — i demo-mode bruger vi service role key, så vi tillader alt for authenticated.
-- Når rigtig auth tilføjes: erstatte med (auth.uid() = user_id) check.
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory all" ON public.inventory_items;
CREATE POLICY "inventory all" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);


-- CUSTOM_SUBCATEGORIES
-- Brugerskabte underkategorier (ud over system-defaults).
CREATE TABLE IF NOT EXISTS public.custom_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_category_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_subcategories_user ON public.custom_subcategories(user_id);

ALTER TABLE public.custom_subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_subcategories all" ON public.custom_subcategories;
CREATE POLICY "custom_subcategories all" ON public.custom_subcategories FOR ALL USING (true) WITH CHECK (true);


-- DEMO USER
-- Sikr at demo-bruger findes i auth.users + profiles før vi seeder data.
-- Hvis demo-bruger ikke findes i auth.users opretter Supabase ikke automatisk
-- — det skal gøres via JS API. Vi skipper den del i SQL. Service role bypasser RLS.

-- SEED: nogle eksempler så Frøbanken ikke er tom efter migration
-- Bruger fast demo UUID matchende src/lib/demo.ts
INSERT INTO public.inventory_items (
  user_id, name, variety, supplier, primary_category_id, subcategory_id, quantity,
  purchase_date, sowing_months, sowing_depth_mm, pre_cultivation,
  planting_out_months, harvest_months, light, water, growing_locations,
  status, is_favorite, is_pinned, notes
) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tomat', 'San Marzano', 'Impecta', 'fro', 'groentsager', 35,
   '2026-02-01', ARRAY[3,4], 5, true, ARRAY[5,6], ARRAY[7,8,9], 'full_sun', 'regular', ARRAY['drivhus','hoejbed'],
   'i_froebank', true, false, 'God til saucer, forspiring anbefales.'),
  ('00000000-0000-0000-0000-000000000001', 'Jalapeño', 'Early Jalapeño', 'Nordfrø', 'fro', 'groentsager', 20,
   '2026-01-15', ARRAY[2,3], 5, true, ARRAY[5,6], ARRAY[8,9,10], 'full_sun', 'regular', ARRAY['drivhus','krukke'],
   'saaet', true, true, NULL),
  ('00000000-0000-0000-0000-000000000001', 'Basilikum', 'Genovese', 'DT Brown', 'fro', 'krydderurter', 50,
   NULL, ARRAY[3,4,5], 0, true, ARRAY[5,6], ARRAY[6,7,8,9], 'full_sun', 'regular',
   ARRAY['vindueskarm','krukke','drivhus'], 'i_froebank', false, false, NULL),
  ('00000000-0000-0000-0000-000000000001', 'Tulipan', 'Queen of Night', 'Plantorama', 'loeg', 'blomster_fleraarige', 50,
   '2025-09-15', ARRAY[9,10,11], 150, false, ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], 'full_sun', 'low',
   ARRAY['friland','hoejbed'], 'i_jord', false, false, NULL),
  ('00000000-0000-0000-0000-000000000001', 'Blåbær', 'Patriot', NULL, 'buske', 'baer', 2,
   '2025-04-01', ARRAY[]::INTEGER[], 0, false, ARRAY[4,5], ARRAY[7,8], 'full_sun', 'regular',
   ARRAY['hoejbed','friland'], 'i_vaekst', true, false, NULL),
  ('00000000-0000-0000-0000-000000000001', 'Passionsblomst', NULL, NULL, 'indkoebsliste', NULL, 1,
   NULL, ARRAY[]::INTEGER[], 0, false, ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], NULL, NULL,
   ARRAY['krukke'], 'i_froebank', false, false, 'Køb denne på forårsmarkedet')
ON CONFLICT DO NOTHING;
