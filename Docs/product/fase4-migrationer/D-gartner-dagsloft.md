# Migration D — dagligt loft på Gartner-spørgsmål (atomisk, serverhåndhævet)

**Status:** princippet godkendt 6/11 (30 pr. bruger pr. dag, atomisk og serverhåndhævet, konfigurerbart, uafhængigt af analyse og samtykke). Specifikation — IKKE forberedt som fil, IKKE kørt; afventer godkendelse til at fortsætte med B og D, efter A er verificeret. Foreslået filnavn: `supabase/migrations/00076_ai_dagsforbrug.sql`
**Afhænger af:** A. Uafhængig af B og C.
**Hvorfor en fjerde migration?** Beslutning 4 kræver et loft, der (a) håndhæves på serveren, (b) kan konfigureres og (c) holder ved samtidige forespørgsler. Det er ikke muligt rent i kode på serverless (ingen delt hukommelse), og det må ikke bygges oven på analysetabellen (C): loftet er driftsstyring (omkostning/misbrug), ikke analyse — særskilt formål, egen opbevaring.

## 1. Verificeret nuværende tilstand
Gartner-routen har ingen rate limit (grep). Spørgsmål er begrænset til 1000 tegn, og svar er begrænset af `max_tokens: 1024`, men antallet pr. bruger er ubegrænset.

## 2. Løsning
En tæller pr. bruger pr. dag og **én** funktion, der reserverer et spørgsmål i en enkelt SQL-sætning. `INSERT … ON CONFLICT DO UPDATE … WHERE antal < grænse` låser rækken, så to samtidige kald aldrig begge får "det sidste" spørgsmål. Grænsen sendes ind som parameter fra serveren (`GARTNER_DAGLIGT_LOFT`, standard 30) — den kan ændres uden migration.

```sql
-- 00076_ai_dagsforbrug.sql
BEGIN;

CREATE TABLE public.ai_dagsforbrug (
  -- BEVIDST navn "user_id": delete_account() rydder alle tabeller med denne kolonne.
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dato    date NOT NULL,
  antal   integer NOT NULL DEFAULT 0 CHECK (antal >= 0),
  PRIMARY KEY (user_id, dato)
);
ALTER TABLE public.ai_dagsforbrug ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_dagsforbrug FROM anon, authenticated;   -- ingen direkte adgang

CREATE OR REPLACE FUNCTION public.reserver_gartner_spoergsmaal(p_graense integer)
RETURNS TABLE (tilladt boolean, brugt integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_dato  date := (now() AT TIME ZONE 'Europe/Copenhagen')::date;
  v_antal integer;
BEGIN
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
```

`auth.uid()` læses fra forespørgslens JWT og virker også i en `SECURITY DEFINER`-funktion: brugeren kan derfor kun reservere for sig selv og kan hverken læse, ændre eller nulstille tælleren.

## 3. Fejlhåndtering, døgnskifte og mislykkede kald (dokumentation)

**Principper (Anna 6/11): loftet må aldrig fejle åbent, og det er uafhængigt af samtykke og analyse.**

