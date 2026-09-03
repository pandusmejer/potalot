# Plantestadier — state machine og stadiet før udplantning (model-backlog)

**Status:** åben model-opgave. Oprettet 3/9 2026 som led i Batch 3
(terminologisk integritet), spor D6. **Ikke** en korrekturopgave: Anna
parkerede den eksplicit, fordi en status, UI'et ikke kan sætte, plus en
mulig automatisk "hærd af efter 35 dage"-regel ikke skal besluttes som
biprodukt af korrektur.

## Den nuværende state machine (målt 3/9 2026, base 00fc4de)

**Stadier** (`src/lib/types.ts:143-151`, `STAGE_ORDER` i
`src/lib/plant-stages.ts:11-20`, CHECK i `00017_mine_planter_v2.sql:16-19`):

```
planlagt → saaet → spirer → i_vaekst → klar_til_udplantning → udplantet → hoestklar → afsluttet
```

**Hvad rykker stadiet?** Kun logs, og kun fremad (`LOG_TO_STAGE` +
`STAGE_RANK`, `src/actions/mine-planter.ts:536-552`):

| Log-type | Rykker til |
|---|---|
| `sowing` | saaet |
| `germination` | spirer |
| `planting_out` | udplantet |
| `harvest` | hoestklar |
| alle andre (watering, fertilizing, pruning, pest_disease, repotting, note, health, height) | intet skifte |

Konsekvens: **`i_vaekst` og `klar_til_udplantning` nås aldrig via logs.**

**Direkte statusskift:** `updatePlantStatus(plantId, status, effectiveDate)`
(`mine-planter.ts:707`) findes og skriver en `status_change`-log med
labelen, men har **nul kaldere** i `src/components` og `src/app`. Kalderne
forsvandt i `5a3a687` ("komponent-kirkegård ryddet", Planter-korrekturen).
Standalone planter oprettes direkte som `i_vaekst` (`mine-planter.ts:807`).

**Live-DB 3/9:** `plants_v2.status` = i_vaekst 7 · saaet 6 · spirer 3 ·
afsluttet 2 · udplantet 1 · planlagt 1 · klar_til_udplantning 1. Den ene
klar_til_udplantning-række har en status_change-log fra 14/5 2026 — fra det
UI, der siden er fjernet.

**Hærdning findes ikke som stadie.** Legacy-tabellen `plants` havde
`hardening` (`00001:104-107`); v2 droppede det. Hærdning lever som råd
(`saesonraad.ts`, `maaneds-copy.ts`, `havevisdom.ts:58-64`) og som
opgavetype-alias (`hardening` → `maintenance`, `opgavetype.ts:82`).

## Hvor 35-dages-reglen kommer fra

To uafhængige heuristikker, begge indført med plantekortet i `34404e8`
("plantekort: asset-drevet overlay låst"):

1. `src/lib/next-plant-task.ts:50-52` — status `i_vaekst` og alder > 35
   dage siden såning → næste opgave **"Hærd af"**; ellers "Knib top".
   Status `spirer` og alder > 14 dage → **"Prikl ud"** (`:47`).
2. `src/components/havekalender/din-dyrkning.tsx:183-185` (fra `cc96eb9`,
   Kalenderens "Din dyrkning") — status `spirer` og alder ≥ 35 dage →
   **"Skal prikles om"** (label rettet 3/9; før: "Skal ompottes").

Begge er alders-gæt uden guidedata. De strider mod princippet i
`src/lib/plant-detail/build-plant-detail.ts:219-241` (PLT-0317/0318):
afhærdning anbefales kun, når arten faktisk forkultiveres
(`preCultivation === true`), og "klar til at flytte ud" afledes af
udplantningsvinduet, ikke af alder. Tærsklerne (14 vs. 35 dage for samme
spirer-stadie) er heller ikke afstemt indbyrdes.

## Termerne, der i dag beskriver stadiet (tre dimensioner)

| Dimension | Term | Kilde |
|---|---|---|
| Status (tilstand) | Klar til udplantning · Klar (kortform) | `PLANT_STATUS_META`, `STAGE_SHORT_LABEL` |
| Handling (afledt af status) | Skal udplantes (`din-dyrkning.tsx:179`) · Plant X ud (`dagens-fokus.ts:261-266`) | to parallelle afledninger |
| Afledt prosa | klar til haven · Klar til at flytte ud · klar til at komme udenfor | `build-plant-detail.ts:99,179`, `havebog-dagens-historie.ts:195` |

Grænsereglen står i `dagens-fokus.ts:11` og `afledninger.ts:252`: Planter
taler tilstand, Kalender handler. De tre dimensioner må ikke ensrettes på
tværs. (Verbet "Plant ud" er låst i Batch 3 for `plant_out`; "Skal
udplantes" i Kalenderen er bevidst **ikke** rørt, før stadiet er afgjort.)

## Beslutningerne, der mangler

1. **Skal `klar_til_udplantning` kunne nås?** Enten (a) et status-UI
   (genopliv kaldet til `updatePlantStatus`), (b) en afledning (alder +
   `plantingOutMonths` + `preCultivation`), eller (c) stadiet udgår af
   modellen (migration + labels + `TASK_STAGE.plant_out`).
2. **Skal `i_vaekst` kunne nås fra en log?** I dag kun ved oprettelse af
   standalone plante. En `repotting`/prikle-log eller en `height_measurement`
   kunne rykke spirer → i_vaekst.
3. **35-dages-reglerne:** produktregel eller fejl? Hvis regel: én tærskel,
   guidedata før alder, og kun "Hærd af" ved `preCultivation`. Hvis fejl:
   fjern alders-gættet og lad `build-plant-detail` være eneste kilde.
4. **Hærdning som stadie?** Nej, medmindre 1(a) vælges og brugeren skal
   kunne markere det selv.

## Tests, der skal skrives før modellen ændres

Ingen test dækker i dag `LOG_TO_STAGE`, `STAGE_RANK`, `TASK_STAGE`,
`next-plant-task` eller `din-dyrkning`-afledningen. Batch 3 tilføjede kun en
vagt på labels (`scripts/test-terminologi-batch3.ts`).

## Referencer

- `Docs/content/batch-3-terminologi-beslutningsrapport.md` (spor D6)
- `Docs/product/prikling-vs-ompotning-backlog.md` (nabo-modellen)
- `Docs/design-system/registrering.md` (frø → sået → plante)
