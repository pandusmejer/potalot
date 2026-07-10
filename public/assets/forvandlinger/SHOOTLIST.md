# Forvandlinger — shootliste (top 30)

Første billedpakke. Ikke 200 billeder — bare nok til at systemet virker uden at
ligne en tom kulisse. Prioritering: **haven først, forvandlingen bagefter.**
Afgrøder/planter → processer (tørring, frø, syltning, bundter, glas) → få
resultatbilleder (sorbet, olie, te, duftposer).

Læg filen i den angivne sti, og tilføj registrerings-linjen (kolonnen længst til
højre) i det rette registry. Så snart et foto er tagget `'forvandling'`, viser
den forvandlings-tile foto i stedet for farve-poster — ingen komponent-ændring.

- **Afgrøde-fotos** → `FORVANDLING_ASSETS` (`src/lib/forvandling-registry.ts`)
- **Mood/kategori-fotos** → `FORVANDLING_KATEGORI_ASSETS` (`src/lib/forvandling-assets.ts`)

`rolle` = registry-feltet `role` (styrer valg-ranking: fruit > plant > kitchen >
leaf > flower). Filnavnets beskrivelse (plante/toer/froe/sauce…) er kun for
mennesker.

## Afgrøde-fotos (`crops/{afgrøde}/`)

| # | Motiv | Sti | rolle | Fodrer |
|---|---|---|---|---|
| 01 | Tomater på planten | `crops/tomat/tomat-plante-01.jpg` | plant | (fra haven) |
| 02 | Tomater i skål på køkkenbord | `crops/tomat/tomat-koekken-01.jpg` | fruit | tomatsalat, gazpacho |
| 03 | Tomatfrø på papir | `crops/tomat/tomat-froe-01.jpg` | texture | gem-tomatfrø |
| 04 | Tomatsauce i glas | `crops/tomat/tomat-sauce-01.jpg` | kitchen | tomatsauce |
| 05 | Agurk på planten med blomst | `crops/agurk/agurk-plante-01.jpg` | plant | (fra haven) |
| 06 | Agurker i kurv/skål | `crops/agurk/agurk-koekken-01.jpg` | fruit | agurkesalat |
| 07 | Agurker i sylteglas | `crops/agurk/agurk-sylt-01.jpg` | kitchen | syltede-agurker |
| 08 | Jordbær på planten | `crops/jordbaer/jordbaer-plante-01.jpg` | plant | (fra haven) |
| 09 | Jordbær i skål | `crops/jordbaer/jordbaer-koekken-01.jpg` | fruit | jordbaertaerte |
| 10 | Jordbær klar til frysning | `crops/jordbaer/jordbaer-frys-01.jpg` | kitchen | frys-jordbaer |
| 11 | Jordbærsorbet i enkel skål | `crops/jordbaer/jordbaer-sorbet-01.jpg` | kitchen | (resultat) |
| 12 | Basilikum tæt på blade | `crops/basilikum/basilikum-plante-01.jpg` | plant | basilikumpesto |
| 13 | Basilikum bundt på bord | `crops/basilikum/basilikum-bundt-01.jpg` | plant | (fra haven) |
| 14 | Basilikum til tørring | `crops/basilikum/basilikum-toer-01.jpg` | plant | toer-basilikum |
| 15 | Mynte frisk | `crops/mynte/mynte-plante-01.jpg` | plant | (fra haven) |
| 16 | Mynte hængt til tørring | `crops/mynte/mynte-toer-01.jpg` | plant | toer-mynte |
| 17 | Mynte-/kamille-te i kop | `crops/mynte/mynte-te-01.jpg` | kitchen | mynte-te |
| 18 | Lavendel i blomst | `crops/lavendel/lavendel-plante-01.jpg` | flower | (fra haven) |
| 19 | Lavendel bundtet | `crops/lavendel/lavendel-bundt-01.jpg` | flower | lavendelbundter |
| 20 | Lavendelposer/potpourri | `crops/lavendel/lavendel-duftpose-01.jpg` | flower | duftpose, lavendelpotpourri |
| 21 | Morgenfrue blomsterhoveder | `crops/morgenfrue/morgenfrue-plante-01.jpg` | flower | (fra haven) |
| 22 | Tørrede morgenfrueblade | `crops/morgenfrue/morgenfrue-toer-01.jpg` | flower | morgenfrue-salve |
| 23 | Morgenfruesalve (kosmetisk) | `crops/morgenfrue/morgenfrue-salve-01.jpg` | kitchen | morgenfrue-salve |
| 24 | Kamille i blomst | `crops/kamille/kamille-plante-01.jpg` | flower | kamille-te |
| 25 | Kamille lagt til tørring | `crops/kamille/kamille-toer-01.jpg` | flower | kamille-te |
| 26 | Chili på planten | `crops/chili/chili-plante-01.jpg` | plant | (fra haven) |
| 27 | Tørrede chilier/chiliflager | `crops/chili/chili-toer-01.jpg` | fruit | toerrede-chilier |

## Mood/fallback-fotos (`mood/`)

Redder mosaikken når intet cropfoto findes; bruges til kategori-/stemnings-tiles.

| # | Motiv | Sti | Registry |
|---|---|---|---|
| 28 | Frøposer med labels | `mood/froeposer-01.jpg` | FORVANDLING_KATEGORI_ASSETS (saa-igen) |
| 29 | Pressede blomster på papir | `mood/pressede-blomster-01.jpg` | FORVANDLING_KATEGORI_ASSETS (pynt) |
| 30 | Blandet høst på køkkenbord | `mood/koekkenbord-hoest-01.jpg` | FORVANDLING_KATEGORI_ASSETS (spis/gem) |

## Billedstil (hold konsekvent)

Premium botanisk/editorial · naturligt sidelys · creme/salvie/terracotta/støvet
rosa · lav kontrast · shallow depth of field · taktile overflader. **Ingen** hård
food styling, mennesker/hænder (i pakke 1), logoer/emballage eller tekst i
billedet (bortset fra evt. håndskrevet frøpose-label).

## Foto vs. farvefelt

- **Foto:** afgrøde/plante · proces · taktilt resultat.
- **Farve-/typografi-tile:** abstrakte idéer, sæsonstemning, "Gem sommeren lidt
  længere", kategori-overgange, og fallback når foto mangler.

En god mosaik: ~2 afgrødefotos · 2 proces-fotos · 1 resultatfoto · 1 teksttile ·
1 CTA-tile. Levende uden at blive billedspam.

## Komprimér før commit

Stående regel: nedskalér/komprimér (fx ≤1000 px bred, kvalitet ~80) hvis ingen
synlig kvalitetstab. Ingen dead-images, ingen 0-byte-placeholders.
