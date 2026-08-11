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

## Nuancer (Annas afgørelser)

- **"Log" forbydes IKKE.** Modellen er etableret og forståelig:
  *Log nyt på planten* = handlingen · *Plantens historie* = resultatet.
  Forsøg ikke at kalde begge dele "historie".
- **forspiring ≠ forkultivering i alle tilfælde.** De overlapper, men
  erstat ALDRIG blindt — kig på den konkrete forekomst.
  Læggekartofler *forspires* (kartoffel.md bruger termen korrekt).
- Interne id'er/slugs (fx `vinduskarm`, tags som `rodafgroede`) ændres
  ikke — kun de viste labels skal have korrekt dansk.

## Status

- P0-rettelserne fra auditten (KAL-0125, SYS-0319, GED-0761, GED-1229,
  GED-0387, GED-1058) er implementeret 11/8 efter Annas godkendte ordlyd
  (cikorie-sektionen slettet — typerne var allerede forklaret; pak choi
  omskrevet til ren botanisk skelnen).
- Korrektur-rækkefølge: **Gartneren (alle 163 rækker, fokus på de 15
  flaggede)** → Frøbank → Planter. Arbejdskopi med beslutningskolonner
  vedligeholdes af Anna; masterfilen `potalot-text-audit.csv` forbliver
  urørt census.
