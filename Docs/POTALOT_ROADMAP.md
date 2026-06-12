# Potalot — langsigtet roadmap

> **Status:** Strategisk roadmap, ikke implementeringsplan.
> Otte faser fra kerneprodukt til økosystem. Bevidst skrevet for
> at blive konsulteret hver gang Potalot er klar til at vokse i
> et nyt lag — ikke for at blive bygget på sekventielt.

---

## Hvor Potalot er nu

> Potalot er ved at bevæge sig fra **"app med funktioner"** til
> **"økosystem"**. Det betyder, at der opstår en hel række lag,
> som ikke er kernefunktioner, men som afgør, om folk bliver
> hængende år efter år.

Det er disse lag denne doc skal navngive — så vi ikke glemmer
hvilke "dørhåndtag mellem rummene" der mangler at blive smedet.

---

## De otte faser

```
1. Kerneprodukt           ~80% på plads
2. Socialt lag            ⏳ ikke startet
3. Motivation/progression ⏳ ikke startet
4. Personlig identitet    ⏳ ikke startet
5. Årsrapporter           ⏳ ikke startet (sandsynligvis viralt)
6. Kreativt lag           ⏳ ikke startet
7. Brand-system           ⚠️ kritisk mangel
8. Kommunikationssystem   ⏳ ikke startet
```

---

## Fase 1 — Kerneprodukt

**Status:** ~80% på plads.

| Modul | Status |
|---|---|
| Frøbank | ✅ V1 |
| Planter | ✅ V1 |
| Kalender | ✅ V1 |
| Havebog | ✅ V1 |
| Artsguider | 🟡 4 skrevet, importpipeline ikke bygget endnu |
| Sortsguider | 🟡 2 skrevet, importpipeline ikke bygget endnu |
| Månedssider | ✅ V1 |
| Dashboard | ✅ V1 |

### Åbne hovedområder INDEN for kerneprodukt

| Område | Hvad mangler |
|---|---|
| **Notifikationer** | Visuelt design, ikonografi, prioritering, timing, batch-logik. In-app, push og e-mail. |
| **Artslister (Species)** | Listevisning, filtrering, søgning, hero-layout, taxonomi, relation til dyrkningsguider |
| **Sortslister (Cultivars)** | Kortdesign, listevisning, filtrering, sortering, relation til artssiden |
| **Global søgning** | Én søgning skal finde arter, sorter, frøkort, planter, guider, gøremål, community, ideboards |
| **Dyrkningsguide-arkitektur** | Navigation, indholdsstruktur, progression, quizzer, relaterede arter/sorter |
| **Empty states** | Ingen planter / ingen frø / ingen grupper / ingen aktiviteter / ingen ideboards — typisk det første nye brugere ser |

### Eksempler på notifikationer (alle mangler design)

```
"Tid til at prikle dine tomater"
"Frost om 2 dage"
"5 medlemmer i Chili-entusiaster har kommenteret"
"Dine Dahlia Café au Lait er klar til optagning"
```

### Eksempler på artslister-indhold

```
Tomat · Agurk · Chili · Ært · Dahlia · …
```

### Eksempler på sortslister-indhold

```
San Marzano · Marketmore · Cobra · Habanero Orange · Café au Lait · …
```

---

## Fase 2 — Socialt lag

| Modul |
|---|
| Community |
| Grupper |
| Kommentarer |
| Følg brugere |
| Community-notifikationer (separat kategori — se nedenfor) |
| Profiler |
| Profilfotos / avatarer |
| Deling af havebøger |
| Deling af ideboards |

### Community-notifikationer — særskilt designbeslutning

```
Svar på kommentar · Nyt opslag i gruppe · Nævnt med @navn ·
Reaktioner · Nye medlemmer
```

Disse skal designes adskilt fra plante-notifikationer fordi:
1. Frekvensen er anderledes (kan komme flere pr. dag)
2. Det er sociale signaler, ikke handlingsanvisninger
3. Brugere skal kunne mute uden at miste have-påmindelser

