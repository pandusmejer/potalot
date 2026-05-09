-- ============================================================
-- Tags + fokusplanter på interessegrupper
-- ============================================================
-- Erstatter den gamle 'category'-kolonne (en flad enum) med:
--   - tags TEXT[]: lukket vokabular pr. akse (sted/stil/niveau & emne)
--   - focus_plants TEXT[]: fri tekst (autocomplete fra guides)
-- 'category' beholdes som dead-column indtil næste migration.
-- ============================================================

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.user_groups
  ADD COLUMN IF NOT EXISTS focus_plants TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.user_groups
  DROP CONSTRAINT IF EXISTS user_groups_tags_max_5;
ALTER TABLE public.user_groups
  ADD CONSTRAINT user_groups_tags_max_5 CHECK (cardinality(tags) <= 5);

ALTER TABLE public.user_groups
  DROP CONSTRAINT IF EXISTS user_groups_focus_plants_max_5;
ALTER TABLE public.user_groups
  ADD CONSTRAINT user_groups_focus_plants_max_5 CHECK (cardinality(focus_plants) <= 5);

CREATE INDEX IF NOT EXISTS idx_user_groups_tags ON public.user_groups USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_groups_focus_plants ON public.user_groups USING GIN(focus_plants);

-- Backfill: konvertér eksisterende category til ny model
UPDATE public.user_groups SET focus_plants = ARRAY[
  CASE category
    WHEN 'chili' THEN 'Chili'
    WHEN 'tomater' THEN 'Tomater'
    WHEN 'groentsager' THEN 'Grøntsager'
    WHEN 'blomster' THEN 'Blomster'
    WHEN 'krydderurter' THEN 'Krydderurter'
  END
]::text[]
WHERE group_type = 'interest'
  AND category IN ('chili', 'tomater', 'groentsager', 'blomster', 'krydderurter')
  AND cardinality(focus_plants) = 0;

UPDATE public.user_groups SET tags = ARRAY[
  CASE category
    WHEN 'drivhus' THEN 'drivhus'
    WHEN 'altanhave' THEN 'altan'
    WHEN 'froebytte' THEN 'froebytte'
    WHEN 'bivenlig' THEN 'bivenlig'
    WHEN 'begyndere' THEN 'begyndere'
    WHEN 'oevede' THEN 'oevede'
  END
]::text[]
WHERE group_type = 'interest'
  AND category IN ('drivhus', 'altanhave', 'froebytte', 'bivenlig', 'begyndere', 'oevede')
  AND cardinality(tags) = 0;

-- ============================================================
-- create_user_group: accept tags + focus_plants
-- ============================================================

DROP FUNCTION IF EXISTS public.create_user_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_user_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_group_type TEXT DEFAULT 'private',
  p_visibility TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,  -- bevares for compat, ignoreres
  p_forum_mode TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_focus_plants TEXT[] DEFAULT '{}'
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
  IF cardinality(coalesce(p_tags, '{}')) > 5 THEN
    RAISE EXCEPTION 'Maks. 5 tags pr. gruppe';
  END IF;
  IF cardinality(coalesce(p_focus_plants, '{}')) > 5 THEN
    RAISE EXCEPTION 'Maks. 5 fokusplanter pr. gruppe';
  END IF;

  v_visibility := COALESCE(p_visibility, CASE p_group_type WHEN 'private' THEN 'hidden' ELSE 'open' END);
  IF v_visibility NOT IN ('open', 'closed', 'hidden') THEN
    RAISE EXCEPTION 'Ugyldig synlighed';
  END IF;
  IF p_group_type = 'private' AND v_visibility = 'open' THEN
    RAISE EXCEPTION 'Private grupper kan ikke være åbne';
  END IF;

  v_forum_mode := COALESCE(p_forum_mode, CASE p_group_type WHEN 'private' THEN 'simple_chat' ELSE 'structured_forum' END);
  IF v_forum_mode NOT IN ('simple_chat', 'structured_forum') THEN
    RAISE EXCEPTION 'Ugyldig forum-mode';
  END IF;

  INSERT INTO public.user_groups (
    name, description, created_by, group_type, visibility, forum_mode,
    tags, focus_plants
  )
  VALUES (
    trim(p_name),
    NULLIF(trim(coalesce(p_description, '')), ''),
    v_user,
    p_group_type,
    v_visibility,
    v_forum_mode,
    coalesce(p_tags, '{}'),
    coalesce(p_focus_plants, '{}')
  )
  RETURNING id INTO v_id;

  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (v_id, v_user, 'owner');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_user_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) TO authenticated;

-- ============================================================
-- Autocomplete: hent unikke plantenavne fra guides
-- ============================================================

CREATE OR REPLACE FUNCTION public.suggest_focus_plants(p_query TEXT, p_limit INT DEFAULT 10)
RETURNS TABLE(plant_name TEXT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT DISTINCT g.plant_name
  FROM public.guides g
  WHERE g.plant_name ILIKE ('%' || coalesce(p_query, '') || '%')
  ORDER BY g.plant_name
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.suggest_focus_plants(TEXT, INT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.suggest_focus_plants(TEXT, INT) TO authenticated;
