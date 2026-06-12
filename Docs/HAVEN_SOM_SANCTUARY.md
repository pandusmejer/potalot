# POTALOT — Haven som sanctuary

> **Status:** Strategisk retning + designramme — *til fremtidig implementering*.
> Dette er et identitets-koncept der skal væves ind på tværs af
> appen over tid. Ingen kode er ændret i forbindelse med dette
> dokument.

---

## Kernen

Haven er for mange et sanctuary. Bevist afstressende. Det skal
inkorporeres i Potalot's univers — som **modspil til alt det
have-app-kategorien typisk leverer**:

- Produktivitet
- Reminders
- "Tasks"
- Yield-optimering
- Kontrol

Mennesker går jo netop i haven for at slippe væk fra notifikationer,
effektivitet, optimering og Slack-hjerner.

Hvis Potalot tør eje:

- Langsommelighed
- Sansning
- Årstider
- Ro

…så differentierer vi os voldsomt.

**Ikke som wellness-app.** Men som **jordnær opmærksomhed**.

Det er en vigtig forskel.

---

## Det må IKKE blive "mindfulness-app"

**Undgå:**
- Affirmations
- Pseudo-terapi
- "Du er nok"
- Breathwork-coach energi

Det bliver hurtigt: Silicon Valley stress-management for mennesker
med standing desks.

**I stedet:** Konkrete sanselige handlinger. Det er meget stærkere.

---

## Eksempler der virker

```
Gå en langsom runde i haven.
```

```
Duft til tomatplanterne.
```

```
Mærk jorden. Den er blevet varmere.
```

```
Lyt til haven i 2 minutter uden telefon.
```

```
Pluk noget du ikke havde planlagt.
```

```
Gå ud med bare tæer hvis vejret tillader det.
```

```
Betragt hvad der er vokset siden sidst.
```

```
Indånd duften fra krydderurterne.
```

---

## Vigtigt om formen

Disse må ikke ligne **opgaver**.

- Ingen checkboxes
- Ingen completion-tracking
- Ingen progress

**De er små observationer. Invitationer. Rolige prompts.**

---

## Foreslået komponent: "Haven i dag"

Lille editorial card — adskilt fra todo-listen.

**Eksempel:**

```
HAVEN I DAG

Regnen kommer i nat.
Basilikum dufter ekstra kraftigt i varme.
Brug 5 minutter uden at gøre noget bestemt.
```

Smukt fordi det ikke kræver performance.

---

## Sæson- og tidskontekst gør det stærkere

**FORÅR**
```
Der sker nye ting næsten hver dag nu.
```

**SOMMERAFTEN**
```
Haven falder langsomt til ro nu.
```

**EFTER REGN**
```
Jorden dufter anderledes efter regnen.
```

**TIDLIG MORGEN**
```
Duggen holder stadig fast i bladene.
```

---

## Hvorfor det er et USP

Vi gør haven til **mere end dyrkning**. Vi gør den til et sted
man **opholder sig**.

Det er langt stærkere brandmæssigt end "hold styr på dine frø".

---

## Frekvens-regler (kritiske)

Hvis appen hele tiden "prøver at være klog", bliver den uudholdelig.

**Derfor:**

- Maks 1 lille sanselig prompt pr. dag
- Aldrig popup
- Aldrig push-notifikation
- Aldrig tvungen interaktion

Bare **rolig tilstedeværelse**.

Som en stille havebog. **Ikke en digital yogalærer forklædt som
squash-entusiast.**

---

## Foretrukne placeringer (refineret)

Sætningerne skal ikke føles som features. De skal opføre sig som
små marginnoter, naturglimt, stille observationer, mikroåndehuller.
Aldrig som widgets.

**Komplette placerings-katalog:**

1. **Mellem sektioner** (✓ implementeret: mellem "Denne uge i haven"
   og "Mine opgaver") — rytmeskift mellem aktuelle handlinger og
   struktur/opgaver.

2. **I bunden af et langt scroll** — efter brugeren har scrollet
   gennem meget information. Eksempel: *"Se hvad haven gør uden
   dig."* Giver følelsen af "nu er du færdig med systemet, tilbage
   til haven."

3. **Mellem måneder i Årshjulet** — fx mellem April og Maj.
   Lille stille overgang. Eksempel: *"Maj lugter allerede lidt af
   sommer."* eller *"Nu går det stærkt i bedene."*

4. **Under vejrpillerne** — kun enkelte dage. Eksempel efter regn:
   *"Jorden arbejder også når du ikke gør."* Meget subtil, lav
   kontrast, næsten som en hvisken.

5. **Empty states** — i stedet for "Ingen planter" brug
   *"Der er stille i jorden lige nu."* eller *"Alt starter med ét
   frø."* Gør tomme tilstande mindre sterile.

6. **I Havebogen efter logging** — ikke toast-notifikation, ikke
   "Succes!". Bare: *"Haven husker mere end du tror."* eller
   *"Små ting bliver til sæsoner."*

7. **I bunden af dyrkningsguides** — efter alle faktafelter. Lidt
   varme, lidt menneskelighed. Eksempel for tomater:
   *"Tomater vokser bedst hos mennesker der kigger på dem lidt for
   ofte."*

8. **Ved solnedgang / aften** — tidsstyret. Eksempel:
   *"Tag en sidste runde før mørket falder på."* eller
   *"Aftenhaven føles anderledes."*

9. **På regnvejrsdage** — kun ved faktisk regn:
   *"I dag vokser haven næsten af sig selv."*

10. **Når brugeren ikke har åbnet appen i nogle dage** — IKKE
    guilt-tripping. ALDRIG "Du har ikke logget noget i 5 dage 😔".
    I stedet: *"Der er sikkert noget nyt i haven siden sidst."*

11. **På plantekort** — mikrosætning nederst. Ikke alle, kun nogle.
    Plant-specifikke:
    - Basilikum: *"Knib lidt. Den kommer igen."*
    - Agurk: *"Agurker vokser hurtigere end man tror."*
    - Georginer: *"De bedste blomster kommer sent."*

### Vigtigste regel

De må aldrig:
- Føles gamified
- Være motivationsquotes
- Blive for kloge
- Blive pseudo-terapeutiske
- Være LinkedIn-poesi for folk med keramikkopper

De skal føles: **observerende, haveforankrede, rolige, menneskelige.**
Som små noter skrevet i kanten af en gammel havebog.

---

## Implementerings-hooks (når tiden er inde)

Disse data/triggers er allerede (eller bliver snart) tilgængelige
og kan drive valg af prompt:

- **Vejr-data** — `getGardenAlerts` returnerer allerede regn/frost
- **Tidspunkt** — `new Date().getHours()` for morgen/aften
- **Sæson** — `aktuelMaaned()` for forår/sommer/efterår/vinter
- **Plantekontekst** — brugerens aktive planter (krydderurter →
  "indånd duften fra krydderurterne" mv.)

Prompts kan ligge i en simpel array struktur med tags:
`{ text: string, season?: 'spring'|'summer'..., timeOfDay?: 'morning'|'evening', weather?: 'after-rain'|... }`

Daglig pick: filtrér på kontekst, vælg én tilfældig.

Hører naturligt hjemme som **lag 7 — "Langsomt indhold / sæsonlag"**
i `KALENDER_MASTER_SPEC.md`.
