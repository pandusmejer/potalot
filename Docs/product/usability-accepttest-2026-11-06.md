# MVP 1.0 — usabilitypunkter fra iPhone-accepttesten (6/11 2026)

Registreret efter at hotfix 181fe92 (scan, Så plante, Dyrk flere, Se opgaver) bestod gentesten. **Status 6/11 (aften): punkt 2-5 samt thumbnails og ét dokumenteret serverkald er bygget lokalt på branch `perf/mvp-1.0-usability` (ikke pushet, ikke deployet). Netlify-regionen (punkt 1) er IKKE ændret — se rapporten.** Ingen databaseændringer.

Prioritering (Anna): **1 først, derefter 2 og 3. Punkt 4 samles med usabilityrettelserne efter accepttesten.**

| # | Punkt | Status |
|---|---|---|
| 1 | Langsom navigation og indlæsning (højeste prioritet) | Diagnosticeret, venter på godkendelse af forslag |
| 2 | Bundnavigation: for små og tætte trykflader | Gennemgået, forslag klart |
| 3 | Opgaver: manglende visuelt hierarki | Gennemgået, forslag klart (samles med punkt 5) |
| 4 | Scan frøpose: vælg eksisterende fotos | Funktionen findes allerede, men er svær at finde |
| 5 | Opgaver: to dyrkninger af samme sort og dato kan ikke skelnes | Diagnosticeret (accepttest 4), samles med punkt 3 |

## 1. Performance — målt 6/11 2026
- Netlify Functions kører i Ashburn (us-east); Supabase ligger i eu-west-1. Hvert kald fra en funktion koster ca. 300-600 ms (DB-tiden er 50-140 ms). Proxyens auth-kald fra Frankfurt koster ca. 57 ms.
- Hver navigation: proxy-auth + funktionens egen `getUser` (ca. 300 ms) + 2-4 bølger af forespørgsler.
- Frøbankens kompakte liste viser 48×60 px thumbnails med de fulde originalfotos (2-4 MB stykket; seks fotos ≈ 19 MB på én visning).
- Plantesiden kører sin datakaskade to gange pr. besøg.

## 2. Bundnavigation
`src/components/layout/bottom-nav.tsx`: fire `flex-1`-felter, men `py-1`, 10 px tekst og små mellemrum. `viewport` mangler `viewportFit: 'cover'`, så `env(safe-area-inset-bottom)` er 0.

## 3. Opgaver
`src/components/havekalender/opgaver-mvp.tsx`: fanen "Nu" blander forsinkede, dagens, afledte råd, vedligehold og månedens forslag i samme kortstil (alle `rounded-2xl border`).

## 4. Scan frøpose — fotobibliotek
Findes: forsidens kort "Upload billede · Fra kamerarulle" åbner `MultiImageUpload` uden `capture` (flere billeder, miniaturer, fjern/vælg hovedbillede). Problemer: navnet "Upload billede/kamerarulle", valget skal træffes før scanningsskærmen, og kameratilstand tillader kun ét billede og kan ikke skifte til biblioteket.

## 5. Opgaver — hvilken dyrkning hører opgaven til? (accepttest 4)
Fundet af Anna: Engelsk spinat sået samme dato i to dyrkninger (drivhus og friland) giver to opgaver med identisk titel, dato og sort.

- **Årsag:** `OpgaveRaekke` (Nu og Kommende), `UdfoertRaekke` (Udført) og `AfledtRaekke` (plante-råd) viser kun plantens art og sort. Dyrkningsstedet (`plants_v2.location`, evt. `garden_locations` via `gardenLocationId`) vises ikke. Opgaverne er korrekt adskilt i data: `fjernDubletter` og afledt-dækningen nøgler på `linkedPlantId`, så de to opgaver slås ikke sammen, og hver afkrydses uafhængigt via sit eget `task.id`.
- **Eksisterende identifikation:** der findes intet batchnavn på planter. Stedet er den eneste skelnende oplysning, der allerede ligger i dataene (plus sådato og år, som her er ens).
- **Ønsket rettelse (ikke bygget):** diskret placering i undertekstlinjen, fx "I dag · 🌱 Spinat Engelsk · Drivhus", i Nu, Kommende og Udført. `getAllTasks`/`getTasksForPlant`-berigelsen i `src/actions/havekalender.ts` henter allerede `plants_v2` til navn og sort; `location` tilføjes samme `select` (ingen ny forespørgsel, ingen ny datamodel). Afledte råd slår stedet op via `plantId` i `aktivePlanter`. Vises kun når planten har et sted og kun for opgaver knyttet til en plante.
- **Hører sammen med punkt 3** (visuelt hierarki): samme rækkekomponenter berøres.
