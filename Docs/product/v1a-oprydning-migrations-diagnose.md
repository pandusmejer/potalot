# V1A — oprydning, migrations-diagnose & dato-præcision (13/7 2026)

Lukning af de tre V1A-huller før onboarding-shellen (V1B). Projekt:
Supabase `whtyexhqcpcgpludvkon` (Potalot, live).

## Fix 1 — testdata fjernet fra Annas konto

Oprettet under QA af V1A, nu fjernet med ejerskabs- + identitets-guards
(kun disse to poster; ingen generel slet-plante-feature bygget):

| Type | id | navn | fjernet |
|------|----|----|---------|
| plants_v2 | `7bb51c1f-feeb-4482-b6b4-0d608afd70eb` | Rabarber (standalone, 0 logs, 0 completions) | ✓ |
| garden_locations | `eb71d5bb-eaa8-4b22-a50d-6cf05262fa8a` | Højbed 1 (0 planter refererede den) | ✓ |

Verificeret bagefter: brugerens **7 ægte planter** (Dahlia, Brøndkarse,
Stangbønne, Squash, Skoleagurk, Jordbærmajs, Agurk — alle med
`source_inventory_id` fra april-maj) urørt. Ingen REGTEST-rækker tilbage.

## Fix 2 — image_source: konkret diagnose

**Ikke** en stale schema-cache. Verificeret mod `information_schema.columns`:
kolonnen `plants_v2.image_source` **fandtes ikke** i live-DB'en → migration
`00049_plant_image_source` var aldrig anvendt.

Migration-trackeren (`supabase_migrations`) viste kun `00053_voice_notes` —
dvs. 00001–00052 er historisk anvendt uden for det trackede flow, og **00049
blev sprunget over** (mens fx 00051's `garden_location_id` var på plads).

Konsekvens: al kode der inserter `image_source` var brudt på live —
**også den eksisterende `saaFroeFraInventory`**, ikke kun V1A.

**Håndtering:** 00049 er en eksisterende repo-migration (idempotent, additiv:
`ADD COLUMN IF NOT EXISTS` + CHECK) der reparerede et brudt produktionsflow.
Anvendt via det trackede migrationsflow (`apply_migration`). Workaround i
`opretEgenPlante` (udeladt felt) fjernet — feltet skrives nu igen.

**Regressionstest (transaktionelt, ingen efterladt data):**

| Case | image_source | resultat |
|------|-------------|----------|
| standalone MED billede | `user_upload` | ✓ accepteret |
| standalone UDEN billede | `null` | ✓ accepteret |
| guide-reference (saaFroeFraInventory) | `guide_reference` | ✓ accepteret |

## Fix 3 — dato-præcision (præcis / cirka / ukendt)

Projektet havde **ingen** eksisterende præcisions-model, og plants_v2 har
**intet** metadata/jsonb-felt at genbruge. Mindst invasive løsning (et felt
på planten, ikke en parallel model): ny kolonne `plants_v2.sow_date_precision`
(`exact` | `approx` | `unknown` | NULL), migration `00054_sow_date_precision`.

Semantik:
- `exact` — brugeren angav en præcis dato.
- `approx` — måned-niveau; dagen i `sow_date` er udfyldning (måned-01).
- `unknown` — brugeren ved det ikke; `sow_date` er NULL (ingen opdigtet dato).
- `NULL` — gammel række / proveniens ikke registreret.

**Status:** migration 00054 er **ikke** anvendt på live — en nyskrevet
migration mod produktion kræver Annas normale fresh-thread-migrationsflow
(auto-mode blokerede den korrekt jf. den stående regel). Filen ligger i repo
og er **chippet**. Koden er forward-kompatibel: `opretEgenPlante` skriver
præcisionen som et separat best-effort `UPDATE`, så V1A fortsat virker på
nuværende live-DB, og præcisionen begynder at persistere i samme øjeblik
00054 køres. `unknown` giver allerede korrekt `sow_date = NULL` uanset.

### Udestående (chippet, kør i frisk tråd)
`supabase/migrations/00054_sow_date_precision.sql` skal anvendes via det
normale flow. Derefter kan plante-detaljesiden vise "cirka [måned]" i stedet
for en tilsyneladende præcis dato (læsesti + `buildPlantDetail`).
