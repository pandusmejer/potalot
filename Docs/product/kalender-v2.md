# Kalender V2 — Potalots havementor (produktdokument, juni 2026)

> ## Status
>
> **Dette dokument beskriver Kalenderens HJERNE — ikke dens udseende.**
>
> `Docs/KALENDER_MASTER_SPEC.md` ejer UI'et (månedshero, sektioner,
> typografi). Dette dokument ejer produktlogikken: hvilke data
> Kalenderen bruger, hvordan den prioriterer, hvordan den håndterer
> nye brugere, og hvordan den bliver mere værdifuld år for år.
>
> Ingen komponenter. Ingen kort. Ingen knapper.
>
> Hvorfor dette dokument findes: Planter, Frøbank, Guides og Havebog
> har fået deres roller låst. Det største tilbageværende
> produktpotentiale ligger i Kalenderen. Hvis den løses, får Potalot
> den aktive hjælper visionen beskriver. Hvis ikke, ender Potalot
> som verdens smukkeste havejournal — bedre end verdens grimmeste,
> men ikke visionen.

---

## Den ene sætning

> Kalenderen svarer på: **"Hvad er det vigtigste jeg gør i haven i dag?"**

Ikke "hvad KAN jeg gøre" (det er en encyklopædi). Ikke "hvad har jeg
planlagt" (det er en todo-app). **Det vigtigste. I dag. I min have.**

Hvert ord bærer:

- **Vigtigste** — prioritering er kerneproduktet, ikke listen
- **I dag** — tidshorisonten er nu, ikke sæsonen (det er Årshjulet)
- **I min have** — personligt, baseret på brugerens faktiske planter
  og frø, ikke en generisk havekalender fra et magasin

---

## Mentor, ikke opgaveliste

Forskellen på en opgaveliste og en mentor:

| Opgaveliste | Mentor |
|---|---|
| Viser alt der kan gøres | Vælger det der betyder noget |
| "Vand tomaterne" | "Vand tomaterne — drivhuset rammer 30° i dag" |
| Fylder hver dag med opgaver | Tør sige "alt ser godt ud i dag" |
| Genererer skyldfølelse | Genererer ro |
| Ved ikke hvorfor | Forklarer hvorfor |

### De tre mentor-regler

1. **Max 3 fokus-handlinger pr. dag.** En mentor peger, den dynger
   ikke til. Resten af det mulige ligger bag en fold ("Se alle").

2. **Stilhed er en feature.** Hvis intet haster, siger Kalenderen det:
   "Alt ser godt ud — nyd haven." Den opfinder ALDRIG opgaver for at
   fylde tomrum. En kalender der altid har 5 opgaver er en kalender
   brugeren holder op med at tro på.

3. **Hvorfor følger med.** Hver handling kan begrundes i én sætning:
   "Udplant chili — jordtemperaturen er stabilt over 14°." Begrundelsen
   er det der adskiller en mentor fra en notifikations-maskine, og det
   der lærer brugeren at blive en bedre dyrker (visionen er at hjælpe
   dyrkeren med at blive bedre — ikke at gøre dyrkeren afhængig).

---

## Hvilke data Kalenderen bruger

Kalenderen er ikke en datakilde. Den er en **linse** der samler alt
hvad systemet allerede ved, og koger det ned til "i dag".

| Kilde | Hvad den giver | Status i datamodellen |
|---|---|---|
| **Dato + måned** | Sæsonvinduet — hvad er biologisk muligt nu | ✅ Trivielt |
| **`GuideCalendarRule`** | Pr. sort: opgavetype, anbefalede måneder, trigger (sowingDate/germinationDate/plantingOutDate) + relativeOffsetDays, prioritet | ✅ Findes — guides bærer allerede kalender-logik |
| **`GuideQuickFacts`** | Så-/udplantnings-/høst-måneder, germinationDays, frostSensitive, minimumTemperature | ✅ Findes |
| **`Plant` (status + datoer)** | Hvad gror lige nu, hvor langt det er | ✅ Findes |
| **`SowingEvent`** | Faktiske så-datoer + antal → triggers kan regnes | ✅ Findes |
| **`PlantLog`** | Hvad brugeren faktisk har gjort (og hvornår) | ✅ Findes |
| **`InventoryItem` (Frøbank)** | Hvad brugeren EJER men ikke har sået — fødekilde til "så nu"-forslag | ✅ Findes |
| **`CalendarTask` (manual)** | Brugerens egne opgaver | ✅ Findes |
| **Arkiverede planter + logs pr. growingYear** | Brugerens historik — hvad virkede hvornår | ✅ Findes (ubrugt til læring) |
| **Vejr / frost / jordtemperatur** | Tidskritiske advarsler | ❌ Findes ikke — V2+-kilde |
| **Spiringsprocent pr. sort pr. år** | Personlig såningsrådgivning | ❌ Afventer count-felt på PlantLog (jf. `registrering.md`) |

