# Onboarding V2 — fuld preference-onboarding (Anna-spec 13/7)

Anna-beslutning 13/7: onboarding skal IND i launch samle de tre ting Potalot skal
vide for at opføre sig intelligent fra dag ét — **hvor / hvordan / hvor meget
forstyrres**. Dette er en bevidst udvidelse af den tidligere låste onboarding-scope
(som kun var midt-sæson-import). Den eksisterende V1B-shell (5 import-indgange)
bliver **trin 6** i dette flow. Kilde: [[launch-scope-laast]], [[launch-strategi]].

## Flow (7 trin)
1. **Velkommen** — "Potalot hjælper dig med at bruge mindre tid på appen og mere
   tid i haven. Start med et par valg, så tilpasser vi oplevelsen."
2. **Hvor dyrker du?** (havetype) — Parcelhushave · Rækkehus · Kolonihave · Byhave
   · Altan · Sommerhus · Landsted · Noget andet. → senere: anbefalinger, guides, fællesskab.
3. **Lokation** — Brug min placering · Indtast postnummer · Indtast by.
   Formål: vejr, frostvarsler, lokale dyrkningsforhold, kalender.
4. **Hvad dyrker du mest?** (dyrkningsområder) — Køkkenhave · Drivhus · Højbede ·
   Krukker · Blomster · Frugt og bær · Lidt af det hele.
5. **Din dyrkerprofil** (den sjove skærm) — styrer bl.a. notifikations-mængden:
   - **Mindful 🌿** — kun det vigtigste; få påmindelser; ingen unødig støj.
     "Jeg vil dyrke have, ikke administrere den."
   - **Hjælperen 🌱** — balanceret; relevante påmindelser; vejrbaserede råd; forslag undervejs.
     "Jeg vil gerne have lidt hjælp."
   - **Haveentusiasten 🌾** — mere indsigt; flere forslag; mere statistik; flere data.
     "Jeg elsker detaljer og vil lære mest muligt."
   - **Frøsamleren 🌻** — frøbank i centrum; sortshistorik; frøhøst.
     "Jeg dyrker næsten lige så meget frø som planter."
6. **Midt i sæsonen?** — Starter nu · Godt i gang · Flere måneder. Ved "godt i gang":
   tilbyd import (billeder/noter/frøposer) = **den eksisterende V1B-shell**.
7. **Klar** — varm afslutning: *"Jo mere du dyrker, observerer og høster, desto mere
   vokser Potalot med dig. Nyt indhold og nye funktioner dukker op undervejs, når de
   bliver relevante for din have."* (Annas foretrukne, varme version.)

## Prioritet (Anna) — dag-ét-effekt først
1. **Lokation** (vejr/frost/kalender)
2. **Dyrkerprofil** (Mindful osv. → notifikations-mængde)
3. **Midt-sæson-import** (= V1B-shell)
4. Havetype
5. Dyrkningsområder

De tre første har direkte effekt fra dag ét; de to sidste kan følge efter.

## Hvorfor "Mindful" er vigtig
Signalerer "du behøver ikke logge alt / ingen daglige notifikationer / nyd haven"
— passer til kerne-thesen *mindre skærmtid, mere havetid*, OG giver den ærlige
forklaring på hvorfor nogle får få notifikationer og andre mange.

## Integration med det byggede (afklares ved bygning)
- **Dyrkerprofil → notifikations-motor** (00055/00056): profilen konfigurerer
  påmindelses-mængden. Mindful = minimal/ingen opgave-påmindelser; Hjælper =
  standard (cap 3); Entusiast = flere/mere; Frøsamler = frø-vægtet. Kræver et
  `grower_profile`-felt + at sync_task_reminders respekterer det.
- **Lokation → vejr** (getGardenWeather): "Brug min placering" = browser-geolocation
  (permission); postnummer/by = manuelt → koordinater. Afklar hvad vejr-actionen
  forventer i dag.
- **Havetype/områder** → anbefalinger, guides, fællesskab (senere brug).
- **Midt-sæson** → V1B-shell (allerede bygget).

## Datamodel (ny — kræver migration, kør i normalt flow)
`profiles`: garden_type, location (by/postnr + evt. lat/long), growing_areas[],
grower_profile ('mindful'|'hjaelper'|'entusiast'|'froesamler'), season_status.

## Status
IKKE bygget. Specced 13/7. Bygges som eget front ("Onboarding V2") — se
sekvens-beslutning i tråden (efter fejlpakken vs. nu).
