# POTALOT — Kalender / Årshjul / Fremtidslag

> **Status:** Master spec — *til fremtidig implementering*.
> Den nuværende Kalender-side (`/src/app/(app)/kalender/`) skal
> gradvis omformes til at matche denne retning. Ingen kode er
> ændret i forbindelse med dette dokument.

---

## ⚠️ Critical rule — de editorial sektioner SKAL bevares

To sektioner bærer kalenderens sjæl og må aldrig reduceres:

1. **Månedens hero** (sektion 1) — den emotionelle indgang til
   måneden, sæsonens identitet, rytmen i appen
2. **Årshjulet** (sektion 3) — den botaniske tidsmotor, det store
   sæsonoverblik, hjemsted for månedens editorial guide

De må **IKKE**:

- Reduceres til små headers
- Erstattes af utility UI
- Komprimeres til dashboard cards
- "Effektiviseres"

Kalenderen skal stadig føles **editorial og sæsonbaseret**.
Ikke **funktionalistisk**.

Når denne masterspec implementeres: udvid og forfin de editorial
flader, lad være med at omdanne dem til kompakte UI-blokke. De er
sjælen i siden, ikke chrome.

> "Apple Reminders for folk med jord under neglene" og "Notion
> med tomatplanter" er præcis det vi IKKE er. Årshjulet er det
> tydeligste sted vi differentierer os fra det.

---

## Core purpose

Kalenderen er **fremtidslaget i Potalot**. Den svarer på:

> "Hvad skal jeg gøre hvornår?"

Kalenderen må **IKKE**:

- Blive endnu en planteliste
- Blive en logbog
- Blive en frøbank
- Blive et dashboard

Kalenderen **ejer**:

- Timing
- Sæson
- Kommende handlinger
- Dyrkningsvinduer
- Vejrafhængige handlinger
- Rytme gennem året

Kalenderen skal **føles**:

- Rolig
- Sæsonbaseret
- Levende
- Menneskelig
- Observant

**IKKE** productivity app, Jira-board, Notion-database, reminder-machine.

---

## Mental model

| Sektion | Tidsretning |
|---|---|
| Frøbank | Hvad jeg har |
| Planter | Hvad der sker nu |
| **Kalender** | **Hvad der snart sker** |
| Havebog | Hvad der skete |

Kalenderens tidsretning: **FREMTID**

---

## Visuel retning

Kalenderen skal føles som:
- Årstid
- Temperatur
- Lys
- Naturens rytme

Ikke som admin-interface.

**Visuelle principper:**
- Store rolige flader
- Editorial spacing
- Meget luft
- Få men stærke elementer
- Sæsonfarver
- Ingen aggressive borders
- Ingen segmented controls
- Ingen tunge dashboards

**Base:**
- Varm ivory baggrund
- Oliven tekst
- Sæsonfarver som accent

---

## Overordnet arkitektur

**Scroll flow (top → bund):**

1. **Månedens hero** — sæson / stemning / temperatur
2. **Vejrpiller** — have-relevant kontekst
3. **Denne uge i haven** — 7 day cards, ugens rytme (AKTUELT)
4. **Mine opgaver** — konkrete to-dos (HANDLING — uge-niveau)
5. **Årshjul / månedens rytme** — det store overblik (ORIENTERING)
6. **Egne planter der matcher sæsonen** — relevante frø-/plantekort
7. **Vejr / frost / jordtemperatur**
8. **Langsomme sæsonprompts**

### Princip for rækkefølgen — adskil tidslogikker

Brugerens hjerne læser tidshierarkier intuitivt. **Uge ≠ måned**.
Hvis de blandes, begynder appen at føles som "agenda + guide +
kalender + dashboard + inspiration" i én grøn UX-suppe.

Derfor sidder **uge-laget samlet** (Denne uge i haven + Mine
opgaver), og **måned-laget kommer separat** (Årshjul).

```
UGE-LAG          →  MÅNED-LAG          →  KONTEKST
(operationelt)      (rytme/overblik)       (forfining)
```

- **Denne uge i haven** (uge): 7 day cards, "Ugens opgaver →"
  CTA der linker til Mine opgaver (ikke til årshjulet — det er
  forskellig tidslogik).
