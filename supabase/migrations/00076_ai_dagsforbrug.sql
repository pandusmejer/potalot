-- ============================================================
-- 00076 — Dagligt loft på Gartner-spørgsmål (migration D, MVP 1.0 fase 4)
-- ============================================================
-- STATUS: ANVENDT PÅ PRODUKTION 6/11 2026 (manuelt, før B, efter særskilt godkendelse)
-- og efterkontrolleret — se Docs/product/fase4-migrationer/BD-udfoerelse.md.
-- Kør ikke igen mod produktion. Specifikation: D-gartner-dagsloft.md.
--
-- ⚠️ SKAL KØRES OG VERIFICERES FØR den nye Gartner-kode (fase 4) udrulles.
-- Koden kalder reserver_gartner_spoergsmaal() før hvert AI-kald og afviser
-- (503) hvis funktionen mangler eller fejler — loftet må aldrig fejle åbent.
-- Uden denne migration afvises derfor ALLE Gartner-spørgsmål, også på plantesider.
--
-- En tæller pr. bruger pr. DANSK kalenderdag og ÉN funktion, der reserverer et
-- spørgsmål i en enkelt SQL-sætning. INSERT … ON CONFLICT DO UPDATE … WHERE
-- antal < grænse låser rækken, så to samtidige kald aldrig begge får "det sidste"
-- spørgsmål. Grænsen kommer som parameter fra serveren (GARTNER_DAGLIGT_LOFT,
-- standard 30) og kan ændres uden migration.
--
-- Driftsstyring (omkostning/misbrug), IKKE analyse: egen tabel, egen opbevaring
-- (7 dage), ingen spørgsmål eller svar. Uafhængig af samtykke (B) og analyse (C).
--
-- Additiv: én ny tabel og én ny funktion. Intet eksisterende ændres.
-- Kolonnen hedder bevidst user_id: delete_account() (00057) rydder automatisk alle
-- public-tabeller med den kolonne, så kontosletning dækker tabellen uden ændringer.
-- ============================================================

BEGIN;

CREATE TABLE public.ai_dagsforbrug (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dato    date NOT NULL,
  antal   integer NOT NULL DEFAULT 0 CHECK (antal >= 0),
  PRIMARY KEY (user_id, dato)
);

-- Ingen direkte adgang for API-rollerne. RLS slået til uden politikker = intet,
-- og rettighederne fjernes derudover (forsvar i dybden). Kun funktionen herunder
-- (SECURITY DEFINER, ejer) skriver; service_role/postgres kan stadig bruge
-- tabellen (kontosletning, drift).
ALTER TABLE public.ai_dagsforbrug ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_dagsforbrug FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserver_gartner_spoergsmaal(p_graense integer)
RETURNS TABLE (tilladt boolean, brugt integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_dato  date := (now() AT TIME ZONE 'Europe/Copenhagen')::date;
  v_antal integer;
BEGIN
  -- Uden login eller med en ugyldig grænse reserveres intet.
  IF v_user IS NULL OR p_graense IS NULL OR p_graense < 1 THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO public.ai_dagsforbrug AS d (user_id, dato, antal)
  VALUES (v_user, v_dato, 1)
  ON CONFLICT (user_id, dato)
  DO UPDATE SET antal = d.antal + 1 WHERE d.antal < p_graense
  RETURNING d.antal INTO v_antal;

  IF v_antal IS NULL THEN            -- grænsen er nået: ingen række blev opdateret
    SELECT d.antal INTO v_antal FROM public.ai_dagsforbrug d
     WHERE d.user_id = v_user AND d.dato = v_dato;
    RETURN QUERY SELECT false, COALESCE(v_antal, 0);
  ELSE
    RETURN QUERY SELECT true, v_antal;
  END IF;

  -- Opportunistisk oprydning: kun brugerens egne rækker ældre end 7 dage.
  DELETE FROM public.ai_dagsforbrug d WHERE d.user_id = v_user AND d.dato < v_dato - 7;
END
$$;

REVOKE ALL ON FUNCTION public.reserver_gartner_spoergsmaal(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserver_gartner_spoergsmaal(integer) TO authenticated;

COMMIT;

-- ============================================================
-- ROLLBACK (køres IKKE automatisk — mister kun dagstællere).
-- ⚠️ Fjern ELLER erstat først kodens kvotekald: med kaldet i koden og funktionen
-- fjernet afvises alle Gartner-spørgsmål (fail closed). Se produktion/BD-03-rollback.sql.
--
--   BEGIN;
--   DROP FUNCTION IF EXISTS public.reserver_gartner_spoergsmaal(integer);
--   DROP TABLE IF EXISTS public.ai_dagsforbrug;
--   COMMIT;
-- ============================================================
