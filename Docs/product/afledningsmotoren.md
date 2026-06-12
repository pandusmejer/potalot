# Afledningsmotoren (produktdokument, juni 2026)

> ## Status
>
> **Dette dokument vender spørgsmålet om.**
>
> Fase 1 spurgte: *Hvilke ting skal brugeren kunne registrere?*
> Fase 2 spørger: *Hvad kan Potalot udlede af det, der allerede
> registreres?*
>
> Potalot mangler ikke flere features. Den mangler afledningslogik.
>
> Excel-tabellen bliver ikke værdifuld fordi man kan taste mere ind.
> Den bliver værdifuld når den begynder at fortælle én noget. Det
> samme gælder Potalot.

---

## Hovedpåstanden

> **80% af næste års værdi kan bygges uden én eneste ny registrering.**

Beviset står nedenfor: afledningskataloget viser at langt de fleste
afledninger kun kræver data der ALLEREDE registreres — og at en af
dem (frø-restbeholdning) allerede kører i produktion uden at vi
kaldte den en "afledning".

Målet for laget:

> **Brugeren skal føle at appen arbejder, selv når brugeren ikke gør.**

Mennesker køber funktioner. De bliver hængende for hjælp. Og de to
ting er sjældent det samme.

---

## Meta-reglen for alle fremtidige features

Før enhver ny feature designes, stilles spørgsmålene i denne
rækkefølge:

1. **Kan værdien afledes af eksisterende data?** → Byg afledningen.
2. **Kan den afledes hvis ét felt tilføjes?** → Overvej feltet
   (jf. `registrering.md`: count på PlantLog er sådan et felt).
3. **Kræver den ny registrering fra brugeren?** → Stop. Vej værdien
   mod registrerings-byrden. Oftest er svaret nej.

---

## Afledningskataloget

Status-kolonnen er ærlig: ✅ = kan bygges nu uden skemaændringer,
🔶 = kræver count-feltet fra `registrering.md`, 🔮 = kræver ny
datakilde eller AI-flow (V2+).

### Frøbank — beholdningen taler

| # | Afledning | Input (registreres allerede) | Overflade | Status |
|---|---|---|---|---|
| F1 | **Restbeholdning**: "188 frø tilbage" | seedCount − seedsSown (via SowingEvent) | Frøkort | ✅ **KØRER ALLEREDE** (`seedsRemaining` er computed) |
| F2 | **Frø-alder + spireevne-advarsel**: "Frø fra 2023 — spireevnen falder, så lidt tættere" | purchaseYear + art (guides ved hvilke arter taber spireevne hurtigt) | Frøkort + såningsforslag | ✅ purchaseYear findes; arts-holdbarhed skal i guide-data |
| F3 | **Udløber snart** | expiryDate | Frøbank-hero ("2 udløber snart") | ✅ KØRER ALLEREDE |
| F4 | **Forbrugstempo**: "Du bruger ~40 ærtefrø pr. sæson — posen rækker én sæson til" | seedsSown pr. growingYear | Frøkort + indkøbsliste | ✅ |
| F5 | **Genkøbsliste til vinteren**: sorter hvor rest < næste sæsons forventede forbrug | F1 + F4 | Sæsonrapport / januar-kalender | ✅ |

### Planter — tallene fortæller hvordan det går

| # | Afledning | Input | Overflade | Status |
|---|---|---|---|---|
| P1 | **Dage i jord** | sowDate → i dag | Plantekort ("I jord: 14 dage") | ✅ KØRER ALLEREDE |
| P2 | **Forventet næste fase**: "Spirer forventes om ~3 dage" | sowingDate + guidens germinationDays | Plantekort + Kalender | ✅ |
| P3 | **Forventet høstvindue**: "Høst forventes fra ~8. august" | sow-/plantingOutDate + guidens harvestMonths/maturityDays | Plantekort + Kalender + Havebog | ✅ |
| P4 | **Spiringsprocent**: "9 af 12 spiret — 75%" | sownCount + germination-count | Plantekort + årsstatistik | 🔶 count-felt på PlantLog |
| P5 | **Status-anomali**: "Sået for 21 dage siden, normal spiring er 7-10 — skal vi tjekke?" | sowingDate + germinationDays + fravær af germination-log | Kalender (blid prompt) | ✅ |
| P6 | **Forventet udbytte**: "6 San Marzano-planter ≈ 25-30 kg" | antal planter × typisk udbytte pr. plante | Plantekort + sæsonplanlægning | 🔮 udbytte-felt mangler i guide-data |

### Kalender — timing bliver personlig

