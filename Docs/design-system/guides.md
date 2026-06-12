# Potalot — guides (V4)

> ## Status
>
> **Dette dokument er V4 og erstatter alle tidligere udkast.**
>
> V3 var resultatet af frøbank, plantekort, artsguider, makro-fotos,
> moodboards (maj 2026) og guide-mockups (juni 2026).
>
> **Detail som selvstændig billedtype er sløjfet** — makrofotos +
> beskæringer dækker behovet.
>
> **V4 tilføjede den vigtigste opdagelse:**
> Guides skal bygges som **lag**, ikke som **komponenter stablet
> ovenpå hinanden**. Den indsigt er låst i sektion -1.
>
> Hvis dette dokument er i konflikt med ældre guide-noter, vinder
> dette dokument. Hvis sektion -1 er i konflikt med en regel længere
> nede, **vinder sektion -1**.

---

## -2. Billedhierarki & visuel progression (V4.1 — låste regler)

V4.1-opdateringen kom efter at vi kunne se det færdige guidesystem
i browseren. Landing kom længst; artsguiden er halvvejs; sortsguiden
kæmpede stadig med identitet. Diagnosen: **det er ikke typografi
eller farver. Det er billedhierarki.**

### Reglerne der nu er låst

#### A. Sortsguiders 3 billedlag

En sortsguide skal vise **tre forskellige slags billeder** for at
føles som en sortsguide. Hvis et lag mangler, bliver siden
ensformig:

```
San Marzano ↓ San Marzano ↓ San Marzano ↓ San Marzano
```

— samme visuelle tone hele vejen ned. Brugeren lærer ikke noget
nyt visuelt.

| Lag | Type | Bruges til |
|---|---|---|
| **Lag 1** | Sortsfoto (plantekort) | Hero — "her er sorten" |
| **Lag 2** | Makrofoto (rolle: atmosphere) | Atmosfærisk baggrund bag faktabokse, sektion-overgange |
| **Lag 3** | Tekniske sortsfotos (alle andre roller) | Indhold inde i guiden — modning, klase, tværsnit, blomster, struktur |

Lag 1 + Lag 2 alene gør siden smuk men ensformig. **Lag 3 er det
der tilfører viden.** Det er den nye låste regel.

#### B. Makrofoto er atmosfære — ikke fortælling

> **Makrofotoet skal støtte fortællingen. Det skal sjældent være
> fortællingen.**

Det er præcis derfor de gamle bleed-elementer føltes døde — de
forsøgte at gøre makrofotoet til et UI-element. De nye lag-på-lag
sektioner fungerer fordi makrofotoet igen opfører sig som atmosfære
og ikke som en firkantet komponent der desperat prøver at ligne
stemning.

#### C. Visuel progression — ingen gentagelse

Sortsguiden må **ikke** vise det samme makrofoto igen og igen.
Brugeren skal opleve **visuel progression** gennem siden.

`guide-images.ts` + `selectGuideImage()` håndhæver det automatisk
via `usedMacroSrcs`-tracking + seeded selection pr. blok.

#### D. Landing gruppering — ARTER → SORTER

Database-rækkefølge skaber visuelle dubletter:

```
Tomat
Tomat
Chili
Chili
Café au Lait
Café au Lait
San Marzano
San Marzano
```

Mennesker læser det som gentagelser. Bibliotekslayoutet skal
gruppere:

```
ARTER
  Tomat
  Chili
  Dahlia
  Peberfrugt

SORTER
  San Marzano
  Café au Lait
  California Wonder
  Habanero Orange
```

Så opleves det som **progression** fra "hvilken plante?" til
"hvilken karakter af planten?".

#### E. Artsfoto er visuel identitet, ikke "én plante"

Allerede dokumenteret i [`../../BILLEDER.md`](../../BILLEDER.md)
sektion "De 6 billedroller" — gengivet her som låst:

> Artsfotoets opgave er ikke at vise én plante. Artsfotoets opgave
> er at vise den visuelle identitet af arten.

Tomat = plante. **Hvidløg = mark. Kartofler = rækker.**

#### F. "Begynd her" er artsniveau-navigation — sortsfotos forbudt

**Problem:** "Begynd her" siger tekstligt *"Tomater · Agurker · Chili
· Dahliaer"* — men bruger sortsfotos (San Marzano, Habanero Orange,
Marketmore, Café au Lait). Brugerens hjerne læser det som:

```
Tomater
↓
San Marzano

Chili
↓
Habanero Orange
```

— og senere på siden dukker de samme sortsfotos op igen i
sortskortene. Resultat: kognitiv konflikt + ubevidst *"har jeg ikke
allerede set det her?"*.

**Låst regel:** *"Begynd her"-sektionen må aldrig bruge sorts-
specifikke fotos. Sektionen repræsenterer artsniveau-navigation.
Alle kort skal bruge artsfotos.*

| ✅ Gør | ❌ Gør IKKE |
|---|---|
| Brug `arts/<art>.jpg` | Brug `plantekort/<art-sort>.jpg` |
| Tomater = tomatplante / drivhus / mange frugter | Tomater = San Marzano |
| Chili = blandede sorter / chiliplante / høst | Chili = Habanero Orange |
| Dahliaer = bed / flere blomster | Dahliaer = Café au Lait |
| Agurker = drivhus / mange frugter | Agurker = Marketmore |

**Reservation:** Sortsfotos forbeholdes:

- Sortslister
- Sortsguider (som hero)
- Relaterede sorter
- Frøbanken

