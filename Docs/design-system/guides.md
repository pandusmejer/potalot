# Potalot — guides (visuel + redaktionel DNA)

> **Formålet med denne doc:** Lås guidernes DNA inden vi rammer
> kode-tasten på naturhåndbog-redesignet. Det er et ~6-siders
> dokument der definerer **hvordan Potalot-guides ser ud og opfører
> sig** — ikke en final komponent-spec.
>
> Hvis denne doc ikke eksisterer, ender vi om 3 måneder med ti
> komponenter der hver især er pæne, og en helhed der ligner en
> app-hjemmesides "Vores Blog"-sektion. Den signatur som
> frøbanken og kalenderen allerede har fundet, mangler stadig her.
>
> **Status:** Første udkast skrevet af Claude baseret på sessionens
> samtale, Annas memory, eksisterende docs og reference-fotos.
> Anna reviewer, retter, låser.

---

## 0. Visuelt fundament

> Reglerne i resten af dokumentet udspringer af **stemningen** dette
> afsnit beskriver. Hvis et fremtidigt designvalg er i overensstemmelse
> med reglerne men i strid med stemningen — så er det stemningen der
> har ret. Mennesker husker billeder bedre end regler.

### Referencer

Potalot er ikke "én ting" — det er en kuratereret blanding:

- **Editorial magasinlayout** (Kinfolk, Cereal, Apartamento)
- **Moderne naturbøger** — britiske/skandinaviske botaniske udgivelser
- **Premium skincare og parfumeemballage** (Aesop, Le Labo) — for
  papirkant, tryksvære labels, beherskede farver
- **Coffee table books** for typografi-vejrtrækning
- **Royal Horticultural Society** for autoritet og saglighed
- **Gammel naturhistorisk håndbog** for rytmen mellem tekst og
  illustration
- **Modernistisk magasinlayout** for asymmetri og luft

**Godkendte visuelle referencer ligger i**
[`./references/guides/`](./references/guides/).
Den mappe er den endelige sandhed. Tekst-beskrivelserne i resten
af denne doc er en understøttende dokumentation af det, billederne
viser.

### Formbibliotek

Potalots faktiske form-vokabular — det der allerede er en del af
appens DNA i frøbank, kalender, manila-faner:

| Form | Hvor det bruges |
|---|---|
| **Organiske blobs** | Masker omkring billeder, hero-baggrunde, måneds-stemninger |
| **Asymmetriske billede-masker** | Detail Bleed, sortskort-foto, månedshero |
| **Papirlabels** | Frøbank-kort-headers, kategori-tags, det haptiske look |
| **Kapsler** | Pills, badges, kompakte status-elementer |
| **Overlappende kort** | Manila-mappe-stak (frøbank-arkiv), guidekort |
| **Runde highlights** | Spot-ikoner, tæller-bobler, månede-cirkler |
| **Bølgende overgange** | Frøbank-hero-bund, sektion-separatorer |
| **Soft bottom curves** | Manila-folder, kategori-baggrunde |

**Reglen:** Designet er **flade flader med organiske former**.
Indholdet inde i en blok er fladt og ugradieret — men blokkenes
ydre kanter er sjældent rektangulære. Den hybrid er Potalots
visuelle signatur.

### Billedbehandling

| ✅ Gør | ❌ Gør IKKE |
|---|---|
| Bløde overgange mellem foto og baggrund | Hårde sortie kanter på rektangulære billeder |
| Fade til creme-baggrund i hero-bunden | Brutale kanter mod næste sektion |
| Organisk beskæring — masker, blobs, bølger | Rectangulære galleri-grids |
| Lav-mætning på alle fotos | Instagram-saturation eller HDR |
| Lys, varm farvetone | Kølige skygger eller blålige højlys |
| Tæt-på-motivet for makro/detail | Wide shots med have-baggrund |

### Farvefilosofi

Farverne **trækkes fra planterne selv** — dæmpede, varme, lave i
mætning. Ikke "naturfarver" i den klassiske app-betydning.

Vi vil have:

- Støvet salvie
- Pistacie
- Creme
- Ler
- Terracotta
- Dæmpet oliven
- Sienna
- Tuscan sun
- Coastal blue (kun til vinter-momenter)
- Autumn bronze

Vi vil **IKKE** have:

