# Diktafon v1 — implementeringsspec

**Status:** commit-klar spec. Ingen produktionsændringer foretaget endnu.
**Forudgående doc:** `Docs/product/diktafon-indbakke.md` (indbakke-modellen, recorded_at = kilden til sandheden).
**Formål:** lukke de fem åbne produktbeslutninger, så en udvikler kan bygge uden at opfinde produktet undervejs.

---

## 0. Hvad findes allerede (verificeret 18/7-2026)

| Lag | Status | Fil |
|---|---|---|
| Optager-UI (fase-maskine idle→lytter→fortolker→forslag→gemt) | Bygget | `src/components/havebog/tal-optager.tsx` |
| Global "tryk og tal"-indgang (dialog i topbar) | Bygget | `src/components/havebog/tryk-og-tal-knap.tsx`, `src/components/layout/topbar.tsx:46` |
| Forside-indgang (RUM 3) | Bygget | `src/app/(app)/page.tsx:124` |
| Fortolker (LLM → 1–3 forslag) | Bygget, **Claude Haiku** | `src/lib/tale-fortolk.ts` |
| Server-action-wrapper (auth + planteliste) | Bygget | `src/actions/tale.ts` |
| Persistens (indbakke: gem/list/behandl) | Bygget | `src/actions/optagelser.ts` |
| DB-tabel `voice_notes` | **Anvendt live** (bekræftet, ikke kun skrevet) | `supabase/migrations/00053_voice_notes.sql` |
| Arkiv-side | Bygget | `src/app/(app)/havebog/optagelser/page.tsx`, `optagelser-arkiv.tsx` |

**Transskription i dag:** browserens Web Speech API (`SpeechRecognition`, `da-DK`), 100 % klientside. **Ingen lyd optages** (`voice_notes.audio_url` er altid null). **Ingen `MediaRecorder`, intet `getUserMedia`, ingen Edge Function, ingen Whisper findes i repo'et.**

---

## 1. Transskriptionsmotoren — LÅST: Vej A (server STT), Anna 18/7

**Beslutning (Anna):** Byg rigtig ét-tryk-optagelse med `getUserMedia` + `MediaRecorder`, transskription via en separat Supabase Edge Function, fortolkning via Claude Haiku. Ingen Web Speech som primær motor. `"Skriv i stedet"` (tekstfelt) beholdes som fallback. Ingen implementering før den konkrete STT-model, endpoint, request-format, størrelsesgrænse og `language: "da"` er dokumenteret + godkendt (se 2.4).

**Hvorfor Vej A og ikke behold Web Speech:** Web Speech findes ikke på iOS Safari → dér falder brugeren ned i tekstfeltet og må bruge tastatur-dikteringen. **Det er præcis den "genvej til en genvej", der startede tråden.** At beholde Web Speech ville gøre fortolkningen bedre, men lade selve diktafonen forblive falsk på iPhone.

**To ting fra tråden, der IKKE matchede stacken (rettet her):**
1. **Fortolkningen bliver på Claude Haiku** (Server Action, allerede bygget) — ikke OpenAI. Trådens OpenAI-eksempler var generiske.
2. **Anthropic har ingen tale-til-tekst-API** → serverside STT kræver en **ny ekstern leverandør** (nøgle + omkostning pr. optagelse). Provider-valget låses i 2.4.

**Verificeret 18/7 — Supabase Edge Function-grænser (fra docs):** ingen publiceret hård request-body-grænse. Bindende grænser: 256 MB hukommelse, 2 s CPU-tid (**async I/O tæller ikke med** — STT-videresendelse er ren I/O), 400 s wall-clock (paid). 60–90 s lyd ≈ 1–2 MB rammer ingen af dem. **Build-krav:** bekræft empirisk med ét 90-sekunders testklip før launch, antag det ikke.

---

## 2. De fem låste beslutninger

### 2.1 `sourceText` vs. `text`

- `evidence.sourceText` = det **ordrette** tekstudsnit fra den brugerrettede transskription.
- `text` = kort, sprogligt ryddet **visningstekst**.
- Modellen **må** fjerne fyldord og gøre talesprog til en læsbar sætning.
- Modellen **må ikke** tilføje oplysninger eller ændre betydningen.

```json
{
  "text": "Så mere salat næste tirsdag",
  "evidence": {
    "sourceText": "og så skal jeg altså også lige huske at så noget mere salat næste tirsdag"
  }
}
```

