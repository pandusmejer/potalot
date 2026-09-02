# Audit: `relativeOffsetDays` vs. `recommendedMonths` i `calendarRules`

Dato: 2. september 2026 · Status: **§5 LUKKET (515e94b, pushet) · datosemantik LÅST, ikke bygget**
Kode: `src/lib/task-generation.ts:28` (`calculateRuleDate`), kaldt fra
`src/actions/mine-planter.ts:304`.

---

## 0. Kort svar

Det er **ikke** ét forkert branch-order. Det er tre lag oven på hinanden:

1. `calculateRuleDate` returnerer fra offset-grenen først, så
   `recommendedMonths` ignoreres helt for 44 regler. (Den kendte fejl.)
2. `calendarRules` er et **andet, udokumenteret månedsmotor** ved siden af
   `quickFacts.*Months`. Guidekontrakten kender hverken `relativeOffsetDays`,
   `trigger` eller `recommendedMonths` — `calendarRules` er dér beskrevet som
   "næsten altid `[]`". Felterne findes kun, fordi AI-prompten viser dem.
3. Generatoren og relevans-motoren læser **to forskellige korpora**, så
   opgaven dateres efter ét vindue og bedømmes senere mod et andet.

Og under det hele: for 19 af 22 private guides oprettes der i dag **nul**
opgaver, fordi batch-insertet afvises af en CHECK-constraint (§5).

---

## 1. Hvor reglerne kommer fra

`generateTasksFromGuide` kaldes udelukkende med `getAllGuides()` →
Supabase-tabellen `guides`. Repoets 176 markdown-guides
(`src/data/guides-imported.ts`) indgår **ikke** i denne sti.

| Kilde | Guides m. regler | Regler | Med `relativeOffsetDays` |
|---|---|---|---|
| Masterguides i DB (`user_id IS NULL`) | 5 | 22 | **0** |
| Private AI-guides (`is_ai_generated`) | 22 | 102 | **54** |
| Repo-masterguides (markdown, 176 stk.) | — | — | **0** |

**Alle 54 offset-felter stammer fra private AI-guides.** Ingen redaktionel
guide har nogensinde brugt feltet. Sporet peger på ét sted:

```
src/actions/guides.ts:660        (og guides-admin.ts:540 — samme eksempel)
{"taskType": "plant_out", ..., "recommendedMonths": [5,6],
 "trigger": "sowingDate", "relativeOffsetDays": 35, ...}
```

Prompt-eksemplet sætter selv begge felter på samme regel. Modellen har
kopieret mønsteret trofast: **alle 124 regler har `recommendedMonths`, 54
har derudover et offset.** Kombinationen er altså ikke en redaktionel
beslutning — den er en artefakt af ét promptekssempel.

---

## 2. Hvor mange kan producere en dato uden for eget vindue

Metode: for hver offset-regel med `trigger='sowingDate'` er datoen beregnet
for hver måned i guidens **egne** dokumenterede sådatoer
(`sowingMonths` ∪ `directSowingMonths`), på dag 1, 10, 20 og 28.

| | Antal |
|---|---|
| Regler med begge felter | **54** |
| — heraf hvor offset-grenen faktisk rammer (`trigger='sowingDate'`) | 44 |
| — heraf hvor offset-feltet er dødt (anden trigger) | 10 |
| **Kan lande uden for eget `recommendedMonths`** | **41 af 44 (93 %)** |
| — altid uden for vinduet | 2 |
| — delvist (afhænger af hvornår brugeren sår) | 39 |
| Altid inden for vinduet | 3 |

---

## 3. Konflikttyper

### Type A — offset kalibreret til ét punkt i et flermåneders såvindue (39 regler)

Den hyppigste. Offsettet passer, hvis man sår midt i vinduet, og falder ud
i begge ender. Ingen af reglerne er "forkerte" i sig selv — de er bare ikke
robuste over for et vindue.