- Klassisk skovgrøn ("forest green")
- Klassisk havegrøn ("grass green")
- Bondegårdsrød eller barnløgs-orange
- Syntetiske primærfarver
- Pastel-mint, lavendel, baby-blå (generiske app-farver)

Sæson-spillet (forår/sommer/efterår/vinter) skal kunne ses i
Potalot uden at det bryder hovedpaletten. Vinter-blå er accent,
ikke modspil.

### Det vi har lært af mockups (juni 2026)

> Erkendelse: Vores nuværende guide-mockups (tomat, agurk, knibning)
> er allerede længere fremme end den her doc. Mockupsene viser
> organisk-maskede billeder, fade-overgange, visuelle øer og
> modulære faktakort. Doc'en er ved at komme bagefter designet.
>
> Det er en god ting — billeder skal altid være forrest. Doc'en
> følger med, og denne sektion 0 er hvor billeder vinder over tekst.

---

## 1. Formålet

**Hvad er en Potalot-guide?**

> Et editorial naturhåndbog-opslag. Ikke en artikel. Ikke en blog.
> Ikke et CMS-stykke. Ikke et SEO-resultat med h2-overskrifter
> der staver `bedste-tomatsorter-2026`.

**Reference-sprog:**

> *"Kinfolk × Royal Horticultural Society × en gammel naturhistorisk
> håndbog"* — Annas formulering, og den er præcis.

- **Kinfolk** for typografi, vejrtræk, fotograferingsfølelse
- **RHS** for autoritet — saglig, præcis, ikke bange for tørt
- **Naturhistorisk håndbog** for rytmen — illustrationer der afbryder,
  marginal-noter, ægte respekt for emnet

**Hvad det ender med at være:** En **digital naturencyklopædi**.
Havefolk bruger overraskende meget tid på at læse om planter, de
ikke engang ejer endnu — det er næsten en biologisk drift. Guides
skal kunne læses for læsningens skyld, ikke kun som opslagsværk
til *"den her er den jeg har plantet"*.

| ✅ Guides ER | ❌ Guides ER IKKE |
|---|---|
| Selvstændige opslag der kan stå på egne ben | Listicle-sider der kæder hyperlinks sammen |
| Bygget op om visuelle pauser og tekstrytme | Tekstblokke afbrudt af call-to-actions |
| Skrevet til at blive læst i sin helhed | Optimeret til scroll-skim-bounce |
| Et katalog — også når der er 1.000 af dem | En blog der bliver lang og uoverskuelig |
| Plantens egne behov, ikke sammenligning som rygrad | "Hvad er bedst — X eller Y?"-format |

---

## 2. Tonal DNA

Guides taler som en haveven der ved meget, ikke som en marketing-stemme
der vil holde dig på siden.

| ✅ Det her | ❌ Ikke det her |
|---|---|
| *"Habanero Orange kræver længere sæson end mange almindelige chilier."* | *"Klar til at tage din chiliproduktion til næste niveau?"* |
| *"Brug handsker. Det er ikke en spirituel oplevelse."* | *"Vidste du at habanero kan være meget stærk? Læs mere her!"* |
| *"Sortens charme er at ingen blomster er helt ens."* | *"Café au Lait — et MUST for enhver buketdyrker."* |
| Stilhed mellem afsnit | Lyseblå "Læs mere…"-links i brødteksten |

Skæv humor må eksistere — sjældent, lavmælt, aldrig som åbningssætning.
Den slags sætning der får læseren til at smile en time senere, ikke
til at retweete i samme sekund.

---

## 3. Typografisk system

### Familier

| Rolle | Font | Variabel |
|---|---|---|
| Headings, body-prosa, citater | **Cormorant Garamond** | `var(--font-cormorant)` |
| Meta, badges, eyebrows, knapper, UI | **Manrope** | `var(--font-manrope)` |

Cormorant bærer indholdet. Manrope bærer skelet og navigation.
De krydser aldrig: et badge skal aldrig være Cormorant, en headline
skal aldrig være Manrope.

### Skala (låst — mobile-first)

Potalot er ikke et coffee-table-magasin. Det er en mobilapp.
Frøbanken og kalenderen fungerer netop fordi de **ikke råber**.
Guides må ikke pludselig blive *"editorial mode activated"*.