| # | Afledning | Input | Overflade | Status |
|---|---|---|---|---|
| K1 | **År-til-år-tempo**: "Dine chili er 17 dage bag sidste år" | samme sorts log-datoer på tværs af growingYear | Kalender + Planter-detail | ✅ |
| K2 | **Personlige vinduer**: "Sidste år såede du 18. marts — det virkede" | forrige års datoer + høst-succes (harvest-log findes) | Kalender-forslag | ✅ |
| K3 | **Verifikations-prompt**: "Hvor mange kom op?" | sowingDate + germinationDays | Kalender | ✅ (spec'et i kalender-v2.md) |
| K4 | **Frøbank × måned**: "Du har Marketmore — juni er udplantningsmåned" | InventoryItem + guidens måneds-vinduer | Kalender | ✅ |
| K5 | **Personlig frost-erfaring**: "Du plantede ud 3. juni sidste år uden problemer" | faktiske udplantningsdatoer pr. år | Kalender | ✅ |

### Havebog — minderne skriver sig selv

| # | Afledning | Input | Overflade | Status |
|---|---|---|---|---|
| H1 | **År-til-år-fortælling**: "I år såede du tomater 9 dage tidligere end sidste sæson" | sowing-logs på tværs af år | Havebog hero/narrativ | ✅ |
| H2 | **Sæsonens førster**: "Første høst: 18. maj (salat)" | første log af hver type pr. år | På denne dag + årsrapport | ✅ |
| H3 | **Årsstatistik**: sorter, noter, høster pr. år | counts (kører som hero-stats) | Havebog + rapport | ✅ KØRER DELVIST |
| H4 | **Milestone-tekster**: "12 dage siden du satte agurkerne ud" | nyeste milestone-log | Havebog tidslinje | ✅ KØRER ALLEREDE |
| H5 | **Spiringshistorik pr. sort**: "75% (2026) → 92% (2027)" | P4 pr. growingYear | Havebog + sortskort | 🔶 |

### Tværgående — rapporter og identitet

| # | Afledning | Input | Overflade | Status |
|---|---|---|---|---|
| T1 | **Sæsonrapport "Min Have 2026"** | aggregering af H1-H5 + F-serien | December-rapport, delbar | ✅ (kvalitet vokser med 🔶) |
| T2 | **Have-DNA**: "Du dyrker mest tomater · foretrækker drivhus" | arter/lokationer/datoer over flere år | Rapport + profil | ✅ (kræver 2+ sæsoner data) |
| T3 | **Sortsanbefaling**: "San Marzano virker for dig — 92% spiring, høst hvert år" | succes pr. sort over år | Frøbank + januar-kalender | 🔶 |
| T4 | **AI-resumé af noter**: "Dine 14 tomatnoter kort: vanding var udfordringen i juli" | notes + Anthropic API (findes allerede i appen) | Havebog + rapport | ✅ teknisk muligt nu |

### Fremtid — kræver nye datakilder (V2+)

| # | Afledning | Mangler | 
|---|---|---|
| X1 | Foto-vækstgenkendelse ("cirka 9 spirer på dit foto") | AI-flow på billeder |
| X2 | Spisekammer ("hvidløg nok til 6 uger") | høst-mængder + forbrugslogik |
| X3 | Lokale råd (frost-varsler pr. postnummer) | vejr-integration + lokation |
| X4 | Forventet udbytte (P6) | udbytte pr. plante i guide-data |

---

## Optælling

| Status | Antal | Andel |
|---|---|---|
| ✅ Kan bygges nu (eller kører allerede) | 17 | **71%** |
| 🔶 Låses op af ÉT felt (count på PlantLog) | 4 | 17% |
| 🔮 Kræver ny datakilde | 3+ | 12% |

**Hovedpåstanden holder**: ikke bare 80% — med count-feltet er det
88% af kataloget der bygges uden at brugeren skal registrere noget
nyt overhovedet.

---

## Prioriteret rækkefølge (værdi ÷ indsats)

1. **P2 + P3 (forventet næste fase / høstvindue)** — ren aritmetik
   på eksisterende datoer + guide-data. Gør hvert plantekort
   fremadskuende. Lille indsats, daglig værdi.
2. **K3 + P5 (verifikations-prompt + anomali)** — kalender-v2's
   trin 2; gør at appen "opdager ting" selv.
3. **count-felt på PlantLog** — den ene skemaændring der låser
   4 afledninger op (P4, H5, T3 + bedre T1).
4. **K1 + H1 (år-til-år-sammenligning)** — kræver 2 sæsoner data,
   men kan bygges og testes nu mod demo-data. Det er HER
   "appen arbejder selv"-følelsen er stærkest.
5. **T4 (AI-resumé)** — Anthropic-integrationen findes; lav
   indsats, høj wow.
6. **T1 (sæsonrapport)** — december-deadline; aggregerer alt
   ovenfor. Viralitets-laget.

---

## Det afledningerne IKKE må

- ❌ Vises som rå statistik ("spiringsprocent: 75%") uden kontekst —
  afledninger formuleres i sektionens stemme (Planter: tilstand,
  Kalender: handling, Havebog: fortælling — jf. grænsereglen)
- ❌ Præsenteres som sikker viden når de er estimater — "forventes
  fra ~8. august", aldrig "høst 8. august"
- ❌ Blive et dashboard. Afledninger er sætninger der dukker op de
  rigtige steder — ikke en ny "Statistik"-side
- ❌ Straffe huller i data — manglende logs giver stilhed, ikke
  "ufuldstændig data"-advarsler

---

## Den ene sætning

> **Brugeren registrerer én ting. Potalot fortæller fem ting.**

Det er registreringsfilosofiens spejlbillede — og grunden til at
nogen gider registrere overhovedet.
