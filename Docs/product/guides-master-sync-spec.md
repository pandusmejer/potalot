# Spec: Synkronisering af Potalot-masterguides → DB-tabellen `guides`

Status: **SPEC — ikke implementeret. Ingen live-DB-skrivning.**
Forfatter-kontekst: fundet under promovering af `tomat-sungold` + `tomat-gardeners-delight` (18/7).

---

## 1. Problemet (den reelle arkitekturfejl)

Potalots guide-lag er delt i **to datakilder, som ikke er koblet sammen**:

| Lag | Kilde | Driver |
|-----|-------|--------|
| **Læse-lag** | statisk `src/data/guides-imported.ts` (`IMPORTED_GUIDES`), genereret fra `content/guides/*.md` | `/guides`-bibliotek, guide-detaljeside, `resolvePlantGuideHref` ("Se guide"-link) |
| **Koblings-lag** | DB-tabellen `public.guides` | `ensureGuideForInventoryItem`, `ensureGuideForPlant`, `getAllGuides` |

De to lag synkroniseres **ikke**. Der findes i dag `0` master-rækker (`user_id IS NULL`) i DB-tabellen `guides` (verificeret mod live-DB 18/7: 14 rækker, alle bruger-guides).

### Konsekvens
Når en bruger opretter fx et frø `Tomat / Sungold`:
- `resolvePlantGuideHref` finder den rigtige Potalot-guide i `IMPORTED_GUIDES` → "Se guide"-linket peger korrekt på `/guides/tomat-sungold`. ✅
- `ensureGuideForInventoryItem` slår op i DB-tabellen `guides`, finder **ingen** master → **genererer et unødvendigt privat AI-udkast** og hæfter det på frøet. ❌

Det undergraver hele idéen med moder-guides: brugeren *ser* den kvalitetssikrede guide, men appen kobler den ikke på og bruger AI-kvote på et dårligere duplikat.

### Mål
Én idempotent sync, der spejler alle public/system-masterguides fra `IMPORTED_GUIDES` ind i DB-tabellen `guides` som master-rækker (`user_id = NULL`), så koblings-laget genbruger dem i stedet for at generere AI-udkast.

**Ikke-mål:** at ændre læse-laget, at ændre guide-indhold, at røre bruger-guides, at flette de to lag til ét (separat, større beslutning).

---

## 2. Skema-virkelighed: statisk shape ≠ DB shape

Kilde: `supabase/migrations/00023_guides.sql` + `rowToGuide()`/`import-guides.ts`.

### DB-kolonner (`public.guides`)
`id` (UUID, `gen_random_uuid()`), `user_id` (UUID, NULL = system), `plant_name`, `variety`, `latin_name`, `guide_level` (`'art'|'sort'`), `parent_guide_id` (UUID FK → `guides.id`), `primary_category_id`, `subcategory_id`, `summary`, `difficulty`, `tags[]`, `quick_facts` (JSONB), `sections` (JSONB), `calendar_rules` (JSONB), `primary_image_url`, `source_links[]`, `status` (`'draft'|'published'`), `is_ai_generated`, `created_at`, `updated_at`.

### Tre uoverensstemmelser syncen SKAL håndtere

1. **`guide_level`-vokabular-drift.**
   DB CHECK tillader kun `'art'` / `'sort'`. Statisk `IMPORTED_GUIDES` (og TS-typen `GuideLevel`) bruger `'species'` / `'variety'`.
   → Sync **oversætter ved skrivning**: `species → art`, `variety → sort`.
   → Advarsel (out of scope, men noteres): `rowToGuide()` caster `row.guide_level` direkte til `GuideLevel` uden at oversætte tilbage, så en DB-master vil bære `guideLevel: 'art'`. Kode, der sammenligner `guideLevel === 'species'` (fx `resolvePlantGuideHref`), fodres i dag altid med `IMPORTED_GUIDES`, ikke DB-rækker, så det er ikke akut — men skal med i en opfølgende oprydning, hvis DB-masters nogensinde vises via `getAllGuides`.

2. **Ingen `slug`-kolonne i DB.**
   Statisk `id` = slug (`"tomat-sungold"`). DB `id` = tilfældig UUID. Der findes ingen stabil, menneskelig nøgle på DB-rækken.
   → Spec kræver en lille skema-tilføjelse (DDL-migration, se §4): `slug TEXT` + partielt unikt indeks for master-rækker. `slug` er syncens idempotens-nøgle.

3. **Ingen `visibility`-kolonne i DB.**
   `rowToGuide()` udleder `visibility = row.user_id ? 'private' : 'public'`. Det betyder: en master med `user_id = NULL` får automatisk `visibility: 'public'` → `guideKindFor()` → `'potalot'`-badge. **Ingen ekstra felt nødvendigt** — badgen bliver korrekt af sig selv.

### Feltmapping (statisk `Guide` → DB-række)

