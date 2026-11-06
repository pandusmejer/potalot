# Produktionsplan for migration A (`is_admin`) — til godkendelse

**Status 6/11 2026:** forberedt. **Intet er udført mod produktion.** Dette dokument er grundlaget for én præcis godkendelse.

## 1. Den handling, der ønskes godkendt

> Kør migration `00072_profiles_laas_privilegerede_kolonner.sql` (sha256 `8443a20c00a2a3085d398cfba4f81ec5a2b6e385f48990dd23f416237bbd29a9`) **én gang** mod produktionsprojektet `whtyexhqcpcgpludvkon` via `execute_sql` i **ét** kald (samme vej som på testbranchen) — efter at forudsætningerne i afsnit 7 er opfyldt og `01-foer-kontrol.sql` er identisk med baseline. Derefter køres `02-efter-kontrol.sql` (rollback-sikker) og rettighedshashen sammenlignes. **Ingen andre skrivende handlinger.** Ved ethvert afvigende resultat stopper jeg og rapporterer; rollback (`03-rollback.sql`) køres kun efter jeres særskilte ja.

Ikke omfattet: A2, B, C, D, app-deploy, push, ændring af migrationsregisteret, andre tabeller/politikker/funktioner.

## 2. De seks kontroller, I bad om

### 2.1 SQL'en er identisk med den, der bestod API-testen — ✅
- Filen blev sidst ændret **10:45:51** lokal tid; testbranchen blev oprettet **09:54:43 UTC = 10:54:43 lokal** → filen er uændret siden før testen (og er ikke rørt efter).
- Testbranchens triggerfunktion havde `md5(prosrc) = e22953c7eeabad1d97da4789f7883e7a`; filens funktionskrop har samme hash. Branchens rettigheder (15 kolonner, tabelrettigheder) svarede til filens `GRANT`/`REVOKE`.
- **Hash til kontrol umiddelbart før kørsel:** fil `8443a20c…bd29a9` og kanonisk SQL (kun sætninger, uden kommentarer/tomme linjer, 29 linjer) `0faf85f468854e9ec73d6ce47ec09e390aaca9872ea6d83c76bc0a0d95384932`. Er hashen en anden, kører jeg ikke.

### 2.2 Produktionens tilstand siden testen — ✅ uændret
Samme fingeraftryk-forespørgsel kørt 6/11 efter testen. **Alle 10 kategorier er identiske med baseline** målt før branchen blev oprettet:

| Kategori | Antal | Fingeraftryk (MD5) |
|---|---|---|
| constraints | 14 | `a413e8d98c5b94af32b5426619a390ab` |
| funktioner-acl | 4 | `735cf78db917c0093fdfbab11365edd1` |
| funktioner-krop | 4 | `6a393ca1b06f11eb3067f9fd9c71b488` |
| indeks | 10 | `d4ec7bf2c3418b137dc1be989ef35d1a` |
| kolonne-grants | 516 | `a8f32231b75a8cecdbade9e3f5375fb7` |
| kolonner | 43 | `483ddf20324bb6be12032a9550daee7c` |
| politikker | 7 | `e2ee726d8e9bb3c9056040a5c5fd0b3c` |
| rls-flag | 3 | `a466d1ed22b1c0864c8f5383cb628b80` |
| tabel-grants | 63 | `8d4b3b57f532cedc58d830eb7216b09f` |
| triggere | 2 | `d9f602751c84cea8d95cb399bb94e540` |

Tilstand: 13 profiler, **1 admin**, 0 med anden tier end `free`, 1 trigger på `profiles`, ingen åbne lange transaktioner, ingen ventende låse, migrationsregister uændret (22 poster, seneste `20260830184352`). Postgres 17.6.

### 2.3 Migrationen kan anvendes alene — ✅ (metode valgt)
- `execute_sql` udfører **kun den tekst, den får**. Der findes ikke begrebet "ventende migrationer" i det kald. Det er præcis den vej, testbranchen brugte.
- Hverken Netlify-build (`netlify.toml`) eller CI (`ci.yml`: `tsc` + `npm test`) kører migrationer.
- **Alternativ (ikke valgt):** `apply_migration` ville også kun køre den ene fil og skrive en post i migrationsregisteret, men er ikke prøvet på branchen. Vil I have en registerpost, kan proceduren først øves på en ny midlertidig branch (~$0,013). *Anbefaling: ingen registerpost (mindst mulig ændring); dokumentér i stedet anvendelsen her og i repoet.*