- **Mine opgaver** (uge): konkrete to-dos der hører til samme
  operationelle lag som ugestripen.
- **Årshjulet** (måned): den botaniske tidsmotor. Står efter
  uge-laget så det ikke bliver overset, men det blander sig
  ikke ind i det operationelle.
- Resterende sektioner (plantekort/vejr/sensorisk) ligger sidst
  som kontekstuel forfining.

### CTA-sprog skal matche tidslogikken

I uge-sektionen er korrekt CTA:

- ✓ "Ugens opgaver →"
- ✓ "Åbn ugevisning →"
- ✓ "Se alle dage →"

**IKKE**:
- ✗ "Se hele ugen →" der hopper til årshjulet (semantisk brud:
  ugevisning ≠ månedsorientering)

---

### 1. Månedens hero

Stor editorial hero øverst. Skal IKKE være marketing-banner — skal føles som sæson-intro.

**Indhold:**
- Måned
- Kort situationsbeskrivelse
- Temperatur / sæsonfølelse
- Baggrundsfoto eller atmosfærisk illustration

**Eksempel:**

```
MAJ

Jorden bliver varmere nu.
Mange planter kan snart flyttes ud.
```

eller:

```
OKTOBER

Haven arbejder langsommere nu.
Tid til at samle frø og beskytte det sarte.
```

Heroen må gerne reagere på vejret, region og brugerens aktive planter.

---

### 2. Vejrpiller

Små have-relevante vejrsignaler øverst i indholdsområdet,
umiddelbart under heroen.

**3 piller som standard**, horisontal scroll hvis flere. Højde 34px,
border-radius 10px, ivory baggrund.

**Vis:**
- Temperatur (dag-høj/lav eller nuværende)
- Regn / frost / vind hvis relevant
- Solopgang / dagslys / jordtemperatur

**Vis IKKE** generiske data (luftfugtighed, vindhastighed, skydække)
medmindre de direkte ændrer en have-beslutning.

Korrekt:
- "Let regn i nat"
- "Jordtemp. 12 °C"
- "Nattefrost torsdag"

Forkert:
- "82% humidity"
- "6 m/s wind"
- "Cloudy"

---

### 3. Denne uge i haven

**Kalenderens vigtigste blok i uge-laget.**

Varmt papir-card med **horisontal scroll af 7 day cards** —
I dag → Tir → Ons → Tor → Fre → Lør → Søn. Brugeren skal kunne
swipe gennem hele ugen, ikke kun se 3 dage.

**Hvert day card** (128×164 px):
- Dato/status-linje (I dag får cirkulær grøn markør med leaf-ikon)
- Botanisk eller vejr-ikon, centreret (42×42)
- Kort handlings-titel ("Udplant tomater")
- Forklaring ("Efter sidste risiko for nattefrost.")

**Header med CTA:** "Ugens opgaver →" der scrollanchorer til
"Mine opgaver" — IKKE til årshjulet (forskellig tidslogik).