Reglen skrives eksplicit ind i systemprompten, så output bliver konsistent.
→ **Afvigelse:** eksisterende `TaleForslag` (`src/lib/tale-fortolk.ts:23`) har `titel` + `tekst`, men **intet `evidence`-felt**. Skal tilføjes.

### 2.2 Escape hatch — fallback-type `note`

Ingen meningsfulde segmenter må droppes stille. Falder noget uden for de øvrige kategorier, bliver det `note`.

```ts
type GardenNoteType =
  | "observation"
  | "task"
  | "harvest"
  | "problem"
  | "memory"
  | "next_season"
  | "note";
```

→ **Afvigelse:** eksisterende `ForslagType` har kun **4 danske** værdier: `note | observation | hoest | opgave`. Tre typer mangler (`problem`, `memory`, `next_season`), og navngivningen er dansk, ikke engelsk. To valg her:

- **Navngivning:** kodebasen er dansksproget internt (`hoest`, `opgave`, `minde`). Anbefaling: behold dansk konvention (`hoest`, `opgave`, `problem`, `minde`, `naeste_saeson`, `observation`, `note`) og hold engelsk kun i denne doc. Ingen funktionel forskel — vælg og lås ét sprog.
- **Lagermapping** (hver type SKAL kunne gemmes et sted):

  | Type | Gemmes som | Note |
  |---|---|---|
  | `observation` | `plant_logs_v2` type `note` | kræver plante (NOT NULL) |
  | `harvest`/`hoest` | `plant_logs_v2` type `harvest` | → `voice_notes.status='minde'` |
  | `problem` | `plant_logs_v2` type `pest_disease` | naturligt lager; kræver plante |
  | `memory`/`minde` | `plant_logs_v2` type `note` | → status `minde` |
  | `task`/`opgave` | `calendar_tasks` | eneste type der må stå uden plante |
  | `next_season`/`naeste_saeson` | `calendar_tasks` m. dato i næste sæson | ellers `note` uden dato |
  | `note` | `plant_logs_v2` type `note` | kræver plante |

  **NOT NULL-reglen + "intet droppes stille" (BYGGET 18/7):** `plant_logs_v2.plant_id` er NOT NULL. Kan en log-type matches til en plante → plante-log oprettes. Kan ingen plante matches → forslaget degraderes **ikke** til en falsk opgave (gammel adfærd, fjernet); i stedet forbliver teksten i optagelses-arkivet (`voice_notes`) med rette status. Ukendt plante nulstilles serverside (`fortolkRåSvar`), så en opdigtet kobling aldrig gemmes.

  **UX-regel (Anna 18/7) — SKAL testes i browserflowet:** når et godkendt forslag IKKE kunne knyttes til en plante eller kalender og kun endte i arkivet, må succes-beskeden ikke lyde generisk ("Gemt i din havebog"). Brugeren skal se, at det blev parkeret som note, fx:
  > *Gemt som almindelig note. Jeg kunne ikke knytte den til en plante.*

  Ellers oplever brugeren, at hun godkendte noget, som Potalot i praksis blot lagde i arkivet. Kræver at `behandlOptagelse` returnerer hvad der reelt blev oprettet (log/opgave) vs. kun arkiveret. **Ikke i denne commit** — differentieret besked + browser-test er en opfølgning.

  **Konsekvens for DB:** `voice_notes.status` har CHECK `('unprocessed','log','opgave','minde','observation')`. `problem` og `next_season` som optagelses-udfald kræver enten en migration, der udvider CHECK'en, **eller** at de mapper til en eksisterende status (`problem`→`observation`, `next_season`→`opgave`). Anbefaling: map til eksisterende status i v1, ingen migration.

### 2.3 Tomt resultat (`items: []`)

Transskriptionen bevares altid (optagelsen er allerede persisteret som `unprocessed`, så teksten er aldrig tabt). UI viser en **egen tilstand** — ikke en tom liste med en Gem-knap:

> **Jeg kunne ikke dele noten op**
> Teksten er stadig her. Du kan rette den eller gemme den som en almindelig note.

Handlinger: `[ Ret teksten ]` `[ Gem som note ]` `[ Annuller ]`

