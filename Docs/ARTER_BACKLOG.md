# Potalot — arter-backlog (V1+)

> **Status:** Indholds-roadmap, ikke implementeringsplan.
> Listen definerer hvilke arter, klasser, grupper og sorter Potalot
> skal kunne tale om over tid. Den er ikke "skal-skrives", men
> "skal-kunne-rumme".

---

## Målsætning

```
Kategori          Arter        Sorter
─────────────────────────────────────────────
Grøntsager        80-120
Frugt & bær       40-60
Krydderurter      30-50
Prydplanter       300-600
Træer & buske     100-200
─────────────────────────────────────────────
I alt            600-1.000     10.000-50.000
```

Det lyder voldsomt. Det er det også — men kun hvis vi prøver at skrive
alt manuelt. Den svære del er **ikke sorterne**. Den svære del er:

- Definere de korrekte **arter**
- Skrive stærke **artsguider**
- Producere **billeder**
- Definere **relationer** mellem dem

Når artsguiden er på plads, kan AI hjælpe med at oprette sorter under den
(se [`AI_GUIDE_FABRIK.md`](./AI_GUIDE_FABRIK.md)).

Det er **arterne, billederne, relationerne og dyrkningsviden** der
bliver Potalots kronjuvel. Sorter er i høj grad data.

---

## Hierarki-modellen

Potalot har flere navigations-/data-niveauer. De spiller forskellige roller:

| Niveau | Formål | Eksempel |
|---|---|---|
| **Kategori** | Top-level navigation | Grøntsager · Frugt · Krydderurter · Prydplanter |
| **Klasse** | Dyrknings-archetype (krydser arter) | Frugttræer · Etårige urter · Prydbuske · Stauder |
| **Art** | Biologisk identitet | Tomat · Æble · Basilikum · Hortensia |
| **Gruppe** *(valgfri)* | Brugsgruppe inden for arten | Cherrytomat · Buskbønne · Capsicum chinense |
| **Sort** | Konkrete frøsorter / kultivarer | San Marzano · Ingrid Marie · Bloodgood |

### Potalot-art vs botanisk art — schema-skelnen

> En Potalot-art er ikke nødvendigvis identisk med en botanisk art.

Eksempler hvor de divergerer:

| Potalot-art | Botanisk art | Deler botanisk art med |
|---|---|---|
| Peberfrugt | Capsicum annuum (Grossum Group) | Chili (delvis) |
| Chili | Capsicum annuum / chinense / baccatum | Peberfrugt (annuum) |
| Broccoli | Brassica oleracea var. italica | Blomkål, Rosenkål, Kål |
| Blomkål | Brassica oleracea var. botrytis | Broccoli, Rosenkål, Kål |
| Rosenkål | Brassica oleracea var. gemmifera | Broccoli, Blomkål, Kål |

Schema-mæssigt håndteres det med to felter — `latinName` (Potalot-artens
formulering, kan inkludere cultivargroup) og `botanicalSpecies` (den
rene botaniske art). Detaljer i [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md).

### Klasse vs Gruppe — vigtig forskel

| | Klasse | Gruppe |
|---|---|---|
| Hvad | Dyrkningsarchetype | Bruger-valg inden for arten |
| Niveau | KRYDSER arter | INDEN FOR én art |
| Eksempel | "Frugttræer" indeholder Æble, Pære, Blomme | "Cherrytomat" indeholder kun tomat-sorter |
| Schema | Sandsynligvis `primaryCategoryId` + `subcategoryId` (eksisterer) | `guideLevel: 'group'` (V1.5) |
| Hvornår defineres | Når arten oprettes | Når dyrknings-virkeligheden viser at brugeren tænker i grupper |

Begge er valgfri. Klasse er valgfri fordi nogle arter ikke har en
naturlig dyrkningsarchetype. Gruppe er valgfri fordi nogle arter
(Hvidløg, Dild, Pastinak) går direkte fra art til sort.

---

## Grøntsager

### Tomat
- **Cherrytomat:** Sweetie · Sungold · Black Cherry · Gardener's Delight
- **Salattomat:** Moneymaker · Tigerella
- **Bøftomat:** Marmande
- **Pastatomat:** San Marzano · Roma
- **Specialsort:** Green Zebra

### Agurk
- Marketmore · Telegraph Improved · Beit Alpha · Passandra · Lemon ·
  Crystal Apple

### Chili
- **Capsicum annuum:** Jalapeño · Cayenne · Anaheim · Serrano · Hungarian Hot Wax
- **Capsicum chinense:** Habanero Orange · Habanero Red · Scotch Bonnet ·
  Carolina Reaper · Trinidad Moruga Scorpion
- **Capsicum baccatum:** Aji Amarillo · Aji Limón · Bishop's Crown
- **Capsicum frutescens:** Tabasco · Thai Bird · Piri Piri
- **Capsicum pubescens:** Rocoto Manzano · Rocoto Locoto

### Peberfrugt
- California Wonder · Yolo Wonder · King of the North · Red Knight · Sweet Banana · Corno di Toro Rosso