**Testen:** *Brugeren skal kunne forstå forskellen mellem art og
sort alene ved at kigge på billederne.*

> Det svarer til at lave en side om hunde og bruge et nærbillede
> af én bestemt labrador som ikon for hele dyregruppen. Det virker
> indtil man begynder at tænke over det.

---

## -1. Tre specifikke moduler — låste opførsler

V4.1-observationer fra screenshot-review. Alle tre moduler virker
**teknisk** men ikke endnu som Potalot. De skal låses sådan her:

### A. Næste skridt-kortet

**Problem:** Mangler identitet. Lige nu kunne den lige så godt sige
*"Lær at skifte olie"* eller *"Lær at lave momsregnskab"*. Ingen
chili, ingen stemning, ingen visuel belønning.

**Låst regel — vælg én af to:**

| Mulighed A — atmosfærisk lag | Mulighed B — fritlagt objekt |
|---|---|
| Makrofoto bag kortet (frost på blad, moden chili, tørret chili, grenstruktur) | Lille botanisk foto (40-60 px) øverst i kortet |
| 20-30 % opacity, fade ud under papiret | Som *"dette handler om chili"*-signal |
| Aldrig som banner — kun som atmosfærisk lag | **Ikke emoji. Et lille botanisk foto.** |

**Mål:** Brugeren skal kunne se hvad næste skridt handler om
**før** de har læst titlen.

### B. Potalot-citatblokken

**Problem:** Tæt på, men mangler karakter. Er lavet som **artikel**.
Den bør føles som **indstik / brev fra redaktionen**.

**Låst regel:**

- Reducér bredden 5-10 %
- Reducér tekststørrelse en smule
- Mere luft, mindre væg af tekst, mere citat
- Ultra-svagt makrolag bag papiret — ikke synligt, kun mærkbart

**Layout-eksempel:**

```
POTALOT

"Det er ikke den chili,
du dyrker for størrelsen…"
```

### C. Kalender-rytmen — kapitler, ikke parkeringspladser

**Problem:** Største potentiale, største fejl. Lige nu vises:

```
Forspir
Prikl
Afhærd
Plant ud
Støt
Gød
Høst
```

som **syv ens bokse**. Det føles som et CRM-system, ikke en
dyrkningssæson.

**Låst regel:** Tidslinjen vises som **3 kapitler** efter naturlige
sæson-skift, ikke som N parkeringspladser:

```
JAN–FEB–MAR
● Forspir chili

APR–MAJ
● Prikl planter
● Begynd afhærdning

JUN–JUL–AUG
● Gød
● Bind op
● Høst løbende
```

Brugeren skal se sæsonens rytme, ikke en checklist.

### Prioritering (Annas vurdering)

| # | Modul | Hvorfor |
|---|---|---|
| 1 | **Kalender-rytmen** | Største gevinst — fylder mest, leverer mindst stemning pr. pixel |
| 2 | **Næste skridt** | Mangler botanisk identitet helt |
| 3 | **Potalot-citatet** | Tæt på, men for artikel-agtigt |

---

## -1.5. Claude vs. Codex — territorier

Tilføjet som låst arbejdsdeling efter V4.1-review:

| **Claude (arkitekt)** | **Codex (håndværker)** |
|---|---|
| Beslutter designprincipper | Bygger komponenter |
| Bestemmer billedhierarki | Flytter pixels |
| Definerer hvilke komponenter der skal eksistere | Skriver React |
| Beslutter hvilke billeder bruges hvor | Implementerer LayeredFactBlock, AtmosphericImageLayer |
| Skriver guides.md + BILLEDER.md | Tilføjer props og logik |
| Designer UX, informationsarkitektur og stemning | |

**Hvis problemet er "endnu en komponent" → Codex. Hvis problemet
er "hvilke billeder, hvor, hvornår" → Claude.**

Når en designregel som ovenstående diagnosticeres, kommer den
**altid først til Claude** for at blive låst i docs. Codex bygger
bagefter.

---

## -1. Lag, ikke komponenter (V4 — den vigtigste regel)

> **Hvis man kan tegne en tydelig rektangulær boks rundt om et
> billede — så er det sandsynligvis stadig for meget komponent og
> for lidt fotografi.**

### Problemet V4 løser

V3 troede at "Botanical Bleed som modul" løste sansen for nærhed.
Det gjorde det ikke. Når billeder bliver
til komponenter — selv med fade — ender de som:

```
SEKTION
[ billede ]
SEKTION
[ kort ]
SEKTION
```

Hjernen registrerer **"UI-komponent"** før den registrerer
**"tomat"**.

### Forskellen V4 låser

| Forkert (V3-implementation) | Rigtigt (V4) |
|---|---|
| `tekst` → `[ bleed ]` → `tekst` | `tekst` → foto vokser **ind i** sektionen → tekst fortsætter |
| `[ billede ]` med fade | foto **uden synlig kant** der opfører sig som baggrund |
| `tekst` → `[ faktaboks ]` → `tekst` | foto → faktaboks **ovenpå** fotoet → tekst fortsætter |
| Komponenter stablet | Lag i z-akse |

> **Fotografiet er ikke et element. Fotografiet er et materiale.**

### Z-INDEX SYSTEM (låst)