Den vigtigste observation: **næsten alt findes allerede.** Guides
bærer kalender-regler pr. sort. Frøbanken ved hvad brugeren ejer.
Planter ved hvad der gror. Det der mangler er ikke data — det er
**prioriterings-laget** der samler det.

---

## Prioriteringsmodellen

Når Kalenderen skal vælge dagens 1-3 vigtigste handlinger, vægter den
i denne rækkefølge:

### Lag 1 — Tidskritisk (kan ikke vente)
Biologien venter ikke. Frostvarsel på frostfølsomme udplantede
planter. Høstvindue der lukker. Afhærdning der skal startes NU for
at nå udplantningsvinduet.
→ Vises altid, kan ikke foldes væk.

### Lag 2 — Status-afledt handling (planten kalder)
Direkte afledt af plante-status via grænsereglen i
`sektion-roller.md`: status `klar_til_udplantning` → handlingen
"Udplant chili i løbet af ugen". Status `hoestklar` → "Høst salaten".
→ Samme data som Planter viser som tilstand — Kalenderen
formulerer den som handling (bydeform).

### Lag 3 — Verifikations-prompts (systemet spørger)
Fra `registrering.md` princip #1: sowingDate + germinationDays er
passeret → "Hvor mange kom op?". Det er en kalenderopgave, fordi
det er en handling brugeren skal udføre — men en blid en.
→ Lav prioritet; dukker op, presser ikke.

### Lag 4 — Sæsonvindue + ejerskab (mulighed, ikke pligt)
Krydsning af Frøbank og måned: "Du har Marketmore i frøbanken —
juni er udplantningsmåned." Brugeren EJER frøet, vinduet er ÅBENT.
→ Formuleres som invitation, ikke ordre: "Sidste chance for
direkte såning af bønner i denne måned."

### Lag 5 — Vedligehold (rytme)
Vanding, knibning, opbinding — fra GuideCalendarRules med
recommendedMonths. → Kun vist når lag 1-4 ikke fylder dagen, eller
samlet i ugens rytme frem for dagens fokus.

### Tie-breaking inden for et lag

1. Hårdest deadline først (vinduer der lukker før andre)
2. Flest planter berørt
3. Højeste guide-prioritet (`GuideCalendarRule.priority`)

### Anti-overload-regler

- Max 3 i "dagens fokus" — resten bag fold
- En handling der blev vist i går og ignoreret, eskalerer IKKE med
  alarme-sprog. Den bliver stående roligt. Haven er ikke en indbakke.
- Brugeren kan altid afvise et forslag ("ikke i år") — og Kalenderen
  husker det for resten af sæsonen.

---

## Ny bruger uden data — degradations-stigen

Kalenderen må aldrig være tom, men den må heller ikke fake
personalisering den ikke har. Den degraderer ærligt gennem fire trin:

### Trin 0 — Ingen data overhovedet
Kilde: kun måned + platform-guides.
> "Juni i haven: tid til at udplante varmekrævende sorter.
> Drivhustomater skal opbindes. Sidste chance for direkte såning
> af bønner."

Generisk men KORREKT sæsonviden — en almanak. Plus én invitation:
"Tilføj dine frø i Frøbanken, så fortæller Kalenderen hvad der
gælder for netop din have."

### Trin 1 — Frøbank har indhold
Kilde: + InventoryItem × måned.
> "Du har Marketmore i frøbanken — juni er udplantningsmåned."

Ejerskabs-baseret. Kalenderen taler nu om BRUGERENS frø.

### Trin 2 — Aktive planter findes
Kilde: + Plant-status + GuideCalendarRules + triggers.
> "3 chili er klar — udplant i løbet af ugen.
> Tjek spirerne i såbakken (sået for 9 dage siden)."

Status-baseret. Kalenderen er nu en assistent.

### Trin 3 — Flere sæsoners historik
Kilde: + arkiverede planter, logs, spiringsprocenter pr. år.
> "Sidste år såede du tomater 18. marts — det gav høst fra 8. august.
> Vil du sigte efter samme vindue i år?"

Historik-baseret. Kalenderen er nu en mentor.

**Bemærk symmetrien:** trin-modellen matcher Havebogens hero-states
(ny → aktiv → år 2+). Hele appen modnes sammen med brugeren.

---

## Læring af tidligere sæsoner

