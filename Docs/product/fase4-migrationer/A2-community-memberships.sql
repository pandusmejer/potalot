-- A2 (FORSLAG, ikke i supabase/migrations/): stram community_memberships.
-- Foreslået nummer ved godkendelse: 00073 (B, C og D er derfor 00074, 00075, 00076).
--
-- STATUS: forberedt og testet i isoleret miljø — IKKE anvendt på live.
--
-- Fund (verificeret 6/11 2026):
--  * Politikken "Users manage own memberships" er FOR ALL USING (auth.uid() = user_id)
--    uden WITH CHECK: en bruger kan selv oprette/ændre sin egen række — inkl. role
--    = 'moderator' (CHECK tillader 'member' og 'moderator') — for ethvert group_id.
--  * "Memberships readable by member" lader ALLE indloggede læse ALLE rækker.
--  * Tabellen er et ældre fase-8-lag: 0 rækker, ingen kode refererer til den
--    (gruppe-funktionen bruger user_group_memberships), og ingen RLS-politik på andre
--    tabeller slår op i den. Rollen har altså i dag ingen konsekvens.
--  * Risikoen er latent: den bliver reel, hvis fællesskabs-funktionen genaktiveres, eller
--    en fremtidig politik begynder at stole på role.
--
-- Løsning: gør rollen umulig at selv-tildele, og begræns læsning til egne rækker.
-- Tabellen er tom, så ingen eksisterende data berøres. Roller ud over 'member' kan fortsat
-- tildeles af service_role/postgres (og senere af en gruppeejer via en dedikeret funktion).

BEGIN;

DROP POLICY IF EXISTS "Users manage own memberships" ON public.community_memberships;
DROP POLICY IF EXISTS "Memberships readable by member" ON public.community_memberships;

-- Idempotens: de nye politikker droppes først, så filen kan køres igen.
DROP POLICY IF EXISTS community_memberships_laes_egen ON public.community_memberships;
DROP POLICY IF EXISTS community_memberships_opret_egen ON public.community_memberships;
DROP POLICY IF EXISTS community_memberships_ret_egen ON public.community_memberships;
DROP POLICY IF EXISTS community_memberships_slet_egen ON public.community_memberships;

-- Læs: kun egne rækker (tidligere: alle indloggede kunne læse alle).
CREATE POLICY community_memberships_laes_egen ON public.community_memberships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Opret: kun for sig selv og KUN som 'member' (eller uden angivet rolle → standard 'member').
CREATE POLICY community_memberships_opret_egen ON public.community_memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(role, 'member') = 'member');

-- Ret: egen række, og rollen må ikke blive andet end 'member' via klienten.
CREATE POLICY community_memberships_ret_egen ON public.community_memberships
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND COALESCE(role, 'member') = 'member');

-- Forlad: egen række.
CREATE POLICY community_memberships_slet_egen ON public.community_memberships
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Belt and braces: klienten må heller ikke have kolonne-rettighed til at ændre rollen,
-- hverken via UPDATE eller INSERT. (Fjern tabelniveau-skrivning og giv kolonner tilbage.)
REVOKE INSERT, UPDATE ON public.community_memberships FROM anon, authenticated;
GRANT INSERT (group_id, user_id, invited_at, joined_at, declined_at) ON public.community_memberships TO authenticated;
GRANT UPDATE (joined_at, declined_at) ON public.community_memberships TO authenticated;
REVOKE TRUNCATE ON public.community_memberships FROM anon, authenticated;

COMMIT;

-- ROLLBACK (genåbner fejlen):
--   BEGIN;
--   DROP POLICY IF EXISTS community_memberships_laes_egen ON public.community_memberships;
--   DROP POLICY IF EXISTS community_memberships_opret_egen ON public.community_memberships;
--   DROP POLICY IF EXISTS community_memberships_ret_egen ON public.community_memberships;
--   DROP POLICY IF EXISTS community_memberships_slet_egen ON public.community_memberships;
--   CREATE POLICY "Memberships readable by member" ON public.community_memberships
--     FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
--   CREATE POLICY "Users manage own memberships" ON public.community_memberships
--     FOR ALL USING (auth.uid() = user_id);
--   GRANT INSERT, UPDATE, TRUNCATE ON public.community_memberships TO anon, authenticated;
--   COMMIT;
