-- ============================================================
-- create_user_group: opret gruppe + ejer-membership atomisk
-- ============================================================
-- Tidligere lavede vi to separate operationer (INSERT user_groups,
-- derefter bootstrap_group_owner). Det fejlede på Supabase fordi insert-
-- policy'en på user_groups gav 'new row violates RLS'. Den her SECURITY
-- DEFINER-RPC bypass'er RLS og garanterer at gruppen og ejer-membership
-- altid oprettes i samme transaktion.

CREATE OR REPLACE FUNCTION public.create_user_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id UUID;
  v_user UUID := auth.uid();
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

  INSERT INTO public.user_groups (name, description, created_by)
  VALUES (trim(p_name), NULLIF(trim(coalesce(p_description, '')), ''), v_user)
  RETURNING id INTO v_id;

  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (v_id, v_user, 'owner');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_group(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_user_group(TEXT, TEXT) TO authenticated;

-- bootstrap_group_owner er ikke længere nødvendig — drop den så vi ikke
-- har dead code i db'en. Hvis du har eksisterende code der kalder den,
-- skal den opdateres til create_user_group.
DROP FUNCTION IF EXISTS public.bootstrap_group_owner(UUID);
