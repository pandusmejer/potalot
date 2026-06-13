# Havebog — Design-manifest (V3, 11. juni 2026)

> ## Status
>
> **Dette er Havebogens permanente design-filosofi, ikke en UI-spec.**
>
> Hvor `guides.md` definerer hvordan en sortsguide er bygget op, og
> `potalot.md` definerer hvordan de fem primær-sektioner forholder
> sig til hinanden, definerer dette dokument **DNA'et for Havebogen
> alene**.
>
> Når en designbeslutning på Havebogen føles forkert, skal vi vende
> tilbage til dette dokument før vi rører kode.
>
> **V2 (11. juni 2026) tilføjer bog-modellen** — svaret på "hvad er
> Havebogen egentlig", fundet efter ugers iteration. Hvis V2 er i
> konflikt med et princip længere nede, vinder V2.

---

## Bogen — den mentale model (V2-låst)

Den gamle Havebog prøvede at være dashboard, statusside,
introduktion, dagbog, kalender-light og statistik på én gang.
Svaret:

> **Havebogen er ikke stedet, hvor jeg finder ud af hvad jeg skal
> gøre. Havebogen er stedet, hvor jeg forstår min rejse.**

De tre sektionsspørgsmål side om side:

| Sektion | Spørgsmål |
|---|---|
| Planter | Hvordan har mine planter det? |
| Kalender | Hvad skal jeg gøre? |
| **Havebog** | **Hvad er historien om min have?** |

Byggeordren er ikke "byg flere kort". Den er: **byg en bog.**

### Lobby-reglen

Havebogen må ikke være et lobbyområde for de andre sektioner.
"8 aktive sorter", "1 klar til udplantning" og "14°" er alle
informationer der allerede har et hjem (Planter, Planter, Kalender).
Hvis et stykke information vises i tal-form på Havebogen, er det
sandsynligvis det forkerte sted eller den forkerte form.

Havebogen **fortæller** — den **rapporterer ikke**:

| Rapport (forbudt her) | Fortælling (Havebogens stemme) |
|---|---|
| 14° | Jorden er nu varm nok til tomater og chili. |
| 1 klar til udplantning | Dine første planter er klar til at komme udenfor. |
| 8 aktive sorter | (hører slet ikke hjemme her — det er Planter) |

### V7: Stop med at designe sektioner — design en bog (låst)

Den dybeste regel i hele manifestet:

> **Havebogen er den eneste side i Potalot der ikke forsøger at
> hjælpe brugeren med at gøre noget.**
>
> Planter hjælper. Kalender hjælper. Frøbank organiserer.
> **Havebogen fortolker.**
>
> Hvis et element føles som Planter, Kalender eller Frøbank:
> fjern det.

#### Kapitel-tempo-reglen

Havebogen består ikke af sektioner — den består af kapitler. Hvert
kapitel har sit eget tempo, sin egen komposition og sin egen rytme:

| Kapitel | Komposition | Indhold |
|---|---|---|
| 1 — I dag i haven | Tekst venstre, STOR typografi, meget luft | ÉN indsigt — helst en OPDAGELSE (V8). |
| 2 — På denne dag | Foto dominerer | ÉT billede. Én historie. Ikke galleri. |
| 3 — Sæsonens vendepunkter | Centreret, vertikal, nyeste vendepunkt størst | Vigtigste kapitel. Begivenheder, ikke måneder (V8). |
| 4 — Minder | Asymmetrisk højre | Kuraterede højdepunkter — kun de bedste. |
| 5 — Historien fortsætter | Bred, rolig | Fremtid, arkiv, refleksion. Ingen CTA. |

Tre visuelle dødssynder rytmen modvirker: alt i venstre kolonne,
alt med samme vægt, alt der konkurrerer om opmærksomheden. Kun én
ting må være vigtig ad gangen — og meget store luftområder er
tilladt og ønskede.

#### Fotoreglen

Billeder må KUN bruges hvis de understøtter fortællingen — aldrig
fordi der "mangler noget visuelt". Findes der ikke et meningsfuldt
billede: brug tekst. **Luft er bedre end ligegyldige billeder.**

#### FORBUD (kitsch-listen)

Ingen: polaroider · tape · scrapbog · 90'er-collage · papirklip ·
Pinterest-æstetik · "memory board".

Potalot er ikke en hobbyblog. Det er et digitalt haveredskab.

Visuel reference: **moderne magasin + naturbog + Apple editorial +
Kinfolk.** Ikke Pinterest + bullet journal + scrapbook.

(Dette forbud annullerer V3.x-æstetikken med polaroider, tape og
papirrammer — den var et forsøg værd, men endte som kitsch.)

#### Følelses-testen

Når man scroller gennem Havebogen skal følelsen være: *"Jeg læser
historien om min have"* — ikke *"jeg gennemgår data om mine
planter".*