`[Gem som note]` beholder hele transskriptionen i arkivet (`beholdSomNote` → status `log`, ingen domæne-række) — teksten er allerede gemt, så intet går tabt. `[Ret teksten]` fører tilbage til tekstfeltet med transskriptionen bevaret; `[Annuller]` lukker (optagelsen bliver liggende `unprocessed` i arkivet).
→ **BYGGET 18/7:** ny `'tomt'`-fase i `tal-optager.tsx` erstatter den gamle generiske `'fejl'`-fase for tomt/malformet resultat. `INTERPRETATION_INVALID` behandles som tom (bevar tekst); kun ægte net-/API-fejl (`STT_INTERPRET_FAILED`) viser "prøv igen".

### 2.4 Transskriptionsmodel (Vej A) — konkret, LÅST pånær provider-ja

**Kostscenarie (Annas konservative tal, verificeret priser 18/7):**
100 brugere × 5 optagelser/uge × 30 s × 4,33 uger = **2.165 optagelser/md ≈ 1.083 lyd-min/md.**

| Model | Pris/min | 100-bruger-måned | Dansk-kvalitet |
|---|---|---|---|
| OpenAI `gpt-4o-transcribe` | $0,006 | **~$6,50** | Bedst af de billige, slår whisper-1 på ikke-engelsk |
| OpenAI `whisper-1` (legacy) | $0,006 | ~$6,50 | Gennemprøvet |
| OpenAI `gpt-4o-mini-transcribe` | $0,003 | ~$3,25 | Billigst, lavere præcision |
| Deepgram Nova-3 (batch) | $0,0043 | ~$4,66 | Dansk understøttet, ikke stærkeste niveau |

**Konklusion:** hele spændet er $3–7/md ved 100 aktive brugere → prisforskellen er støj. Økonomien afgør *ikke* provideren; **dansk transskriptionskvalitet på havesprog gør.** Anbefaling: **`gpt-4o-transcribe`** (bedst dansk af de billige; samme endpoint/format som whisper-1 → lav risiko; whisper-1 er drop-in fallback til samme pris).

**Låste værdier (udvikleren vælger IKKE under build):**
- **Model:** `gpt-4o-transcribe` · fallback `whisper-1`
- **Endpoint:** `POST https://api.openai.com/v1/audio/transcriptions`
- **Request-format:** `multipart/form-data` (`file`, `model`, `language`, `response_format=json`)
- **Filformat:** Chrome → `audio/webm;codecs=opus`; Safari → `audio/mp4`. Vælg via `MediaRecorder.isTypeSupported()` på klienten; send containeren videre uændret.
- **Størrelse:** OpenAI-grænse 25 MB pr. fil (langt over 1–2 MB). Supabase Edge: se afsnit 1 — ingen bindende body-grænse for 1–2 MB. Cap klientside: **maks 120 s optagelse** som sikkerhedsventil.
- **`language: "da"`** som **hård parameter** (ikke autodetektion — korte klip med "San Marzano"/"Café au Lait" får ellers modellen til at gætte italiensk/engelsk).
- **Domæneordliste:** `prompt`-parameteren fyldes dynamisk med brugerens egne arts-/sortsnavne (fra `plants_v2`) — bedre end statisk kontekst.
- **Timeout:** 30 s på STT-kaldet; ved timeout → kendt fejltype, bevar UI-tilstand (jf. 2.5).
- **Responsformat:** `{ text: string }` (json). Nøgle i Edge Function secrets (`OPENAI_API_KEY`), aldrig klientside.

**Bemærk:** sprogparameterens navn/format er ikke ens på tværs af modeller. `gpt-4o-transcribe` og `whisper-1` deler endpoint + `language`-felt → derfor er fallbacken gratis. Skiftes model uden for de to, skal 2.4 revideres.

**Åbent (kræver Annas handling):** OpenAI-konto + `OPENAI_API_KEY`. Jeg kan ikke oprette konto eller indtaste nøgle — du lægger nøglen i Supabase function secrets, jeg wirer resten.

### 2.5 Servervalidering (begge kald)

Fortolkningens output valideres mod et **fast skema** (Zod) serverside. Ved malformet LLM-output skal fortolkningsfunktionen:

- forsøge **højst én** kontrolleret reparation,
- ellers returnere en **kendt fejltype**,
- **aldrig** gemme noget,
- bevare den brugerrettede transskription i frontend.