| DB-kolonne | Kilde i `IMPORTED_GUIDES` | Note |
|-----------|--------------------------|------|
| `slug` | `id` | ny kolonne, idempotens-nøgle |
| `user_id` | — | altid `NULL` (master) |
| `plant_name` | `plantName` | |
| `variety` | `variety` | `NULL` for artsguide |
| `latin_name` | `latinName` | |
| `guide_level` | `guideLevel` | oversæt `species→art`, `variety→sort` |
| `parent_guide_id` | `parentGuideId` (slug) | slås op til UUID i pass 2 |
| `primary_category_id` | `primaryCategoryId` | valideres mod DB CHECK |
| `subcategory_id` | `subcategoryId` | |
| `summary` | `summary` | |
| `difficulty` | `difficulty` | |
| `tags` | `tags` | |
| `quick_facts` | `quickFacts` | JSONB 1:1 |
| `sections` | `sections` | JSONB 1:1 |
| `calendar_rules` | `calendarRules` | JSONB 1:1 |
| `primary_image_url` | `primaryImageId` | |
| `source_links` | `sourceLinks` | |
| `status` | — | altid `'published'` |
| `is_ai_generated` | — | altid `false` |

---

## 3. Sync-algoritme

### Kilde
Kun master-guides fra `IMPORTED_GUIDES`, dvs. `visibility ∈ {'public','system'}` (i praksis alle poster i `IMPORTED_GUIDES`, da importen sætter `visibility: 'public'`). Bruger-guides (`visibility: 'private'`) røres aldrig.

### To-pass (parent før barn)
`parent_guide_id` er en UUID-FK, så en sortsguide kan først få sat sin forælder, når artsguidens DB-UUID kendes.

1. **Pass 1 — artsguides (`guideLevel === 'species'`)**
   Upsert alle species-guides. `parent_guide_id = NULL`.
   Byg en `slug → uuid`-mappe over resultatet (både nyoprettede og eksisterende).

2. **Pass 2 — sortsguides (`guideLevel === 'variety'`)**
   For hver: slå `parentSlug` op i `slug → uuid`-mappen fra pass 1.
   - Findes forælderen ikke → **fejl** for den række (skriv den ikke; rapportér). En forældreløs sortsguide må ikke oprettes med `parent_guide_id = NULL`.
   Upsert med korrekt `parent_guide_id`.

### Idempotent upsert (pr. række)
Nøgle: `slug` (blandt master-rækker, `user_id IS NULL`).
- **Findes ingen master-række med `slug`** → `INSERT` → tæl som `create`.
- **Findes en** → sammenlign de mappede felter (indholds-hash el. felt-for-felt).
  - Alle felter ens → `unchanged` (ingen skrivning).
  - Ellers → `UPDATE` af de mappede kolonner + `updated_at = now()` → `update`.
- **Rør aldrig** `id`, `user_id`, `created_at`. **Rør aldrig** rækker med `user_id IS NOT NULL`.

### Sikkerhed / kørsel
- RLS-politikkerne på `guides` kræver `auth.uid() = user_id` for INSERT/UPDATE. For master-rækker (`user_id IS NULL`) er det **aldrig** sandt → syncen **kan ikke** køre i klient-/bruger-kontekst.
  → Syncen **skal** køre med **service-role-nøglen** (server-side script, bypasser RLS) eller som en dedikeret DB-migration/-funktion. Aldrig fra browseren.
- Hele skrivningen kører i **én transaktion**. Fejl i pass 2 (fx manglende forælder) → `ROLLBACK` af hele kørslen, så DB aldrig står halvt synkroniseret.
- **Ingen DELETE.** Hvis en master forsvinder fra `IMPORTED_GUIDES`, rører syncen den ikke (evt. senere `--prune`-flag som separat, eksplicit beslutning — ikke i v1).

### Validering før skrivning
Kør før nogen SQL udføres; ved fejl skrives intet:
- alle `slug` unikke i kilden
- `primaryCategoryId` ∈ DB-CHECK-sættet (`fro, loeg, knolde, buske, traeer, stauder, indkoebsliste`) — bemærk: `favoritter`/`indkoebsliste` fra import-enum er ikke gyldige master-kategorier
- `difficulty ∈ {easy,medium,hard}` eller `NULL`
- hver `variety`-guide har en `parentSlug`, som findes som `species`-guide i kilden
- `quick_facts`/`sections`/`calendar_rules` er gyldig JSON

---

## 4. Nødvendig skema-tilføjelse (egen migration, kør separat)

`slug`-kolonnen findes ikke. Tilføj den før syncen kan være idempotent:

```sql
-- migration: guides_master_slug
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS slug TEXT;

-- slug er kun meningsfuld for master-rækker; håndhæv unikhed dér
CREATE UNIQUE INDEX IF NOT EXISTS idx_guides_master_slug
  ON public.guides (slug)
  WHERE user_id IS NULL AND slug IS NOT NULL;
```

Bruger-guides beholder `slug = NULL` og påvirkes ikke. Migrationen er additiv og ikke-destruktiv.

---

## 5. Matching-adfærd der skal bevises