| Element | Font | Vægt | Størrelse | Linjehøjde |
|---|---|---|---|---|
| Hero-titel | Cormorant | 500 | 40-48px (responsiv) | 1.0 |
| Sektion `<h2>` | Cormorant | 500 | 26-32px | 1.05 |
| Undersektion `<h3>` | Cormorant | 500 | 20-24px | 1.1 |
| Body | Cormorant | 400 | 18px | 1.65 |
| Citation/fact-overskrift | Cormorant | 500 italic | 20-22px | 1.1 |
| Eyebrow / kategori | Manrope | 700 | 11-12px (caps, tracking 0.08em) | 1.0 |
| Meta (badges, tags) | Manrope | 500 | 12-13px | 1.3 |
| Badge-label | Manrope | 700 | 10-11px | 1.0 |

**Max-body-width:** 640px. Det er den editoriale læsekolonne.
Bredere, og prosaen mister sin rytme.

---

## 4. Side-rytme — den editoriale arketype

En typisk **artsguide** følger denne rytme:

```
1. Hero               (fuld-bredde foto + identitets-strip)
2. Intro-prosa        (Om planten)
3. Botanical Bleed    (makro-foto, edge-to-edge — pause)
4. Sektion 2          (Forskellige typer X)
5. :::fact-blok       (sammenligning, hvis relevant)
6. Sektion 3          (Forspiring eller anden teknik)
7. :::guide-blok      (henvisning til teknikguide)
8. Detail Bleed       (asymmetrisk udsnit — frø, blade)
9. Sektion 4-N        (resten af opslaget)
10. Sygdomme/typiske fejl
11. Potalot-note      (forfatterstemmen lukker af)
12. :::next-guide     (henvisning til sortsguide eller teknik)
```

En typisk **sortsguide** er **kortere og mere intim**:

```
1. Hero               (plantekort-foto)
2. Intro-prosa        (Om sorten)
3. Sortsspecifikke detaljer
4. :::fact-blok       (Hvad sorten er bedst til)
5. Smag og anvendelse
6. Detail Bleed       (frugt-tværsnit, blomst-nærbillede)
7. Det skal du være opmærksom på
8. :::guide-blok      (relevant teknik)
9. Høst
10. Typiske fejl
11. Potalot-note
12. :::next-guide
```

**Reglen:** Visuelle pauser hver 2.-3. sektion. Ingen guide skal være
ren tekstkolonne i mere end ~500 ord uden et visuelt afbræk.

---

## 5. Botanical Bleed

**Hvad det er:** Edge-to-edge horisontalt makro-foto der afbryder
tekstkolonnens læsning og giver et rent visuelt vejrtræk.
"Bleed" fordi det bryder ud af den indrykkede læseramme.

**Hvor det placeres:**
- Mellem sektioner med tematisk skifte
- Aldrig som første element på siden (hero er det)
- Aldrig to i træk

**Hvor mange:**
- **Artsguide:** 2-4 stk pr. opslag
- **Sortsguide:** 1-2 stk pr. opslag
- **Teknikguide:** 0-1 stk

**Densitetsregel (låst):** Maksimalt **én Botanical Bleed pr.
~500-700 ord**. Ellers begynder vi at indsætte billeder for
billedets skyld — og naturhåndbogen bliver en stock-photo-karusel.

**Beskæring og format:**
- **Mobil:** full-bleed (margin: 0), aspect 4/3 eller 3/2
- **Desktop:** contained med 32px side-margin, aspect 16/9 eller 21/9
- **Minimum motivopløsning:** 1600px på korteste side
- **Beskæring:** tæt på motivet, ingen helkrops-planter

**Kilde:**
- Artsguider trækker fra `public/images/makro/<art>/` (3-5 motiver)
- Sortsguider trækker fra `public/images/makro/<art-sort>/` (5 motiver)

**Eksempler på motiver:**
- Et blad mod modlys
- En blomst i halvåben tilstand
- En klase af modne frugter
- En stængel med sideskud

**Anti-mønstre:**
- Hele planten i fuld figur (hører til arts/-hero)
- Sceneri-fotos med have-baggrund (hører ingen steder)
- Pinterest-perfekte styling-shots med kobbervandkander

---

## 6. Detail Bleed

