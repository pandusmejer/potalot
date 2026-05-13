-- ============================================================
-- Guide-sletning: stats + atomisk relink + sletning
-- ============================================================
-- (a) guide_usage_stats: hvor mange items/planter/sorter/brugere
--     bliver berørt? Hvilken replacement-guide kan tilbydes?
-- (b) delete_guide_with_relink: re-pointer alle orphans til ny guide
--     INDEN sletningen, så data ikke går gennem SET NULL hvis admin
--     har bedt om relink. Returnerer affected_user_ids så server-
--     action kan sende notifikationer.
-- ============================================================

CREATE OR REPLACE FUNCTION public.guide_usage_stats(p_guide_id UUID)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_plant_name TEXT;
  v_owner UUID;
  v_replacement UUID;
BEGIN
  SELECT plant_name, user_id INTO v_plant_name, v_owner
  FROM public.guides WHERE id = p_guide_id;
  IF v_plant_name IS NULL THEN
    RETURN jsonb_build_object('error', 'Guide ikke fundet');
  END IF;

  -- Find bedste replacement: en anden guide med samme plant_name.
  -- Foretrækker master (user_id IS NULL). Hvis vi sletter en bruger-
  -- guide og kun andre user-guides matcher, falder vi tilbage til
  -- ejerens egen anden user-guide med samme navn.
  SELECT id INTO v_replacement
  FROM public.guides
  WHERE id <> p_guide_id
    AND plant_name ILIKE v_plant_name
    AND user_id IS NULL
  ORDER BY created_at DESC LIMIT 1;

  IF v_replacement IS NULL AND v_owner IS NOT NULL THEN
    SELECT id INTO v_replacement
    FROM public.guides
    WHERE id <> p_guide_id
      AND plant_name ILIKE v_plant_name
      AND user_id = v_owner
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'inventory_items', (SELECT count(*) FROM public.inventory_items WHERE guide_id = p_guide_id),
    'plants', (SELECT count(*) FROM public.plants_v2 WHERE guide_id = p_guide_id),
    'varieties', (SELECT count(*) FROM public.group_varieties WHERE guide_id = p_guide_id),
    'affected_users', (
      SELECT count(DISTINCT u) FROM (
        SELECT user_id AS u FROM public.inventory_items WHERE guide_id = p_guide_id
        UNION
        SELECT user_id FROM public.plants_v2 WHERE guide_id = p_guide_id
        UNION
        SELECT created_by FROM public.group_varieties WHERE guide_id = p_guide_id
      ) all_users
    ),
    'replacement_guide_id', v_replacement,
    'replacement_guide_label', (
      SELECT CASE WHEN g.user_id IS NULL THEN g.plant_name || ' (master)'
                  ELSE g.plant_name || ' (bruger)' END
      FROM public.guides g WHERE g.id = v_replacement
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.guide_usage_stats(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.guide_usage_stats(UUID) TO authenticated;

-- ============================================================
-- delete_guide_with_relink: re-link + slet i én operation
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_guide_with_relink(
  p_guide_id UUID,
  p_replacement_guide_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_guide_owner UUID;
  v_plant_name TEXT;
  v_affected_user_ids UUID[];
  v_relinked_inv INT := 0;
  v_relinked_plants INT := 0;
  v_relinked_varieties INT := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Ikke logget ind';
  END IF;

  SELECT user_id, plant_name INTO v_guide_owner, v_plant_name
  FROM public.guides WHERE id = p_guide_id;
  IF v_plant_name IS NULL THEN
    RAISE EXCEPTION 'Guide ikke fundet';
  END IF;

  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_user;

  -- Autorisation: ejer eller admin
  IF v_guide_owner IS DISTINCT FROM v_user AND NOT coalesce(v_is_admin, false) THEN
    RAISE EXCEPTION 'Du har ikke tilladelse til at slette denne guide';
  END IF;

  -- Saml berørte brugere INDEN vi rører ved data
  SELECT array_agg(DISTINCT u) INTO v_affected_user_ids
  FROM (
    SELECT user_id AS u FROM public.inventory_items WHERE guide_id = p_guide_id
    UNION
    SELECT user_id FROM public.plants_v2 WHERE guide_id = p_guide_id
    UNION
    SELECT created_by FROM public.group_varieties WHERE guide_id = p_guide_id
  ) au
  WHERE u IS NOT NULL;

  -- Re-link hvis replacement angivet
  IF p_replacement_guide_id IS NOT NULL THEN
    UPDATE public.inventory_items SET guide_id = p_replacement_guide_id WHERE guide_id = p_guide_id;
    GET DIAGNOSTICS v_relinked_inv = ROW_COUNT;
    UPDATE public.plants_v2 SET guide_id = p_replacement_guide_id WHERE guide_id = p_guide_id;
    GET DIAGNOSTICS v_relinked_plants = ROW_COUNT;
    UPDATE public.group_varieties SET guide_id = p_replacement_guide_id WHERE guide_id = p_guide_id;
    GET DIAGNOSTICS v_relinked_varieties = ROW_COUNT;
  END IF;

  -- Slet guiden (FK SET NULL rammer eventuelle rester)
  DELETE FROM public.guides WHERE id = p_guide_id;

  RETURN jsonb_build_object(
    'plant_name', v_plant_name,
    'affected_user_ids', coalesce(v_affected_user_ids, ARRAY[]::UUID[]),
    'relinked_inventory', v_relinked_inv,
    'relinked_plants', v_relinked_plants,
    'relinked_varieties', v_relinked_varieties
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_guide_with_relink(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_guide_with_relink(UUID, UUID) TO authenticated;
