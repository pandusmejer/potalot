-- Idétavle: langsigtede projekter (ny urtehave, plant frugttræ, byg drivhus).
-- Ikke daglige tasks — det er kalender. Idéer er aspirationer med valgfrit målår.

CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN (
    'idea', 'planning', 'in_progress', 'done', 'abandoned'
  )),
  target_year INTEGER,
  tags TEXT[] DEFAULT '{}',

  image_urls TEXT[] DEFAULT '{}',
  primary_image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user   ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ideas all" ON public.ideas;
CREATE POLICY "ideas all" ON public.ideas FOR ALL USING (true) WITH CHECK (true);
