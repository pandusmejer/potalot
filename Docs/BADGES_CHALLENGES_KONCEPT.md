# Badges & Challenges — Konceptudvikling

## TL;DR

PotAlot har et velbygget badge- og challenge-fundament, men det udnytter kun
~20% af sit potentiale. Konkrete problemer:

1. **Badges er kun sociale** (4 ud af 6) — PotAlot er primært en have-app, men
   der findes ingen badges for at *dyrke*, *høste*, *gemme frø* osv.
2. **Badges vises kun ét sted** (i medlems-paneler i grupper). Brugeren ser
   ikke sit eget badge-galleri på sin profil.
3. **Challenges har ingen afgørelse** — folk indsender, og så ingenting.
   Ingen voting, ingen vinder-kåring, ingen kobling til badges.
4. **Challenges er låst til grupper** — solo-brugere kan ikke deltage i nogen
   challenges, og der findes ingen globale sæson-challenges.
5. **Ingen streaks** — klassisk progression-element mangler helt.
6. **Ingen tier-system** — alle badges er binære (har/har ikke), ingen
   bronze/sølv/guld-progression.

Konceptdokumentet foreslår en 4-trins udrulning, hvor Tier 1 (lavt hængende
frugt) er implementeret som demo og kan ses på `/profil`.

---

## Designprincip: stille anerkendelse, ikke XP-spam

PotAlot's æstetik (Flora Danica, pergament, botanisk grøn) gør at klassisk
gamification (konfetti, XP-bjælker, "Level Up!"-popups) føles forkert.

**Den rette grammatik:** badges som *diplomer* eller *udmærkelser* — ikke som
*loot*. Charme over volumen. Botaniske ikoner, danske termer, langsom rytme
(sæsoner som enhed, ikke timer).

Praktiske implikationer:
- Ingen visuelle interrupts ved badge-uddeling. Brugeren opdager det stille
  (notifikation-bell + galleri på profil)
- Hver badge skal være *bemærkelsesværdig* — ikke "du loggede ind 3 dage i
  træk!"
- Charme: et badge der hedder "Frøvogter" er bedre end "Level 3 Sharer"

---

## Diagnose: hvad der findes lige nu

| Element | Status | Kommentar |
|---|---|---|
| `user_badges`-tabel + `award_badge`-RPC | ✅ Bygget | Migration 00041 |
| 6 foruddefinerede badges | ✅ Bygget | 4 sociale, 1 frø, 1 dyrkning |
| `maybeAwardX`-helpers | ✅ Bygget | 6 stk, kaldes fra mutations |
| `challenges` + `challenge_entries`-tabeller | ✅ Bygget | Migration 00042 |
| Challenge UI (opret/indsend/se) | ✅ Bygget | I gruppe-tabs |
| BadgeChips-komponent | ✅ Bygget | Bruges i medlemspanel |
| Notifikationer på badge-uddeling | ✅ Bygget | Migration 00043 |
| **Brugerens eget badge-galleri** | ❌ Mangler | Ingen profil-visning |
| **Tier-system (Bronze/Sølv/Guld)** | ❌ Mangler | |
| **Streaks (log-streak, sæson-streak)** | ❌ Mangler | |
| **Challenge-voting + vinder-kåring** | ❌ Mangler | |
| **Globale / sæson-challenges** | ❌ Mangler | Kun gruppe-baserede |
| **Badge nudge ("Du er tæt på...")** | ❌ Mangler | |
| **År-i-review ved sæsonafslutning** | ❌ Mangler | |

---

## Forslag: badge-katalog (udvidet)

### Lifecycle / dyrkning (PRIORITET — dækker det manglende)
| ID | Label | Optjenes ved |
|---|---|---|
| `first_sowing` | Første gang i jorden | Første plante sået |
| `first_harvest` | Første høst | Første gang plant.status='hoestklar' eller harvest-log |
| `season_finisher` | Hele vejen rundt | Første plante med status='afsluttet' |
| `survivor` | Skæbnens favorit | En plante overlevede sin første sæson uden at dø |
| `multi_year` | Veteran | Aktiv bruger i 2+ sæsoner |

### Samler / frøbevarelse
| ID | Label | Optjenes ved |
|---|---|---|
| `the_collector` | Frøhamstrer | 25+ items i frøbank |
| `seed_saver` | Frøsamler | 3+ sorter med "gemt frø"-log eller felt |
| `latin_scholar` | Botaniker | 10+ planter med latinsk navn |

### Sort-specifikke (charme)
| ID | Label | Optjenes ved |
|---|---|---|
| `tomato_master` | Tomatekspert | 3+ tomate-sorter høstet samme sæson |
| `chili_lord` | Chili-hersker | 5+ chili-sorter forspiret |
| `flower_friend` | Blomstervennen | 5+ blomster-guides aktiveret |
| `kale_devotee` | Grønkåls-veteran | Kål dyrket gennem en hel vinter |

