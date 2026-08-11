# Potalot tekst-audit — summary (11. august 2026)

Komplet census af dansk brugervendt tekst i repoet, til systematisk korrektur.
Audit- og eksportopgave: **ingen app-kode er ændret**. Fuldt inventar:
`Docs/content/potalot-text-audit.csv` (UTF-8 med BOM, komma-separeret,
RFC-quoting — Excel på dansk: brug evt. Data → Fra tekst/CSV).

Metode: 8 område-agenter gennemgik al UI-copy med route/state-kontekst;
det redaktionelle lag (171 guides i `content/guides/`) blev udtrukket
**mekanisk** (scripts/text-audit/extract-editorial.ts — ordret, uden
afskrivning) og derefter korrekturlæst af 3 agenter, hvis fund er koblet
på de udtrukne rækker. Flagning var bevidst konservativ.

## Tallene

- **4.697 tekstforekomster** i alt · **4.308 unikke tekster** · 606 dynamiske (templates med variabler)
- **395 flagget** · **6 × P0 · 98 × P1 · 291 × P2**
- 12 korrektur-fund kunne ikke kobles automatisk på en udtrukket sektion — de står som egne rækker markeret "(patch uden sektion-match)"

### Pr. område
| Område | Rækker |
|---|---|
| Guides (redaktionelt) | 1.793 |
| Havebog | 862 |
| Navigation & profil | 398 |
| Planter | 343 |
| System & fællesskab | 343 |
| Guides (UI) | 286 |
| Kalender | 256 |
| Frøbank | 253 |
| Gartneren | 163 |

### Pr. teksttype (hovedgrupper)
guide 1.478 · ui/microcopy 1.175 · dyrkningsfakta 587 · forvandling 312 ·
system/status/fejl ~357 · formular 266 · hjælp/onboarding 165 · navigation 161 ·
gartner/ai 60 · artikel 54 · øvrige ~80. (Enkelte agenter brugte finere
labels — knap, placeholder osv. — de er bevaret som afgivet.)

### Flag pr. kategori
UKLAR_UX_COPY 125 · INKONSISTENT_TERMINOLOGI 91 · GRAMMATIK 55 ·
TEGNSÆTNING 45 · FAGLIGT_TJEK_NØDVENDIGT 36 · STAVEFEJL 26 ·
DUBLET/GENTAGELSE 12 · TONE_OF_VOICE 6

## De 6 P0'er

1. **KAL-0125** — "**Sov** grønkål, pak choi…" (tastefejl for "Så", inspiration.tsx)
2. **SYS-0319** — gruppe-tagget "**Vinduskarm**" (constants.ts; samme fil staver det korrekt andetsteds)
3. **GED-0387** — cikorie.md: intern IA-/spec-tekst med backtick-kode i læserprosaen
4. **GED-1058** — pak-choi.md: datamodel-note ("parentSlug") lækket ind i læserteksten
5. **GED-0761** — kaprifolie.md: "snonende" i en sektionsoverskrift
6. **GED-1229** — radise.md: "rodafgroede" (manglende ø) i quickFacts-visningstekst

## Gennemgående mønstre (større end enkeltrækker)

1. **"AI" i brugervendt tekst** trods det låste "kun Gartneren/Potalot"-princip:
   9 fejlbeskeder (frøpakke-skanning, have-tekst), 13+ frøbank-tekster
   ("Generér med AI"), "AI gartner"-kortet på /indstillinger (som oveni
   forældet påstår, at Gartneren "ikke er aktiveret endnu").
2. **Rå engelske fejltekster i UI** — `error.message` fra Supabase vises
   uoversat i hele auth-flowet, frøbankens dialoger, kalenderens actions og
   guides-flows ("User already registered", "Plant not found"). Rettes bedst
   som kode-mønster, ikke tekst for tekst.
3. **Intern spec-/produktionstekst lækket ind i redaktionel prosa** — mindst
   8 guides (cikorie, pak-choi, rucola, sød-kartoffel, ribs, vårsalat, majroe,
   kålroe) + "Sortsguiden bør beskrive…"-skribentinstrukser som slutsektion i
   ~19 prydguides.
4. **Døde guide-referencer** — 15+ slugs i :::guide/:::next-guide-blokke peger
   på filer, der ikke findes (agurk, chili, dahlia, peberfrugt m.fl.).
5. **Template-bøjningsfejl i dynamisk tekst** — "1 rækker fundet",
   "3 optjent badges", "du høstede første tomatplanterne", "forespørgselser",
   genitiv "${navn}s side", ASCII-artsnavne i UI ("Tidligere jordbaer næste år").
