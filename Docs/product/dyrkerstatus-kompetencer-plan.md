# Dyrkerstatus + Kompetencer — teknisk plan (11. juli 2026)

Næste kode-sprint efter Havebog-foto-checkpointet. **Rene derivere, ingen
migration, ingen nye sektioner.** Identitet — ikke gamification.

## Princip
- Ingen "niveau 4 af 7", XP, progressbar eller badge-samleri.
- Output = små redaktionelle linjer, ikke dashboard-tal.
- Kun afledning fra EKSISTERENDE data. Gated visning (skjul uden nok data).
- Demo beholder kuraterede eksempler; rigtige brugere ser kun ægte afledning.

## Hvilke datafelter findes allerede (ingen migration)

**`plant_logs.type` (PlantLogType, `src/lib/types.ts:229`):**
`sowing · germination · repotting · planting_out · watering · fertilizing ·
pruning · pest_disease · harvest · note · status_change · archive`

**`plants`:** name, variety, status, `location` / `gardenLocationId`
(GardenLocation), is_archived. Sæson via logs (`beregnSaeson`).

**`GrowingLocation`:** `vindueskarm · drivhus · hoejbed · friland · krukke`.

**Inventory/frø (`InventoryItem`):** `primaryCategoryId`
(fro/loeg/knolde/buske/traeer/stauder) + `subcategoryId`
(fx `blomster_1aarige`, `blomster_fleraarige`, `krydderurter` — `constants.ts:37`).

**Allerede beregnet i `havebog.ts`:** seasonStart, logs (nyeste-først),
plantById, hoestEntries. Deriverne kan genbruge dette.

## Hvad kan afledes NU

### Kompetencer (fra log-typer, grupperet pr. art)
| Kompetence | Kilde-log | Note |
|---|---|---|
| Såning | `sowing` | |
| Spiring / forspiring | `germination` | tidlig germination før udplantning = forspiring |
| Udplantning | `planting_out` | |
| Beskæring | `pruning` | |
| Høst | `harvest` | |
| Sygdom/skadedyr | `pest_disease` | observation-kompetence |
| Ompotning | `repotting` | |

Grupperes pr. art (fx "Tomatdyrkning: Beskæring · Høst") ud fra plantens
`name`/`variety` på de loggede planter.

### Dyrkerstatus (identitet)
| Status | Afledning (ægte data) |
|---|---|
| Selvforsyner | `harvest`-logs fra ≥ N distinkte arter denne sæson |
| Høstsamler | mange høst-logs / høj samlet høst-frekvens |
| Sæsonstarter | tidlige `sowing`/`germination`-logs (forspiring før sæsonstart) |
| Frøsamler | frøbank-beholdning ≥ N distinkte sorter |
| Blomsterdyrker | frø/planter i `blomster_*`-subkategori (eller blomster-arter) |
| Krydderurteholder | frø/planter i `krydderurter`-subkategori |
| Drivhusdyrker | planter med `location`/GardenLocation = `drivhus` |

## Hvad SKAL vente (kan ikke afledes nu)

Disse kræver nye log-typer / migration / andre sprints — **byg IKKE fabrikeret
afledning**:
- **Opbinding** — ingen `staking`-logtype.
- **Frøavl** (som handling) — ingen logtype; frøbank-tal viser beholdning, ikke
  "gemt egne frø" (kræver source-felt / Gem-link-backend / sæsonarkiv).
- **Tørring** — ingen logtype (tørring er en Forvandling-idé, ikke logget).
- **Overvintring** — ingen logtype (kunne skrøbeligt udledes af plante på tværs
  af sæsoner; vent på sæsonarkiv).
- **Kompost** — ingen data.

Disse hører til: **diktafon/log-type-udvidelse** (migration), **Gem-link-backend**,
eller **sæson-resume/arkiv** — alle egne friske migrations-tråde.

## Output-form (nye typer — erstatter gamificerede demo-shapes)

Nuværende demo-typer er gamificerede (`niveau/afMax`, `opnaaet: boolean`) og
skal **afløses**:

```ts
// Dyrkerstatus — identitet, ingen niveau
interface DyrkerstatusLinje { titel: string; beskrivelse: string }

// Kompetencer — redaktionelle ord, ingen opnaaet-checkbokse
interface Kompetenceomraade { omraade: string; faerdigheder: string[] }
```

Eksempel-render:
```
SELVFORSYNER
Du har høstet fra flere afgrøder denne sæson.

DINE KOMPETENCER
Tomatdyrkning
Beskæring · Høst

Frøarbejde
Du har gemt eller planlagt frø fra én sort.
```

## Sprint-trin (tests først/sammen med)

1. **`src/lib/havebog-dyrkerstatus.ts`** — `byggDyrkerstatus(input): DyrkerstatusLinje[]`
   ren funktion (logs, plants, inventory, seasonStart). Tærskler for hver status.
   `scripts/test-dyrkerstatus.ts`.
2. **`src/lib/havebog-kompetencer.ts`** — `byggKompetencer(input): Kompetenceomraade[]`
   grupperer log-afledte færdigheder pr. art. `scripts/test-kompetencer.ts`.
3. **Nye typer** i `havebog-demo.ts`; behold `DEMO_DYRKERSTATUS`/`DEMO_KOMPETENCER`
   som kuraterede eksempler (opdater til de nye shapes).
4. **Wire i `havebog.ts`** — beregn i sæson-vindue; returnér `dyrkerstatus` +
   `dyrkerkompetencer`.
5. **Gate i `page.tsx`** — indlogget: `harData.dyrkerstatus = status.length > 0`,
   `harData.dyrkerkompetencer = kompetencer.length >= 2`. Fjern de hardcodede
   `DEMO_`-render for indloggede (ærligheds-reglen). Demo beholder eksempler.
6. **Komponenter** `dyrkerstatus.tsx` / `dyrkerkompetencer.tsx` → redaktionel
   form (fjern niveau-prikker/progressbar/opnaaet-badges — Dyrkerstatus er
   allerede delvist af-gamificeret, commit 851bd76).
7. **QA** — `npx tsc --noEmit`, tests, preview (demo kuraterede eksempler), commit.

## Gating (eksplicit)
- Dyrkerstatus: vis IKKE hvis kun tom/demo-data (indlogget: ≥1 ægte status).
- Kompetencer: vis IKKE hvis < 2 meningsfulde kompetencer kan afledes.
- Demo: kuraterede eksempler OK.