### Konsistens / streaks
| ID | Label | Optjenes ved |
|---|---|---|
| `daily_logger` | Daglig observatør | 7 dages log-streak |
| `weekly_logger` | Ugentlig journalfører | 4 uger med log-aktivitet |
| `season_diary` | Komplet rejsebog | Komplet log fra såning til høst |

### Læring / autonomi
| ID | Label | Optjenes ved |
|---|---|---|
| `master_apprentice` | Læring til kunsten | Har klonet en master-guide til personlig version |
| `note_taker` | Notetagereren | 10+ private noter på guides |
| `guide_contributor` | Egen forfatter | Har redigeret 3+ private guides |

### Sæson / dato-baserede (sjov, sjælden)
| ID | Label | Optjenes ved |
|---|---|---|
| `early_bird` | Forårsforspirer | Forspirede inden 1. marts |
| `late_bloomer` | Sensommer-jægeren | Aktiveret plante efter 1. august |
| `winter_grower` | Vinterhaven | Dyrkning aktiv okt-feb |

### Sociale (eksisterende, bevares)
- `first_post`, `helpful`, `seed_keeper`, `community_starter`, `green_thumb`,
  `curator`

### Tildeling i 3 lag
- **Bronze**: enkelt forekomst (fx 1 sort)
- **Sølv**: konsolideret (fx 5 sorter)
- **Guld**: sjælden bedrift (fx 25 sorter eller flerårig konsistens)

Database: ny kolonne `tier TEXT` i `user_badges`. UI viser kun højeste opnåede
niveau per badge-id.

---

## Forslag: challenge-typer (udvidet model)

### Nuværende
1. **Show-and-tell** — Indsend foto/note. Ingen vinder. *(eksisterer)*

### Nye foreslåede

2. **Voting** — Medlemmer stemmer på favoritter. Vinder kåres ved deadline.
   Implementation: ny `challenge_votes`-tabel (challenge_id, voter_id, entry_id,
   unique på challenge + voter). Vinder-entry får et `challenge_winner`-badge.

3. **Hold count (leaderboard)** — Tæl noget automatisk fra database. Fx
   "Flest sorter dyrket denne sæson", "Mest komplet log-historik". Ingen
   bidrag nødvendigt — afledt af handling.

4. **Charity / shared** — Gruppen samler indsats. Fx "Samlet høst af æbler"
   eller "Antal nye frø-bytte-tilbud denne måned". Aggregerer på tværs.

5. **Photo of the month** — Rullende månedlig challenge med automatisk
   voting + vinder-badge.

6. **Recipe / kreativ** — Indsend opskrift med ingredienser fra haven.
   Genrespecifikt. Stadig show-and-tell men med template.

7. **Skill** — Indsend dokumentation af specifik færdighed ("Bedste podning",
   "Mest produktive tomatplante"). Vurderes af ejer eller voting.

### Solo-challenges (globale)

Lige nu er challenges låst til grupper. Forslag: introducér **system-challenges**
(`group_id IS NULL`) som alle brugere kan deltage i. Eksempler:

- "Forspir 5 sorter i februar" — sæson-trigger
- "Log hver dag i april" — engagement
- "Dyrk en plante du aldrig har prøvet før" — opdagelse

System-challenges har:
- Fast varighed (1 måned / sæson)
- Auto-kåring (ikke voting)
- Badge-belønning ved deltagelse OG ved fuldførelse

---

## Forslag: streaks

Helt nyt koncept. Forsigtig implementation — streaks kan stresse brugere
hvis de bliver for prominente.

**Datamodel:**
```sql
CREATE TABLE user_streaks (
  user_id UUID,
  streak_type TEXT,  -- 'log_daily', 'season_active', 'frobank_growth'
  current_count INT,
  longest_count INT,
  last_event_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, streak_type)
);
```

**Typer:**
- `log_daily` — dage i træk med mindst én plante-log
- `season_active` — sæsoner i træk med mindst én aktiv plante
- `frobank_growth` — sæsoner i træk hvor frøbanken er vokset

**UI-regel:** Streaks vises KUN når current_count >= 3. Aldrig som modal eller
toast — kun som en lille flamme-emoji + tal nederst på relevant side.

**Badge-kobling:** streak-milestones (7, 30, 365 dage) udløser badges (Bronze,
Sølv, Guld) men kun ved fuldførelse, ikke ved fortsat streak.

---

## Forslag: visnings-steder