| Guide | Regel | Offset | Vindue | Såvindue | Resultat-spænd | Ramte |
|---|---|---|---|---|---|---|
| Chili · Padron | Udplant chili | +70 | [5,6] | [2,3,4] | apr–jul | 75 % |
| Chili · Padron | Høst Padron chili | +150 | [8,9,10] | [2,3,4] | jul–sep | 58 % |
| Agurk · Beit Alpha | Udplant agurk i drivhus | +30 | [5,6] | [3,4,5,6] | mar–jul | 50 % |
| Tomat · Gourmansun | Afherds tomatplanter | +35 | [5] | [3,4] | apr–jun | 50 % |
| Tomat · Ananas | Udplant tomat | +56 | [5,6] | [2,3,4] | mar–jun | 58 % |

Annas eksempel: sået 02/02 → 02/02 + 70 = **13/04**, mens reglen selv siger
[5,6]. Sået 20/03 giver 29/05 og er korrekt. Samme regel, to udfald.

### Type B — offset modsiger vinduet systematisk (2 regler)

| Guide | Regel | Offset | Vindue | Såvindue | Resultat | Ramte |
|---|---|---|---|---|---|---|
| Chili · Jalapeno | Høst grønne Jalapeno | +120 | [8,9,10] | [2,3] | jun–jul | **0 %** |
| Engkarse | Engkarse blomstrer | +180 | [4,5,6] | [8,9] | jan–mar | **0 %** |

Engkarse er også det eneste tilfælde, hvor vinduet krydser årsskiftet.
Måneds-grenen håndterer det korrekt (wrap til næste år); offset-grenen ved
intet om det.

### Type C — offset er dødt felt (10 regler)

`calculateRuleDate` bruger kun offsettet ved `trigger === 'sowingDate'`.
DB rummer fem trigger-værdier — og tre stavemåder af den samme idé:

```
sowingDate  ·  plantingDate  ·  plantOutDate  ·  plantingOutDate  ·  calendarDate
```

Typen tillader `'sowingDate' | 'germinationDate' | 'plantingOutDate'`.
Alt andet falder igennem til måneds-grenen, og offsettet forsvinder lydløst.
Eksempel: Tomat Ananas "Høst tomat Ananas", `plantOutDate` +90 → dateres
1. august, uden at nogen har regnet på plant-out-datoen.

### Type D — måneds-grenen kaster såningsdagen væk

Måneds-grenen returnerer altid **den 1. i måneden**. En tomat sået 28. marts
og en sået 2. marts får begge "Udplant tomat" den 1. maj. Det er ikke en
konflikt mellem felterne, men det er grunden til, at et offset overhovedet
føltes nødvendigt: måneds-grenen har ingen opløsning inden for måneden.

---

## 4. To korpora, to vinduer

`vurderReminderRelevans` (`src/lib/kalender/reminder-relevans.ts`) validerer
mod `resolveFroebankVinduer` / `resolveHoestMaaneder`, som læser
`@/data/guide-facts-index.generated` — **repoets masterguides**.
Generatoren dateres derimod ud fra **DB-guidens** `recommendedMonths`.

De er ikke enige:

| Art/sort | Reglens vindue | Canonical vindue |
|---|---|---|
| Chili Padron · forspiring | [2,3,4] | [1,2,3] |
| Chili Padron · høst | [8,9,10] | [7,8,9,10] |
| Tomat Ananas · høst | [8,9,10] | [7,8,9] |

Og for **9 af 21** private guides tier repo-korpuset helt — Akshindebæger,
Brøndkarse, Dværg tomat Venus, Engkarse, Kæmpe Evighedsblomst, Rørblomst,
Slørhvene, Stolt Kavaler (×2). Dér svarer relevansmotoren
`intet_dokumenteret_vindue` → opgaven passerer uanset hvor forkert datoen er.
Sikkerhedsnettet fra 30/8 dækker altså præcis de guides, der har mindst brug
for det.