| Lag | Hvad | Regler |
|---|---|---|
| **1. Papir** | `#EAE6D8` baggrund | Altid nederst. Fylder siden. |
| **2. Atmosfæriske makrofotos** | tomathud, bladnerver, kronblade, dugdråber, frøkamre | MÅ fade, være ude af fokus, beskæres aggressivt, gå udenfor grid. MÅ IKKE have synlige rammer, beholdere, bounding box |
| **3. Indholdsfotos** | artsfoto, plantekortfoto, sortsfoto | MÅ have hård organisk maske, bryde layoutet, overlappe sektioner. MÅ IKKE ligge i rektangulære cards |
| **4. Faktabokse** | fact-card, "Vidste du?", Potalot-tip, Quick Facts | Placeres OVENPÅ billeder. Ikke under. Ikke mellem. Føles som papirark lagt på fotografi |
| **5. Typografi** | H1, H2, body, badges, kapitelnumre | Altid øverste lag |

### Atmosfæriske fotos (Lag 2)

Disse er **stemning, ikke indhold**. Når et foto er atmosfærisk:

- **Fade** mod baggrund
- **Blur** / ude af fokus
- **Aggressivt beskåret** (kun et udsnit synligt)
- **Går udenfor grid** (stikker ud over sektion-margin, ud over hero-kant)
- **Ingen hård afgrænsning, ingen synlig kant**

Det skal føles som om fotoet **fortsætter udenfor skærmen**.

Implementeringsmønster:
```jsx
<section className="relative">
  {/* Atmosfærisk lag — position absolute, lavopacity, stikker ud */}
  <img
    src="/images/makro/tomat-san-marzano/dug.jpg"
    aria-hidden
    className="absolute -right-8 -top-12 w-[70%] pointer-events-none"
    style={{
      opacity: 0.55,
      mixBlendMode: 'multiply',
      maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
      transform: 'rotate(-2deg)',
    }}
  />

  {/* Indhold flyder ovenpå */}
  <div className="relative z-10">
    {children}
  </div>
</section>
```

### Indholdsfotos (Lag 3)

Disse er **information**. Når et foto bærer identitet (artsfoto,
sortsfoto), så:

- **Hård organisk maske** — skarp kant, ingen fade
- **Bryder layoutet** — strækker udenfor tekstkolonnens kant
- **Overlapper sektioner** — kan starte i én sektion og række ind i den næste
- **Ingen rektangulære cards omkring**

### Faktabokse — V4 placering

V3 sagde: `tekst → faktaboks → tekst`.
V4 siger: **faktaboks ovenpå makrofoto**.

```
[ atmosfærisk makrofoto ]

        ┌──────────────┐
        │ VIDSTE DU?   │   ← lægger sig som papirlap på fotoet
        │ Tomater blev │
        │ tidligere    │
        │ anset som    │
        │ giftige.     │
        └──────────────┘

tekst fortsætter ...
```

Boksen skal føles **fysisk placeret på billedet**, ikke svævende
mellem to tekstblokke.

### Hero — V4 bygges som lag

**Forkert:**
```
titel
foto
tekst
```

**Rigtigt:**
```
titel
foto
tekst ovenpå foto
faktaboks ovenpå foto
```

Reference: master-mockup
[`./references/guides/01-master-mockup-sortsguide-plus-teknik.png`](./references/guides/01-master-mockup-sortsguide-plus-teknik.png).

### Implementerings-konsekvenser

- `BotanicalBleed` som **selvstændig komponent** er forkert tilgang.
  Den producerer rektangulær container med fade — dvs. præcis det
  vi vil væk fra. **Brug i stedet inline atmosfæriske lag.**
- Faktabokse kan IKKE renderes uafhængigt af deres makrofoto-bagrund.
  De skal placeres i en `<section className="relative">` med
  baggrundsbilledet **først** i DOM.

### Den nye designregel

| Når du står med | Spørg dig selv |
|---|---|
| Et nyt billede der skal ind | "Er det stemning eller indhold?" → Lag 2 eller Lag 3 |
| Et nyt UI-element | "Kan det ligge ovenpå et makrofoto?" → så placer det dér |
| En sektion der mangler liv | "Hvilket makrofoto kan vokse ind i den?" |
| Et `<div>` rundt om et billede | **Stop.** Hvorfor skal der være en kasse? |

> **Mål:** *"Fotografiet er blevet en del af siden."* — ikke
> *"Her er et billede."*

---

---

## 0. Visuelle referencer

Otte kanoniske billeder i [`./references/guides/`](./references/guides/).
**Når reglerne her og billederne er i strid — vinder billederne.**

| # | Reference | Hvad det er |
|---|---|---|
| 01 | [Master-mockup — sortsguide + teknik](./references/guides/01-master-mockup-sortsguide-plus-teknik.png) | Den vigtigste enkelt-reference |
| 02 | [Artsguide-mockup — Agurk](./references/guides/02-artsguide-mockup-agurk.png) | Fuldt arts-opslag |
| 03 | [Teknikguide-mockup — Knibning](./references/guides/03-teknikguide-mockup-knibning.png) | Fuldt teknik-opslag |
| 04 | [Farvepalette — moodboard-reference](./references/guides/04-farvepalette-locked.png) | Stemnings-reference. **V3 hex-codes i sektion 15.14 er autoritative** |
| 05 | [Form — organic blob-mask](./references/guides/05-form-organic-blob-mask.png) | Asymmetriske masker |
| 06 | [Form — fade-overgange](./references/guides/06-form-fade-overgange-social.png) | Bløde fade-overgange (Botanical Bleed) |
| 07 | [Form — S-maske](./references/guides/07-form-asymmetric-papaya-mask.png) | Sjælden asymmetri |
| 08 | [Aesop — editorial grid](./references/guides/08-reference-aesop-editorial-grid.png) | Inspirations-tone |

