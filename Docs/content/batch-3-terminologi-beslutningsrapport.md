# Batch 3 — Terminologisk integritet · Beslutningsrapport (Fase 1)

**Dato:** 3. september 2026 · **Base:** `00fc4de` (main == origin/main, rent træ)
**Status:** read-only måling. Ingen kode ændret, ingen prod-datawrites.
**Metode:** hvert af de 11 klasse D-fund fra tekst-auditten 2/9 er målt mod
(1) brugerrettet brug, (2) intern datamodel, (3) live-DB read-only,
(4) write paths, (5) read/render paths og (6) låste beslutninger
(`potalot-terminologi.md`, `prikling-vs-ompotning-backlog.md`,
`kalenderregel-semantik-audit.md`). Alle fil:linje-referencer er verificeret
mod `00fc4de`.

Klassifikation: **A** ren terminologisk drift · **B** skjult modelforskel ·
**C** reel produktforskel · **D** falsk positiv / ikke brugerrettet.

## Live-DB, målt 3/9 (read-only)

De tabeller appen faktisk bruger: `plants_v2` (21), `plant_logs_v2` (30),
`calendar_tasks` (11), `inventory_items` (50), `guides` (187). Legacy
`plants`/`tasks`/`plant_events`/`seeds` er tomme.

| Måling | Resultat |
|---|---|
| `guides.calendar_rules.taskType` | 124 regler, 31 forskellige værdier; repot 3 · prick_out 3 · pricking_out 1 (= backlog-notens 7) |
| `calendar_tasks.task_type` | custom 5 · plant_out 2 · watering 2 · harvest 1 · pre_sow 1 — ingen repot endnu |
| `plant_logs_v2.type` | status_change 9 · germination 6 · pest_disease 5 · note 4 · archive 3 · repotting 1 · planting_out 1 · health 1 |
| `plants_v2.status` | i_vaekst 7 · saaet 6 · spirer 3 · afsluttet 2 · udplantet 1 · planlagt 1 · klar_til_udplantning 1 |
| `inventory_items.status` | i_froebank 41 · saaet 9 |
| `inventory_items.purchase_year` | sat på 25 af 50; `purchase_date` sat på 0 |
| Ønskeliste | ingen status-værdi; `indkoebsliste` er en `primary_category_id` |
| Dahlia | guides: "Dahlia" (art) + 2 sortsguider; inventory: 2 poser "Dahlia"; nul "georgine" i data |

Sidefund i data: de ældste `status_change`-noter indeholder den rå nøgle
("Status ændret til \"klar_til_udplantning\""). Koden skriver i dag labelen
(`mine-planter.ts:738`). Historisk, ikke live. Ingen datawrite foreslået.

---

## Beslutningstabel