---

## 5. Blokerende fejl fundet undervejs (ikke semantik) — ✅ LUKKET 2/9

`calendar_tasks.task_type` har en CHECK-constraint med 13 værdier.
AI-guiderne opfinder 18 andre: `care`, `sow`, `direct_sow`, `prick_out`,
`pricking_out`, `harden_off`, `hardening`, `bloom`, `flower`, `support`,
`pinch`, `fertilize`, `deadhead`, `thin_out`, `seed_collection`,
`collect_seeds`, `harvest_tubers`, `winter_protection`.

**19 af 22 private guides indeholder mindst én ugyldig `taskType`.**
Indsættelsen i `mine-planter.ts` er ét batch-insert, og fejlen slugkes:

```ts
const { error: taskErr } = await supabase.from('calendar_tasks').insert(taskRows)
if (!taskErr) tasksCreated = taskRows.length
```

Én ugyldig række → hele batchen afvises → **nul** opgaver oprettet, ingen
log, ingen besked til brugeren. Live findes der i alt 2 opgaver med
`source='guide'`. Datofejlen var altså maskeret af, at generatoren sjældent
nåede at producere noget.

**Rettet 2/9** med `src/lib/kalender/opgavetype.ts` som fælles kontrakt.
DB-constrainten er IKKE udvidet. De 18 navne fordeler sig:

* **11 mappet med belæg.** `sow`, `prick_out`, `harden_off`, `fertilize`
  (+ `prune`, `water`) er ordret legacy-vokabularet fra `tasks`-tabellen i
  `00001_initial_schema.sql` — ikke hallucinationer. `pricking_out`,
  `hardening`, `support`, `deadhead`, `pinch`, `harvest_tubers` er mappet på
  masterguidernes egne titel→type-par ("Prikl chiliplanter om" → `repot`).
  `direct_sow` → `sowing`, fordi modellen skelner `pre_sow` (forkultivering)
  fra `sowing`, og `reminder-relevans.ts` slår netop `sowing` op mod
  direkte-såning-vinduet.
* **7 uden belæg → `custom`:** `care`, `thin_out`, `winter_protection`,
  `seed_collection`, `collect_seeds`, `bloom`, `flower`. Ingen regel kasseres.

Beviskravet er låst: et alias kræver enten legacy-vokabular fra 00001 eller
redaktionel præcedens. De fire vindue-bærende typer (`pre_sow`, `sowing`,
`plant_out`, `harvest`) er strammest bevogtet, fordi et forkert alias derind
giver opgaven et dyrkningsvindue, den ikke har fagligt belæg for.

Effekt mod produktionsdata: 83 af 124 regler uændret, 27 mappet, 14 → `custom`,
**0 guides ville herefter fejle** ved insert.

### LUKKET — `task_type`-kontrakten (Anna 2/9, `515e94b` pushet)

* DB's 13 typer er canonical.
* Legacy-typer mappes kun med dokumenteret præcedens.
* Ukendte typer falder til `custom`, ikke til opdigtede enums.
* Vindue-bærende typer er særskilt bevogtet.
* Alle skriveveje normaliserer.
* Eksisterende guides normaliseres ved runtime.
* AI-prompter kan ikke længere opfinde frie typer.
* Batchfejl logges og kan ikke længere forsvinde lydløst.
* TS-kontrakten testes direkte mod DB-constrainten.

Opgaven viste sig ikke at være "ryd hallucinationer op", men **"normalisér
historiske vokabularer uden at miste betydning"**. Det er grunden til, at
aliaskortet har et beviskrav i stedet for en skønsliste.

**Bivirkning, accepteret:** `filterRelevantTasks` frasorterer
`sowing`/`pre_sow`, så en regel, der før hed `sow`, slap igennem filteret.
Nu gør den ikke. Det var aldrig en feature — det var et stavebaseret smuthul.