**Hvad det er:** Et asymmetrisk billede-udsnit der tager 50-70% af
læsekolonnen — ikke fuld bredde. Bryder rytmen mere subtilt end
en Botanical Bleed.

**Hvor det placeres:**
- Indenfor en sektion (ikke mellem sektioner)
- Som visuelt ankerpunkt for en specifik detalje teksten beskriver
- Når en Botanical Bleed ville være for stor en afbrydelse

**Hvor mange:**
- **Artsguide:** 0-1 stk
- **Sortsguide:** 1-2 stk
- **Teknikguide:** 1-2 stk (her er detail typisk vigtigere end botanical)

**Form:**
- Bredde: 50-70% af kolonne, ikke fuld bredde
- Placering: flush-left, flush-right, eller egen blok mellem afsnit
- Aspect: variabelt — 1/1, 3/4, 2/3 alt efter motivet

**Låst regel: INGEN tekst-wrap omkring billedet.**
Tekst-wrap er sådan noget mennesker tror ser elegant ud, indtil
de skal læse det på en telefon. Billedet sidder enten flush-left,
flush-right eller som egen blok — tekst flyder aldrig rundt om.

**Kilde:**
- `public/images/detail/<art>/` eller `detail/<art-sort>/` (1-2 motiver pr. niveau)

**Eksempler på motiver:**
- Et frugt-tværsnit der viser frøkamre
- Frø spredt på papir
- En blomsterstand set helt tæt på
- Blad-undersiden med årer

**Den typiske beslutning:** Botanical Bleed = visuelt vejrtræk.
Detail Bleed = ankerpunkt for et konkret detail-afsnit.

---

## 7. Komponent-katalog

Hver komponent har: **rolle, hvornår, felter, signatur, kode-link**.

### Hero (`GuideHero` — skal bygges)

- **Rolle:** Sidens første indtryk. Identifikation + visuel anker.
- **Hvornår:** Allerøverst, før noget andet.
- **Felter:** `primaryImageId`, `plantName`, `variety?`, `latinName?`,
  `kategoriId`, trust-badge.
- **Signatur:** Stort foto, navn i Cormorant 40-48px, latin i italic
  Cormorant, kategori-eyebrow i Manrope caps.
- **Anti:** Lyseblå CTA-knap, overlay-tekst på foto (læsbarhed),
  store gradients på fotoet.

**Hero-strategi (låst):**

| Guide-type | Hero-format |
|---|---|
| Artsguide | Fotohero (`arts/<slug>.jpg`) |
| Sortsguide | Fotohero (`plantekort/<slug>.jpg`) |
| Teknikguide | **Flat colour-block hero** — ingen foto |

Teknikguider får deres egen visuelle identitet — en flad farveblok
med stor Cormorant-titel og kategori-eyebrow. Det signalerer
*"handling, ikke art"* uden at konkurrere med arts- og sorts-guidernes
fotoæstetik.

---

### 📦 Billed-økonomi (låst regel)

> **Alle billedtyper i guides skal komme fra det eksisterende
> Potalot-billedsystem** (`arts/`, `plantekort/`, `frokort/`,
> `makro/<slug>/`, `detail/<slug>/`, `teknik/`, `heroes-sider/`).
>
> Der introduceres **ikke** nye billedkategorier uden en særskilt
> designbeslutning der opdaterer denne doc OG
> [`../BILLEDER.md`](../BILLEDER.md).

Hvorfor det er en låst regel: ellers opfinder folk om seks måneder
"Guide Header Photo v2", "Editorial Banner", "Inline Mood Image"
og andre kreative katastrofer. Kataloget er begrænset af **vilje**,
ikke af mangel på fantasi.

### Identitets-strip

- **Rolle:** Meta-information under hero.
- **Felter:** Kategori-ikon · trust-badge · sortsnavn (hvis variety) ·
  latinsk navn (italic).
- **Signatur:** Manrope, lav-vægt, separator som vertikal streg.

### `QuickFactsCard` (eksisterer)

- **Rolle:** "Hurtigt overblik" — sæsonbjælke, lys, vand, sværhedsgrad.
- **Hvornår:** Efter hero, før prosa.
- **Signatur:** Flat creme-kort, ingen skygger, naturhåndbog-look.
- **Filer:** `src/components/guides/quick-facts.tsx`

