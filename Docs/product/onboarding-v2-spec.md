# Onboarding V2 — fuld preference-onboarding (Anna-spec 13/7)

Anna-beslutning 13/7: onboarding skal IND i launch samle de tre ting Potalot skal
vide for at opføre sig intelligent fra dag ét — **hvor / hvordan / hvor meget
forstyrres**. Dette er en bevidst udvidelse af den tidligere låste onboarding-scope
(som kun var midt-sæson-import). Den eksisterende V1B-shell (5 import-indgange)
bliver **trin 6** i dette flow. Kilde: [[launch-scope-laast]], [[launch-strategi]].

## Flow (7 trin)
1. **Velkommen** — "Potalot hjælper dig med at bruge mindre tid på appen og mere
   tid i haven. Start med et par valg, så tilpasser vi oplevelsen."
2. **Hvor dyrker du?** (havetype) — Parcelhushave · Rækkehus · Kolonihave · Byhave
   · Altan · Sommerhus · Landsted · Noget andet. → senere: anbefalinger, guides, fællesskab.
3. **Lokation** — Brug min placering · Indtast postnummer · Indtast by.
   Formål: vejr, frostvarsler, lokale dyrkningsforhold, kalender.
4. **Hvad dyrker du mest?** (dyrkningsområder) — Køkkenhave · Drivhus · Højbede ·
   Krukker · Blomster · Frugt og bær · Lidt af det hele.
5. **Din dyrkerprofil** (den sjove skærm) — styrer bl.a. notifikations-mængden:
   - **Mindful 🌿** — kun det vigtigste; få påmindelser; ingen unødig støj.
     "Jeg vil dyrke have, ikke administrere den."
   - **Hjælperen 🌱** — balanceret; relevante påmindelser; vejrbaserede råd; forslag undervejs.
     "Jeg vil gerne have lidt hjælp."
   - **Haveentusiasten 🌾** — mere indsigt; flere forslag; mere statistik; flere data.
     "Jeg elsker detaljer og vil lære mest muligt."
   - **Frøsamleren 🌻** — frøbank i centrum; sortshistorik; frøhøst.
     "Jeg dyrker næsten lige så meget frø som planter."
6. **Midt i sæsonen?** — Starter nu · Godt i gang · Flere måneder. Ved "godt i gang":
   tilbyd import (billeder/noter/frøposer) = **den eksisterende V1B-shell**.
7. **Klar** — varm afslutning: *"Jo mere du dyrker, observerer og høster, desto mere
   vokser Potalot med dig. Nyt indhold og nye funktioner dukker op undervejs, når de
   bliver relevante for din have."* (Annas foretrukne, varme version.)

## Prioritet (Anna) — dag-ét-effekt først
1. **Lokation** (vejr/frost/kalender)
2. **Dyrkerprofil** (Mindful osv. → notifikations-mængde)
3. **Midt-sæson-import** (= V1B-shell)
4. Havetype
5. Dyrkningsområder

De tre første har direkte effekt fra dag ét; de to sidste kan følge efter.

## Hvorfor "Mindful" er vigtig
Signalerer "du behøver ikke logge alt / ingen daglige notifikationer / nyd haven"
— passer til kerne-thesen *mindre skærmtid, mere havetid*, OG giver den ærlige
forklaring på hvorfor nogle får få notifikationer og andre mange.

## Integration med det byggede (afklares ved bygning)
- **Dyrkerprofil → notifikations-motor** (00055/00056): profilen konfigurerer
  påmindelses-mængden. Mindful = minimal/ingen opgave-påmindelser; Hjælper =
  standard (cap 3); Entusiast = flere/mere; Frøsamler = frø-vægtet. Kræver et
  `grower_profile`-felt + at sync_task_reminders respekterer det.
- **Lokation → vejr** (getGardenWeather): "Brug min placering" = browser-geolocation
  (permission); postnummer/by = manuelt → koordinater. Afklar hvad vejr-actionen
  forventer i dag.
- **Havetype/områder** → anbefalinger, guides, fællesskab (senere brug).
- **Midt-sæson** → V1B-shell (allerede bygget).

## Datamodel (ny — kræver migration, kør i normalt flow)
`profiles`: garden_type, location (by/postnr + evt. lat/long), growing_areas[],
grower_profile ('mindful'|'hjaelper'|'entusiast'|'froesamler'), season_status.

