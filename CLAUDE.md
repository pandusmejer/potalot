Project: PotAlot

PotAlot er en webapp til at holde styr på planter og dyrkning.

Tech stack
- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript
- Supabase (PostgreSQL + RLS)
- Tailwind CSS v4
- Netlify (med @netlify/plugin-nextjs)
- Anthropic API (Claude Haiku 4.5, streaming)

Arkitektur
- Demo mode: ingen login, DEMO_USER_ID i src/lib/demo.ts
- PWA med service worker
- Dansk UI gennemgående

Hovedfunktioner
- plante inventory (frø + planter)
- kalender/opgaver
- noter
- dyrkningsguides
- AI rådgiver

Filstruktur
- src/app/(app)/ — alle app-sider
- src/app/api/ai/chat/ — Claude streaming proxy
- src/components/ — ui/, layout/, dashboard/, calendar/, notes/, ai/, inventory/, guides/, settings/
- src/actions/ — server actions (auth, tasks, notes, inventory, settings)
- src/lib/ — supabase/, anthropic/, demo.ts
- public/images/ — groentsager/, kalender/, Flora-Danica
- Docs/ — BACKLOG, CHANGELOG, IDE_BANK, MASTER_SPEC, PlantAnna PDF
- supabase/ — migrations + seed.sql

Database
9 tabeller: profiles, plant_guides, seeds, plants, tasks, notes, seasons, notification_preferences, ai_conversations

MVP mål
- gøre det nemt at holde styr på frø, planter og opgaver
- simpelt og mobilvenligt interface
- ingen unødvendige features

Principper for ændringer
- hold løsningen simpel
- undgå unødvendige dependencies
- fokuser på MVP
- UI skal fungere godt på mobil

Design-filosofi
Potalot er et digitalt haveredskab. Havebogen er den personlige
havejournal inde i det digitale haveredskab.

Den ene sætning: "Byg en havejournal, ikke et dashboard." Den gælder
især for Havebog (/) — og hjælper med at undgå at drive resten af
appen mod produktivitetsværktøj-territorium.

Sektion-DNA (Docs/design-system/potalot.md har det fulde):
- Havebog = minder, editorial, Cormorant/Instrument Serif + Manrope
- Frøbank = samling, system, Gabarito + Manrope
- Planter = pleje, handling, Gabarito + Manrope
- Kalender = timing, planlægning, Gabarito + Manrope
- Guides = læring, magasin, Cormorant + Manrope (samme univers som Havebog)

Designsystem-dokumenter (læs FØR redesign):
- Docs/design-system/visuelt-system.md — POTALOT VISUAL SYSTEM V1: "to registre, én familie"; delte primitiver (spacing, typografi, farver, cards, billedhierarki, sektionstyper, CTA'er)
- Docs/design-system/potalot.md — Overordnet filosofi + 3-lags arkitektur
- Docs/design-system/sektion-roller.md — Hvad hver sektion ER (spørgsmål, primær/sekundær handling, må-aldrig-blive)
- Docs/design-system/registrering.md — Registreringsprincipper (autoudfyld alt; frø→sået→plante)
- Docs/design-system/havebog.md — Havebog-manifest (10 principper)
- Docs/design-system/guides.md — Guide-systemet (V4.3)

Produkt-dokumenter:
- Docs/product/kalender-v2.md — Kalenderens hjerne (datakilder, prioritering, mentor-trappen)
- Docs/product/afledningsmotoren.md — Hvad Potalot kan udlede af eksisterende data (24 afledninger, prioriteret)

Beslutningsrækkefølge når noget føles forkert:
1. Hierarki  2. Rytme  3. Komposition  4. Typografi
5. Farver    6. Skygger/radius   7. Komponentdetaljer

Store problemer løses næsten aldrig med flere komponenter.

Arbejdsgang — ét sted, undgå branch/worktree-rod (LÅST 27/7 2026)
Repoet blev 27/7 konsolideret fra ~28 branches + 5 worktrees til ÉN
branch (main) i ÉN mappe. Hold det sådan:

1. Arbejd og commit DIREKTE på `main` i /Users/mejervind/potalot. Opret
   IKKE en ny branch eller worktree ved commit — dette OVERSTYRER
   standardadfærden "stå på default-branch → branch først". Kun hvis
   Anna eksplicit beder om at isolere noget stort/risikabelt (og så
   merge tilbage til main samme dag).
2. Én agent ad gangen pr. sektion. Kør ALDRIG Claude og Codex på de
   samme filer samtidig — det gav dublet-versioner (fx to
   det-kan-du-goere.tsx). Skift først når arbejdet er committet.
3. Ingen worktrees. Bruges én undtagelsesvis, fjern den med
   `git worktree remove` straks efter — og ryd ALDRIG destruktivt op
   uden per-ting-ja (jf. worktree-sprawl-erfaringen).
4. Push i batches (Netlify-credits er begrænsede), men lad IKKE
   arbejde hobe sig op upushet i ugevis — push når en sammenhængende
   bid er færdig, så `main` == `origin/main` og der aldrig er tvivl om
   "hvad er live".
5. Auto-genererede filer (src/data/guides-imported.ts,
   src/data/image-manifest.generated.ts) REGENERERES altid via
   `npx tsx scripts/import-guides.ts` / `scripts/scan-images.ts` —
   merges ALDRIG på tværs af branches (det var dér konflikterne sad).