---

## 1. Den vigtigste erkendelse

Vi troede først, at guideproblemet var et **layout-problem**.

Det var det ikke.

Det er et **asset-problem**.

Brugere reagerer ikke primært på:

- marginer
- fontstørrelser
- card-radius

De reagerer på:

- nærhed
- tekstur
- plantestruktur
- makrofotografi
- følelsen af at være inde i planten

**Guides bliver ikke bedre ved flere UI-komponenter. Guides bliver
bedre ved bedre billedbiblioteker.**

---

## 2. Kernefilosofi

Frøbanken er et **værktøj**.

Guides er en **botanisk håndbog**.

**Ikke:** blog · magasin · CMS-side · SEO-artikel.

**Men:** moderne naturhåndbog · botanisk opslagsværk · planteencyklopædi.

**Reference:** Kinfolk × Royal Horticultural Society × moderne botanisk
feltbog.

---

## 3. Designregel

> **Alt vigtigt skal være geometrisk.**
> **Alt smukt skal være organisk.**

| Tekst | Fotos |
|---|---|
| grid | organiske former |
| struktur | asymmetri |
| læsbarhed | uforudsigelighed |

Spændingen mellem de to er Potalots visuelle signatur.

---

## 4. Billedsystemet

Guides må kun bruge billeder fra det eksisterende Potalot-system.
**Der må ikke opfindes nye billedtyper.**

Tilladte kilder:

```
arts/
plantekort/
frokort/
makro/
teknik/
```

Hvis der opstår behov for en ny billedkategori, skal designsystemet
opdateres **først**.

Tonal og kompositorisk specifikation for makrofotos er låst i
[`./prompts/makro-fotos.md`](./prompts/makro-fotos.md).

---

## 5. Artsniveau vs sortsniveau

Dette er en **låst arkitekturbeslutning**.

Artsniveau og sortsniveau har forskellige formål.
**De må aldrig blandes sammen.**

### Artsniveau

**Formål:** *"Hvordan ser denne plante ud?"*

**Eksempler:** Tomat · Agurk · Chili · Dahlia.

**Artsbibliotek:**

| Type | Antal | Eksempel |
|---|---|---|
| Hero | 1 | `arts/tomat.jpg` |
| Artsdetaljer | 2-3 | `makro/tomat/blomst.jpg`, `makro/tomat/staengel.jpg`, `makro/tomat/blad.jpg` |

Bruges i: artsguider, teknikguider, generel læring.

**Artsbiblioteket beskriver planten. Ikke sorten.**

### Sortsniveau

**Formål:** *"Hvordan adskiller denne sort sig fra andre sorter?"*

**Eksempler:** San Marzano · Marmande · Black Krim · Cherry Sweetie ·
Habanero Orange · Café au Lait.

**Sortsbiblioteket beskriver sortens karakter. Ikke blot arten.**

---

## 6. Asset-modellen (den store beslutning)

### Tidligere overvejelse (forkastet)

Pr. sort:

- 1 frøkort
- 5 makro
- 5 bleed

= 11 billeder. **Skalerer dårligt.** Ved tusindvis af sorter bliver det
urealistisk.

### Den nye model (låst)

Pr. sort:

| Type | Antal | Bruges i |
|---|---|---|
| **Frøkort-foto** | 1 (premium hero) | frøbank · lister · sortskort · søgeresultater |
| **Makrofoto** | 1 (premium nærstudie) | sortskarakteristika i guide |

Eksempler på hvad makroen viser:

- **San Marzano:** aflang form · frugtstruktur · klaseopbygning
- **Habanero Orange:** form · overflade · farve · vækst
- **Café au Lait:** kronbladskarakter · farvespil · blomsterstruktur

---

## 7. Hvorfor makroer skal være på sortsniveau

Hvis makroer ligger på artsniveau, får vi for tomat:

- blad
- blomst
- stængel
- grøn tomat
- klase

Disse kan bruges til alle tomater. **Men så mister vi:**

- San Marzanos aflange frugter
- Marmandes ribber
- Black Krims mørke skuldre
- Sweeties tætte klaser

Resultatet bliver *"Det er en tomat"* — i stedet for *"Det er San
Marzano."*

**Læringsværdien opstår på sortsniveau. Derfor skal makrobiblioteket
ligge på sortsniveau.**

---

## 8. Genbrug via beskæring

Den største produktionsbesparelse.

Et stærkt makrofoto kan bruges mange gange. Samme foto kan skabe:

- Botanical Bleed
- Hero-baggrund
- Header-beskæring
- Mobil-version
- Desktop-version
- Kvadratisk crop
- Vertikal crop

Et enkelt makrofoto leverer **5-10 visuelle anvendelser**.

> Vi producerer billeder. UI producerer variation. Ikke omvendt.

---

## 9. Botanical Bleed

**Formål:** Pause. Stemning. Rytme. **Ikke information.**

| Kendetegn | Værdi |
|---|---|
| Makrofoto | ja |
| Fade til baggrund | **ja** |
| Tekst | nej |
| CTA | nej |
| Caption | nej |

Bruges **mellem** sektioner.

---

## 12. Hero-system

| Guide-type | Hero | Reference |
|---|---|---|
| **Artsguide** | Artsfoto (hele planten) | MASTERPROMPT FOR ARTSGUIDE HERO-FOTOS *(skrives)* |
| **Sortsguide** | Plantekortfoto | MASTERPROMPT FOR PLANTEKORT-FOTOS *(skrives)* |
| **Teknikguide** | **Ingen fotohero** — kun farveblok + titel + kategori | — |

