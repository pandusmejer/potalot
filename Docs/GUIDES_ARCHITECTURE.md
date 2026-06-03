# Potalot Guides — Arkitektur

> **Status:** Parkeret som V1.5-plan. Skemafundamentet eksisterer
> allerede (`guideLevel: 'species' | 'variety'` + `parentGuideId`).
> Niveau 3 (Technique) kræver én ENUM-tilføjelse + én M2M-tabel.
>
> **Aktiveres EFTER de første 10 guides er skrevet og launchet.**
> Den største risiko lige nu er ikke for-simpelt UI — det er at bygge
> tredje lag før det første lag overhovedet har indhold.

---

## Det grundlæggende princip

Potalots viden lever i tre lag, ikke ét. De fleste have-apps behandler
"Tomat" som én ting. I virkeligheden er:

```
Tomat
├── San Marzano
├── Moneymaker
├── Sungold
├── Black Cherry
├── Roma
├── Tiny Tim
├── Green Zebra
└── 200 andre sorter
```

Og samtidig findes der viden, som ikke handler om tomater overhovedet:

```
Sådan prikler du
Sådan opbinder du
Sådan hærder du af
Sådan laver du jordblokke
Sådan tager du stiklinger
Sådan beskærer du tomater
Sådan laver du frø
Sådan vander du i drivhus
```

Tre lag løser det rent — med et fjerde lag (Concept) der venter længere
ude, når biblioteket er stort nok til at retfærdiggøre det.

---

## Topologi: netværk, ikke hierarki

> Brugeren bevæger sig ikke ned gennem hierarkiet.
> Brugeren vandrer rundt i et netværk.

Det er en vigtig forskel. Niveauerne nedenfor betyder *ikke* at læseren
skal læse Species før Variety før Technique. En læser lander hvor som
helst — typisk gennem en søgning på en handling: *"Hvordan kniber jeg
tomater?"* — og vandrer derfra.

```
Species  →  Variety  →  Technique  →  Species
```

Det er en cyklus, ikke en pil. *Marketmore → opbinding-af-agurker →
tilbage til Agurk* er en sund trafik-loop, ikke en navigationsfejl.

**Konsekvenser:**

- **Hver guide er en mulig indgang.** SEO, search og deep-linking har
  samme værdi som en forside
- **`:::guide`, `:::related-guides` og `:::next-guide` er netværkskanter**,
  ikke breadcrumbs
- **Der findes ikke "tilbage til oversigten"** — fordi der ingen
  oversigt er
- **Sortsguider er invitationer, ikke manualer** — læseren har ikke
  nødvendigvis læst artsguiden først

### Editorial-følge: hver guide skal stå på egne ben

> ## Beskriv planten ud fra dens egne behov, ikke i forhold til en anden plante.

Det er en direkte konsekvens af netværks-topologien. Hvis brugeren
lander direkte på *"Peberfrugt"*, må teksten ikke kræve at vedkommende
først har læst *"Tomat"* — det gælder også når de er to artsguider,
ikke kun art→sort.

**Anti-mønstre:**

| ❌ | Hvorfor det ikke fungerer |
|---|---|
| *"Peberfrugter vokser mere kompakt end tomater"* | Forudsætter at læseren ved hvor stor en tomat er |
| *"Mindre krævende end chili"* | Cirkulær — kræver først at læseren har læst chili-guiden |
| *"Større end dild"* | Mål via sammenligning er ubrugeligt uden konteksten |
| *"Mere følsom end tomat"* | Det er stadig ikke information om peberfrugten — kun om tomaten |

**Hvordan vi gør det rigtigt:** Skriv konkret om planten selv.
*"Peberfrugter trives bedst med stabile forhold"* slår
*"Peberfrugter vokser mere kompakt end tomater"* — fordi den første
faktisk siger noget brugeren kan bruge.

Det betyder også: vi må gerne pege på andre guides (via `:::guide` og
`:::related-guides`) — det er netværkskanter. Men **brødteksten i en
guide må ikke afhænge af at læseren har klikket på dem.**

---

## Niveau 1 — Dyrkningsguides (Technique)

**Generel viden og færdigheder. Eviggrønne.**

Eksempler:

- Forspiring
- Prikling
- Ompotning
- Afhærdning
- Udplantning
- Opbinding
- Beskæring
- Vanding
- Gødning
- Frøhøst

En teknikguide kan bruges af mange planteguider. Den ændrer sig næsten
aldrig. Det er her Potalot kan blive en naturhåndbog.

**Schema:** ny enum-værdi `guideLevel: 'technique'`.

---

## Niveau 2 — Planteguides (Species)

**Viden om arten.**

Eksempler:

- Tomat
- Agurk
- Chili
- Dahlia
- Hvidløg

