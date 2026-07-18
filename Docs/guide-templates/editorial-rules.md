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
