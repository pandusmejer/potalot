# Potalot — billeder og fotos

Sådan organiseres billeder i appen. Når der er én forudsigelig
struktur, ved alle (Anna, redaktører, AI-assistent, udvikler) hvor
en ny fil hører hjemme — uden at skulle gætte.

> **Hovedregel:** hvor et billede ligger, bestemmes af **hvad det
> bruges til** — ikke af hvilken plante det viser.

---

## De 6 billedroller — den mentale model

Potalot har **6 roller** for billeder. En rolle er ikke nødvendigvis
en separat billedfil — det er **funktionen** billedet tjener i en
specifik kontekst. Samme billedfil kan spille **én** eller **flere**
roller (fx plantekort-billede der genbruges som sortsfoto), men hver
rolle har sit eget formål og sine egne regler.

Hvis du er i tvivl om hvilken rolle et nyt billede tilhører — så
er det sandsynligvis et forsøg på at opfinde en syvende rolle. Stop.

### 1. Frøkort-billede

**Formål:** Viser sorten som **objekt** (fritlagt, produktagtig).
Motiv på farvet atmosfærisk baggrund.

**Bruges på:** Frøbank, frøkort-detail, sort-lister, kompakte
thumbnails, søgeresultater.

**Eksempel:** Én San Marzano-tomat på varm rød/terracotta baggrund.

### 2. Plantekort-billede (sortsfoto)

**Formål:** Viser sorten som **levende plante** (sanseligt makro-
eller close-up-udsnit i vækst).

**Bruges på:** Aktive planter, plantekort-detail, sortsguide-hero,
sortsguide-kort i biblioteket.

**Eksempel:** San Marzano på planten — stilk, dug, klaser, grønne
og røde toner.

### 3. Artsfoto

**Formål:** Viser arten som **visuel identitet** (hurtig
genkendelse — ikke nødvendigvis botanisk repræsentation).

**Bruges på:** Artsguide-hero, artsguide-kort, kategorier,
"Begynd her", relaterede arter.

**🔒 Låst regel — artsfotoets opgave:**

> Artsfotoets opgave er ikke at vise **én plante**.
> Artsfotoets opgave er at vise **den visuelle identitet af arten**.

Det kan være:

- én plante (tomat, dahlia)
- flere planter
- et bed
- **en mark** (hvidløg, kartofler, korn)
- et drivhus
- en gruppe planter
- kant-til-kant tæppe af samme motiv (løg i rækker, byg, hvede)

**Reglen:** Vælg den komposition som **hurtigst** får brugeren til
at tænke:

> *"Det dér er hvidløg."*
> *"Det dér er kartofler."*
> *"Det dér er tomater."*

**Genkendelse først, botanik bagefter.** Det er sådan mennesker
faktisk ser verden — selv om plantebøger ofte prøver at overbevise
os om noget andet.

| Art | Bedste komposition |
|---|---|
| Tomat | Én plante eller drivhusrække |
| Dahlia | Én plante eller gruppe i bed |
| Agurk | Plante i drivhus |
| Hvidløg | **Mark eller rækker** |
| Kartofler | **Rækker / mark** |
| Løg | **Mange løg i rækker** |
| Byg / hvede / rug | **Mark, bevægelse, mængde** |
| Chili | Plante med modne frugter |

### 4. Makrofotos

**Formål:** Viser planten som **materiale og nærhed** (sanselige,
tætte fotos af tekstur, blade, frugt, blomst, stængel, frøkamre).

**Bruges på:** Guides som lag, baggrunde, faktabokse, "Vidste du?",
Potalot-tip, overgange, sortsguider, atmosfæriske crops.

**Eksempel:** Tomathud med dug, dahlia-kronblade, chili-overflade.

**Regel:** Makrofotos må ikke gentages **ens** på samme side. Hvis
samme billede bruges flere steder, skal systemet variere crop,
zoom, placering og opacity.

Tonal og kompositorisk spec er låst i
[`design-system/prompts/makro-fotos.md`](./design-system/prompts/makro-fotos.md).

### 5. Tekniske sortsfotos

**Formål:** Tilfører **viden** om den konkrete sort inde i en
sortsguide. Modning, klase, tværsnit, opbinding, blomsterstand,
struktur. **Ny information**, ikke stemning.