### `ProseSection` (eksisterer, men opgraderet i dag)

- **Rolle:** Almindelig tekstsektion med `<h3>` + body.
- **Markdown-support:** `**bold**`, `*kursiv*`, `- bullets`.
- **Signatur:** Cormorant, body max-width 640px, generøs leading.

### `GuideFactCard` — `:::fact{variant="comparison"}`

- **Rolle:** Sammenligning side-om-side. To-kolonner.
- **Felter:** Title, columns (2 stk), hver med heading + bullets.
- **Signatur:** Flat creme-blok med subtil border. Headings i
  Cormorant italic. Bullets i Cormorant regular. **INGEN GRADIENT**.
- **Filer:** `src/components/guides/guide-fact-card.tsx`

### `GuideTechniqueCard` — `:::guide`

- **Rolle:** Inline kort der peger til en teknikguide.
- **Felter:** `slug` (target), `title`, `description`.
- **Signatur:** Lille kort i creme med subtil ikon, "Læs videre"-pil.
- **Filer:** `src/components/guides/guide-technique-card.tsx`
- **Anti:** Lyseblå "Læs mere…"-tekst-link.

### `GuideRelatedList` — `:::related-guides`

- **Rolle:** Container med flere beslægtede sorter/guider.
- **Felter:** items (slug, heading, description) × N.
- **Signatur:** Horizontal scroll på mobil, grid på desktop.
- **Filer:** `src/components/guides/guide-related-list.tsx`

### `GuideNextCard` — `:::next-guide`

- **Rolle:** Det redaktionelle "store næste skridt", normalt sidst.
- **Felter:** title, description, slug, label.
- **Signatur:** Stor knap-agtig kort med pil. Cormorant tekst,
  Manrope label.
- **Filer:** `src/components/guides/guide-next-card.tsx`

### `GuidePotalotNote`

- **Rolle:** Forfatterstemmens lukke-afsnit. Lyrisk, ikke instruktivt.
- **Hvornår:** Lige inden `:::next-guide`.
- **Signatur:** Italic Cormorant, indrykket eller med lille
  ornament-divider over.
- **Filer:** `src/components/guides/guide-potalot-note.tsx`

### Botanical Bleed (`BotanicalBleed` — skal bygges)

- **Rolle:** Visuel pause mellem sektioner.
- **Felter:** image src, alt, mobile aspect, desktop aspect.
- **Signatur:** Full-bleed på mobil, contained på desktop.
- **Anti:** Caption under billedet (det skal stå nøgent).

### Detail Bleed (`DetailBleed` — skal bygges)

- **Rolle:** Asymmetrisk anker i en sektion.
- **Felter:** image src, alt, side ('left'/'right'), width-pct.
- **Signatur:** 50-70% af kolonne, flush til venstre eller højre.

### Kalender-strip (`KalenderKobling` — eksisterer)

- **Rolle:** "Rytme i kalenderen" — viser hvilke opgaver guiden
  vil generere.
- **Signatur:** Sæsonbjælke med ikoner pr. handling.

### Sortsvarianter-grid

- **Rolle:** På artsguide-sider: liste over sorter der knytter sig
  til arten.
- **Signatur:** Mini-kort med plantekort-foto + sortsnavn.

---

## 8. Guide-forbindelser

Potalot kommer ikke til at være 20 guides. Det bliver **500 arter,
5.000 sorter, hundredevis af teknikguides**. Derfor er guidernes
**indbyrdes forbindelser** ikke en navigation-detalje — det er
arkitekturen der gør Potalot værdifuld.

En guide er aldrig en isoleret artikel. Hver guide er en knude
i et netværk.

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

Rejsen behøver ikke gå én vej — brugeren kan komme ind på et
hvilket som helst niveau (fx via et notifikations-link, en
frøbank-kobling eller en søgning) og bevæge sig op, ned eller
sidelæns.

### Link-typer der findes mellem guides

