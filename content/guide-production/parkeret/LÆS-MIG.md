# Parkerede guide-leverancer

Guides der er leveret, men holdt ude af `content/guides/`, fordi noget skal
afklares først. Pipelinen rører ikke denne mappe — `guides:build` læser kun
`generated/`. Når en guide er afklaret, lægges den i `_guide-indbakke/`
og køres gennem `npm run guides:intake` som normalt.

---

## `ananaskirsebaer.json` — parkeret 24. juli 2026

**Problemet:** guiden hedder Ananaskirsebær, men beskriver konsekvent
*Physalis peruviana* — også i sammenligningsblokken "Ananaskirsebær eller
tomatillo?". Det er to forskellige dyrkningsafgrøder:

| | Art | Vokseform | Sæson |
| --- | --- | --- | --- |
| **Ananaskirsebær** (ground cherry) | *Physalis grisea*, syn. *P. pubescens* | lav og busket | tidligere, modne frugter falder af sig selv |
| **Kapstikkelsbær** (cape gooseberry) | *Physalis peruviana* | høj, 1,5–2 m | sen, kræver lang varm sæson |

Batch 10-briefen bad udtrykkeligt om at få dette kontrolleret, og nævnte
sorterne Aunt Molly's og Goldie — begge ground cherries, altså
*P. grisea*-typen. Leverancen ramte den anden art.

**Det skal afgøres, ikke gættes.** To veje:

1. **Behold navnet Ananaskirsebær** → latinsk navn rettes til *Physalis
   grisea*, og dyrkningsteksten skal skrives om: lavere plante, tidligere
   modning, frugtfald som høstsignal, mindre drivhusafhængig. Det er ny
   research, ikke en tekstrettelse.
2. **Omdøb til Kapstikkelsbær** (slug `kapstikkelsbaer`) → indholdet passer
   allerede; kun navn, slug og summary skal rettes. Men så mangler
   ananaskirsebær stadig som guide, og de ønskede sorter hører til den.

Vej 2 er den billige; vej 1 er den, briefen bad om.

**Tomatillo** (samme batch) er derimod korrekt: *Physalis philadelphica*,
egen guide, med bestøvningsafsnittet om at der skal mere end én plante til.
Den er importeret.
