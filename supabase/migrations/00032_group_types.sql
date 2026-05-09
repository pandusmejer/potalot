-- ============================================================
-- Gruppe-typer: privat vs. interesse
-- ============================================================
-- Udvider user_groups med type, synlighed, forum-mode og kategori.
-- Eksisterende grupper behandles som private/hidden — de blev oprettet
-- som familie-/venne-grupper.
-- ============================================================

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'private'
    CHECK (group_type IN ('private', 'interest'));

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'hidden'
    CHECK (visibility IN ('open', 'closed', 'hidden'));

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS forum_mode TEXT NOT NULL DEFAULT 'simple_chat'
    CHECK (forum_mode IN ('simple_chat', 'structured_forum'));

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS icon TEXT;

CREATE INDEX IF NOT EXISTS idx_user_groups_type_visibility
  ON public.user_groups(group_type, visibility);

CREATE INDEX IF NOT EXISTS idx_user_groups_category
  ON public.user_groups(category)
  WHERE group_type = 'interest';

-- ============================================================
-- RLS: tillad alle authenticated brugere at se interessegrupper
-- som er open eller closed (men ikke hidden). Eksisterende policy
-- 'groups select if member' beholdes så medlemmer ser alle deres
-- grupper inkl. hidden ones.
-- ============================================================

DROP POLICY IF EXISTS "groups select if discoverable" ON public.user_groups;
CREATE POLICY "groups select if discoverable" ON public.user_groups
  FOR SELECT USING (
    group_type = 'interest' AND visibility IN ('open', 'closed')
  );

-- ============================================================
-- Opdatér create_user_group til at acceptere type/visibility/etc.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_user_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_group_type TEXT DEFAULT 'private',
  p_visibility TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_forum_mode TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id UUID;
  v_user UUID := auth.uid();
  v_visibility TEXT;
  v_forum_mode TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Ikke logget ind';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Gruppenavn er påkrævet';
  END IF;
  IF length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Gruppenavn er for langt';
  END IF;
  IF p_group_type NOT IN ('private', 'interest') THEN
    RAISE EXCEPTION 'Ugyldig gruppe-type';
  END IF;

  -- Default-visibility: privat → hidden, interesse → open
  v_visibility := COALESCE(p_visibility, CASE p_group_type WHEN 'private' THEN 'hidden' ELSE 'open' END);
  IF v_visibility NOT IN ('open', 'closed', 'hidden') THEN
    RAISE EXCEPTION 'Ugyldig synlighed';
  END IF;
  -- Privat-grupper må ikke være open
  IF p_group_type = 'private' AND v_visibility = 'open' THEN
    RAISE EXCEPTION 'Private grupper kan ikke være åbne';
  END IF;

  -- Default-forum-mode: privat → simple_chat, interesse → structured_forum
  v_forum_mode := COALESCE(p_forum_mode, CASE p_group_type WHEN 'private' THEN 'simple_chat' ELSE 'structured_forum' END);
  IF v_forum_mode NOT IN ('simple_chat', 'structured_forum') THEN
    RAISE EXCEPTION 'Ugyldig forum-mode';
  END IF;

  INSERT INTO public.user_groups (name, description, created_by, group_type, visibility, category, forum_mode)
  VALUES (
    trim(p_name),
    NULLIF(trim(coalesce(p_description, '')), ''),
    v_user,
    p_group_type,
    v_visibility,
    NULLIF(trim(coalesce(p_category, '')), ''),
    v_forum_mode
  )
  RETURNING id INTO v_id;

  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (v_id, v_user, 'owner');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_user_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Drop den gamle 2-arg version så vi ikke har overlap
DROP FUNCTION IF EXISTS public.create_user_group(TEXT, TEXT);

-- ============================================================
-- Tilslut åben interessegruppe direkte
-- ============================================================

CREATE OR REPLACE FUNCTION public.join_open_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_type TEXT;
  v_visibility TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Ikke logget ind';
  END IF;

  SELECT group_type, visibility INTO v_type, v_visibility
  FROM public.user_groups WHERE id = p_group_id;

  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Gruppe findes ikke';
  END IF;
  IF v_type <> 'interest' OR v_visibility <> 'open' THEN
    RAISE EXCEPTION 'Kun åbne interessegrupper kan tilsluttes direkte';
  END IF;

  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (p_group_id, v_user, 'member')
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_open_group(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_open_group(UUID) TO authenticated;
