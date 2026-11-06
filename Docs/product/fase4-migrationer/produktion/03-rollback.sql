-- 03 — ROLLBACK af migration A (genåbner sikkerhedshullet — kun hvis appen ikke kan rettes frem).
-- Gendanner EXACT produktionens ACL målt 6/11 2026:
--   profiles: {postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}
--   ingen kolonne-ACL'er.
BEGIN;
DROP TRIGGER IF EXISTS tr_profiles_afvis_klient_roller ON public.profiles;
DROP FUNCTION IF EXISTS public.afvis_klient_aendring_af_roller();
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles TO anon, authenticated;
-- Kolonne-rettighederne fra migrationen fjernes, så ACL'en er identisk med før (før: ingen kolonne-ACL'er).
REVOKE UPDATE (display_name, username, avatar_url, user_mode, onboarded, latitude, longitude, location_name,
               garden_type, growing_areas, grower_profile, notification_profile, season_status,
               last_badge_backfill_at, updated_at) ON public.profiles FROM authenticated;
COMMIT;