---

## Fase 3 — Motivation og progression

| Modul | Eksempler |
|---|---|
| Challenges | "Sø 5 frø i marts" |
| Badges | "Første frøhøst", "100 sorter dyrket", "5 års medlemskab" |
| Achievements | (én-gangs-events) |
| Streaks | Sammenhængende dyrkningssæsoner |
| Samlinger | "Alle italienske pasta-tomater" |
| Sæsonudfordringer | Tilbagevendende efter sæson |

---

## Fase 4 — Personlig identitet

Brugerprofil med visse fælder: profilen må ikke bare være data — den
skal være **dyrkningsfilosofi**.

| Modul |
|---|
| Profilheader |
| Profilstatistik |
| Have-type (drivhus / friland / altan / krukker) |
| Klimazone |
| Dyrkningsfilosofi (kortfri-tekst eller curated kategorier) |
| Offentlige samlinger |
| Favoritsorter |
| Profilikoner / avatarer |

---

## Fase 5 — Årsrapporter (Spotify Wrapped for havefolk)

> **Sandsynligvis større end folk tror.** Der ligger potentielt
> enorm viralitet her.

Eksempler på indhold:

```
47 sorter dyrket
328 frø sået
112 kg høstet
Mest succesfulde sort
Mest udfordrende sort
Første såning af året (dato + plante)
Sidste høst af året
Årets plante
```

### Hvorfor det er undervurderet

- **Viralitet:** Spotify Wrapped genererer titusinder af delinger pr. år. Have-folk har endnu større fortælle-trang om årets sæson.
- **Identitet:** Rapporten samler hele årets indsats i ét billede brugeren kan se sig selv i.
- **Retention:** Brugere der ser deres egen 5-årsrapport, glemmer ikke at bruge Potalot næste år.
- **Datafundament:** Den kræver det vi i forvejen logger (såninger, høster, plante-states). Ingen nye datalag.

### Mulig udvidelse

```
5-års-jubilæum:
"Du har sået 1.247 frø, høstet 287 kg, dyrket 84 sorter
og lagt din Potalot-app åben 1.823 gange. Hav en god vinter."
```

---

## Fase 6 — Kreativt lag

Pinterest møder haveplanlægning.

| Modul |
|---|
| Ideboards |
| Skabeloner |
| Delbare ideboards |
| "Kopiér dette højbed" |
| "Kopiér denne køkkenhave" |
| "Kopiér denne cottage garden" |

Forbinder sig naturligt til Fase 2 (deling) og Fase 4 (identitet).

---

## Fase 7 — Brand-system (kritisk mangel)

> **Overraskende meget mangler.** Det er det område der bliver
> betydeligst når Potalot indeholder tusindvis af planter,
> historikker, frøbanker og årsrapporter. Mennesker er villige
> til at knytte følelser til en lille firkant på 1024×1024 pixels.
> Det er sandsynligvis derfor de også giver navne til deres
> robotstøvsugere.

| Element | Status |
|---|---|
| Logo | ⚠️ Eksisterer som tekstmark, mangler symbol-mark |
| Tagline | ⚠️ Mangler |
| App-ikon | ❌ Mangler — vigtigere end mange tror |
| Favicons | ❌ Mangler |
| Loading states | ❌ Mangler design |
| Illustrationstil | 🟡 Cormorant + Manrope + flat creme er etableret som typografisk DNA; visuel illustration mangler |
| Ikonsystem | 🟡 Bruger Lucide for tilfældigt valgte ikoner; mangler kuratorisk linje |
| Tomme tilstande | ⏳ Se Fase 1 / Empty states |
| Maskot (måske) | ❓ Ikke besluttet |
| Mikroanimationer | ❌ Mangler |

### App-ikonet specifikt

Det ikon kommer til at repræsentere **flere års haveliv** for brugere
der har dyrket gennem 3-5 sæsoner. Det er et stort ansvar for noget
der ofte designes i hast som det sidste.

