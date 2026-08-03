# AI Gartneren — integration i Potalot (spec-udkast)

*Skrevet 3/8 2026 ud fra Annas oplæg. Opgave planlagt til senere på ugen.
Status: PLAN — intet er bygget endnu.*

## Den ene sætning

**AI skal altid dukke op med kontekst, aldrig alene** — og aldrig blokere
brugerens flow.

Tre idéer (log→forslag, foto-diagnose, universel adgang) er i virkeligheden
én udfordring: gør Gartneren til en naturlig del af appen uden at gøre den
tung, langsom eller "AI over det hele".

## Låste principper (fra Annas oplæg)

1. **Performance først.** AI kører ALDRIG ved sideindlæsning, er aldrig del
   af initial rendering, aktiveres kun når brugeren beder om hjælp. Alle
   kald asynkrone med loading-state — brugeren kan altid fortsætte imens.
2. **Aldrig automatisk.** Efter en problem-log *tilbydes* Gartnerens
   vurdering — brugeren vælger selv at trykke.
3. **Ingen tryllestjerner.** Ingen ✨, ingen nye ikoner, ingen "AI-brand".
   Én identitet: **Gartneren** (plante-glyffen, jf. SpoergGartneren).
   Samme ordlyd alle steder — små *teksthandlinger*, ikke knapper.
4. **Konteksten er superkraften.** Prompten pakkes automatisk med det,
   Potalot allerede ved (art, sort, sted, sådato, log, vejr, billeder).
   Brugeren skal aldrig forklare sin have igen. Kun topbar-indgangen uden
   kontekst starter tomt.

## Hvad der findes i koden i dag (grounding, tjekket 3/8)

- `src/lib/anthropic/client.ts` — getAnthropicClient() + CLAUDE_HAIKU.
- **Intet chat-endpoint.** CLAUDE.md nævner `src/app/api/ai/chat/`, men den
  findes ikke. AI bruges kun i afgrænsede actions: `seed-packet-extract.ts`
  (foto→frødata, beviser vision virker), `lib/tale-fortolk.ts` (diktafon),
  `have-tekst.ts`, `guides-admin.ts`/`guides.ts`.
- `src/components/guides/spoerg-gartneren.tsx` — visuel CTA uden backend,
  eksplicit "TODO: wire til rådgiver-endpoint". Tone/identitet allerede
  rigtig ("ingen glitrende AI-cirkus").
- Loggen (`plant-log-meta.ts`, `log-form.tsx`, `timeline.tsx`): logtyperne
  `pest_disease` og `health` (value `attention`) findes — det er de to
  naturlige triggere for "Vil du have Gartnerens vurdering?".
- Diktafonen i topbaren = den eksisterende universelle indgang
  (`actions/tale.ts`, `optagelser.ts`). Skal udvides, ikke opfindes.
- DB har `ai_conversations`-tabel (ubrugt til dette formål endnu).

## De tre indgange til Gartneren

A. **Stil et spørgsmål** (fri tekst — "Hvorfor bliver bladene gule?")
B. **Upload/tag et billede** ("Hvad er der galt?") — identificér plante
   eller problem
C. **Fra en eksisterende plante** ("Hjælp med denne plante") — Potalot
   sender selv art, sort, alder, sted (drivhus/friland), log, seneste
   billeder. Det er fordelen over ChatGPT.

## Kontekst-pakken (pr. afsender-flade)

| Åbnet fra | Gartneren ved automatisk |
|---|---|
| Plante-detalje | art, sort, sådato/plantedato, sted, log, billeder, vejr |
| Log (netop gemt hændelse) | plantens kontekst + den konkrete hændelse |
| Guide | hvilken guide/art brugeren læser |
| Kalender | hvilken opgave brugeren ser på |
| Frøbank | hvilken sort ("Er denne sort noget for mig?") |
| Topbar (ingen kontekst) | tom start — stil spørgsmål / tag billede / upload |

## Teksthandlinger (samme ord, alle steder — ingen ikoner)

- Log: **Få Gartnerens vurdering**
- Guide: **Spørg om denne plante**
- Kalender: **Hjælp mig med denne opgave**
- Plante: **Undersøg denne plante**
- Frøbank: **Er denne sort noget for mig?**

## Yndlingsflowet (loggen bliver aktiv, ikke bare historik)

1. Brugeren logger fx `pest_disease` ("Bladene krøller") eller trivsel =
   Kræver opmærksomhed → gem.
2. Log-kortet viser diskret: ⚠️ *Vil du have Gartnerens vurdering?*
3. Tryk → Gartneren svarer (streaming, asynkront): sandsynlige årsager,
   konkrete handlinger, hvad man skal holde øje med, link til relevante
   guides.
4. Nederst: **Log løsning** eller **Markér som løst** → svaret og udfaldet
   bliver en del af plantens log.

## Foreslået byggerækkefølge (udkast — ikke besluttet)

1. **Motor**: ét server-endpoint/action "spørg Gartneren" (Haiku,
   streaming, valgfrit billede, kontekst-pakke som struktureret input).
   Genbrug mønstret fra seed-packet-extract + tale-fortolk.
2. **Log-flowet** (yndlingsflowet) — mest værdi, mindst UI: trigger på
   `pest_disease` + `health=attention`.
3. **Wire SpoergGartneren** på Guides til motoren (felt + CTA findes).
4. **Plante-detalje**: "Undersøg denne plante" med fuld kontekst-pakke.
5. **Topbar/universel** indgang (udvid diktafon-mønstret: spørg/foto).
6. Kalender + Frøbank-teksthandlinger til sidst.

## Afhængigheder / opmærksomhed

- **Performance-sprinten (parkeret 3/8→4/8) kommer FØRST.** Princip 1 er
  allerede opfyldt i dag (ingen AI ved load) — hold det sådan.
- Svar bør gemmes (ai_conversations el. plante-log) så vurderingen bliver
  historik, ikke flygtig chat.
- Foto-upload: genbrug eksisterende komprimering (`compress-image.ts`) og
  upload-flow; husk stående regel om billed-komprimering.
- Demo-mode: afklar om Gartneren er aktiv uden login (API-omkostning).