`ensureGuideForInventoryItem` / `ensureGuideForPlant` matcher i dag:
```
guides.plant_name ILIKE :plantName
  AND (variety ILIKE :variety  |  variety IS NULL)
ORDER BY user_id ASC NULLS FIRST, created_at ASC
LIMIT 1
```
Med masters på plads (`user_id NULL`) vinder de via `NULLS FIRST`. Det er kernen: efter sync skal disse funktioner **genbruge masteren** og **ikke** kalde `generateGuideWithAI`.

### Navnevariationer, apostroffer, store/små bogstaver
- `ILIKE` er case-insensitiv → `Tomat`/`tomat` matcher. OK.
- Apostrof-risiko: masteren har `variety = "Gardener's Delight"` (krøllet? lige? `'`). En bruger, der skriver `Gardeners Delight` (uden apostrof) eller bruger en anden apostroftegn (`'` U+2019 vs `'` U+0027), matcher **ikke**.
  → Syncen skal **normalisere og gemme en kanonisk form**, og matching-siden bør sammenligne på en normaliseret nøgle. Spec anbefaler:
  - gem `variety`/`plant_name` præcis som i `IMPORTED_GUIDES` (kilde-sandhed for visning),
  - men indfør en delt normaliseringsfunktion (trim → lowercase → foldning af apostroffer U+2019→U+0027 → collapse whitespace) brugt **både** ved sync-nøgle og i `ensureGuideFor*`-opslaget.
  - Dette er den samme `norm()`-idé som `resolvePlantGuideHref`, udvidet med apostrof-foldning. Genbrug én funktion, så læse- og koblings-lag matcher ens.

---

## 6. Tests (skal skrives sammen med implementeringen)

1. **Idempotens:** kør sync to gange → anden kørsel rapporterer `0 create, 0 update, N unchanged`.
2. **Master-preference (kerne):** opret inventory-item `Tomat / Sungold` → `ensureGuideForInventoryItem` sætter `guide_id` til master-Sungold og kalder **ikke** `generateGuideWithAI`.
3. **Art-match:** item `Tomat` (uden sort) → kobles til arts-masteren `tomat`, ikke til en sortsguide.
4. **Art+sort-match:** item `Tomat / Sungold` → kobles til `tomat-sungold`, ikke til arts-`tomat`.
5. **Apostrof/variant:** item `Tomat / Gardeners Delight` (uden apostrof) og `Gardener's Delight` (begge apostroftegn) → alle kobler til master-`tomat-gardeners-delight`.
6. **Bruger-guides urørt:** en eksisterende bruger-guide (`user_id != NULL`) med samme `plant_name` ændres/slettes ikke af syncen.
7. **Forældreløs sort:** en sortsguide hvis `parentSlug` mangler i kilden → rapporteres som fejl, hele kørslen `ROLLBACK`.
8. **Parent-relation:** efter sync har hver sorts-master `parent_guide_id` = arts-masterens UUID.
9. **Badge-integritet:** en synket master hentet via `getAllGuides`/`rowToGuide` giver `visibility: 'public'` → `guideKindFor → 'potalot'`.

---

## 7. Foreslået kommando (sikreste form)

```bash
# 1. tør kørsel — skriver intet, rapporterer create/update/unchanged/fejl
npm run guides:sync-master -- --dry-run

# 2. rigtig kørsel — kun efter en ren dry-run
npm run guides:sync-master
```

- `--dry-run` udfører hele validering + diff mod DB og printer en tabel:
  `create: N · update: N · unchanged: N · errors: N` med slug-liste pr. kategori.
- Uden flag: samme validering, derefter én transaktion. Ved enhver fejl → `ROLLBACK` + exit 1.
- Scriptet bruger **service-role-nøglen** fra miljøet (ikke anon-nøglen) og nægter at køre, hvis den mangler.
- Læser kilde fra `IMPORTED_GUIDES` (den allerede-genererede, git-committede fil) — ikke fra `content/guides/*.md` direkte, så sync spejler præcis det, `import:guides` sidst producerede.

---

## 8. Klar adskillelse: indhold vs. kobling

- **Statisk guide-indhold** (`content/guides/` → `IMPORTED_GUIDES`) er kilde-sandhed for *tekst, struktur, quick facts* og redaktionel livscyklus (`status.json`-ledger). Ændres kun via `import:guides`.
- **DB-koblingsdata** (`public.guides`-master-rækker) er en *afledt spejling*, hvis eneste formål er at lade `ensureGuideFor*` genbruge masteren. Ejer aldrig indhold — overskrives altid fra den statiske kilde ved næste sync.

Syncen er altså envejs: `IMPORTED_GUIDES → guides`-master-rækker. DB-masteren er en cache, ikke en kilde.

---

## 9. Rækkefølge for implementering (senere, egen tråd)

1. Skema-migration `guides_master_slug` (§4) — additiv.
2. Delt `normalizeGuideKey()` (§5) brugt i sync + `ensureGuideFor*`.
3. `scripts/guides-sync-master.ts` + npm-script (§3, §7), service-role, transaktion, dry-run.
4. Tests (§6).
5. Kør `--dry-run` mod live, gennemgå rapport, kør rigtig sync.

**Intet af §9 udføres nu.** Denne fil er kun specifikationen.
