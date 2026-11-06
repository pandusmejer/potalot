# Migration A — luk `profiles.is_admin` for brugere (SIKKERHED, FØRST)

**Status 6/11:** migrationsfilen er FORBEREDT og TESTET i et isoleret miljø (100/100 tests) — se [`supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql`](../../../supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql). **IKKE anvendt på live.** Anvendelse kræver særskilt godkendelse. Filen er uncommittet, og intet kører den automatisk (CI kører kun `tsc` og `npm test`).
**Prioritet:** højeste. Skal være gennemført og verificeret FØR testbrugere inviteres.
**Afhænger af:** intet. **B, C og D afhænger af denne.**

## 1. Problemet (verificeret read-only 6/11 2026 mod live-DB)

En indlogget bruger kan opdatere sin egen `profiles.is_admin` (og `subscription_tier`).

| Fund | Hvordan verificeret |
|---|---|
| RLS-politikken `profiles update own` er `UPDATE USING (auth.uid() = id)` uden `WITH CHECK` — den beskytter **rækker**, ikke **kolonner** | `pg_policies` |
| `anon` og `authenticated` har **tabelniveau**-`UPDATE` (og INSERT/DELETE/TRUNCATE/TRIGGER/REFERENCES) på `profiles` — Supabase-standard | `information_schema.role_table_grants` |
| `has_column_privilege('authenticated','public.profiles','is_admin','UPDATE')` = **true** | direkte opslag |
| Eneste trigger på `profiles` er `BEFORE INSERT` (`set_admin_on_profile_insert`). Ingen update-trigger | `pg_trigger` |
| `requireAdmin()` ([auth.ts](../../../src/lib/auth.ts)) og 7 migrationers RLS-politikker (årshjul, master-guides, moderation, idéer, udfordringer m.fl.) stoler på `is_admin` | grep |
| Der er **1** admin af 13 profiler, og den er projektejeren; **0** andre admins | aggregeret forespørgsel (ingen identiteter) |

**Konsekvens:** en bruger kunne via PostgREST (offentlig anon-nøgle + eget login) sætte `is_admin = true` og derefter skrive til de admin-styrede tabeller (globale gøremål, master-guides, moderation) direkte i databasen. Der er ikke forsøgt udnyttelse. Der er ingen revisionslog, så historik kan ikke bevises; nuværende tilstand (kun ejeren er admin) tyder ikke på misbrug.

**Vigtig teknisk detalje:** fordi `authenticated` har tabelniveau-`UPDATE`, virker `REVOKE UPDATE (is_admin) ON profiles` **ikke** — en kolonne-REVOKE kan ikke fjerne en rettighed givet på tabelniveau. Man skal fjerne tabelniveau-rettigheden og give den tilbage pr. kolonne.

## 2. Hvilke kolonner skriver appen faktisk? (verificeret i koden)

| Kolonne | Skrives af |
|---|---|
| `username`, `display_name`, `avatar_url`, `user_mode`, `onboarded`, `latitude`, `longitude`, `location_name`, `updated_at` | `updateProfile` ([profil.ts](../../../src/actions/profil.ts)) |
| `garden_type`, `growing_areas`, `grower_profile`, `notification_profile`, `season_status` (+ `onboarded`, lokation) | `saveOnboardingPreferences` (samme fil) |
| `last_badge_backfill_at` | `backfillAllBadges` ([badges.ts](../../../src/actions/badges.ts)) |
| *(ingen kode skriver `is_admin` eller `subscription_tier`)* | grep: kun læsninger |

Ingen SQL-funktion i live-databasen opdaterer `profiles` (verificeret med en søgning i alle `public`-funktioners definitioner), så ingen server-side RPC bryder af rettighedsændringen.

Profilrækker oprettes af `handle_new_user` (AFTER INSERT på `auth.users`, SECURITY DEFINER) — ikke af klienten. Kontosletning bruger service-role (`createAdminClient`) og `delete_account()`; de påvirkes ikke, fordi migrationen kun fjerner rettigheder fra `anon`/`authenticated`.

