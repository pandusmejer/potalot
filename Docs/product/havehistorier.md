# Havehistorier — det redaktionelle læsestof (kontrakt V1)

> **Status:** Kontrakt + første stilprøve, 30. juli 2026. Ikke live i
> produktflade endnu. Én historie ("Skal alle lupiner dø?") er renset,
> registreret og renderet i den gatede stilprøve `/admin/qa/havehistorier`.
> Integration i `havebog-kurator.ts` er et senere sprint.

## Hvad det er

Et redaktionelt indholdslag **ved siden af** dyrkningsguiderne. Det bor i
Havebogens venteværelse — læsestof for brugeren, der ikke har en opgave, men
gerne vil læse videre, mens haven passer sig selv.

| Lag | Spørgsmål |
|---|---|
| Dyrkningsguide | Hvordan gør jeg? |
| **Havehistorie** | **Hvorfor er det sådan? Er det nu også rigtigt? Hvad foregår der derude?** |

Fælles teknisk betegnelse: **Havehistorie** (`contentType: "gardenStory"`).
Brugeren møder ikke ordet — de møder den konkrete **serie**.

### Hvorfor det passer Havebogen

Det trækker Havebogen mod journal, ikke dashboard. Kortet er en redaktionel
invitation — ingen flueben, ingen statuschip, ingen "gør dette nu". Det
respekterer `havebog.md`: *"Byg en havejournal, ikke et dashboard."* og
lobby-reglen (Havebogen fortæller, rapporterer ikke).

## De seks serier (brugervendte etiketter)

| series (teknisk) | Etiket | Undersøger |
|---|---|---|
| `myten` | Myten | En udbredt påstand eller et haveråd |
| `ven-eller-fjende` | Ven eller fjende? | Et dyr/en svamp/organisme man vil bekæmpe før identifikation |
| `fremmed-i-haven` | Fremmed i haven | Introducerede/invasive arter — skeln fremmed ≠ invasiv |
| `herfra` | Herfra | Hjemmehørende arter, lokale økologiske relationer |
| `det-usynlige` | Det usynlige | Processer i haven man sjældent ser (jordliv, nedbrydning) |
| `haven-diskuterer` | Haven diskuterer | Fagligt/etisk dilemma uden ét korrekt svar |

**V1-anbefaling (skæring):** start med **2-3 serier**, ikke alle seks. Flere
etiketter = mere menu-formering (CLAUDE.md-advarslen). De øvrige serier fødes,
når der er artikler til dem.

## Placering i Havebogen — ANNA-LÅST 30/7 (bygges i senere sprint)

Forsiden har tre lag i denne rækkefølge (jf. `havebog-kurator.ts` + havebog.md):

1. **Fast, personligt lag** — hero · dagtæller · ildsted/dagens historie · tal til din have
2. **Handlingsnære og sæsonaktuelle rum** — Spisekammer, Vendepunkter m.fl.
3. **Roligt, reflekterende bånd** — På denne dag · Minder · **Fra haven**
4. **Historien fortsætter** — bagsiden, afslutter altid siden

**"Fra haven" (Havehistorie-kortet) hører til i lag 3.** Det er redaktionelt
læsestof — ikke en handling, og ikke en del af brugerens personlige havefortælling.
Det skal føles som noget man falder over, når sidens tempo allerede er faldet.
Derfor må det ALDRIG ligge lige under ildstedet (to store historier ville
konkurrere) og ALDRIG blandes tilfældigt ind mellem handlingsrummene i lag 2.

### Kurator-regel for det rolige bånd (låst)

De tre kort i lag 3 kurateres **indbyrdes** — de stables ikke blindt, ellers
betyder "kurateret" reelt "begravet". Regel for "Fra haven":

- Vises **højst én gang** på forsiden.
- Placeres **først i det rolige bånd**, når historien er sæson- eller
  artsrelevant (`seasonMonths` rammer nu / `relatedSpecies` matcher brugerens have).
- Ellers placeres det **efter På denne dag eller Minder**.
- Ligger **altid før "Historien fortsætter"**.
- **Ikke** en fast plads under ildstedet; **ikke** blandet tilfældigt mellem
  handlingsrum.