| Spor | Klassifikation | Faktisk model | Nuværende brugertermer | Omfang | Anbefaling | Kræver beslutning? |
|---|---|---|---|---|---|---|
| **D1** Prikling / ompotning | **B** (opgave-laget internt A) | Task-type `repot` = prikling i alle 7 regler, `TASK_STAGE` (spirer), dagens-fokus, next-plant-task, reminder-relevans. Log-type `repotting` = ompotning ("Pottet om", milepæl, kompetence "Ompotning"). **Broen** `havekalender.ts:392` mapper `repot → repotting`, så en fuldført "Prikl om"-opgave bliver til en "Pottet om"-log | Prikl om · Prikl ud · Mere plads · Skal ompottes · Pottet om · Ompotning · priklede om (død) · Ompot til større potte (demo) | 7 regler · 1 bro · 5 UI-labels · 1 død label-tabel · 2 demo-datasæt · 1 guide-sektion (chili.md) | Behold opgave-labelen. Ret `din-dyrkning.tsx:184` "Skal ompottes" → "Skal prikles om" (samme stadie som de andre prikle-labels). Broen og log-typen afgøres af Anna | **JA** — hvad skal en fuldført prikle-opgave logge som, indtil to-typers-modellen er bygget? |
| **D2** Købsår / Årgang | **A** + B-hale | Ét felt `purchase_year` (DB, type, insert, eksport, skabelon). Intet pakkeår-felt findes | Købsår (7: frøkort, opret, redigér, skabelon, eksport, import-advarsel) · Årgang (2: import-review) · Indkøbsdato/Købsdato (1/1, `purchase_date`) | 2 + 1 linjer | **Canonical: Købsår.** `import-review.tsx:215`, `inventory-import-merge.ts:570` → Købsår; `[id]/page.tsx:656` Indkøbsdato → Købsdato. Behold `'årgang'` som import-header-alias | Label-delen: **KLAR TIL IMPLEMENTERING.** Halen: AI-udtrækket (`seed-packet-extract.ts:25`) beder om "året posen er pakket til / sæsonmærket" og skriver det i Købsår — **JA**, vælg: (1) omformulér prompten til købs-/sæsonår + hjælpetekst, eller (2) nyt felt. Anbefaling: (1) |
| **D3** Valideringscopy | **Blandet:** A (tomt felt, "findes ikke") · C (længde, format, interval, forretningsregel) | Ingen zod på input, ingen central helper, ingen toasts. 60+ dialoger renderer fejlen som én linje nederst før footeren. **31 felter har native `required`, 24 knapper disables ved tomt** → 30 af 41 "tomt felt"-tekster kan aldrig nås; brugeren ser browserens egen tekst | Tomt felt: "X er påkrævet" 12 · "Skriv et/en X" 10 · "Angiv" 4 · "Indtast" 3 · "Vælg" 3 · "skal have et navn" 2 · "må ikke være tomt" 1 · "Mangler" 3. Findes-ikke: "ikke fundet" 7 · "blev ikke fundet." 5 · "findes ikke" 3 · **engelsk 2** (`guides.ts:522,793`) | ~120 strenge målt; 17 synlige "findes ikke"; 15 uopnåelige "påkrævet" | Lille sprogmodel (5 skabeloner, se §D3). Ret de 17 "findes ikke" til data-fejl.ts' form; de 2 engelske nu; flyt "De to kodeord matcher ikke" (3 kopier) til `kodeord.ts`. **Ingen central helper** | De 2 engelske + kodeord-flytning: **KLAR.** Skabelonvalget og "native `required` vs. Potalots tekst": **JA** (produktvalg) |
| **D4** Uploadgrænser | **C** (tre levende kontrakter) + **D** (to døde) | **Én levende billedvej:** alle 20 kaldesteder → `compressImage` (2400 px, q 0,85) → `/api/upload` (20 MB; HEIC 12 MB). `storage.ts` (10 MB) og `api/images/upload` (20 MB) har **nul kaldere**. **Reel ydre grænse = Supabase-bucket 10 MB** (`00024:8`), som ingen tekst nævner → en 10–20 MB fil passerer route-tjekket og fejler med "Filen er for stor." uden tal. Excel 5 MB og audio 25 MB/120 s er separate kontrakter | "Maks. 20 MB" · "Maks. 12 MB for HEIC" · "maks. 5 MB" (Excel) · "Filen er for stor." (bucket) · "Optagelsen er for stor." (når aldrig brugeren) | 1 levende route · 2 døde · 1 bucket · 2 sidebugs | Ændr **ingen** tal for tekstens skyld. Behold HEIC 12, Excel 5, audio 25 som bevidst forskellige. Ret kommentar `multi-image-upload.tsx:24` (peger på død route) | **JA** — (1) slet de to døde uploadveje? (2) skal route-tallet følge bucketten (20→10, ingen adfærdsændring, ærlig tekst) eller bucketten hæves? Anbefaling: (1) ja, (2) route → 10 |
| **D5** Såningsfelter | **B** + A | Guidekontrakten har tre typede vinduer: `sowingMonths` = **forkultivering** (`pre_sow`), `directSowingMonths` = direkte (`direct_sow`), `plantingOutMonths` (`plant_out`). Frøbanken har ét sammenfoldet såfelt + `preCultivation`-flag. **Guide-faktaboksen sætter labelen "Såning" på forkultiveringsvinduet** (`quick-facts.tsx:72`), mens direkte såning ligger foldet væk som "Direkte såning". Guide-kortet viser "Sås {pre_sow-vindue}" med fallback til direkte | Såning · Direkte såning · Sås · Sås (måneder) · Såmåneder · Forkultivering · Forspir/Forkultivér · Udplant/Plant ud/Udplantning | 2 misvisende labels · 3 steder verbet udledes af `preCultivation` (bryder 25/8-reglen) · 4 rene drift-par | Ingen feltsammenlægning. Ret ren drift: import-review "Såmåneder"→"Sås", "Udplantning"→"Plant ud"; `TASK_TYPE_META.pre_sow` "Forspir"→"Forkultivér" (standarden 11/8) | Ren drift: **KLAR.** Guide-labelen for `sowingMonths` ("Såning" → "Forkultivering" / "Sås inde"?) og plant_out-verbet ("Udplant" vs "Plant ud", 2 : 12): **JA** |
| **D6** Stadiet før udplantning | **B** (tre dimensioner) | Status `klar_til_udplantning` (label "Klar til udplantning", kort "Klar") · handling afledt af status (`din-dyrkning` "Skal udplantes" / `dagens-fokus` "Plant X ud") · afledt prosa (`build-plant-detail` "klar til haven", "Klar til at flytte ud", Havebog "klar til at komme udenfor"). **Status kan ikke nås fra noget UI i dag:** `updatePlantStatus` har nul kaldere; `LOG_TO_STAGE` springer stadiet over; DB-rækken fra 14/5 kom fra et ældre UI. Intet hærdningsstadie findes | Klar til udplantning · Klar · Skal udplantes · Plant ud · Udplant · klar til haven · Klar til at flytte ud · klar til at komme udenfor · Hærd af | 1 status-label + kortform · 2 parallelle handlings-afledninger · 3 prosa-metaforer · 1 dublet-liste (`din-dyrkning.tsx:407`) | Ensret KUN inden for hver dimension: status-label er i orden; handlingsverbet følger D5's plant_out-valg; prosa må variere, men én metafor-familie pr. flade. `din-dyrkning` bør importere `STAGE_SHORT_LABEL` | **JA** — skal stadiet overhovedet kunne nås (status-UI eller afledning)? Og `next-plant-task.ts:50` gætter "Hærd af" universelt ved >35 dage mod PLT-reglen (kun ved `preCultivation`) — regel eller fejl? |
| **D7** I vækst / Vækst | **C** + lille B | Samme enum-værdi `i_vaekst`. "I vækst" = `PLANT_STATUS_META` (10 render-steder). "Vækst" = `STAGE_SHORT_LABEL` (dokumenteret kortform til progression-bar) — men `StageProgress` importeres **ingen steder**; "Vækst" renderes aldrig live. Reelt fund: Kalenderens `VaekstLinje` (`din-dyrkning.tsx:406-413`) mapper `i_vaekst` → indeks 1 = **"Spirer"** | I vækst · i vækst · Vækst (dødt) · Spirer (forkert) | 1 død komponent · 1 fejlvisning | Ingen terminologiændring. Ret `VaekstLinje` så en plante i vækst ikke står som "Spirer" (importér `STAGE_SHORT_LABEL` eller tilføj trin) | Fejlen: **KLAR** (produktfejl, ikke ord). Sletning af død `StageProgress`: egen beslutning |
| **D8** Ønskeliste | **A** | `indkoebsliste` er en **kategori** (`primary_category_id`), ikke en status; status er ortogonal (`i_froebank` også for ønskeliste-poser). Kalender-motoren undtager kategorien (`IKKE_EJET`). Modellen er "parkeringsplads for idéer", ikke indkøb | Ønskeliste (~27, alle flader) · **Indkøbs- og ønskeliste** (1 kilde `constants.ts:40`, 8 render-steder inkl. detaljesidens mappe-fane i versaler) · "Oprettet i ønskeliste" (1, ubestemt) | 1 + 1 linjer | **Canonical: Ønskeliste.** `constants.ts:40` name → 'Ønskeliste'; `tilfoej-flow.tsx:696` → "i ønskelisten". Id `indkoebsliste` i URL/DB røres ikke. "Gem til senere" (Gartnerens gemte svar) er en anden model — hold adskilt | **KLAR TIL IMPLEMENTERING.** Sidespor: guide-kategori-selects tilbyder `indkoebsliste` (3 steder) — egen lille opgave |
| **D9** Georgine / Dahlia | **C** + B-hul | Dahlia er canonical (slug, guide-titel, latin, kategori, tags, inspiration, 650+ forekomster). Georgine findes 12 steder — alle folkelig prosa i vejr/frost-varsler og månedsstemning. Guiden siger selv, at begge navne bruges. **Hul:** ingen artsalias Dahlia ← Georgine i `arts-model.ts`; søgning i frøbank, guides og ny frøpose finder intet på "georgine" | Dahlia · dahliaer · dahlia-knolde · georginer (6) · georgine (4) | 12 prosa-steder · 0 aliasser | Rør ikke keys/slugs. Prosa: enten lad georginer stå (folkelig stemme) eller ensret til dahlia som havevisdom/inspiration allerede gør. **Tilføj artsalias** Dahlia ← Georgine/Georginer efter Skoleagurk-mønstret (samme art, ingen dyrkningsforskel tabt) | **JA** (alias-modellen er Anna-låst): alias ja/nej, og prosa-valg. Anbefaling: alias ja, prosa uændret |
| **D10** Aftenerne / aftnerne + term-par | **D** (aftener) · A-rester | Begge former korrekte (RO), samme flade og stemme (Havebog-sæsonprosa), 2 : 1 for "aftenerne". Term-par-standarden fra 11/8 holder: 7 af 10 par har nul rester | Aftenerne (2) · Aftnerne (1) · "guider" (2 UI) · "Rediger" (3 UI + 3 admin) · "PotAlot" (1, User-Agent-header, usynlig) | 1 + 2 + 3 linjer | Aftener: ingen ændring (evt. ét ord i `havebog.ts:137`, laveste prioritet). "guider"→"guides" og "Rediger"→"Redigér" i UI er Batch 2-rester under allerede låst standard | Rester: **KLAR.** Aftener: nej — intet produktproblem |
| **D11** Samme type → flere labels | **A** (4 live) + 1 B | 17 label-tabeller, ~60 nøgler sweep'et. Live drift: `pre_sow` Forspir/Forkultivér og `plant_out` Udplant/Plant ud (= D5) · `full_sun` "Fuld sol" vs "Sol" (`inventory-card.tsx:62` egen map) · `regular` "Regelmæssig" vs "jævnt" (`inventory-import-merge.ts:608`) · Gartner-prompten sender **rå** `status: i_vaekst` (`gartner/route.ts:118`) mens logs formateres · TaskSource "Fra frøbank" (source-chip) vs "Fra Frøbanken" (i-haven-nu) på samme flade. **B:** to enums for samme begreb — `UserMode` maalrettet/afslappet/minimal (profil) og `NotificationProfile` mindful/rolig/aktiv (onboarding) | se model | 4 live drift · 1 AI-flade · 1 dobbelt-enum · 14 enums uden central tabel (TaskPriority har 4 identiske kopier) | Lad `inventory-card` bruge `LIGHT_META`; "jævnt"→"regelmæssig"; Gartner-prompten gennem `PLANT_STATUS_META` (terminologi-regel 4); vælg ét kilde-vokabular i Kalenderen. **Ingen** ny abstraktion for de identiske kopier — kun en vagt, hvis Anna vil have den | full_sun, regular, rå status: **KLAR.** Kilde-vokabular (Fra frøbank/Fra Frøbanken): lille lås. UserMode vs NotificationProfile: **JA** (produkt: er det ét begreb?) — ikke Batch 3-kode |

