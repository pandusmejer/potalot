# Migration B — AI-samtykke på profilen

**Status:** princippet godkendt 6/11 (to profilfelter, standard `false`, tidsstempel sat af databasen, **B+ udskudt**). Specifikation — IKKE forberedt som fil og IKKE kørt; afventer godkendelse til at fortsætte med B og D, efter A er verificeret. Foreslået filnavn: `supabase/migrations/00074_profiles_ai_samtykke.sql`
**Afhænger af:** **A** (kolonne-rettigheder på `profiles`). Skal køres efter A.
**Formål:** gemme brugerens valg "Brug mine frø, planter og lokation til personlige råd" — standard **fra**, kan trækkes tilbage, og håndhæves af serveren.

Samtykket er et **særskilt formål**. Det må ikke deles med brugsanalyse (C) — ingen fælles kolonne, tabel eller tekst.

## 1. Verificeret nuværende tilstand

- `profiles` har ingen samtykke- eller AI-kolonne (live-DB, 6/11 2026). Kolonnerne er bl.a. `latitude`, `longitude`, `location_name`, `onboarded`, `notification_profile`.
- Brugere kan opdatere egen profilrække (`profiles update own`); efter **A** kun de udtrykkeligt tildelte kolonner.
- `getProfile()` læser `select('*')` — en ny kolonne kræver ingen ændring i eksisterende læsninger.
- Gartneren ([route.ts](../../../src/app/api/ai/gartner/route.ts)) får i dag aldrig frøbank, andre planter, stednavn eller vejr.

## 2. Den mindst indgribende ændring (B — anbefalet minimum)

To kolonner på `profiles`, ét valg og ét tidsstempel, som **databasen** sætter:

```sql
-- 00074_profiles_ai_samtykke.sql
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_personlig_kontekst boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_personlig_kontekst_aendret timestamptz;

COMMENT ON COLUMN public.profiles.ai_personlig_kontekst IS
  'Brugerens samtykke til at Gartneren må bruge frøbank, planter og lokation. Standard FRA.';
COMMENT ON COLUMN public.profiles.ai_personlig_kontekst_aendret IS
  'Sættes af trigger når samtykket ændres. Kan ikke skrives af klienten.';

-- Kun SELVE VALGET er skrivbart for brugeren (efter migration A er kolonner ellers låst).
GRANT UPDATE (ai_personlig_kontekst) ON public.profiles TO authenticated;

-- Tidsstemplet sættes af databasen, så det ikke kan forfalskes fra klienten.
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
```

*(En trigger kan sætte `NEW.ai_personlig_kontekst_aendret`, selv om brugeren ikke har UPDATE-rettighed på kolonnen: kolonnerettigheder tjekkes på de kolonner, selve `UPDATE`-sætningen nævner.)*

Nye rækker får `false`. `ADD COLUMN … NOT NULL DEFAULT <konstant>` er en metadata-ændring i Postgres 17 — ingen omskrivning af tabellen.

## 3. B+ (samtykkehistorik) — UDSKUDT (Anna 6/11)

*Besluttet: to profilfelter er nok til MVP'en; en historiktabel vurderes senere. SQL'en nedenfor er bevaret som reference og må ikke tages med i migrationen.* Det pålidelige tidsstempel er løst i punkt 2: databasen sætter `ai_personlig_kontekst_aendret` via trigger, og klienten kan ikke skrive kolonnen.

Et enkelt tidsstempel viser kun **seneste** ændring. Vil I kunne dokumentere hele forløbet (givet/trukket tilbage), kan en lille historiktabel tilføjes i samme migration:

```sql
CREATE TABLE public.ai_samtykke_historik (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aktiv    boolean NOT NULL,
  oprettet timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_samtykke_historik ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_samtykke_historik FROM anon, authenticated;
GRANT SELECT ON public.ai_samtykke_historik TO authenticated;
CREATE POLICY ai_samtykke_historik_laes_egen ON public.ai_samtykke_historik
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Skrives af en SECURITY DEFINER-funktion (brugeren har ingen INSERT-ret).
CREATE OR REPLACE FUNCTION public.log_ai_samtykke_aendring()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
BEGIN
  IF NEW.ai_personlig_kontekst IS DISTINCT FROM OLD.ai_personlig_kontekst THEN
    INSERT INTO public.ai_samtykke_historik (user_id, aktiv)
    VALUES (NEW.id, NEW.ai_personlig_kontekst);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tr_profiles_ai_samtykke_historik
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_ai_samtykke_aendring();
```

**Anbefaling (tidligere):** B+ ville give et påviseligt forløb. **Nu udskudt.** Hvis den tages op: kolonnen hedder bevidst `user_id`: `delete_account()` ([00057](../../../supabase/migrations/00057_delete_account.sql)) sletter automatisk rækker i alle `public`-tabeller med en `user_id`-kolonne, så kontosletning dækker den uden ændringer.

