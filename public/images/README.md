# Potalot — sådan tilføjer du et billede

Praktisk guide til hvordan billeder organiseres og navngives.
Denne fil ligger sammen med mapperne, så du har den hvor du arbejder.

---

## Hvor ligger billed-mapperne?

```
/Users/mejervind/potalot/.claude/worktrees/romantic-chatelet-9908e2/public/images/
```

Sådan åbner du mappen i Finder:

1. Tryk Cmd+Shift+G i Finder
2. Paste stien ovenfor
3. Tryk Enter

> **Vigtigt:** Du har to "potalot"-mapper på computeren. Brug ALTID
> mappen ovenfor (worktree'en) — ikke `/Users/mejervind/potalot/` direkte.
> Hvorfor: alt det arbejde vi har lavet i denne session lever i
> worktree'en. Billeder lagt der bliver fanget af vores commits og
> ender automatisk i appen senere.

---

## Hovedreglen

> **Hvor et billede ligger, bestemmes af hvad det bruges til — ikke
> af hvilken plante det viser.**

Så hvis du har et nærbillede af en tomatblomst, ligger det i
`makro/tomat/`, ikke i en mappe der hedder `tomat/`.

---

## Mapperne — hvad de bruges til

| Mappe | Hvad |
|---|---|
| `arts/` | Hero-billede til en hel art (hele planten). Ét pr. plante. |
| `plantekort/` | Hero-billede til en sort (nærbillede af frugt/blomst). |
| `frokort/` | Fritlagt frø/frøpose-billede til frøbanken. |
| `heroes-maaneder/` | Hero-billede til hver måned i kalenderen (jan-dec + foraar). |
| `heroes-sider/` | Hero-billede til app-sider (frøbank, planter osv.). |
| `kalender/` | Kalender-specifikke grafiske elementer. |
| `makro/<slug>/` | Stemnings-nærbilleder (Botanical Bleed). Se mængde-regler nedenfor. |
| `detail/<slug>/` | Asymmetriske udsnit (Detail Bleed). |
| `teknik/` | Hero-billede til en teknikguide (knibning, opbinding…). |
| `historical/flora-danica/` | Gamle botaniske illustrationer. |
| `ui/` | Logoer, brand-elementer, custom-ikoner. |

---

## Regler for filnavne

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
hvidlog (for "hvidløg")            godt
```

**Bemærk:** Dette gælder **kun filnavne**. Tekst inde i guides har
naturligvis stadig "høst", "frø", "hvidløg".

### Regel 3 — Gentag ikke mappens navn

Hvis en mappe hedder `plantekort/`, behøver filerne inde i den ikke
også hedde `plantekort-...`. Det er at sige det to gange.

```
plantekort/tomat-san-marzano.jpg                  godt
plantekort/plantekort-tomat-san-marzano.jpg       redundant
```

### Regel 4 — Makro og detail: art-niveau **og** sort-niveau

Både `makro/` og `detail/` følger samme mønster som guides: en
folder kan høre til **enten** en art **eller** en sort. Folder-navnet
matcher guidens slug.

```
makro/
├── tomat/                              Art-niveau (3-5 generiske)
│   ├── blomst.jpg
│   ├── staengel.jpg
│   └── blad.jpg
│
├── tomat-san-marzano/                  Sort-niveau (5 sortspecifikke)
│   ├── moden.jpg
│   ├── tvaersnit.jpg
│   ├── groen.jpg
│   ├── klase.jpg
│   └── staengel.jpg
│
├── chili/                              Art
└── chili-habanero-orange/              Sort
```

**Hvorfor begge niveauer:** Art-fotos er generiske og bruges i
artsguider (en tomat-blomst ligner en tomat-blomst). Sort-fotos er
specifikke og bruges i sortsguider (San Marzanos aflange frugt ser
ikke ud som en Marmandes ribbede). Det er der lærings­værdien opstår.

**Mængde-regler:**

| Niveau | Antal fotos | Til |
|---|---|---|
| Art-makro | 3-5 | Botanical Bleed i artsguider — generiske motiver |
| Sort-makro | 5 | Botanical Bleed i sortsguider — sortsidentitet |
| Detail-bleed pr. sort | 1-2 | Asymmetriske bleeds når layoutet kalder på det |

### Regel 5 — Flere varianter af samme motiv

Når du har **flere fotos af samme ting** (fx tre nærbilleder af
chili-frø), nummerér med `-1`, `-2`, `-3`:

```
froe-1.jpg                         godt
froe-2.jpg                         godt
froe-3.jpg                         godt
```

Brug **kun** nummerering når billederne er **stilistiske variationer**
af samme motiv. Hvis de viser forskellige aspekter (fx ét med tørre
frø og ét med frø i en hånd), så er beskrivende navne bedre:

```
froe-tor.jpg                       godt — beskrivende
froe-i-haand.jpg                   godt — beskrivende
froe-spredt.jpg                    godt — beskrivende
```

### Regel 6 — Filnavn = guidens slug

Hver guide har en kort URL-venlig identifikator ("slug"). Filnavnet
skal være **præcis det samme ord**. Så ved appen automatisk hvilket
billede der hører til hvilken guide.

```
Guide-slug:           tomat-san-marzano
Billedfil:            plantekort/tomat-san-marzano.jpg
```

#### Slugs for de planlagte guides

| Plante | Slug |
|---|---|
| Tomat (art) | `tomat` |
| Tomat San Marzano (sort) | `tomat-san-marzano` |
| Tomat Roma (sort) | `tomat-roma` |
| Agurk (art) | `agurk` |
| Agurk Marketmore (sort) | `agurk-marketmore` |
| Chili (art) | `chili` |
| Chili Habanero Orange (sort) | `chili-habanero-orange` |
| Dahlia (art) | `dahlia` |
| Dahlia Café au Lait (sort) | `dahlia-cafe-au-lait` |
| Hvidløg (art) | `hvidlog` |

---

## Filformat

| Format | Bruges til |
|---|---|
| `.jpg` | Almindelige fotos (alle plante / makro / teknik / historical) |
| `.png` | Når baggrunden skal være gennemsigtig (typisk frøkort + brand-ikoner) |
| `.svg` | Logoer og ikoner (vektor — skarpe i alle størrelser) |

---

## Opløsning

Mindst **1200 px på korteste side**. Større er fint, mindre er ikke.

Specifikke anbefalinger pr. mappe:

| Mappe | Anbefalet størrelse |
|---|---|
| `arts/` | 1600 × 1200 (lidt bredere end høj) |
| `plantekort/` | 1200 × 1200 (kvadrat) eller 1600 × 1200 |
| `frokort/` | 1200 × 1200 |
| `makro/` | 1600 × 1200 eller større — beskåret tæt |
| `detail/` | Variabel — afhænger af form |
| `teknik/` | 1600 × 1200 |

---

## Eksempler — fuld sti til en fil

```
public/images/arts/tomat.jpg
public/images/plantekort/tomat-san-marzano.jpg
public/images/frokort/agurk-marketmore.jpg
public/images/heroes-maaneder/hero-maj-foto.png
public/images/heroes-sider/hero-froebank-foto.png
public/images/makro/tomat/blomst.jpg
public/images/makro/agurk/hanblomst.jpg
public/images/detail/dahlia/buket.jpg
public/images/teknik/knibning-af-tomater.jpg
public/images/historical/flora-danica/tomat.jpg
public/images/ui/potalot-logo.svg
```

---

## Tjekliste — når du tilføjer et nyt billede

1. **Hvad bruges det til?** → vælg mappen
2. **Hvilken plante er det?** → find slug'en (samme som guidens)
3. **Hvilket format?** JPG (foto) / PNG (gennemsigtig) / SVG (logo)
4. **Opløsning:** mindst 1200 px på korteste side
5. **Filnavn:** små bogstaver, bindestreger, ingen æøå, gentag ikke
   mappens navn
6. **Læg den i:** `public/images/<mappe>/[<plante>/]<slug>.<format>`

---

## De gamle mapper

I `public/images/` ligger der stadig tre gamle mapper med ældre
billeder:

- `froebank/` — gamle frøkort
- `groentsager/` — gamle plante-billeder
- `Flora-Danica/` — gamle illustrationer

Du behøver **ikke** gøre noget ved dem. Vi laver ikke en stor
oprydning. Når du **alligevel** skal udskifte et af de gamle
billeder, lægger du det nye billede i den nye mappe efter reglerne
ovenfor. Når alle gamle billeder naturligt er erstattet, kan de
gamle mapper slettes.

---

## Mapper der IKKE ligger i `public/images/`

Disse to mapper er **kun til dig** — de kommer aldrig på live-appen:

| Mappe | Hvad ligger der |
|---|---|
| `~/potalot/Photo references design/` | Mood boards, ChatGPT-inspiration, design-referencer |
| `~/Documents/` | Markdown-drafts, screenshots til ChatGPT, personlige arbejdsfiler |

Bland dem aldrig sammen med `public/images/`. Hvis et billede er
klar til appen, skal det flyttes ind i `public/images/` med det
rigtige navn og den rigtige mappe.

---

## Mere uddybende info

Den fulde dokumentation (med begrundelser, migration-strategi, og
udvikler-detaljer) ligger i:

```
Docs/BILLEDER.md
```

Men det meste praktiske du har brug for, står i denne fil.

🌱