**Bruges på:** Inde i sortsguiden som indhold (ikke baggrund).

**Eksempel:** Klase af San Marzano i forskellige modningsstadier,
tværsnit af peberfrugt, hvordan agurken klatrer.

**Hvor de lever:** Samme `makro/<slug>/`-mappe som atmosfæriske
makros. **Forskellen er rollen**, ikke filplaceringen.

**🔒 Låst regel — visuel progression i sortsguider:**

> Sortsguiden må **ikke** vise det samme makrofoto igen og igen.
> Brugeren skal opleve **visuel progression** gennem siden.

**Implementering:** `guide-images.ts` annoterer hver makro med en
rolle (`atmosphere` / `detail` / `structure` / `flower` / `fruit` /
`leaf` / `seed`). Atmosfæriske bruges som baggrund (rolle =
`atmosphere`); tekniske bruges som indhold (alle andre roller).

### 6. Thumbnails / crops

**Formål:** Afledte beskæringer af de 5 andre typer. **Ikke en
separat billedproduktion.**

**Bruges på:** Lister, søgeresultater, relaterede guides, små kort.

**Regel:** Systemet cropper fra frøkort, plantekort, artsfoto eller
makro. Aldrig en ny billedfil.

---

## Plantekort vs. sortsfoto — samme fil, to roller

Plantekort-billedet og sortsfotoet er **ofte samme fil** i
`plantekort/<slug>.jpg`. Forskellen er rollen den spiller:

| Som plantekort | Som sortsfoto |
|---|---|
| Vises på Planter-siden (aktive dyrkninger) | Vises på sortsguider, sortsoversigter, landing |
| *"Her er **din** plante."* | *"Her er **sorten**."* |
| Brugerens haveinventar | Potalots vidensbibliotek |

Når vi siger "plantekort-foto" mener vi typisk **filen**.
Når vi siger "sortsfoto" mener vi **rollen den spiller i guides**.

---

## Den korte regel

```
Frøkort           viser sorten som ikon.
Plantekort        viser sorten som levende plante.
Artsfoto          viser arten som visuel identitet.
Makrofoto         viser planten som sanseligt materiale (atmosfære).
Teknisk sortsfoto viser sorten som ny viden (indhold).
Thumbnails        er beskæringer, ikke nye billeder.
```

**Makrofoto skal støtte fortællingen. Det skal sjældent være
fortællingen.** Det er præcis derfor de gamle bleed-elementer
føltes døde — de forsøgte at gøre makrofotoet til et UI-element.

Resten er bare AI'er der prøver at opfinde
`image_final_v7_actual_use_this_one.jpg`.

---

## Hvor vises hvad — komplet matrix

| Sted i appen | Primært billede | Sekundære billeder |
|---|---|---|
| Frøbank | Frøkort | Thumbnail-crops af frøkort |
| Frøkort-detail | Frøkort | Evt. makro som baggrund |
| Aktive planter | Plantekort | Makro-crops |
| Plantekort-detail | Plantekort | Ingen eller makro-lag |
| Artsguide | Artsfoto | 2-3 artsdetaljer + makro |
| Sortsguide | **Sortsfoto** (plantekort-filen) | **Makro-atmosfære + tekniske sortsfotos** |
| Guides landing — artsguide-kort | Artsfoto | Atmosfæriske makrolag |
| Guides landing — sortsguide-kort | Plantekort / sortsfoto | Atmosfæriske makrolag |
| Faktabokse i guides | Makrofoto som baggrundslag | — |
| Potalot-tip / Vidste du | Makrofoto | Varierede crops |
| Søgning | Thumbnail-crops | Afh. type |
| Relaterede guides | Thumbnail-crops | Frøkort for sort, artsfoto for art |

---

## Tre-niveau-systemet

Potalots billeder følger en mental hierarki som brugeren lærer
automatisk gennem brug:

| Niveau | Hvad | Foto |
|---|---|---|
| **1. Art** | Tomat, agurk, chili, hvidløg | Artsfoto (visuel identitet) |
| **2. Sort** | San Marzano, Marketmore, Café au Lait | Plantekort (sanseligt udsnit) |
| **3. Guide-indhold** | Inde i en specifik guide | Makrofotos + crops |

Som brugeren ser:

