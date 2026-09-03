# Batch 4 — P3-polish + lukning af UI-tekstauditten

**Dato:** 3. september 2026 · **Base:** `f93c450` (main == origin/main, rent træ)
**Metode:** de P3-mærkede rækker fra tekst-auditten 2/9 (artifact "Potalot
Tekstaudit") er hentet én for én og målt mod HEAD: findes teksten, er den
brugerrettet, renderes den, er forskellen en fejl eller en tilladt variant,
og findes mønstret andre steder i levende copy. Ingen global
search/replace. Ingen prod-datawrites.

Auditten mærker 14 rækker P3 (statistikken siger 9 — de 6 D-rækker blev
talt under terminologi og er Batch 3's). Alle 14 er behandlet her.

## Klassifikation

| # | Fund (audit) | Sted | Klasse | Status |
|---|---|---|---|---|
| 1 | Bindestreg som tankestreg «Opbinding, sideskud og vand - …» | `inspiration-folder.tsx:107` | **C** | `DEMO_GUIDE_ITEMS` — kun `/calendar-inspiration-preview` (designpreview), aldrig fallback i prod. Nul " - " som tankestreg i levende prosa. |
| 2 | Talinterval med bindestreg «10-21 dage», «110-130 dage» | `havevisdom.ts:41,47,65` | **A** | Rettet til en dash. Live i Havebog (På denne dag, Historien fortsætter). Samme mønster fundet og rettet: `havebog-demo.ts` «4-6 uger» ×2 (demo-Havebogen for anonyme). |
| 3 | Lige anførselstegn «"drivhus"», «fx "Tomat"» | `badges-shared.ts:178,187` · `egen-plante-dialog.tsx:73` | **A** | Rettet til “ ”. Samme mønster: `badges-shared.ts:236`, `plant-tasks.ts:66` (lognote brugeren ser), `havebog-demo.ts:386` (citat af brugerens ord → « », som «Du sagde: «…»»). |
| 4 | «etc.» i stedet for «osv.» | `create-forum-post-dialog.tsx:114` | **A** | Rettet. Eneste levende forekomst; to øvrige er kommentarer. Vagt tilføjet. |
| 5 | «...» i stedet for «…» «forår, sommer...» | `admin/general-task-form.tsx:146` | **C** | Admin-flade (`/admin` er gated i `proxy.ts` + `isCurrentUserAdmin`). Øvrige `...`: URL-placeholder «https://impecta.dk/...» (D, teknisk notation) og JSON-eksempler i prompter (C). |
| 6 | «Tilføj cover» | `create-challenge-dialog.tsx:106` | **B** | Fjernet i Batch 2 (`00fc4de`). Nul forekomster. |
| 7 | «Plant not found» / «Item not found» | `actions/guides.ts:521,792` | **B** | Fjernet i Batch 3 (`5a7291f`). Nul engelske "not found" i actions. |
| 8 | Engelsk jargon på admin/QA-siderne | `admin/qa/*` | **C** | Kun admin, gated. Ikke brugerrettet. |
| 9 | Såning som feltnavn | guides/frøbank/import | **B** | Batch 3 D5: Forkultivering / Direkte såning / Sås / Plant ud. |
| 10 | Stadiet før udplantning | `constants.ts`, `din-dyrkning.tsx` … | **E → parkeret** | Batch 3 D6: model, ikke copy. `Docs/product/plantestadie-state-machine-backlog.md`. |
| 11 | Vækststadiet «I vækst» / «Vækst» | `constants.ts`, `plant-stages.ts` | **B** | Batch 3 D7: «Vækst» renderes aldrig; VaekstLinje rettet. |
| 12 | Ønskelisten | `constants.ts:40` | **B** | Batch 3 D8: Ønskeliste. |
| 13 | Georgine / dahlia | `weather.ts`, Havebog | **B + D** | Batch 3 D9: artsalias tilføjet; prosa må sige georginer. |
| 14 | Aftenerne / aftnerne | `havehilsen.ts`, `havebog.ts` | **D** | Begge korrekte (RO). Låst i terminologi-standarden. |

**Optælling:** rettet 3 (+5 samme-mønster-steder) · allerede væk 6 ·
ikke live 3 · tilladt variant 1 · parkeret som model 1 · stadig åbne 0.

## Fra frøbank / Fra Frøbanken

Kortlagt: 55 «Frøbanken», 55 «Frøbank», 97 «frøbank», 37 «frøbanken» i
`src/` (inkl. kommentarer). Levende brugerforekomster fordeler sig
entydigt på tre betydninger — se tabellen i `potalot-terminologi.md`
(Batch 4-sektionen). Render-konteksten for de to kilde-etiketter:

- `source-chip.tsx` («Fra frøbank») renderes via `task-row.tsx` med
  `showSource` i I haven nu (forfaldne, egne og afsluttede opgaver).
  `TaskSource = 'inventory'` betyder «opgaven er afledt af din frøpost i
  Frøbanken» — en konkret kilde, ikke en kildetype. Chippen er i versaler,
  så det brugeren ser, er «FRA FRØBANK» mod «FRA FRØBANKEN».
- `i-haven-nu.tsx:188` («Fra Frøbanken») er samme datakilde
  (`plantId === null` = frøbank-invitation) på samme flade.

**Beslutning implementeret:** produktnavn → **Fra Frøbanken** i chippen.
Samme regel lukkede tre CTA'er, der peger ind i produktområdet og stod i
generisk form midt i et flow, der ellers siger «Tilføj til Frøbanken» /
«Opret i Frøbanken»: `tilfoej-flow.tsx` «Se i frøbank» ×2 → «Se i
Frøbanken», `din-have-sektion.tsx` «Tilføj til frøbank» → «Tilføj til
Frøbanken». Generiske forekomster («Udvid din frøbank», «I din frøbank»,
«Din frøbank er vokset», metadata-beskrivelsen) er korrekte og uændrede.

Bevidst ikke rørt: statuslabelen `i_froebank` «I frøbank» (status, ikke
kilde/CTA) og returetiketten «tilbage til frøbank». Én linje hver, hvis
Anna vil have dem som produktnavn.

## Vagter

`scripts/test-dansk-copy.ts` (47 tjek, i `npm test`): `etc.` forbudt i
copy · `source-chip.tsx` og `i-haven-nu.tsx` siger «Fra Frøbanken» ·
havevisdommens 12 måneder har ingen bindestreg-intervaller. Bevidst
INGEN globale regler for tankestreg/ellipse/citationstegn.

## NYT FUND (ikke rettet)

1. **P3 · `parseGerminationDays` læser kun bindestreg** (`afledninger.ts:110`).
   Skriver brugeren «7–14 dage» med en dash (fx kopieret fra en guide),
   falder spiringsforventningen stille bort. Robusthed, ikke copy. Derfor
   beholder placeholderen «fx 7-14 dage» bindestreg indtil parseren udvides.
2. **P3 · «fx 18-22°C» uden mellemrum før enheden** (`dyrkningsfakta-fields.tsx:226`)
   — skabelonen skriver «18-22 °C». Inputformat; følger punkt 1.
3. **P3 · «Fra planter» / «Fra dine planter»** — samme par-drift som
   Frøbanken, for Planter (`source-chip.tsx:14` vs `i-haven-nu.tsx:188`).
   Ingen lås for Planter endnu; ikke sneget ind.
4. **Død kode · `guide-list.tsx`** har nul importører (bærer tab-labelen
   «I frøbank»). Legacy slettes, ikke smukkeseres.
5. **Admin · «forår, sommer...»** (`general-task-form.tsx:146`) og QA-jargon:
   gated, står.

## Verifikation

`npm test` grøn (alle suiter) · `tsc --noEmit` grøn · `next build` og
lint-delta: se commit-beskrivelsen. Genmålt read-only efter rettelse:
" - " som tankestreg i levende prosa 0 · bindestreg-interval i kurateret
prosa 0 (kun inputformat-eksempler + prompter) · lige anførselstegn i
levende dansk copy 0 (kun prompter, JSDoc, admin/qa) · «etc.» i copy 0 ·
«Fra frøbank» 0.

## KAN UI-TEKSTAUDITTEN LUKKES?

**JA — UI-tekstauditten kan lukkes. Redaktionelt indhold fortsætter som
separat editorial audit.**

- Batch 1: de 4 systemiske læk (guide-tags, kategori, fejllag,
  Udfordringer) håndteret og vagtet.
- Batch 2: de 14 klasse A-sprogfejl + brugerrettet teknisk copy håndteret
  og vagtet.
- Batch 3: de 11 terminologifund rettet, eller eksplicit parkeret som
  model-backlog (D6 plantestadie, D11 UserMode/NotificationProfile).
- Batch 4: de 14 P3-rækker rettet, afvist som døde/admin eller
  dokumenteret som tilladte.
- Ingen kendte P1/P2/P3-fund består i almindelig brugerrettet UI-copy.
  Det åbne er redaktionelt: de 88 flaggede guides (34 P1 + 54 P2) og
  Havebogens større redaktionelle fund fra august-census'en, plus de
  parkerede modelspor.
