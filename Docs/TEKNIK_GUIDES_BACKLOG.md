# Teknik-guides — backlog

> ## Folk googler ikke en sort. Folk googler en handling.
>
> Teknikguides er sandsynligvis det mest værdifulde indholdslag i hele
> Potalot. De besvarer de spørgsmål folk reelt sidder og stiller i
> drivhuset med et sideskud i hånden.

**Status:** Schema-fundamentet er parkeret som V1.5 (se
[`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md)). Templaten ligger
klar i `/Users/anna/Documents/_TEMPLATE-teknikguide.md`. Indtil V1.5
aktiveres, skrives teknikguider på samme måde som sortsguider og afventer
i Anna's lokale mappe.

---

## Næste 10 (anbefalet rækkefølge efter launch)

Hvis vi skulle prioritere ud fra reel brugerværdi:

| # | Teknik | Hvorfor først |
|---|---|---|
| 1 | Forspiring | Mest googlede dyrkningsspørgsmål i marts-april |
| 2 | Ompotning | Direkte opfølgning på forspiring |
| 3 | Udplantning | Det kritiske skift mellem indendørs og udendørs |
| 4 | Knibning af tomater | Refereret fra Tomat- og San Marzano-guiderne |
| 5 | Opbinding af tomater | Refereret fra Tomat- og San Marzano-guiderne |
| 6 | Opbinding af agurker | Refereret fra Agurk-guiden |
| 7 | Bestøvning af agurker | Refereret fra Agurk-guiden |
| 8 | Hærdning af planter | Forår-kritisk for alle drivhusplanter |
| 9 | Vanding i køkkenhaven | Refereret fra Agurk-guiden |
| 10 | Gødning i køkkenhaven | Refereret fra Agurk-guiden |

De 10 vil sandsynligvis skabe mere værdi end de næste 50 sortsguider.

---

## Fuld backlog efter prioritet

### Prioritet 1 — launch + høj brugerværdi

Disse besvarer direkte de mest googlede spørgsmål.

- Forspiring
- Ompotning
- Udplantning
- Hærdning af planter
- Frøhøst
- Knibning af tomater
- Opbinding af tomater
- Opbinding af agurker
- Bestøvning af agurker

### Prioritet 2 — naturlige udvidelser

Disse blev nævnt direkte i artsguidernes indhold.

- Vanding i køkkenhaven
- Gødning i køkkenhaven
- Beskæring af agurker
- Knibning af agurker

### Prioritet 3 — sandsynlige fremtidige guides

Disse opstår naturligt når biblioteket vokser.

- Dyrkning i kapillærkasser
- Kompost til køkkenhaven
- Jordforbedring med kompost
- Sådan undgår du meldug
- Frøindsamling og frøopbevaring
- Overvintring af chili *(refereret fra Habanero Orange)*
- Opbinding af peberfrugt *(refereret fra Corno di Toro Rosso)*
- Forspiring af dahlia *(refereret fra Dahlia-artsguide — knoldvækkelse, ikke frøspiring)*
- Plukning af dahlia *(refereret fra Dahlia-artsguide)*
- Buketter med dahlia *(refereret fra Dahlia-artsguide)*
- Overvintring af dahlia *(refereret fra Dahlia-artsguide)*
- Opbinding af dahlia *(refereret fra Café au Lait — both `:::guide` and `:::next-guide`)*

> **Bemærk:** Chili-artsguiden refererer til en `goedning-af-chili`-teknik.
> Det skal afklares senere om den skal være en selvstændig guide eller
> kollapses ind i den generelle "Gødning i køkkenhaven". Lige nu er det
> et brudt link i artsguiden, som ikke fixes før V1.5-teknikfunktionen
> aktiveres.

---

## Cross-reference — hvilke teknikker er allerede linket fra eksisterende indhold

Når en teknikguide skrives, sætter den automatisk eksisterende guides
"levende" via `:::guide`-blokke der i dag peger på et endnu-ikke-skrevet
slug.

### Tomat-guiderne refererer til

- `knibning-af-tomater`
- `opbinding-af-tomater`

### Agurk-guiden refererer til

- `opbinding-af-agurker`
- `bestoevning-af-agurker`
- `vanding-i-koekkenhaven`
- `goedning-i-koekkenhaven`
- `beskaering-af-agurker`
- `knibning-af-agurker`

### Dahlia-guiderne refererer til

- `forspiring-af-dahlia` *(fra artsguide)*
- `plukning-af-dahlia` *(fra artsguide)*
- `buketter-med-dahlia` *(fra artsguide)*
- `overvintring-af-dahlia` *(fra artsguide)*
- `opbinding-af-dahlia` *(fra Café au Lait — også next-guide)*

### Chili + Peberfrugt-guiderne refererer til

- `overvintring-af-chili` *(fra Habanero Orange)*
- `opbinding-af-peberfrugt` *(fra Corno di Toro Rosso)*
- `goedning-af-chili` *(fra Chili-artsguide — afventer afklaring; se note ovenfor)*

---

## Skriveprincip

Teknikguider skrives som **konkrete svar på spørgsmål** — ikke som
opslagsværker. Hver headings er en spørgsmål brugeren stiller:

- "Hvad er det?"
- "Hvorfor gør man det?"
- "Hvornår skal man gøre det?"
- "Hvordan gør man det?" (trin-for-trin)
- "Hvilke fejl skal jeg undgå?"

Resultatet er guider man kan **bruge** — ikke guider man læser.

Det er sandsynligvis det mest værdifulde indholdslag i hele Potalot.

🌱