En planteguide beskriver plantens natur, behov, vækstform og almindelige
dyrkningsprincipper. Gælder 80–90% af alle sorter under arten.

En planteguide kan have:

- Mange gruppeguides (group) under sig — *valgfrit, kun når arten har
  meningsfulde dyrknings-/brugsgrupper*
- Mange sortsguides (variety) som arver direkte fra den, eller via en gruppe
- Mange teknikguides (technique) som linkes til den

**Schema:** `guideLevel: 'species'` *(eksisterer allerede)*.

### Botanisk art vs Potalot-art — vigtig schema-skelnen (V1.5)

> ## `latinName` = det brugeren tror planten er
> ## `botanicalSpecies` = det botanikken siger planten er

Det er hele reglen. Resten er udfoldninger.

Brugeren tænker *"Peberfrugt"* og *"Chili"* som to forskellige planter.
Botanikeren tænker *"Capsicum annuum"* som **én** art der dækker begge.
Begge mental-modeller er rigtige — bare i forskellige kontekster. Potalot
skal kunne tale begge sprog uden at få schema-migræne.

Schemaet skal kunne håndtere begge ved at adskille to felter:

| Felt | Hvad det rummer | Brugt til |
|---|---|---|
| `latinName` | Potalot-artens latinske formulering — kan inkludere cultivargroup eller varietet (`Capsicum annuum Grossum Group`, `Brassica oleracea var. italica`) | Vises på guide-siden, redaktionel præcision |
| `botanicalSpecies` *(nyt felt)* | Den **rene** botaniske art uden gruppe-/varietets-notation (`Capsicum annuum`, `Brassica oleracea`) | Krydsrelationer mellem Potalot-arter der deler botanisk art |

#### Eksempler

| Potalot-art | `latinName` | `botanicalSpecies` |
|---|---|---|
| Tomat | Solanum lycopersicum | Solanum lycopersicum |
| Æble | Malus domestica | Malus domestica |
| Peberfrugt | Capsicum annuum (Grossum Group) | Capsicum annuum |
| Chili | Capsicum annuum / chinense / baccatum | *(null — spans multiple)* |
| Broccoli | Brassica oleracea var. italica | Brassica oleracea |
| Blomkål | Brassica oleracea var. botrytis | Brassica oleracea |
| Rosenkål | Brassica oleracea var. gemmifera | Brassica oleracea |

#### Når en Potalot-art spænder over flere botaniske arter

Chili er undtagelsen. Den dækker Capsicum annuum, chinense og baccatum.
I dette tilfælde:

- `botanicalSpecies` på Chili-arten er **null**
- `botanicalSpecies` sættes i stedet på Chili's **grupper** (når gruppe-laget aktiveres):
  - Capsicum annuum-gruppen → `botanicalSpecies: 'Capsicum annuum'`
  - Capsicum chinense-gruppen → `botanicalSpecies: 'Capsicum chinense'`

Det matcher virkeligheden: chili-grupperne ER de botaniske arter.

#### Hvad det giver os senere

- **Botanisk søgning** — "Vis mig alle Potalot-arter med botanicalSpecies = Capsicum annuum" returnerer **både** Peberfrugt og Chili
- **AI-præcision** — `resolveBotanicalIdentity()` kan returnere både Potalot-artens identitet og den botaniske
- **Vidensoverførsel** — Sygdomsguides for Capsicum annuum kan automatisk linkes til både Peberfrugt og Chili
- **Migration-sikkerhed** — Hvis vi senere beslutter at slå Peberfrugt og Chili sammen til én art, har vi data-relationen klar

#### Schema-impact

```typescript
interface Guide {
  // … eksisterende felter
  latinName?: string | null         // eksisterer
  botanicalSpecies?: string | null  // NYT — V1.5
}
```

Migration-omfang: én optional kolonne. Bagudkompatibelt — eksisterende
guides hvor feltet ikke er sat, render som hidtil.

---

## Niveau 3 — Gruppeguides (Group) — V1.5, valgfri

**Dyrknings- og brugsorienteret mellemniveau.**

> **Vigtigt:** Gruppe er **ikke et taksonomisk niveau**. Det er ikke
> biologi. Brugeren tænker ikke *"jeg vil dyrke Capsicum annuum"* —
> brugeren tænker *"jeg vil dyrke en mild chili"*, *"jeg vil have
> buskbønner i krukker"*, *"jeg vil have nogle cherrytomater"*.

Gruppe-niveauet eksisterer primært til **navigation, læring og
dyrknings­mæssige forskelle**.

Eksempler hvor det giver mening:

| Art | Grupper |
|---|---|
| Bønne | Stangbønne · Buskbønne · Snitbønne · Voksbønne · Pralbønne |
| Tomat | Cherrytomat · Cocktailtomat · Salattomat · Bøftomat · Pastatomat |
| Chili | Capsicum annuum · Capsicum chinense · Capsicum baccatum |