---

## B/C-fund — den konkrete beslutning, der kræves

### D1 · Prikling vs. ompotning (B)

Opgave-laget er internt konsekvent som prikling. Modelbruddet ligger ét
sted: `src/actions/havekalender.ts:392` mapper `repot → repotting`, og
`repotting` er navngivet, labelet og milepæls-behandlet som ægte ompotning
("Pottet om" i log-form, tidslinje, historik-indhent; "Ompotning" i
havebog-kompetencer). Kæden er verificeret:
`task-row.tsx:42` → `completeTask` (`havekalender.ts:290`) →
`CompleteTaskDialog` → `completeTaskWithLog` (`:322-332`) skriver
`type: 'repotting'`. Brugeren ser "Prikl om" i Kalenderen og "Pottet om" i
Plantens historie for samme handling. Backlog-notens "de to modeller skal
ikke tvangssammenkobles" er allerede brudt her.

Øvrige fund i sporet:
- `din-dyrkning.tsx:184` viser "Skal ompottes" på stadiet `spirer` (≥35
  dage), mens `next-plant-task.ts:47` viser "Prikl ud" på samme stadie
  (>14 dage) og `dagens-fokus.ts:272` "Giv X mere plads". Samme situation,
  tre ord, to tærskler.
- `havebog.ts:171-177` `MILESTONE_LABEL` har nøglerne `repot` og
  `plant_out` (task-navne), men slås op på log-typer (`repotting`,
  `planting_out`). "priklede X om" og "satte X ud" kan aldrig vises. Død
  kode, ikke tekst.
