-- ============================================================
-- Slet konto (F3 — GDPR/launch): fuld data-sletning
-- ============================================================
-- Sletter ALLE rækker ejet af en bruger på tværs af hver public-tabel med en
-- user_id-kolonne (kun 2 cascader fra auth.users, så eksplicit sletning er
-- nødvendig for ikke at efterlade forældreløse data).
--
-- Retry-topologi: sletter det der kan slettes; en tabel der fejler pga. FK
-- prøves igen næste runde. Muterer IKKE listen mens FOREACH itererer (bygger
-- fejl-listen separat) — ellers springes elementer over. Returnerer de tabeller
-- der IKKE kunne ryddes (tom = 100% slettet), så kalderen kan verificere.
--
-- Kaldes KUN fra server-actionen via service-role-klienten med den
-- autentificerede brugers eget id. REVOKE fra anon/authenticated.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_account(p_user uuid)
RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  remaining text[];
  failed text[];
  t text;
  progress boolean;
BEGIN
  IF p_user IS NULL THEN RETURN ARRAY[]::text[]; END IF;

  SELECT array_agg(c.table_name)
    INTO remaining
  FROM information_schema.columns c
  JOIN information_schema.tables tb
    ON tb.table_schema = c.table_schema
   AND tb.table_name = c.table_name
   AND tb.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public' AND c.column_name = 'user_id';

  LOOP
    failed := ARRAY[]::text[];
    progress := false;
    FOREACH t IN ARRAY remaining LOOP
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', t) USING p_user;
        progress := true;
      EXCEPTION WHEN foreign_key_violation THEN
        failed := array_append(failed, t);  -- prøv igen næste runde
      END;
    END LOOP;
    remaining := failed;
    EXIT WHEN array_length(remaining, 1) IS NULL OR NOT progress;
  END LOOP;

  RETURN remaining;  -- tom = fuld sletning; ellers de blokerede tabeller
END $$;

REVOKE ALL ON FUNCTION public.delete_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_account(uuid) FROM authenticated;
