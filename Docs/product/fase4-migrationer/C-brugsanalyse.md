# Migration C — minimal intern brugsanalyse (MVP-test)

**Status: UDSKUDT (Anna 6/11) og DEAKTIVERET.** Ingen identificerbar hændelseslog aktiveres uden særskilt beslutning. Specifikationen herunder er forberedelse, ikke en plan. **Afsnit 0 er den konkrete, mindst indgribende anbefaling** (brug eksisterende data først).
**Foreslået filnavn:** `supabase/migrations/00075_app_haendelser.sql`
**Afhænger af:** A (rettighedsmodellen). Uafhængig af B — **bevidst ingen fælles felter, tabeller eller tekster med samtykket**.
**Formål (ét, afgrænset):** besvare MVP-testens spørgsmål: opretter brugerne en frøbank, bruger de scan eller manuel registrering, bruger de Gartneren, og vender de tilbage?

## 0. Konkret anbefaling: mindst indgribende målemodel

**Trin M0 — ingen nye data (anbefalet først).** Brug det, appen allerede gemmer som indhold brugeren selv har oprettet. Det kræver **ingen** ny logning, ingen migration og ingen ny behandling; analysen kører som SQL, ejeren selv udfører.

| Testspørgsmål | Eksisterende data (kolonner verificeret live 6/11) | Forespørgsel i princip |
|---|---|---|
| Aktivering: har de oprettet en frøbank? | `inventory_items.created_at` pr. bruger | antal poser pr. bruger; tid fra `auth.users.created_at` til første pose |
| Opretter de dyrkninger fra frøbanken? | `plants_v2.source_inventory_id IS NOT NULL`, `created_at` | andel brugere med ≥ 1 |
| Bruger de opgaver? | `calendar_tasks.completed_at`, `plant_task_completions.completed_at` | brugere med ≥ 1 udført |
| Vender de tilbage? | de egne rækkers tidsstempler: antal **forskellige dage med aktivitet** (`created_at::date` på poser, planter, logposter, udførte opgaver) og `auth.users.last_sign_in_at` (seneste login) | aktive dage pr. bruger; "aktiv i uge 2 efter tilmelding" |
| Bruger de Gartneren? | `ai_conversations` — kun så længe ikke-logbundne samtaler stadig gemmes; **ophører** når vi stopper den lagring | optælling, ingen læsning af indhold |

Begrænsninger: "vender tilbage" måles kun ud fra *oprettelser*, ikke rene besøg; `last_sign_in_at` er kun seneste login. Det er et groft, men ærligt mål, og det kræver ingen ny registrering.

**Trin M1 — kun hvis M0 ikke er nok: anonyme daglige tællere (model 3 nedenfor).** Dækker det, M0 ikke kan: *scan vs. manuel*, *scan gennemført* og *Gartner-spørgsmål pr. dag*. En tabel `(dato, haendelse, antal)` **uden bruger-id**, opdateret af en funktion der kun lægger 1 til. Ingen personoplysninger ⇒ intet behandlingsgrundlag til afklaring, ingen sletteanmodninger, ingen indsigtsret, og ingen cookies. Kan ikke besvare "hvor mange forskellige brugere kommer tilbage" — det klarer M0 groft.

**Trin M2 — identificerbare hændelser (resten af dette dokument): kun efter særskilt beslutning**, hvis M0+M1 ikke kan besvare testens spørgsmål.

**Dataminimering, behandlingsgrundlag, sletning og adgang for M0/M1:**
- M0: ingen ny behandling; eksisterende brugerdata læses af ejeren i det omfang, det kræves for at drive tjenesten. Resultatet gemmes kun aggregeret.
- M1: ingen personoplysninger. Opbevaring ubegrænset for tællerne (kun tal pr. dag), eller 12 måneder. Adgang: kun ejeren (ingen politik for brugere).
- Hændelseskald i scan-/manuel-flowet (beslutning 5) bygges **først sammen med M1** og aldrig før en godkendt løsning; en målefejl må aldrig blokere scanning eller manuel registrering (fire-and-forget, fejl sluges).

