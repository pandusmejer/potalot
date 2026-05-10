-- ============================================================
-- Slice F: Sortsbaserede tråde i interessegrupper
-- ============================================================
-- En gruppe kan have et "sortskatalog" — fx en chili-gruppe har
-- Jalapeño, Habanero, Lemon Drop osv. Hver bruger markerer sin status
-- på sorten (dyrker/har_dyrket/vil_dyrke/har_froe/soeger_froe), og
-- forum-opslag kan tagges med en sort så de fremgår på sortssiden.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  plant_name TEXT NOT NULL,
  variety TEXT,
  latin_name TEXT,
  description TEXT,
  primary_image_url TEXT,
  guide_id UUID REFERENCES public.guides(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_group_varieties_name
  ON public.group_varieties(group_id, lower(plant_name), lower(coalesce(variety, '')));

CREATE INDEX IF NOT EXISTS idx_group_varieties_group ON public.group_varieties(group_id);

ALTER TABLE public.group_varieties ENABLE ROW LEVEL SECURITY;

-- Læs: medlemmer ELLER åben interessegruppe
DROP POLICY IF EXISTS "varieties select if member or open" ON public.group_varieties;
CREATE POLICY "varieties select if member or open" ON public.group_varieties
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR EXISTS (
      SELECT 1 FROM public.user_groups g
      WHERE g.id = group_varieties.group_id
        AND g.group_type = 'interest' AND g.visibility = 'open'
    )
  );

DROP POLICY IF EXISTS "varieties insert by member" ON public.group_varieties;
CREATE POLICY "varieties insert by member" ON public.group_varieties
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "varieties update by author or owner" ON public.group_varieties;
CREATE POLICY "varieties update by author or owner" ON public.group_varieties
  FOR UPDATE USING (
    created_by = auth.uid() OR public.is_group_owner(group_id)
  );

DROP POLICY IF EXISTS "varieties delete by author or owner" ON public.group_varieties;
CREATE POLICY "varieties delete by author or owner" ON public.group_varieties
  FOR DELETE USING (
    created_by = auth.uid() OR public.is_group_owner(group_id)
  );

-- ============================================================
-- user_variety_status: brugeren markerer en eller flere statusser
-- pr. sort.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_variety_status (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variety_id UUID NOT NULL REFERENCES public.group_varieties(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('dyrker', 'har_dyrket', 'vil_dyrke', 'har_froe', 'soeger_froe')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, variety_id, status)
);

CREATE INDEX IF NOT EXISTS idx_user_variety_status_variety ON public.user_variety_status(variety_id);
CREATE INDEX IF NOT EXISTS idx_user_variety_status_user ON public.user_variety_status(user_id);

ALTER TABLE public.user_variety_status ENABLE ROW LEVEL SECURITY;

-- Brugeren ser sine egne; alle med læseadgang til varieten ser aggregater
-- (count'es altid via server-action med aggregation, så fuld SELECT er ok
--  for medlemmer)
DROP POLICY IF EXISTS "variety_status select if can read variety" ON public.user_variety_status;
CREATE POLICY "variety_status select if can read variety" ON public.user_variety_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_varieties v
      WHERE v.id = variety_id
        AND (
          public.is_group_member(v.group_id)
          OR EXISTS (
            SELECT 1 FROM public.user_groups g
            WHERE g.id = v.group_id AND g.group_type = 'interest' AND g.visibility = 'open'
          )
        )
    )
  );

DROP POLICY IF EXISTS "variety_status insert self" ON public.user_variety_status;
CREATE POLICY "variety_status insert self" ON public.user_variety_status
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_varieties v
      WHERE v.id = variety_id AND public.is_group_member(v.group_id)
    )
  );

DROP POLICY IF EXISTS "variety_status delete self" ON public.user_variety_status;
CREATE POLICY "variety_status delete self" ON public.user_variety_status
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- forum_posts: tilknyt valgfri variety_id så tråde kan filtreres
-- pr. sort på sortsdetaljesiden.
-- ============================================================

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS variety_id UUID REFERENCES public.group_varieties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_forum_posts_variety ON public.forum_posts(variety_id) WHERE variety_id IS NOT NULL;
