# Potalot — AI guide-fabrik

> **Status:** Parkeret som V2.5+. Spec'en bygges først når:
> 1. De første 10 redaktørguides er skrevet, importeret og live
> 2. V1.5 har aktiveret teknik-laget
> 3. V2 har aktiveret koncept-laget
> 4. Schema-udvidelser fra `GUIDES_ARCHITECTURE.md` er landet
>
> **Aktivér først når menneskeskrevne guides har bevist arkitekturen
> i praksis.** Ellers risikerer vi at automatisere den forkerte form.

---

## Bærende princip

> ## Byg det som en guide-fabrik med kvalitetskontrol — ikke som "AI skriver en guide".
> ## Sandhed før vibe.

Det første princip: **fabrik, ikke chatbot.** Pipeline med strukturerede
trin og validering — ikke én stor prompt der improviserer haveviden i
produktion. Det sidste har mennesker allerede gjort ved resten af
internettet. Se hvor muntert det blev.

Det andet princip: **hårde fakta kræver hårde kilder.** Hvis tre
haveblogs siger noget og ingen universitetsside bakker det op, så er
det "usikkert" — eller droppes. Brugeren skal kunne stole på at en
Potalot-guide siger sandt.

---

## Pipeline — seks trin

```
Input
  → 1. classifyGuideRequest()
  → 2. resolveBotanicalIdentity()
  → 3. retrieveSources()
  → 4. extractFacts()
  → 5. draftGuide()
  → 6. validateGuide()
  → AI-udkast i appen (klart markeret)
  → Redaktør kan godkende → Potalot-guide
```

### 1. `classifyGuideRequest()`

Bestemmer hvilken `guideLevel` der skal genereres:

| Input | Klasse |
|---|---|
| "Tomat" eller andet artsnavn alene | `species` |
| "Cherrytomat", "Buskbønne", "Capsicum annuum" | `group` |
| "Tomat San Marzano" eller variety-form | `variety` |
| "Sådan kniber jeg tomater" / handlings-spørgsmål | `technique` |
| "Hvad er F1?" / begrebsspørgsmål | `concept` |

Output: `{ guideLevel, parentSlug?, normalizedInput }`.

**Gruppe-erkendelse:** Gruppe er ikke et taksonomisk niveau — det er
dyrknings-/brugsbaseret. AI skal genkende intentionel gruppering fra
inputs som *"jeg vil have nogle cherrytomater"* (group: cherrytomat)
versus *"jeg vil have en San Marzano"* (variety). Hvis brugeren
nævner en sortskategori uden specifik sort, så er det Group-niveau.

Gruppe er **valgfri**: hvis arten ikke har meningsfulde grupper
(Hvidløg, Dild, Pastinak), så preserver vi den direkte Art → Sort-relation.

### 2. `resolveBotanicalIdentity()`

Normaliserer input til en kanonisk botanisk identitet før kildehentning.

```
"Habanero orange"           → latinName: Capsicum chinense 'Habanero Orange'
                              botanicalSpecies: Capsicum chinense
"san marzano"               → latinName: Solanum lycopersicum 'San Marzano'
                              botanicalSpecies: Solanum lycopersicum
"agurk marketmore"          → latinName: Cucumis sativus 'Marketmore'
                              botanicalSpecies: Cucumis sativus
"peberfrugt"                → latinName: Capsicum annuum (Grossum Group)
                              botanicalSpecies: Capsicum annuum
"chili"                     → latinName: Capsicum annuum / chinense / baccatum
                              botanicalSpecies: null (spænder flere arter)
"forspiring"                → Teknik: forspiring (ingen botanisk identitet)
"F1 hybrider"               → Koncept: F1-hybrider (ingen botanisk identitet)
```

