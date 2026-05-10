-- ============================================================
-- Medlemsbadges
-- ============================================================
-- Et lille sæt foruddefinerede badges (defineret i kode, ikke DB).
-- user_badges-tabellen lagrer kun id'et på badgen + tildelingsdato.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Alle authenticated kan se andres badges (de er public-sociale)
DROP POLICY IF EXISTS "user_badges select all" ON public.user_badges;
CREATE POLICY "user_badges select all" ON public.user_badges
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert sker via SECURITY DEFINER-RPC (badges tildeles serverside)
DROP POLICY IF EXISTS "user_badges insert nobody" ON public.user_badges;
CREATE POLICY "user_badges insert nobody" ON public.user_badges
  FOR INSERT WITH CHECK (false);

-- ============================================================
-- award_badge: SECURITY DEFINER-RPC der bypasser RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.award_badge(p_user_id UUID, p_badge_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_inserted INT;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.award_badge(UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.award_badge(UUID, TEXT) TO authenticated;
