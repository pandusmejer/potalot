-- 00072: Luk for at brugere kan tildele sig selv administratorrettigheder.
--
-- STATUS: ANVENDT PÅ PRODUKTION 6/11 2026 (manuelt, efter særskilt godkendelse) og
-- efterkontrolleret — se Docs/product/fase4-migrationer/A-udfoerelse-2026-11-06.md.
-- Kør ALDRIG igen mod produktion (idempotent opsætning er ikke garanteret for GRANT/REVOKE-rækkefølgen).
--
-- Problem (verificeret read-only 6/11 2026): `authenticated` har tabelniveau-
-- UPDATE på public.profiles, og RLS-politikken "profiles update own" beskytter
-- kun RÆKKER (auth.uid() = id), ikke kolonner. En indlogget bruger kunne derfor
-- sætte sin egen is_admin = true via API'et — og 7 migrationers RLS-politikker
-- samt requireAdmin() stoler på kolonnen.
--
-- Bemærk: en kolonne-REVOKE (REVOKE UPDATE (is_admin) …) virker IKKE, så længe
-- tabelniveau-rettigheden findes. Derfor fjernes den, og kun de kolonner appen
-- faktisk skriver gives tilbage.
--
-- Additiv i effekt: ingen data ændres eller slettes. Kun rettigheder og en trigger.
-- Rollback: se kommentaren nederst.

BEGIN;

-- 1) Fjern skriverettigheder på tabelniveau for klientrollerne.
--    INSERT: profiler oprettes af handle_new_user (SECURITY DEFINER, ejer: postgres) —
--            aldrig af klienten. Uden INSERT kan en bruger uden profilrække ikke
--            oprette sin egen med is_admin = true.
--    DELETE/TRUNCATE: ingen klientvej findes (RLS har ingen DELETE-politik); fjernes
--            for mindste rettighed.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated;

-- 2) Giv KUN de kolonner tilbage, appen faktisk skriver (verificeret i koden:
--    updateProfile, saveOnboardingPreferences, backfillAllBadges).
--    Ikke med: id, created_at, is_admin, subscription_tier.
GRANT UPDATE (
  display_name, username, avatar_url, user_mode, onboarded,
  latitude, longitude, location_name,
  garden_type, growing_areas, grower_profile, notification_profile, season_status,
  last_badge_backfill_at, updated_at
) ON public.profiles TO authenticated;

-- 3) Andet lag: afvis ændring af rolle-/tier-kolonner fra klientrollerne, hvis
--    nogen senere kommer til at give rettigheden tilbage.
--    SECURITY INVOKER er et KRAV: med SECURITY DEFINER ville current_user være
--    funktionsejeren, og kontrollen ville aldrig ramme klientrollerne.
CREATE OR REPLACE FUNCTION public.afvis_klient_aendring_af_roller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.is_admin IS DISTINCT FROM OLD.is_admin
          OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) THEN
    RAISE EXCEPTION 'Rettigheder kan ikke ændres af brugeren'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS tr_profiles_afvis_klient_roller ON public.profiles;
CREATE TRIGGER tr_profiles_afvis_klient_roller
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.afvis_klient_aendring_af_roller();

COMMIT;

-- ROLLBACK (kun hvis appen går i stykker — og GENÅBNER sikkerhedshullet; foretræk frem-rettelse
-- ved at tilføje den manglende kolonne til GRANT UPDATE (…) ovenfor):
--
--   BEGIN;
--   DROP TRIGGER IF EXISTS tr_profiles_afvis_klient_roller ON public.profiles;
--   DROP FUNCTION IF EXISTS public.afvis_klient_aendring_af_roller();
--   GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles TO anon, authenticated;
--   COMMIT;