- **Hel plante / mark / mængde** = art
- **Sanseligt udsnit** = sort
- **Tekstur og nærhed** = fordybelse

Det er en stærk mental model fordi den **lærer sig selv** —
brugeren behøver ikke at læse om systemet for at forstå det.

---

## Hvilke billeder går igen flere steder

| Billedtype | Går igen på |
|---|---|
| **Frøkort** | Frøbank · sortslister · søgeresultater · små thumbnails · relaterede sorter |
| **Plantekort** | Aktive planter · plantekort-detail · sortsguide-hero · sortsguide-kort |
| **Artsfoto** | Artsguide-hero · guides landing · artskort · relaterede artsguider |
| **Makrofotos** | Guides · faktabokse · Potalot-tip · Vidste du · atmosfæriske baggrundslag · crops i sortsguider |

**Vigtigt:** Sorter må aldrig arve generiske artsbilleder overalt.
San Marzano skal **ligne** San Marzano, ikke "tomat i almindelighed".
Ellers forsvinder læringsværdien.

---

## Mappestrukturen

```
public/images/
├── arts/                    Artsguide-hero (hele planten)
├── plantekort/              Sortskort-hero (nærbillede af sorten)
├── frokort/                 Frøkort i frøbanken
├── heroes-maaneder/         Måneds-hero i kalenderen
├── heroes-sider/            Side-hero (frøbank, planter osv.)
├── kalender/                Kalender-specifikke grafiske elementer
├── makro/                   Stemnings-nærbilleder (atmosfæriske lag i guides)
│   ├── tomat/
│   ├── agurk/
│   └── …
├── teknik/                  Hero-billede til teknikguider
├── historical/              Historiske botaniske illustrationer
│   └── flora-danica/
└── ui/                      Logoer, brand-elementer, ikoner
```

---

## Hver mappe forklaret

### `arts/` — Hele planten

**Hvad:** Ét billede pr. art. Planten i fuld størrelse, gerne in situ.

**Eksempler:**
- `arts/tomat.jpg`
- `arts/agurk.jpg`

**Format:** JPG, ca. 1600 × 1200 px (lidt bredere end høj).

**Bruges på:** Hero-billedet øverst i artsguider.

---

### `plantekort/` — Nærbillede af sorten

**Hvad:** Ét billede pr. sortsguide. Sortsspecifikt nærbillede — fx
en modnet San Marzano-klase, en Habanero-frugt, en Café au Lait-blomst.

**Eksempler:**
- `plantekort/tomat-san-marzano.jpg`
- `plantekort/agurk-marketmore.jpg`

**Format:** JPG, kvadratisk (1200 × 1200 px) eller lidt bredere.

**Bruges på:** Hero-billedet i sortsguider, samt plante-detalje-siden.

---

### `frokort/` — Indkøbskort i frøbanken

**Hvad:** Fritlagt billede af det propagation-materiale brugeren har
købt — neutral baggrund.

**Semantik:** Rollen hedder historisk `seed-card` / "frokort", men
dækker ALLE indkøbskort:

- frø (poser eller løse korn)
- knolde (dahlia, kartoffel)
- løg (allium, narcis, tulipan)
- sætteløg (perleløg, skalotter)
- stiklinger

> *Primary acquisition card image for seeds, bulbs, tubers, sets and
> similar propagation material.*

Ingen separat `bulb-card`- eller `tuber-card`-mappe. Pipelinen holdes
simpel: én rolle, én mappe, ét indkøbskort pr. PotalotImageSet.

**Eksempler:**
- `frokort/tomat-san-marzano.png` (frø)
- `frokort/agurk-marketmore.png` (frø)
- `frokort/dahlia-cafe-au-lait.png` (knold — når den lander)
- `frokort/hvidlog-therados.png` (sætteløg — når den lander)

**Format:** JPG eller PNG (PNG hvis baggrunden skal være gennemsigtig).
Frøkort bruger primært PNG pga. transparens-behov.

**Bruges på:** Kortene i frøbanken og på frø-detalje-siden.

---

### `makro/<slug>/` — Stemnings-nærbilleder (art **eller** sort)

**Hvad:** Tæt-på-billeder der **ikke forklarer** men **skaber stemning**.
Det er disse der senere får brugeren til at føle "jeg er inde i planten".

