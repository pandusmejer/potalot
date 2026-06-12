# Potalot — Registreringsprincipper (V1, juni 2026)

> ## Status
>
> **Dette dokument styrer al registrering i Potalot — nu og fremover.**
>
> Hvor `sektion-roller.md` definerer hvad hver sektion ER, definerer
> dette dokument hvordan DATA kommer ind i systemet. Det kommer til
> at styre diktat, AI-udfyld, foto-registrering, spisekammer,
> rapporter og kalender de næste år.
>
> Registrering er Potalots eksistentielle risiko: hvis brugeren
> registrerer, bliver appen bedre år efter år. Hvis ikke, er appen
> tom. Derfor er disse principper ikke nice-to-have. De er kernen.

---

## Kernefilosofien

> **Autoudfyld alt. Antag det mest sandsynlige. Lad brugeren rette,
> hvis systemet tager fejl.**

Potalot må ikke opføre sig som en database. Potalot skal opføre sig
som en intelligent hjælper. Forskellen:

- En database kræver at brugeren udfylder felter korrekt.
- En hjælper gætter kvalificeret og spørger kun når det er nødvendigt.

### De seks regler

1. **Brugeren skriver én ting — systemet udfylder fem ting.**
2. **Diktat først.** Tale er hurtigere end formularer i en have med
   jord på fingrene.
3. **Billeder før formularer.** Et foto af såbakken indeholder mere
   information end ti felter.
4. **AI før dropdowns.** "Såede 12 California Wonder" skal parses,
   ikke klikkes sammen.
5. **Registrering skal være lettere end at lade være.**
6. **Antagelser er tilladt — så længe de er markeret som antagelser
   og senere verificeres.**

### Målet

> Hvis brugeren siger: "Den husker mere om min have end jeg selv gør"
> — har vi vundet.
>
> Hvis brugeren siger: "Jeg har brugt 40 minutter på at opdatere
> appen i dag" — har vi tabt.

---

## Princip #1: Frø → Sået → Plante

### Problemet

Når en bruger registrerer:

```
California Wonder
200 frø på lager
Sået: 12
```

må systemet ikke antage, at brugeren permanent har **12 aktive
planter** — for det ved vi ikke endnu.

Der findes mindst tre forskellige størrelser:

```
Frø på lager  →  Sået  →  Levende planter
```

Eksempel på et realistisk forløb:

```
200 frø på lager
 12 sået
  9 spiret
  7 aktive planter (efter prikling)
```

Disse tal er ikke nødvendigvis identiske. At behandle dem som ét tal
er en database-fejl forklædt som simplificering.

### Ved såning — autoudfyld med markeret antagelse

Brugeren siger eller registrerer:

```
Såede 12 California Wonder
```

Potalot opretter automatisk:

```
Sået: 12
Aktive planter: 12        ← MIDLERTIDIG ANTAGELSE
Status: 🌱 Afventer spiring
```

Visuelt:

```
12 sået
🌱 Afventer spiring
```

**Vigtigt:** `Aktive planter = 12` er en midlertidig antagelse, ikke
en verificeret sandhed. Det er OK — fordi status tydeligt siger
"Afventer spiring", og fordi systemet selv følger op.

### Efter spiring — systemet spørger, brugeren bekræfter

Efter et passende antal dage (guiden kender allerede
`germinationDays` pr. sort — systemet VED hvornår det skal spørge)
forsøger Potalot at afklare spiringsresultatet.

Enten:

```
Hvor mange kom op?
```

Eller endnu bedre (foto + AI):

```
Jeg kan se på dit foto, at cirka 9 planter er spiret.
Er det korrekt?
```

Hvis brugeren bekræfter `9`, opdateres data:

```
Sået: 12
Spiret: 9
Aktive planter: 9
Spiringsprocent: 75%
```

### Efter prikling

Brugeren registrerer:

```
Priklede 7 planter
```

Potalot opdaterer:

```
Sået: 12
Spiret: 9
Aktive: 7
```

Dermed opstår en **reel dyrkningshistorik** — ikke en række gæt der
aldrig blev korrigeret.

### Langsigtet værdi — data skal skabe læring

Data registreres ikke for dataens skyld. Data skal senere skabe
læring:

```
California Wonder
2026: 75% spiring
2027: 92% spiring
2028: 88% spiring

Gennemsnitlig spiring: 85%
Bedste år: 2027
```

Det er præcis denne type indsigt der gør Potalot mere værdifuld end
Excel eller en notesbog. Og det er den slags indhold der senere kan
bære sæsonrapporter ("Min Have 2026") og Havebogens
år-til-år-fortællinger.

