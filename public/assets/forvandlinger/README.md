# Forvandlinger-billedbibliotek

Asset-system til Forvandlinger-mosaikken i Havebog. **Ikke** en løs billedmappe:
registret (`src/lib/forvandlinger-assets.ts`) beskriver hvert billedes rolle, så
mosaikken kan vælge smart og falde pænt tilbage.

## Mappestruktur

```
public/assets/forvandlinger/
  crops/        afgrøde-fotos (frugt, plante, blad, blomst, køkken)
    tomat/  agurk/  jordbaer/  salat/  chili/  basilikum/  squash/  aerter/  ribs/  kartoffel/
  mood/         stemning/detalje (sommerlys, køkkenbord, dug, hånd-med-høst)
  graphics/     papir-tekstur, farvefelter, ornamenter
```

## Filnavngivning

`{crop}-{role}-{number}.jpg` — lowercase, ingen æøå (brug ae/oe/aa), bindestreger
(ikke underscores), nummer `01`, `02`…

Roller: `frugt · plante · blad · blad-dug · blomst · koekken · haand · kurv · stemning`

Eksempler: `tomat-frugt-01.jpg` · `jordbaer-blomst-01.jpg` · `agurk-koekken-01.jpg`

## Startpakke (~4 billeder pr. vigtig afgrøde)

Prioritér: tomat · agurk · jordbaer · salat · chili · basilikum · squash · aerter · ribs · kartoffel.
Pr. afgrøde: 1 frugt/afgrøde · 1 plante · 1 detalje · 1 køkken.

## Registrér nye billeder

Læg filen i den rette mappe og tilføj én linje i `FORVANDLING_ASSETS`
(`src/lib/forvandlinger-assets.ts`) med `crop`, `role`, `path`, `useCases`.
Ingen komponent-ændring nødvendig — helper'en `selectForvandlingerAssets` opdager
det automatisk.

## Fallback (mosaikken knækker aldrig)

1. sortspecifikt billede → 2. afgrøde/art-billede → 3. stemnings-/mood-billede →
4. farve-/typografi-tile (CROP_FARVE).

Indtil rigtige forvandlinger-fotos produceres, seeder registret de eksisterende
botaniske makroer (`/images/makro/…`), så systemet virker i dag uden dead-images.

## Forvandlinger-tiles ("Det kan haven blive til")

Forvandlings-tiles i mosaikken bruger en SEPARAT selektor,
`selectForvandlingAssets` (`src/lib/forvandling-assets.ts`), med samme fallback:
sort → afgrøde → kategori/mood → farve-tile.

For at et foto må bruges på en forvandlings-tile (og ikke bare på de generiske
crop-foto-tiles) skal det **eksplicit tagges**:

- **Afgrøde-/sort-foto:** læg i `crops/{afgrøde}/` og registrér i
  `FORVANDLING_ASSETS` med `useCases: ['forvandling', …]`.
- **Kategori/mood-foto:** læg i `mood/` som `{kategori}-stemning-01.jpg` og
  tilføj en linje i `FORVANDLING_KATEGORI_ASSETS` (`forvandling-assets.ts`).

Uden `'forvandling'`-taggede fotos falder alle forvandlings-tiles til farve-
posteren (kategori-farve) — det nuværende, godkendte udseende. Læg ét foto ind
+ tag det, så begynder den tile at vise foto. Ingen komponent-ændring nødvendig.