> 🌱 **Skal du generere eller bestille et nyt makro-billede?**
> Læs [`design-system/prompts/makro-fotos.md`](./design-system/prompts/makro-fotos.md)
> — masterprompten der låser tone, komposition, lys og farve på tværs
> af AI-genererede billeder og fotografer.

Folder-navnet matcher guidens slug — det kan være enten en **art** eller
en **sort**. Begge niveauer eksisterer som søskende-folders.

**Art-niveau** (generiske motiver der gælder hele arten):
```
makro/tomat/blomst.jpg
makro/tomat/staengel.jpg
makro/tomat/blad.jpg
```

**Sort-niveau** (sortsspecifikke motiver der adskiller sorten):
```
makro/tomat-san-marzano/moden.jpg
makro/tomat-san-marzano/tvaersnit.jpg
makro/tomat-san-marzano/groen.jpg
makro/tomat-san-marzano/klase.jpg
makro/tomat-san-marzano/staengel.jpg
```

**Hvorfor begge:** Art-fotos er generiske og bruges i artsguider (en
tomat-blomst ligner en tomat-blomst). Sort-fotos er specifikke og
bruges i sortsguider — det er der lærings­værdien opstår. San
Marzanos aflange frugt ser ikke ud som en Marmandes ribbede.

**Anbefalet antal:**

| Niveau | Antal pr. folder |
|---|---|
| Art-makro (`makro/tomat/`) | 3-5 generiske |
| Sort-makro (`makro/tomat-san-marzano/`) | 5 sortsspecifikke |

**Format:** JPG, høj opløsning (1600 × 1200 px eller mere). Beskåret tæt.

**Bruges til:** Det kommende **Botanical Bleed**-modul.

---

### `teknik/` — Teknikguider

**Hvad:** Ét hero-billede pr. teknikguide (knibning, opbinding,
forspiring osv.).

**Eksempler:**
- `teknik/knibning-af-tomater.jpg`
- `teknik/opbinding-af-tomater.jpg`

**Bruges på:** Hero på teknikguide-siden (kommer i V1.5).

---

### `historical/flora-danica/` — Historiske illustrationer

**Hvad:** Tegninger fra Flora Danica eller andre gamle botaniske værker.

**Eksempler:**
- `historical/flora-danica/tomat.jpg`

**Bruges til:** Dekorativt lag — fx små indstik i artsguider eller i
havebogens sansenoter.

---

### `ui/` — Brand og UI

**Hvad:** Logoer, brand-illustrationer, custom-ikoner der ikke findes
i standard-ikonbiblioteket.

**Eksempler:**
- `ui/potalot-logo.svg`

**Format:** SVG hvis muligt (vektor — skarp i alle størrelser),
ellers PNG med gennemsigtig baggrund.

---

## Navngivning af filer

### Regel 1 — Brug kun små bogstaver og bindestreger

```
tomat-san-marzano.jpg              godt
Tomat San Marzano.jpg              forkert (mellemrum + store bogstaver)
TomatSanMarzano.jpg                forkert (store bogstaver)
```

### Regel 2 — Undgå æ, ø, å i filnavne

Computere kan have problemer med danske bogstaver i fil-stier.
Skriv dem om — eller drop dem:

```
frokort                            godt (uden ø)
frøkort                            undgå
host (for "høst")                  godt
høst                               undgå
```

**Bemærk:** Dette gælder **kun filnavne**. Inde i tekst på en guide
står der naturligvis stadig "høst" og "frø".

### Regel 3 — Gentag ikke mappens navn

Hvis en mappe hedder `plantekort/`, behøver filerne inde i den ikke
også hedde `plantekort-...`.

```
plantekort/tomat-san-marzano.jpg                  godt
plantekort/plantekort-tomat-san-marzano.jpg       siger det to gange
```

Mappen fortæller allerede *hvad det er*. Filnavnet fortæller
*hvilken plante*.

### Regel 4 — Flere varianter af samme motiv

Når der er **flere fotos af samme ting** (fx tre nærbilleder af
chili-frø), nummerér med `-1`, `-2`, `-3`:

```
froe-1.jpg                         godt
froe-2.jpg                         godt
froe-3.jpg                         godt
```