Administratorer tildeles i dag (a) af triggeren ved første oprettelse (hårdkodet projektejer-mail) og (b) "via direkte DB-update" (SQL-editoren, rollen `postgres`) — migrationen bevarer begge veje.

## 3. Løsning (to lag)

**Lag 1 — rettigheder (primær, "deny by default").** Fjern tabelniveau-`UPDATE` fra `anon` og `authenticated`, og giv `authenticated` kun `UPDATE` på de kolonner, appen skriver. Nye kolonner er så som standard IKKE skrivbare for brugere; glemmer man at give rettighed, fejler funktionen synligt (sikker retning).

**Lag 2 — trigger (belt and braces).** En `BEFORE UPDATE`-trigger afviser ændring af `is_admin`/`subscription_tier`, når kalderen er `anon`/`authenticated`. Den fanger fejl, hvis nogen senere kommer til at give kolonnen tilbage. Funktionen skal være `SECURITY INVOKER`: med `SECURITY DEFINER` ville `current_user` være funktionsejeren, og kontrollen ville aldrig ramme.

### SQL (op)
Den præcise SQL er filen [`00072_profiles_laas_privilegerede_kolonner.sql`](../../../supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql) (ét `BEGIN … COMMIT`). Kort:

1. `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated`
2. `GRANT UPDATE (display_name, username, avatar_url, user_mode, onboarded, latitude, longitude, location_name, garden_type, growing_areas, grower_profile, notification_profile, season_status, last_badge_backfill_at, updated_at) ON public.profiles TO authenticated`
3. `SECURITY INVOKER`-trigger `afvis_klient_aendring_af_roller` (BEFORE UPDATE) som afviser ændring af `is_admin`/`subscription_tier` fra `anon`/`authenticated` (42501).

**Ændring ift. første udkast (INSERT-vejen):** testen i det isolerede miljø viste en anden vej til samme mål, som udkastet ikke lukkede: `authenticated` har også tabelniveau-`INSERT`, og INSERT-politikken er kun `auth.uid() = id`. En bruger, hvis profilrække mangler, kunne oprette sin egen med `is_admin = true` (den eksisterende insert-trigger sætter kun admin til `true` for ejerens mail, den tvinger aldrig `false`). I dag oprettes profiler udelukkende af `handle_new_user` (SECURITY DEFINER), og ingen klientkode indsætter eller sletter profiler, så INSERT/DELETE/TRUNCATE fjernes for klientrollerne uden funktionstab (verificeret: tilmelding virker stadig i testen).

## 4. Påvirkning

- **Kode:** ingen ændringer nødvendige. Alle eksisterende skrivninger er inden for kolonnelisten.
- **Fremtidige kolonner på `profiles`** skal have en eksplicit `GRANT UPDATE (kolonne)` i deres egen migration (gælder B).
- **Admin-flow:** uændret. Admin-handlinger læser `is_admin`; de skriver den aldrig. SQL-editor/`postgres` og `service_role` kan fortsat ændre rollen.
- **Andre tabeller:** ikke berørt. Se punkt 7 for beslægtede fund.

## 5. Adgangsregler efter migrationen

| Rolle | Må ændre `is_admin`? | Må ændre øvrige profilkolonner? |
|---|---|---|
| `anon` | nej | nej (og RLS blokerer alligevel rækkerne) |
| `authenticated` (almindelig bruger, egen række) | **nej** (rettighed fjernet + trigger) | ja, kun de listede kolonner |
| `authenticated` (admin) | **nej** — admin-status ændres kun via DB-rollerne | ja, som ovenfor |
| `service_role` / `postgres` | ja | ja |

## 6. Tests

### Udført 6/11 i isoleret miljø (PGlite, in-memory Postgres) — 100 bestået, 0 fejlet
Harness: [`test-A/`](test-A/README.md) (replika af de relevante dele af live-DB bygget ud fra verificeret metadata + den **faktiske** migrationsfil). Klientrollerne simuleres som PostgREST gør (`request.jwt.claims` + `SET LOCAL ROLE`); hver skrivende prøve rulles tilbage.

