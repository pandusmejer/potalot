# Spisekammer-billedbibliotek

Asset-system til Spisekammer-mosaikken i Havebog. **Ikke** en løs billedmappe:
registret (`src/lib/spisekammer-assets.ts`) beskriver hvert billedes rolle, så
mosaikken kan vælge smart og falde pænt tilbage.

## Mappestruktur

```
public/assets/spisekammer/
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

Læg filen i den rette mappe og tilføj én linje i `SPISEKAMMER_ASSETS`
(`src/lib/spisekammer-assets.ts`) med `crop`, `role`, `path`, `useCases`.
Ingen komponent-ændring nødvendig — helper'en `selectSpisekammerAssets` opdager
det automatisk.

## Fallback (mosaikken knækker aldrig)

1. sortspecifikt billede → 2. afgrøde/art-billede → 3. stemnings-/mood-billede →
4. farve-/typografi-tile (CROP_FARVE).

Indtil rigtige spisekammer-fotos produceres, seeder registret de eksisterende
botaniske makroer (`/images/makro/…`), så systemet virker i dag uden dead-images.
