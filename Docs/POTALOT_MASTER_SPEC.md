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