Brug **kun** nummerering når billederne er **stilistiske variationer**
af samme motiv. Hvis de viser forskellige aspekter, så er beskrivende
navne bedre:

```
froe-tor.jpg                       beskrivende — tørrede frø
froe-i-haand.jpg                   beskrivende — frø holdt i hånd
froe-spredt.jpg                    beskrivende — spredt på overflade
```

### Regel 5 — Filnavnet skal matche guidens slug

Hver guide i databasen har en kort, URL-venlig identifikator
("slug"). Filnavnet skal være **præcis det samme ord**.

```
Guide:                tomat-san-marzano
Billedfil:            plantekort/tomat-san-marzano.jpg
```

Så ved appen automatisk hvilket billede der hører til hvilken guide.

### Tabel — slugs for kendte guides

| Plante | Slug | Eksempel på filnavn |
|---|---|---|
| Tomat (art) | `tomat` | `arts/tomat.jpg` |
| Tomat San Marzano (sort) | `tomat-san-marzano` | `plantekort/tomat-san-marzano.jpg` |
| Agurk (art) | `agurk` | `arts/agurk.jpg` |
| Agurk Marketmore (sort) | `agurk-marketmore` | `plantekort/agurk-marketmore.jpg` |
| Dahlia Café au Lait (sort) | `dahlia-cafe-au-lait` | `plantekort/dahlia-cafe-au-lait.jpg` |

---

## Hvilket filformat skal jeg bruge?

| Format | Bruges til |
|---|---|
| `.jpg` | Almindelige fotos (alle plante/macro/teknik/historical) |
| `.png` | Når baggrunden skal være gennemsigtig (typisk frøkort + brand-ikoner) |
| `.svg` | Logoer og ikoner (vektor — skarpe i alle størrelser) |

---

## Hvad gør vi med de eksisterende billeder?

Lige nu er der lidt rod fra tiden før denne struktur. Tre gamle mapper:

| Gammel mappe | Indhold | Plan |
|---|---|---|
| `public/images/froebank/` | Filer med `froekort-`-prefix | Flyttes til `frokort/` (uden prefix) næste gang et frøkort opdateres |
| `public/images/groentsager/` | Bland af artsguide- og sortsbilleder, navne med mellemrum og store bogstaver | Flyttes til `arts/` (helkrop) eller `plantekort/` (sort) når billedet alligevel udskiftes |
| `public/images/Flora-Danica/` | Mappen er stavet med stor F | Flyttes til `historical/flora-danica/` (små bogstaver) |

**Vigtigt:** Vi laver **ikke** en stor oprydning hvor alt bliver
omdøbt på én gang. Det er ikke det arbejde værd. **I stedet:** når
du alligevel skal udskifte et billede, lægger du det nye billede
direkte i den nye mappe med det nye navn. Når alle gamle billeder
naturligt er erstattet, kan de gamle mapper slettes.

---

## Hvad ligger IKKE i `public/images/`?

`public/images/` er en mappe **inde i selve Potalot-koden**. Alt
det der ligger her, kommer ud på den live app som rigtige brugere
ser. Læg kun **ship-bare assets** der.

Disse to mapper er **kun til dig** — de kommer aldrig på live-appen:

| Mappe | Hvad ligger der |
|---|---|
| `/Users/mejervind/potalot/Photo references design/` | Mood boards, ChatGPT-inspiration, design-referencer |
| `/Users/mejervind/Documents/` | Markdown-drafts til guides, screenshots til ChatGPT, personlige arbejdsfiler |

**Bland dem aldrig sammen.** Hvis et billede er klar til appen, skal
det flyttes ind i `public/images/` med det rigtige navn og den
rigtige mappe.

---

## Tjekliste — når du tilføjer et nyt billede

1. **Hvad bruges det til?** → vælg mappen (`arts`, `plantekort`,
   `frokort`, `makro`, `teknik`, `historical`, `ui`)
2. **Hvilken plante er det?** → find slug'en (samme som guidens)
3. **Hvilket format?** JPG (foto), PNG (gennemsigtig), SVG (logo)
4. **Opløsning?** Mindst 1200 px på korteste side
5. **Filnavn:** små bogstaver, bindestreger, ingen æøå, ingen
   mappe-gentagelse
6. **Læg den i:** `public/images/<mappe>/[<plante>/]<slug>.<format>`

🌱
