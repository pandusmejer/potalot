# Launch-scope LÅST (13/7 2026)

Anna-låst rækkefølge: **lås scope → byg launch-versionen HELT færdig → teknisk QA
→ derefter Annas samlede produkttest.** Ingen visuel sluttest af mellemtilstande.
Tre motorer tilbage før den samlede test. Kilde: [[launch-strategi]].

## 1. Onboarding — LUK uden draft-persistens
Shellen er bygget (V1B). Scope lukkes **uden** draft-persistering.
- **IND:** brugeren får planter/frø ind; review kræves før gemning; committede
  data bevares (DB); tydelig afslutning; ingen blokering hvis man springer over.
- **UD:** persistering af et ikke-godkendt AI-review. Det må gå tabt ved refresh
  i V1 (kun client state). Committede planter/frø bevares naturligvis.
- **Krav:** "fortsæt senere" må IKKE stå som et generelt løfte i UI, hvis det kun
  gælder efter gemning. Begrænsningen dokumenteres tydeligt.

## 2. Diktafon — global indgang + genbrug den eksisterende kæde
Hele kæden (optag via Web Speech → Haiku-forslag → godkend → gem i log/opgave/
minde → `voice_notes`-indbakke + arkiv) virker allerede for indloggede, men lever
KUN på Havebog-forsiden (`page.tsx` 4. rum).
- **IND:** én tydelig "tryk og tal"-indgang i topbar eller global nav, der åbner
  den eksisterende kæde fra alle hovedsider. Behold tekst-fallback på iOS Safari
  (UI skal forklare det ordentligt). Fjern død legacy-funktion `gemTaleForslag`
  (`tale.ts:54`, kaldes ingen steder).
- **UD:** ny lyd-upload, server-side STT, iOS-Web-Speech-erstatning. Ikke i launch.

## 3. Notifikationer — smal: in-app påmindelser fra opgaver/kalender
In-app infrastruktur findes komplet (`notifications`-tabel + `enqueue_notification`
SECURITY DEFINER-helper + fuld action-suite + reel klokke/badge/dropdown), men
drevet KUN af sociale/gruppe-triggers. Der udledes INGEN påmindelser fra opgaver.
- **IND:** deterministiske in-app påmindelser afledt af `calendar_tasks`/opgaver
  via den eksisterende `notifications`-tabel + `enqueue_notification`. Påmindelser
  skal være **konkrete, plante-knyttede og FÅ i antal**. Sociale notifikationer
  beholdes som nu.
- **UD:** push, email, web-push, service-worker; præference-UI
  (`notification_preferences`-tabellen forbliver ubrugt i launch).

## Rækkefølge herfra
1. ✅ Lås scope (dette dokument).
2. Onboarding: luk (copy + doc, ingen draft-persistens).
3. Diktafon: global indgang + genbrug + fjern legacy.
4. Notifikationer: opgave/kalender-afledte in-app påmindelser (smal).
5. Teknisk QA (udvikler-QA + fejlretning) — IKKE Annas samlede test.
6. Annas samlede produkttest af hele launch-flowet.

Små designreviews undervejs er fine, når en skærm kræver en visuel beslutning —
men ingen samlet produkttest før trin 6.
