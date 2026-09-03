# UserMode vs. NotificationProfile (model-backlog)

**Status:** åben model-opgave. Oprettet 3/9 2026 som led i Batch 3
(terminologisk integritet), spor D11. Anna: kortlægningen er nok for nu.
Ingen sammenlægning, aliasing eller copy-standardisering, før spørgsmålet
nedenfor er besvaret.

## De to enums

| | `UserMode` | `NotificationProfile` |
|---|---|---|
| Værdier | `maalrettet` · `afslappet` · `minimal` | `mindful` · `rolig` · `aktiv` |
| DB-kolonne | `profiles.user_mode` (`00015_user_modes.sql`, default `afslappet`) | `profiles.notification_profile` (`00058_onboarding_v2.sql`, nullable) |
| Sættes hvor | Profil-siden (`src/components/profil/profil-form.tsx:134-170`, gemmes via `actions/profil.ts:84`) | Onboarding V2 (`src/components/onboarding/onboarding-wizard.tsx:67-70`) |
| Labels | Målrettet ("Flere påmindelser, flere forslag og alle detaljer fremme") · Afslappet · Minimal ("Uden notifikationer") — `src/lib/constants.ts:67` | Mindful ("Ingen påmindelser. Jeg åbner selv Potalot…") · Rolig ("Kun det vigtigste — få påmindelser") · Aktiv ("Hold mig opdateret…") |
| Bruges af motorer | ? (kortlægges før beslutning: grep `userMode` i `src/lib`) | Påmindelses-loftet i DB: mindful 0 · rolig 1 · aktiv 3, fallback 3 (`00058:55-70`, `00059`, `00066`) |

## Hvorfor de ligner ét begreb

"Minimal — uden notifikationer" og "Mindful — ingen påmindelser" beskriver
samme oplevelse med to ord og to nøgler. `00058` erklærer selv, at
`notification_profile` er dimensionen "hvor meget må Potalot forstyrre dig"
og skal holdes adskilt fra dyrker-identiteten (`grower_profile`). `UserMode`
blev indført tidligere (`00015`) og blander tilsyneladende forstyrrelse
("flere påmindelser") med informationstæthed ("alle detaljer fremme").

## Spørgsmålet, der skal besvares

**Er `UserMode` og `NotificationProfile` samme dimension (forstyrrelse),
eller to forskellige præferencer (forstyrrelse vs. informationstæthed)?**

- Hvis **samme**: én enum overlever (`NotificationProfile` er den, motoren
  faktisk læser), `user_mode` migreres eller afvikles, profil-siden viser
  den samme tre-trins-skala som onboardingen, og labels låses ét sted.
- Hvis **to**: `UserMode` omdøbes og beskrives som "detaljeniveau", og
  ordene om påmindelser fjernes fra dens copy, så de to ikke lover det
  samme.

Indtil da: ingen af de to enums er forkerte i sig selv, og ingen label
ændres. Se `Docs/content/batch-3-terminologi-beslutningsrapport.md`,
spor D11.