## Status — BYGGET 15/7 (afventer Annas review + migration)

Bygget på feature/havebog. Alle 7 trin + hele preference-flowet verificeret
visuelt (mobil 390px, midlertidig preview-rute, nu slettet).

**Filer:**
- `src/components/onboarding/onboarding-wizard.tsx` — helt omskrevet til V2-flowet
  (Velkommen/identitet → Havetype → Lokation → Områder → Dyrkerprofil → Sæson →
  Import(V1B-shell) / Klar). Client-state, ingen draft-persistens (launch-scope).
- `src/actions/profil.ts` — ny `saveOnboardingPreferences` (+ typer GrowerProfile,
  SeasonStatus). Robust: lokation+onboarded gemmes altid; de fire nye kolonner
  er best-effort, så onboarding aldrig bryder før migrationen er kørt.
- `supabase/migrations/00058_onboarding_v2.sql` — SKREVET, IKKE ANVENDT.

**Wiret nu:**
- **Lokation → vejr:** postnummer (DAWA `lookupPostnummer`) + browser-geolocation
  → gemmer latitude/longitude/location_name (findes fra 00048) → vejr/frost
  virker med det samme. Verificeret: postnr 8000 slog op korrekt.
- **Notifikationsprofil → notifikations-mængde:** 00058 ændrer `sync_task_reminders`
  så LIMIT afhænger af `notification_profile` (mindful 0 / rolig 1 / aktiv 3;
  COALESCE→3). Mindful = INGEN opgave-påmindelser (early-return). Aktiveres når
  00058 køres.

### RETTET 15/7 (Annas review — model-fejl)
Dyrker-identitet og notifikations-mængde var fejlagtigt slået sammen i ét felt.
Nu **to uafhængige dimensioner** (en bruger kan være både Frøsamler OG Mindful):
- `grower_profile` = identitet (ny/koekkenhave/blomster/froesamler/selvforsyner/
  drivhus) — påvirker IKKE notifikationer.
- `notification_profile` = forstyrrelse (mindful 0 / rolig 1 / aktiv 3).
Wizard har nu to separate trin (identitet + "Hvor meget må Potalot forstyrre?").
- **Lydløs fallback fjernet:** `saveOnboardingPreferences` er alt-eller-intet; en
  gemmefejl (fx før 00058) vises tydeligt og blokerer flowet — ingen falsk succes.
- **Geolocation-robusthed:** afvist/timeout/ingen-support → tydelig besked +
  postnummer-fallback. Kun grove koordinater gemmes, aldrig adresse.
- **"Godt i gang" får Klar-afslutning:** ny rute `/onboarding/faerdig` (fælles
  varm afslutning: hvad blev oprettet + hvad nu + Potalot vokser med). Import-
  shellen fører hertil (finishHref); "godt i gang" genoptages på import-trinnet
  efter navigation (page.tsx læser season_status='igang' defensivt).

**KRÆVER FØR LIVE (Anna):**
1. **Kør migration 00058** (normalt flow / frisk tråd — ikke ad-hoc). Uden den
   gemmes garden_type/growing_areas/grower_profile/season_status IKKE (onboarding
   virker stadig; lokation + onboarded gemmes). SQL-funktionsændringen bør
   verificeres på apply (jeg kunne ikke teste den live).
2. Erstat den GAMLE onboarding? Nej — samme rute (`/onboarding`), samme
   OnboardingWizard-eksport; page.tsx uændret.

**Åbne spørgsmål til review:**
- "Indtast by" fra specen er IKKE bygget (inten by→koordinat-opslag i backend;
  kun postnr + geolocation). Postnr dækker samme behov. Ønsker du by-opslag?
- Havetype/områder gemmes men bruges endnu ikke (anbefalinger/guides = senere,
  som specen siger).
- grower_profile styrer p.t. KUN notifikations-cap. Øvrige effekter (mere
  statistik for entusiast, frø-vægtning for frøsamler) = senere.
- Sæson "godt i gang" → V1B-import-shell (dens egen afslutning sætter onboarded);
  "starter"/"flere måneder" → varm Klar-skærm. Bevidst: godt-i-gang ser ikke
  Klar-skærmen (shellen ér afslutningen).
