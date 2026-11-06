-- BD-03 — ROLLBACK af migration B (samtykke) og/eller D (dagsloft). KØRES ALDRIG AUTOMATISK.
-- Kør KUN den blok, der skal rulles tilbage. De to migrationer er uafhængige af hinanden.
--
-- ⚠️ Rækkefølgen mellem kode og database:
--   D: kodens kvotekald SKAL fjernes/erstattes FØR funktionen droppes — ellers afvises alle
--      Gartner-spørgsmål (fail closed, 503). Hurtigste nødudgang uden databaseændring:
--      sæt GARTNER_DAGLIGT_LOFT højt (fx 100000) i Netlify, eller publicér det forrige deploy.
--   B: koden tåler at kolonnerne mangler (samtykke = fra). Anbefaling: LAD kolonnerne STÅ.
--      De er harmløse (default false) og afspejler brugernes valg. Drop kun efter bevidst beslutning.
--
-- ==== B ====
BEGIN;
DROP TRIGGER IF EXISTS tr_profiles_ai_samtykke_tid ON public.profiles;
DROP FUNCTION IF EXISTS public.saet_ai_samtykke_tidspunkt();
REVOKE UPDATE (ai_personlig_kontekst) ON public.profiles FROM authenticated;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_personlig_kontekst,
                            DROP COLUMN IF EXISTS ai_personlig_kontekst_aendret;
COMMIT;

-- ==== D ====
BEGIN;
DROP FUNCTION IF EXISTS public.reserver_gartner_spoergsmaal(integer);
DROP TABLE IF EXISTS public.ai_dagsforbrug;
COMMIT;