| Type | Hvor | Hvor det peger hen |
|---|---|---|
| **`parentGuideId`** | Felt på sortsguide | Til artsguide den hviler på |
| **`:::next-guide`** | Sidst i en guide | Det redaktionelle "store næste skridt" |
| **`:::guide`** | Inline i body | Til en teknikguide |
| **`:::related-guides`** | Sektion i body | Til flere beslægtede sorter/guider |
| **Sortsvarianter-grid** | Auto-genereret på artsguide | Til alle sorter med `parentGuideId = arts.id` |
| **`calendarRules`** | Felt på guide | Til måneder hvor en handling er relevant |
| **Frøbank-kobling** | Via `inventory.guideId` | Til brugerens egne frø af denne sort |
| **Aktive planter** | Via `plant.guideId` | Til brugerens igangværende dyrkninger |

### Regler for forbindelser

| ✅ Gør | ❌ Gør IKKE |
|---|---|
| Hver guide skal pege på **mindst én** anden guide | Lad en guide stå som *ø* uden næste-skridt |
| `:::next-guide` skal være redaktionelt **bevidst** — ikke automatisk | Bygge "Du kan også læse…"-lister af alle relaterede |
| Teknikguider linkes via `:::guide` når de virkelig hører til | Spamme `:::guide` for hver mulig teknik |
| Sortsguider får automatisk sortsvarianter-grid på parent | Kræve at redaktøren manuelt linker mellem søsken |
| Problemløsning peger til den teknik der løser problemet | Lade problemguider være selvstændige opslag uden vej ud |

### Hvorfor det matter for V2.5+ AI-fabrikken

Når AI-fabrikken (se [`../AI_GUIDE_FABRIK.md`](../AI_GUIDE_FABRIK.md))
en dag genererer hundredevis af sortsguider, skal hver enkelt
**automatisk landes i netværket**:

- Få `parentGuideId` korrekt sat
- Få relevante `:::guide`-blokke til allerede-eksisterende teknikker
- Få `:::next-guide` til den mest naturlige relaterede sort
- Få `calendarRules` der trækker den ind i månedssiderne

Hvis netværket ikke er strukturen, ender vi med 5.000 isolerede
opslagssider og en søgefelt der gør al opdagelses-arbejdet for
brugeren. Det er præcis hvad Potalot ikke vil være.

---

## 9. Bibliotek-layout

Bibliotekssiden (`/guides`) skal vokse i tre faser efter
katalog-størrelse.

### Fase 1: 1-8 guides

- Editorial grid med store kort
- Hver guide har plads til primary image, badge, navn, summary
- Single column på mobil, 2-kolonne på desktop ≥ 1024px

### Fase 2: 8-40 guides

- Editorial **list** — horisontal række med thumbnail venstre, tekst højre
- Tighter kort, mere indhold pr. skærm
- Filtrer/søg flyttes til vedvarende toolbar øverst
- Kategori-tabs over listen (Frugt · Grøntsag · Krydderurt · Pryd)

### Fase 3: 40+ guides

- Kategoriseret kataloglook — sektioner pr. kategori
- Søgning bliver primær indgang
- "Populære emner" som redaktionelle indgange (sæson-tematik)
- Eventuelt bogstavsfaner (A–Z register)

**Reglen:** Bibliotekslayoutet skal **aldrig føles bibelsk-tomt**
ved fase 1 eller **uoverskueligt** ved fase 3. Tjek viewet før
hvert nyt sæt guides committes.

**Bemærk:** Grænserne er bevidst sat tidligt. Det visuelle
sammenbrud opstår omkring 10 guides — og biblioteket skal være
i Fase 2 **inden** vi rammer det. Vi rammer ikke væggen, vi
skifter vej før den.

---

## 10. Mobile vs desktop

| Element | Mobil | Desktop |
|---|---|---|
| Læsekolonne | Single column, fuld bredde | Max 640px centreret |
| Hero | Full-bleed foto, høj | 21:9 wide, contained |
| Botanical Bleed | Full-bleed, edge-to-edge | Contained med 32px margin |
| Detail Bleed | 70% af kolonne | 50-60% af kolonne |
| Fact-card | Kolonner stacks vertikalt | Side om side |
| Sektion-spacing | 32-40px | 48-64px |
| Kalender-strip | Horisontal scroll | Statisk grid |

**Reglen:** Designet er **mobile-first**. Hvis noget kun virker
flot på desktop, virker det formentlig ikke godt nok på det
medium hvor 80% af brugerne læser.

---

## 11. Farvepalette

Se også sektion 0 — **Farvefilosofi** — for hvilke farver der hører
til Potalots familie og hvilke der eksplicit ikke gør.