Reglen der gør Kalenderen personlig over tid:

> **Brugerens egne datoer slår guidens defaults.**

Guides giver udgangspunktet (sowingMonths: [3, 4]). Men når brugeren
har én sæsons historik, ved systemet hvad der FAKTISK skete i netop
deres have, deres mikroklima, deres vindueskarm:

| Læringskilde | Eksempel på mentor-output |
|---|---|
| Faktisk sådato + succesfuld høst | "Sidste år såede du 18. marts — det virkede. Samme vindue i år?" |
| Spiringsprocent pr. sort | "Din chili-spiring ligger på 75% — så 2-3 frø ekstra pr. ønsket plante." |
| Faktisk udplantningsdato vs. vejret der fulgte | "Du plantede ud 3. juni sidste år uden problemer — i år er jorden lige så varm nu." |
| Log-mønstre (skadedyr, sygdom) | "Sidste år i maj åd sneglene dine dahliaer — tjek dem i denne uge." |
| Høst-vinduer | "Dine San Marzano gav høst 8. august - 20. september sidste år." |

Implementerings-princip: læringen er **afledte data, ikke ny
registrering**. Alt ovenfor kan beregnes fra logs der allerede
eksisterer — brugeren skal ikke gøre noget ekstra for at "træne"
sin mentor. Registreringsfilosofien gælder: registrér én ting,
systemet lærer fem ting.

---

## Mere værdifuld år for år

Det er Kalenderens — og dermed Potalots — egentlige forretningsmodel
som produkt: **byttehandlen mellem registrering og hjælp.**

```
År 0:  Almanak     — korrekt sæsonviden, generisk
År 1:  Assistent   — handler om DINE planter og DINE frø
År 2:  Mentor      — sammenligner med DIN historik, forudser,
                     advarer før problemer gentager sig
År 3+: Hukommelse  — "du sår tidligere end de fleste, og det
                     virker for dig" — mønstre på tværs af år
```

Hvert års registrering gør næste års kalender klogere. Det er
grunden til at brugeren registrerer — ikke pligt, men investering.
Og det er det Excel aldrig kan: Excel husker tal; Kalenderen
omsætter dem til timing.

Sæsonrapporter ("Min Have 2026") og Havebogens år-til-år-fortællinger
trækker på de samme afledte data — én investering, tre afkast.

---

## Grænseregler (fra sektion-roller.md — gentaget fordi de er hellige)

1. **Kalender formulerer alt som handling i bydeform**: udplant,
   prikl, vand, høst, så, dæk. Aldrig tilstande ("3 chili er klar"
   — det er Planters sætning).
2. **Kalenderen viser ikke plantestatus-oversigter.** Den linker til
   Planter når brugeren vil se hvordan planterne har det.
3. **Kalenderen er ikke Havebogens fortæller.** "Sidste år såede
   du..." bruges KUN som begrundelse for en handling i dag — aldrig
   som mindefortælling (det er Havebogens job).

---

## Hvad Kalenderen ALDRIG må blive

- ❌ En generisk todo-app (Todoist findes)
- ❌ En statisk kalender (Google Calendar findes)
- ❌ Et fortrykt have-skema der ignorerer brugerens faktiske have
- ❌ En notifikations-maskine der skaber dårlig samvittighed
- ❌ En side der altid har opgaver (stilhed er en feature)
- ❌ En kopi af Planter-siden med andre ord

---

## Implementerings-spor (datafundament før UI)

Rækkefølgen afspejler afhængigheder — intet af dette er UI-arbejde:

1. **Task-afledning fra status** (lag 2): funktion der oversætter
   Plant-status → handlings-formulering via grænsereglen. Ingen ny
   data — ren afledning.
2. **Trigger-evaluering** (lag 2+3): GuideCalendarRule.trigger +
   relativeOffsetDays evalueret mod SowingEvent/PlantLog-datoer.
   Verifikations-prompten fra `registrering.md` er et specialtilfælde.
3. **Frøbank × måned-krydsning** (lag 4): InventoryItem.guideId →
   GuideQuickFacts.sowingMonths/directSowingMonths → invitation.
4. **Prioriterings-funktionen**: lagene 1-5 + tie-breaking + max 3.
5. **Historik-afledning** (trin 3): forrige års datoer pr. sort →
   "samme vindue i år?"-forslag. Kræver count-feltet fra
   `registrering.md` for spiringsprocent-delen; resten kan bygges nu.
6. **Vejr-integration**: V2+ — lag 1 fungerer uden (frost-månederne
   er kendte), men bliver skarpere med.

Trin 1-4 kan bygges på eksisterende datamodel uden skemaændringer.
