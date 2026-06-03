# Potalot — arter-backlog (grøntsager V1+)

> **Status:** Indholds-roadmap, ikke implementeringsplan.
> Listen definerer hvilke arter, grupper og sorter Potalot skal
> kunne tale om over tid. Den er ikke "skal-skrives", men "skal-kunne-rumme".

---

## Målsætning

```
80-120 grøntsagsarter
1.500-3.000 sorter
```

Det lyder voldsomt. Det er det også — men kun hvis vi prøver at skrive
alt manuelt. Den svære del er **ikke sorterne**. Den svære del er:

- Definere de korrekte **arter**
- Skrive stærke **artsguider**
- Producere **billeder**
- Definere **relationer** mellem dem

Når artsguiden er på plads, kan AI hjælpe med at oprette sorter under den
(se [`AI_GUIDE_FABRIK.md`](./AI_GUIDE_FABRIK.md)).

---

## Niveauernes formål

```
Art         → Biologisk identitet
Gruppe      → Dyrknings-/brugsgruppe (ikke biologi)
Sort        → Konkrete frøsorter
```

**Gruppe er valgfri.** Den eksisterer for navigation, læring og
dyrknings­mæssige forskelle — ikke for taksonomisk renlighed.

| Art med grupper | Art uden grupper |
|---|---|
| Tomat (cherrytomat, pastatomat…) | Hvidløg |
| Bønne (stangbønne, buskbønne…) | Dild |
| Chili (annuum, chinense…) | Pastinak |
| Squash (zucchini, sommersquash…) | Knoldselleri |

Tvang ikke alle arter gennem et gruppe-niveau — det ville give kunstige
mellem­kategorier som *"Hvidløg → Almindelig hvidløg → Germidour"*.
Bureaukratisk struktur uden brugerværdi.

---

## V1+ Backlog

### Tomat
- **Cherrytomat:** Sweetie · Sungold · Black Cherry · Gardener's Delight
- **Salattomat:** Moneymaker · Tigerella
- **Bøftomat:** Marmande
- **Pastatomat:** San Marzano · Roma
- **Specialsort:** Green Zebra

### Agurk
*(ingen gruppe — alle dyrkes i samme grundmønster, drivhus vs friland er
en frysestyret kategori i sortsguiden)*
- Marketmore · Telegraph Improved · Beth Alpha · Passandra · Lemon ·
  Crystal Apple

### Chili
- **Capsicum annuum:** Jalapeño · Cayenne · Anaheim · Serrano · Hungarian Hot Wax
- **Capsicum chinense:** Habanero Orange · Habanero Red · Scotch Bonnet ·
  Carolina Reaper · Trinidad Moruga Scorpion

### Peberfrugt
- California Wonder · Yolo Wonder · King of the North · Red Knight · Sweet Banana

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

🌱
