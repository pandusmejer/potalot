# API-test af migration A og A2 på en isoleret Supabase-branch (6/11 2026)

**Resultat:** A: **30/30** bestået via PostgREST/supabase-js med rigtige JWT'er (og 7/7, der reproducerede fejlen før). A2: **10/10**. Konto-sletning virker efter A. **Intet er ændret i produktion.** Branchen er slettet.

## 1. Miljø og omkostning
- Der fandtes ingen testbranch i Potalot-projektet. De tre øvrige projekter i organisationen (Scoutly, CARZILLA, Sponzo) er andre produkter og blev ikke brugt.
- Midlertidig branch `sikkerhedstest-a` (ref `asculsynmocvvoqcrjbm`), oprettet 09:54 UTC og **slettet** samme formiddag (ca. 8 minutter). Pris: $0,01344/time, dvs. højst én påbegyndt time ≈ **$0,013**. Intet permanent. (Listen viser fortsat standardposten `main` for produktionen — den er uden omkostning.)
- Branchen blev oprettet i tilstanden `MIGRATIONS_FAILED`, som forventet: produktionens migrationsregister har kun 22 poster (fra 00053), så branchen fik et **tomt** skema (0 tabeller, 0 brugere). Den var alligevel fuldt brugbar (rigtig PostgREST + GoTrue).

## 2. Skemaet svarer til produktion (verificeret)
Jeg byggede de relevante dele på branchen ud fra produktionens metadata ([branch-opsaetning.sql](test-A/api/branch-opsaetning.sql)) og sammenlignede MD5-fingeraftryk af 10 kategorier for `profiles`, `general_garden_tasks`, `community_memberships` og de fire funktioner mod produktion:

| Kategori | Antal | Branch = produktion |
|---|---|---|
| kolonner (type, NOT NULL, standard) | 43 | ✅ |
| constraints | 14 | ✅ |
| indeks | 10 | ✅ |
| RLS-politikker (kommando, roller, USING, WITH CHECK) | 7 | ✅ |
| RLS aktiv/forced | 3 | ✅ |
| triggere (profiles + auth.users) | 2 | ✅ |
| tabelrettigheder (anon/authenticated/service_role) | 63 | ✅ (efter justering, se nedenfor) |
| kolonnerettigheder | 516 | ✅ (efter justering) |
| funktions-ACL | 4 | ✅ (efter justering) |
| funktionstekster | 4 | ✅ (efter justering; e-mail normaliseret) |

**Afvigelser fundet og rettet på branchen (ikke på produktion):**
1. *Funktionsteksterne* adskilte sig kosmetisk (store/små bogstaver, linjeskift). Genskabt med produktionens præcise `pg_get_functiondef`-tekst.
2. *Standardrettigheder:* branchens nyoprettede tabeller giver ikke API-rollerne data-rettigheder (strammere nye Supabase-standarder), mens produktionen har brede. Rettighederne blev givet eksplicit, så de svarer til produktion. **Det betyder, at fejlen er en følge af produktionens ældre, bredere standardrettigheder.**
3. `service_role` manglede EXECUTE på `delete_account` (som i produktion); tilføjet.

**Bevidste afvigelser:** projektejerens mail i `set_admin_on_profile_insert` erstattet af en test-mail (normaliseret væk i sammenligningen); fem forenklede brugertabeller i stedet for produktionens 39 med `user_id`; `community_groups` kun med `id`.

## 3. Testbrugere
Fire testbrugere (ejer/admin, alice, bob, carol) oprettet direkte i branchen med tilfældige adgangskoder; kun bcrypt-hashes blev sendt, klartekst ligger i en privat midlertidig fil og er ikke gengivet. Profiler blev oprettet af den **rigtige** `handle_new_user`-trigger; ejeren blev admin via den rigtige insert-trigger. Login skete via GoTrue (`signInWithPassword`); alle JWT'er har rollen `authenticated`.

## 4. Resultater

### Før A — fejlen reproduceret via PostgREST (7/7 "bestået" = fejlen findes)
- alice satte egen `is_admin = true` og egen `subscription_tier = 'premium'`.
- carol (uden profilrække) oprettede sin egen profil med `is_admin = true` (INSERT-vejen).
- *Utilsigtet bonus-bevis:* testen lod også ejeren fjerne sin egen admin-status via API'et (rettet bagefter i testdata).

