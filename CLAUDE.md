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
- Docs/design-system/potalot.md — Overordnet filosofi + 3-lags arkitektur
- Docs/design-system/sektion-roller.md — Hvad hver sektion ER (spørgsmål, primær/sekundær handling, må-aldrig-blive)
- Docs/design-system/registrering.md — Registreringsprincipper (autoudfyld alt; frø→sået→plante)
- Docs/design-system/havebog.md — Havebog-manifest (10 principper)
- Docs/design-system/guides.md — Guide-systemet (V4.3)

Produkt-dokumenter:
- Docs/product/kalender-v2.md — Kalenderens hjerne (datakilder, prioritering, mentor-trappen)

Beslutningsrækkefølge når noget føles forkert:
1. Hierarki  2. Rytme  3. Komposition  4. Typografi
5. Farver    6. Skygger/radius   7. Komponentdetaljer

Store problemer løses næsten aldrig med flere komponenter.
