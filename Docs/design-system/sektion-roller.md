# Potalot — Sektion-roller (V1, juni 2026)

> ## Status
>
> **Dette er produktarkitekturen, ikke designet.**
>
> Hvor `potalot.md` definerer hvordan sektionerne forholder sig til
> hinanden visuelt og typografisk, og `havebog.md` definerer Havebogs
> editorialske manifest, definerer dette dokument **hvad hver
> sektion ER**:
>
> - Hvilket spørgsmål besvarer siden?
> - Hvad er sidens primære handling?
> - Hvad er sidens sekundære handling?
> - Hvad må siden IKKE blive?
>
> Når der opstår tvivl om hvor en ny feature hører hjemme, eller
> hvilken sektion der skal redesignes først, læser vi dette dokument
> og spørger: matcher featuren det spørgsmål siden besvarer?
>
> Hvis svaret er nej, hører featuren et andet sted. Eller hører
> overhovedet ikke hjemme i Potalot.

---

## Hvorfor det her dokument findes

Den klassiske produkt-fælde: at iterere på UI, fordi noget føles
forkert, mens det egentlige problem er at man ikke har besluttet
hvad sektionen FOR. Et godt redesign af forkert spørgsmål er stadig
forkert.

Anna's observation efter de første 50 Havebog-iterationer: "I prøver
ikke længere at få en dagbog til at ligne et kartotek. Det var den
kamp, I har kæmpet hele tiden." Det her dokument er forsikringen mod
at vi falder tilbage i den kamp.

Hver sektion må besvare **ét spørgsmål**. Hvis sektionen besvarer to,
skal én af dem flyttes.

---

## Havebog (`/`)

### Hvilket spørgsmål besvarer siden?

> **"Hvordan går min have?"**

Ikke "hvad skal jeg gøre nu" (det er Kalenders job). Ikke "hvad har
jeg af frø" (Frøbanks job). Ikke "hvordan dyrker jeg X" (Guides).

"Hvordan går min have" rummer både den aktuelle sæsons tilstand og
hele havens historie over tid.

### Primær handling

**Forstå min sæson.**

Brugeren åbner Havebog for at få en fornemmelse af hvor de er i året
og hvad der er sket. Det er passiv læsning. Ingen formularer, ingen
beslutninger, ingen actions kræves.

### Sekundær handling

**Tilføje en note eller et minde.**

Når noget rammer brugeren — første blomst, regn på drivhuset,
salaten der pludselig er klar — kan de fange det her. Men kun hvis
de selv vil. Aldrig en CTA der presser.

### Må aldrig blive

- ❌ **Et dashboard** (KPI-følelse, statistik som første-indtryk)
- ❌ **Et kontrolcenter** (mange handlinger på én side)
- ❌ **En to-do-liste** ("hvad skal jeg gøre nu")
- ❌ **En database-rapport** ("0 noter · 8 sorter · 0 høster")
- ❌ **Et registreringsformular-heaven** (administration først)

Hvis Havebog begynder at fortælle brugeren hvad de skal gøre, er den
holdt op med at være Havebog.

---

## Frøbank (`/froebank`)

### Hvilket spørgsmål besvarer siden?

> **"Hvad har jeg af frø?"**

Det er et inventar-spørgsmål. Brugeren har frø fysisk i en kasse
eller en skuffe og vil have et hurtigt overblik over hvad samlingen
består af. Måske de er ved at planlægge en sæson. Måske de står i
haven og prøver at huske om de allerede har Marketmore.

### Primær handling

**Finde en bestemt sort.**

Brugeren leder efter noget specifikt — en sort, en kategori, frø der
udløber snart. Søgning og filtrering er kerneflowet, ikke et
nice-to-have.

### Sekundær handling

**Tilføje nyt frø.**

Når brugeren får nye frø (køb, bytte, gemt fra egen høst), skal det
være hurtigt at registrere. Diktat, foto-til-form, AI-udfyld.
Friktion her ER den eksistentielle risiko.

### Må aldrig blive