`harData`-gate (ærligheds-reglen): kortet vises kun, hvis der findes en
publiceret, **review'et** historie der er sæson-/artsrelevant. Ingen relevant
historie → intet kort.

**UX-note:** teknisk kan rummet høre til "Biblioteket"-registret, men i
brugeroplevelsen skal det opleves som et **redaktionelt mellemrum i Havebogen**,
ikke som et link til en indholdsdatabase. Kortet bærer etiketten
`MENS HAVEN PASSER SIG SELV` (`HavehistorieKort`, `medRamme`).

- **Artikel:** `HavehistorieArtikel` — magasin-registret (Cormorant + Manrope),
  ingen hero-foto før historien har sin egen asset (fotoreglen: luft > ligegyldigt
  billede).

Personalisering i V1 holdes **dum**: kun `seasonMonths` + `relatedSpecies`.
Observations-triggede historier (snegleskade → "Skal alle snegle væk?") er en
motor for sig og bygges ikke ind i V1.

### Implementerings-note til wiring-sprintet

Kuratoren i dag ([havebog-kurator.ts](../../src/lib/havebog-kurator.ts)) sorterer
alle roterende rum på ren sæson-vægt og slicer — den har intet begreb om et
"roligt bånd". For at ære reglen ovenfor skal sprintet indføre en lille
bånd-gruppering: `paaDenneDag` · `minder` · `fraHaven` behandles som en intern
undergruppe der ordnes efter reglen (Fra haven først ved relevans, ellers efter),
og `fraHaven` får `RumId` + `tier: 'roterende'` med sæson-vægt **høj om vinteren
og i skuldersæsoner, lav i højsommeren** (læsetid når haven passer sig selv).

## Artikelstruktur (låst rytme)

1. **Hero** — serie · læsetid · titel · manchet
2. **Det korte svar** — 2-4 sætninger; konklusionen kan læses alene
3. **4-6 sektioner** — konkrete overskrifter, ét hovedbudskab hver
4. **Se efter dette i din have** — 0-6 observationer (udelades hvis ikke relevant)
5. **I din have** — praktisk oversættelse; kun handlinger kilderne understøtter
6. **Kilder** — synlige, afdæmpede

## Produktions- og registrerings-workflow

Samme mønster som Havebog-billedkontrakten (*ChatGPT producerer, Claude modtager
+ optimerer + registrerer*):

1. **Produktion (eksternt):** ChatGPT/deep-research skriver én historie som JSON
   efter masterprompten nedenfor, matchende `havehistorier.schema.json`.
2. **Modtag + rens (Claude):** deep-research-output indeholder ofte usynlige
   citat-ankre (`citeturn…`, private-use-tegn). De **skal ud** — kilderne hører
   hjemme i `sourceLinks`. Renseren:
   `node scripts/... ` — brug regexen `\s*cite(?:turn\w+)+` + strip af
   U+E000–U+F8FF / zero-width. (Se scratchpad-scriptet fra 30/7.)
3. **Optimér:** fjern noter-til-redaktøren fra brødteksten (fx afsnit der
   instruerer om billedvalg), trim doble emner i overskrifter.
4. **Registrér:** tilføj til `src/data/havehistorier.ts` (`HAVEHISTORIER`).
   Filen er **eneste sandhed** for hvilke historier der findes — tjek den FØR
   produktion, så samme emne ikke opstår under tre slugs.
5. **Review:** `reviewRequired` bliver `true` indtil et menneske har
   fakta-kontrolleret. Ingen historie går live med `reviewRequired: true`.

### Note fra lupin-stilprøven (fjernet redaktør-instruks)

Deep-research-udkastet sluttede med en note TIL redaktionen om billedvalg (ikke
læser-indhold). Den blev fjernet fra artiklen og bevares her som billed-brief,
når historien skal have fotos:

> 1) hero-foto af mangebladet lupin i vejkant/lysåben natur (skønhed vs.
> spredning); 2) nærfoto af blad med mange småblade + håret frøstand/bælg
> (artsbestemmelse); 3) situationsfoto hvor lupin står på kanten mellem
> have/vej og et sårbart areal (spredningsrisiko konkret). Illustration: blad
> med småbladtal + sideboks om frøstand — ikke endnu et smukt blomsterspir.

Billed-mappe når det bliver aktuelt: `public/images/havehistorier/<slug>/`.