Eksempler hvor gruppe **ikke** giver mening (og **ikke** skal tvinges):

- Hvidløg → direkte til sorter (Germidour, Messidrome…)
- Dild → direkte til sorter (Bouquet, Mammoth…)
- Pastinak → direkte til sorter (Gladiator, Hollow Crown…)

**Hvorfor det er kritisk at gruppe er valgfri:** Hvis vi tvinger
alle arter gennem et gruppe-niveau, ender vi med kunstige
mellem­kategorier som *"Hvidløg → Almindelig hvidløg → Germidour"*.
Det er bureaukratisk struktur uden brugerværdi.

### Reglen for hvornår en gruppe oprettes

> ## En gruppe oprettes først, når den giver mere værdi end kompleksitet.

Tre konkrete betingelser bør være opfyldt før en gruppe skabes:

1. **Datamængde** — du har 20-30+ sorter under arten der naturligt deler en gruppering
2. **Fælles karakteristika** — sorterne i gruppen deler observerbar dyrkningsmæssig forskel fra andre sorter under samme art
3. **Bruger-mental model** — folk siger og søger faktisk på gruppen ("jeg vil have en spidspeber") — ikke kun botanikere

Hvis blot **én** af betingelserne mangler: skriv ikke en gruppeguide endnu.

### Hvor gruppen kommer fra (og hvor den ikke gør)

| Tilgang | Resultat |
|---|---|
| **Top-down:** Læg alle arter ind i forudsatte grupper fra start | 100 grupper med 3 sorter hver. Brugeren ender med at navigere et Dewey-bibliotek for at finde en peberfrugt. |
| **Bottom-up:** Opret grupper når datamængden retfærdiggør dem | Få grupper der hver dækker en reel dyrknings-virkelighed. Brugeren forstår dem uden forklaring. |

Potalot vælger bottom-up.

### Hvilke arter har behov for gruppe FRA DAG ÉT

Tre arter er så naturligt grupperede at det er svært at skrive en
sammenhængende artsguide uden at hierarkien antydes:

| Art | Grupper | Hvorfor fra dag ét |
|---|---|---|
| **Tomat** | Cherrytomat · Pastatomat · Bøftomat | Vækstform, modningstid og anvendelse adskiller sig markant |
| **Bønne** | Stangbønne · Buskbønne | Forskellig højde (2m vs 40cm) → forskellig stativ-/krukkebehov |
| **Chili** | Capsicum annuum · chinense · baccatum | Forskellige arter med forskellige forspirings-vinduer og heat-profiler |

Alle andre arter — **inklusiv Peberfrugt** — starter uden gruppe-niveau.
Hvis sortskataloget vokser nok over tid, kan en gruppe tilføjes senere
uden at bryde eksisterende sortsguider.

**Niveauernes formål:**

| Niveau | Formål |
|---|---|
| Art | Biologisk identitet |
| Gruppe | Dyrknings-/brugsgruppe (ikke biologi) |
| Sort | Konkrete frøsorter |

**Schema:** ny enum-værdi `guideLevel: 'group'`. `parentGuideId` peger
på Species. Sortsguider kan herefter have `parentGuideId` til **enten**
en Group **eller** en Species (afhængigt af om arten har grupper).

---

## Niveau 4 — Sortsguides (Variety)

**Viden om den konkrete sort.**

Eksempler:

- Tomat San Marzano
- Tomat Sungold
- Chili Habanero Orange
- Dahlia Café au Lait

En sortsguide arver fra sin planteguide via `parentGuideId` og tilføjer
sortsspecifik viden:

- Beskrivelse
- Højde
- Dage til høst
- Smag
- Anvendelse
- Særlige hensyn

Skal være korte. Det er her AI kommer til sin ret — der findes
tusindvis af sorter, og du kommer aldrig til manuelt at skrive dem alle.

**Schema:** `guideLevel: 'variety'` + `parentGuideId` (peger på Group
*hvis arten har grupper*, ellers Species) *(eksisterer allerede)*.

---

## Niveau 5 — Konceptguides (Concept) — V2

**Forståelse af begreber. Ikke planter, ikke handlinger.**

Eksempler:

- F1-hybrider
- Frøægte sorter
- Arvesorter
- Sædskifte
- Ledsageplanter
- Biodynamisk dyrkning

En konceptguide besvarer **"Hvad betyder dette?"** — ikke *"hvordan
dyrker jeg?"* (species/variety), ikke *"hvordan gør jeg?"* (technique).

Konceptguider er en kategori for sig fordi de er **kategorisk
hjemløse** i species/variety/technique-modellen. F1 er ikke en plante,
ikke en sort, ikke en handling. Det er et begreb der gælder på tværs af
alle tre lag.