---

## 6. Tilbagevirkende registreringer

Værnet findes allerede (`mine-planter.ts`, Anna 16/7):

```ts
.filter(t => t.date >= idagStr)
```

Det forhindrer oversvømmelsen. Men det er et **kalender-snit, ikke en
relevansvurdering**, og det fejler i begge retninger:

* **Beholder forkerte:** chili sået 02/02, registreret i dag → "Udplant
  chili" 13/04 ligger i fremtiden og oprettes, selv om reglen siger [5,6].
* **Taber rigtige:** tomat sået 20/03, registreret 01/06 → "Udplant tomat"
  (+42) = 01/05 < i dag og kasseres — men det dokumenterede vindue [5,6] er
  stadig åbent den 1. juni. Opgaven var faktisk stadig relevant.

Datoen afgør altså i dag, hvad der er relevant. Vinduet burde afgøre det.

---

## 7. Vurdering af de fire mulige principper

**(1) Offset beregner, derefter clamp til nærmeste gyldige måned.**
Afvist som *primærregel*. "Nærmeste" er vilkårlig i begge retninger og ville
flytte Jalapeño-høsten fra juni til august uden at sige det — en to måneders
korrektion præsenteret som en plan. Men clamp er den rigtige *mekanik* inden
i princip 3.

**(2) Offset bruges kun, hvis resultatet ligger i `recommendedMonths`.**
Ærligt og minimalt, og det fjerner alle 41 konflikter i dag. Svagheden er, at
adfærden bliver ikke-monoton: sået 5/3 giver en præcis dato, sået 2/2 giver
den 1. i måneden. To brugere får strukturelt forskellige planer ud af samme
regel. Brugbar som overgangsregel, dårlig som model.

**(3) `recommendedMonths` er hård constraint, offset er kun relativ placering
inden i vinduet.** ✅ **Anbefalet.** Det er den eneste læsning, der er
konsistent med det, der allerede er låst i `reminder-relevans.ts`: en
maskinafledt opgave må ikke modsige det dokumenterede vindue. Felterne holder
op med at konkurrere — vinduet svarer på *om og hvornår*, offsettet på *hvor
inde i vinduet*. Chili løses uden specialcase.

**(4) Kombinationen er i sig selv ugyldig og skal modelleres anderledes.**
✅ **Også sand** — auditten viser det stærkere end forventet: guidekontrakten
kender ikke felterne, 0 af 176 redaktionelle guides bruger offset, og feltet
stammer fra ét promptekssempel. Men "ugyldig → smid væk" kan ikke effektueres
nu (data findes live, og der laves ingen datacleanup endnu).

**(3) og (4) er ikke i modstrid.** Princip 3 gør offsettet underordnet —
præcis det, som en senere ommodellering ville formalisere. 3 er runtime-
semantikken; 4 er retningen for datamodellen.

---

## 8. Forslag: én generel produktregel

> **Det dokumenterede dyrkningsvindue bestemmer, hvornår en maskinafledt
> opgave må ligge. `relativeOffsetDays` placerer den kun inden i vinduet og
> kan aldrig flytte den ud af det.**
>
> Konkret, i denne rækkefølge:
>
> 1. **Vinduet slås op canonical** via `resolveFroebankVinduer` /
>    `resolveHoestMaaneder` — samme opslag som relevansmotoren bruger.
>    Findes der intet canonical vindue, bruges reglens egen
>    `recommendedMonths`. Er begge tomme, opfører reglen sig som i dag.
> 2. **Offsettet beregner en ønsket dato** fra så-datoen.
> 3. **Ligger datoen i vinduet, står den.** Ligger den uden for, rykkes den
>    til vinduets nærmeste kant — aldrig længere.
> 4. **Har reglen intet offset**, dateres den til vinduets åbning som i dag.
> 5. **Tilbagevirkende registrering:** en opgave, hvis dato ligger i
>    fortiden, oprettes kun, hvis vinduet stadig omfatter registrerings-
>    måneden — og dateres da til registreringsdagen. Ellers slet ikke.
>    Vinduet afgør relevansen, ikke datoen.