Teknikguider signalerer *handling*, ikke planteidentitet.

---

## 13. Makrofotos er et indholdsmodul

Makrofotos er **ikke pynt**. Makrofotos er **ikke dekoration**.

Makrofotos er **et egentligt indholdsmodul**.

De bruges til: rytme · læring · nærhed · variation.

Når en guide mangler energi, skal løsningen først være:

> *"Find et bedre makrofoto."*

Ikke:

> *"Lav et nyt card."*

---

## 14. Fremtidig skalering

Ved 1.000 sorter:

| Niveau | Hvad |
|---|---|
| Art | 1 hero + 2-3 artsdetaljer |
| Sort | 1 frøkort + 1 premium makrofoto |

Resten genereres via: crops · zoom · bleed-moduler · layouts.

Det reducerer billedproduktionen med **80-90 %** uden mærkbart
kvalitetstab.

Målet er ikke at producere flest billeder. Målet er at få brugeren
til at føle:

> *"Jeg læser ikke bare om planten."*
> *"Jeg er inde i planten."*

---

## 15. Design-spec — specifikke værdier

### 15.1 Sidecontainer (mobile-first)

```css
max-width: 640px;
padding-inline: 24px;
```

> Læsespalten skal føles som en bogside. Ikke som en app-screen.

### 15.2 Baggrund

```
Standard:    #EAE6D8
Alternativ:  #F2EEE4
```

Ingen ren hvid. Ingen grå. Ingen mørk-mode-specifik palette.
**Guides skal føles som papir.**

### 15.3 Typografi

#### H1 — guidetitel

Eksempel: *San Marzano*

```css
font-family: 'Cormorant Garamond';
font-size: 48px;
font-weight: 500;
line-height: 0.95;
letter-spacing: -0.02em;
color: #2D2A24;
```

Må gerne fylde 2 linjer. Må gerne være smuk.

#### Latinsk navn

Eksempel: *Solanum lycopersicum*

```css
font-family: 'Cormorant Garamond';
font-style: italic;
font-size: 20px;
opacity: 0.72;
```

#### H2 — kapitler

Eksempel: *01 — Om sorten*

```css
font-family: 'Cormorant Garamond';
font-size: 32px;
font-weight: 500;
line-height: 1.0;
```

**Cormorant. Ikke Manrope.**

#### Kapitelnummer

```css
font-family: 'Manrope';
font-size: 12px;
font-weight: 700;
letter-spacing: 0.12em;
color: #7F8F6A;
```

#### H3 — små sektioner

Eksempel: *BESTØVNING*

```css
font-family: 'Manrope';
font-size: 12px;
font-weight: 700;
letter-spacing: 0.12em;
text-transform: uppercase;
```

#### Brødtekst

```css
font-family: 'Cormorant Garamond';
font-size: 20px;
font-weight: 400;
line-height: 1.75;
max-width: 70ch;
```

**Cormorant. Ikke Manrope. Guides skal læses.**

### 15.4 Vertikal rytme

| Mellem | Pixels |
|---|---|
| Afsnit | 24px |
| Sektioner | 72px |
| Efter billeder | 40px |
| H2 og tekst | 16px |

### 15.5 Hero

| Type | Indhold |
|---|---|
| Artsguide | 1600×1200 artsfoto |
| Sortsguide | Plantekort-foto |

Herohøjde mobil: **420px**.

Billedet overlapper let tekst — **10-15 %**, ikke mere. Som magasin.

### 15.6 Quick Facts

Ligger lige under hero. **4 kolonner.**

Eksempel:

```
☀ Sol     💧 Vand     🌱 Sværhed     📏 Højde
```

```css
background: #F4F0E5;
border-radius: 24px;
```

**Ingen skygge.**

### 15.7 Faktabokse

Ikke cards. Ikke dashboard. Ikke widgets.
**Skal ligne indstik.**

```css
background: #F4F0E5;
border: 1px solid rgba(0,0,0,0.06);
border-radius: 24px;
padding: 24px;
```

**Ingen drop shadow.**

### 15.8 Potalot-tip

Signaturmodul. Kun **1-2 pr. guide**.

Layout:

```
⚘ POTALOT

tekst...
```

```css
background: #F0EBD9;
border-left: 4px solid #7F8F6A;
```

### 15.9 Vidste du?

Ny blok.

Layout:

```
VIDSTE DU?

Tomater blev anset som giftige...
```

**Baggrund: ingen.** Kun divider.

Må gerne føles som **note i margen**.

### 15.10 Botanical Bleed — specifikke værdier

| Felt | Værdi |
|---|---|
| Højde | 180-240px |
| Fade | ja |
| Tekst | nej |
| CTA | nej |
| Caption | nej |

### 15.11 Guidekort

Teknikguide · Relateret guide · Næste guide — **samme DNA**.

```css
background: #F4F0E5;
border-radius: 24px;
padding: 24px;
```

**Ingen skygge.**

> "Næste guide" som **sortsguidens sidste blok** er en specialregel —
> se 15.12.5 for hvornår `GuideComparisonList` eller `GuideComparisonBadge`
> erstatter `GuideNextCard`.

### 15.12 Ikoner

Kun outline. Lucide-style.

```
Stregtykkelse: 1.75px
```

**Ingen fyldte ikoner. Ingen emojis.** Undtagelse: Potalot-tip.

### 15.12.5 Sammenligningsblok ("Sammenlign med X")

