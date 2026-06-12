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
| 1 — Lige nu | Tekst venstre, STOR typografi, meget luft | ÉN indsigt — helst en OPDAGELSE (V8). |
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
