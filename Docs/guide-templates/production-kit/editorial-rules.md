# Redaktionelle regler for guides

Kontrakt for AI-genereret guide-indhold. Bruges både af genererings-prompten og
af den redaktionelle review-kørsel. Kode styrer struktur — disse regler styrer
indhold og tone.

## Grundprincip: art er fundament, sort er variation

1. **Artsguiden** rummer alt der gælder på tværs af sorter: vækstform,
   grundlæggende dyrkning, jord/lys/vand, forkultivering, udplantning, støtte,
   typiske problemer, høstprincipper.
2. **Sortsguiden** skriver KUN om forskellene: smag, form/størrelse, vækstkraft,
   højde, modenhedstid, udbytte, egnet sted, styrker/svagheder, hvem den passer til.
3. **Gentag aldrig artsguiden i en sortsguide.** Hvis en oplysning gælder alle
   sorter, hører den i artsguiden.
4. **Teknikguiden** forklarer ÉN handling (fx knibning, opbinding, prikling,
   hærdning) trin for trin — løsrevet fra en bestemt plante. En arts- eller
   sortsguide linker til den med `:::guide` i stedet for at forklare teknikken
   selv. Gentag ikke teknikken i plantens guide, og gentag ikke plantens
   dyrkning i teknikguiden.

## Teknikguider (guideLevel: technique)

- **Handling, ikke plante.** Titlen er handlingen (`title: "Sådan kniber du
  tomater"`), ikke et plantenavn. Ingen `plantName`, `primaryCategoryId`,
  `parentSlug`, `variety` eller `quickFacts` — udelad dem alle.
- **Trin-form.** Hver sektion er typisk ét kort, imperativt trin ("Find
  sideskuddet", "Knib af"). Reader'en nummererer dem. Færre klare trin slår
  mange små. Afslut gerne med en kort "Hvorfor …?"-sektion om formålet.
- **`appliesTo`** (valgfri): slugs på de arter/sorter teknikken hører til, fx
  `["tomat"]`. Bruges til kobling — ikke til at gentage plantens fakta.
- **Links:** afslut typisk med et `:::next-guide` tilbage til arten/sorten
  (det naturlige næste skridt). `:::guide` kan pege på en beslægtet teknik.

## Fakta før poesi

- Skriv KUN ud fra kontrollerede fakta fra inputarket + artsguiden. **Opfind
  ikke botanik** — hellere udelad end gæt.
- Tal (højde, afstand, dage, temperatur) må kun stå, hvis de kommer fra input.
  Ellers udelad feltet i `quickFacts`.
- Ingen modstridende datoer/mål inden for samme guide, eller mellem sort og art.
- Tilpasset **dansk klima** (såtid, hårdførhed, høstmåneder).

## Tone (Potalot)

- Rolig, konkret, venlig. En erfaren havemakker, ikke en salgsbrochure.
- Ingen overdrivelser ("fantastisk", "den bedste"), ingen udråbstegn-energi.
- Aktivt sprog, korte afsnit. Dansk gennemgående.
- Ingen juridiske forbehold eller advarselsstempler.

## Længde

- `summary`: 1-2 sætninger, ≤ 200 tegn. Vises på kort.
- Sektioner: 2-5 korte afsnit hver. Hellere præcist end langt.

## Modulblokke i sektioner (`:::`)

Indholdet er ikke kun prosa. Fire modulblokke kan lægges **inde i en sektions
`content`-felt** (det er fri markdown). Build bevarer indholdet **ordret**;
import tolker `:::`-blokkene.

**Brug dem kun, når de hjælper læseren — ikke som obligatorisk pynt.** En guide
behøver ingen af dem, og ingen guide skal have alle fire. Hellere få, velvalgte
blokke end et botanisk dashboard.

**Links (`slug:`) må kun pege på en guide, der findes eller er planlagt** — ellers
et dødt link.

### `:::fact` — sammenligning (kræver mindst 2 kolonner)
```
:::fact{variant="comparison" title="San Marzano eller salattomat?"}
Valgfri intro-linje.

### Vælg San Marzano hvis
- du vil lave sauce
- du vil have fast frugtkød

### Vælg salattomat hvis
- du vil spise den frisk
- du vil snacke fra planten

Valgfri konklusions-linje.
:::
```

### `:::guide` — link til en teknik-guide
```
:::guide
slug: opbinding-af-tomater
title: Sådan opbinder du tomater
description: Kort beskrivelse.
:::
```
`slug` + `title` + `description` er alle påkrævet.

### `:::next-guide` — "læs videre"-pointer til ÉN guide
```
:::next-guide
slug: tomat-roma
title: Sammenlign med Roma
description: Kort tekst.
label: Læs om Roma
:::
```
`slug` + `title` + `description` + `label` påkrævet.

### `:::related-guides` — flere relaterede guides
```
:::related-guides
#### Roma
slug: tomat-roma
Kort beskrivelse.

#### Sungold
slug: tomat-sungold
Kort beskrivelse.
:::
```
Mindst ét item; hvert item = `#### overskrift` + `slug:` + beskrivelse.

### Hvilke blokke passer hvor

| Blok | Artsguide | Sortsguide | Teknikguide |
|------|-----------|------------|-------------|
| `:::fact` (sammenligning) | sortstyper (fx ranke vs. busk) | denne sort vs. et alternativ | sjældnere |
| `:::guide` (teknik) | ✅ opbinding, knibning … | ✅ | ✅ beslægtet teknik |
| `:::next-guide` | sjældnere | ✅ peg på en søster-sort | ✅ tilbage til art/sort |
| `:::related-guides` | ✅ relaterede sorter/guides | sjældnere | sjældnere |

## Sikkerheds-fakta (menneske skal tjekke)

Følgende SKAL et menneske verificere før publicering — de kan skade brugeren
hvis de er forkerte: dyrkningskalender · planteafstand · højde · hårdførhed ·
giftighed · spiselighed · sygdomme · botanisk navn · alt der varierer med dansk
klima.

## Billeder = separat spor

Guide-tekst og billeder produceres hver for sig (kobles via manifest, blandes
ikke). De tre billedtyper må ikke forveksles:

| Type | Rolle | Mappe |
|------|-------|-------|
| **Frøkort** | isoleret premium hero-objekt (produktkort) | `public/images/frokort/` |
| **Plantekort** | tæt, levende makrofoto fra plantens miljø | `public/images/plantekort/` |
| **Artsguide-billede** | HELE planten som botanisk reference (vækstform, blade, stængler, blomster, frugt) | `public/images/arts/` |

Artsguide-billedet må ikke ligne frøkortets isolerede produkt eller plantekortets
tætte makroudsnit — brugeren skal kunne genkende hele arten.

## Review-niveauer

1. **Automatisk** (`guides:validate`): felter, enums, dubletter, slug, parentSlug,
   YAML, sektioner, summary-længde, tomme quickFacts.
2. **Menneske**: sikkerheds-fakta ovenfor + at teksten følger disse regler
   (art/sort-deling, tone, ingen opdigtede tal). ChatGPT skriver indholdet;
   et menneske godkender før import.
