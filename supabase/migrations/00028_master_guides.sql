-- ============================================================
-- Master-guides: admin-redigerbare system-guides + bruger-noter
-- ============================================================
-- Bygger oven på 00023_guides.sql:
--   - admin kan CRUD på master-guides (user_id IS NULL)
--   - per-bruger private noter på en hvilken som helst guide
-- ============================================================

-- Audit-spor: hvilken admin oprettede master-guiden
ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Admin kan INSERT/UPDATE/DELETE master-guides (user_id IS NULL)
DROP POLICY IF EXISTS "guides admin insert master" ON public.guides;
CREATE POLICY "guides admin insert master" ON public.guides
  FOR INSERT WITH CHECK (
    user_id IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "guides admin update master" ON public.guides;
CREATE POLICY "guides admin update master" ON public.guides
  FOR UPDATE USING (
    user_id IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "guides admin delete master" ON public.guides;
CREATE POLICY "guides admin delete master" ON public.guides
  FOR DELETE USING (
    user_id IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Per-bruger private noter på en guide (master eller user-owned)
CREATE TABLE IF NOT EXISTS public.user_guide_notes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_user_guide_notes_guide ON public.user_guide_notes(guide_id);

ALTER TABLE public.user_guide_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_guide_notes owner all" ON public.user_guide_notes;
CREATE POLICY "user_guide_notes owner all" ON public.user_guide_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