**Min anbefaling:** Lav app-ikonet **tidligt** i Fase 7, men forvent
flere iterationer hen ad vejen. Det skal modne i takt med produktet.

---

## Fase 8 — Kommunikationssystem

Det operative lag der binder hele kontaktfladen sammen.

| Type |
|---|
| Push-notifikationer |
| E-mails |
| In-app beskeder |
| Velkomstforløb (onboarding) |
| Genaktivering (efter længere fravær) |
| Sæsonkampagner |
| Community highlights |

Bemærk: dette overlapper med "Notifikationer" i Fase 1, men er
**organisatorisk forskelligt**. Fase 1 = enkelte typer designet
visuelt. Fase 8 = hele systemets stemme og kadence.

---

## De mest undervurderede områder

I prioritetsrækkefølge:

1. **Årsrapporter** — viralitet + retention + identitet på ét sted
2. **Brugerprofiler** — gør Potalot personligt frem for funktionelt
3. **Challenges** — driver kontinuerlig brug uden at føles tvungen
4. **App-ikonet** — repræsenterer flere års haveliv
5. **Notifikationssystem** — den eneste ting der gør at brugeren åbner appen

Disse områder **hjælper ikke brugeren med at så en tomat i morgen**.
Men de hjælper med at brugeren stadig bruger Potalot om **tre år**.

---

## Anbefalet næste-spor (efter V1 launch)

Hvis du skulle pege på næste designspor efter de fire skrevne guides
+ import-script er på plads:

| # | Område | Hvorfor |
|---|---|---|
| 1 | Notifikationer (Fase 1) | Eneste mekanisme der genaktiverer brugere |
| 2 | Artsliste (Fase 1) | Naturlig indgang til guide-systemet |
| 3 | Sortsliste (Fase 1) | Samme |
| 4 | Global søgning (Fase 1) | Den mest undervurderede feature |
| 5 | Dyrkningsguide-arkitektur (Fase 1) | Allerede påbegyndt — se `GUIDES_ARCHITECTURE.md` |
| 6 | Community-notifikationer (Fase 2) | Adskilt fra plante-notifikationer |
| 7 | Havebog-feed (Fase 1) | Aktivitetsfeedet er ikke færdigdesignet |
| 8 | Empty states (Fase 1) | Det første nye brugere ser |

Det er **dørhåndtagene mellem rummene**. Når disse er på plads,
begynder Potalot at føles som et komplet digitalt haveredskab
frem for en samling meget flotte enkeltfunktioner.

---

## Krydsreferencer til eksisterende docs

| Doc | Hvilken fase berører den |
|---|---|
| [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) | Fase 1 — Dyrkningsguide-arkitektur |
| [`GUIDE_BLOKKE.md`](./GUIDE_BLOKKE.md) | Fase 1 — Guide-DSL |
| [`AI_GUIDE_FABRIK.md`](./AI_GUIDE_FABRIK.md) | Fase 1 — Sortsguider (autogenereret når 30-50 species er skrevet) |
| [`TEKNIK_GUIDES_BACKLOG.md`](./TEKNIK_GUIDES_BACKLOG.md) | Fase 1 — Tekniklaget i guide-systemet |
| [`BILLEDER.md`](./BILLEDER.md) | Fase 7 — Brand-system (`ui/`-folder) + Fase 1 (alle billed-typer) |
| [`REDAKTOER_BESTILLING_GUIDES_V1.md`](./REDAKTOER_BESTILLING_GUIDES_V1.md) | Fase 1 — Guide-indhold |

---

## To sætninger der er værd at huske

> ## "Mennesker er imponerende gode til at bygge smukke rum og derefter glemme dørhåndtagene mellem dem."

> ## "App-ikonet kommer til at repræsentere tusindvis af timers arbejde og flere års haveliv. Det er et ret stort ansvar for en lille firkant på 1024×1024 pixels."

🌱
