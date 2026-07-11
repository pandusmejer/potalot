# POTALOT MASTER SPEC

## 1. Produkt
Potalot er en have-app / et have-OS til hobbygartnere, selvforsynere og entusiaster.
Formålet er at samle frøbank, dyrkningsguides, kalender, noter, idébank og høstoverblik ét sted.

## 2. Kerneprincip
Appen skal være enkel at bruge i hverdagen og stærk nok til at blive et reelt planlægningsværktøj.
Alt skal kunne bygges modulært.

## 3. Primære moduler
- Dashboard
- Frøbank / Beholdning
- Dyrkningsguide-bibliotek
- Kalender / To-do
- Noter
- Idébank
- Høstkurv
- Community (valgfrit)
- Settings / Modes

## 4. Frøbank / Beholdning
### 4.1 Hierarki
Niveau 1:
- Frø
- Planter
- Løg
- Knolde
- Stauder
- Træer
- Buske

Niveau 2 eksempel under Frø:
- Krydderurter
- Grøntsager
- Frugt
- Bær
- Blomster

Niveau 3 eksempel under Grøntsager:
- Tomater
- Agurker
- Chili
- Salat
- Kål

Niveau 4:
- Sort / Variety

### 4.2 Felter
- Titel
- Niveau 1
- Niveau 2
- Niveau 3
- Sort
- Brand
- Antal i pose
- Antal sået
- Automatisk antal tilbage
- Udløbsdato
- Purchase link / Stock up link
- Knyttet dyrkningsguide
- Noter
- Måneder for:
  - Forspiring
  - Såning
  - Ompotning
  - Udplantning
  - Høst

## 5. Dyrkningsguides
- Guider skal lagres centralt
- De skal ikke genereres for hver bruger hver gang
- De opbygges efter samme skabelon
- En guide skal kunne kobles til et frø eller en plantepost i beholdningen

### Guide-skabelon
- Kort beskrivelse
- Forspiring
- Såning
- Sådybde
- Ompotning
- Udplantning
- Placering
- Jord og gødning
- Vanding
- Høst
- Tips

### 5.1 Billedstrategi for sortguides (beslutning)
Tidligere oplæg var 12 billeder pr. sort (1 frøkort + 1 plantekort + 5 makro + 5 bleed).
Det er overkill: 100 sorter = 1.200 billeder, 500 sorter = 6.000. Produktionsbyrden
står ikke mål med læringsværdien, og brugere ser sjældent længere end billede 1-3.

**Beslutning: 3 masterbilleder pr. sort + 1 hero pr. art.**

Pr. art (univers):
- 1 hero-foto

Pr. sort:
- 1 frøkortfoto — identitet / katalog / frøbank
- 1 plantekortfoto — planten i vækst
- 1 makrofoto — stemning, læring, detalje, tekstur

Alt øvrigt visuelt (sortguide-hero, baggrunde til infobokse, "på denne dag",
thumbnails, bleed-sektioner) **genereres som crops af masterbillederne** — ikke
som selvstændige fotos.

**Regler:**
- **Bleed som selvstændig fotokategori slettes helt.** Høj produktionsomkostning,
  leverer kun stemning — og stemning skabes bedre via crop + blur af makrofotoet.
- **Crop-tricket har begrænset rækkevidde.** Øjet genkender kildebilledet. Det
  holder usynligt til blur/overlay-baggrunde og thumbnails, men to *skarpe* crops
  fra samme master side om side (fx hero + detalje på samme skærm) afslører sig selv.
- **Default: 1 makro pr. sort.** Tillad et 2. makro (én "frugt/blomst" + én
  "detalje/struktur") **kun** for de ~15-20% af sorterne hvor ét billede ærligt
  talt ikke kan bære guiden. Giver ~3,2 billeder pr. sort i snit.
- Makrofotoet skal skydes stort nok og med safe zones, så det kan beskæres til
  fuld visning, 16:9 hero, 4:5 vertikal, ultra-tæt tekstur og blur-baggrund.

**Princip:** Et komplet bibliotek slår et perfekt bibliotek der aldrig bliver færdigt.
Færre assets, hver gennemtænkt og genbrugt mange steder.

## 6. Kalender / To-do
- To-do-liste skal kunne genereres ud fra frøbankens måneder
- Completion-dato skal registreres automatisk
- Brugeren skal kunne se historik år for år
- Brugeren skal kunne lære af timing og trivsel

## 7. Modes
Ved oprettelse kan brugeren vælge fx:
- Mindful
- Hardcore to-do-ist
- Selvforsyneren
- Den sociale gartner
- Tomatentusiasten
- Jord-til-bord
- Skærehaveisten

## 8. Community
- Skal være valgfrit
- Brugernavn fremfor persondata
- Standardiserede avatars/ikoner
- Lokale filtre
- Frødeling og inspiration
- Relevante notifikationer baseret på interesser, fx chili-entusiaster

## 9. Høstkurv
- Estimeret høst ud fra registreret såtid og høstperiode
- Forslag til retter og menuer baseret på det brugeren dyrker

## 10. Voice
- Diktat til noter
- Oplæsning af dyrkningsguides
- Spørgsmål som “hvor dybt skal chili sås?”

## 11. Teknisk retning
- Next.js frontend
- Netlify deploy
- Supabase backend/datamodel
- Modulær opbygning
- Først hårdkodet UI, derefter databinding

## 12. MVP fase 1
- Dashboard
- Frøbank
- Dyrkningsguide-bibliotek
- Kalender / To-do
- Idébank

## 13. MVP fase 2
- Høstkurv
- Voice
- Community light
- Vejr / mobilkalender integration

## 14. Arbejdsregel
Alt nyt skal først i IDE_BANK.md, derefter BACKLOG.md, derefter implementeres.