### Efter A — 30/30 (migrationsfilen `00072_…` anvendt; funktionstekstens hash = filens)
| Forsøg (via API med brugerens JWT) | Resultat |
|---|---|
| alice PATCH `is_admin` / `subscription_tier` | **403, 42501** *permission denied for table profiles* |
| blandet PATCH (`is_admin` + `display_name`) | afvist i sin helhed |
| alice gør bob til admin | 403, 42501 |
| alice UPSERT egen profil med `is_admin = true` | afvist |
| carol INSERT uden profilrække med `is_admin = true` | 403, 42501 |
| alice DELETE egen profil | 403, 42501 |
| anon (uden login) UPDATE/INSERT | afvist |
| selv admin ændrer egen `is_admin` | 403, 42501 |
| RPC `delete_account` som authenticated / anon | 403, 42501 *permission denied for function* |

**Legitime flows virker:** `updateProfile`-formen, `saveOnboardingPreferences`-formen og badge-backfill-formen (med og uden `.select()`); round-trip af værdier; `getProfile` giver kun egen række (`is_admin=false`, tier `free`); RLS rammer stadig 0 rækker hos andre; CHECK-constraints gælder (23514); `is_username_available` virker for både indloggede og anon.

**Administratorfunktioner virker:** ejeren læser `is_admin = true`; admin kan skrive til `general_garden_tasks` (politikken læser `profiles.is_admin`); almindelig bruger kan hverken skrive eller ændre, men kan læse aktive gøremål.

**Data uændret:** `profiles` har samme rækketal og samme indholds-hash (`ddf4f96e…`) før og efter migrationen.

**Kontosletning:** med data i `inventory_items`, `plants_v2` (FK til poser), `plant_logs_v2`, `calendar_tasks`, `ai_conversations` og `community_memberships` kørte `delete_account(…)` som `service_role` uden blokerede tabeller og uden rester, og sletning af auth-brugeren fjernede profilen (cascade). Se afvigelser nedenfor.

### A2 (anvendt *efter* A, som separat fil) — 10/10, og A-suiten igen 30/30
- Før A2 (via API): alice indsatte en membership med `role = 'moderator'` (201) og bob kunne læse alices række — **fejlen findes uafhængigt af A**.
- Efter A2: moderator-INSERT afvist; almindelig membership virker (standard `member`); `UPDATE role` afvist (42501); kan stadig acceptere invitation; kan ikke oprette for andre; kan ikke læse andres; kan forlade gruppen; anon kan ikke læse.
- Uafhængighed: A2 på en frisk replika **uden** A afviser moderator-tildelingen og lader samtidig profil-fejlen stå åben (isoleret test) — de kan godkendes og anvendes hver for sig.

## 5. Afvigelser og begrænsninger
- **`service_role`-nøglen er ikke tilgængelig for mig**, så kontosletning blev kørt som `SET ROLE service_role` i SQL, ikke via serverens `auth.admin.deleteUser`. Rettigheds- og cascade-kæden er prøvet; selve Auth-admin-kaldet er ikke.
- **Appen (browser) er ikke kørt mod branchen.** Profil-, onboarding- og admin-flows er prøvet som præcis de samme PostgREST-kald, som koden udfører, men ikke gennem UI'et.
- Kun tre relevante tabeller og fire funktioner er sammenlignet; de øvrige 36 `user_id`-tabeller og Auth-konfigurationen er ikke replikeret. Postgres-version på branchen kan afvige fra produktion (17).
- Branchen er ikke en klon (migrationsregisteret er ufuldstændigt), men en opbygning fra metadata; fingeraftrykkene viser, at de undersøgte områder er identiske.

## 6. Før produktion (kræver jeres særskilte godkendelse)
1. **Forudsætning:** godkend A (og A2 for sig).
2. **Anvendelse:** som databaseændring i en frisk tråd (SQL-editor/migration), **uden app-deploy** — den er uafhængig af de ni lokale MVP-commits.
3. **Før:** gentag de læsende kontroller (rettigheder, 1 admin, ingen funktion opdaterer `profiles`).
4. **Efter (kun læsning):** `has_column_privilege` for `is_admin`/`subscription_tier` = false; de 15 kolonner = true; antal admins = 1; derefter en praktisk prøve i appen: gem profil/placering, gennemfør onboarding, åbn `/admin`.
5. **Rollback:** SQL i filens bund (genåbner hullet — foretræk frem-rettelse).
6. **A2** som egen, efterfølgende ændring.

## 7. Genskabelse
[test-A/api/](test-A/api/) indeholder `branch-opsaetning.sql`, `lav-brugere.mjs`, `api-test.mjs` (faser `foer`, `efterA`, `efterA2`), `fejlbeskeder.mjs` og `a2-foer.mjs`. Scriptene afbryder, hvis URL'en ikke peger på en testbranch.