| Område | Resultat |
|---|---|
| **Fejlen reproduceres før migrationen** | alice kan sætte egen `is_admin` og `subscription_tier`; en bruger uden profilrække kan oprette en med `is_admin = true`; (A2) alice kan oprette membership med `moderator` og alle kan læse alle |
| **Rettigheder efter** | `is_admin`, `subscription_tier`, `id`, `created_at`: ingen UPDATE for `authenticated`/`anon`; alle 15 tilladte kolonner: UPDATE; ingen INSERT/DELETE/TRUNCATE/UPDATE på tabelniveau; `SELECT` og `service_role` uberørt |
| **Angreb afvises (42501)** | egen `is_admin`; `subscription_tier`; blandet opdatering; andres `is_admin`; eget `id`; `created_at`; **selv ikke admin** kan ændre `is_admin` via klienten; INSERT uden profilrække; sletning af egen profil; `TRUNCATE`; anon-INSERT |
| **Legitime flows** | hver af de 15 kolonner kan opdateres; `updateProfile`-, `saveOnboardingPreferences`- og `backfillAllBadges`-mønstrene virker som samlede `UPDATE`s; tilmelding (`handle_new_user`) virker; RLS gælder stadig (kun egen række); CHECK-constraints gælder stadig |
| **Kode ⊂ tilladt** | statisk: de kolonner `profil.ts`/`badges.ts` skriver er alle på listen; ingen kode skriver `is_admin`/`subscription_tier` |
| **Administratorfunktioner** | `requireAdmin`-læsning virker (ejer = true, alice = false); RLS-politikken `general_garden_tasks admin write` (læser `profiles`) lader admin skrive og afviser alice; `postgres` og `service_role` kan stadig ændre `is_admin` og slette profiler (kontosletning) |
| **Andet lag** | med rettigheden midlertidigt givet tilbage afviser triggeren alene ændringen (42501, dansk besked); **bevis:** en `SECURITY DEFINER`-udgave ville IKKE stoppe den — derfor `INVOKER` |
| **Data** | rækketal og indholds-hash af `profiles` identiske før/efter; statisk kontrol: ingen `INSERT/UPDATE/DELETE/TRUNCATE/DROP TABLE/DROP COLUMN` i filen; én transaktion |
| **Idempotens/rollback** | kan køres to gange; rollback-SQL'en (kommentaren i filen) virker og genåbner som dokumenteret; genanvendelse lukker igen |

### Opdatering 6/11: PostgREST-trinnet er nu kørt på en isoleret Supabase-branch
Se [API-test-A-branch.md](API-test-A-branch.md): **30/30** efter A via PostgREST/supabase-js med rigtige JWT'er (fejlen reproduceret før: 7/7), data uændret, kontosletning virker, adminfunktioner virker, A2 10/10 separat. Branchen er slettet. Det følgende er den oprindelige begrænsningsliste (punkt 1 er nu lukket; resten står tilbage).

### Hvad testen IKKE dækker (skal lukkes, før live)
- ~~**PostgREST/supabase-js i løkken.**~~ **(lukket 6/11, se ovenfor)** Rettigheds- og trigger-semantikken er den samme som PostgREST bruger, men et ægte API-kald er ikke prøvet. Gentag trin 4 (PATCH med anon-nøgle + testbrugers JWT) på en Supabase-**branch** eller en staging, før live.
- **Replikaen er bygget fra metadata, ikke klonet** og kører Postgres 18 (PGlite) mod live 17. Verificeret live, at der ikke findes views, regler eller FORCE RLS på `profiles`, og at ingen funktion opdaterer den.
- **Branch fra migrationstrackeren ville ikke give et pålideligt billede** (tidligere drift: migrationer anvendt manuelt) — brug en branch kun til API-trinnet, eller kopiér live-skemaet.
- **Appen mod en ægte database** (profil, onboarding, administrator-skærmene i browseren) skal prøves som sidste gate på branch/staging.