### 2.4 Migrationshistorikken stemmer ikke med repoet — ⚠️ dokumenteret, `db push` er FORBUDT
- Repoet har **72** migrationsfiler; produktions-registret har **22** poster. **52 repo-filer har ingen tilsvarende post**: alle 51 fra `00001`–`00052` (aldrig registreret — anvendt manuelt) plus den nye `00072`.
- Registret har tre poster med samme nummer `00057` og otte uden nummerpræfiks (anvendt med andre navne).
- En `supabase db push` ville forsøge at anvende de **52** filer, herunder 51 ældre, der ikke er idempotente: blandt dem 1 med `DROP TABLE`, 3 med `DELETE FROM`/`TRUNCATE` (bl.a. `00021` sletter data for et fast demo-bruger-id), 5 med seed-`INSERT` (dubletter) og 2 med `CREATE TABLE` uden `IF NOT EXISTS` (fejler midtvejs). **Det må aldrig køres mod produktion.** (CLI'en er heller ikke installeret her.)
- Konsekvens for A: den anvendes **udelukkende ved at udføre filens SQL direkte** (afsnit 1). Registret rettes ikke i dette trin.

### 2.5 Backup og gendannelse — ⚠️ kan ikke verificeres herfra
- Organisationen har Pro-abonnement (verificeret). Supabase Pro indeholder daglige sikkerhedskopier; **PITR er et tilkøb**. Jeg kan ikke se backup-status via de værktøjer, jeg har.
- **Forudsætning (jer):** åbn *Database → Backups* i Supabase-dashboardet, bekræft at der findes en sikkerhedskopi fra de seneste 24 timer, og notér tidspunktet (og om PITR er aktiv).
- **Hvad en gendannelse faktisk betyder her:** migrationen ændrer **kun rettigheder og tilføjer én trigger** — ingen data. Den relevante "gendannelse" er derfor **rollback-SQL'en** (`produktion/03-rollback.sql`), som gendanner produktionens ACL præcist (målt 6/11: `{postgres=arwdDxtm/postgres, anon=…, authenticated=…, service_role=arwdDxtm/postgres}`, ingen kolonne-ACL'er) — øvet i replikaen: ACL identisk før/efter rollback, og fejlen er åben igen. En fuld databasegendannelse ville kassere data skrevet efter sikkerhedskopien og er **ikke** den rette reaktion på en rettighedsfejl.
- **Data-fri snapshot taget (ACL, triggere, politikker for `profiles`)** — se afsnit 8.

### 2.6 Præcis plan — se afsnit 4–6.

## 3. Hvad migrationen ændrer — og ikke ændrer
Ændrer: `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated`; `GRANT UPDATE (15 kolonner) ON public.profiles TO authenticated`; ny funktion `afvis_klient_aendring_af_roller()` (SECURITY INVOKER) og ny trigger `tr_profiles_afvis_klient_roller` på `profiles`.
Ændrer **ikke**: nogen data; nogen anden tabel, politik, funktion eller trigger; `service_role`/`postgres`-rettigheder; migrationsregisteret; app-koden (ingen deploy). Varighed: millisekunder; tabellen har 13 rækker.

## 4. Udførelsesplan (rækkefølge, forventet resultat, stopkriterier)

