# Havebog — status-audit (9. juli 2026)

> **Denne audit er den nye sandhed for Havebog-status.** Tidligere statuslister
> i chat/hukommelse er forældede — især omkring Forvandlinger og Diktafonen (se
> "Rettelser" nederst). Auditten er grundet i den faktiske kode, ikke i hvad vi
> "talte om". Verificér altid mod kode før du antager at noget findes.

Havebogens visuelle hovedstruktur er landet, og de første motorer er bygget og
testet. Vi er **færdige med første design- og motorfase** — ikke med Havebog.

Statustilstande skelnes knivskarpt:

- **Bygget og i drift** — kode findes, kører mod ægte data, ramte brugere ser det.
- **Bygget men ikke operationelt** — kode findes ende-til-ende, men fejler/er slukket
  i drift (fx migration ikke kørt).
- **Kun demo** — findes kun med `DEMO_`-data; gated `false` for indloggede (ærligheds-reglen).
- **Kun visuelt** — layout/komponent findes, men ingen motor/kilde bag.
- **Kræver DB/migration** — kan ikke aktiveres uden skema-ændring mod live DB.
- **Senere sprint** — hverken bygget eller påbegyndt; kun besluttet/spec'et.

---

## Bygget og i drift (ægte data, ramte brugere ser det)

| Del | Kilde/motor | Noter |
|---|---|---|
| Hero + dagtæller + dateline | `heroStats`, `beregnSaeson` | Dagtæller følger sæsonmodel; demo har fallback |
| **Sæsonmodel** | `src/lib/havebog-saeson.ts` (15 tests) | Første såning → næste års første såning; nulstiller ikke 1. jan. Fundament for hele `havebog.ts` |
| Dagens historie (Ildsted) | `src/lib/havebog-dagens-historie.ts` (6 tests) | Vægtet kandidat-vælger; bruger guideintervaller; kort titel + undertekst |
| Prøv næste år (Inspirér mig) | `src/lib/havebog-proev-naeste-aar.ts` (7 tests) | Sorter/arter × guidekatalog → ét forslag; gated `inspirerForslag !== null` |
| Spisekammer-motor | `src/lib/havebog-spisekammer.ts` (7 tests) | Grupperer sæsonens høstlogs; **antal = antal logs, ikke mængde** (ingen mængdefelt i DB) |
| Forvandlinger — koncept/ruter/kategorier/detaljer | `src/lib/havebog-forvandlinger.ts` + `/havebog/forvandlinger[/[id]]` | 8 kategorier, ~23 forvandlinger, `vaelgForvandlinger` (tests), sikkerheds-note på plej/olie. Idé-tiles er crop-drevne for indloggede |
| Minder | `byggMinder` (havebog.ts) | Timeline m. kind/thumbnail/meta; gated `minder.length > 0` |
| Vendepunkter / På denne dag | `byggVendepunkter`, `onThisDay` | Gated på data |
| Historien fortsætter | `archivedPlants` (is_archived-query) | Arkivstak-redesign; gated `archivedPlants.length > 0` |
| Demo-trim + kurator | `src/lib/havebog-kurator.ts` | Demo = kurateret form (fast top + maks 3 rum); hele huset flyttet til `/admin/qa/havebog` |

---

## Bygget men ikke operationelt

| Del | Hvad findes | Hvorfor ikke i drift |
|---|---|---|
| **Diktafon-indbakke (`TalOptager`)** | UI + fase-maskine (idle→lytter→skriver→fortolker→forslag→gemt), `src/actions/optagelser.ts` (gemOptagelse/listOptagelser/behandlOptagelse mod `voice_notes`), Web Speech-transskription (browser da-DK), migrationsfil `supabase/migrations/00053_voice_notes.sql` | **Migration 00053 er ikke kørt mod live DB** → indlogget-flowet fejler. Desuden: ingen lydfil-lagring (kun Web Speech, ingen blob), AI-fortolknings-endpoint skal verificeres |

Dette er **ikke** "bare lige en knap" — det er et rigtigt backend-sprint (migration + drift + evt. lydlagring + AI-verifikation), der skal køres rent, ikke klemmes ind.

---

## Kun demo (gated `false` for indloggede)

Renderer hardcoded `DEMO_`-konstanter; kan aldrig ramme en rigtig bruger før deres
deriver/kilde lander.

- **Dyrkerstatus** — ingen afledningsmotor (identitet, ikke gamification; besluttet retning)
- **Kompetencer** — ingen afledningsmotor (kobling til logs/guides mangler)
- **Vejret i haven** — ingen motor (skal være redaktionel betydning, ikke udsigt nr. 2)
- **Projekter**
- **Bedrifter**
- **Populært lige nu**

---

## Kun visuelt (layout uden motor bag)

- **Tal til din have (demo-variant)** — `TalTilDinHave`: eksempler + afspilning, ren visning
- **"Se tidligere sæsoner"-indgang** (Historien fortsætter) — bevidst **ikke-navigerende** placeholder; peger på et sæsonarkiv der ikke findes endnu
- **Forvandlinger foto-assets** — mapperne findes (`public/assets/spisekammer/…`, tomme + `.gitkeep`), registret seeder kun eksisterende makroer; **ingen dedikeret `selectForvandlingAssets()`** (mosaikken genbruger `selectSpisekammerAssets`). Detaljesidernes CTA'er ("Gem i Havebogen"/"Føj til log") er styled placeholders

---

## Kræver DB/migration

- **Diktafon-indbakke** — migration 00053 (`voice_notes`) + evt. lydfil-lagring
- **Spisekammer reel mængde** — nyt mængdefelt på høstlogs (i dag = antal logs)
- **Sæson-resume/rollover** — model for afsluttet sæson
- **Sæsonarkiv** — udvid `beregnSaeson` til at enumerere alle sæsongrænser

---

## Senere sprint (ikke bygget, kun besluttet)

- **Forvandlinger foto-asset-system** (NÆSTE — se scope nederst): `selectForvandlingAssets()` + kategori/mood-fallback + rigtige fotos
- **Diktafon-backend-sprint** — migration + drift + lydlagring + AI
- **Dyrkerstatus + Kompetencer** — afledte motorer (skjul uden data)
- **Vejret i haven** — redaktionel motor
- **Sæson-resume + Sæsonarkiv** — samlet; kræver sæsongrænse-enumerering

---

## Rettelser til tidligere status (drift der var sneget ind)

1. **Forvandlinger-ruterne, kategorierne og detaljesiderne ER bygget** (commit a8e76f3).
   Tidligere note sagde "ikke bygget" — forkert. Det der mangler er **foto-asset-systemet**,
   ikke konceptet.
2. **Diktafonen er ikke "kun UI-lag"** — den er skrevet ende-til-ende (UI + actions +
   migration + transskription), men **ikke operationel** fordi migration 00053 ikke er kørt.
   Det er en tredje tilstand: *bygget men ikke i drift*.

---

## Anbefalet næste rækkefølge

1. **Forvandlinger: luk foto-gabet** (lille, afgrænset, gør siden visuelt uimodståelig)
   — `selectForvandlingAssets()`, kategori/mood-fallback, rigtige fotos, mosaik der ikke knækker.
2. **Diktafon-indbakke = rent backend-sprint** — kør 00053 (verificeret, frisk tråd),
   lydlagring, AI, statusflow.
3. **Dyrkerstatus + Kompetencer** — afledte motorer.
4. **Vejret i haven** — redaktionel motor.
5. **Sæson-resume + Sæsonarkiv** — samlet, kræver sæsongrænse-enumerering.