Sortsguider får en sammenligningsblok som **siden's sidste blok**
(efter Potalot-note, før footeren). To komponenter dækker to roller:

#### `GuideComparisonList` — STANDARD

Tabel-stil med attribut-rækker (frugt, smag, anvendelse, modning).
Brugeren får **konkret data så de kan vælge** uden at klikke videre.
VS-badge i ikon-kolonnen. CTA "Se guide til [target]" rendres som
`<Link>` (eller disabled `<span>` hvis target endnu ikke findes).

**Bruges når:** der findes struktureret comparison-data for sorten.

**Bruges aldrig som:** dekorativ pause, top-blok, eller mellem prose.

#### `GuideComparisonBadge` — SPECIALVARIANT

Portræt-stil med to runde fotos + sage-grøn highlight-pill + kort
beskrivelse. Mere reklame-/anbefalings-orienteret.

**Bruges KUN til redaktionelle anbefalinger** med ét klart udsagn:

- "GOD TIL SAUCE"
- "BEDST TIL DRIVHUS"
- "NEM BEGYNDER-SORT"
- "BEDST TIL TØRRING"

**Bruges aldrig som standard.** Hvis "anbefalingen" er en neutral
data-sammenligning ("middeltidlig sort"), så er det List, ikke Badge.

#### Fallback

Hvis der **hverken** findes struktureret comparison-data eller en
redaktionel anbefaling, bruges den almindelige `GuideNextCard` (rolig
prose-CTA der pejler videre uden at love sammenligning).

#### CTA-tilstande (permanent regel)

CTA på `GuideComparisonList` har to tilstande afhængigt af om
target-guiden eksisterer i `IMPORTED_GUIDES` / `allGuides`:

**Hvis target-guide findes:**

- render som `<Link>`
- fuld opacity
- normal cursor

**Hvis target-guide ikke findes:**

- render som `<span>`
- `aria-disabled="true"`
- opacity `0.55`
- cursor `not-allowed`
- `title="Guiden er endnu ikke skrevet"`

ComparisonList må **stadig vises** uden aktiv CTA, fordi selve
sammenligningen leverer værdi på siden. Siden må ikke springe i
layout mellem brugere der har/ikke har adgang til target-guiden.

**Aldrig:** lad en live CTA pege på en 404.

#### Forbudt: identiske rækker

Hvis venstre og højre side viser **samme tekst** i samme attribut
("Middeltidlig sort × 2"), skal rækken enten fjernes eller
sammenflettes til én "begge"-celle. En sammenligningsboks der siger
to ting er ens, er bare en velklædt måde at spilde pixels på.

#### TODO

- [ ] Opret comparison-data pr. sort i separat datafil
      (fx `src/data/guide-comparisons.ts` med struktur
       `Record<guideId, ComparisonRow[]>`). Indtil da bor data
      inline i `guides/[id]/page.tsx` for Tomat San Marzano kun.
- [ ] Tomat Roma-guiden mangler stadig — derfor er CTA disabled
      på `/guides/tomat-san-marzano` lige nu. Når
      `content/guides/tomat-roma.md` lander og importeres,
      aktiverer CTA sig automatisk.

### 15.12.6 EditorialBleedCard (tekst-i-foto)

EditorialBleedCard er en **specialkomponent** hvor tekst og foto
smelter sammen i én blok via en fade-zone i selve billedet. Det
løser "blok på blok"-problemet for bestemte editorial overgange,
men må ikke bruges som almindelig prose-pause.

#### Formål

Foto og tekst SKAL opleves som samme bestanddel — ikke som to
objekter stablet på hinanden. Brug kun når den editorial overgang
er det centrale anslag, ikke som dekorativ pause.

#### Hårde regler

- **Maks 1 EditorialBleedCard pr. side.** Mere reproducerer
  blok-på-blok-problemet med en ny komponent.
- **Må aldrig stå tæt på BleedFromLeft, BleedFromRight eller
  BleedBand.** Begge har "foto med fade" og konkurrerer om samme
  visuelle plads. Stilkonflikt.
- **Må aldrig bruges som almindelig prose-pause.** Det er
  bleed-blokkenes job — de er KUN billede, EditorialBleedCard har
  tekst INDE i billedet. Forskellige problemer.
- **Bruges kun når tekst og billede skal smelte sammen i én
  editorial overgang.** Hero-hooks, sektion-introer, redaktionelle
  anslag — ikke informations-blokke.

#### Variant pr. kontekst

| Kontekst | Variant | Hvorfor |
|---|---|---|
| Guides landing | `band` | Full-bleed bånd er sektion-overgang, ikke kort |
| Sortsguide | `left` eller `right` | Container-bredde, ikke konkurrerer med BleedBand |
| Artsguide | `band` eller `right` | Vælges efter billede-orientering |

#### CTA-tilstande

CTA på EditorialBleedCard har tre tilstande (samme princip som
GuideComparisonList — se 15.12.5):

**Hvis `ctaHref` er sat:**
- render som `<Link>` (server-component-venlig, foretrukken)

**Hvis kun `onCtaClick` er sat:**
- render som `<button>` (client-only, til dialog-triggers)

**Hvis hverken `ctaHref` eller `onCtaClick`:**
- render INGEN CTA (ingen død knap som standard)

Aldrig en disabled CTA medmindre data eksplicit kræver det.

#### Hvor må den IKKE bruges