### Aubergine
- Black Beauty · Rosa Bianca · Listada de Gandia · Violetta Lunga

### Squash
- Eight Ball · Black Beauty · Zucchini Defender · Gold Rush

### Græskar
- Hokkaido · Butternut · Atlantic Giant · Jack O'Lantern · Musquée de Provence

### Melon
- Charentais · Honeydew · Galia · Cantaloupe

### Vandmelon
- Sugar Baby · Crimson Sweet · Moon and Stars

### Salat
- **Hovedsalat:** Buttercrunch · May Queen
- **Romainesalat:** Little Gem · Valmaine
- **Pluksalat:** Lollo Rosso · Lollo Bionda · Salad Bowl

### Spinat
- Matador · Giant Winter · Bloomsdale

### Grønkål
- Nero di Toscana · Westlandse Winter · Red Russian

### Kål
- **Hvidkål:** Brunswick · Ditmarsker
- **Rødkål:** Ruby Ball
- **Savoykål:** Vertus

### Broccoli
- Calabrese · Marathon · Belstar

### Blomkål
- Snowball · All Year Round · Romanesco

### Rosenkål
- Long Island Improved · Diablo

### Gulerod
- Nantes · Amsterdam Forcing · Autumn King · Purple Haze

### Rødbede
- Detroit Dark Red · Chioggia · Cylindra

### Pastinak
- Hollow Crown · Gladiator

### Knoldselleri
- Monarch · Brilliant

### Løg
- **Kepaløg:** Stuttgarter Riesen · Red Baron · Rijnsburger
- **Forårsløg:** White Lisbon

### Hvidløg
- Germidour · Messidrome · Printanor

### Porre
- Musselburgh · Blaugrüner Winter

### Ærter
- **Almindelig:** Kelvedon Wonder · Alderman · Hurst Greenshaft
- **Sukkerærter:** Oregon Sugar Pod · Delikata

### Bønner
- **Stangbønner:** Cobra · Blauhilde · Neckargold
- **Buskbønner:** Processor · Mascotte

### Majs
- Jordbærmajs · Golden Bantam · Incredible

### Radise
- French Breakfast · Cherry Belle · Saxa

### Asparges
- Gijnlim · Backlim

### Artiskok
- Green Globe · Violet de Provence

### Jordskok
- Fuseau · Waldspindel

### Dild
- Bouquet · Mammoth

---

## Frugt

### Frugttræer

**Æble** *(Malus domestica)* — Ingrid Marie · Filippa · Aroma · Discovery · Elstar · Cox Orange · Belle de Boskoop

**Pære** *(Pyrus communis)* — Conference · Clara Frijs · Gråpære · Herrepære · Comice

**Blomme** *(Prunus domestica)* — Opal · Victoria · Reine Claude · Jubileum

**Kirsebær** *(Prunus avium)* — Stella · Lapins · Sunburst · Van

**Fersken** *(Prunus persica)* — Frost · Red Haven · Avalon Pride

**Abrikos** *(Prunus armeniaca)* — Harcot · Bergeron · Goldrich

**Kvæde** *(Cydonia oblonga)* — Vranja · Leskovac

### Frugtbuske

**Solbær** *(Ribes nigrum)* — Ben Lomond · Titania · Ben Hope

**Ribs** *(Ribes rubrum)* — Rovada · Jonkheer van Tets · Rød Hollandsk

**Stikkelsbær** *(Ribes uva-crispa)* — Invicta · Hinnonmäki Rød · Captivator

**Honningbær** *(Lonicera caerulea)* — Borealis · Honey Bee · Aurora

**Aronia** *(Aronia melanocarpa)* — Viking · Nero

### Bær

**Jordbær** *(Fragaria × ananassa)* — Sonata · Korona · Florence · Elsanta · Malwina

**Hindbær** *(Rubus idaeus)* — Glen Ample · Autumn Bliss · Polka · Tulameen

**Brombær** *(Rubus fruticosus)* — Loch Ness · Triple Crown · Navaho

**Blåbær** *(Vaccinium corymbosum)* — Duke · Bluecrop · Patriot · Chandler

**Tranebær** *(Vaccinium macrocarpon)* — Stevens · Pilgrim

### Vinplanter

**Vindrue** *(Vitis vinifera)* — Solaris · Rondo · Himrod · Muscat Bleu

**Kiwi** *(Actinidia deliciosa)* — Hayward · Jenny

---

## Krydderurter

### Etårige krydderurter

**Basilikum** *(Ocimum basilicum)* — Genovese · Sweet Basil · Dark Opal · Thai Basil

**Dild** *(Anethum graveolens)* — Bouquet · Mammoth

**Koriander** *(Coriandrum sativum)* — Leisure · Santo

**Persille** *(Petroselinum crispum)* — Gigante d'Italia · Moss Curled

### Flerårige krydderurter

**Timian** *(Thymus vulgaris)* — German Winter · Silver Posie · Lemon Thyme