```
                 [ Koncept ]
                      ▲
                      │
[ Species ] ◄────► [ Technique ]
      ▲
      │
   [ Group ]   ← valgfri, kun når arten har dyrknings-grupper
      ▲
      │
[ Variety ]
```

| Søjle | Spørgsmål | Eksempel |
|---|---|---|
| Species | Hvordan dyrker jeg arten? | Tomat, Agurk, Hvidløg |
| **Group** | **Hvilken slags vil jeg have?** | **Cherrytomat, Buskbønne, Capsicum chinense** |
| Variety | Hvorfor netop denne? | San Marzano, Marketmore, Therados |
| Technique | Hvordan gør jeg? | Knibning af tomater |
| **Concept** | **Hvad betyder dette?** | **F1-hybrider, sædskifte** |

**Schema:** ny enum-værdi `guideLevel: 'concept'`.

**Hvornår:** først når biblioteket har 30-50 planteguider. Tidligere
bliver konceptguider for abstrakte — der mangler den konkrete kontekst
der gør et begreb forståeligt.

---

## Relationer

```
Sortsguide      → 1 Planteguide       (parentGuideId)
Planteguide     → mange Sortsguider   (omvendt opslag)
Planteguide     → mange Teknikguider  (M2M)
Teknikguide     → mange Planteguider  (M2M, omvendt)
```

**Teknikguide ↔ Planteguide-relationen** er en **kuratorisk M2M**, ikke
automatisk tag-matching. Redaktøren beslutter eksplicit hvilke teknikker
der hører til hvilke planter. Det matcher Potalots redaktionelle DNA:
kvalitet kommer fra kuratering, ikke fra automation.

**Schema:** ny tabel `guide_technique_links (species_guide_id, technique_guide_id)`.

---

## Brugerens oplevelse

Når en bruger åbner `Tomat San Marzano` (sortsguide), ser de:

```
Tomat San Marzano                    [Potalot-guide]
─────────────────────────────────────────────────
Solanum lycopersicum                 [Sortsvariant af Tomat]

[Quickfacts: 5/12 sået, mar-apr]

Sådan dyrker du
  (sortsspecifikke detaljer for San Marzano)

← Arvet fra Tomat-guiden
  "Tomater elsker varme. De fleste skal forspires…"

Teknikker der gælder
  → Sådan forspirer du
  → Sådan kniber du tomater
  → Sådan opbinder du
```

Ét opslag, tre informationsdybder. Brugeren skifter ikke side.

---

## Hvad det betyder for launch og bagefter

**V1 (launch):** 10 guides skrevet manuelt, 5 species + 5 variety.
Ingen teknikguider endnu. UI viser dem alle som "Potalot-guides" — den
tredelte taksonomi er endnu ikke synlig.

**V1.5 (efter launch + brugerfeedback):** Aktivér teknik-laget **og** gruppe-laget.

- Tilføj `'technique'` og `'group'` til `GuideLevel`-enum
- Opret M2M-tabel `guide_technique_links`
- Skriv 15 teknikguider (de eviggrønne ovenfor)
- Skriv 3-5 gruppeguider (Cherrytomat, Pastatomat, Buskbønne, Capsicum
  annuum...) for at se mønstret i praksis FØR vi skriver
  `_TEMPLATE-gruppeguide.md` — undgå at designe det syvende lag af
  stilladset før første mursten er lagt
- `parentGuideId` på Variety kan nu pege på Group OR Species
- Udvid guide-detail med "Teknikker der gælder"-sektion
- Udvid guides-forsiden med separat "Teknikker"-indgang
- Skriv 50 AI-genererede sortsguider med klart `AI-udkast`-badge

**V2 (senere):** Aktivér koncept-laget.

- Tilføj `'concept'` til `GuideLevel`-enum
- Skriv 5-10 konceptguider (F1, arvesort, frøægte, sædskifte, ledsageplanter)
- AI-pipeline for systematisk sortsgenerering — se [`AI_GUIDE_FABRIK.md`](./AI_GUIDE_FABRIK.md)
- Community-contributed teknikker
- Avancerede filtre

Konceptlaget aktiveres KUN når biblioteket har 30-50 planteguider — så
begreberne har konkret kontekst at hænge på.

---

## Launch-disciplinen

> Den største risiko lige nu er ikke at Guides bliver for simple.
> Den største risiko er at vi begynder at bygge tredje lag, før de
> første ti guides overhovedet er skrevet.

Dette dokument er bevidst skrevet for at blive **glemt i 1-2 måneder**.
Når de første 10 guides er skrevet, lanceret, og brugerne har givet
feedback — kom tilbage hertil.

🌱