- `guides-demo.ts:161` er det eneste sted i koden, hvor `repot` betyder
  ægte ompotning ("Ompot til større potte") — kun for anonyme.
- `content/guides/chili.md:131-143`: sektionen hedder "Ompotning" og
  linker teknikguiden "Sådan ompotter du", men brødteksten beskriver
  prikling.
- `fokus-flowet` (`plant-tasks.ts:64`) logger samme prikle-handling som
  `note`. Samme handling ender som `repotting` eller `note` alt efter indgang.
- Ingen test dækker `TASK_STAGE`, `TASK_TYPE_META`, `mapTaskTypeToLogType`,
  `MILESTONE_LABEL` eller `din-dyrkning`-labelen.

**Beslutning:** Hvad skal en fuldført `repot`-opgave logge som, indtil
to-typers-modellen er bygget? Valg: (a) `null` (ingen auto-log, brugeren
logger selv), (b) `note` (som fokus-flowet), (c) ny log-type
`pricking_out` "Priklet om" (kræver CHECK-udvidelse oven på 00060 — DB-
migration, altså IKKE en korrektur-batch). Anbefaling: (b) nu, (c) som del
af backlog-opgaven. Uanset valg: "Skal ompottes" → "Skal prikles om" er
riskofrit.

### D2 · Købsår (A) — halen (B)