**Oregano** *(Origanum vulgare)* — Greek · Hot & Spicy

**Salvie** *(Salvia officinalis)* — Berggarten · Purpur

**Purløg** *(Allium schoenoprasum)* — Staro · Polyvert

**Mynte** *(Mentha)* — Spearmint · Chocolate Mint · Moroccan Mint · Peppermint

### Buskagtige krydderurter

**Rosmarin** *(Salvia rosmarinus)* — Arp · Blue Winter

**Lavendel** *(Lavandula angustifolia)* — Hidcote · Munstead

---

## Prydplanter

### Prydtræer

**Japansk Ahorn** *(Acer palmatum)* — Bloodgood · Orange Dream · Sango-kaku

**Magnolie** *(Magnolia)* — Susan · Genie · Stellata

**Prydkirsebær** *(Prunus serrulata)* — Kanzan · Amanogawa

**Paradisæble** *(Malus)* — Red Sentinel · Evereste

### Prydbuske

**Hortensia** *(Hydrangea)* — Annabelle · Limelight · Endless Summer

**Syren** *(Syringa vulgaris)* — Charles Joly · Primrose

**Sommerfuglebusk** *(Buddleja davidii)* — Black Knight · White Profusion

**Rhododendron** — Cunningham's White · Nova Zembla

### Stauder

**Solhat** *(Echinacea purpurea)* — Magnus · White Swan

**Sankthansurt** *(Hylotelephium)* — Herbstfreude · Matrona

**Kæmpejernurt** *(Verbena bonariensis)* — Lollipop · Buenos Aires

**Storkenæb** *(Geranium)* — Rozanne · Johnson's Blue

**Lupin** *(Lupinus)* — Gallery Red · Russell Mix

### Etårige blomster

**Morgenfrue** *(Calendula officinalis)* — Orange King · Fiesta Gitana

**Cosmos** *(Cosmos bipinnatus)* — Purity · Sensation Mix

**Zinnia** *(Zinnia elegans)* — Benary's Giant · Queen Lime

**Tagetes** *(Tagetes patula)* — Bonanza · Safari

**Kornblomst** *(Centaurea cyanus)* — Blue Boy · Black Ball

### Løg- og knoldplanter

**Tulipan** *(Tulipa)* — Queen of Night · Angelique · Apeldoorn

**Påskelilje** *(Narcissus)* — Tête-à-Tête · Dutch Master

**Krokus** *(Crocus)* — Jeanne d'Arc · Flower Record

**Dahlia** *(Dahlia)* — Café au Lait · Arabian Night · Bishop of Llandaff

**Gladiolus** — White Prosperity · Priscilla

---

## Hvorfor dette dokument eksisterer

1. **Indholds-roadmap.** Når redaktøren spørger "hvad mangler vi?", er
   svaret her.
2. **AI-katalog.** Når AI-fabrikken skal vide hvilke arter den må
   generere sorter under, læser den herfra.
3. **Frøbank-katalog.** Når en bruger tilføjer en sort der ikke findes,
   tjekker systemet om arten findes — herfra.
4. **Markedssyn.** Når vi spørger "hvilke arter har vi dækket?", er
   svaret målbart mod denne liste.

---

## Hvorfor Klasse-niveauet ikke står som "skal-skrives"

Klasse fungerer som primaryCategoryId + subcategoryId i det
eksisterende schema. Listen ovenfor er **navigations-organisering**,
ikke nye schema-felter.

Når vi opretter en art under Klasse = "Frugttræer", skal artens
`primaryCategoryId` være `'traeer'` og `subcategoryId` være `'frugt'`
(eller lignende). Det er allerede understøttet i schemaet.

## Hvorfor gruppe ikke står som "skal-skrives"

Vi har endnu ikke skrevet en eneste gruppeguide. Vi ved ikke hvordan
den naturligt vil tale eller hvor lang den vil være. `_TEMPLATE-gruppeguide.md`
skrives **først** når 3-5 rigtige gruppeguider er produceret og vi kan
se mønstret i praksis.

Det er en klassisk menneskelig hobby at designe det syvende lag af
stilladset før første mursten er lagt. Vi gør det ikke her.

---

## Krydsreferencer

- [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — definerer Niveau 2/3/4 (Species/Group/Variety)
- [`AI_GUIDE_FABRIK.md`](./AI_GUIDE_FABRIK.md) — beskriver hvordan AI bruger gruppe-laget til at narrow recommendations
- [`REDAKTOER_BESTILLING_GUIDES_V1.md`](./REDAKTOER_BESTILLING_GUIDES_V1.md) — første 10 manuelle guider
- [`TEKNIK_GUIDES_BACKLOG.md`](./TEKNIK_GUIDES_BACKLOG.md) — teknik-laget, paralelt med dette katalog
- [`POTALOT_ROADMAP.md`](./POTALOT_ROADMAP.md) — 8-fase produktroadmap, hvor dette katalog fylder Fase 1 (kerneprodukt)

🌱
