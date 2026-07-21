# Field reference — Potalot guide-JSON

Alle felter i `guide.schema.json`, afledt direkte fra importeren
(`scripts/import-guides.ts`), validatoren og de promoverede guides. En guide er
ét JSON-objekt. `additionalProperties: false` — **ukendte felter afvises.**

## Top-niveau

| Felt | Type | Obl. | Regler |
|------|------|:----:|--------|
| `slug` | string | ✅ | kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`. æ→ae, ø→oe, å→aa, ingen accenter. Art: `salat`. Sort: `salat-little-gem` (art-slug + sort). Teknik: `knibning-af-tomater`. |
| `guideLevel` | enum | ✅ | `"species"` (art), `"variety"` (sort) eller `"technique"` (teknik). |
| `parentSlug` | string\|null | ⬤ | **Kun sort:** slug på artsguiden sorten hører under (skal findes/planlægges). Art/teknik: udelad eller `null`. |
| `title` | string | ⬤ | **Kun teknik:** H1-titlen — handlingen, fx `"Sådan kniber du tomater"`. Art/sort: udelad. |
| `plantName` | string | ⬤ | **Art/sort:** artens navn, fx `"Salat"`. Samme på art og alle dens sorter. Teknik: udelad. |
| `variety` | string\|null | ⬤ | **Kun sort:** sortsnavn, fx `"Little Gem"`. Art/teknik: udelad eller `null`. |
| `appliesTo` | string[] | | **Kun teknik (valgfri):** slugs på arter/sorter teknikken hører til, fx `["tomat"]`. Til `:::guide`-kobling. |
| `latinName` | string\|null | | Fx `"Lactuca sativa"` / `"Lactuca sativa 'Little Gem'"`. |
| `primaryCategoryId` | enum | ⬤ | **Art/sort:** `fro` · `loeg` · `knolde` · `buske` · `traeer` · `stauder`. (Grøntsager/urter/tomater = `fro`; løg/hvidløg = `loeg`.) Teknik: udelad. |
| `summary` | string | ✅ | 10–200 tegn, 1–2 sætninger. Vises på kort. |
| `difficulty` | enum | | `easy` · `medium` · `hard`. |
| `tags` | string[] | | Korte nøgleord, fx `["cherrytomat","orange","tidlig"]`. |
| `quickFacts` | object | | **Kun art/sort:** strukturerede fakta (se nedenfor). `additionalProperties: false`. Teknik har ingen. |
| `calendarRules` | array | | Næsten altid `[]` (kalenderregler sættes separat). |
| `sourceLinks` | string[] (uri) | | Rigtige kilde-URL'er (RHS, frøleverandør). Skal resolve. |
| `sections` | array | ✅ | ≥ 1 prosa-sektion (se nedenfor). Teknik: hver sektion er typisk ét kort, imperativt trin. |

⬤ = betinget påkrævet efter `guideLevel`:
- `"species"` KRÆVER `plantName` + `primaryCategoryId`.
- `"variety"` KRÆVER `plantName` + `primaryCategoryId` + `parentSlug` + `variety`.
- `"technique"` KRÆVER `title` (og bruger IKKE `plantName`, `primaryCategoryId`, `parentSlug`, `variety`, `quickFacts`).

## quickFacts (alle valgfri, kun tilladte nøgler)

| Nøgle | Type | Note |
|-------|------|------|
| `preCultivation` | boolean | forkultivering ja/nej |
| `sowingMonths` | int[1–12] | forspiring-måneder |
| `directSowingMonths` | int[1–12] | direkte såning |
| `plantingOutMonths` | int[1–12] | udplantning |
| `harvestMonths` | int[1–12] | høst |
| `light` | enum | `full_sun` · `partial_shade` · `shade` |
| `water` | enum | `low` · `regular` · `high` |
| `soil` | string | |
| `germinationTemperature` | string | fx `"20-25 °C"` |
| `germinationDays` | string | fx `"5-10 dage"` |
| `plantSpacing` | string | fx `"45-60 cm"` |
| `rowSpacing` | string | |
| `sowingDepthMm` | integer | |
| `frostSensitive` | boolean | |
| `minimumTemperature` | string | |
| `growthType` | string | fx `"ranketomat"` |
| `height` | string | fx `"150-220 cm"` |
| `maturityDays` | string | fx `"ca. 57-65 dage"` |
| `primaryUse` | string | |

## sections[]

| Felt | Type | Obl. | Note |
|------|------|:----:|------|
| `heading` | string | ✅ | Bliver en `##`-overskrift. |
| `content` | string | ✅ | Fri markdown. `:::`-modulblokke lægges HER inde (se editorial-rules.md §"Modulblokke"). Build bevarer indholdet ordret. |

De fire modulblokke (`:::fact`, `:::guide`, `:::next-guide`, `:::related-guides`)
er IKKE top-felter — de skrives som tekst inde i en sektions `content`.

## Arv: art → sort (vigtigt for at undgå dubletter)

En sortsguide **arver** ved visning fra sin artsguide. Skriv derfor KUN det, der
adskiller sorten. Typisk arvet (udelad i sorten, medmindre sorten afviger):
`sowingMonths`, `directSowingMonths`, `plantingOutMonths`, `preCultivation`,
`germinationTemperature`, `germinationDays`, `soil`, `rowSpacing`, `sowingDepthMm`,
`minimumTemperature`, kalenderrytme. Typisk sort-specifikt (medtag i sorten):
`variety`, `maturityDays`, `height`, `growthType`, `plantSpacing`, `harvestMonths`
(hvis afviger), `primaryUse`, `tags`, `summary`, samt en `:::fact`-sammenligning
og et `:::next-guide` tilbage til arten.

## null kontra udeladt felt

- **Udelad** et valgfrit felt, du ikke har data til — det er standard. For
  `quickFacts`: udelad ukendte nøgler (opfind aldrig tal).
- **`null`** er kun meningsfuldt på `parentSlug`, `variety`, `latinName` (art =
  `null`/udeladt). Brug ikke `null` i `quickFacts` — udelad nøglen i stedet.
- Udeladt quickFacts-felt på en sort = "arv fra arten". Sat felt = "overstyr".

## Hvad validatoren fanger (niveau 1, maskine)

Manglende påkrævede felter · forkerte enums · slug ≠ kebab-case · slug ≠ filnavn ·
dubleret slug · sort uden `parentSlug`/`variety` · `parentSlug` uden eksisterende
art · summary > 200 tegn · ingen sektioner · ødelagte `:::`-blokke.
**Fanger IKKE fagligt indhold** — det gør et menneske (se editorial-rules.md).