6. **Hardcodet indhold der foregiver at være dynamisk** — juni-råd vist året
   rundt i Inspiration, demo-vejrtal ("8 mm i nat") uden vejr-API, årstal
   2026/2027 i genbrugte sæson-challenges, "spirer typisk om 1–2 uger" for
   alle arter.

## Terminologi-beslutninger, der skal træffes ÉN gang

| Valg | Varianter fundet |
|---|---|
| Potalot | "Potalot" vs "PotAlot" (topbar, login, metadata, frøbank) |
| Gartneren | vs "AI", "AI gartner" |
| fx | "fx." · "Fx." · "F.eks." · "fx" |
| guides | "guider" vs "guides" · "Teknikguider" vs "Teknikguides" |
| artsguide/sortsguide | "arts-guiden" · eyebrow "Sortsvariant" vs chip "Sortsguide" |
| forkultivering | vs "forspiring" (i kartoffel.md reserveret læggekartofler) |
| Pottet om | vs "Ompottet" · logtypen vises også som "priklede om" (fagligt forkert) |
| Redigér/Annullér | vs "Rediger"/"Annuller" |
| opgaver | vs "tasks", "to-do" · "udfordring" vs "challenge" |
| frøpost | vs "Frøbank-element", "items" |
| historik/historie | vs "log-event", "Logs"-fane |
| tags | ø/æ vs oe/ae-translitteration i guide-tags ("køkkenhave" vs "koekkenhave") |

## Fagligt tjek nødvendigt (36 rækker — kræver Anna/fagperson)

Højdepunkter: "sneglehuse kan gøre stor skade" (fejloversættelse, 2 guides) ·
"savfluer" (anglicisme; korrekt: bladhvepse) · Korona/Corona-forvirring i
jordbær · "oksehjerte-peber" for Corno di Toro · agurkens `water: regular`
vs prosa + sorternes `high` · tomatens spiredage uens i samme fil ·
havehistoriens kilde "SGAV/sgavmst.dk" ligner en ikke-eksisterende myndighed ·
privat gmail som offentlig kontaktadresse (contact.ts).

## Hvad auditten IKKE kunne se (huller)

- **Supabase-indhold**: gøremålstekster (general_garden_tasks + seed i
  migration 00052), DB-master-guides og brugernes egne/AI-guides,
  gruppe-/brugerskabt indhold, notifikationstekster fra DB,
  **e-mail-skabeloner** (bor i Supabase-dashboardet).
- **Gartnerens genererede svar** (runtime, styres af systemprompten — den ER
  med i CSV'en som kontekst "systemprompt").
- **Tale-til-tekst-indhold** + edge function `transcribe`.
- `potalot-image-sets.ts` (~308 alt-tekster) — kun spot-checket, ikke
  eksporteret som enkeltrækker.
- Rene label-tabeller er stedvis samlet i én række pr. tabel.
- **Legacy/ubrugte komponenter** er auditeret men markeret i kontekst
  ("ubrugt komponent") — ret dem sidst eller slet dem.

## Anbefalet rækkefølge for menneskelig korrektur

1. **P0 + P1 (104 rækker)** — filtrér prioritet-kolonnen; start med de to
   principbrud (AI-brand, master i læser-UI) og guide-spec-lækagerne.
2. **Terminologi-tabellen ovenfor** — én beslutning pr. række, så resten kan
   rettes mekanisk bagefter.
3. **UI/microcopy pr. område** — forslag: Gartneren (163) → Frøbank (253) →
   Planter (343) → Kalender (256) → Navigation & profil (398) → Guides UI
   (286) → Havebog (862; mange rækker er redaktionelle motorer).
4. **Kode-mønstrene** (rå error.message, bøjnings-templates, ASCII-navne) —
   overdrag som builds, ikke tekstrettelser.
5. **Redaktionelle guides (1.793 rækker)** — de 98 flaggede først, derefter
   batch-korrektur (fx 20 guides ad gangen); rækker med status
   `ikke_vurderet` er inventar, der afventer menneskelig læsning.

## Status-værdier i CSV'en

- `auto-flagget` — maskinen fandt et konkret problem (se problemkategori)
- `auto-gennemgået` — læst af audit-agent, intet flag (problemkategori OK)
- `ikke_vurderet` — redaktionelle rækker udtrukket mekanisk, ikke
  korrekturlæst individuelt (guide-korrekturens fund er koblet på de
  relevante rækker som `auto-flagget`)

ID'erne (FRB-0001 …) er stabile for denne audit-årgang — brug dem som
reference i korrekturarbejdet (original → anbefalet ændring → begrundelse →
godkendelsesstatus).
