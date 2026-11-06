# Migration B og D — endelig udførelse (afventer Annas særskilte "go")

**Status 6/11 2026:** forberedt. Intet er kørt. Planen og testene står i [BD-migrationsplan.md](BD-migrationsplan.md) (97/97 PGlite · 28/28 mod rigtig Supabase-API inkl. 40 samtidige kald).

## Bundet til disse filer (kontrollér SHA-256 FØR kørsel; afvig → STOP)
| Fil | SHA-256 |
|---|---|
| `supabase/migrations/00076_ai_dagsforbrug.sql` (D) | `00fdb76dc7fbe5a232aeb19047816c656b4f47c2efe0caa57c351059362bcba8` |
| `supabase/migrations/00074_profiles_ai_samtykke.sql` (B) | `f64a938c582ea3f6a0e88b9b5598fccb7be45b8bfacb47fb6cf2ec19f4f935f4` |
| `produktion/BD-01-foer-kontrol.sql` | `ebfdd4ec7029f299670291c7ad8ae9f9f3a0602fe03034e9900ddd73a6464a9a` |
| `produktion/BD-02-efter-kontrol.sql` | `65fdb93eae12e4bbc0e1328d9d934439f422cfc95f680639ffee9bc813d0ffba` |
| `produktion/BD-03-rollback.sql` | `8e8571b28d2226a420e3be79b9f03a6a85cf4ec9943989103076436ed64d571e` |

Kommando: `shasum -a 256 <fil>`.

## BD-01 kørt læsende mod produktion 6/11 (14:40) — forudsætninger holder
Produktion `whtyexhqcpcgpludvkon` (Potalot). Genkør lige før udførelsen; **alle tal skal være identiske**, ellers STOP:

| Kontrol | Forventet |
|---|---|
| profiler / admins / ikke-admin | **13 / 1 / 12** |
| `ai_personlig_kontekst*`-kolonner | 0 |
| `ai_dagsforbrug`, `reserver_gartner_spoergsmaal`, `saet_ai_samtykke_tidspunkt` findes ikke | true |
| triggere på `profiles` | 2 (admin-insert + A) |
| `authenticated` kan sætte `is_admin` | false (A er anvendt) |
| `delete_account` findes | true |
| åbne lange transaktioner / ventende låse | 0 / 0 |
| **Baseline profiler** (antal · hash) | **13 · `e818d0674f8427dbd6ed5e32d2337f23`** |
| **Baseline `ai_conversations`** (antal · id-hash) | **12 · `9ae2861229dd869dc5b2434f30c540ef`** |
| Standardrettigheder (public) | brede: tabeller `arwdDxtm`, funktioner `X` til anon/authenticated/service_role (derfor har D eksplicit REVOKE; testet mod præcis denne ACL) |

*(Hash-formlerne står i BD-01. Efter B og D skal begge hashes være uændrede: BD ændrer ingen eksisterende data.)*

## Udførelse — ét trin ad gangen, stop ved enhver afvigelse
0. **Backup bekræftet** af Anna (tidspunkt noteres her: ______). **Ingen deploy** under hele forløbet.
1. SHA-256-kontrol af filerne. Genkør BD-01 → tallene ovenfor.
2. **Anvend D (00076)** — filens indhold uændret, én kørsel (SQL via `execute_sql`; filen indeholder selv BEGIN/COMMIT). Forventet: fejlfrit.
3. **BD-02** med to ikke-admin bruger-id'er (hentes lige før med `select id from public.profiles where not is_admin order by created_at limit 2;` — id'er skrives IKKE i repoet). Forventet: **ingen `[FEJL]`**, ≥ 24 × `[OK]`; D-linjerne `[OK]`. Resultatet står i fejlbeskeden `CHECK-RESULTAT` (blokken ruller sig selv tilbage).
   → **Port for Gartner-koden: Migration D skal virke, før koden må udrulles.**
4. **Anvend B (00074)** — uændret, én kørsel.
5. **BD-02** igen (alle `[OK]` inkl. B). Genkør baseline-forespørgslerne: profiler-hash og `ai_conversations`-hash **identiske** med tabellen; `select count(*) from public.profiles where ai_personlig_kontekst` = 0.
6. **Stop og rapportér** til Anna: resultatet af trin 3 og 5. Kode-releasen (commit 848f5b7 + a046c85 oven på de ni MVP-commits) er en særskilt godkendelse.

## Afbrydelseskriterier → BD-03 (kun den nødvendige blok)
- Trin 2/4 fejler → transaktionen ruller tilbage af sig selv; intet at gøre ud over at rapportere.
- BD-02 viser `[FEJL]` efter anvendelse → kør rollback for den berørte migration (BD-03, blok D eller B) og rapportér. D-rollback er uden risiko, så længe koden ikke er udrullet (kvotekaldet er ikke live).
- Nødudgang efter kode-release: sæt `GARTNER_DAGLIGT_LOFT` højt (Netlify) eller publicér det forrige deploy, *før* funktionen droppes.

## Efter udførelsen (kode-release, separat godkendelse)
Røgtest som rigtig bruger: spørg Gartneren (tæller i `ai_dagsforbrug` stiger), slå samtykke til/fra på Spørg Potalot (kortet vises først nu, fordi kolonnen findes), tjek "Gartneren brugte …", 429 ved 30 spørgsmål (kan testes midlertidigt med `GARTNER_DAGLIGT_LOFT=2`).

## UDFØRT på produktion 6/11 2026 (Anna godkendt; backup bekræftet af Anna)
- SHA-256 og baseline kontrolleret umiddelbart før: identiske (13 profiler / 1 admin / hash `e818d067…`; 12 AI-samtaler / hash `9ae28612…`).
- **D (00076)** kørt én gang → efterkontrol (D-del af BD-02): 17 × `[OK]`, ingen `[FEJL]`, tæller tom efter prøven.
- **B (00074)** kørt én gang → fuld BD-02: 28 × `[OK]`, ingen `[FEJL]`.
- Slutkontrol: profil-hash og AI-samtale-hash **uændrede**; 0 profiler med samtykke ≠ false; 0 tællerrækker; 3 triggere på `profiles`; `authenticated` kan stadig ikke sætte `is_admin`; ingen åbne lange transaktioner.
- Afvigelse fra planen: efter D kørte jeg en D-only variant af BD-02 (B-linjerne ville ellers fejle, før B fandtes). Ingen rollback, ingen øvrige migrationer, intet `db push`. Migrationsregistret er ikke opdateret (som for A).
- **Kode er IKKE deployet.** MVP-/Gartner-release kræver særskilt godkendelse.
- Efter udførelsen er KUN statuskommentaren i migrationsfilernes header opdateret til "ANVENDT" (SQL-kroppen er uændret); SHA-256-værdierne ovenfor gælder filerne, som de var ved kørslen.
