# Datakilder til postnummeropslag

Postnummer → stednavn + omtrentlig koordinat (til lokalt vejr og frostvarsler)
slås op i en **lokal, versioneret tabel**. Der er ingen kørselsafhængighed.

Baggrund: DAWA (`api.dataforsyningen.dk/postnumre`) er lukket og svarer HTTP 410
(verificeret 6/11 2026). Alternativerne kræver nøgle/kvote (Datafordeler,
Danadresse), er uden driftsgaranti (Zippopotam) eller har ikke-kommercielle
vilkår (Open-Meteo geokodning, og kun 98 % dækning).

## `geonames-dk/` — kilden tabellen bygger på

| | |
|---|---|
| Kilde | GeoNames postal codes, Danmark — <https://www.geonames.org/> |
| Hentet fra | <https://download.geonames.org/export/zip/DK.zip> (indeholder `DK.txt` + `readme.txt`) |
| Licens | Creative Commons Attribution 4.0 — <https://creativecommons.org/licenses/by/4.0/> |
| Hentet / opdateret | se `geonames-dk/KILDE.json` (`hentetDato`, `serverLastModified`, `sha256`) |
| Format | tab-separeret, 12 kolonner; vi bruger 2 = postnummer, 3 = stednavn, 10 = bredde, 11 = længde |

`DK.txt` er committet **uændret** — det er præcis den version, tabellen er
bygget af. `KILDE.json` har filens sha256; importscriptet og `npm test` fejler
hvis de ikke passer sammen.

### Genskab tabellen (offline, fra den committede kildefil)

```bash
npx tsx scripts/import-postnumre.ts
```

Skriver `src/data/postnumre-dk.generated.ts`. Regenerér altid — merg aldrig
filen på tværs af branches.

### Hent en ny version fra GeoNames (fx én gang om året)

```bash
npx tsx scripts/import-postnumre.ts --hent
npm test
```

`--hent` bruger `curl` og `unzip`, overskriver `DK.txt`, `readme.txt` og
`KILDE.json`, og bygger tabellen. Gennemse `git diff` på den genererede fil
før commit (nye/fjernede postnumre) og kør `npm test`.

Skulle GeoNames-adressen engang forsvinde, er den committede `DK.txt` stadig
den komplette kilde. Postnumre ændrer sig sjældent.

### Udeladte postnumre

Importscriptet udelader postnumre, der ikke svarer til et sted man har en have,
eller hvor GeoNames' koordinat ikke passer til navnet (alle `0xxx`, "Udland",
"Pakkecent", "Centraltastning"). De står i `POSTNUMRE_UDELADT` med begrundelse,
og opslag giver `null`. Fx ligger `0900 København C` i GeoNames ved Aalborg og
`0999 København C` ved Frederikshavn — det ville give en forkert vejrudsigt.

## `dagi-postnumre-reference.csv` — kontrolsæt til dækningstesten

589 *geografiske* postnumre med stednavn, udtrukket fra en tredjeparts-kopi af
DAGI-postnummerinddelingen:
<https://github.com/Neogeografen/dagi/blob/master/geojson/postnumre.geojson>
(hentet 6/11 2026, sha256 `2784f96f1d23d035225b7fc384b42130110b423eda03c512f65085aed45620ad`).

Kopien er ældre og ikke officiel; den bruges kun som uafhængig kontrol af, at
alle almindelige danske postnumre findes i tabellen med samme stednavn.
Genskab CSV'en med:

```bash
npx tsx scripts/import-postnumre.ts --lav-reference <sti-til-postnumre.geojson>
```

## Hvad tabellen IKKE er

Koordinaten er et *omtrentligt* punkt for postnummerområdet (typisk inden for
nogle få km af områdets midte), ikke en adresse. Det er rigeligt til lokalt
vejr; vi gemmer aldrig brugerens adresse.