`seed-packet-extract.ts:25` instruerer modellen: "det årstal posen er
pakket til / sæsonmærket med". Det er et andet begreb end købsår, og det
lander i `purchase_year`, som vises som "Købsår". Brugsrækkefølge-motoren
(`poseAargang`, "ældste først") er faktisk bedre tjent med pakkeår.
**Beslutning:** (1) omformulér prompten og lad hjælpeteksten nævne "eller
året posen er pakket til" (ingen migration), eller (2) nyt felt
`packed_for_year`. Anbefaling: (1).

### D3 · Valideringscopy (A/C)

Forskellene i B/C/D/G er reelle fejltyper og skal have forskellig copy.
Driften sidder i A (tomt felt, 7 formuleringer) og E (findes ikke, 4
formuleringer + 2 engelske). Men 30 af 41 A-strenge kan ikke nås, fordi
knappen er disablet eller feltet har native `required`. Den A-copy,
brugeren reelt møder, er browserens ("Udfyld dette felt").

**Foreslået sprogmodel (5 skabeloner, skrives i terminologi-standarden):**

| Fejltype | Skabelon | Ændres | Rør ikke |
|---|---|---|---|
| A tomt felt | "Skriv et/en [felt]." / "Vælg [ting]." | 15 "er påkrævet"/"må ikke være tomt"/"skal have et navn" (alle uopnåelige) | de 10 imperativer, "Indtast", import-rækkefejl |
| B længde | "[Felt] må højst være N tegn." / "… mindst N tegn." | 4 (groups:66,170 · group-forum:184 · idea-shares:48) | have-tekst, onboarding-brugernavn, kodeord.ts |
| C format | "Indtast et gyldigt [X] ([format])." | 0 | alle |
| D interval | "Højst N [ting] pr. [enhed]." | 0 (4 dubletter → én konstant, valgfrit) | — |
| E findes ikke | "Vi kunne ikke finde [ting]. Måske er den allerede slettet." (= `data-fejl.ts:29`) | 17 inkl. de 2 engelske | postnummer- og brugernavns-opslag (bedre egen copy), invitationslink |

