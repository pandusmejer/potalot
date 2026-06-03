# Potalot — billeder og fotos

Sådan organiseres billeder i appen. Når der er én forudsigelig
struktur, ved alle (Anna, redaktører, AI-assistent, udvikler) hvor
en ny fil hører hjemme — uden at skulle gætte.

> **Hovedregel:** hvor et billede ligger, bestemmes af **hvad det
> bruges til** — ikke af hvilken plante det viser.

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
├── makro/                   Stemnings-nærbilleder (Botanical Bleed)
│   ├── tomat/
│   ├── agurk/
│   └── …
├── detail/                  Asymmetriske udsnit (Detail Bleed)
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

### `frokort/` — Frø i frøbanken

**Hvad:** Fritlagt billede af frøet eller frøposen, neutral baggrund.

**Eksempler:**
- `frokort/tomat-san-marzano.jpg`
- `frokort/agurk-marketmore.jpg`

**Format:** JPG eller PNG (PNG hvis baggrunden skal være gennemsigtig).

**Bruges på:** Kortene i frøbanken og på frø-detalje-siden.

---

### `makro/<plante>/` — Stemnings-nærbilleder

**Hvad:** Tæt-på-billeder der **ikke forklarer** men **skaber stemning**.
Det er disse der senere får brugeren til at føle "jeg er inde i planten".

**Eksempler:**
- `makro/tomat/blomst.jpg`
- `makro/tomat/frugt.jpg`
- `makro/agurk/hanblomst.jpg`
- `makro/agurk/slyngtraad.jpg`

**Format:** JPG, høj opløsning (1600 × 1200 px eller mere). Beskåret tæt.

**Bruges til:** Det kommende **Botanical Bleed**-modul — den der bryder
rytmen i lange guides ved at fade ind og ud til gennemsigtighed.

**Anbefalet antal pr. plante:** 5. Mere er fint, men 5 dækker rytmen
i en typisk artsguide (ét billede pr. ~3 sektioner).

---

### `detail/<plante>/` — Asymmetriske udsnit

**Hvad:** Skarpt beskåret, organisk formet billede der "blæder" ind
fra venstre eller højre side af siden. Ingen fade — skarp kant.

**Eksempler:**
- `detail/tomat/modne-klaser.jpg`
- `detail/agurk/op-ad-espalier.jpg`

**Bruges til:** Det kommende **Detail Bleed**-modul.

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
| `/Users/anna/potalot/Photo references design/` | Mood boards, ChatGPT-inspiration, design-referencer |
| `/Users/anna/Documents/` | Markdown-drafts til guides, screenshots til ChatGPT, personlige arbejdsfiler |

**Bland dem aldrig sammen.** Hvis et billede er klar til appen, skal
det flyttes ind i `public/images/` med det rigtige navn og den
rigtige mappe.

---

## Tjekliste — når du tilføjer et nyt billede

1. **Hvad bruges det til?** → vælg mappen (`arts`, `plantekort`,
   `frokort`, `makro`, `detail`, `teknik`, `historical`, `ui`)
2. **Hvilken plante er det?** → find slug'en (samme som guidens)
3. **Hvilket format?** JPG (foto), PNG (gennemsigtig), SVG (logo)
4. **Opløsning?** Mindst 1200 px på korteste side
5. **Filnavn:** små bogstaver, bindestreger, ingen æøå, ingen
   mappe-gentagelse
6. **Læg den i:** `public/images/<mappe>/[<plante>/]<slug>.<format>`

🌱