| Situation | Adfærd | Begrundelse |
|---|---|---|
| Databasen er utilgængelig / forespørgslen fejler / timeout | **Afvis** — intet AI-kald; rolig besked: "Gartneren er ikke tilgængelig lige nu. Prøv igen om lidt." (HTTP 503) | omkostningsbeskyttelse går forud for tilgængelighed; en tæller, der ikke kan læses, må ikke tolkes som "ingen grænse" |
| Funktionen/tabellen findes ikke (migrationen ikke kørt) | **Afvis** på samme måde og log tydeligt | samme princip. Konsekvens: **migration D skal køres FØR koden udrulles** (omvendt rækkefølge end B's fail-closed-for-samtykke) |
| Grænsen nået | `429` + besked: "Du har stillet 30 spørgsmål i dag. Prøv igen i morgen." (tallet kommer fra konfigurationen) | forståelig besked, ikke en generel fejl |
| `GARTNER_DAGLIGT_LOFT` mangler eller er ugyldig (ikke et heltal ≥ 1) | brug standarden **30** | konfigurationsfejl må ikke åbne eller lukke tjenesten |
| Ingen/ugyldig login | `401` som i dag; funktionen returnerer `tilladt = false` uden `auth.uid()` | |

**Døgnskifte og tidszone.** Dagen er **dansk kalenderdag**: `(now() AT TIME ZONE 'Europe/Copenhagen')::date`. En ny tæller starter ved dansk midnat, også ved sommer-/vintertid, fordi tidszonen er navngiven (ikke en fast UTC-forskydning). Test: sæt tid til 23:59:59 og 00:00:01 lokal tid på en vinter- og en sommerdag, og kontrollér, at datoen skifter præcis ved dansk midnat. Brugere i andre tidszoner får den danske dag (en bevidst, simpel regel).

**Mislykkede AI-kald.** Reservationen sker *før* kaldet, så et mislykket kald (fejl, timeout, afbrudt strøm) tæller som standard med: det holder omkostningerne forudsigelige og forhindrer, at fejlkald omgås ved gentagelse. For ikke at straffe brugeren for vores fejl foreslås en **tilbagebetaling kun når AI-kaldet fejler før noget er sendt til brugeren** (`frigiv_gartner_spoergsmaal()` → `antal = greatest(antal - 1, 0)`; samme SECURITY DEFINER/`auth.uid()`-mønster). Mislykkede kald efter at svaret er begyndt at strømme tæller. *(Valgfri; kan udelades i første MVP — beslutning ønskes.)*

**Samtidighed.** `INSERT … ON CONFLICT DO UPDATE … WHERE antal < grænse` låser rækken; kun den ene af to samtidige kald får det sidste spørgsmål. Testes med 40 parallelle kald mod grænse 30 (afsnit 5).

**Uafhængighed.** Loftet bruger egen tabel og ingen analyse- eller samtykkeoplysninger; det tæller *alle* Gartner-spørgsmål, med og uden personlig kontekst. Generelle spørgsmål kræver aldrig samtykke.

### Kode (efter godkendelse)
- Routen kalder funktionen **før** AI-kaldet og afviser ved `tilladt = false` eller enhver fejl, som tabellen ovenfor beskriver. Afviste kald når aldrig leverandøren.
- Tilgængeligheds-/fejlbeskeder vises af klienten i stedet for den generelle fejl.

## 4. Data, opbevaring og sletning
Indhold: bruger-id, dato, antal. Ingen spørgsmål eller svar. Rækker ældre end 7 dage ryddes af funktionen; alt slettes ved kontosletning (`delete_account` + cascade). Driftsformål, ikke analyse — må ikke bruges til produktstatistik.

## 5. Tests
1. **Samtidighed (vigtigst):** 40 parallelle kald med grænse 30 (`Promise.all` mod en branch-DB, samme bruger) → **præcis 30** `tilladt = true` og 10 `false`; `antal = 30`.
2. **Grænse konfigurerbar:** kald med 5 → 5 tilladt; derefter afvist.
3. **Dagsskifte:** ved 00:00 dansk tid starter en ny tæller — test både vinter- og sommertid (23:59:59 → 00:00:01).
4. **Isolering:** bruger A's forbrug påvirker ikke B; en bruger kan ikke `SELECT`/`UPDATE`/`DELETE` tabellen (42501) eller nulstille tælleren.
5. **Anonym:** `anon` kan ikke kalde funktionen; uden JWT returneres `tilladt = false`.
5b. **Fail closed:** med tabellen/funktionen utilgængelig (omdøbt i en transaktion på branch) afviser routen med 503 og kalder ikke leverandøren; ugyldig `GARTNER_DAGLIGT_LOFT` giver 30.
6. **Ugyldig grænse** (`null`, `0`) → afvist.
7. **Kontosletning** rydder rækkerne.
8. **UI:** brugeren får den forståelige besked ved grænsen; Gartneren fungerer igen næste dag.

## 6. Rollback
- **Uden databaseændring:** sæt `GARTNER_DAGLIGT_LOFT` højt (konfigurationen), eller udrul en kodeversion uden kvotekaldet. Bemærk: med kvotekaldet i koden og tabellen fjernet afvises alle spørgsmål (fail closed) — fjern kaldet, før tabellen droppes.
- **Database:**
  ```sql
  DROP FUNCTION IF EXISTS public.reserver_gartner_spoergsmaal(integer);
  DROP TABLE IF EXISTS public.ai_dagsforbrug;
  ```
  Mister kun dagstællere.
- `NEXT_PUBLIC_MVP_MODE=off` ændrer ikke databasen; den oprindelige Gartner-brug på plantesider og guides tæller dog stadig, fordi routen er delt.
