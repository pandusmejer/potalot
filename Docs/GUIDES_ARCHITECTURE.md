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

- Mange sortsguides (variety) som arver fra den
- Mange teknikguides (technique) som linkes til den

**Schema:** `guideLevel: 'species'` *(eksisterer allerede)*.

---

## Niveau 3 — Sortsguides (Variety)

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

**Schema:** `guideLevel: 'variety'` + `parentGuideId` *(eksisterer allerede)*.

---

## Niveau 4 — Konceptguides (Concept) — V2

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
[ Variety ]
```

| Søjle | Spørgsmål | Eksempel |
|---|---|---|
| Species | Hvordan dyrker jeg? | Tomat, Agurk |
| Variety | Hvorfor netop denne? | San Marzano, Marketmore |
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

**V1.5 (efter launch + brugerfeedback):** Aktivér teknik-laget.

- Tilføj `'technique'` til `GuideLevel`-enum
- Opret M2M-tabel `guide_technique_links`
- Skriv 15 teknikguider (de eviggrønne ovenfor)
- Udvid guide-detail med "Teknikker der gælder"-sektion
- Udvid guides-forsiden med separat "Teknikker"-indgang
- Skriv 50 AI-genererede sortsguider med klart `AI-udkast`-badge

**V2 (senere):** Aktivér koncept-laget.

- Tilføj `'concept'` til `GuideLevel`-enum
- Skriv 5-10 konceptguider (F1, arvesort, frøægte, sædskifte, ledsageplanter)
- AI-pipeline for systematisk sortsgenerering
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
