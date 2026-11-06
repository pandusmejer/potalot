# Migrationsregistret — hvordan vi på sigt afstemmer det (uden at køre gamle migrationer igen)

**Status 6/11 2026.** Kun beskrivelse og plan; intet er ændret i registret eller databasen.

## Fund
| | Repo `supabase/migrations/` | Produktionsregister (`supabase_migrations.schema_migrations`) |
|---|---|---|
| Antal | 74 filer, `00001_…` til `00076_…` (00073 og 00075 er bevidst ikke brugt) | **22 poster** |
| Versionsform | tal-præfiks (`00057`) | **tidsstempel** (`20260714084700`) + navn |
| Dækning | alt, hvad der skal ligge i databasen | kun migrationer anvendt via `apply_migration`/CLI siden juli 2026 |

- 00001–00052 og flere senere er anvendt **manuelt** (SQL-editor) og står ikke i registret.
- **00072 (A), 00074 (B) og 00076 (D) er anvendt manuelt 6/11 2026** og står heller ikke i registret. Deres anvendelse er dokumenteret i `Docs/product/fase4-migrationer/` (A-udfoerelse-2026-11-06.md, BD-udfoerelse.md) og i filernes headere.
- Registrets 22 poster har alle en tilsvarende fil i repoet (navnene matcher), men med et andet versionsnummer.

## Hvorfor `supabase db push` er FORBUDT
CLI'en sammenligner filpræfiks (`00057`) med registerets versioner (`2026…`). Intet matcher, så CLI'en ville opfatte **alle 74 filer som ikke-anvendte** og forsøge at køre dem igen (dublet-tabeller, fejlede `CREATE`, og ved nogle filer datamanipulation). Samme grund til, at en Supabase-branch ved oprettelse får et tomt skema (`MIGRATIONS_FAILED`).

## Regel fra nu af (gælder allerede)
1. Hver skemaændring = en nummereret fil i repoet **før** den anvendes, testet isoleret (PGlite/branch), anvendt manuelt efter særskilt godkendelse, og med en kontrol-/rollback-fil (som A/B/D).
2. Efter anvendelse opdateres filens header til "ANVENDT PÅ PRODUKTION <dato>", og udførelsen noteres i en udførelsesfil.
3. Kør aldrig en gammel migration igen; kør aldrig `db push`/`db reset` mod produktion.

## Afstemning på sigt (anbefalet; kræver Annas godkendelse og CLI + databaseadgang)
Mål: registret og repoet fortæller det samme, uden at nogen gammel SQL kører igen.
1. **Frys og sikr:** tag en frisk backup og et skema-dump (`supabase db dump --schema-only`) som sandhed. Commit dumpet i `Docs/` (ikke i `migrations/`).
2. **Verificér pr. migration (read-only):** for hver af de 74 filer, kontrollér at dens effekt findes i den levende database (tabel/kolonne/funktion/politik via katalogen). Resultatet bliver en liste: *anvendt* / *mangler* / *uklar*. Mangler eller uklar → egen sag, ikke en del af afstemningen.
3. **Baseline i stedet for historik (anbefalet):** opret **én** ny baseline-migration (`<tidsstempel>_baseline.sql`) fra dumpet, og flyt de gamle filer til `supabase/migrations_arkiv/` (ikke slettet — bevaret i git). Markér baselinen som anvendt med `supabase migration repair --status applied <version>`. Fremtidige migrationer navngives med CLI'ens tidsstempelformat, så registret og filerne matcher.
4. **Alternativ (mindre indgribende):** behold filerne og `repair`-markér hver verificeret migration som anvendt. Kræver, at filnavnenes versioner ændres til tidsstempler (omdøbning) — mere støj i historikken.
5. **Efterkontrol:** `supabase migration list` viser ingen forskel mellem lokal og fjern; `db push --dry-run` foreslår **ingenting**. Først derefter må en branch/CLI bruges til automatisk anvendelse.

**Hvad der ikke må ske:** at "rette" registret ved at indsætte rækker uden verifikation, eller at lade CLI'en køre de gamle filer.

## Hvad vi ved, og hvad der mangler
- Kendt anvendt og dokumenteret: 00049, 00053–00060, 00068–00071 (+ de tre guide-/gartner-migrationer), **00072, 00074, 00076**.
- Ikke verificeret her: 00001–00052 (anvendt manuelt iflg. tidligere noter). Trin 2 ovenfor afgør det.
