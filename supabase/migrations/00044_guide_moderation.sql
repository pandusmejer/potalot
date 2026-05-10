-- ============================================================
-- Guide-moderation: admin kan flage bruger-guides
-- ============================================================
-- Når en bruger-guide flages: skjules for andre (owner og admin ser
-- stadig), ejer får banner med nedtælling + begrundelse, admin kan
-- permanent-slette manuelt efter fristen.
-- ============================================================

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_guides_flagged ON public.guides(flagged_at) WHERE flagged_at IS NOT NULL;

-- ============================================================
-- RLS: admin kan se ALLE guides (også bruger-private)
-- ============================================================

DROP POLICY IF EXISTS "guides admin select all" ON public.guides;
CREATE POLICY "guides admin select all" ON public.guides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin kan UPDATE alle guides (bruges til at sætte/fjerne flag)
DROP POLICY IF EXISTS "guides admin moderate update" ON public.guides;
CREATE POLICY "guides admin moderate update" ON public.guides
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin kan DELETE alle guides (bruges til permanent sletning af flagede)
DROP POLICY IF EXISTS "guides admin moderate delete" ON public.guides;
CREATE POLICY "guides admin moderate delete" ON public.guides
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