## 1. Hvad kan allerede måles uden noget nyt (verificeret)

| Spørgsmål | Eksisterende data |
|---|---|
| Opretter og vedligeholder de en frøbank? | `inventory_items` (antal, `created_at`) |
| Opretter de dyrkninger fra frøbanken? | `plants_v2.source_inventory_id` + `created_at` |
| Bruger de opgaver? | `calendar_tasks.completed_at`, `plant_task_completions` |
| Bruger de korte guides? | ikke målbart (ingen data) — springes over |

Ikke målbart i dag: **scan vs. manuel** (oprettelsesmåden gemmes ikke), **Gartner-brug** og **om de vender tilbage**.

## 2. Forslag: seks hændelser, ingen indhold

| Hændelse | Hvor registreres | Kommentar |
|---|---|---|
| `app_aabnet` | server action kaldt fra en lille klientkomponent ved sidehentning; højst én pr. bruger pr. dag (unikt indeks) | kun et tidsstempel; **ingen cookie, ingen localStorage** |
| `scan_paabegyndt` | i `extractSeedPacketFields` (server) | ét kald, wrap i try/catch |
| `scan_gennemfoert` | efter vellykket oprettelse i scan-stien (`tilfoej-flow.tsx`) | **to små linjer i scan-filen — kræver jeres godkendelse** (beslutning 5) |
| `froe_oprettet_manuelt` | efter vellykket oprettelse i `manuel-opret.tsx` | rører ikke scanneren |
| `gartner_spoergsmaal` | i Gartner-routen efter reservation af dagskvoten | **uden** spørgsmål, svar eller kontekst |
| `gartner_spoergsmaal_personligt` | samme, når personlig kontekst faktisk blev brugt | kun at samtykket blev brugt, ikke hvad |

Alle kald er "fire and forget": en fejl i målingen må **aldrig** blokere registreringen, scanningen eller Gartneren. Scannerens funktionalitet, AI-udtræk og rettetrin ændres ikke.

## 3. Vurdering (skal godkendes før aktivering)

> Dette er et beslutningsgrundlag, ikke en juridisk afgørelse. Behandlingsgrundlag og samtykkekrav bør bekræftes af Anna og evt. en juridisk rådgiver/DPO, før analysen tændes.

**Karakter.** Rækkerne er knyttet til et bruger-id og er derfor **personoplysninger** (pseudonyme, ikke anonyme), selv uden indhold. Reglerne om personoplysninger gælder uanset teknik.

**Cookies/lignende teknologier er et andet spørgsmål.** Cookiereglerne handler om at gemme eller læse oplysninger på brugerens enhed. Forslaget gør det **ikke**: registreringen sker udelukkende på serveren; der indsættes ingen cookie, ingen localStorage/IndexedDB, ingen tredjeparts-SDK, ingen fingeraftryk, ingen IP/user-agent. Den dagsvise dedublering sker i databasen. Appens eksisterende login-cookie er teknisk nødvendig og uændret. (Konklusionen "ingen samtykke til *cookies*" ophæver ikke GDPR-kravene nedenfor.)

