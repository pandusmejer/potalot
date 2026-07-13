# V1B — Onboarding-shell (13/7 2026)

Midt-sæson-onboarding som REN ORKESTRERING af eksisterende flows. Intet nyt
motor-lag (ingen ny OCR/audio; AI-indgangen genbruger den eksisterende Haiku-
klient). Alt gemmes først efter brugerens godkendelse.

## Flow
`/onboarding` er nu to-faset (`OnboardingWizard`):
1. **Profil** (eksisterende `OnboardingForm`) — gemmer nu profilen UDEN at sætte
   `onboarded` (ny `onComplete`-hook), så vi kan fortsætte til trin 2.
2. **Have-opsætning** (`OnboardingShell`) — fem indgange. `onboarded` sættes
   først når brugeren afslutter ("Spring over" / "Jeg er færdig").

**Fremskridt bevares:** alt oprettet ligger i DB'en. Vender brugeren tilbage til
`/onboarding` (stadig `onboarded=false`) og har et brugernavn, genoptages på
have-fasen med "Din have indtil videre"-overblik. "Fortsæt senere" går til `/`
uden at sætte onboarded.

## De fem indgange (bygget → genbrugt)
| # | Indgang | Fører til | Kilde/mærkning |
|---|---------|-----------|----------------|
| 1 | Tilføj planter jeg allerede dyrker | `EgenPlanteDialog` → `opretEgenPlante` (inline, `onCreated` holder brugeren på fladen) | oplyst af brugeren |
| 2 | Scan en frøpose | `/froebank/tilfoej?mode=camera` (`extractSeedPacketFields`, review i flow) | fundet på frøpose |
| 3 | Importér Excel/CSV | `/froebank/tilfoej?mode=excel` (`parseInventoryFile` → preview → `confirmImportInventory`) | importeret fra fil |
| 4 | Fortæl om haven med tekst | `HaveTekstFlow` → `fortolkHaveTekst` (Haiku) → godkend-liste → `opretEgenPlante`/`createInventoryItem` | fortolket fra tekst |
| 5 | Spring over og begynd enkelt | sætter `onboarded=true` → `/` | — |

## Godkend-liste (indgang 4)
`HaveTekstFlow`: fri tekst → forslag. Hvert forslag kan **redigeres** (art, sort,
antal, sted), **fjernes**, **godkendes enkeltvis** eller via **"Godkend alle"**.
Usikre forslag (`usikkerhed='lav'`) og mulige dubletter er **fravalgt som
standard** (spring usikre over). Hvert kort viser kilde ("fortolket fra tekst") +
usikkerhed (sikker/rimelig sikker/usikker) + evt. "findes måske allerede". Kind
(plante/frø) kan skiftes hvis AI'en fejlklassificerer. Intet gemmes før "Gem
valgte (n)". Afsluttes med et overblik over hvad der blev tilføjet.

## Nye filer
- `src/actions/have-tekst.ts` — `fortolkHaveTekst` (genbruger Haiku-klient).
- `src/components/onboarding/have-tekst-flow.tsx` — fortolk→godkend→gem.
- `src/components/onboarding/onboarding-shell.tsx` — de fem indgange + overblik.
- `src/components/onboarding/onboarding-wizard.tsx` — to-faset (profil → have).
- `src/app/(app)/admin/qa/onboarding-preview/page.tsx` — gated mobil-QA-rute.

## Ændrede filer
- `src/app/onboarding/page.tsx` — henter planter/frø/steder + navne, renderer wizard.
- `src/components/auth/onboarding-form.tsx` — `onComplete`-hook (udskyder onboarded).
- `src/components/mine-planter/egen-plante-dialog.tsx` — `onCreated`-hook.

## Fremskridt-bevaring (verificeret ved kode-audit)
- **Committede elementer** (planter/frø) → gemt i DB. Det er den durable
  progress; "fortsæt senere" holder dem, fordi de IKKE ligger i client state.
- **Profil-fase** → `profiles.username` persisteres; wizard genoptager på
  have-fasen (`startPhase='have'`) ved retur.
- **onboarded** sættes først ved afslutning → retur til `/onboarding` genoptager.
- **Eksterne flows** (scan/excel): startet fra onboarding med `?from=onboarding`;
  `TilfoejFlow` fører nu "tilbage"/"færdig" tilbage til `/onboarding` (ny
  `returnTo`-prop; default for normal-flowet uændret). De tilføjede frø ligger i
  frøbanken → overblikket opdateres ved retur.
- **In-flight AI-forslag** (endnu ikke godkendt): **V1-BEGRÆNSNING (Anna-låst
  13/7, se `launch-scope-laast.md`)** — draft-persistering er UDE af launch. Et
  ikke-godkendt review lever kun i client state og huskes IKKE ved refresh eller
  ny session. Committede planter/frø bevares naturligvis (DB). Review-headeren
  siger det nu eksplicit ("Forslag, du ikke gemmer, huskes ikke, hvis du forlader
  siden"), så "fortsæt senere" ikke lover mere end den holder. Draft-persistering
  bygges IKKE i V1.

## QA-status
Rigtig end-to-end-QA (dev-server genstartet for at rydde stale Turbopack-cache,
der blokerede hydrering; offentlig temp-preview brugt til at omgå auth-gaten).

**Browser @ 375px (rigtige interaktioner):**
- Shell (tom + med-indhold), metode-kort, overblik, spring-over/færdig/fortsæt-senere ✓
- Review-liste default-valg: dublet (Tomat) + usikker (Gulerod) fravalgt, sikker
  frø (Spinat) valgt → "Gem valgte (1)" ✓
- Toggle til/fra ✓, fjern forslag (kort fjernet, count→2) ✓, kilde/usikkerheds-chips ✓
- Kind-toggle (plante/frø), edit-felter, sted skjult for frø ✓
- Plante-dialog: alle felter; dato-segment Cirka (måned-vælger) / Ved ikke
  ("Vi opfinder ikke en dato — planten oprettes uden startdato") ✓
- Ingen horisontal overflow; ingen konsol-fejl fra onboarding-koden ✓

**AI-audit `fortolkHaveTekst` (rigtige Haiku-kald, `scratchpad/qa-fortolk.mjs`):**
- Ingen hallucination: vagt/tomt/ikke-havehold input → `[]` (opfinder aldrig arter)
- Ingen fabrikerede datoer på planter (plante-output bærer aldrig dato)
- Usikkerhed: "måske/tror" → `lav` (fravalgt default); eksplicit → `hoej`/`mellem`
- Splitter sammensatte udsagn; valid JSON; normaliser validerer + afviser skidt
- Inputgrænser (3-4000 tegn), try/catch på fejl; timeout via SDK-default (ingen custom)
- Intet gemmes uden review; dublet-markering client-side (exact navnematch)

**Teknisk:** `tsc` + `next build` grøn; alle ruter i tabellen.

### Stadig browser-auth-blokeret (verificeret på anden vis)
- Fuldt indlogget COMMIT-klik (opretEgenPlante/createInventoryItem fra browseren)
  kræver session — verificeret på DB-laget (kontrollerede REGTEST-inserts, ryddet)
  + AI-laget (script) i stedet.
- Scan/excel egentligt round-trip verificeret via kode + tilfoej-siden, ikke live-klik.

### Åbent / bevidst udeladt
- Visuel finpudsning mod låst PotAlot-æstetik (Cormorant/serif, salviegrøn) — venter
  på Annas live-gennemsyn; nuværende styling bruger app-primitiverne.
- Persistering af in-flight AI-udkast (se ovenfor) — bevidst udeladt.
