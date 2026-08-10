-- 00064: "Gem fra Gartneren" — personlig, kontekstbundet viden
-- (Annas design 10/8 2026, spec: Docs/product/gem-fra-gartneren.md).
--
-- Brugeren kan gemme ét Gartner-svar med én diskret handling. Der gemmes
-- ALTID spørgsmål + svar + kontekst sammen (aldrig kun svaret — "Når hvad
-- er klar?"). guide_id er TEKST-slug i det importerede guide-bibliotek
-- (fx 'tomat-green-zebra'), IKKE en FK til public.guides — valideres mod
-- GUIDE_FACTS i server-actionen før insert.
--
-- Additiv og ufarlig: ny tabel + RLS, rører intet eksisterende.

CREATE TABLE IF NOT EXISTS public.gartner_saved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  guide_id TEXT,
  plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listen under Guides: alle brugerens gemte, nyeste først.
CREATE INDEX IF NOT EXISTS idx_gartner_saved_user_created
  ON public.gartner_saved(user_id, created_at DESC);

-- "Dine gemte noter · N" på den enkelte guide.
CREATE INDEX IF NOT EXISTS idx_gartner_saved_user_guide
  ON public.gartner_saved(user_id, guide_id)
  WHERE guide_id IS NOT NULL;

ALTER TABLE public.gartner_saved ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gartner_saved owner all" ON public.gartner_saved;
CREATE POLICY "gartner_saved owner all" ON public.gartner_saved
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