- ❌ **Et magasin** (Frøbank skal være effektiv, ikke editorial)
- ❌ **En læring-sektion** (det er Guides' job)
- ❌ **En planlægningsside** (det er Kalenders job)
- ❌ **En social funktion** (byttebørs er en separat feature, ikke
  Frøbankens kerne)

Hvis Frøbanken bliver smuk på bekostning af at man hurtigt kan finde
noget, har vi prioriteret forkert.

---

## Planter (`/mine-planter`)

### Hvilket spørgsmål besvarer siden?

> **"Hvordan har mine planter det?"**

Forskellen mellem Planter og Kalender: Planter besvarer pr. plante
("hvordan har min Roma det?"), mens Kalender besvarer pr. dato
("hvad skal jeg gøre denne uge?").

Den ene plante er hovedpersonen, ikke sæsonen.

### Primær handling

**Tjekke status på en specifik plante.**

Brugeren har et øjebliks-spørgsmål: er agurkerne stadig friske, har
chiliplanten brug for mere lys, er den udplantede tomat begyndt at
vokse? De åbner siden, scroller til den ene plante, kigger.

### Sekundær handling

**Logge en observation eller et næste skridt.**

Når en plante kræver noget (vand, knib, opbinding), eller der sker
noget værd at huske (første blomst, første frugt), registreres det
her. Igen — friktion er fjenden. Foto + et par tap, ikke en
formular.

### Må aldrig blive

- ❌ **En uendelig liste af identiske plantekort** (manglende
  prioritering — "Aktive → Art → Sorter" er den foreslåede arkitektur)
- ❌ **En database-tabel** (rå-felter, ikke kontekstualiseret status)
- ❌ **En to-do-app** (handlinger er en konsekvens af status, ikke
  modsat)
- ❌ **Havebog 2** (Planter handler om NU, ikke om at huske)

Hvis Planter bliver svær at scrolle, fordi alle planter er lige store
og lige vigtige, har vi opbygget den forkert.

---

## Kalender (`/kalender`)

### Hvilket spørgsmål besvarer siden?

> **"Hvad skal jeg gøre i haven lige nu?"**

Det her er den eneste sektion hvor "lige nu" er det rette tidsperspektiv.
Alle andre sektioner besvarer "over tid" eller "i dag".

Kalender er hjernen der koordinerer hvad sæsonen kalder på.

### Primær handling

**Se hvad denne uge / måned kræver.**

Brugeren åbner Kalender for at få at vide om der er noget der ikke
kan vente. Ikke en lang to-do-liste — de 1-3 vigtigste ting i den
aktuelle periode.

### Sekundær handling

**Tilføje en specifik opgave eller markere noget som gjort.**

Når brugeren tænker "jeg skal huske at..." eller har afsluttet en
handling, registreres det her. Helst som naturlig konsekvens af
diktat eller plante-log, ikke som separat formular.

### Må aldrig blive

- ❌ **En generisk to-do-app** (Todoist, Things — det findes allerede)
- ❌ **En statisk kalender** (Google Calendar — det findes allerede)
- ❌ **Et sæson-magasin** (det er Havebog / Guides)
- ❌ **En registreringsside** (registrering er en konsekvens af
  kalenderens prompts, ikke Kalenderens primære formål)

Hvis Kalender bliver et tomt skema med fortrykte have-opgaver, har
vi mistet pointen. Den skal forstå BRUGERENS specifikke have.

---

## Guides (`/guides`)

### Hvilket spørgsmål besvarer siden?

> **"Hvordan dyrker jeg X?"**

Det er det dybeste spørgsmål en bruger kan have, og det kræver det
mest editoriale rum.

### Primær handling

**Læse en guide.**

Brugeren har en specifik plante eller teknik de vil forstå. De
forventer at læse i 5-15 minutter. Lange artikler er ikke et
problem — de er pointen.

### Sekundær handling

**Finde guides der matcher det de har i Frøbanken eller dyrker
allerede.**

"Begynd her" + "I din frøbank" + søgning. Søgningen er ikke som i
Frøbank (find et specifikt frø) men som i et bibliotek (find noget
relevant at læse).

### Må aldrig blive

- ❌ **En plantedatabase** (rå-felter, Wikipedia-stil)
- ❌ **En søgemaskine-resultatside** (lister af tynde matches)
- ❌ **En markedsplads** ("Køb disse frø her")
- ❌ **En social side** (kommentarer, anmeldelser — distraktioner)

Hvis Guides bliver hurtig og effektiv, har vi misforstået den. Guides
er stedet for fordybelse. Frøbank er stedet for effektivitet.

---

## Krydsreference-matrix

Hvis hver sektion besvarer ét spørgsmål, så ved brugeren hvor de skal
gå. Men den eneste måde at undgå at sektionerne overlapper er at de
**peger på hinanden** for at besvare det de IKKE besvarer.

| Sektion | Når brugeren leder efter X, peg på Y |
|---|---|
| Havebog | "Hvad skal jeg gøre nu?" → Kalender |
| Havebog | "Hvad har jeg af frø?" → Frøbank |
| Frøbank | "Hvordan dyrker jeg den her?" → Guides |
| Frøbank | "Hvornår skal jeg så?" → Kalender |
| Planter | "Min historik med denne sort?" → Havebog |
| Planter | "Hvordan plejer jeg den?" → Guides |
| Kalender | "Hvad er der i mine bede lige nu?" → Planter |
| Kalender | "Hvad gjorde jeg sidste år?" → Havebog |
| Guides | "Har jeg den her?" → Frøbank |
| Guides | "Dyrker jeg den allerede?" → Planter |

Krydsreferencer skal være **lette** (et link, en knap), ikke tunge
(en hel widget der gentager den anden sektion).

---

## Grænsereglen: Planter vs. Kalender — tilstand vs. handling

Den hyppigste grænsekonflikt i appen er mellem Planter ("hvordan har
mine planter det?") og Kalender ("hvad skal jeg gøre?"). Samme
underliggende data er ofte relevant begge steder. Reglen er låst:

> **Planter må vise plante-status.**
> **Kalender må vise plante-handlinger.**
>
> Hvis samme data kan vises begge steder:
> - **Planter formulerer det som tilstand.**
> - **Kalender formulerer det som næste handling.**

### Eksempel

```
Data:
Chili Habanero Orange · klar_til_udplantning

Planter (tilstand):
3 chili er klar til udplantning.

Kalender (handling):
Udplant chili i løbet af ugen.
```

Samme data. To forskellige formuleringer. Det er ikke duplikering —
det er intelligent genbrug af information i to forskellige kontekster.

### Hvad hver side derfor må eje

**Planter må gerne vise** (tilstande):
- I vækst · Klar til høst · Kræver opmærksomhed · Afventer spiring
- "7 aktive planter" · "Tomat har 6 planter" · "Hvidløg er klar til arkiv"

**Kalender skal eje** (handlinger):
- "Udplant i dag" · "Prikl inden weekenden" · "Vand hvis jorden er tør"
- "Høst nu" · "Så direkte denne uge" · "Dæk mod nattefrost"

### Lakmustest

Læs sætningen højt. Hvis den starter med (eller kan omskrives til at
starte med) et **verbum i bydeform** — udplant, prikl, vand, høst, så,
dæk — hører den hjemme i Kalender. Hvis den beskriver en **tilstand**
— er klar, trives, venter, vokser — hører den hjemme på Planter.

Med denne regel kan "hvad skal jeg gøre i dag?"-laget bygges uden at
kopiere Planter-siden — og uden at Havebogen bliver et dashboard igen.

---

## Beslutningsregel — hvor hører en ny feature hjemme?

Når en ny feature foreslås, spørg:

1. **Hvilket spørgsmål svarer den på?**
2. **Hvilken sektion besvarer det spørgsmål?**
3. Hører featuren hjemme i den sektion, eller passer den i ingen?

Hvis ingen sektion passer:

- Skal vi tilføje en ny sektion? (Sjældent svaret.)
- Eller hører featuren ikke hjemme i Potalot? (Oftere svaret.)

---

## Beslutningsregel — hvilken sektion skal redesignes først?

Når man skal vælge hvor man bruger sin energi, prioritér efter:

1. **Hvor ofte bruges sektionen?** (Daglig > sjælden)
2. **Hvor stor er friktionen lige nu?**
3. **Hvor afhængig er sektionen af andre der ikke er låst endnu?**

Anna's vurdering juni 2026: Planter sandsynligvis > Havebog når det
gælder daglig brug. Derfor er **Planter den næste prioritet**, selv
om Havebog har fået flest iterationer.

---

## Tre faldgruber dette dokument prøver at forhindre

### Faldgrube 1: Feature-creep i forkert sektion

Eksempel: At lægge "del rapport" som knap i Havebog, fordi det
føles "rapport-agtigt". Men "del rapport" hører måske hjemme et helt
fjerde sted (en kommende `/rapporter`-sektion), eller som
funktionalitet på tværs.

### Faldgrube 2: At iterere designet på forkert spørgsmål

Hvis Havebog har det forkerte spørgsmål, er ingen mængde
typografi-tuning nok. Lås spørgsmålet først, designet bagefter.

### Faldgrube 3: At lade sektionerne kopiere hinanden

Hvis Planter begynder at vise historik over tid (Havebog's
territorium), eller Havebog viser "hvad skal jeg gøre"-prompts
(Kalenders), opløses begge sektioner. Hver må holde sig til sit ene
spørgsmål, selv om det betyder at noget data ikke vises i den
sektion brugeren først forventer.

---

## Det ene billede at have i hovedet

Når en bruger åbner Potalot og tænker "jeg vil gerne…", skal de **i
løbet af 2 sekunder** vide hvilken af de fem sektioner der besvarer
det. Hvis de er i tvivl, har vi fejlet i sektion-arkitekturen — ikke
i designet.

Det er sektionerne der skal pege i ét retning. Designet kommer
bagefter.

---

## Status og næste skridt (opdateret juni 2026)

1. ~~**Prioritet 2**: Planter-redesign "Aktive → Art → Sorter"~~ —
   ✅ bygget (V2.2, launchbar som informationsarkitektur)
2. ~~**Prioritet 3**: `registrering.md`~~ — ✅ låst (frø→sået→plante
   + lifecycle-routing)
3. **Næste løft**: "Hvad skal jeg gøre i dag?"-laget — bygges på
   grænsereglen ovenfor (Planter = tilstand, Kalender = handling).
   Kalender ejer handlings-formuleringerne.
4. **Prioritet 4**: Havebog V4-koncept — kun når sektionsspørgsmålene
   har vist sig at holde i mindst én ny iteration.