- Mellem prose-sektioner inde i guide-body (bleed-blokke har det job)
- Som faktablok (LayeredFactBlock/GuideFactCard har det job)
- Som comparison-blok (GuideComparisonList har det job)
- Som hero (HeroIdentityStack/GuideHeroEditorial har det job)
- Som signatur-blok (VidsteDuMedMakro/PotalotTipMedMakro har det job)

EditorialBleedCard er en **smal kniv** — den løser præcis ét problem:
foto + tekst i samme overgang. Brug den sparsomt.

### 15.13 Farver (autoritativ palette)

#### Tekst og struktur

| Rolle | Hex |
|---|---|
| Primær tekst | `#2D2A24` |
| Sekundær tekst | `#6A665C` |
| Linjer | `#D8D1BF` |
| Kort | `#F4F0E5` |

#### Naturpalette

| Navn | Hex |
|---|---|
| Salvie | `#7F8F6A` |
| Ler | `#A57A52` |
| Tomat | `#B85C46` |

### 15.14 Accentfarver pr. guide

**Kun én accentfarve pr. guide.**

| Guide | Accent |
|---|---|
| Tomat | `#B85C46` |
| Agurk | `#7F8F6A` |
| Dahlia | `#C9A8B0` |
| Hvidløg | `#D6C9A6` |

---

## 16. Guide-forbindelser

Potalot bliver **500 arter, 5.000 sorter, hundredevis af teknikguides**.
Derfor er guidernes **indbyrdes forbindelser** ikke en navigation-
detalje — det er arkitekturen der gør Potalot værdifuld.

### Den typiske brugerrejse

```
[Artsguide: Tomat]
     ↓ next-guide / sortsvarianter
[Sortsguide: San Marzano]
     ↓ :::guide
[Teknikguide: Prikling]
     ↓ relateret-problem
[Problemguide: Griffelråd]
     ↓ kalender-link
[Måned: Juni]
```

### Link-typer

| Type | Hvor | Hvor det peger hen |
|---|---|---|
| `parentGuideId` | Felt på sortsguide | Til artsguide den hviler på |
| `:::next-guide` | Sidst i en guide | Det redaktionelle "store næste skridt" |
| `:::guide` | Inline i body | Til en teknikguide |
| `:::related-guides` | Sektion i body | Til flere beslægtede sorter/guider |
| Sortsvarianter-grid | Auto-genereret på artsguide | Til alle sorter med `parentGuideId = arts.id` |
| `calendarRules` | Felt på guide | Til måneder hvor en handling er relevant |
| Frøbank-kobling | Via `inventory.guideId` | Til brugerens egne frø af sorten |
| Aktive planter | Via `plant.guideId` | Til brugerens igangværende dyrkninger |

### Regler

| ✅ Gør | ❌ Gør IKKE |
|---|---|
| Hver guide skal pege på **mindst én** anden guide | Lad en guide stå som ø uden næste-skridt |
| `:::next-guide` skal være redaktionelt bevidst | Bygge automatiske "Du kan også læse…"-lister |
| Teknikguider linkes via `:::guide` når de virkelig hører til | Spamme `:::guide` for hver mulig teknik |
| Sortsguider får automatisk sortsvarianter-grid på parent | Kræve manuel linking mellem søsken |

---

## 17. Bibliotek-layout

| Fase | Antal guides | Layout |
|---|---|---|
| **Fase 1** | 1-8 | Editorial grid med store kort, single column på mobil, 2-kolonne på desktop ≥ 1024px |
| **Fase 2** | 8-40 | Editorial **list** med thumbnail venstre + tekst højre, vedvarende søg/filtrer-toolbar, kategori-tabs |
| **Fase 3** | 40+ | Kategoriseret kataloglook, søgning primær, populære emner redaktionelt, evt. A-Z register |

Vi rammer ikke væggen — vi skifter vej før den.

---

## 18. Arts vs. sort — vidensniveau-skel

V4.3-låsning. Artsguider og sortsguider løser forskellige opgaver. De
skal ikke længere behandles som søstertyper med lidt forskelligt
indhold. Forskellen handler ikke om billeder — den handler om
**vidensniveau**.

| Niveau | Spørgsmål | Værktøjer |
|---|---|---|
| **Artsguide** | "Hvad er en peberfrugt?" | Hero + botaniske kendetegn + dyrkningsindhold |
| **Sortsguide** | "Hvordan ser Corno di Toro Rosso ud?" | Hero + 5 makro/detailfotos + dyrkningsindhold |

### Den ene regel

> **Artsguider kræver hero-foto.**
> **Sortsguider kræver hero-foto + 5 makro/detailfotos.**
> **Artsmakros er valgfrie bonusfotos, ikke et krav.**

### Hvorfor

Makrofotos er fantastiske til at vise *denne specifikke variant*.
Jo tættere kameraet kommer på planten, jo mere bliver motivet
sortsbestemt. "En tomatblomst" bliver i samme øjeblik San Marzanos
blomst — ikke arten Tomat. Derfor giver makrofotos kun begrænset
mening på artsniveau, og artsguider skal ikke proppes med dem for
syns skyld.

### Botaniske kendetegn (artsguidens kerne)

Artsguidens vigtigste indhold er ikke fotos, men en strukturel
beskrivelse af planten:

- Livsform (etårig, flerårig)
- Højde
- Bladtype og -form
- Vækstform (rank, busk, krybende)
- Rodsystem
- Blomster
- Bestøvning
- Livscyklus

Det rendres som **ren data** inde i guiden — ikke en separat
designsystem-komponent. Bare ikon + label + værdi, 5-8 gange på
række. Når 10 artsguider har brugt mønstret kan det blive til en
formel komponent. Tidligere er det tidlig abstraktion og koster
mere end det giver.