---

## Inventory — eksisterende Havehistorier

> Kilde til sandhed = `src/data/havehistorier.ts`. Denne tabel er den
> menneske-læsbare kopi. Opdatér begge, når en historie tilføjes.

| slug | serie | titel | status |
|---|---|---|---|
| `skal-alle-lupiner-doe` | myten | Skal alle lupiner dø? | reviewRequired (afventer fakta-kontrol) |

**Planlagte (fra Annas første sæson, ikke produceret):** hvad-betyder-hjemmehoerende ·
er-alle-store-brune-snegle-draebersnegle · kaffegrums-goedning-eller-havefolklore ·
skal-nedfaldne-blade-blive-liggende · hvornaar-bliver-en-fremmed-art-invasiv m.fl.

---

## MASTERPROMPT — Havehistorier

> Kopiér alt herunder til producenten (ChatGPT o.l.). Output valideres mod
> `havehistorier.schema.json`.

Du skriver en redaktionel **Havehistorie** til Potalot, en moderne dansk haveapp.
Havehistorier er læsestof til brugerens Havebog og venteværelse. De skal gøre
brugeren klogere på naturen, planterne og de forestillinger, mennesker gentager
om haver.

En Havehistorie er **IKKE**: en artsguide · en sortsguide · en dyrkningsvejledning ·
en trin-for-trin-teknikguide · en nyhedsartikel · et SEO-blogindlæg · en
moraliserende tekst om den rigtige måde at have have på.

En Havehistorie undersøger **ét klart spørgsmål, én myte eller ét dilemma.**

### Formål

Hjælp brugeren med at: forstå en biologisk/økologisk sammenhæng · skelne mellem
forenklede påstande og dokumenteret viden · se noget nyt i sin egen have ·
vurdere om man bør handle, observere eller lade være · føle større nysgerrighed.
Teksten skal kunne læses uden forudgående fagudtryk.

### Vælg præcis én serie

- `myten` — undersøg en udbredt påstand/et haveråd.
- `ven-eller-fjende` — et dyr/svamp/plante/organisme man typisk opfatter som
  skadelig eller nyttig.
- `fremmed-i-haven` — introducerede/invasive arter. Skeln ALTID mellem fremmed
  art · naturaliseret art · invasiv art · en art der blot vokser kraftigt i en
  have. Brug aldrig ordene som synonymer.
- `herfra` — hjemmehørende arter, lokale relationer, dansk natur. Undgå
  ligningen hjemmehørende = altid god / ikke-hjemmehørende = altid dårlig.
- `det-usynlige` — processer man sjældent ser (nedbrydning, bestøvning, jordliv,
  frøhvile, planters reaktioner, svampes samspil med rødder).
- `haven-diskuterer` — et fagligt/etisk dilemma uden ét korrekt svar.

### Research

Prioritér troværdige, aktuelle kilder: 1) danske myndigheder · 2) danske
universiteter/faglige institutioner · 3) officielle artsdatabaser · 4) anerkendte
natur-/havebrugsorganisationer · 5) videnskabelige artikler · 6) udenlandske
myndigheder/universiteter når dansk materiale ikke rækker.

Kontrollér altid: artsnavne · invasive statusser · giftighed · spiselighed ·
sygdomsrisici · juridiske forhold · anbefalinger om bekæmpelse · alt der afhænger
af dansk natur/klima. Brug aldrig én virksomheds salgstekst som eneste kilde.
Opfind ikke fakta, tal, arter eller forskningsresultater. Når fagfolk er uenige,
beskriv uenigheden — vælg ikke et entydigt svar for en pænere afslutning.

### Titel

Spørgsmål eller tydelig påstand · forståelig uden fagviden · nysgerrighed uden
clickbait · præcis nok til at kunne besvares. Gode: "Skal alle lupiner dø?",
"Er alle store brune snegle dræbersnegle?". Undgå: "Den chokerende sandhed
om…", "Ti ting du ikke vidste om…".

### Manchet (summary)

1-2 korte sætninger · præsentér konflikten · antyd hvorfor det enkle svar ikke
rækker · afslør ikke hele artiklen · højst ~320 tegn.

### Det korte svar (shortAnswer)