**Beslutning:** (1) godkend skabelonerne; (2) skal Potalots egen tekst
overtage tomt-felt-fejlen (drop native `required`, ~31 felter) eller
accepteres browserens? Anbefaling: godkend skabelonerne, behold `required`
(browserens tekst er lokaliseret og tilgængelig), og ret kun de synlige
E-strenge + de uopnåelige A-strenge, hvor de alligevel røres. Ingen central
helper.

### D4 · Uploadgrænser (C + D)

Tallene er ikke tre kontrakter for samme ting. Målt:

| Vej | Grænse | Kilde | Status | Klassifikation |
|---|---|---|---|---|
| `/api/upload` billeder | 20 MB | `route.ts:10`, hardcodet | levende, alle 20 kaldesteder | historisk drift — uopnåelig, bucketten stopper ved 10 |
| `/api/upload` HEIC | 12 MB | `route.ts:13` | levende | teknisk nødvendighed (heic-convert OOM, 91ebada) |
| Supabase-bucket | **10 MB** | `00024:8` | levende, den reelle grænse | tilsigtet 1/5 ("rå iPhone-fotos 6–8 MB") |
| `storage.ts` | 10 MB | `:8` | **død** (nul kaldere siden 2f2443c) | D |
| `api/images/upload` | 20 MB | `:12` | **død** (nul kaldere siden 1efe5d4); holder `sharp` i live | D |
| Excel-import | 5 MB | `inventory-import.ts:31` | levende | separat kontrakt |
| Diktafon | 25 MB / 120 s | edge function | levende | separat kontrakt (OpenAI) |

Klientkomprimeringen (2400 px, q 0,85, skip <500 KB) sker FØR alle
servertjek, så brugeren rammer i praksis aldrig 20 MB. Desktop-HEIC
sendes ukomprimeret og møder 12 MB-grænsen.

**Beslutning:** (1) Slet de to døde uploadveje (og `sharp`, hvis intet
andet bruger den)? Så længe de ligger der, vil enhver audit finde tre
budskaber for én handling. (2) Skal route-tallet følge bucketten
(20 → 10 MB, ingen adfærdsændring, ærlig tekst) eller bucketten hæves til
20 (dobbelt storage for ukomprimerede uploads)? Anbefaling: (1) ja,
(2) route → 10. Hverken (1) eller (2) er korrektur.

Sidebugs (robusthed, ikke terminologi): `tal-optager.tsx:55` overskriver
edge-funktionens "Optagelsen er for stor." med en generisk tekst;
`tilfoej-flow.tsx:304-345` har `try/finally` uden `catch`, så en kastet
server-fejl viser intet.

### D5 · Såningsfelter (B + A)

Kontrakten (`froebank-autofill.ts:33-50`, `guide-forslag.ts:60-62`,
`reminder-relevans.ts:67-72`) er entydig: `sowingMonths` er
forkultiveringsvinduet (`pre_sow`). Faktaboksen (`quick-facts.tsx:72`)
kalder feltet "Såning" og gemmer "Direkte såning" under "Flere detaljer".
For de 9 artsguider med begge vinduer læser brugeren "Såning: feb–apr ·
Forkultivering: Ja · Direkte såning: mar–jun", hvor "Såning" fremstår som
det generelle vindue. Guide-kortet (`guide-card.tsx:24,99`) viser "Sås
{sowingMonths}" med fallback til direkte — én label, to felter.

