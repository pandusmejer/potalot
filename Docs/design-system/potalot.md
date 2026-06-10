# Potalot — Design-filosofi (V1, juni 2026)

> ## Status
>
> **Dette dokument er V1 og er den overordnede ramme for hele Potalots design.**
>
> Hvor `guides.md` definerer guide-systemet og `havebog.md` definerer
> Havebogs editorialske sprog, definerer dette dokument hvordan alle
> sektioner i appen forholder sig til hinanden — og hvorfor de ikke
> skal se ens ud, selvom de er én app.

---

## Den ene sætning

> **Potalot er et digitalt haveredskab. Havebogen er den personlige
> havejournal inde i det digitale haveredskab.**

Forskellen mellem at gøre HELE Potalot poetisk og at lade Havebogen være
det poetiske rum inde i et ellers funktionelt værktøj. Hvis vi glemmer
det her, ender Frøbanken som et magasin og Kalenderen som en
følelsesdagbog. Folk skal stadig kunne finde deres tomatfrø uden at
læse et essay om årstidernes gang.

---

## De fem områder og deres DNA

Hver primær-sektion har sit eget formål, sin egen følelse og sit
eget designsprog. De skal føles **beslægtede, men ikke identiske**.

### Havebog
| | |
|---|---|
| Følelse | Minder |
| Funktion | Refleksion |
| Inspiration | Årbog, naturdagbog, editorial magasin |
| Ord | sæson · minder · noter · historik |
| Design-DNA | Store fotos · store tal · asymmetri · serif · stemning |
| Font | **Cormorant / Instrument Serif** + Manrope |

### Frøbank
| | |
|---|---|
| Følelse | Samling |
| Funktion | Overblik |
| Inspiration | Kartotek, samling, frøkasse |
| Ord | sorter · beholdning · spiring · såning |
| Design-DNA | Mapper · faner · indekskort · tydelig struktur |
| Font | **Gabarito** + Manrope |

Her må UI godt fylde mere. Brugeren kommer for at finde noget.

### Planter
| | |
|---|---|
| Følelse | Pleje |
| Funktion | Handling |
| Inspiration | Drivhus, vækstjournal, plejekort |
| Ord | vækst · næste skridt · status · udvikling |
| Design-DNA | Eksisterende plantekort · progression · fokusplante |
| Font | **Gabarito** + Manrope |

Den mest operationelle del af appen.

### Kalender
| | |
|---|---|
| Følelse | Timing |
| Funktion | Planlægning |
| Inspiration | Almanak, havesæson, månedstavle |
| Ord | nu · næste uge · denne måned |
| Design-DNA | Månedens hero · sæsonfarver · tidslinjer · rytme |
| Font | **Gabarito** + Manrope |

Navigationshjernen.

### Guides
| | |
|---|---|
| Følelse | Læring |
| Funktion | Fordybelse |
| Inspiration | Havebog, National Geographic, moderne magasin |
| Ord | lær · forstå · dyrk |
| Design-DNA | Store billeder · editorial layouts · lange artikler |
| Font | **Cormorant** + Manrope (samme univers som Havebog) |

Guides ligger nærmere Havebog end Frøbank.

---

## Den 3-lags arkitektur

For at sektion-identitet kan eksistere uden at appen falder fra hinanden,
arbejder designet i tre lag.

### Lag 1 — Globalt
Identisk i hele appen:

- Farver (basepalette + UI-farver)
- Spacing-skala
- Grid
- Skygger (`rgba(43,52,38,0.08)` — én værdi)
- Knapper
- Navigation (bottom-nav, top-bar)
- Ikoner

### Lag 2 — Sektion-identitet
Skifter pr. primær-sektion ifølge tabellen ovenfor:

| Sektion | Display-font | Primær-stemning |
|---|---|---|
| Havebog | Cormorant/Instrument Serif | editorial |
| Frøbank | Gabarito | system |
| Planter | Gabarito | handling |
| Kalender | Gabarito | sæson |
| Guides | Cormorant | magasin |

Sektion-identitet betyder også **kompositionel signatur**:
- Havebog skifter komposition mellem sektioner (ingen to ens i træk)
- Frøbank har en stabil mappe-/kartotek-struktur
- Planter har den faste plantekort-arkitektur
- Kalender har månedshero + tidslinje
- Guides har lag-baseret editorial flow (jf. `guides.md`)

### Lag 3 — Sæson
Skifter kun gennem året:

1. **Hero-foto** (per måned per primær-sektion)
2. **Accentfarve** (én pr. sæson)
3. **Månedsgrafik** (lille decorativ markør)

**Alt andet forbliver identisk.**

Brugeren skal **mærke** årstiden, ikke **lære en ny app** hver tredje
måned.

---

## Beslutningsregler

Når noget føles forkert, så vurdér i denne rækkefølge:

1. **Hierarki** — er der én klar hovedperson på siden?
2. **Rytme** — bryder sektionerne med hinanden, eller flyder de ind i hinanden?
3. **Komposition** — er der asymmetri og overlap?
4. **Typografi** — bærer størrelse hierarkiet?
5. **Farver** — først her
6. **Skygger og radius** — først helt til sidst
7. **Badges og komponentdetaljer** — sjældent svaret

Store problemer løses næsten aldrig med flere komponenter.

---

## Hvad Potalot IKKE er

For at undgå designfald skal vi være eksplicitte om hvad vi IKKE bygger:

- **Ikke Notion** — vi er ikke et produktivitetsværktøj
- **Ikke Airtable** — vi er ikke et database-værktøj
- **Ikke et SaaS-dashboard** — vi er ikke et analytics-værktøj
- **Ikke Instagram** — vi er ikke et fotodelings-værktøj
- **Ikke endnu et produktivitetsværktøj med grønne farver** — der findes
  rigeligt af dem på internettet, og det mangler sjældent flere

---

## Hvad Potalot ER

Et digitalt haveredskab der hjælper med:

- At huske hvad man har af frø
- At time hvad man skal gøre i haven
- At lære hvordan man dyrker hver enkelt sort
- At se hvordan ens have ser ud over tid
- At skabe minder om sæsoner der er gået

Tøvende vurdering: hvis en feature ikke kan placeres i én af de fem
sektioner ovenfor, hører den sandsynligvis ikke hjemme i Potalot.

---

## Den ene linje at hænge over skærmen

> **Byg en havejournal, ikke et dashboard.**

Den sætning alene vil sandsynligvis redde mange beslutninger fra
langsomt at trække Potalot i retning af endnu et produktivitetsværktøj
med grønne farver.

For Havebogen specifikt — se `havebog.md` for det fulde manifest.