```json
{
  "error": {
    "code": "INTERPRETATION_INVALID",
    "message": "Potalot kunne ikke dele noten sikkert op."
  }
}
```

Frontend viser derefter samme valg som ved tomt resultat (2.3): ret teksten eller gem hele teksten som `note`.
→ **Afvigelse:** eksisterende kode har defensiv håndparsning (`parseForslagJSON` + felt-for-felt-mapping, `tale-fortolk.ts:73-144`), men **ingen Zod og ingen defineret `INTERPRETATION_INVALID`-kontrakt**. Skal tilføjes.

**Datoer:** relative udtryk ("næste uge", "i weekenden") løses til **ISO-dato serverside** med optagelsens `recorded_at` som anker; aldrig gem strenge som `"next_week"`. → Delvist opfyldt i dag (regex-valideret `YYYY-MM-DD`, default = `recorded_at` i `behandlOptagelse`), men modellen bliver bedt om at producere ISO direkte — bekræft at ankeret er `recorded_at`, ikke "i dag".

---

## 3. Ikke en del af v1

- offline-kø
- live-transskription / interim-preview
- automatisk lagring (godkendelse er altid manuel)
- permanent lagring af lyd
- automatisk diagnosticering af sygdomme
- skjulte AI-gæt (alt gættet skal være synligt for brugeren)
- automatisk retry ud over almindelig brugeraktiveret "prøv igen"

---

## 4. Filliste — hvad build'et rører

**Ændres (fortolknings-/UI-laget):**
- `src/lib/tale-fortolk.ts` — udvid `ForslagType` til 7; tilføj `evidence.sourceText`; Zod-skema + `INTERPRETATION_INVALID`; låst sprogregel for `text` vs. `sourceText`.
- `src/actions/tale.ts` — returtype med fejlkontrakt; skema-validering før returnering.
- `src/actions/optagelser.ts` — lagermapping for `problem`/`memory`/`next_season`; status-mapping (2.2).
- `src/components/havebog/tal-optager.tsx` — tomt-resultat-tilstand (2.3) + `[Gem som note]`; fejltilstand fra `INTERPRETATION_INVALID`.
- `src/data/havebog-demo.ts` — evt. nye typer i demo-data.

**Tilføjes (Vej A, server STT — LÅST):**
- Ny Edge Function `transcribe` (Supabase) — audio → tekst via `gpt-4o-transcribe`; `OPENAI_API_KEY` i function secrets.
- Recorder-omskrivning i `tal-optager.tsx` — `getUserMedia` + `MediaRecorder` erstatter `SpeechRecognition`; 120 s cap; `"Skriv i stedet"` beholdes som fallback.
- Evt. migration til `voice_notes.status`-CHECK, hvis `problem`/`next_season` skal være førsteklasses status (ellers ingen — se 2.2).

**Rører IKKE:**
- `supabase/migrations/00053_voice_notes.sql` (tabellen står korrekt).
- indbakke-/sæson-modellen (`recorded_at` = kilden til sandheden, uændret).
- `topbar.tsx` / `page.tsx` indgange (samme kæde genbruges).

---

## 5. Afvigelses-resumé (eksisterende kode ↔ trådens arkitektur)

| # | Trådens arkitektur | Virkeligheden i repo'et | Handling |
|---|---|---|---|
| 1 | STT via MediaRecorder + Edge Function + Whisper | Web Speech klientside, ingen lyd, ingen server | **LÅST Vej A** (afsnit 1) — `gpt-4o-transcribe`, venter kun `OPENAI_API_KEY` |
| 2 | Fortolkning via OpenAI | Fortolkning via **Claude Haiku** (Server Action) | Bliv på Haiku |
| 3 | 7 typer (engelsk) | 4 typer (dansk) | Udvid + lås sprog (2.2) |
| 4 | `evidence.sourceText` | kun `titel`+`tekst` | Tilføj felt (2.1) |
| 5 | Zod + `INTERPRETATION_INVALID` | håndparsning, ingen kontrakt | Tilføj (2.5) |
| 6 | Egen tom-resultat-tilstand | generisk `'fejl'`-fase | Tilføj (2.3) |
| 7 | ISO-datoer serverside | delvist (regex + recorded_at-default) | Bekræft anker (2.5) |

Med afsnit 1 besvaret og 2.1–2.5 låst kan udvikleren bygge v1 uden at træffe produktbeslutninger inde i koden.