| Sted | Status | Forslag |
|---|---|---|
| Medlems-panel (grupper) | ✅ Bruges | Behold |
| **Profil-side** | ❌ Mangler | Tilføj badge-galleri som hovedsektion |
| **Overblik-dashboard** | ❌ Mangler | "Du er tæt på X-badge"-nudge (1 ad gangen) |
| Forum-posts | ❌ Mangler | Top-3 badges ved siden af brugernavnet |
| Plant detail-side | ❌ Mangler | Lille badge-mærke hvis brugeren har låst noget op på netop denne plante (fx first_harvest) |
| **Sæsonafslutning** | ❌ Mangler | År-i-review med opnåede badges + sammenligning |
| Onboarding | ❌ Mangler | Vis hvad der findes at lave (lokker engagement) |

---

## Implementations-plan: 4 tiers

### Tier 1 — Fundament (≈4 timer, ingen migration)
- A. Tilføj 5 nye dyrknings-badges + metadata
- B. Auto-award fra eksisterende mutations
- C. Badge-galleri på `/profil` (alle badges, grouped earned vs locked)
- D. Backfill: når brugeren åbner /profil, kør alle maybeAwardX i parallel

**⭐ Tier 1 er implementeret i denne session — se nedenfor.**

### Tier 2 — Engagement (≈8-10 timer, 1 migration)
- E. Tier-system (Bronze/Sølv/Guld) — migration tilføjer `tier`-kolonne
- F. Streaks — migration tilføjer `user_streaks`-tabel + helpers
- G. Næste-badge nudge på overblik-dashboard
- H. Vis top-3 badges ved siden af brugernavn i forum-posts

### Tier 3 — Community (≈10-12 timer, 1-2 migrationer)
- I. Voting på challenges — migration: `challenge_votes`
- J. `challenge_winner`-badge med tier baseret på antal vundne
- K. Hold-count challenges (leaderboard-type)
- L. Solo / system-challenges (group_id NULL)

### Tier 4 — Sjov / sæsonafslutning (≈6-8 timer)
- M. År-i-review-side med opsummering af opnåede badges
- N. Sæsonbaserede badges (early_bird, late_bloomer, winter_grower)
- O. Charme-badges (tomato_master, chili_lord, flower_friend)
- P. Auto-genererede sæson-challenges (system-roterende)

---

## Risici / forbehold

1. **Gamification kan kannibalisere kerneoplevelsen.** Hvis brugeren begynder
   at "samle badges" frem for at dyrke, har vi tabt. Modtræk: holde
   tærsklerne høje, ingen daglige badges, ingen XP-bjælker.

2. **Tier-system kan føles inflationært.** Hvis alt har 3 niveauer, mister hver
   ny niveau betydning. Modtræk: kun tier'd de badges hvor det giver mening
   (mængde-baserede), ikke binære achievements (`first_harvest` er bare ÉT).

3. **Streaks skaber pres.** En bruger der mister sin 30-dages streak fordi
   hun har glemt at logge mens hun var på ferie, kan blive demotiveret.
   Modtræk: "frosset streak"-mekanik (1 dags grace) eller bare ikke vise
   streak-tal højere end den korrespondende badge er.

4. **Voting kan blive et popularitetsspil.** Hvis voting altid vinder af de
   samme aktive medlemmer, mister det værdi. Modtræk: anonymisering, eller
   randomized order, eller "kun ikke-ejer kan stemme".

5. **Solo-challenges kræver hosting.** Hvem definerer de globale challenges?
   Admin-tooling skal bygges. Foreløbig kunne det være hardcoded.

---

## Hvad jeg bygger i nat (Tier 1)

1. **5 nye dyrknings-badges** i `badges-shared.ts`:
   - `first_sowing` — første plante sået
   - `first_harvest` — første høst-log eller plante.status='hoestklar'+
   - `season_finisher` — første plante.status='afsluttet'
   - `the_collector` — 25+ items i frøbank
   - `master_apprentice` — har klonet en master-guide

2. **Award-helpers** i `actions/badges.ts` for hver af de 5 nye + hooks i:
   - `createPlantLog` (when type=sowing/germination/harvest)
   - `updatePlantStatus` (when target=hoestklar/afsluttet)
   - `saaFroeFraInventory` (når en plante aktiveres fra frøbank)
   - `createInventoryItem` (når et item tilføjes)
   - `cloneGuideToOwn` (når master klones)

3. **Badge-galleri på `/profil`** — viser alle 11 mulige badges grupperet
   som "Optjente" (med dato) og "Mangler" (med hint om hvordan).

4. **Backfill ved /profil-besøg** — alle 5 nye maybeAwardX kører parallelt
   så eksisterende brugere får retro-tildelt badges baseret på eksisterende
   data.

Når du vågner kan du gå til `/profil` og se hvad du har optjent.
