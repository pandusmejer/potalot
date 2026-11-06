# Migration B (samtykke) og D (dagsloft) — samlet, kontrolleret produktionsplan

**Status 6/11 2026:** forberedt og testet; **IKKE anvendt på produktion.** Filer (uncommittede, som 00072):
`supabase/migrations/00074_profiles_ai_samtykke.sql` (B) · `00076_ai_dagsforbrug.sql` (D).
Specifikationer: [B-ai-samtykke.md](B-ai-samtykke.md), [D-gartner-dagsloft.md](D-gartner-dagsloft.md).

## Beslutninger (Anna 6/11)
1. Samtidighedstest på midlertidig Supabase-branch — **gennemført og branchen er slettet** (kun `main` står tilbage).
2. **Ingen tilbagebetaling** af AI-kvote ved fejlede kald i MVP 1.0. Reservationen sker før kaldet, så et fejlet kald tæller med. Den atomiske tæller og de tydelige beskeder (429/503) er bevaret.
3. **Numrene 00074 og 00076 er verificeret frie:** ingen dubletter i repoet, intet på `origin/main`, og produktionsregistret (22 poster, seneste `20260830184352 reminder_relevans_bloklisten`) indeholder hverken 00073–00076. *Registret er ufuldstændigt (drift): 00072 er anvendt manuelt og står der ikke — kontrollér derfor også `to_regclass`/kolonner i BD-01, ikke kun registret.* 00073 er forbeholdt A2.

## Testresultat
| Test | Resultat |
|---|---|
| PGlite, faktiske migrationsfiler på replika + A (`test-BD/test-BD.mjs`) | **97/97** — RLS, samtykke, loft, døgnskifte (vinter/sommer/skiftedage/årsskifte), oprydning, kontosletning, fejlscenarier, rollback, kontrolscripts |
| **Rigtig Supabase-API** (PostgREST/GoTrue/supabase-js, branch `sikkerhedstest-bd`, `test-BD/api/samtidighed.mjs`) | **28/28** — *40 parallelle kald mod grænse 30 giver præcis 30 tilladt / 10 afvist med unikke antal 1..30*; med 29 brugt får præcis ét kald det sidste; 3 brugere samtidigt; grænse som parameter; adgangskontrol; samtykke (til/fra, tidsstempel kun fra databasen, andres række urørt, blandet opdatering med is_admin afvist) |
| Kontosletning gennem API/DB | `delete_account` kan hverken kaldes af authenticated eller anon (42501). Som service_role rydder den tælleren, samtaler og frø for brugeren og efterlader andre urørt; sletning af auth-brugeren fjerner profilen |

**Begrænsninger:** (a) `service_role`-nøglen findes ikke for mig, så serverens `auth.admin.deleteUser` er ikke kørt — sletningen er kørt som `SET ROLE service_role` i SQL; (b) branchen er en opbygning fra metadata (ikke en klon) og har strammere standardrettigheder end produktion — de brede produktionsdefaults er testet i PGlite; (c) den nye Gartner-kode (route, UI) er ikke afprøvet mod branchen med en indlogget browser, kun via tests; (d) de to første forsøg i sletningstesten ramte forkert bruger (navnet var ændret til "Alice") og blev gentaget korrekt — ingen produktfejl.

## Samlet produktionsplan (hvert trin kræver særskilt "go")
**Forudsætninger:** frisk backup bekræftet (tidspunkt noteres). Kode er IKKE deployet. `GARTNER_DAGLIGT_LOFT` er ikke sat (standard 30).

1. **BD-01** ([produktion/BD-01-foer-kontrol.sql](produktion/BD-01-foer-kontrol.sql), læsende). Forventet: admins = 1, ingen `ai_personlig_kontekst*`-kolonner, ingen `ai_dagsforbrug`/`reserver_gartner_spoergsmaal`/`saet_ai_samtykke_tidspunkt`, 2 triggere på profiles, `authenticated` kan ikke sætte `is_admin`. **Noter baselines** (profil-hash og `ai_conversations`-hash). Afvig ét tal → STOP.
2. **Anvend D (00076)** som én transaktion (SQL editor / `apply_migration`).
3. **BD-02** ([produktion/BD-02-efter-kontrol.sql](produktion/BD-02-efter-kontrol.sql), rollback-sikker `DO`-blok; kræver to ikke-admin bruger-id'er). Forventet: ingen `[FEJL]`; D-linjerne `[OK]`. *Dette er porten for Gartner-koden: Migration D skal virke, før koden må udrulles.*
4. **Anvend B (00074)**; **BD-02** igen → alle `[OK]` inkl. B. Sammenlign baselines fra trin 1 (profiler og `ai_conversations` identiske; alle profiler `ai_personlig_kontekst = false`).
5. **Hold:** intet deployes, før trin 3–4 er verificeret og du har godkendt kode-releasen separat. (Koden fejler lukket: uden D → 503, uden B → samtykke fra og kort skjult.)
6. **Kode-release (særskilt plan, ikke del af denne):** fase 4 ligger oven på de ni MVP-commits (848f5b7). Efter deploy: røgtest som rigtig bruger (spørg Gartneren, slå samtykke til/fra, se "Gartneren brugte …"), og kontrollér at `ai_dagsforbrug` tæller op.

**Rollback** ([produktion/BD-03-rollback.sql](produktion/BD-03-rollback.sql), kør kun den nødvendige blok): *D* — fjern/erstat først kodens kvotekald, eller sæt `GARTNER_DAGLIGT_LOFT` højt / publicér det forrige deploy (ellers 503 på alle spørgsmål); derefter drop funktion + tabel (mister kun dagstællere). *B* — anbefalet: lad kolonnerne stå (harmløse, default false).
