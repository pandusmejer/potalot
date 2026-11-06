# Udførelseslog — migration A mod produktion (6/11 2026)

**Udført:** ca. 11:30 lokal tid på produktionsprojektet `whtyexhqcpcgpludvkon`, efter Annas udtrykkelige godkendelse og backup-bekræftelse (fysisk backup 6/11 05:21 UTC, Restore tilgængelig; ikke afprøvet).
**Metode:** filens SQL udført direkte via `execute_sql` i ét kald (BEGIN … COMMIT). Ingen `db push`, ingen andre migrationer, ingen registerpost, ingen deploy/push.

## Kontroller før (T1–T2) — alle matchede
- fil-sha256 `8443a20c…bd29a9` og kanonisk SQL-hash `0faf85f4…` = godkendte værdier.
- Alle 10 fingeraftryk = baseline; 13 profiler, 1 admin, 0 ikke-`free`, 1 profil-trigger, trigger-funktionen fandtes ikke, ingen lange transaktioner/ventende låse, register 22 poster (seneste `20260830184352`).
- Rettighedshash før: `5e1b008a0518ed5456c0b9ee8fcdb40f` (13 rækker).

## Udførelse (T3)
Kørte uden fejl.

## Kontroller efter (T4–T7)
- `02-efter-kontrol.sql` (rollback-sikker, id'er fra produktion): **alle linjer [OK], ingen [FEJL]**:
  - `is_admin`/`subscription_tier`/`id`/`created_at`: ingen UPDATE for `authenticated`/`anon`; 15 tilladte kolonner: UPDATE for `authenticated`.
  - Angreb som almindelig bruger afvist med *permission denied for table profiles*: `is_admin`, `subscription_tier`, blandet opdatering, INSERT med `is_admin=true`, DELETE.
  - Legitime opdateringer virker for almindelig bruger og admin; RLS: kun egen række; admin læser `is_admin = true`; selv admin kan ikke ændre egen `is_admin` via klienten.
  - `delete_account`: `authenticated` kan ikke, `service_role` kan; kørte uden blokerede tabeller (ukendt id).
- Rettighedshash efter: **`5e1b008a0518ed5456c0b9ee8fcdb40f` — identisk**; 13 profiler, 1 admin, 0 ikke-`free`; ingen hængende transaktioner; register uændret (22).
- Fingeraftryk efter: constraints, kolonner, indeks, politikker, RLS-flag, funktions-ACL og funktionstekster **uændrede**. Kun rettigheder på `profiles` ændret: tabelrettigheder 63 → 55 (−8: anon/authenticated mister INSERT, UPDATE, DELETE, TRUNCATE) og kolonnerettigheder 516 → 455 (−61: præcis de fjernede INSERT/UPDATE-poster), jf. ACL: `anon`/`authenticated` = `rxtm` på tabelniveau; 15 kolonner med `authenticated=w`; `service_role` uberørt.
- Ny trigger `tr_profiles_afvis_klient_roller` findes; funktionen er `SECURITY INVOKER` med `search_path=public, pg_catalog`, `md5(prosrc)=e22953c7…` (= filens).

## Ikke udført / uændret
Ingen rollback, ingen A2/B/C/D, ingen ændring af data, migrationsregister, andre tabeller/politikker/funktioner, kode, push eller deploy. Migrationsfilen i repoet er uændret (header siger stadig "ikke anvendt på live" — opdateres ved commit).

## Mangler (manuel prøve i appen — Anna)
Profil gemmes, placering gemmes, `/admin` åbner, "Din have"/onboarding-visning, og næste rigtige tilmelding får en profil.
