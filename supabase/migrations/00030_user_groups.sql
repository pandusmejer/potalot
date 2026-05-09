-- ============================================================
-- Brugergrupper: private grupper hvor brugere kan dele idéer
-- ============================================================
-- En bruger opretter en gruppe og inviterer andre med via brugernavn.
-- Idéer kan deles med en hel gruppe, så alle medlemmer kan læse dem.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_groups_created_by ON public.user_groups(created_by);

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_group_memberships (
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_group_memberships_user ON public.user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_group ON public.user_group_memberships(group_id);

ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER helpers — undgår RLS-rekursion på memberships
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_memberships
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_memberships
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_member(UUID, UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_group_owner(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(UUID, UUID) TO authenticated;

-- Bootstrap: tilføj current user som owner af en nyoprettet gruppe.
-- Nødvendig fordi insert-RLS på memberships kræver at man ER owner —
-- men gruppen har ikke en owner endnu.
CREATE OR REPLACE FUNCTION public.bootstrap_group_owner(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_creator UUID;
BEGIN
  SELECT created_by INTO v_creator FROM public.user_groups WHERE id = p_group_id;
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Gruppe findes ikke';
  END IF;
  IF v_creator <> auth.uid() THEN
    RAISE EXCEPTION 'Kun gruppens skaber kan bootstrappe ownership';
  END IF;
  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (p_group_id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_group_owner(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_group_owner(UUID) TO authenticated;

-- ============================================================
-- RLS: user_group_memberships
-- ============================================================

DROP POLICY IF EXISTS "memberships select if member" ON public.user_group_memberships;
CREATE POLICY "memberships select if member" ON public.user_group_memberships
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "memberships insert by owner" ON public.user_group_memberships;
CREATE POLICY "memberships insert by owner" ON public.user_group_memberships
  FOR INSERT WITH CHECK (public.is_group_owner(group_id));

-- Slet egen membership (forlad) ELLER owner sletter andre
DROP POLICY IF EXISTS "memberships delete self or owner" ON public.user_group_memberships;
CREATE POLICY "memberships delete self or owner" ON public.user_group_memberships
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_group_owner(group_id)
  );

-- ============================================================
-- RLS: user_groups
-- ============================================================

DROP POLICY IF EXISTS "groups select if member" ON public.user_groups;
CREATE POLICY "groups select if member" ON public.user_groups
  FOR SELECT USING (public.is_group_member(id));

DROP POLICY IF EXISTS "groups insert by creator" ON public.user_groups;
CREATE POLICY "groups insert by creator" ON public.user_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "groups update by owner" ON public.user_groups;
CREATE POLICY "groups update by owner" ON public.user_groups
  FOR UPDATE USING (public.is_group_owner(id));

DROP POLICY IF EXISTS "groups delete by owner" ON public.user_groups;
CREATE POLICY "groups delete by owner" ON public.user_groups
  FOR DELETE USING (public.is_group_owner(id));

-- ============================================================
-- idea_group_shares: idéer delt med en hel gruppe
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idea_group_shares (
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (idea_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_group_shares_group ON public.idea_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_idea_group_shares_idea ON public.idea_group_shares(idea_id);

ALTER TABLE public.idea_group_shares ENABLE ROW LEVEL SECURITY;

-- Owner kan oprette/slette shares på egne idéer (og skal være medlem af gruppen)
DROP POLICY IF EXISTS "idea_group_shares owner all" ON public.idea_group_shares;
CREATE POLICY "idea_group_shares owner all" ON public.idea_group_shares
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
    AND shared_by_user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- Gruppe-medlemmer kan se share-rækken
DROP POLICY IF EXISTS "idea_group_shares group select" ON public.idea_group_shares;
CREATE POLICY "idea_group_shares group select" ON public.idea_group_shares
  FOR SELECT USING (public.is_group_member(group_id));

-- Udvid ideas-RLS: gruppe-medlemmer kan også læse idéer delt med deres grupper
DROP POLICY IF EXISTS "ideas read group shared" ON public.ideas;
CREATE POLICY "ideas read group shared" ON public.ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.idea_group_shares igs
      WHERE igs.idea_id = ideas.id AND public.is_group_member(igs.group_id)
    )
  );
