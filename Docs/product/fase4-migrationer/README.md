# Fase 4 — migrationsspecifikationer (til gennemgang)

**Status 6/11 2026 (aften): A, B og D ER ANVENDT PÅ PRODUKTION og efterkontrolleret** (A: A-udfoerelse-2026-11-06.md; B og D: BD-udfoerelse.md). Resten af afsnittet nedenfor er den oprindelige status fra forberedelsen. **Status tidligere 6/11:** **A ER ANVENDT PÅ PRODUKTION 6/11 2026 og efterkontrolleret (alle [OK]) — se [A-udfoerelse-2026-11-06.md](A-udfoerelse-2026-11-06.md); manuel app-prøve udestår.** Planen: [A-produktionsplan.md](A-produktionsplan.md). A er forberedt som migrationsfil, testet isoleret (100/100) OG gennem PostgREST på en midlertidig Supabase-branch (30/30; se [API-test-A-branch.md](API-test-A-branch.md))** — `supabase/migrations/00072_profiles_laas_privilegerede_kolonner.sql` (uncommittet; IKKE anvendt på live; intet kører den automatisk). **A2** (community_memberships) er forberedt som SQL-forslag i denne mappe og testet isoleret og via API (10/10). B, C og D er stadig kun specifikationer (afventer godkendelse; **C forbliver deaktiveret**). Intet er kørt mod live.

| Rækkefølge | Spec | Formål | Afhænger af |
|---|---|---|---|
| **1** | [A — sikkerhed, `is_admin`](A-sikkerhed-is-admin.md) | Luk at brugere kan gøre sig selv til admin | — |
| 1b | [A2 — `community_memberships`](A2-community-memberships.sql) | Luk selv-tildeling af moderator-rolle (latent) | A (samme proces; separat fil) |
| 2 | [B — AI-samtykke](B-ai-samtykke.md) | Gemt, tilbagekaldeligt samtykke til personlig kontekst | A |
| 3 | [D — dagligt Gartner-loft](D-gartner-dagsloft.md) | Atomisk serverkvote (beslutning 4) | A |
| 4 | [C — minimal brugsanalyse](C-brugsanalyse.md) | MVP-måling, **inaktiv** til vurderingen er godkendt | A |

*D er tilføjet ud over de tre bestilte: loftet skal holde ved samtidige kald og er driftsstyring, ikke analyse — se D.*

## Principper (gælder alle)
1. **Sikkerhed først.** A gennemføres og **verificeres** før testbrugere og før B–D.
2. **Additive.** Kun nye kolonner, tabeller og funktioner; ingen sletning eller ændring af eksisterende data.
3. **Kolonnenavnet `user_id` er et krav** for nye brugerejede tabeller: `delete_account()` (00057) rydder automatisk alle `public`-tabeller med den kolonne.
4. **Samtykke og analyse er særskilte formål** — ingen fælles felter, tabeller eller tekster.
5. **RLS beskytter rækker, ikke kolonner.** Rettigheder på kolonner/tabeller er afgørende, og nye kolonner på `profiles` kræver en eksplicit `GRANT UPDATE (…)` efter A.
6. **Kode kan udrulles uden migrationen** og skal da fejle sikkert: samtykke = fra, analyse = ingen skrivning, kvote = ingen (logges).

## Rollback — database er IKKE kode
`NEXT_PUBLIC_MVP_MODE=off` tilbageruller **ikke** databasen. Hver spec har to adskilte rollbacks: (1) kode/flag (uden databaseændring) og (2) database (eksplicit SQL, som ikke køres automatisk). Anbefalingen er at lade additive kolonner/tabeller stå (harmløse, default-fra) og kun rulle databasen tilbage ved en bevidst beslutning. A's rollback genåbner et sikkerhedshul og bør i praksis erstattes af en frem-rettelse.

## Proces (projektreglen: aldrig ad-hoc mod live)
1. Gennemgå og godkend hver spec.
2. Kør i en **Supabase-branch eller lokal stak**, kør specens tests (A's tests inkl. den simulerede klient og PostgREST-forsøget).
3. Først derefter anvendes migrationen på live i en frisk tråd, med verifikation bagefter (`has_column_privilege`, antal admins = 1, appens profil-/onboarding-flows).
4. Live-trackeren har tidligere vist drift (migrationer anvendt manuelt): bekræft nummer og tilstand, før filen oprettes. Repoets seneste var `00071`; foreslåede numre: A = 00072 (filen findes), A2 = 00073, B = 00074, C = 00075, D = 00076.

## Opbevaring og sletning (samlet oversigt)

| Data | Tabel | Indhold | Opbevaring | Sletning |
|---|---|---|---|---|
| Gartner-vurdering bundet til logpost | `ai_conversations` (`log_id` sat) | spørgsmål + svar | så længe logposten findes | cascade ved logpost-/kontosletning |
| Tidligere frie spørgsmål (guide/Spørg Potalot) | `ai_conversations` (`log_id` tom) | spørgsmål + svar | **bevares uændret** (slettes ikke i MVP-arbejdet) | kontosletning; evt. senere oprydning efter særskilt beslutning |
| Fremtidige frie spørgsmål | — | **gemmes ikke længere** (kodeændring, ingen migration) | — | — |
| Bruger-gemte råd | `gartner_saved` | spørgsmål, svar, kontekst-id'er | til brugeren sletter / kontoen slettes | kontosletning (FK cascade) |
| AI-samtykke | `profiles` (+ evt. `ai_samtykke_historik`) | valg + tidspunkt (+ historik) | så længe kontoen findes | kontosletning |
| Brugsanalyse (C) | `app_haendelser` | bruger-id, hændelsestype, tidspunkt | 180 dage (forslag) | oprydningsfunktion + kontosletning |
| Dagskvote (D) | `ai_dagsforbrug` | bruger-id, dato, antal | 7 dage | funktionen rydder + kontosletning |

**Ikke afklaret og skal verificeres før lancering:** leverandørens (Anthropic) egen opbevaring og databehandleraftale for spørgsmål og kontekst, samt om brugere kan slette enkelte gemte råd i appen.

## Godkendelser der mangler fra jer
- A, B (inkl. om **B+ historik** tages med), D: godkend specs.
- C: godkend **vurderingen** (behandlingsgrundlag, 180 dages opbevaring, manuel oprydning vs. `pg_cron`, model 1–4). Analysen forbliver slået fra, til det er sket.
- Beslutning 5: godkend de to små hændelseskald i scan-/manuel-stien (rører `tilfoej-flow.tsx` på to linjer).