### V8: Forfatteren, ikke sekretæren (låst, 12. juni 2026)

Det dybeste problem efter V7: Havebogen føltes stadig som noget
der var blevet **genereret** — ikke som noget der var blevet
**opdaget**.

> "Du såede årets første tomater" er korrekt. Men det er ikke
> interessant. Det svarer til en bank der skriver: "Du brugte
> penge på dagligvarer." Ja. Tak. Det var mig selv der gjorde det.

#### Opdagelses-reglen

Det stærke øjeblik opstår når systemet opdager noget, brugeren
ikke selv havde set:

- *"Chilierne spirede på 12 dage — sidste år tog det 18."*
- *"Tomat San Marzano spirede på 9 dage — guiden regner med 10-21."*
- *"Ingen af dine salater gik i stok i år."*

En loglinje omskrevet til en hel sætning er en kvittering.
En måling holdt op mod noget — sidste år, guiden, de andre bede —
er en fortælling. **Havebogen er en forfatter, ikke en sekretær.**

Ærligheds-reglen gælder stadig: opdagelser skal være målt i
brugerens egne data eller guidernes faktiske intervaller — aldrig
opfundne sammenligninger. Ingen markant afvigelse → stilhed, og
Kapitel 1 falder tilbage på status-linjerne.

#### Vendepunkts-reglen (Kapitel 3)

Mennesker husker ikke deres have som *marts, april, maj*. De husker
*første tomat, første blomst, ugen det regnede*. Historier
organiseres omkring **begivenheder, ikke måneder**:

```
SÆSONEN BEGYNDTE          (ikke: MARTS)
Tomaterne blev sået 18. marts.

FØRSTE HØST               (ikke: MAJ)
Salat Crispy Mint blev høstet 18. maj.
```

Samme data. Helt anden fortælling. Og blokkene må ikke have ens
vægt — det nyeste vendepunkt er størst og mørkest (det er dér
sæsonen ER); de tidligere træder tilbage, som minder falmer.

#### Dag 98-reglen

> Design ikke Havebogen til den perfekte bruger med tre sæsoner
> bag sig. Design den til brugeren på dag 98.

Det er dér næsten alle nye brugere møder produktet. Magasiner kan
tillade sig store tomme flader fordi de har stærke billeder og
mange sider — tre korte linjer alene i et hav af beige kan ikke.

#### Luft-balancen

V7-luften sad det forkerte sted: for meget luft MELLEM kapitlerne,
for lidt INDE i dem. Resultatet var paradoksalt — siden føltes
både tung og tom. Reglen: kapitel-afstand moderat, indre luft
generøs. Indholdet skal eje sin flade, ikke svømme i den.

### V9: Havens stue (låst, 12. juni 2026 — Annas "V8"-prompt nr. 2)

Havebogens egentlige rolle:

> Hvis Planter er værkstedet, Kalender er arbejdsplanen, Frøbank
> er lageret og Guides er biblioteket — så er **Havebogen stuen**.
> Det sted brugeren opholder sig, når de ikke er ude i haven.

Når man åbner Havebogen skal følelsen være *"Jeg er tilbage i min
have"* — ikke *"Jeg er tilbage i min app"*. Havebogen er den eneste
side i Potalot hvor **værdi > funktion, stemning > effektivitet,
nysgerrighed > produktivitet**.

#### Vintertesten (den vigtigste test)

> Ville jeg åbne Havebogen i januar?

Ikke juli. Ikke august. Januar. Havebogen skal holde havedrømmen
levende mellem sæsonerne — i regnvejr, på arbejde, i sofaen og på
de mørke februardage hvor intet spirer endnu. Nej → byg videre.

#### Hero = den daglige åbning (implementeret)

Heroen er ikke en overskrift; den er brugerens daglige velkomst.
Tre lag i fast hierarki: **personlig hilsen → dagtæller → dagens
indsigt** (fotoet er sæson-stemningen bagved).

- Hilsnen bruger fornavn, skifter med tid på dagen + årstid + dag,
  og må ALDRIG føles som en chatbot ("Hvordan har du det i dag?" /
  "Klar til at dyrke?" er forbudt). Den må ikke stå statisk i ugevis.
- Dagtælleren er TAKTIL — gammeldags flip-counter der klikker på
  plads (400-800 ms), ikke digital KPI. Den minder om sæsonens
  rytme, fremdrift, ventetid og forventning. Følelsen: "tiden går"
  — ikke "her er en statistik".

#### Dagens indsigt — fire niveauer (Kapitel 1: "I dag i haven")

Ikke "Vidste du at...", ikke "Fun fact", ikke "Tip" — det er
internet anno 2012. Indsigterne udvikler sig med brugerens data:

