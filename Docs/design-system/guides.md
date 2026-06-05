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

### 15.12 Ikoner

Kun outline. Lucide-style.

```
Stregtykkelse: 1.75px
```

**Ingen fyldte ikoner. Ingen emojis.** Undtagelse: Potalot-tip.

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

## 18. Anti-mønstre

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
