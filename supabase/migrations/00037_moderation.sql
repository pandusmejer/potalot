-- ============================================================
-- Slice E: Moderation light
-- ============================================================
-- - Grupperegler-tekst på user_groups
-- - content_reports: brugere rapporterer indhold; ejer ser kø
-- - user_blocks: en-vejs blokering, så jeg ikke ser den blokeredes
--   indhold (uden at sladre det til den blokerede)
-- ============================================================

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS rules TEXT;

-- ============================================================
-- content_reports
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('forum_post', 'forum_reply', 'swap_listing', 'chat_message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'irrelevant', 'rude', 'misleading', 'other')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_reports_group_status
  ON public.content_reports(group_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_content_reports_per_user_target_pending
  ON public.content_reports(reporter_user_id, target_type, target_id)
  WHERE status = 'pending';

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Reporter ser egne; ejer ser alle på sin gruppe
DROP POLICY IF EXISTS "reports select self or owner" ON public.content_reports;
CREATE POLICY "reports select self or owner" ON public.content_reports
  FOR SELECT USING (
    reporter_user_id = auth.uid() OR public.is_group_owner(group_id)
  );

-- Insert: medlem af gruppen, må ikke rapportere sig selv (target-ejer
-- check sker i RPC for at undgå dobbelt-RLS)
DROP POLICY IF EXISTS "reports insert by member" ON public.content_reports;
CREATE POLICY "reports insert by member" ON public.content_reports
  FOR INSERT WITH CHECK (
    reporter_user_id = auth.uid() AND public.is_group_member(group_id)
  );

-- Update + delete: kun ejer (resolverer/afviser)
DROP POLICY IF EXISTS "reports update by owner" ON public.content_reports;
CREATE POLICY "reports update by owner" ON public.content_reports
  FOR UPDATE USING (public.is_group_owner(group_id));

DROP POLICY IF EXISTS "reports delete by owner" ON public.content_reports;
CREATE POLICY "reports delete by owner" ON public.content_reports
  FOR DELETE USING (public.is_group_owner(group_id));

-- ============================================================
-- user_blocks
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_user_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Brugeren kan se egne blokeringer (men ikke andres — privat info)
DROP POLICY IF EXISTS "blocks select self" ON public.user_blocks;
CREATE POLICY "blocks select self" ON public.user_blocks
  FOR SELECT USING (blocker_user_id = auth.uid());

DROP POLICY IF EXISTS "blocks insert self" ON public.user_blocks;
CREATE POLICY "blocks insert self" ON public.user_blocks
  FOR INSERT WITH CHECK (blocker_user_id = auth.uid());

DROP POLICY IF EXISTS "blocks delete self" ON public.user_blocks;
CREATE POLICY "blocks delete self" ON public.user_blocks
  FOR DELETE USING (blocker_user_id = auth.uid());