| Niveau | Kilde | Eksempel |
|---|---|---|
| 0 | Generel havevisdom | Trivsels-/sæsonindsigt |
| 1 | Frøbanken | "Du har ingen rodfrugter i din frøbank." |
| 2 | Aktive planter | Sortskombinationer, spiretid mod guiden |
| 3 | Historik | "Spirede på 12 dage — sidste år tog det 18." |

(Niveau 2-3 = V8's opdagelses-motor. Niveau 1 kræver frøbank-
kategorier i havebog-actionen — næste sprint.)

#### Kommende rum i stuen (principper låst, bygges som egne sprints)

- **Tal til din have** — den PRIMÆRE registreringsoplevelse, ikke
  en note-funktion. Tal i 15 sekunder ("Tomaterne ser triste ud
  efter regnen"), Potalot finder selv opgaver/noter/minder/læring.
  Frisk luft før skærmtid.
- **Dyrkerniveau** — spejdermærker/håndværkergrader, ikke
  gamification: Spirer → Dyrker → Selvforsyner → Haveentusiast →
  Havekender. Fortjent, ikke optjent. Ingen XP, points, achievements.
- **Bedrifter** — kapitler i brugerens historie, ikke badges:
  "Første tomat høstet", "Første succes med hvidløg", "100 planter
  dyrket".
- **Inspirér mig** — én magisk knap, ÉT forslag ad gangen. Ingen
  feed, ingen endeløs scroll, ingen Pinterest. Anbefal muligheder,
  ikke produkter.
- **Fra have til køkken** — spisekammeret bor i Havebogen, ikke som
  separat univers: "Du har 4 høstklare auberginer → moussaka, baba
  ganoush."

#### Dyrkeren er hovedpersonen

Havebogen handler om dyrkeren, ikke planterne. Spørgsmålet er ikke
"Hvordan går det planterne?" (det besvarer Planter) men **"Hvilken
slags dyrker er jeg ved at blive?"**

#### Slutmålet

Brugeren åbner Havebogen med følelsen *"Jeg skal lige se hvordan
det går"* — ikke fordi noget kræver handling, men fordi Havebogen
er det digitale sted hvor forholdet til haven bor. Lykkes det, er
Havebogen ikke et menupunkt. Den er hjertet i hele Potalot.

### V10: To lag — fast og levende (låst, 12. juni 2026)

Status efter V9 (Annas vurdering: 4/10 → 7,5/10): identiteten er
der, men siden mangler OVERRASKELSE. "Hvis jeg åbner siden fem dage
i træk, hvad har ændret sig?" Et smukt museum er stadig et museum.
Samtidig truer en ny risiko: med fem kommende features kan Havebogen
ende som "siden der gør alt" — og så er vi tilbage ved dashboardet.

Svaret er to lag:

#### Det faste lag (Havebogens forside — vises hver gang)

1. Hero: personlig hilsen + dagtæller + sæsonfoto
2. Dagens indsigt ("I dag i haven")

ALT i det faste lag skal kunne skifte dagligt. Hilsnen roterer
gennem tidsforankrede linjer ("Juni er næsten halvvejs gennem
haven", "Der er 81 dage til den første efterårsmåned") + årstids-
stemninger. Indsigten roterer gennem sin pulje. Tælleren tæller.
Én daglig overraskelse er minimum — det er grunden til at åbne
siden igen i morgen.

#### Det levende lag (kurateret — kun 1-2 moduler ad gangen)

Skifter med sæsonen (`src/lib/levende-lag.ts`):

| Sæson | Moduler | Følelse |
|---|---|---|
| Vinter | På denne dag · Minder | At huske |
| Forår | Vendepunkter · På denne dag | At komme i gang |
| Sommer | Vendepunkter · Minder | Sæsonen lever |
| Efterår | Minder · Vendepunkter | At samle op |

Kommende moduler (Tal til din have, Inspirér mig, Bedrifter, Fra
have til køkken, Dyrkerniveau) registreres i SAMME kuratering —
de får ikke egne faste pladser. Magasiner viser ikke alle
rubrikker på alle sider. De kuraterer.

#### Bagsiden (altid)

"Historien fortsætter" lukker bogen hver gang — en bog har altid
sin bagside. Rolig, ingen CTA.

#### Tal til din have = Havebogens hoved-CTA (besluttet, ubygget)

Ikke en knap. Ikke gemt væk. Ikke i en menu. Placeres som bogens
ene aktive handling efter dagens indsigt. Brugeren står i
drivhuset, trykker, siger "De første agurker er kommet" — færdig.
Ingen formular, ingen felter, ingen "vælg plante". Det er den
funktion der SKABER de data (minder, vendepunkter, erfaringer)
som resten af Havebogen lever af — registrering der ikke føles
som registrering.

Byggeprioritering (Annas rækkefølge): 1. Tal til din have →
2. Inspirér mig → 3. Bedrifter → 4. Fra have til køkken →
5. Dyrkerniveau. De fire sidste bliver stærkere af data; den
første skaber dataene.

### V11: Oplevelsesarkitektur — objekter, ikke kun tekst (låst, 13. juni 2026)

Annas skarpeste skelnen: informationsarkitekturen er løst, men
**oplevelsesarkitekturen** mangler. Siden består af hero → tekst →
foto → tekst → liste — en rapport forklædt som en bog. Mennesker
kan scrolle gennem enorme mængder tekst uden at huske ét ord.

> Hvis Havebogen er Potalots stue, vinterhave, venteværelse og
> digitale kolonihave, skal den indeholde **objekter man kan
> opholde sig ved** — ikke kun læse.

Referencen skærpes: ikke Medium-artikel, men **dagbog + drivhus +
museum + almanak + frøkatalog + gammelt skrivebord.** Siden skal
være møbleret med instrumenter, samlinger, artefakter og værktøjer
— ting man vender tilbage til, ikke afsnit man scroller forbi.

Hvert objekt skal kunne svare ja til: *"Er det noget man opholder
sig VED, eller bare læser?"*

#### De seks objekter (Annas katalog)

| Objekt | Form | Lag | Status |
|---|---|---|---|
| Dagens indsigt | Havejournal-side / dokument, ikke card | Fast | Tekst findes (V10.1); objekt-form afventer |
| Dyrkerniveau | Vækst-ring eller træ, ikke badge-wall | Levende | Backlog |
| Tal til din have | Stor varm mikrofon — Havebogens pejs | Fast CTA | Backlog (prioritet 1) |
| Inspirér mig | Kort der trækkes op, som tarot/frøkatalog | Levende | Backlog (prioritet 2) |
| Spisekammer | Høst → mad → opskrifter, BOR i Havebogen | Levende | Backlog (prioritet 3) |
| Bedrifter | Indgraverede botanik-mærker, ikke Xbox-badges | Levende | Backlog |

Byggerækkefølge efter heroen (Annas prioritet): **1. Tal til din
have** (ankerpunktet) → **2. Inspirér mig** (daglig variation) →
**3. Spisekammer** (forbinder dyrkning med det virkelige liv).
Når de tre findes, bliver Havebogen et sted man besøger.

#### Materiale-reglen vs. kitsch-forbuddet — AFVENTER ANNAS BESLUTNING

V7-forbuddet bandlyser "papirklip" og "papirrammer". Annas V11-
objekter beder om "cremefarvet papir, afrivningskant, skygge" og
"medaljer i en botanisk bog". Disse to skal forenes med en klar
grænse, FØR objekterne bygges. Foreslået grænse (ikke låst endnu):

- **Tilladt:** ÉT roligt, præcist artefakt i naturbog/almanak-
  registret — én journal-side, ét presset botanik-mærke, ét
  katalog-kort. Materialet tjener fortællingen.
- **Stadig forbudt:** collage, tape, rotation, overlappende
  papirstumper, "memory board", Pinterest. Det er mængden og
  uordenen der bliver kitsch — ikke papiret selv.

Indtil Anna bekræfter grænsen, bygges objekterne IKKE med
papir-tekstur/afrivningskant.

### V12: Motorer bagved, liv på fladen (låst, 13. juni 2026)

Annas korrektion af V11: jeg tænkte stadig i FEATURES (vise
"Inspirér mig", "Tal til din have" som knapper). Men det er
produkt-interne beslutninger — dyrkeren er ligeglad. Dyrkeren
åbner ikke appen for en feature; de åbner den for en **følelse**:

> "Der er altid noget nyt i min have, selv når jeg ikke er ude
> i den."

Det er Havebogens egentlige produkt. Resten er værktøjer til at
levere den følelse.

#### Reglen: features bliver usynlige motorer

Funktionerne forsvinder ned bagved. På fladen står kun liv —
editorial sætninger om brugerens egen have, i "I dag i haven"-
stemmen. Samme motor, mindre feature, mere oplevelse:

| Feature (forbudt på fladen) | Liv (det dyrkeren ser) |
|---|---|
| "Inspirér mig ✨" | "Du dyrker Corno di Toro Rosso. Mange kombinerer den med basilikum og aubergine." |
| "Tal til din have" | 🎙️ "Fortæl hvad du lavede i haven i dag…" |
| "Du har låst 7 af 38 skills op" | "Næste skridt som dyrker: lav din første kompost. Du har allerede styr på tomater og chili." |

Sidste linje er reglen i en nøddeskal: **samme data, mindre
system, mere menneske.** Et SaaS-dashboard ("7 af 38") er forbudt;
en menneskelig næste-skridt-sætning er målet.

#### Revideret byggerækkefølge (Annas, erstatter V11's)

1. **Dagens indsigt bliver virkelig god** — fladens vigtigste stemme.
2. **Inspirér mig som MOTOR** — kombinations-/forslagssætninger om
   brugerens egne sorter, vævet ind i Dagens indsigt. Ingen knap.
3. **Dyrkerkompetencer som MOTOR** — "næste skridt som dyrker",
   aldrig "X af Y skills".
4. **Tal til din have som stor feature** — til SIDST. En mikrofon
   oven på en tom side redder ikke oplevelsen; den bliver prikken
   over i'et, når siden allerede har noget at sige hver dag.

Begrundelsen: Inspirér mig + kompetence-motoren giver Havebogen
*flere ting at sige hver dag* med det samme. Tal til din have er
fantastisk, men placeret på tomhed sidder den bare på tomhed.

#### Ærligheds-reglen gælder motorerne

Motor-sætninger må kun bygge på data vi har (frøbank, planter,
guide-katalog) og almen, sand hortikultur. Ingen fabrikerede tal.
Og: ingen døde links — en "Se middelhavshaven →" tilføjes KUN når
destinationen findes. Indtil da står sætningen alene.

### V13: Premium magasin — masterbriefen (låst, 13. juni 2026)

Annas konsoliderede produktmanifest. Dette er den ØVERSTE vision;
alt andet i dette dokument tjener den.

> **Havebogen er et premium digitalt magasin om brugerens egen have.**

Referencer: Martha Stewart Living · Kinfolk · Magnolia Journal ·
Apple Photos Memories · Apple Journal · Apple News+ feature stories.
Følelsen — og det egentlige produkt — er: *"Der er altid noget nyt
i min have, selv når jeg ikke er ude i den."* Ikke registrering,
ikke data, ikke funktioner. Følelsen.

Havebogen er havens dagligstue: om sommeren besøger man haven, om
vinteren besøger man Havebogen. Stedet hvor man kan være i haven
uden fysisk at være der.

#### Designfilosofi (gælder ALLE moduler, nu og fremover)

- **Dobbelt så meget luft** som før. Hellere for meget end for lidt.
- **Kæmpe typografi.** Tekst er ikke information — tekst er design.
  Store overskrifter, store tanker, store indsigter.
- **Én ting ad gangen.** Ingen sektion siger tre ting. Hero = kun
  hilsen. Næste opslag = kun dagtæller. Næste = kun dagens indsigt.
  Næste = kun ét minde. Magasinlogik, ikke dashboardlogik.
- **Færre elementer.** Færre kort, færre widgets, færre bokse.
  Mere redaktionel rytme.
- **Lysere.** Mindre mørke flader, mindre dramatik. Premium magasin,
  nordisk luksus.

#### Den vigtigste regel (når i tvivl)

> Fjern en feature. Tilføj mere luft. Gør typografien større. Lad
> Havebogen fortælle ÉN ting ad gangen.

Havebogen skal føles som et sted man har lyst til at blive i ti
minutter — ikke et sted man besøger for at udfylde noget.

#### Hero + dagtæller (implementeret V13)

- Hero er ikke en titel; det er dagens åbning. KUN hilsnen, kæmpe
  (navnet på egen linje), sæson-stemningen som undertekst. Lysere
  fotobehandling. Føles som åbningssiden i et magasin.
- Dagtælleren er sin EGEN sektion EFTER heroen — ikke oven på den.
  Stor, taktil, mekanisk (kilometertællerhjul). "Brugeren bygger
  noget over tid."

#### Dyrkerstatus — IKKE gamification (revideret terminologi)

Ingen XP, levels, Bronze-Tomat, badges, træer, RPG. Tænk luksusur,
livstidsværk, mesterlære. Titler i stor typografi, stor stolthed,
lav støj: Spirer · Dyrker · Køkkenhaveejer · Selvforsyner ·
Frøsamler · Havearkitekt · Mesterdyrker. (Afløser V9's "spejder-
mærke"-formulering — samme ånd, skarpere reference.)

#### Trends (ny motor, backlog)

Netflix-/Spotify-logik for haven: "Mange dyrkere læser lige nu…",
"Dyrkere som dig interesserer sig også for…", "Du mangler stadig…".
Altid hjælpsomt, aldrig dømmende.

### V14: Rum, ikke sektioner — og liv før features (låst, 13. juni 2026)

To skift fra Anna, da Havebogen gik fra "have-app med en havebog"
til selvstændigt produkt:

#### Reframe: tænk i RUM, ikke sektioner

> Havebogen skal ikke være en oversigt over haven. Den skal være
> **det hus, haven bor i, når brugeren ikke er ude i den.**

Et hus har rum, ikke sektioner. Den voksende model (vokser vi ind
i den efterhånden som motorerne lander — IKKE en omdøbning nu):

| Rum | Hvad det rummer |
|---|---|
| Dagligstuen | Den daglige åbning — hero + dagens indsigt |
| Biblioteket | Inspiration, viden, det man kan lære |
| Spisekammeret | Have → høst → køkken |
| Værkstedet | Kompetencer, det man bliver bedre til |
| Udkigsposten | Hvad der venter — sæson, trends, det kommende |
| Arkivet | Minder, vendepunkter, tidligere sæsoner |

#### Revideret rækkefølge (erstatter V12's)

1. **Liv hver dag** — ikke flere features; mere variation, mere
   redaktion, mere stof. Strukturen står; indholds-motorerne mangler.
   "Åbner brugeren tre dage i træk og ser næsten det samme, er
   problemet ikke manglende features — det er manglende liv."
2. **Inspirationsmotoren EKSPLODERER** — fra "Du dyrker Korona" til
   "Du dyrker Korona. Hvis du tilføjer Malwina, kan du høste jordbær
   næsten en måned længere." Observation + indsigt. Kombinationer,
   mønstre, huller-med-begrundelse. Her bliver Havebogen *klog*.
3. **Spisekammer** — undervurderet; den mest livsstils-agtige
   funktion. Have → høst → køkken → liv. Ikke en havefunktion.
4. **Dyrkerstatus** — identitet, ikke gamification. SELVFORSYNER,
   FRØSAMLER, DRIVHUSMESTER. Et bælte i kampsport, et laug, et
   urværk — en titel man har gjort sig fortjent til.
5. **Kompetencemotor** — flyttet NED. Kompetencer hjælper; de andre
   giver personlighed. Inspiration + identitet + historier + køkken
   kommer først.
6. **Tal til din have** — kronen, til sidst. Bliver Havebogen
   fantastisk uden mikrofonen, bliver mikrofonen magisk. Mangler der
   stadig liv, bliver den bare endnu en knap.

(Kompetence-motoren var #2 i V12 — den er nu #5. Inspiration +
identitet + køkken bærer "selvstændigt produkt"-ambitionen.)

### V15: Ildstedet — havens stemme i dag (låst, 13. juni 2026)

Annas erkendelse: problemet er ikke længere mangel på indhold, men
mangel på **centrum**. Havebogen har rum, men mangler pejsen.

> Ét centralt objekt der svarer på: **"Hvad har haven at fortælle
> mig i dag?"** Alt andet på siden bliver sekundært.

Fem bud blev overvejet (Brevet · Forsiden · Strømmen · Almanak-
opslaget · Direkte tiltale). **Valgt: Brevet** — det rammer Annas
eksempel-struktur, fortærer alle eksisterende motorer til én stemme,
kan ikke forveksles med dashboard/kort/feed, og skalerer ærligt
(én takt for en ny bruger, fem for en fuld have).

#### Formen (låst)

"Havens stemme i dag" — ÉT dagligt brev, vævet af de eksisterende
motorer takt for takt:

1. Nutidsanker — havens øjeblik (sæson/jordtemperatur)
2. Din have lige nu — en opdagelse (ny bruger: lånt erfaring)
3. (Status: planter klar til at komme ud — kun når det gælder)
4. Inspiration om egne sorter — én, roteret dag for dag
5. Blik fremad — lukker med forventning, ikke status

Stor serif, massiv luft, én tanke ad gangen. Første takt størst;
de øvrige træder en anelse tilbage. Ingen boks, ingen eyebrow,
ingen knap — signeret diskret "fra haven".

#### Krav (alle opfyldt)

Fylder næsten en viewport · føles levende · ændrer sig dagligt
(takterne roterer pr. dagsnummer) · bruger kun eksisterende motorer
· ingen nye data · ikke chatbot · ikke notifikation · ikke dashboard.

#### Det erstattede

Den tidligere enkelt-linje "I dag i haven" (KapitelLigeNu) er
ABSORBERET af ildstedet — ikke en ny sektion, men centrum der
samler det, der før var spredt. "Stop med at bygge nye sektioner."

### V16: Ildstedet som dagsside, ikke brev (låst, 13. juni 2026)

V15's brev var stadig "tekst genereret af motorer" — fire ligeværdige
afsnit. Et brev læses; en pejs opholder man sig ved. V16 giver
ildstedet **redaktion**:

> Et dagligt magasin-opslag med ÉN hovedhistorie — ikke fire
> ligeværdige datapunkter. (Apple Journal · Moleskine · Martha
> Stewart · avisens forside.)

Formen (låst):
- **Datolinje** øverst ("17. juni") — gør det til *i dag*, en side.
- **Dagens historie** — ÉN lead, kæmpe (clamp 34-54). Ét bål i
  centrum. Vælges som den mest fængende takt: opdagelse > inspiration
  > nutidsanker.
- **Støtte-takter** — hver med sin lille rubrik-etiket ("Lige nu i
  haven", "Fra haven", "På denne tid af året"), stepped down, massiv
  luft. Hierarki frem for sammenstilling.

Ingen boks, intet kort, ingen "sektion" — bare en side. Samme
motorer, samme data; det nye er hierarkiet og rubrikkerne.

Målestokken er stadig **februar-testen**: noget man har lyst til at
blive siddende ved med en kop kaffe, mens haven ligger frossen ude.

### Lånt erfaring — niveau-modellen (V6-låst, 11. juni 2026)

Tomme tilstande er korrekte, men ikke værdifulde. En ny bruger må
aldrig møde "Du har ingen minder. Du har ingen historik. Du har
ingen erfaring." — sandt, men kedeligt. Den nye produktlogik:

```
Ingen data
  ↓
Lån erfaring fra fællesskabet     (niveau 0)
  ↓
Byg egen erfaring                  (niveau 1)
  ↓
Lær af egne mønstre                (niveau 2)
  ↓
Personlig mentor                   (niveau 3)
```

**Niveau 0 — Lånt erfaring.** Havebogen fungerer som en erfaren
dyrker: "Indtil vi kender din have, kan du læne dig op ad andres
erfaringer." Eksempel i stedet for tom På denne dag: "På denne tid
af året begynder mange dyrkere at hærde tomater og chili af før
udplantning."

**Niveau 1 — Egne erfaringer.** Så snart brugeren skaber data
(første knop, første høst), træder fællesskabet i baggrunden.

**Niveau 2 — Egne mønstre.** Sammenligninger: "Du såede tomater 9
dage tidligere end sidste år."

**Niveau 3 — Personlig mentor.** "Sidste år lykkedes dine tomater
bedst, når du såede i første halvdel af marts."

Jo længere brugeren dyrker med Potalot, desto mindre taler appen
om fællesskabet — og desto mere om brugeren. Målet efter 3-5
sæsoner: den eneste havebog i verden der kan sige **"Sådan dyrker
DU bedst."**

#### Designregel for lånt erfaring

Må ALDRIG formuleres som "VIDSTE DU AT..." / "FAKTA" / "TIP" —
det er ikke et blogindlæg, ikke internet anno 2012. Skriv som
havevisdom, erfaring, observation — og helst relevant for netop
denne bruger.

#### Ærligheds-regel (Potalot-tilføjelse)

Lånt erfaring må ikke bære opfundet præcision. Ingen fabrikerede
procenter ("85% af danske dyrkere…") før reel fællesskabs-data
findes. Kvalitative formuleringer ("mange dyrkere", "de fleste")
eller tal forankret i guide-data ("110-130 dage efter såning" =
hortikulturel fakta) er de ærlige former.

### Bogens fem kapitler

1. **Lige nu** — fortællende sætninger om havens øjeblik. Ingen tal,
   ingen store gradtal. Prosa.
2. **På denne dag** — sæsonhukommelsen. "11. juni 2026: Dahlia Café
   au Lait fik sin første knop." Om to år: "For to år siden fik Café
   au Lait sin første knop." Det er den slags Excel aldrig kan.
3. **Sæsonens historie** — måned for måned som krønike: "Maj — Du
   såede årets første tomater. Juni — De første chili blev plantet
   ud." AI kan skrive linjerne automatisk senere; strukturen skal
   være der nu.
4. **Minder** — kuraterede øjeblikke, ikke alle billeder. Potalot
   vælger: første knop, første høst, største tomat, første frost.
   Google Photos-princippet, men for haven.
5. **Tidligere sæsoner** — arkivet. Rolig tone, ikke melankolsk:
   "Når sæsonen er ovre, samles planterne her."

Heroen står foran kapitlerne og sætter stemningen: "Dette er MIN
have" — ikke "her er mine data". Den del er på plads.

---

## Hvad Havebogen er

- Havebogen er **ikke et dashboard**.
- Havebogen er **ikke en database**.
- Havebogen er **ikke et analytics-værktøj**.
- Havebogen er **en personlig havejournal**.

Når brugeren åbner Havebogen, skal oplevelsen føles tættere på en
smuk årbog, et magasin eller en naturdagbog end på Notion, Airtable
eller et SaaS-produkt.

Brugeren skal føle:

> **"Det her er min have."**

Ikke:

> "Det her er mine data."

---

## De ti principper

### 1. Hierarki før komponenter

Hvis noget føles forkert, justér altid:

- Hierarki
- Rytme
- Komposition

før vi justerer:

- Farver
- Skygger
- Hjørneradius
- Badges
- Komponentdetaljer

Store problemer løses næsten aldrig med flere komponenter.

### 2. Typografi skal bære oplevelsen

Typografi skal gøre det meste af arbejdet.

- Store tal
- Store overskrifter
- Meget få ord
- Luft omkring det vigtige

Hvis vi er i tvivl mellem **større typografi** og **endnu en
UI-komponent**, vælger vi næsten altid større typografi.

### 3. Kun få ting må være store

Store elementer er en begrænset ressource. Kun disse må være store:

- Hero-titler
- Datoer
- Antal aktive sorter
- Antal aktive planter
- Sæsonmarkører
- Dagens vigtigste fokus

Hvis alt er stort, er intet vigtigt.

### 4. Asymmetri er obligatorisk

Undgå:

```
Foto venstre.   Tekst højre.
Foto venstre.   Tekst højre.
Foto venstre.   Tekst højre.
```

Dette skaber katalog-følelse.

Sektioner skal skifte rytme:

- Stort foto
- Stort tal
- Overlappende kort
- Bredt billede
- Lille note
- Fuld bredde sektion

Brugeren skal føle bevægelse ned gennem siden.

**Regel:** Ingen to sektioner efter hinanden må bruge samme komposition.

### 5. Redaktionel prioritering

Ikke alle sektioner er lige vigtige. Der skal altid være:

- **En hovedhistorie**
- **En sekundær historie**
- **Flere mindre historier**

Eksempel for "denne uge":

```
Hovedhistorie:    Dild Bouquet er klar til afhærdning.
Sekundær:         8 aktive sorter i haven.
Mindre:           Noter, minder, arkiv, statistik.
```

### 6. Genbrug eksisterende plantekort

Havebogen skal **ikke opfinde nye kort**.

Hvis planten allerede findes i systemet, skal Havebogen genbruge
plantekortet. Havebogen skaber rammesætning omkring kortet — ikke
endnu en variant.

### 7. Store billeder er vigtigere end flere billeder

Ét stærkt billede er bedre end fem små.

Hvis der er tvivl: **gør billedet større**.

### 8. Sæsoner skifter stemning, ikke arkitektur

Kun tre ting ændrer sig gennem året:

1. **Hero-foto**
2. **Accentfarve**
3. **Månedsgrafik**

Resten af systemet forbliver stabilt. Brugeren skal **mærke
årstiden**, ikke **lære en ny app** hver tredje måned.

### 9. Havebogen skal føles som minder

Når brugeren åbner Havebogen om 5 år, skal siden føles som:

> **"Se hvor meget der er sket."**

Ikke:

> "Se hvor mange data jeg har registreret."

Alle designbeslutninger skal vurderes ud fra dette princip.

### 10. Editorial fremfor produkt

Havebogen er det mest emotionelle sted i hele Potalot:

| Sektion | Funktion |
|---|---|
| Frøbank | Data |
| Kalender | Planlægning |
| Guides | Læring |
| **Havebog** | **Erindringer** |

Derfor må Havebogen have sit eget typografiske univers (Cormorant /
Instrument Serif), selv om resten af appen bruger Gabarito. Det er
ikke inkonsistens. Det er redaktionel prioritering — ligesom et
magasin bruger én skrifttype til artikler og en anden til
indholdsfortegnelsen.

---

## Hvad Havebogen IKKE er

For at undgå tilbagefald skal vi være eksplicitte om hvad vi IKKE
bygger her:

- ❌ Tre ens cards ved siden af hinanden
- ❌ Fem sektioner med samme struktur
- ❌ H2 + tekst + card-mønstret gentaget
- ❌ Dashboard-komponenter (KPI-følelse)
- ❌ "0 noter · 8 sorter · 0 høster" — statistik-rakler
- ❌ Stats som første-indtryk
- ❌ Software-sprog som "Dette er din første sæson i Havebogen"

## Hvad Havebogen ER

- ✅ Magasin
- ✅ Scrapbook
- ✅ Havejournal
- ✅ Naturbog
- ✅ Personlig fortælling
- ✅ Editorial opslag
- ✅ Dagbog-sprog ("Den første side er stadig tom")
- ✅ Store tal (ét tal pr. sektion)
- ✅ Store fotos
- ✅ Asymmetri og overlap

---

## Tekstniveau-system (V3.5-låst)

| Niveau | Font | Størrelse | Brug |
|---|---|---|---|
| **1** | Cormorant 500w | clamp(72px, 20vw, 124px) | Big numbers, hero titel — sjældne |
| **2** | Cormorant 400w italic | 24-40px | Editorial statements ("Den første knop") |
| **3** | Manrope 700w caps | 11-14px tracking-wide | Fakta og labels |

Hver sektion må kun have **ét niveau-1-element**. Det er knapheden
der skaber værdi.

---

## Den ene linje at hænge over skærmen

> **Byg en havejournal, ikke et dashboard.**

For den overordnede Potalot-filosofi — se `potalot.md`.
For guide-systemet — se `guides.md`.