### Kerne (altid synlig)

| Rolle | Værdi | Note |
|---|---|---|
| Baggrund — creme | `#F4F0E6` / `var(--background)` | Den faste base |
| Tekst — primær | `#24301F` (dæmpet skov-mørk) | Næsten sort, varm undertone |
| Tekst — sekundær | `rgba(36,48,31,0.72)` | Body-prosa |
| Tekst — meta | `rgba(36,48,31,0.55)` | Eyebrows, badges, timestamps |
| Card-border | `rgba(36,48,31,0.08)` | Diskret, aldrig hård |

### Naturpalette (rotation gennem sæsonerne)

Disse farver bruges som **accent** i guides — på fact-card-kanter,
botanical bleed-overgange, kategori-eyebrows, sæson-stemninger.
Værdierne er **omtrentlige** — låses endeligt af Anna mod
referencefilerne i `references/guides/farvepalette-*.png`.

| Navn | Cirka værdi | Sæson | Hvor |
|---|---|---|---|
| Støvet salvie | `~#A8B5A0` | Forår | Fact-card-eyebrows |
| Pistacie | `~#C8D4A4` | Forår-sommer | Fresh-spire-tilstande |
| Ler | `~#C9A982` | Sommer | Frø-emballage-look |
| Sienna | `~#A56743` | Sommer-efterår | Tomat-, peberfrugt-accent |
| Tuscan sun | `~#D9A654` | Sommer | Modne-frugter-accent |
| Terracotta | `~#B5604A` | Efterår | "Udløber snart"-tilstande |
| Autumn bronze | `~#8C5A2E` | Efterår | Knold- og rod-accent |
| Dæmpet oliven | `~#7B8A5F` | Hele sæsonen | Standard-plante-accent |
| Coastal blue | `~#7A93A8` | Vinter | Vinter-only accent, sparsom |

**Brug af farve:** Sparsom. Kort har ingen gradient. Hovedfarven er
Cormorant-tekst i `#24301F` på creme — alt andet er ornamentik.
**Aldrig mere end 2 accentfarver på samme guide-opslag.**

---

## 12. Anti-mønstre

Det vi **aktivt undgår** — listen er kort, men hver enkelt vil
trække Potalot ned hvis den sniger sig ind:

| Anti | Hvorfor |
|---|---|
| Lyseblå "Læs mere…"-inline-links | Gør guides til hyperlink-pasta i stedet for opslag |
| Gradienter inde i kort | Bryder den flade naturhåndbog-æstetik |
| Drop shadows + rounded-3xl + glassmorphism | App-grid-konvention, ikke editorial |
| Store CTA-knapper midt i prosaen | Skubber læser fra opslag til "konvertering" |
| Tabs på tværs af guide-detail | Naturhåndbog-opslag scroller, det skifter ikke tabs |
| Sidebar med inhoudsfortegnelse | TLDR-syndromet — guider er korte nok til at læses |
| Auto-playing video-headers | Stop |
| Gennemsigtig "Klar til at dyrke?"-banner i bunden | Marketing-bagrund, ikke natur-bagrund |
| Captions under hver bleed | Bleeden skal stå nøgent — billedets sprog er nok |
| **Hero-billeder på alle guidesider i biblioteket** | **Gør biblioteket til en væg af billeder og ødelægger scanning** |
| Tekst-wrap omkring billeder | Ser elegant ud i tanken, brækker på mobil |
| Nye billedkategorier udenom det eksisterende system | "Editorial Banner v2", "Inline Mood Image" og andre kreative katastrofer |

---

## 13. Implementeringsrækkefølge

Når denne doc er låst:

| Dag | Hvad |
|---|---|
| 1 | Bibliotek-grid akut-fix (**gjort**) |
| 2 | `GuideHero` + Botanical Bleed komponent, integreret i én demo-guide |
| 3 | Hele guide-detail rytme: alle ::: blokke opgraderet til naturhåndbog-look |
| 4 | Detail Bleed komponent + integreret i sortsguider |
| 5 | Bibliotek fase-2-redesign + polering |

---

## Closing rule

> **Hvis en guide kunne være en blogpost fra hvilken som helst gartneriapp,
> så har vi ikke skrevet en Potalot-guide. Vi har skrevet noget andet.**

🌱