Tre steder udleder verbet af `preCultivation` i stedet for det aktive
vindue, mod 25/8-reglen: `inventory-card.tsx:564`, `aarshjul-timeline.ts:36-56`,
`dagens-fokus.ts:319-326`. `froebank-forslag.ts:122-195` gør det rigtigt.

Ren drift (A): import-review "Såmåneder"/"Udplantning" vs skabelonens
egne kolonner "Sås"/"Plant ud" i samme flow; `pre_sow` "Forspir"
(TASK_TYPE_META, årshjul-fase, AI-prompt-eksempel) vs "Forkultivér"
(froebank-forslag, dagens-fokus, alle feltlabels); `plant_out` "Udplant"
(TASK_TYPE_META + AI-prompt, 2) vs "Plant ud" (12).

Ikke drift: gøremålskategori `saaning`, guide-tag `saaning`, sektionsnøgle
`sowing`, log-type `sowing` "Sået" deler ordet, men er andre begreber.

**Beslutning:** (1) Guide-faktaboksens label for `sowingMonths`:
"Forkultivering" (med måneder, så Ja/Nej-linjen kan udgå), "Sås inde",
eller uændret? (2) plant_out-verbet: "Plant ud" (flertallet) eller
"Udplant"? Anbefaling: (1) "Forkultivering", (2) "Plant ud".
`pre_sow` → "Forkultivér" følger allerede standarden fra 11/8
("Forspir" bevares i regeltitler for læggekartofler).

### D6 · Stadiet før udplantning (B)

Tre dimensioner, der kun ligner drift: status (tilstand), handling
(bydeform, afledt af status) og prosa (afledt). Grænsereglen står
eksplicit i `dagens-fokus.ts:11` og `afledninger.ts:252` (Planter taler
tilstand, Kalender handler). De må ikke ensrettes på tværs.

Det vigtigste fund er ikke et ord: stadiet `klar_til_udplantning` kan ikke
nås fra noget UI. `updatePlantStatus` (`mine-planter.ts:707`) har nul
kaldere; `LOG_TO_STAGE` springer det over; standalone planter oprettes som
`i_vaekst`. Hele lag (a)-(d) for stadiet er død kode i prod, indtil et
status-UI eller en afledning kobles på.

**Beslutning:** (1) Skal stadiet kunne nås — via status-UI eller afledt
(alder + `plantingOutMonths`)? (2) `next-plant-task.ts:50-52` gætter
"Hærd af" universelt ved >35 dage i vækst, mens
`build-plant-detail.ts:219-241` kun anbefaler afhærdning ved
`preCultivation === true` (PLT-0317/0318). Regel eller fejl?
Handlingsverbet ("Skal udplantes" vs "Plant X ud") følger D5's valg.

### D9 · Georgine (C + hul)

Ikke en fejl, men et bevidst folkeligt register i vejr- og
stemningsprosa; guiden dokumenterer selv, at begge navne bruges. Hullet
er discoverability: en bruger, der søger "georgine" i frøbank, guides
eller ny frøpose, får intet match, fordi `arts-model.ts` ikke har aliaset.
**Beslutning:** tilføj artsalias Dahlia ← Georgine/Georginer (opfylder de
låste alias-regler: samme art, ingen dyrkningsforskel tabt)? Prosa
uændret? Anbefaling: ja og ja.

### D11 · UserMode vs NotificationProfile (B)

