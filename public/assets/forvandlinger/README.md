# Forvandlinger-billedbibliotek

Asset-system til Forvandlinger-mosaikken i Havebog. **Ikke** en løs billedmappe:
registret (`FORVANDLING_ASSETS` i `src/lib/forvandling-registry.ts`) beskriver
hvert billedes rolle, så mosaikken kan vælge smart og falde pænt tilbage.

## Format

Tiles beskærer object-cover fra midten til **3:4 højformat** (lead) og
**1:1 kvadrat** (alm. tiles). Levér **3:4 højformat (fx 1200×1600) eller
kvadrat, motiv centreret med margin** — bredformat mister op mod halvdelen
af billedet. Fuld formatspec: se SHOOTLIST.md.

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
(`src/lib/forvandling-registry.ts`) med `crop`, `role`, `path`, `useCases`.
Ingen komponent-ændring nødvendig — selektorerne opdager det automatisk.

**Resultatfotos til forvandlinger, der endnu ikke er skrevet** (fx en
tærte til en kommende blåbær-forvandling): registrér dem UDEN
`'forvandling'`-tagget (kun `mosaic`/`recipeTile`), så de ikke crop-matcher
ind på et forkert kort (fx en suppe på "Gem ærtefrø"). Når forvandlingen
skrives, bindes fotoet med `forvandlingId` + `useCases: ['forvandling']`.
Forkert billede er værre end intet billede.

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
- **Kategori/mood-foto:** læg i `mood/` som `{kategori}-{beskrivelse}-{nr}.jpg`
  (fx `plej-hudpleje-01.jpg`, `duft-olier-01.jpg`) og tilføj en linje i
  `FORVANDLING_KATEGORI_ASSETS` (`src/lib/forvandling-assets.ts`).
  FØRSTE match pr. kategori vinder — primærfotoet skal stå øverst.

Uden `'forvandling'`-taggede fotos falder alle forvandlings-tiles til farve-
posteren (kategori-farve) — det nuværende, godkendte udseende. Læg ét foto ind
+ tag det, så begynder den tile at vise foto. Ingen komponent-ændring nødvendig.