| Trin | Handling | Forventet | Stop hvis |
|---|---|---|---|
| T0 | **Jer:** godkend handlingen i afsnit 1, bekræft backup (afsnit 2.5), og vær til rådighed ~10 min til app-prøven | — | ingen backup / ikke til stede |
| T1 | Bekræft fil-hash og kanonisk hash (afsnit 2.1) | begge matcher | afvigelse |
| T2 | Kør `01-foer-kontrol.sql` (kun læsning) | fingeraftryk = tabellen i 2.2; admins = 1; ikke_free = 0; profil_triggere = 1; registret = 22/`20260830184352`; ingen lange transaktioner/låse; notér `rettighedshash` og id'er | **enhver afvigelse → stop, undersøg** |
| T3 | Kør migrationen (afsnit 1) | ingen fejl (tom resultatliste) | fejl → transaktionen er atomisk; kør T2-fingeraftryk igen for at bekræfte uændret tilstand; rapportér |
| T4 | Kør `02-efter-kontrol.sql` (erstatter id'er fra T2). Resultatet står i fejlbeskeden `CHECK-RESULTAT:`; **alt rulles tilbage** | alle linjer `[OK]`; ingen `[FEJL]`; kolonnerettigheder som forventet; triggere = 2; trigger-funktion SECURITY DEFINER = false; `delete_account`: authenticated = false, service_role = true | **enhver `[FEJL]` → stop; se afsnit 5** |
| T5 | Kør `01`-afsnit 3 igen (rettighedshash) | **identisk** med T2 (ingen rettighedsændring af data) | afvigelse |
| T6 | **Jer, i appen (rigtig bruger):** (a) gem en ændring i *Profil* (fx visningsnavn), (b) åbn *Indstillinger → placering* og gem, (c) åbn `/admin` som admin, (d) åbn onboarding-flowet (kun visning) | alt gemmes; `/admin` åbner | ét fejler → afsnit 5 |
| T7 | Genkør fingeraftryk: **kun** `profiles` (kolonne-grants, tabel-grants, triggere) må være ændret; `general_garden_tasks`/`community_memberships`/funktioner uændrede | som forventet | uventet ændring |
| T8 | Rapportér resultat. **Stop.** | | |

`02-efter-kontrol.sql` kører **ikke** før migrationen på produktion (den indeholder bevidste angrebsforsøg; de er rollback-sikre, men unødvendige før rettelsen — fejlen er allerede reproduceret på branchen).

## 5. Fejlhåndtering
- **Migrationen fejler:** atomisk (én transaktion) — intet er ændret; bekræft med fingeraftryk; ret årsagen i testmiljø.
- **Efter-kontrol viser `[FEJL]` på en *legitim* handling** (fx en profilkolonne mangler i `GRANT`): **frem-ret** med en målrettet `GRANT UPDATE (kolonne) ON public.profiles TO authenticated;` (efter godkendelse), ikke rollback — rollback genåbner hullet.
- **Efter-kontrol viser `[FEJL]` på et *angreb*** (hullet ikke lukket): stop, undersøg; ingen yderligere ændringer før I har set resultatet.
- **Appen er ude af funktion og kan ikke frem-rettes hurtigt:** `03-rollback.sql` (kun efter jeres ja), derefter rapport og ny plan.
- **Backup:** bruges ikke til denne ændring (ingen data berørt), medmindre en uventet datakorruption opstår (urealistisk for en ren rettighedsændring).

## 6. Efterkontrol mod jeres seks krav

| Krav | Hvordan det bevises på produktion |
|---|---|
| Almindelige brugere kan ikke ændre `is_admin`/`subscription_tier` | T4: `has_column_privilege` = false + angreb som rigtig brugers id afvises med *permission denied for table profiles*; T4 blandet opdatering afvist |
| Brugere kan ikke oprette profiler med admin-rettigheder | T4: INSERT med `is_admin=true` afvises med *permission denied* (ikke blot RLS) + `has_table_privilege(INSERT) = false` |
| Profilredigering og onboarding virker | T4: tilladte felter kan opdateres som almindelig bruger og admin (rolled back); T6 (a)(b)(d) i appen; kolonnelisten dækker alle 15 felter, som koden skriver |
| Den eksisterende administrator har adgang | T4: admin læser `is_admin = true`; T2/T5: admins = 1; T6 (c) `/admin` åbner |
| Kontosletning virker | T4: `delete_account` kan udføres af `service_role` (og ikke af `authenticated`), og et kald med et ukendt id kører igennem uden blokerede tabeller; branch-test viste fuld sletning inkl. cascade |
| Ingen brugerdata ændret | T5: identisk rettighedshash; ingen skrivende SQL i filen (statisk kontrol); T4 ruller alt tilbage |

*Ikke verificerbart uden at oprette en konto:* at en **ny tilmelding** stadig opretter en profil (`handle_new_user`). Migrationen rører hverken funktionen eller triggeren på `auth.users` (T7 bekræfter uændrede fingeraftryk), og det er prøvet på branchen. Den kan afprøves ved næste rigtige tilmelding.

## 7. Forudsætninger (skal være opfyldt, før T3)
1. Jeres ja til handlingen i afsnit 1.
2. Backup-tjek i dashboardet (afsnit 2.5).
3. I er til stede ~10 minutter til app-prøven (T6) — helst uden for spidsbelastning.
4. T1 og T2 matcher.

## 8. Data-fri snapshot af `profiles` før ændringen (6/11 2026)
```
tabel-ACL   : {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}   ejer: postgres
kolonne-ACL : ingen (19 kolonner uden egen ACL)
triggere    : tr_set_admin_on_profile_insert  BEFORE INSERT … EXECUTE FUNCTION set_admin_on_profile_insert()
politikker  : "profiles insert own" INSERT WITH CHECK (auth.uid() = id)
              "profiles select own" SELECT USING (auth.uid() = id)
              "profiles update own" UPDATE USING (auth.uid() = id)
```

## 9. Efter udførelsen
- Migrationsfilen og dokumenterne committes **lokalt** (egen commit, ikke blandet med MVP-faserne) først, når A er verificeret på produktion — så repoet afspejler det, der er live.
- **Ingen push eller deploy.** Rettelsen er en databaseændring og kræver ikke app-deploy. De ni MVP-commits frigives uafhængigt. Skal selve filen frem til GitHub før MVP-batchen, kræver det en separat gren fra `origin/main` (cherry-pick) — et bevidst brud på reglen om at arbejde på `main`, som kun I kan godkende.
- **A2** tages umiddelbart efter, som egen ændring med egen plan.

## 10. Øvelse af kontrol-scripts (isoleret replika)
`produktion/02-efter-kontrol.sql` og `03-rollback.sql` er øvet i replikaen: *før A* viser blokken `[FEJL]` på alle angreb; *efter A* kun `[OK]`; *efter rollback* er fejlen åben igen og ACL'en identisk med før (ingen kolonne-ACL'er). Øvelsen afslørede og rettede en fejl i scriptet (en funktionstjek, der kastede en fejl, hvis funktionen ikke fandtes). Data var uændret efter alle trin. Scripts og øvelsen: [produktion/](produktion/).