Profilens `UserMode` (maalrettet/afslappet/minimal, "Minimal — uden
notifikationer") og onboardingens `NotificationProfile`
(mindful/rolig/aktiv, "Mindful — ingen påmindelser") ligner samme begreb
med to enums og to vokabularer. **Beslutning:** er det ét begreb? I så
fald er det en modelopgave, ikke Batch 3.

---

## KLAR TIL IMPLEMENTERING (A, entydigt, riskofrit)

Alt her følger allerede låste beslutninger eller er ét felt med to ord.

1. **D2** "Årgang" → "Købsår" (`import-review.tsx:215`,
   `inventory-import-merge.ts:570`); "Indkøbsdato" → "Købsdato"
   (`froebank/[id]/page.tsx:656`). Alias `'årgang'` beholdes.
2. **D8** `constants.ts:40` name → "Ønskeliste"; `tilfoej-flow.tsx:696`
   "i ønskeliste" → "i ønskelisten".
3. **D3** engelske rester `guides.ts:522` "Plant not found",
   `:793` "Item not found" → dansk (fejllag-mønstret fra Batch 1);
   "De to kodeord matcher ikke" (3 kopier) → `kodeord.ts`.
4. **D5/D11** `TASK_TYPE_META.pre_sow` "Forspir" → "Forkultivér"
   (standard 11/8); AI-prompt-eksemplet følger med; regeltitler røres ikke.
5. **D5** import-review "Såmåneder" → "Sås", "Udplantning" → "Plant ud"
   (skabelonens egne kolonnenavne).
6. **D11** `inventory-card.tsx:62` egen LIGHT_LABEL ("Sol") →
   `LIGHT_META`; `inventory-import-merge.ts:608` "jævnt" → "regelmæssig";
   `gartner/route.ts:118` status gennem `PLANT_STATUS_META`.
7. **D1** `din-dyrkning.tsx:184` "Skal ompottes" → "Skal prikles om".
8. **D7** `VaekstLinje` (`din-dyrkning.tsx:406-413`): plante i vækst må
   ikke vises som "Spirer" (importér `STAGE_SHORT_LABEL`).
9. **D10** "guider" → "guides" (`guides/min-have/page.tsx:98`,
   `dine-egne-guides.tsx:110`); "Rediger" → "Redigér" i brugerflade
   (`profil-form.tsx:121`, `edit-inventory-dialog.tsx:419,423`).
10. **D4** kommentar `multi-image-upload.tsx:24` peger på død route → ret.
11. Terminologi-standarden udvides med de nye låse (Købsår, Ønskeliste,
    Forkultivér, valideringsskabeloner efter godkendelse).

Regressionsvagt, der foreslås: én statisk test, der (a) forbyder
"Årgang"/"Indkøbs- og ønskeliste"/"Forspir" som label i TASK_TYPE_META og
import-labels, (b) kræver at `gartner/route.ts` ikke interpolerer
`plant.status` råt, (c) kræver at `inventory-card` ikke har egen
LIGHT_LABEL. Ingen ny abstraktion.

## Sidefund uden for terminologi (til backlog, ikke Batch 3)

- `havebog.ts:171-177` MILESTONE_LABEL: nøgle-mismatch (task-navne mod
  log-typer) — to milepæle kan aldrig vises.
- `groups.ts:124-146` `updateGroup` har nul kaldere.
- `master-guide-form.tsx:137` "… så AI ved …" (admin-flade; Batch 2-
  præcedens lader admin-strenge stå).
- `tal-optager.tsx:55` og `tilfoej-flow.tsx:304-345` (se D4).
- Guide-kategori-selects tilbyder `indkoebsliste` (3 steder).
- 14 enums uden central label-tabel (TaskPriority 4 identiske kopier,
  PlantLogType 6 kopier, steder 5-6 lister) — identiske i dag, ingen vagt.
- Historiske `status_change`-noter med rå nøgler i `plant_logs_v2` (9 rækker
  fra april-maj). Ingen datawrite foreslået.

## Afgrænsning (holdt ude, jf. opgaven)

P3-tegnsætning, tankestreger, `etc.`/`...`, guide-editorial sweep,
guide-tag-oprydning, kategori-data-cleanup, `{false && …}`-blokken,
Lucky Tiger, Frøbank-provenance, øvrige kalenderbacklogs. Ingen
prod-datawrites, ingen migrations.