2-4 sætninger. Læseren skal kunne forstå konklusionen af dette alene. Må begynde
med Ja./Nej./Som regel./Det kommer an på. Forklar straks hvad svaret afhænger af.
Undgå tomme svar ("Det er mere kompliceret end som så") — fortæl hvad der konkret
gør det kompliceret.

### Struktur (sections)

4-6 sektioner. Hver: konkret overskrift · 1-3 korte afsnit · ét hovedbudskab.
Rytme som udgangspunkt: 1) hvor kommer påstanden/problemet fra? 2) hvad ved
fagfolk med rimelig sikkerhed? 3) hvilke forskelle/undtagelser overser folk?
4) hvad kan brugeren observere i egen have? 5) hvad bør brugeren gøre/undlade?
Undgå overskrifter som Introduktion/Baggrund/Konklusion/Fakta.

### Se efter dette (lookFor)

3-6 konkrete observationer, når emnet kan genkendes i haven (bladform, farve,
vækstmåde, gnav-spor, tidspunkt, placering, æg/larver, spredning). Skal hjælpe
brugeren med at observere, ikke diagnosticere usikkert. `[]` hvis emnet ikke kan
observeres meningsfuldt.

### I din have (gardenAdvice)

2-5 sætninger. Fortæl tydeligt om brugeren bør: lade være · holde øje · begrænse
spredning · fjerne noget · identificere arten først · registrere en observation ·
søge faglig hjælp. Kun handlinger kilderne understøtter. Gør ikke enhver artikel
til en opgave — nogle gange er den rigtige handling blot at observere.

### Relaterede guides (relatedGuides)

Link kun til EKSISTERENDE Potalot-guides. Opfind aldrig et link eller en slug.
`[]` hvis ingen passer.

### Tone

Dansk. Rolig · konkret · nysgerrig · fagligt sikker · let udfordrende · venlig
uden at være hyggesyg. Skriv som en erfaren naturformidler der respekterer
læserens intelligens. Korte afsnit, aktivt sprog, mennesker som aktive subjekter.
Undgå: salgssprog · overdreven begejstring · barnlig tone · dommedagsretorik ·
skældud · moralske formaninger · unødvendige fagord · udråbstegn · "moder natur" ·
påstande om at én art er ond/god/nyttig/værdiløs.

### Nuancer (skeln ALTID)

art vs. sort · individ vs. bestand · privat have vs. beskyttet natur · lokal gene
vs. økologisk skade · observeret sammenhæng vs. dokumenteret årsag · mulighed vs.
sandsynlighed. Ikke "Lupiner ødelægger biodiversiteten", men "Mangebladet lupin
kan danne tætte bestande på næringsfattige arealer og fortrænge planter, som
trives dér."

### Længde

Kort 600-900 ord · almindelig 900-1.300 · dybdegående højst 1.700. Læsetid ≈ 220
danske ord/minut.

### Output

Returnér ét JSON-objekt der matcher `havehistorier.schema.json`. Feltregler:
`slug` kebab-case (ae/oe/aa, ingen accenter) · `contentType` altid `"gardenStory"` ·
`series` præcis én af de seks · `seasonMonths` kun måneder med særlig relevans,
`[]` = hele året · `relatedSpecies` kun eksisterende slugs, `[]` ellers · `tags`
3-8 kebab-case · `lookFor` 3-6 eller `[]` · `relatedGuides` kun verificerede
slugs, `[]` ellers · `sourceLinks` mindst to uafhængige faglige kilder (mindst én
primær/officiel ved invasive arter, giftighed, lovgivning, sundhedsrisiko) ·
`reviewRequired` altid `true`.

**Vigtigt:** placér ALLE kilder i `sourceLinks` — sæt ALDRIG citat-markører,
fodnoter eller referencer inde i brødteksten.

### Slutkontrol

Besvarer artiklen spørgsmålet? · Kan konklusionen forstås gennem "Det korte svar"
alene? · Er der skelnet mellem relevante arter/situationer? · Skrevet ud fra
kilder frem for havefolklore? · Tilpasset danske forhold? · Undgået at gøre en
organisme til helt/skurk? · Kan brugeren observere noget konkret bagefter? · Kun
handlinger kilderne understøtter? · Peger alle guide-slugs på eksisterende
guides? · Matcher JSON-strukturen præcist, uden citat-markører i teksten?
