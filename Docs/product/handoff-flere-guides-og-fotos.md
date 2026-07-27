# Overdragelse: implementering af flere guides + fotos

Formål: kunne starte en **frisk tråd** op på minutter og tilføje nye
dyrkningsguides og plante-/frøbanks-fotos uden at grave pipelinen frem igen.

Skrevet 18/7 lige efter master-syncen landede på `main`. Se
[[guides_two_layer_split]], [[guide_modul_system]], [[image_compression_rule]],
[[billed_deling]], [[kopiér_referencer]].

---

## 0. Nuværende tilstand (udgangspunkt)

- **13 guides live** (5 arter + 8 sorter): agurk, chili, dahlia, peberfrugt,
  tomat + sorterne. Alle `content/guides/*.md`, alle status `imported` i
  `content/guide-production/status.json`.
- **DB-masters synket:** 13 master-rækker (`user_id NULL`) i `public.guides`.
  Auto-kobling (`ensureGuideForInventoryItem/Plant`) genbruger nu masteren i
  stedet for at generere AI-udkast. Verificeret mod live.
- **CI grøn på `main`** (PR #12): `tsc` + `npm test` kører ved hver push/PR.
- **Fotos:** arts 6 · plantekort 28 · frokort 71 · makro 86 filer.

Alt peger samme vej (git = DB = live). Byg videre oven på det.

---

## 1. Guide-pipelinen (fra plan til DB)

Enkelt-retning, hvert trin har sit eget npm-script. Indholdet (teksten) røres
KUN i `generated/*.json` og ved promote — build/import/sync er deterministiske.

```
species.csv / varieties.csv   ← planen (hvad skal bygges)
        │  (AI/Anna skriver guide-JSON efter Docs/guide-templates/guide-schema.json)
        ▼
generated/<slug>.json         ← JSON-kø
        │  npm run guides:build            (JSON → markdown-KANDIDAT)
        ▼
built/<slug>.md               ← kandidat (ALDRIG live)
        │  npm run guides:diff <slug>      (gransk kandidat vs. live)
        │  npm run guides:promote <slug>   (kopiér kandidat → content/guides/)
        ▼
content/guides/<slug>.md      ← LIVE guide-tekst (kilde-sandhed for indhold)
        │  npm run guides:validate         (Niveau 1: enums, slugs, felter)
        │  npm run guides:mark <slug> approved
        │  npm run import:guides           (→ src/data/guides-imported.ts + billed-manifest)
        ▼
IMPORTED_GUIDES (læse-lag)    ← driver /guides, guide-detaljeside, "Se guide"
        │  npm run guides:sync-master -- --dry-run   (gennemgå: create/update/unchanged)
        │  npm run guides:sync-master                (skriv master-rækker i DB)
        ▼
public.guides master-rækker   ← koblings-lag (auto-kobling genbruger masteren)
        │  npm run guides:mark <slug> imported
```

**Livscyklus-status** (`guides:mark`, gemt i `status.json`, ALDRIG i teksten):
`draft` → `reviewed` (validate kørt) → `approved` (menneske godkendt fakta) →
`imported` (i DB). `npm run guides:status` viser overblik + huller.

### Komplet opskrift: tilføj ÉN ny guide
1. Tilføj rækken i `species.csv` (art) eller `varieties.csv` (sort; husk
   `parentSlug` = artens slug — ellers afvises sorten som forældreløs).
2. Læg guide-JSON i `content/guide-production/generated/<slug>.json`
   (skema: `Docs/guide-templates/guide-schema.json`; regler:
   `Docs/guide-templates/editorial-rules.md`; skabeloner:
   `species.template.md` / `variety.template.md`).
3. `npm run guides:build` → kandidat i `built/`.
4. `npm run guides:diff <slug>` → læs forskellen.
5. `npm run guides:promote <slug>` → gør live.
6. `npm run guides:validate` → skal være grøn.
7. `npm run guides:mark <slug> approved`.
8. `npm run import:guides` → opdaterer `IMPORTED_GUIDES`.
9. `npm run guides:sync-master -- --dry-run` → forvent `create: 1` (ny) eller
   `update: N` hvis en eksisterende guide-tekst er ændret.
10. `npm run guides:sync-master` → skriv til DB.
11. `npm run guides:mark <slug> imported`.
12. `tsc` + `npm test` + commit (afgrænset). Push → CI grøn → PR mod `main`.

> **Vigtigt:** en ny/ændret guide er IKKE fuldt live før BÅDE `import:guides`
> OG `guides:sync-master` er kørt. Læse-laget (import) giver "Se guide"-linket;
> koblings-laget (sync) sikrer auto-kobling uden AI-udkast. Springer du sync
> over, genererer appen igen et overflødigt AI-udkast for den nye plante.

---

## 2. Foto-pipelinen

```
npm run add:photo <fil> <plantekort|frokort|arts> "<Art>" ["<Sort>"]
```
Scriptet: danner slug (danske regler æ→ae osv.) → nedskalerer/komprimerer
(≤1800px, q82) → lægger i rette mappe → regenererer billed-manifestet. Så
intet 6MB-foto slipper ind (jf. [[image_compression_rule]]).

Mapper under `public/images/`:
- `arts/<slug>.jpg` — artsfoto (speciesHero)
- `plantekort/<slug>.jpg` — sortsfoto (plantCard + varietyHero)
- `frokort/<slug>.jpg` — frø-/indkøbskort (seedCard)
- `makro/<slug>/<navn>.jpg` — tekniske makro-fotos (lægges manuelt i mappen)

### Registrér billedet på guiden
Fotoet vises først, når det står i `src/data/potalot-image-sets.ts`
(`POTALOT_IMAGE_SETS_BY_ID`, keyed på guide-slug). Roller:
- `speciesHero` (art) · `varietyHero` + `plantCard` (sort, peger typisk på
  samme fil) · `seedCard` (frøkort)
- `macro: [...]` med roller: **`atmosphere`** (bag faktabokse) + tekniske
  (`structure`/`fruit`/`flower`/`leaf`/`seed`/`detail`).

> **Regel C** (Docs/design-system/guides.md §-2.C): hver sortsguide skal have
> mindst én `atmosphere`-makro OG tekniske roller — ellers bliver guiden
> ensformig ("San Marzano ↓ San Marzano ↓ …"). `check:images` fanger det.

### Efter fotos
- `npm run scan:images` → regenerér manifest (add:photo gør det selv, men kør
  ved manuelle makro-tilføjelser).
- `npm run check:images` → audit: guides uden hero, sorter uden makro/kort,
  image-sets der peger på ikke-eksisterende filer, ubrugte filer. Exit 1 ved
  problemer (CI-egnet).

Billed-deling (resolver, ikke hardcoding) og præcis 1:1-kopiering af Annas
reference-fotos: se [[billed_deling]] og [[kopiér_referencer]].

---

## 3. Nøglefiler

| Rolle | Sti |
|---|---|
| Guide-plan (arter/sorter) | `content/guide-production/{species,varieties}.csv` |
| JSON-kø | `content/guide-production/generated/*.json` |
| Kandidater | `content/guide-production/built/*.md` |
| LIVE guide-tekst | `content/guides/*.md` |
| Livscyklus-ledger | `content/guide-production/status.json` |
| Læse-lag (genereret) | `src/data/guides-imported.ts` (`IMPORTED_GUIDES`) |
| Billed-sæt pr. guide | `src/data/potalot-image-sets.ts` |
| Billed-manifest (genereret) | `src/data/image-manifest.generated.ts` |
| Billed-resolver | `src/lib/images/resolve-potalot-image.ts`, `types.ts` |
| Sync (læse→DB) | `scripts/guides-sync-master.ts`, `src/lib/guides/normalize-key.ts` |
| Guide-skema + regler | `Docs/guide-templates/guide-schema.json`, `editorial-rules.md`, `*.template.md` |
| Guide-designsystem | `Docs/design-system/guides.md`, `guide-moduler.md` |

Alle npm-scripts: `guides:build|diff|promote|validate|mark|status`,
`import:guides`, `guides:sync-master`, `add:photo`, `scan:images`,
`check:images`. (`npm test` = sync-tests.)

---

## 4. Læs FØR redesign af guide-visning (låst design)

Rør ikke disse uden ny retning fra Anna:
- [[guide_detaljeside_redesign]] — arts/sort-detaljeside, låst læseramme.
- [[sortsvarianter_sortkort_laast]] — Sortsvarianter-sektion + sortkort (SVG
  clip-path), ANNA-LÅST.
- [[guide_modul_system]] — de 4 modultyper + plante-tone-palet.
- Generelt: match låst design 1:1, "forbedr" det aldrig.

---

## 5. Sådan starter du den friske tråd

Åbningsprompt-forslag:

> "Vi skal tilføje flere guides + fotos. Læs
> `Docs/product/handoff-flere-guides-og-fotos.md` og
> `Docs/design-system/guides.md` først. Nye guides: [liste af arter/sorter].
> Nye fotos: [hvad Anna har]. Kør den fulde pipeline pr. §1/§2 og husk
> `import:guides` + `guides:sync-master` til sidst."

Første handlinger for assistenten:
1. `npm run guides:status` + `npm run check:images` → se hvad der mangler.
2. Afklar med Anna: hvilke arter/sorter, og hvilke fotos hun leverer.
3. Kør pipelinen ét menupunkt/én guide ad gangen (vertikal slice), commit
   afgrænset, push, hold CI grøn.

**Gentagne faldgruber:**
- Glemt `guides:sync-master` efter `import:guides` → AI-udkast genereres igen.
- Sort uden `parentSlug` i CSV/JSON → afvist som forældreløs (sync ruller
  tilbage).
- Makro kun med `atmosphere`-rolle → ensformig sortsguide (regel C).
- Ukomprimeret foto → brug altid `add:photo`, aldrig manuel kopi til
  `public/images/`.
- DB-migrationer: pak som spec + kør i egen tråd, aldrig ad-hoc
  ([[db_migration_handoff]]). (Guide-tilføjelse KRÆVER normalt ingen migration
  — kun `guides:sync-master`, som allerede findes.)
