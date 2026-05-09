-- ============================================================
-- Idétavle: deling pr. brugernavn
-- ============================================================
-- Brugere kan dele en idé med en anden bruger ved at indtaste
-- modtagerens brugernavn. Modtageren kan se idéen read-only.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idea_shares (
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (idea_id, recipient_user_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_shares_recipient ON public.idea_shares(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_idea_shares_idea ON public.idea_shares(idea_id);

ALTER TABLE public.idea_shares ENABLE ROW LEVEL SECURITY;

-- Owner kan oprette/se/slette delinger på egne idéer
DROP POLICY IF EXISTS "idea_shares owner all" ON public.idea_shares;
CREATE POLICY "idea_shares owner all" ON public.idea_shares
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
    AND shared_by_user_id = auth.uid()
  );

-- Modtager kan se sine egne shares (men ikke ændre/slette)
DROP POLICY IF EXISTS "idea_shares recipient select" ON public.idea_shares;
CREATE POLICY "idea_shares recipient select" ON public.idea_shares
  FOR SELECT USING (recipient_user_id = auth.uid());

-- Udvid ideas-RLS: modtager kan også læse delte idéer
DROP POLICY IF EXISTS "ideas read shared" ON public.ideas;
CREATE POLICY "ideas read shared" ON public.ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.idea_shares
      WHERE idea_id = ideas.id AND recipient_user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC til at slå brugere op uden at åbne hele profiles-tabellen
-- ============================================================
-- find_user_by_username: bruges når man skal dele med en person
-- via brugernavn. Returnerer kun id + display_name + username.

CREATE OR REPLACE FUNCTION public.find_user_by_username(p_username TEXT)
RETURNS TABLE(id UUID, username TEXT, display_name TEXT)
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT p.id, p.username::text, p.display_name
  FROM public.profiles p
  WHERE p.username = p_username::citext
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_username(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_user_by_username(TEXT) TO authenticated;

-- get_user_labels_by_ids: bruges til at vise navne på modtagere/afsendere
-- i UI'et. Returnerer kun safe felter (ingen email, is_admin, mv.).

CREATE OR REPLACE FUNCTION public.get_user_labels_by_ids(p_ids UUID[])
RETURNS TABLE(id UUID, username TEXT, display_name TEXT)
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT p.id, p.username::text, p.display_name
  FROM public.profiles p
  WHERE p.id = ANY(p_ids);
$$;

REVOKE ALL ON FUNCTION public.get_user_labels_by_ids(UUID[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_labels_by_ids(UUID[]) TO authenticated;