### Sortsguide-templates pr. plantetype

De fleste sortsguider falder i én af fire kategorier. Bestilling
af sortsbilleder bliver derved en checklist, ikke en kreativ
øvelse pr. sort.

#### Frugtbærende planter (tomat, peberfrugt, agurk, chili)

**Reference-case: California Wonder** — 6 distinkte roller, fuldt
udstyret pr. juni 2026. Brug pool'en som skabelon når nye
frugt-sorter får billeder.

1. Moden frugt
2. Umoden frugt
3. Tværsnit / indre
4. Blomst
5. Frugt på plante (struktur/led)
6. Kernehus (bonus)

#### Blomster (dahlia, …)

**Reference-case: Café au Lait** — 8 makros, 5 distinkte roller.

1. Fuld blomst
2. Kronbladsmakro
3. Knop
4. Blad/stængel
5. Knold/løg/frøstand

#### Rodfrugter

Ingen reference-case endnu. Afventer første rodfrugt-sortsguide.

1. Høstet rod
2. Tværsnit
3. Top/blade
4. Ung plante
5. Jord-/rodstruktur

#### Knolde og løg (hvidløg, dahlia-knold, …)

Ingen reference-case endnu. Skabelonen rammer planter hvis
identitet sidder i et underjordisk lager — ikke en frugt eller
en blomst. Bruges som primær template for hvidløg, og kan
sekundært bruges som "knolde-og-rødder"-supplement på blomster-
sorter med markante knolde (Café au Lait kan trække fra både
Blomster- og Knolde-templates uden konflikt).

1. Høstet løg/knold
2. Tværsnit/indre struktur
3. Top/blade/skud
4. Ung plante i jord
5. Jord/rod/propagationsdetalje

### Eksisterende arts-makros

Tomat, chili, agurk og dahlia har 4-9 arts-makros i pool'en pr.
juni 2026. Disse klassificeres som **botaniske referencefotos** —
vi beholder dem fordi de findes, men vi **bestiller ikke flere**.
Hvis en artsguide har 0 makros, vises ingen bleeds. Det er
sundere end at presse et tilfældigt makro ind for at fylde plads.

### Resolveren

Resolveren tildeler **ikke automatisk bleed-blokke til artsguider**
(V4.3-fix på `bleedAnchorPatterns` i `guide-article.tsx`). Hvis en
artsguide har makros, kan de bruges af eksplicit angivne slots
(fact-bg, evt. signaturer). Bleed-blokke i prose-flowet er nu et
sortsguide-fænomen alene.

### Hvidløg

Falder ind under **Knolde og løg**-templaten ovenfor. Hvidløg er
hverken en klassisk frugt-sort eller blomster-sort, og forsøget
på at presse den ind i en af de to skemaer gav forkerte
bestillingsanmodninger ("blomst af hvidløg?"). Knolde og løg-
templaten beskriver præcis hvad der skal fotograferes — løget
selv, fed-tværsnit, top, ung plante, propagationsdetalje — og
holder hvidløg fri af antagelser den ikke opfylder.

### Hvad denne beslutning forhindrer

Før V4.3 forsøgte systemet at bruge samme værktøj (makrofotos) til
to forskellige opgaver. Det skabte tre vedvarende problemer:

1. Tomme arts-makro-mapper der så forkerte ud i audits
2. Bestillingsanmodninger til arts-makros der ikke kunne defineres
   ("hvilken peberfrugt?")
3. Bleed-blokke på artsguider der altid endte med samme tilfældige
   makro fordi pool'en var for lille

Den ene regel ovenfor løser alle tre.

---

## 19. Anti-mønstre

Det vi **aktivt undgår**:

| Anti | Hvorfor |
|---|---|
| Lyseblå "Læs mere…"-inline-links | Hyperlink-pasta, ikke opslag |
| Gradienter inde i kort | Bryder den flade naturhåndbog-æstetik |
| Drop shadows + rounded-3xl + glassmorphism | App-grid-konvention |
| Store CTA-knapper midt i prosaen | Marketing-bagrund |
| Tabs på tværs af guide-detail | Naturhåndbog-opslag scroller |
| Sidebar med indholdsfortegnelse | TLDR-syndromet |
| Auto-playing video-headers | Stop |
| "Klar til at dyrke?"-banner i bunden | Marketing-bagrund, ikke natur |
| Captions under hver bleed | Bleeden skal stå nøgent |
| Hero-billeder på alle guidesider i biblioteket | Væg af billeder, ødelægger scanning |
| Tekst-wrap omkring billeder | Ser elegant ud, brækker på mobil |
| Nye billedkategorier udenom det eksisterende system | "Editorial Banner v2"-syndromet |
| Fade på organiske masker | Bryder "fysisk udklip"-følelsen |
| Mere end én accentfarve pr. guide-opslag | Farvelarm |
| Fyldte ikoner eller emoji i UI | Bryder outline-DNA'et (kun ⚘ i Potalot-tip) |

---

## Den vigtigste regel

Når Claude er i tvivl mellem:

> *"Skal jeg tilføje endnu et UI-element?"*

eller

> *"Skal jeg indsætte et makrofoto?"*

— så er det **næsten altid makrofotoet** der er det rigtige svar.

Guides skal føles som en botanisk håndbog, ikke som en meget flot
dashboard-side. Det er forskellen mellem **noget man læser** og
**noget man scanner**.

🌱