| Emne | Forslag | Åbent punkt til jer |
|---|---|---|
| **Formål** | Kun MVP-test og produktforbedring. Må ikke bruges til reklame, profilering eller andet. | godkend |
| **Behandlingsgrundlag** | Berettiget interesse (GDPR art. 6(1)(f)) — minimal, forventelig, uden indhold. Alternativ: samtykke (art. 6(1)(a)). | **Beslutning 6:** er berettiget interesse tilstrækkeligt, eller skal der være et særskilt valg? |
| **Dataminimering** | Bruger-id + hændelsestype + tidspunkt/dato. **Aldrig:** spørgsmål/svar, plante-/frønavne, noter, stednavn/koordinater, enhedsdata, IP. | — |
| **Gennemsigtighed** | Én kort, tydelig passage i privatlivssiden (hvad, hvorfor, hvor længe, hvordan man sletter). | godkend teksten |
| **Opbevaring** | **180 dage** for MVP-testen (foreslået), derefter slettes rækkerne. Absolut loft 12 måneder. | vælg periode |
| **Sletning** | Automatisk ved kontosletning: kolonnen hedder `user_id`, så `delete_account()` ([00057](../../../supabase/migrations/00057_delete_account.sql)) dækker tabellen, og FK'en har `ON DELETE CASCADE`. | — |
| **Oprydning af gamle rækker** | `pg_cron` er **ikke** installeret (verificeret). Foreslået funktion `ryd_gamle_haendelser(dage)` kaldes manuelt/månedligt af ejeren med service-role, indtil et planlagt job findes. | accepter manuelt job, eller aktivér `pg_cron` |
| **Adgangskontrol** | Brugere kan **hverken læse, ændre eller slette** rækkerne (ingen SELECT/UPDATE/DELETE-politik, rettigheder fjernet). Kun ejeren via SQL/service-role. Indsættelse er begrænset til egne rækker og kun kolonnen `haendelse`. | — |
| **Indsigtsret** | Besvares af ejeren via SQL på anmodning (uddrag for ét bruger-id). | accepter |
| **Aktivering** | Tabellen kan oprettes **inaktiv**. Koden registrerer kun, når en server-miljøvariabel (`ANALYSE_HAENDELSER=on`) er sat; standard er fra. | **Først tændt efter jeres godkendelse af denne vurdering** |

### Alternativer til afvejning

| Model | Personoplysninger? | Kan besvare "vender de tilbage?" | Anbefaling |
|---|---|---|---|
| 1. Identificerbare hændelser (dette forslag) | ja (pseudonyme) | ja | **anbefalet** med information, 180 dage og stram adgang — hvis berettiget interesse godkendes |
| 2. Hændelser med HMAC af bruger-id (server-hemmelighed) | ja (stadig pseudonyme) | ja | lille ekstra værn ved databaselæk; ikke nødvendigt i sig selv |
| 3. Kun daglige tællere pr. hændelse (ingen bruger-id) | **nej** | nej — kun "hvor mange i alt" | det mindst indgribende; kan ikke vise tilbagevendende brugere |
| 4. Som 1, men kun for brugere der har sagt ja (valg i Indstillinger) | ja | ja, men bias mod villige brugere | hvis jeres vurdering kræver samtykke |

## 4. SQL (op) — model 1, inaktiv til den aktiveres i koden

