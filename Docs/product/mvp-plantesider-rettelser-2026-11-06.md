# MVP 1.0 — tre rettelser på plantesiderne (release/mvp-1.0, 6/11 2026)

Baggrund: audit af Mine planter fandt to fejl, der også findes i den oprindelige app (ikke introduceret af MVP), og en uoverensstemmelse i MVP'ens nye guidekort. Anna godkendte tre mindre rettelser. Udført KUN på `release/mvp-1.0`; ingen billeder tilføjet, omdøbt eller slettet; ingen databaseændringer.

## 1. San Marzano — makrobilleder (`src/data/plant-detail.ts`)
De fem referencer (`y-led`, `blad-dug`, `frugtknop`, `klase`, `umodne`, alle `.jpg`) pegede på filer, der aldrig har eksisteret (404). Rettet til eksisterende fotos, hvor motivet er set og passer til beskrivelsen:

| Beskrivelse | Før (404) | Nu | Motiv |
|---|---|---|---|
| Kraftigt Y-led på stænglen | `y-led.jpg` | `led-haar.jpg` | Y-formet stængelled med hår |
| Morgendug på bladene | `blad-dug.jpg` | `blad.jpg` | blad med dugdråber |
| Første frugtknop | `frugtknop.jpg` | `tidlig-frugt.jpg` | tidlig frugtsætning med bæger |
| Klase med unge frugter | `klase.jpg` | `klase-umodne.jpg` | grøn klase |
| Umodne grønne San Marzano | `umodne.jpg` | `sigle-umoden.jpg` | enkelt grøn frugt |
| "Lige nu"-foto (Begyndende blomsterknop) | `frugtknop.jpg` | `tidlig-frugt.jpg` | samme fil som galleriet |

Ikke brugt (motivet passer ikke): `klase-modne` og `overflade` (røde, modne frugter). Bemærk: "Begyndende blomsterknop"-billedet viser tidlig frugtsætning med en lukket blomst ved siden af — tæt på, men ikke ordret en ren blomsterknop; bevidst bevaret som samme fil som galleriets "Første frugtknop" i stedet for at udelade "Lige nu"-fotoet.

## 2. Neckargold — guide-resolver (`src/lib/plant-detail/resolve-guide-href.ts`)
`resolvePlantGuideHref` brugte plantens eksplicitte `guideId` uden at tjekke, at guiden findes (`stangboenne-neckargold` findes ikke → 404). Nu bruges et eksplicit `guideId` KUN hvis guiden findes i biblioteket, eller hvis det er en brugerguide (UUID-id); ellers falder opslaget videre til sorts-guide → arts-guide → `/guides`. Sortsguide-link bevares, når den findes. Neckargold peger nu på artsguiden `/guides/boenne`.

## 3. Habanero — guidekort (`froebank-autofill.ts`, `plante-kort-guide.ts`, planteside)
Kortet sagde "sorten findes ikke i biblioteket", mens linket (via `guideId`) pegede på `chili-habanero-orange`. Rodårsag: to opslag med forskellige regler (navnematch vs. eksplicit kobling). Rettet uden parallel regel: `slaaGuiderOp` (det fælles opslag) tager nu et valgfrit `guideId`; en eksplicit kobling vinder over navnematch, ellers uændret (frøposer kalder uden `guideId`). `kortGuideForPlante` videregiver plantens `guideId`. Habanero viser nu "Fra guiden til Habanero Orange, med arv fra chili" uden note.

## Tests
`test-plante-oversigt.ts` (+4: eksplicit kobling, ukendt kobling ignoreres, artskobling) og `test-arts-model.ts` (+4: resolverens fald, bevaret sortslink, UUID-bruger-guide, `/guides` som sidste udvej). `npm test`: 1.075 ✓ (før 1.067).

## Ikke rettet (eksisterende, uændret mellem MVP til/fra)
15 døde guide-til-guide-links (planlagte teknikguides som `forspiring`, `ompotning`, `knibning-af-agurker`, `opbinding-af-dahlia` m.fl. findes ikke) — kendt "2A2 døde links"-spor; ikke en MVP-fejl.
