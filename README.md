# PotAlot

Dyrkningslog for danske hobbygartnere. Kalender, noter, guides og AI-assistent.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript, Tailwind CSS v4
- Supabase (PostgreSQL)
- Anthropic Claude Haiku 4.5 (AI Q&A)
- PWA (installerbar)

## Deploy til Netlify

### 1. Supabase

1. Opret et nyt projekt på [supabase.com](https://supabase.com)
2. Kør `supabase/migrations/00001_initial_schema.sql` i SQL Editor
3. Kør `supabase/seed.sql` i SQL Editor (opretter demo-bruger og eksempeldata)
4. Kopiér **Project URL**, **anon key** og **service role key** fra Settings > API

### 2. Anthropic

1. Opret en API-nøgle på [console.anthropic.com](https://console.anthropic.com)

### 3. Netlify

1. Push repoet til GitHub
2. Importér projektet i [netlify.com](https://app.netlify.com) (New site > Import from Git)
3. Tilføj environment variables under Site settings > Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

4. Deploy — Netlify bygger automatisk med `@netlify/plugin-nextjs`

### 4. PWA-ikoner (valgfrit)

Tilføj `icon-192x192.png` og `icon-512x512.png` i `/public/` for PWA-installation.

## Lokal udvikling

```bash
cp .env.example .env.local
# Udfyld .env.local med dine nøgler
npm install
npm run dev
```

## Demo-tilstand

Appen kører uden login. Alle data tilhører en fast demo-bruger som auto-oprettes ved første besøg. Auth kan tilføjes senere — strukturen er forberedt med Supabase RLS og auth-tabeller.

## Sider

| Side | Beskrivelse |
|---|---|
| `/dashboard` | Overblik med opgaver og status |
| `/calendar` | Opgaveliste sorteret efter dato |
| `/inventory` | Frø- og plantebeholdning |
| `/guides` | Dyrkningsguides (8 danske planter) |
| `/notes` | Notater og dyrkningslog |
| `/ai` | AI-assistent (Claude Haiku) |
| `/settings` | Profil og notifikationer |

## Database

9 tabeller: `profiles`, `plant_guides`, `seeds`, `plants`, `tasks`, `notes`, `seasons`, `notification_preferences`, `ai_conversations`

Schema: `supabase/migrations/00001_initial_schema.sql`
