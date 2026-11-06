# Test af migration A og A2 (isoleret)

Rører **aldrig** live-databasen. Bruger PGlite (in-memory Postgres i WASM) med en replika af de relevante dele af live (`live-replika.sql`, bygget ud fra verificeret metadata 6/11 2026) og kører den FAKTISKE migrationsfil `supabase/migrations/00072_…sql` og `A2-community-memberships.sql`.

```bash
mkdir /tmp/pgtest && cd /tmp/pgtest && npm init -y && npm i @electric-sql/pglite
PGLITE_PATH=/tmp/pgtest/node_modules/@electric-sql/pglite/dist/index.js \
REPO=/sti/til/potalot node /sti/til/potalot/Docs/product/fase4-migrationer/test-A/test-A.mjs
```

Afhængigheden installeres bevidst IKKE i projektet (ingen ny dependency, og `npm test`/CI påvirkes ikke).

Begrænsninger: Postgres 18 (PGlite) mod live 17; username er `text` (live: `citext`); PostgREST er ikke med — rollerne simuleres med `set_config('request.jwt.claims', …)` + `SET LOCAL ROLE`. Gentag API-trinnet på en branch/staging før live (se A-specifikationen).
