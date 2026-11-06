-- ============================================================
-- 00074 — AI-samtykke på profilen (migration B, MVP 1.0 fase 4)
-- ============================================================
-- STATUS: ANVENDT PÅ PRODUKTION 6/11 2026 (manuelt, efter D, efter særskilt godkendelse)
-- og efterkontrolleret (BD-02: 28 × OK) — se Docs/product/fase4-migrationer/BD-udfoerelse.md.
-- Kør ikke igen mod produktion. Specifikation: B-ai-samtykke.md.
--
-- Gemmer brugerens valg "Brug mine frø, planter og lokation til personlige råd":
--   ai_personlig_kontekst          boolean NOT NULL DEFAULT false  (standard FRA)
--   ai_personlig_kontekst_aendret  timestamptz                     (sat af DATABASEN)
--
-- Afhænger af 00072 (A): efter A har authenticated kun UPDATE på en eksplicit
-- liste af kolonner, så den nye kolonne skal gives eksplicit — og KUN selve
-- valget, aldrig tidsstemplet.
--
-- Additiv: to nye kolonner, ét GRANT, én trigger. Ingen eksisterende data,
-- rettighed eller funktion ændres. Eksisterende profiler får false.
-- ADD COLUMN … NOT NULL DEFAULT <konstant> er en metadata-ændring (ingen omskrivning).
--
-- Kodens adfærd uden migrationen: samtykke = fra (fail closed), samtykkekortet
-- skjules. Koden kan derfor udrulles før eller efter denne migration.
-- ============================================================

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_personlig_kontekst boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_personlig_kontekst_aendret timestamptz;

COMMENT ON COLUMN public.profiles.ai_personlig_kontekst IS
  'Brugerens samtykke til at Gartneren må bruge frøbank, planter og lokation. Standard FRA. Læses af serveren ved hvert Gartner-kald.';
COMMENT ON COLUMN public.profiles.ai_personlig_kontekst_aendret IS
  'Sættes af trigger når samtykket ændres. Kan ikke skrives af klienten.';

-- Kun SELVE VALGET er skrivbart for brugeren (efter A er kolonner ellers låst).
GRANT UPDATE (ai_personlig_kontekst) ON public.profiles TO authenticated;

-- Tidsstemplet sættes af databasen, så det ikke kan forfalskes fra klienten.
-- SECURITY INVOKER: køres med brugerens egne rettigheder. En trigger må godt
-- sætte NEW.<kolonne>, selv om brugeren ikke har UPDATE på kolonnen —
-- kolonnerettigheder tjekkes kun for de kolonner, selve UPDATE-sætningen nævner.
CREATE OR REPLACE FUNCTION public.saet_ai_samtykke_tidspunkt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.ai_personlig_kontekst IS DISTINCT FROM OLD.ai_personlig_kontekst THEN
    NEW.ai_personlig_kontekst_aendret := now();
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS tr_profiles_ai_samtykke_tid ON public.profiles;
CREATE TRIGGER tr_profiles_ai_samtykke_tid
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.saet_ai_samtykke_tidspunkt();

COMMIT;

-- ============================================================
-- ROLLBACK (køres IKKE automatisk — sletter samtykkevalg og tidsstempler)
-- Anbefaling: lad kolonnerne stå, hvis koden bare slås fra; de er harmløse
-- (default false = samtykke ikke givet). Se også produktion/BD-03-rollback.sql.
--
--   BEGIN;
--   DROP TRIGGER IF EXISTS tr_profiles_ai_samtykke_tid ON public.profiles;
--   DROP FUNCTION IF EXISTS public.saet_ai_samtykke_tidspunkt();
--   REVOKE UPDATE (ai_personlig_kontekst) ON public.profiles FROM authenticated;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_personlig_kontekst,
--                                 DROP COLUMN IF EXISTS ai_personlig_kontekst_aendret;
--   COMMIT;
-- ============================================================