### Arkitekturregel

Følgende må **aldrig** være en permanent antagelse:

```
Antal såede frø = antal aktive planter
```

Følgende må **gerne** være en midlertidig antagelse:

```
Antal såede frø → antal aktive planter
```

— så længe status er `🌱 Afventer spiring`, og systemet senere
forsøger at verificere eller korrigere tallet.

### UX-regel

Dette:

```
12 sået → 12 aktive
```

er en bedre startoplevelse end:

```
12 sået → 0 aktive
```

og derefter tvinge brugeren gennem flere formularer.

Potalots opgave er at få brugeren hurtigere tilbage i haven — ikke
at få brugeren til at udføre administrativt arbejde.

> **Frisk luft og jord under neglene er vigtigere end skærmtid.**

---

## Princip #2: Lifecycle-routing — hver fase har ét hjem

En plantes livscyklus passerer fire faser, og hver fase hører hjemme
ét bestemt sted i appen. Denne routing er låst:

```
Planlagt   →  Frøbank / Kalender   (en intention, ikke en plante)
Aktiv      →  Planter              (det der fysisk gror)
Afsluttet  →  "Klar til arkiv"     (venlig oprydning, foreslå Havebogen)
Arkiveret  →  Havebog              (historik og minder)
```

### Hvorfor denne regel er låst

Uden den opfinder hver fremtidig feature (diktat, billeder, autofyld,
høst, spisekammer, rapporter) sin egen sandhed om hvor en plante "er".
Og så er vi tilbage ved Excel med pæne farver.

Med den ved enhver feature præcis hvor dens data skal lande:

- Diktat "jeg vil så chili til efteråret" → **planlagt** → Frøbank/Kalender
- Diktat "såede 12 California Wonder" → **aktiv** → Planter
- Diktat "hvidløgene er høstet færdig" → **afsluttet** → Klar til arkiv
- Bruger trykker "Gem i Havebogen" → **arkiveret** → Havebog

### Aktive-definitionen (gentaget fordi den er vigtig)

> "Aktive" må kun indeholde planter der fysisk er i gang:
> sået → spirer → i vækst → klar til udplantning → udplantet → høstklar.
>
> Planlagte sorter vises separat. Afsluttede planter bliver ikke
> stående i Aktive, men foreslås arkiveret i Havebogen.

Ellers bliver Aktive en rodekasse med planer, levende planter og døde
planter — den slags kategorifejl der får et pænt UI til at lugte af
Excel.

---

## Implementerings-status (gap-analyse, juni 2026)

Hvad datamodellen kan i dag vs. hvad princippet kræver:

| Princippet kræver | Status i dag | Gap |
|---|---|---|
| Sået-antal pr. såning | ✅ `SowingEvent.sownCount` findes | — |
| Hvornår systemet skal spørge | ✅ `GuideQuickFacts.germinationDays` findes | Ingen prompt-flow bygget |
| Spiret-antal | ❌ `PlantLog` (type `germination`) har intet count-felt | Tilføj `count?: number` på PlantLog |
| Aktive-antal adskilt fra sået | ❌ `Plant.quantity` konflaterer sået og aktive | Skil i `sownCount` / `activeCount` (eller afled fra logs) |
| Antagelses-markering | ❌ Ingen flag for "midlertidigt antaget" | Status `afventer spiring` + afledningsregel: quantity er antaget indtil germination-log findes |
| Spiringsprocent pr. år | ❌ Ikke beregnet nogen steder | Afled: spiret/sået pr. growingYear — føder rapporter + Havebog |
| Verifikations-prompt efter spiring | ❌ Findes ikke | Kalender-opgave auto-oprettet ved såning: "Hvor mange kom op?" trigget af sowingDate + germinationDays |
| Foto-AI spire-tælling | ❌ Findes ikke | V2+ — kræver AI-flow; spørgsmåls-versionen kommer først |

### Anbefalet implementeringsrækkefølge

1. **Datamodel**: `count`-felt på `PlantLog` + afledningsregler for
   sået/spiret/aktive (ingen ny tabel — log-events ER historikken)
2. **Såning-flow**: autoudfyld aktive = sået + status "afventer
   spiring" (UX-reglen)
3. **Verifikations-prompt**: auto-oprettet kalenderopgave ved
   sowingDate + germinationDays
4. **Spiringsprocent**: afledt visning på plante-detail + senere i
   rapporter
5. **Foto-AI**: V2+

Intet af dette er bygget endnu — dokumentet låser retningen, så
diktat-, AI- og rapport-arbejdet de næste måneder trækker i samme
retning.
