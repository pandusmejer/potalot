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

## QA-status
- `npx tsc --noEmit` ✓
- `npx next build` ✓ ("Compiled successfully"), både `/onboarding` og
  `/admin/qa/onboarding-preview` i route-tabellen (RSC-grænser + bundling OK).

### Blokeret QA (ekstern)
Live browser-screenshots @ 390px kunne IKKE tages: dev-serveren er auth-gated
(ikke demo-mode) og krævede login, og Supabase-auth var samtidig rate-limited
(429). Jeg kan/må ikke logge ind. Den gated rute `/admin/qa/onboarding-preview`
er klar til at Anna kan gennemse den indlogget. Et 390px-mock af de to nye
flader blev leveret i tråden som visuel reference.

### Åbent / bevidst udeladt
- Visuel finpudsning mod låst PotAlot-æstetik (Cormorant/serif, salviegrøn) bør
  ske når Anna kan se ruten live — nuværende styling bruger app-primitiverne.
- Indgang 2/3 linker UD til `/froebank/tilfoej` (egne reviews); returnerer man
  til `/onboarding` opdateres overblikket. Ingen embedded scan/excel-review i
  selve shellen (bevidst — undgår at genbygge gennemtestede flows).
- Migration 00054 (sow_date_precision) er stadig chippet, ikke anvendt (påvirker
  ikke onboarding-flowet; planter oprettet her bruger `sowDatePrecision='unknown'`).
