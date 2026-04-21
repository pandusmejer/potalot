Project: PotAlot

PotAlot er en webapp til at holde styr på planter og dyrkning.

Tech stack
- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript
- Supabase (PostgreSQL + RLS)
- Tailwind CSS v4
- Netlify (med @netlify/plugin-nextjs)
- Anthropic API (Codex Haiku 4.5, streaming)

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
- src/app/api/ai/chat/ — Codex streaming proxy
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