**Empty state:** Rolig uge-tekst + én sensorisk note ("Gå en
langsom runde og se hvad der har ændret sig"), aldrig "0 tasks".

---

### 4. Mine opgaver

Konkrete to-dos med specifik dato. Sidder direkte under
ugestripen fordi uge + opgaver er **samme operationelle tidslag**.

Linket "Ugens opgaver →" fra ugestripen scrollanchorer hertil
(via `id="mine-opgaver"`).

**Prioritering:**
1. Kritiske
2. Vejrafhængige
3. Sæsonrelevante
4. Bløde anbefalinger

Vis IKKE mikro-management. Undgå "vanding hver 2. dag"-spam.

**Kalenderen skal hjælpe. Ikke overvåge.**

---

### 5. Årshjul / månedens rytme — kalenderens centrale komponent

Årshjulet er **selve den botaniske tidsmotor** i Potalot. Det er
her vi differentierer os fra alt det have-app-kategorien typisk
leverer:

- Apple Reminders for folk med jord under neglene
- Notion med tomatplanter
- "Habit trackers men grønne"

Årshjulet må derfor **ikke** være en lille widget. Det skal være
en betydelig, central komponent på siden — visuelt rolig, men
strukturelt det største anker efter heroen.

**Indhold:**
- Hele året som lodret sæson-progression (forår → sommer →
  efterår → vinter)
- Aktuel måned fremhævet
- Klikbar navigation til vilkårlig måned
- Inden i den aktuelle måneds blok: kort editorial **månedens
  guide** ("Tid til i maj" — udplant frostfølsomme planter,
  hold øje med nattefrost, begynd afhærdning) — kort, læsbart,
  skimmable, ikke lang artikel
- Plus månedens konkrete gøremåls-liste (sæsonbaseret, ikke
  personlige tasks)

**Placering i flow er kritisk** — sidder EFTER uge-laget (Denne
uge + Mine opgaver) så det operationelle først har "landet" hos
brugeren, og MÅNED-rytmen derefter giver overblik.

Uge ≠ måned. Adskil tidslogikkerne tydeligt — derfor får
årshjulet sin egen "Maj i haven"-intro, ikke en uge-CTA.

**Det er her sæsonen lever som rytme** — ikke som en sidebar.

---

### 6. Egne planter der matcher sæsonen

Horisontal scroll. Viser KUN relevante frø-/plantekort for
nuværende tidspunkt — ikke hele samlingen.

**Eksempler:**
- Klar til forspiring
- Bør ompottes
- Klar til udplantning
- Snart høstklar

Kortene **genbruger** frøkort-/plantekort-systemet (de er allerede
låst, se separate specs).

**Maks:** 3–6 kort.

Skal føles: "det her er relevant lige nu."

> Note: Den nuværende `LigeNuIHaven`-sektion (committed) er en
> første approximation af dette. Den viser alle aktive planter
> uden filtrering. Per masterspecen bør den strammes til kun at
> vise det "rigtigt relevante lige nu", ikke alt det aktive.

---

### 7. Vejr / frost / jordtemperatur (uddybende advarsel)

Bemærk: kerne-vejr-konteksten er allerede dækket af **Vejrpiller**
(sektion 2) som ligger øverst.

Denne sektion er et særskilt **uddybende advarsel-card** der kun
vises ved kritiske vejrhændelser med direkte have-konsekvens —
ikke generel vejrinfo.

**Eksempel:**

```
Nattefrost mulig torsdag.
Vent med udplantning af chili.
```

eller:

```
Jordtemperaturen er høj nok til gulerødder.
```

Vises kun når relevant — på rolige dage er der intet card her.

---

### 8. Langsomt indhold / sæsonlag

Små rolige prompts. Ikke todo. Ikke gamification.

**Eksempler:**

```
Lyt til haven efter regnen.
```

```
Maj ændrer haven hurtigt nu.
```

```
Duggen holder længere om morgenen.
```

**Maks: 1–2 pr side.**

Se også `HAVEN_SOM_SANCTUARY.md` for udvidet konceptuel ramme om
det sanselige/langsomme lag.

---

## Dataregler

Kalenderen trækker fra:

**Frøbank:**
- Såmåneder
- Udplantning
- Høstperioder
- Sorter

**Planter:**
- Aktive stadier
- Status
- Placering
- Udvikling

**Vejr:**
- Temperatur
- Regn
- Frost
- Jordtemp

**System:**
- Årstid
- Måned
- Geografisk placering

---

## Det Kalenderen IKKE må

- Vise historisk log
- Vise alle planter
- Være task-manager
- Være KPI-dashboard
- Have streaks
- Have achievements
- Have productivity-language

**Undgå ord som:**
- Mål
- Performance
- Efficiency
- Productivity

---

## Typografi

- **Headlines:** Manrope 800
- **Body:** Manrope 500–600
- **Editorial / organisk:** Cormorant Garamond Italic (bruges sparsomt)

---

## Farver

**Base:**
- Varm ivory
- Dusty olive
- Muted terracotta
- Faded yellow
- Salviegrøn

**Undgå:**
- Neon
- Ren hvid
- Blå UI-farver
- Hårde gradients

---

## Overordnet følelse

Kalenderen skal føles som:

> "Et roligt kig ud over sæsonen."

Ikke en app der forsøger at optimere brugerens liv.

Brugeren skal føle:

> "Potalot følger haven sammen med mig."

Ikke:

> "Potalot administrerer mine tasks."
