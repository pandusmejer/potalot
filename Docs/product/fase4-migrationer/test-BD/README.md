# Test af migration B og D (isoleret)

Rører aldrig live. PGlite er IKKE en projekt-afhængighed.

```bash
mkdir /tmp/pgtest && cd /tmp/pgtest && npm init -y && npm i @electric-sql/pglite
PGLITE_PATH=/tmp/pgtest/node_modules/@electric-sql/pglite/dist/index.js \
REPO=/sti/til/potalot node /sti/til/potalot/Docs/product/fase4-migrationer/test-BD/test-BD.mjs
```

Forventet: `97 bestået, 0 fejlet`. Samtidighedstesten (`api/samtidighed.mjs`) kræver en Supabase-branch og særskilt godkendelse — se [../BD-migrationsplan.md](../BD-migrationsplan.md).
