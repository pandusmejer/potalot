-- ============================================
-- Garden locations — dyrkningssteder som rigtig entity
-- ============================================
-- Indtil nu er steder UDLEDT af plants_v2.location-strengen (lib/steder.ts).
-- Det betyder at et sted ikke kan eksistere FØR der er en plante i det — man
-- kan ikke oprette "Drivhus" og så plante ind i det. Denne tabel gør stedet
-- til en førsteklasses ting brugeren kan oprette, navngive og senere give et
-- foto/noter (planter-persistens-sprint, step 3+4).
--
-- BAGUDKOMPATIBILITET: plants_v2.location (tekst) BEVARES som fallback. En
-- plante peger på garden_location_id NÅR den er knyttet til et oprettet sted;
-- ellers udledes stedet stadig af location-teksten. Smadr ikke demo/legacy.
-- ============================================

CREATE TABLE IF NOT EXISTS public.garden_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  -- Højbed | Drivhus | Krukke | Vindueskarm | Altan | Friland | Andet
  -- (fri tekst — UI tilbyder kendte typer, men låser ikke schemaet)
  type TEXT NOT NULL DEFAULT 'Andet',
  image_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ét sted-navn pr. bruger (case-insensitiv) → "resolve-or-create" ved
-- plante-oprettelse rammer altid samme sted, og listen får ikke dubletter.
CREATE UNIQUE INDEX IF NOT EXISTS idx_garden_locations_user_name
  ON public.garden_locations(user_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_garden_locations_user
  ON public.garden_locations(user_id);

ALTER TABLE public.garden_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "garden_locations all" ON public.garden_locations;
CREATE POLICY "garden_locations all" ON public.garden_locations
  FOR ALL USING (true) WITH CHECK (true);

-- Plante → sted. ON DELETE SET NULL: slettes stedet, mister planten kun sin
-- kobling (location-teksten bliver stadig stående som fallback).
ALTER TABLE public.plants_v2
  ADD COLUMN IF NOT EXISTS garden_location_id UUID
    REFERENCES public.garden_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plants_v2_garden_location
  ON public.plants_v2(garden_location_id);