Trin 1 lukker samtidig to-korpus-splittet: opgaven dateres efter præcis det
vindue, relevansmotoren senere måler den mod. Ingen ny månedsmotor.

---

## 9. Annas beslutninger — LÅST 2/9

**A. Clamp til vinduets faktiske nærmeste kant.** Kender vi kun måneder, må
vi ikke opfinde en "bedre" dag.

* ønsket 13/4, vindue maj–juni → **1/5**
* ønsket 2/7, vindue august–oktober → **1/8**
* ønsket 20/11, vindue august–oktober → **31/10**

Dagen fra offsettet bevares IKKE, og `tidsvindue.ts`-konventionen
(primo/medio/ultimo = 1./11./21.) bruges IKKE — den beskriver tekstlige
vinduer, og her har vi kun måneds-medlemskab. Ved **diskontinuerte** vinduer
(fx `[4,5,6,9,10]`) skal nærmeste gyldige kalenderdato findes; antag aldrig
ét sammenhængende interval.

**B. Tilbagevirkende relevante opgaver omdateres til oprettelsesdagen** —
de droppes ikke. Beregnet dato i fortiden + indeværende måned stadig i det
canonical vindue → opret med `today`. Beregnet dato i fortiden + vinduet
lukket → opret slet ikke. Det erstatter `.filter(date >= today)`, som intet
ved om faglig relevans.

**C. `relativeOffsetDays` udfases.** Ikke slettet brutalt — 54 eksisterende
private regler bruger det. Men: stop med at generere nye, fjern det fra
AI-prompteksemplet, markér det legacy/deprecated i runtime, behold midlertidig
læsestøtte til eksisterende guides. Canonical dyrkningsvindue er autoriteten;
offset er kun sekundær ønskedato inden i vinduet. Separat datamigration/regen
af de 54 regler senere.

> Feltet findes ikke engang i den egentlige guide-kontrakt. Vi legitimerer det
> ikke som centralt domænebegreb, blot fordi AI'en lærte sig selv at kopiere
> et eksempel 54 gange.

### Låst regel til implementationstråden

> `calendarRules` dateres efter canonical cultivation windows.
> `relativeOffsetDays` er legacy hint, ikke autoritet.

1. Find canonical vindue via samme resolvers som reminder-relevans.
2. Mangler canonical vindue → brug `recommendedMonths` som legacy fallback.
3. Mangler også det → bevar eksisterende fallback-adfærd.
4. Beregn evt. offsetdato.
5. Offsetdato inden for vinduet → brug den.
6. Uden for → clamp til nærmeste gyldige kant.
7. Intet offset → vinduets første gyldige dato efter relevant trigger/kontekst.
8. Tilbagevirkende oprettelse: vinduet stadig åbent nu → brug `today`; ellers
   opret ikke den forældede maskinopgave.
9. Nye AI-guides må ikke få `relativeOffsetDays`.

Test: årsskifte, diskontinuerte månedslister, dato før vindue, dato efter
vindue, dato inden for vindue, tilbagevirkende registrering.

## 10. Værn

`scripts/test-opgavetype-kontrakt.ts` (79 assertions, kørt af `npm test`)
vogter kontrakten fra §5. Den vigtigste test læser CHECK-constrainten ud af
`00018_calendar_tasks.sql` og fejler, hvis TS-listen og databasen driver fra
hinanden.

Datoberegningen har fortsat ingen suite. Implementationstråden bør lande
reglen ovenfor med en suite, der vogter invarianten "ingen maskinafledt dato
uden for sit dokumenterede vindue" — samme mønster som
`test-reminder-relevans.ts`.