```sql
-- 00075_app_haendelser.sql
BEGIN;

CREATE TABLE public.app_haendelser (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- BEVIDST navn "user_id": delete_account() rydder alle tabeller med denne kolonne.
  user_id   uuid NOT NULL DEFAULT auth.uid()
            REFERENCES public.profiles(id) ON DELETE CASCADE,
  haendelse text NOT NULL CHECK (haendelse IN (
    'app_aabnet','scan_paabegyndt','scan_gennemfoert',
    'froe_oprettet_manuelt','gartner_spoergsmaal','gartner_spoergsmaal_personligt'
  )),
  oprettet  timestamptz NOT NULL DEFAULT now(),
  dato      date NOT NULL DEFAULT ((now() AT TIME ZONE 'Europe/Copenhagen')::date)
);

COMMENT ON TABLE public.app_haendelser IS
  'Intern MVP-brugsanalyse. Ingen indhold. Opbevares højst 180 dage. Se Docs/product/fase4-migrationer/C-brugsanalyse.md';

CREATE INDEX app_haendelser_haendelse_tid ON public.app_haendelser (haendelse, oprettet);
-- Højst én "app_aabnet" pr. bruger pr. dag (dedublering i databasen, ikke på enheden).
CREATE UNIQUE INDEX app_haendelser_aabnet_pr_dag
  ON public.app_haendelser (user_id, dato) WHERE haendelse = 'app_aabnet';

ALTER TABLE public.app_haendelser ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_haendelser FROM anon, authenticated;
-- Brugeren må KUN indsætte kolonnen "haendelse"; user_id/oprettet/dato sættes af databasen.
GRANT INSERT (haendelse) ON public.app_haendelser TO authenticated;
CREATE POLICY app_haendelser_indsaet_egen ON public.app_haendelser
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Ingen SELECT-, UPDATE- eller DELETE-politik: brugere kan ikke læse eller ændre rækkerne.

-- Oprydning (kaldes af ejeren med service-role, indtil et planlagt job findes).
CREATE OR REPLACE FUNCTION public.ryd_gamle_haendelser(p_dage integer DEFAULT 180)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  WITH slettet AS (
    DELETE FROM public.app_haendelser
    WHERE oprettet < now() - make_interval(days => p_dage)
    RETURNING 1
  ) SELECT count(*)::integer FROM slettet
$$;
REVOKE ALL ON FUNCTION public.ryd_gamle_haendelser(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ryd_gamle_haendelser(integer) TO service_role;

COMMIT;
```

*(Identity-kolonner kræver ikke separat rettighed på deres sekvens ved INSERT. Koden ignorerer den unikke fejl (23505) for `app_aabnet`, så hændelsen er idempotent pr. dag.)*

## 5. Eksempel-analyser (køres af ejeren, ikke af appen)

```sql
-- Aktive dage pr. bruger (tilbagevenden)
SELECT user_id, count(DISTINCT dato) AS dage FROM app_haendelser WHERE haendelse='app_aabnet' GROUP BY 1;
-- Scan vs. manuel (andel)
SELECT haendelse, count(*) FROM app_haendelser WHERE haendelse IN ('scan_gennemfoert','froe_oprettet_manuelt') GROUP BY 1;
-- Gartner-brug, personlig vs. generel
SELECT haendelse, count(*) FROM app_haendelser WHERE haendelse LIKE 'gartner_%' GROUP BY 1;
```

## 6. Tests

1. **Adgang:** testbruger kan `INSERT {"haendelse":"app_aabnet"}` (201) — men ikke læse (`GET` → tom/403), ændre eller slette; kan ikke angive `user_id`/`dato` (42501) eller en anden hændelsestype (CHECK-fejl).
2. **Dedublering:** to `app_aabnet` samme dag → anden afvises af indekset; koden håndterer det lydløst.
3. **Fejlsikkerhed i koden:** med tabellen fjernet, eller `ANALYSE_HAENDELSER` slået fra, fungerer scan, manuel oprettelse og Gartner uændret og uden fejlbesked.
4. **Ingen indhold:** gennemgå hver kaldsted — ingen fritekst eller id'er sendes med.
5. **Kontosletning:** testkonto med hændelser → `delete_account` returnerer tom liste; ingen rækker tilbage.
6. **Oprydning:** `ryd_gamle_haendelser(0)` på testdata sletter; kan ikke kaldes af `authenticated`.
7. **Ingen cookies:** browserens lager (cookies/localStorage) er uændret efter brug med analysen tændt.

## 7. Rollback

- **Slå fra uden databaseændring:** sæt `ANALYSE_HAENDELSER` til `off` (eller fjern den). Ingen nye rækker skrives.
- **Database-rollback (mister kun målinger):**
  ```sql
  DROP FUNCTION IF EXISTS public.ryd_gamle_haendelser(integer);
  DROP TABLE IF EXISTS public.app_haendelser;
  ```
- `NEXT_PUBLIC_MVP_MODE=off` ændrer ikke databasen; tabellen ligger uberørt og tom/inaktiv.