### Efter live-anvendelse (kun med godkendelse)
Kør de samme kontroller mod live uden at ændre data: `has_column_privilege` for alle kolonner, antal admins = 1, og et PATCH-forsøg med en testkonto (forventet 403/42501) — ellers kun læsende forespørgsler.

## 7. Rollback og forbehold

- **Rollback (kun hvis appen går i stykker, og aldrig som første valg):**
  ```sql
  DROP TRIGGER IF EXISTS tr_profiles_afvis_klient_roller ON public.profiles;
  DROP FUNCTION IF EXISTS public.afvis_klient_aendring_af_roller();
  GRANT UPDATE ON public.profiles TO authenticated;   -- GENÅBNER HULLET
  ```
  Foretræk **frem-rettelse**: tilføj den manglende kolonne til `GRANT UPDATE (…)`. Rollback genåbner sikkerhedshullet og kræver en ny vurdering.
- **Feature-flaget `NEXT_PUBLIC_MVP_MODE` påvirker ikke denne migration.**
- **Beslægtede fund (separat vurdering, ikke i denne migration):**
  - `community_memberships.role`: vurderet og specificeret som **A2** — se [A2-community-memberships.sql](A2-community-memberships.sql) og afsnit 8 nedenfor.
  - Supabase-standarden giver `anon`/`authenticated` brede tabelrettigheder (inkl. `TRUNCATE`). PostgREST eksponerer ikke `TRUNCATE`, og RLS beskytter rækker, men en generel stramning af tabelrettigheder bør overvejes som eget, samlet arbejde.
- **Nummerering/proces:** repoets seneste migration er `00071`; live-trackeren har tidligere vist drift. Følg projektreglen: ingen ad-hoc-kørsel mod live — kør i en frisk tråd, efter branch-test og godkendelse.

## 8. Vurdering: `community_memberships.role` (A2)

**Fund (verificeret live):** politikken `Users manage own memberships` er `FOR ALL USING (auth.uid() = user_id)` uden `WITH CHECK`, og `CHECK` tillader `member`/`moderator`. En bruger kan altså oprette eller ændre sin egen række med `role = 'moderator'` for ethvert gruppe-id, og `SELECT` er åben for alle indloggede (alle kan læse alle rækker). Reproduceret i det isolerede miljø.

**Konsekvens i dag: ingen.** Tabellen er et ældre fase-8-lag: **0 rækker**, ingen appkode refererer til den (gruppe-funktionen bruger `user_group_memberships`, hvor der ikke er nogen UPDATE-politik), og ingen RLS-politik på andre tabeller slår op i den.

**Anbefaling: luk den før testbrugere — men som egen, separat migration (A2), ikke blandet ind i A.** Begrundelse: den er latent, ikke ufarlig (den bliver reel i det øjeblik fællesskabsfunktionen genaktiveres eller en politik begynder at bruge `role`); rettelsen er billig og risikofri, fordi tabellen er tom; og en separat fil kan gennemgås og rulles tilbage uafhængigt af den hastende A. A2 erstatter den brede politik med fire snævre (læs egne, opret kun egen og kun som `member`, ret egen uden at kunne hæve rollen, forlad), fjerner tabelniveau-INSERT/UPDATE/TRUNCATE og giver tilbage på kolonner uden `role`. `service_role` kan stadig tildele `moderator`. 100 % af A2's tests består (se tabel ovenfor).

**Samme mønster andre steder?** Jeg har kun kontrolleret kolonner med rolle-/rettighedsnavne (`role`, `visibility`, `*_admin`, `*_tier`). En systematisk gennemgang af alle `FOR ALL`/`UPDATE`-politikker uden `WITH CHECK` på tabeller med privilegerede kolonner anbefales som eget, samlet sikkerhedsspor (ikke gjort).

**Mindre fund (ikke rettet):** `handle_new_user` og `set_admin_on_profile_insert` mangler `SET search_path` (SECURITY DEFINER) — lav risiko, bør hærdes ved lejlighed; ejerens e-mail ligger hårdkodet i en databasefunktion.
