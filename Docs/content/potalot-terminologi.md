# Potalot terminologi-standard (ANNA-LÅST 11/8 2026)

Én beslutning pr. begreb — truffet efter tekst-auditten
(`potalot-text-audit.csv`). Al ny copy og alle korrektur-batches følger
denne liste. Afvigelser i eksisterende tekst rettes batch for batch, IKKE
som blind masse-erstatning.

| Begreb | Potalot-standard |
|---|---|
| Brand | **Potalot** (aldrig "PotAlot") |
| Gartner | **Gartneren** / **Potalot-gartneren** |
| Teknologi | Undgå **AI** i almindelig brugerflade |
| Eksempel | **fx** (aldrig "fx.", "Fx.", "F.eks.") |
| Guide | **guide / guides** (ikke "guider") |
| Guide-type | **artsguide / sortsguide / teknikguide** |
| Før såning | **forkultivering** som standard — se nuance nedenfor |
| Milepæl | **Pottet om** (ikke "Ompottet") |
| Handlinger | **Redigér / Annullér** (med accent) |
| Arbejde | **opgave / opgaver** (aldrig "tasks", "to-do") |
| Gamification | **udfordring** (ikke "challenge") |
| Frøbank-objekt | **frøpost** (ikke "element", "items") |
| Planteside | **Plantens historie** |
| Registreringshandling | **Log** / **Log nyt på planten** er OK |
| Tekniske tags/slugs | translitteration (ae/oe/aa) er OK internt |
| Synlige tags/navne | altid korrekt dansk **æ/ø/å** |
| Såsted/såtid | **såsted / såtid** (aldrig "så-sted", "så-timing") |
| Voksested | **voksested/dyrkningssted** — aldrig automatisk "bed" |
| Spiringsfase | **Venter på spiring** (brugerorienteret, ikke "Spiringsfasen") |

## Nuancer (Annas afgørelser)

- **"Log" forbydes IKKE.** Modellen er etableret og forståelig:
  *Log nyt på planten* = handlingen · *Plantens historie* = resultatet.
  Forsøg ikke at kalde begge dele "historie".
- **forspiring ≠ forkultivering i alle tilfælde.** De overlapper, men
  erstat ALDRIG blindt — kig på den konkrete forekomst.
  Læggekartofler *forspires* (kartoffel.md bruger termen korrekt).
- Interne id'er/slugs (fx `vinduskarm`, tags som `rodafgroede`) ændres
  ikke — kun de viste labels skal have korrekt dansk.
- **Statuscopy-princip (Anna 11/8):** *"Handling lykkedes. Hvad sker der
  nu?"* — bekræftelse først, dernæst næste tilstand, adskilt med punktum.
  Aldrig tankestreg, der får to systemtilstande til at ligne én overskrift
  (fx "Gemt. Gartneren ser på det …", ikke "Gemt — Gartneren kigger på det").
- **Intet minimumsantal råd (Anna 11/8, motor-regel):** "Lige nu"/"Denne
  uge" må vise 0-3 punkter. Ved Potalot kun én relevant ting, vises én
  ting; ved ingenting vises intet — aldrig "Bind op ved behov"/"Vand
  jævnt"-fyld for at nå tre linjer. Software har en dyb eksistentiel
  angst for tom plads; Potalot har ikke.
- **Karakterlaget (Anna 11/8, redaktionel regel):** Potalot må gerne
  personificere planten ("Hidsig · Frugtig · Krævende", "Temperament:
  Rolig") — det er en del af brandet. Men personificeringen må ALDRIG
  snige faglige påstande ind: "Nem", "bitterfri", "sødest et minut
  efter" er dyrknings-/sortspåstande og skal være groundet i data —
  ellers ud. Faktafelter præcise og datadrevne; karaktertekster legende.
  Vi polerer IKKE Potalot ned til en neutral havebog.
- **Demo-reglen (Anna 11/8):** Demo-observationer må være konkrete
  ("Alle fire planter klarede flytningen"); demo-RÅD og sammenligninger
  skal følge samme faglige standard som resten af Potalot.
- **Datagæt-princip (Anna 11/8, GAR-0017):** et interval fra en kilde
  (fx sådybde "2-5 mm") må ALDRIG konverteres til ét tal — intet
  gennemsnit/min/maks. Enkeltværdi → strukturert felt; interval → null
  (v1: værdien importeres ikke; maskinudtrukket metadata må ikke fylde
  brugerens eget notatfelt).

## Status

- P0-rettelserne fra auditten (KAL-0125, SYS-0319, GED-0761, GED-1229,
  GED-0387, GED-1058) er implementeret 11/8 efter Annas godkendte ordlyd
  (cikorie-sektionen slettet — typerne var allerede forklaret; pak choi
  omskrevet til ren botanisk skelnen).
- Korrektur-rækkefølge: **Gartneren (alle 163 rækker, fokus på de 15
  flaggede)** → Frøbank → Planter. Arbejdskopi med beslutningskolonner
  vedligeholdes af Anna; masterfilen `potalot-text-audit.csv` forbliver
  urørt census.

## Kalenderens låste regler (Anna 11/8)

1. **Vejrtekst kræver faktiske vejrdata.** Ingen hardcodede tal eller
   vejrpåstande som fallback — varsler (GardenAlerts) er de eneste
   gyldige signaler; intet varsel = ingen vejrnote, ingen målings-tal.
2. **"Denne uge"/adaptive råd kræver et aktuelt signal** (brugerdata,
   guidefakta, kalenderdata eller vejr). Sæsonprosa må aldrig forklædes
   som ugentlig intelligens eller "aktuel vurdering".
3. **Kalenderen må vise færre råd.** Ingen filler for at fylde et
   bestemt antal cards/chips.
4. **Dynamiske arts-/sortsnavne må aldrig lowercases mekanisk** — byg
   sætninger, der ikke kræver det ("Så ${navn} nu", ikke "Tid til at så
   ${navn.toLowerCase()}").
5. **Frøbank-/guidefakta må udløse timing, ikke løfter.** "Såvinduet er
   åbent" er data; "sår du nu, når den at give i år" er en slutning.
6. **Kurateret månedscopy må være legende** — personlighed er ikke et
   korrekturproblem.
7. **Botaniske inspirationspåstande skal have en kilde** — hele
   src/lib/inspiration.ts behandles som redaktionelt datasæt (fagligt
   systemtjek udestår), ikke som fri UI-copy.
8. **Legacy slettes, ikke smukkeseres.**