## 4. Serverhåndhævelse (kodekrav, ikke del af migrationen)

- Routen læser `ai_personlig_kontekst` **fra databasen ved hvert kald** med brugerens egen session. Klienten sender aldrig et samtykke-flag, og et sådant flag ville blive ignoreret.
- **Fail closed:** kolonne mangler (migration ikke kørt), forespørgselsfejl, `null` eller noget andet end `true` → intet personligt hentes.
- Al adgang til frøbank/planter/lokation sker gennem én port-funktion, der tager samtykket som parameter og returnerer intet, når det ikke er `true`. Den kan testes uden netværk.
- Svaret får headeren `X-Gartner-Kontekst` (fx `frobank,vejr`) uden indhold, så både brugeren og testen kan se, hvad der blev brugt.
- Handlingen, der ændrer valget, er en server action der kun skriver `ai_personlig_kontekst` på den indloggede brugers egen række.

## 5. Brugertekst (skal godkendes)

> **Brug mine frø, planter og lokation til personlige råd**
> Slået fra som standard. Slår du det til, kan Gartneren bruge det, der er relevant for dit spørgsmål: dine frø (art, sort, antal), dine planter (art, sort, status, sådato), dit stednavn og vejret nu. Gartneren får aldrig koordinater, adresse, e-mail, dine noter, fotos eller leverandør. Du kan slå det fra igen når som helst.

Privatlivssiden opdateres med, at spørgsmål og den valgte kontekst sendes til AI-leverandøren (Anthropic), og at samtykket kan trækkes tilbage.

## 6. Påvirkning og adgangsregler

| Hvem | Læse valget | Ændre valget | Ændre tidsstempel |
|---|---|---|---|
| Brugeren (egen række) | ja | **ja** | nej (trigger) |
| Anden bruger | nej (RLS) | nej (RLS) | nej |
| `anon` | nej | nej | nej |
| `service_role`/`postgres` | ja | ja | ja |

Ingen eksisterende læsning eller skrivning berøres.

## 7. Tests

1. **Standard:** `SELECT count(*) FROM profiles WHERE ai_personlig_kontekst IS NOT FALSE` = **0** efter migrationen.
2. **Brugeren kan selv:** PATCH egen række `{"ai_personlig_kontekst":true}` → 204; tidsstemplet er sat; PATCH `false` → tidsstemplet opdateres.
3. **Ikke andres:** PATCH en anden brugers række → 0 rækker berørt.
4. **Tidsstempel låst:** PATCH `{"ai_personlig_kontekst_aendret":"2000-01-01"}` → 42501.
5. **Urelateret opdatering** (fx `display_name`) ændrer ikke tidsstemplet.
6. **B+:** hvert skifte giver én historikrække; brugeren kan læse egne, ikke andres, og kan ikke skrive/slette.
7. **Kontosletning:** testkonto med historik slettes; `delete_account` returnerer tom liste, og ingen rækker er tilbage.
8. **Kode (i fase 4-implementeringen):** port-funktionen returnerer intet ved `false`/`null`/fejl/manglende kolonne; headeren afspejler det; to testkonti (med/uden samtykke) stiller samme spørgsmål; en fremmed `plantId` giver ingen kontekst.

## 8. Rollback

- **Kode-rollback (flag):** `NEXT_PUBLIC_MVP_MODE=off` fjerner Spørg Potalot-siden og den personlige kontekst; kolonnerne ligger uberørt og ubrugt (standard `false` = samtykke ikke givet).
- **Database-rollback er særskilt** og kræver en bevidst beslutning, fordi den sletter samtykkehistorik:
  ```sql
  DROP TRIGGER IF EXISTS tr_profiles_ai_samtykke_historik ON public.profiles;   -- B+
  DROP TRIGGER IF EXISTS tr_profiles_ai_samtykke_tid ON public.profiles;
  DROP FUNCTION IF EXISTS public.log_ai_samtykke_aendring();                    -- B+
  DROP FUNCTION IF EXISTS public.saet_ai_samtykke_tidspunkt();
  DROP TABLE IF EXISTS public.ai_samtykke_historik;                              -- B+
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_personlig_kontekst,
                                DROP COLUMN IF EXISTS ai_personlig_kontekst_aendret;
  ```
  **Anbefaling:** lad kolonnerne stå, hvis koden bare slås fra. De er harmløse og afspejler brugernes valg.
- **Hvis koden udrulles uden migrationen:** fail closed — Gartneren opfører sig som uden samtykke, og kontakten viser en rolig fejl i stedet for at lade som om valget er gemt.