`botanicalSpecies` returneres **separat** fra `latinName` fordi en
Potalot-art ikke nødvendigvis svarer til én botanisk art (se
[`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — sektionen
"Botanisk art vs Potalot-art").

For species/variety bruges botanisk navn som søgeforespørgsel til
kildemotorerne — øger præcision og adskiller fra trivielnavne der har
flere betydninger.

### 3. `retrieveSources()`

Henter 6-12 kilder pr. forespørgsel fra godkendte kildeklasser. Se
**Kildemodel** nedenfor.

Output: `Source[]` hvor hver kilde har `{ url, title, kildeKlasse, snippet }`.

### 4. `extractFacts()`

Udtrækker **kun strukturerede fakta** fra kilderne:

- Måneder (såning, udplantning, høst)
- Højde, modningstid, plantafstand
- Lys-, vand-, jordkrav
- Anvendelse
- Sygdomme

Output: `{ quickFacts, calendarRules }` der direkte kan skrives ind i
Potalot-template'ens YAML-frontmatter.

Hver fakta-værdi får en `confidence`-score:

- **high** — bekræftet af 2+ A-kilder
- **medium** — bekræftet af 1 A-kilde eller 2+ B-kilder
- **low** — kun C-kilder eller modstridende kilder

Lave confidence-værdier inkluderes med `needsReview`-flag, ikke som
"sandheder".

### 5. `draftGuide()`

Skriver markdown + YAML efter Potalot-template (samme struktur som
`_TEMPLATE-artsguide.md`, `_TEMPLATE-sortsguide.md` osv.).

Output: `string` (markdown med frontmatter).

### 6. `validateGuide()`

Tjekker den genererede markdown mod:

- **Schema-validering** — alle pligtfelter til stede, enum-værdier gyldige
- **Tone-pass** — Potalot-DNA (se Tone-regler nedenfor)
- **Dublet-tjek** — overlapper med eksisterende guide?
- **GuideLevel-regler** — fx species gentager ikke teknikker; variety
  gentager ikke artsguiden
- **Kildegrundlag** — minimum X A/B-kilder pr. fakta-bagende

Output: `{ valid: boolean, warnings: string[], confidence: number }`.

---

## Kildemodel

```
A-kilder (autoritative — fakta godkendes ene-stående):
- Universitets-extension sites (fx Penn State Extension, AU Aarhus)
- Botaniske haver (Kew, Aarhus Botanisk Have, Missouri Botanical)
- RHS / lignende haveinstitutioner
- Officielle plantesortsdatabaser
- Frøbanker / genbanker (NordGen, Kew Seed Information Database)

B-kilder (etablerede — fakta godkendes med 2+ kilder):
- Etablerede frøfirmaer med dyrkningsvejledninger (Solhatten, Sähköposten)
- Planteskoler med dyrkningsguider
- Professionelle avlere med dokumenteret produktion

C-kilder (erfaringskilder — bruges til kontekst, ikke fakta):
- Haveblogs
- Reddit (r/gardening, r/vegetablegardening)
- YouTube-have-kanaler
- Fora
```

### Sandhed-før-vibe-reglen

> Hårde fakta — måneder, temperaturer, plantafstand, sygdomme — må
> **kun** komme fra A- eller B-kilder.
>
> Bløde værdier — "smag", "duft", "stemning", "anbefaling" — må gerne
> trække på C-kilder. Det er der dyrker-erfaringen lever.
>
> Hvis tre blogs siger noget og ingen A/B-kilde bakker det op:
> **enten skriv det som usikkert, eller drop det.**

Det er radikalt. Det er meningen.

---

## Schema-udvidelser

Nye felter på `guides`-tabellen til V2.5:

```sql
ALTER TABLE guides ADD COLUMN origin TEXT;
  -- 'potalot' | 'user' | 'ai_draft'

ALTER TABLE guides ADD COLUMN source_quality TEXT;
  -- 'high' | 'medium' | 'low'

ALTER TABLE guides ADD COLUMN source_count INTEGER;

ALTER TABLE guides ADD COLUMN review_status TEXT;
  -- 'draft' | 'needs_review' | 'approved'

ALTER TABLE guides ADD COLUMN generated_from JSONB;
  -- {
  --   inputType: 'plant_name' | 'seed_upload' | 'user_request',
  --   inputValue: string
  -- }

ALTER TABLE guides ADD COLUMN fact_confidence JSONB;
  -- {
  --   quickFacts: number,    // 0-1
  --   calendarRules: number, // 0-1
  --   body: number           // 0-1
  -- }
```

Plus en separat `guide_sources`-tabel der kobler hver guide til de
specifikke kilder den blev genereret fra:

```sql
CREATE TABLE guide_sources (
  id UUID PRIMARY KEY,
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  kilde_klasse TEXT NOT NULL,  -- 'A' | 'B' | 'C'
  used_for JSONB,              -- hvilke fields kilden understøtter
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Det giver redaktøren mulighed for at audit'e: "Hvor kom denne påstand fra?"

---

## GuideLevel-regler for AI

### Artsguide (`species`)

- Forklarer planten generelt (oprindelse, vækst, behov)
- **Gentager ikke** sortsspecifikke detaljer
- Maks **3 teknikguide-referencer** (`:::guide`-blokke)
- Bør indeholde min. 1 `:::fact`-blok hvis arten har naturlig
  to-spalters-sammenligning (rank vs busk, drivhus vs friland)
- Slutter med `:::next-guide` der peger på sortsguide eller relateret art

### Sortsguide (`variety`)

- Forklarer **hvorfor brugeren vælger netop denne sort**
- **Gentager ikke** artsguiden (forspiring, udplantning, generel vanding hører
  hjemme i artsguiden)
- 4-6 korte sektioner
- Slutter med `:::next-guide` der peger på relateret sort eller relevant teknik

### Teknikguide (`technique`)

- Svarer på **én** konkret handling
- Trin-for-trin-format
- **Ingen** planteleksikon — generel viden om planter hører hjemme i artsguider
- `:::related-guides`-blok til sidst med "Relevant for disse planter"

### Gruppeguide (`group`) — V1.5

- Forklarer **forskellen mellem dyrknings-grupper inden for arten**
  (fx hvordan Stangbønne adskiller sig fra Buskbønne)
- **Gentager ikke** artsguiden
- Indeholder gerne et `:::fact`-blok der sammenligner gruppen med dens
  søskendegrupper (Cherrytomat vs Salattomat)
- Maks 2 teknikguide-referencer (`:::guide`-blokke)
- Slutter med `:::related-guides` der peger på sorter inden for gruppen,
  eller `:::next-guide` til en oplagt sort

### Konceptguide (`concept`)

- Forklarer **ét** begreb (F1, sædskifte, ledsageplanter)
- **Ingen** kalenderregler
- **Ingen** dyrkningsmanual
- Kort, eviggrøn, definitions-fokuseret

---

## Hvorfor gruppe-laget er kritisk for AI-anbefaling

Gruppe-niveauet eksisterer primært **for AI's gavn** når den skal
forslå sorter ud fra brugerens kontekst — ikke for taksonomisk renlighed.

**Eksempel:**

```
Bruger skriver:
  "Jeg har kun et højbed og gider ikke stativer."

AI-fabrikken finder:
  art = Bønne
  gruppe = Buskbønne (ikke Stangbønne — kræver stativ)

Foreslår sorter:
  Mascotte
  Processor

I stedet for at gennemgå alle bønnesorter i verden.
```

Uden gruppe-laget vil AI'en være tvunget til at evaluere alle
bønnesorter individuelt — og let foreslå Cobra eller Blauhilde fordi
de er populære, uden at indse de er 2-meter-klatreplanter.

Det er præcis derfor gruppe ikke er botanik: brugerens spørgsmål er
*"hvad passer til min situation?"*, ikke *"hvilken art er dette?"*.

---

## Backend-prompt

Den faktiske prompt agenten kører med i `draftGuide()`:

```
Du skriver Potalot-guides.

Potalot er en moderne dansk have-app med et roligt, redaktionelt og
praktisk univers. Du skriver ikke generiske SEO-artikler. Du skriver
som en erfaren, rolig havedyrker, der hjælper brugeren med at forstå
planten og handle rigtigt.

Output skal være Markdown med YAML-frontmatter.

Følg guideLevel:
- species:   forklar arten generelt
- variety:   forklar sortens særlige egenskaber og valg-rationale
- technique: forklar én konkret handling trin for trin
- concept:   forklar ét begreb

Brug kun fakta, der kan understøttes af gode kilder.
Hvis kilderne er uenige, vælg konservativ formulering.
Hvis data er usikker, marker feltet som needsReview i metadata.

Skriv i Potalot-tone:
- konkret
- roligt
- praktisk
- let poetisk i Potalot-note
- aldrig generisk haveblog
- aldrig SEO-fyld
- aldrig "læs mere"-links i brødteksten

Maks 3 guide-referencer i body.
Brug blokkene:
:::fact{variant="comparison" title="…"}
:::guide
:::related-guides
:::next-guide

Returnér et JSON-objekt:
{
  "guideMarkdown": string,
  "extractedFacts": { quickFacts, calendarRules },
  "sourceMap": { fact_path: source_url[] },
  "validationWarnings": string[],
  "confidenceScore": { quickFacts, calendarRules, body }
}
```

---

## Frontend-flow

Når en bruger tilføjer en ny sort eller plante som ikke har en guide:

```
1. Appen tjekker om guide findes (DB-opslag på slug + parentSlug).
2. Hvis ikke → AI-fabrikken startes baggrunds-job.
3. Brugeren ser en lille placeholder:
   "Vi skriver en guide til dig — kommer om ~30 sekunder."
4. Når AI-fabrikken returnerer:
   AI-udkastet vises med tydeligt banner øverst:

   ┌──────────────────────────────────────────────────┐
   │ AI-UDKAST · GENERERET AUTOMATISK                │
   │ Gennemgå og tilpas efter dine forhold.          │
   │ [Rediger] [Rapportér fejl]                      │
   └──────────────────────────────────────────────────┘

5. Brugeren kan redigere → guide bliver "Egen guide" med ai_draft lineage.
6. Redaktør kan godkende AI-udkastet → bliver Potalot-guide.
```

Trust-systemet er allerede designet til dette (Potalot-guide / Egen
guide / AI-udkast som tre adskilte typer — se `GUIDES_ARCHITECTURE.md`).

---

## Billede-output

AI-fabrikken returnerer ikke kun tekst. Den foreslår også
**billed-behov**:

```typescript
interface ImageNeeds {
  // Hero-billede (kun for species/variety, ikke technique/concept)
  artHeroPrompt?: string           // → arts/<slug>.jpg

  // Frøkort (kun for variety)
  seedCardImagePrompt?: string     // → frokort/<slug>.png

  // Plantekort hero (kun for variety)
  plantCardMacroPrompt?: string    // → plantekort/<slug>.jpg

  // Makro-fotos (Botanical Bleed)
  // - For species: 3-5 generiske art-motiver
  // - For variety: 5 sortsspecifikke motiver
  macroPrompts: Array<{
    filename: string               // fx 'blomst', 'tvaersnit', 'moden'
    prompt: string
    targetFolder: 'makro' | 'detail'
    slugFolder: string             // art-slug eller variety-slug
  }>
}
```

**Niveau-regler for `macroPrompts`:**

| guideLevel | Antal | Karakter | Folder |
|---|---|---|---|
| `species` | 3-5 | Generiske art-motiver (blomst, blad, stængel) | `makro/<art-slug>/` |
| `variety` | 5 | Sortsspecifikke motiver (moden, tvaersnit, groen, klase, detalje) | `makro/<variety-slug>/` |
| `technique` | 0-2 | Action-fokuseret (fx hånd der kniber) | `teknik/` |
| `concept` | 0 | Konceptguider er tekstbåren — ingen makro-behov | — |

Se [`BILLEDER.md`](./BILLEDER.md) for den fulde mappestruktur og
navngivnings-konvention der gælder for alle disse billeder.

Format-direktiver:

**Frøkort** (`frokort/`):
- Premium, minimalistisk, scandinavian still-life
- Objekt der føles som et digitalt UI-asset
- Neutral baggrund, ren komposition
- Til generering: bruges som AI-image-prompt

**Plantekort** (`plantekort/`) og **makro-fotos** (`makro/<plante>/`):
- Tæt botanisk makrofoto
- Taktil plante-struktur
- Shallow depth of field
- Rolig skandinavisk farve-grading
- Til ægte fotograf (eller AI-genereret hvis foto ikke findes)

Se [`BILLEDER.md`](./BILLEDER.md) for den fulde mappestruktur og
navngivnings-konvention der gælder for alle disse billeder.

---

## Anti-patterns — det fabrikken IKKE må gøre

| Forbudt | Hvorfor |
|---|---|
| "Du har sikkert hørt, at tomater er sunde…" | SEO-introduktion. Generisk. Ingen værdi. |
| "Tomater elsker sol, så plant dem i sol!" | Tautologi. Ingen ny information. |
| "Læs mere her" / "Se også" / "Klik her" | Bryder Potalots redaktionelle DNA |
| Blå inline-hyperlinks | Samme |
| "Tomater bør plantes når jorden er varm nok" | Vagheder uden konkrete tal |
| "Forskellige eksperter mener…" | Skribent-undskyldning. Vælg konservativ position. |
| Emoji i prose | Aldrig (kun i specielle markers som ⚘ Potalot-mærket) |
| Lange citater fra kilder | Plagiat-risk + bryder stemning |

---

## Forudsætninger

Før denne pipeline kan bygges, skal disse være på plads:

| Forudsætning | Hvor det parkeres |
|---|---|
| 10 redaktørguides eksisterer og fungerer | `REDAKTOER_BESTILLING_GUIDES_V1.md` |
| Tekniklaget aktiveret i schema | `GUIDES_ARCHITECTURE.md` V1.5 |
| Konceptlaget aktiveret i schema | `GUIDES_ARCHITECTURE.md` V2 |
| Import-script er bygget | (skrives når V1.5 lander) |
| Trust-system kan vise AI-udkast tydeligt | Allerede designet, mangler renderer-arbejde |
| `arts/` og `plantekort/` mapper har manuelt-leverede billeder | `BILLEDER.md` |

---

## Konklusion

Den rigtige magi ligger ikke i én stor prompt. Den ligger i:

> **Strukturerede inputs · gode kilder · guideLevel-regler · Potalot-tone ·
> validering · trust-status · redaktør-loop.**

Byg det som et redaktionelt system med AI-motor, ikke som en chatbot
der improviserer haveviden i produktion.

---

## Krydsreferencer

- [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — fire-lags-arkitekturen (Species / Variety / Technique / Concept) og netværks-topologien
- [`GUIDE_BLOKKE.md`](./GUIDE_BLOKKE.md) — DSL'en AI-fabrikken skal output'e: `:::fact`, `:::guide`, `:::related-guides`, `:::next-guide`
- [`TEKNIK_GUIDES_BACKLOG.md`](./TEKNIK_GUIDES_BACKLOG.md) — den menneskeskrevne backlog der skal være færdig før AI overtager
- [`REDAKTOER_BESTILLING_GUIDES_V1.md`](./REDAKTOER_BESTILLING_GUIDES_V1.md) — V1-bestillingsformular der definerer standarden
- [`BILLEDER.md`](./BILLEDER.md) — billed-mappestrukturen AI's image-needs skal output'e til

🌱
