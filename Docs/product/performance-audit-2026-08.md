# Performance-audit — 4. august 2026 (målefasen)

Princip for sprinten: **mål først, optimer bagefter.** Dette dokument er
målingen. Ingen kode er ændret endnu.

## Metode

- Lokal produktionsbuild (`next build` + `next start`, port 3009) — TTFB og
  payload målt med curl (3 kørsler) og browser (Performance API).
- Live-sitet potalot.netlify.app målt med curl (kold + varm).
- Statisk kortlægning af ALLE server-side datakald pr. route (call-tree
  gennemgang af pages → actions → lib).
- Vigtig begrænsning: runtime-tal er målt som **anonym** bruger (ingen login).
  Anonym springer næsten alle Supabase-kald over — Annas oplevelse som
  logget ind er VÆSENTLIGT tungere, jf. round-trip-tallene nedenfor.

## Nøgletal

### Live (potalot.netlify.app, anonym)

| Route | TTFB kold | TTFB varm | HTML (gzip) |
|---|---|---|---|
| / | **8,4 s** | 0,45 s | 30 kB |
| /froebank | 0,42 s | 0,30 s | 20 kB |
| /kalender | **2,1 s** | 0,84 s | 79 kB |
| /guides | 0,40 s | 0,37 s | **300 kB** |

### Lokal prod-server (anonym)

| Route | TTFB varm | HTML (gzip) | JS decoded | Noter |
|---|---|---|---|---|
| / | 7–13 ms | 31 kB | 844 kB | 1 billede: 557 kB |
| /froebank | 5–8 ms | 16 kB | 1.534 kB | tom (anonym) |
| /kalender | **280–390 ms** | 54 kB | **2.230 kB** | hero-PNG 461 kB |
| /mine-planter | 5–9 ms | 14 kB | — | |
| /guides | 14–18 ms | **188 kB** | 1.530 kB | HTML decoded 722 kB |

Anonym TTFB på 5–13 ms bekræfter: uden login rammes databasen stort set
ikke. Live-tallene ovenfor er altså et **gulv** — logget ind kommer
Supabase-round-trips oveni (se næste afsnit).

### Supabase-round-trips pr. sideåbning (logget ind, statisk kortlagt)

| Route | DB/RPC-ops | auth.getUser-kald | Eksterne kald | I alt |
|---|---|---|---|---|
| / (havebog) | 14 | 9 | 1 (Open-Meteo) | **24** |
| /kalender | 17 | 14 | 2 (Open-Meteo) | **32** |
| /mine-planter | 9 | 9 | — | 19 |
| /froebank | 9 | 8 | — | 18 |
| /guides | 9 | 7 | — | 17 |

Alle tal inkluderer det delte (app)-layout (~12 round-trips alene, ~7 i
sekventiel dybde). Proxy'en (`src/proxy.ts:34`) lægger yderligere ét
auth.getUser-kald på HVERT request.

Skøn for logget ind-navigation (40–80 ms pr. round-trip fra Netlify →
Supabase, sekventiel dybde 8–10): **0,5–1,5 s serverarbejde pr.
navigation — varmt.** Koldt: +8 s lambda-opstart. Det ER "appen føles
langsom".

## Flaskehalse, rangeret

### 1. `auth.getUser()` uden memoization — 7–15 HTTP-hop pr. side

`src/lib/auth.ts:18` validerer live mod Supabase Auth ved hvert kald og
er IKKE wrappet i React `cache()`. Hver action betaler sit eget hop.
/kalender betaler det 14×; /mine-planter betaler 9 auth-hop for 3
queries. **Auth-trafik ≈ datatrafik.**

### 2. En database-WRITE kører i layoutet på hver eneste navigation

`components/layout/topbar.tsx:16` → `actions/notifications.ts:61` →
`.rpc('sync_task_reminders')` — læser profiles, looper et
calendar_tasks⋈plants_v2-join og INSERT'er i notifications. Kører på
alle 12 app-ruter ved hver render, og blokerer enhver fremtidig caching
af skallen.

### 3. Nul caching + alt er force-dynamic → 8,4 s kold start på live

Ingen `unstable_cache`, ingen React `cache()`, ingen `revalidate` i hele
src/. 30 af 30 ikke-statiske sider har `force-dynamic` (redundant —
`cookies()` i supabase-klienten tvinger det allerede). HTML serveres med
`no-store`, så Netlify CDN cacher intet; hver sideåbning = lambda.
Statisk indhold (guide-biblioteket!) re-rendres pr. request.

### 4. Samme tabeller hentes 2–3× pr. sideåbning

profiles ×3 (layout, weather, havebog) · plants_v2 ×3 (nav-tæller,
mine-planter, havebog/kalender-enrich) · inventory_items ×2 ·
calendar_tasks ×2 (nav-state tæller rækker, som siden alligevel henter i
fuld længde). Layout og side deler ingen fetches.

### 5. Waterfalls gemt inde i "parallelle" grene

- `froebank.ts:102→117` (inventory → seed_counts, på 4 af 5 ruter)
- `havekalender.ts:102→111→78` (tasks → plantenavne)
- `aarshjul.ts:93→101` (general tasks → hidden ids)
- `weather.ts:87→100` (auth → profiles → Open-Meteo, 3 dyb — blokerer
  hele /kalenders Promise.all)
- `/` har desuden en eksplicit barriere i `page.tsx:75`: 8 queries i to
  serielle bølger, og bølge 2 genhenter bølge 1's tabeller.

### 6. /guides sender 300 kB gzip / 722 kB HTML

Hele det statiske bibliotek (171 guides) inlines i hvert svar — og DB'ens
`guides`-query (select *) hentes parallelt, men resultatet smides
stort set væk (`page.tsx:58` bruger IMPORTED_GUIDES).

### 7. Billeder: cache-headers + hero-vægt

`/images/*` serveres med `max-age=0, must-revalidate` → telefonen
revaliderer hvert billede ved hvert besøg. Måneds-hero er stadig en
570 kB PNG (hero-august-foto.png). JS-chunks er derimod korrekt
`immutable`.

### 8. Ubegrænsede queries

`havebog.ts:612` henter HELE plant_logs_v2-historikken inkl. image_urls
uden `.limit()` — vokser ubegrænset med kontoens alder.

### Frikendt

- **Indhold**: 171 guides er intet problem i sig selv (men leveringen er, jf. #6).
- **AI**: nul Anthropic-kald ved render — alle 5 call-sites er interaktion.
- **Klient-fetches on mount**: ingen på de 5 hovedruter.
- **Supabase-instansens størrelse / økonomi**: intet tegn på at det er flaskehalsen.

## Fix-plan og status

| # | Fix | Status |
|---|---|---|
| 1 | Wrap `getCurrentUser` + `createClient` i React `cache()` | **GJORT 4/8** (d3861df) — 1 auth-hop pr. request i stedet for 7–15 |
| 2 | `sync_task_reminders` ud af render | **GJORT 4/8** — klient-fyret fra NotificationBell, 30 min localStorage-throttle |
| 3 | Del profiles-fetch via `cache()` på `getProfile` | **GJORT 4/8** — layout + begge vejr-funktioner deler nu ét kald (×3 → ×1) |
| 4 | Waterfalls parallelliseret (froebank, havekalender, aarshjul, `/`-barrieren) | **GJORT 4/8** — vejr-kæden kollapsede via #3 |
| 5 | Cache-headers på `/images/*` + `/icons/*` (7 dage + SWR, bevidst ikke immutable pga. in-place-reshoots) | **GJORT 4/8** — verificér på live efter deploy |
| 6 | /guides: DB-query der smides væk + 300 kB HTML (pagineret/opdelt bibliotek) | UDESTÅR — rører produktadfærd (isDemo-semantik: logget ind uden guides ser demo-bibliotek), tages med Anna |
| 7 | `.limit(1000)` på plant_logs_v2 | **GJORT 4/8** |
| 8 | Genbesøg force-dynamic: statiske/ISR-kandidater (guides, forvandlinger) → CDN-cache mod kold-start | UDESTÅR — størst tilbageværende gevinst (8,4 s kold start) |
| 9 | next/image / WebP på måneds-heroes (570 kB PNG) | UDESTÅR |
| 10 | plants_v2/calendar_tasks-dubletter mellem nav-state-counts og siderne | UDESTÅR (lavere prioritet efter #1) |

## Tre cache-begreber — bland dem ikke sammen

Fix #1/#3 bruger React `cache()`. Det er **request-memoisering**: samme
opslag genbruges inden for ÉN render af ÉT request — og intet andet.
Hold de tre lag adskilt, når nogen læser "cached" i dette dokument:

1. **Request-memoisering** (React `cache()`) — fjerner dubletter i én
   sideåbning. GJORT for auth/klient/profil. Løser IKKE kold start.
2. **Data-cache** (`unstable_cache`/`revalidate` på queries) — genbruger
   kontrollerede resultater MELLEM requests. Findes stadig ikke i appen
   (kun Open-Meteo-fetches, 30 min).
3. **CDN/ISR** — serverfunktionen startes slet ikke; CDN'en svarer.
   Findes ikke endnu. Det er DETTE lag, der dræber 8,4 s-koldstarten
   (fix #8). Koldstarten er altså IKKE løst endnu.

## Påmindelses-sync på klienten — kanttilfælde (verificeret 4/8)

- **Flere faner**: throttle-timestampen bor i localStorage (delt på
  tværs af faner) og sættes FØR kaldet — første fane vinder, resten
  skipper. Race-vinduet på få ms er ufarligt, se næste punkt.
- **Samtidige kald er idempotente**: RPC'en indsætter via `dedup_key` +
  `INSERT … ON CONFLICT DO NOTHING` (migration 00059) — race-sikkert.
- **Fane lukkes hurtigt / kaldet fejler**: timestampen er allerede sat,
  så næste forsøg er først efter 30 min. Bevidst trade-off: påmindelser
  er dags-kadence, og alternativet (sæt timestamp efter succes) åbner
  for flerfane-stampede. Ingen retry-loops: ét skud pr. vindue, fejl
  sluges både server-side (try/catch i actionen) og client-side (.catch).
- **Anonym/demo udløser ingen writes**: NotificationBell rendres kun når
  `profile` findes (topbar.tsx), og `syncTaskReminders` returnerer tidligt
  uden bruger. RLS ligger bagved som sidste værn.
- **Dev StrictMode dobbelt-effect**: andet run ser den friske timestamp
  og skipper — ingen dobbeltkald.

## Måleprotokol — logget ind på live (Annas del efter deploy)

Samme scenarier før/efter, mobil på almindelig forbindelse:
1. Første åbning efter pause (koldt) — er den stadig ~8 s?
2. Havebog → Kalender → Frøbank → plante/guide → tilbage.
3. Mærkbart: føles navigationen lettere end i går?
Teknisk (DevTools/Netlify function log): TTFB pr. route, antal
requests mod Supabase (`/auth/v1/user`-kald bør være ~1 pr. navigation,
før 7–15), samlet overført data.

## Fase 2 (4/8, commit c0a1aee): streaming + første statiske sider

Kontekst: Annas logget-ind-test efter fase 1 = "stadig langsom". Diagnose:
hvert eneste fanetryk kostede stadig en fuld dynamisk server-render
(Next-default router-cache = 0 s), og første byte ventede på badge-,
vejr- og tæller-queries.

Gjort:
- **Router-cache** (`staleTimes: dynamic 30 s / static 300 s`): fane-hop
  og tilbage-navigation rendrer fra klientens cache. Server actions
  revaliderer, så mutationer slår igennem. Dette er sandsynligvis den
  største FØLTE forbedring for navigation.
- **Skallen streames**: ulæste-badge, vejrlinje og bundnav-tæller er
  Suspense-øer — første byte venter ikke på dem.
- **Guide-artiklens Din have-sektion** = async Suspense-ø (markup 1:1);
  brugerens frøbank/planter blokerer ikke artiklen.
- **/guides/teknik statisk** (○, CDN, ingen serverfunktion) — første
  guide-side uden lambda.
- getNavState: død plants_v2-count fjernet (aftager var uimporteret
  Sidebar).

Arkitektur-fund der blokerer fuld ISR på /guides/[id]: ruten hoster BÅDE
de 171 statiske redaktionelle guides OG brugerens private/AI-guides
(RLS, kræver cookies). Blanket force-static ville knække private guides.
Fuld løsning kræver URL-adskillelse (fx /guides/mine/[id]) — rører
froebank/notifikations-links → Annas beslutning. Streaming-øen er
mellemtrinnet, der virker uden URL-ændringer.

Testnote: automatiseret browser-QA af streamede sektioner er upålidelig —
React 19.2 batcher segment-reveal via requestAnimationFrame, som
throttles i baggrunds-/headless-paner (verificeret: samme adfærd på
gammelt deploy). DOM-checks bekræfter korrekthed; visuel bekræftelse
skal ske i en rigtig browser.

## Fase 3 (5/8, commit 9fa5540): rute-split + statisk guide-univers

Annas to produktbeslutninger implementeret:

**1. Privat ↔ redaktionel rute-split.** `/guides/[id]` er nu KUN
redaktionelle guides — force-static, alle slugs prerendered, revalidate
1 døgn. Egne/AI-guides bor på `/guides/mine/[id]` (dynamisk, login + RLS).
Gamle `/guides/<uuid>`-links 308-redirectes af proxyen. Alle interne
link-steder bruger `guideHref()` (uuid ⇒ mine).

**2. Biblioteket: redaktionelt for alle + progressivt.** Demo-fallback-
semantikken er væk — logget ind uden egne guides ser det almindelige
bibliotek. Artikel-sektionerne sendes ikke længere med til klienten:
**/guides 188 → 42,5 kB gzip (−77 %)**. Søgeresultater viser 20 +
"Vis N flere" (søgningen matcher hele biblioteket). Personlige sektioner
(I DIN HAVE, Dine egne guides, MINE FRØ) er klient-øer, der kun henter
med auth-cookie.

**Auth-adaptiv skal**: statiske sider bager den anonyme skal ind;
DemoBanner skjules præ-paint via inline cookie-script, topbaren swapper
klient-side til klokke/profil, bundnav-badgen selvopfrisker. Proxyen
springer auth.getUser HELT over uden auth-cookies.

**Resultat (lokal prod)**: 233 statiske sider (før 49); alle guide-ruter
5–10 ms TTFB. Kold åbning af en guide på live = CDN-svar uden lambda og
uden Supabase — det var målet med ISR-fasen.

**Live-verificeret 5/8 efter deploy**: guide-ruterne serveres fra Netlify
Edge (`cache-status: hit`, ttl = 1 døgn) med **80–115 ms TTFB** — uanset
lambda-koldstart og uden ét eneste Supabase-kald. Første besøg pr. rute
efter deploy primer edgen (0,6–1,9 s), derefter er den varm for ALLE
brugere. /guides = 64 kB gzip på live (før 300 kB, −79 %).
uuid-redirect: /guides/&lt;uuid&gt; → 308 → /guides/mine/&lt;uuid&gt; verificeret.

**Trade-offs, bevidste:**
- Build-tid ~1 → ~5 min (233 sider) — koster Netlify build-minutter pr. push.
- Statiske sider viser vejrlinjen o.l. først efter klient-hydrering;
  logget ind-kontroller i topbaren kommer ~100–300 ms efter load på
  guide-sider (anonyme ser ingen forskel).
- Onboarding-gaten (redirect til /onboarding) håndhæves ikke på statiske
  guide-sider — vurderet acceptabelt (læse-indhold).

## Fase 4 (5/8, commit 2872f43): koldstart på forsiden — Annas 13 s-fund

Anna målte 13 s fra URL-indtastning til Havebog i ny fane (logget ind).
Anatomien: kold lambda 6–10 s → FØRST derefter begynder browseren at
hente CSS/JS/fonte/hero (844 kB JS + 299 kB fonte + 557 kB hero-PNG),
serielt oveni. SW frikendt (ingen fetch-interception, ingen cache);
ingen enkeltstående boot-synder i server-bundlen (guides-data 760 kB).

To modtræk:
1. **Streaming-skal på Havebog/Kalender/Frøbank/Planter**: sidens indhold
   bor nu i en async komponent bag Suspense — første byte flusher straks,
   og asset-download kører PARALLELT med serverens DB-arbejde. Målt
   lokalt: /kalender TTFB 150–600 ms → 5–13 ms. Markup/design uændret.
2. **Keep-warm** (netlify/functions/keep-warm.mjs): scheduled ping hvert
   5. minut af / og /kalender — anonymt og nær-gratis (proxy springer
   auth over; anonyme sider springer DB over). Lambdaen når reelt aldrig
   at blive kold i dagtimerne.

Restpost efter fasen: JS-/font-vægten (844 kB JS, 13 fontfiler) og
hero-PNG'en (557 kB) er nu den dominerende del af "fra URL til færdig
side" — det er fix #9 (next/image/WebP) + evt. font-subsetting.

## Fase 5 (5/8): hero-billeder → WebP (−93 %)

De 20 tunge først-visnings-billeder (heroes-maaneder ×13, heroes-sider
×3, weather-pools ×4) konverteret fra 1400px-PNG til 780px-WebP q82
(2× af 390px-rammen): **10,8 MB → 0,8 MB (−93 %)**. August-heroen
557 → 48 kB. Originale PNG'er ligger urørt som kilde/rollback; alle
kodereferencer + manifest peger på .webp. Visuelt verificeret identisk.

UDESTÅR i billed-sporet: plantekort (~400-500 kB/stk) — kræver audit af
DB-lagrede stier (frøkort-foto-præcedens) før omdøbning; fonte (13
filer/299 kB) og JS-bundle-analyse (kalender 2,2 MB) er næste bidder.

## Fase 8 (5/8, commit 74e7950): guide-datasættet ud af klient-JS

JS-audit fandt guides-imported.ts (775 kB kilde, al guideprosa) i
klient-chunks på fire hovedruter via tre uskyldige importe: bibliotek→
guides-demo (kun POPULAERE_EMNER), billed-resolveren (2b-fallback, tre
felter) og froebank-autofill/afledninger (kun quickFacts).

Fix: POPULAERE_EMNER i egen fil; import-guides.ts genererer nu to slanke
indekser — guide-image-index (8 kB) og guide-facts-index (46 kB) — som
resolver hhv. autofill/afledninger bruger. **Regel fremadrettet:
klient-kode må ALDRIG importere guides-imported/guides-demo.**

Målt (ukomprimeret klient-JS): kalender 2.347→1.756 kB (−25 %) ·
frøbank −33 % · planter −33 % · guides −38 %. Autofill funktionelt
verificeret identisk (sort-match/arts-fallback/nul-match).

Sidste JS-post: kalenderens egen 687 kB-chunk (editorial-planner +
12 måneders copy) — kræver dynamic() i et Anna-låst flow, tages separat.

## Fase 6 (5/8, commit 6bbd58f): resolver-webp — kort/arts/frø/makro −72 %

DB-auditten bekræftede mistanken: primary_image_url holder repo-stier
(7 inventory + 7 planter + 106 guides) → omdøbning udelukket. Løsning:
**resolveren foretrækker en .webp-søster, når den findes i manifestet**
(medWebpSibling) — filnavne og DB-stier forbliver urørte, kun det
serverede format opgraderes. Dækker alle resolver-lag + de direkte
primaryImageId-brug (guide-artikel, guide-card, mine-guides, emnekort).

342 filer konverteret (plantekort 640px / arts 780px / frokort 520px
m. alpha / makro 780px): **48,6 → 13,7 MB (−72 %)**. Webp der blev
større end originalen droppes automatisk. Statisk guide-HTML verificeret:
0 gamle formater i img-tags.

Billed-sporet er hermed reelt lukket for de kuraterede biblioteker.
Tilbage: fonte (13 filer/299 kB) og JS-bundle-analyse (kalender 2,2 MB).

## Efter-måling 4/8 (lokal prod, anonym — samme metode)

| Route | TTFB varm FØR | TTFB varm EFTER |
|---|---|---|
| /kalender | 280–390 ms | **150–190 ms** |
| / , /froebank, /mine-planter, /guides | 5–18 ms | uændret (var allerede DB-frie anonymt) |

De store gevinster (#1–#4) kan IKKE måles anonymt — de fjerner 10–15
Supabase-round-trips pr. sideåbning for **logget ind** bruger. Skønnet
effekt på /kalender logget ind: 32 → ~17 round-trips, og sekventiel
dybde markant ned. **Skal verificeres af Anna på live efter deploy**
(hurtigste test: føles navigation mellem Havebog/Kalender/Frøbank
mærkbart lettere?).

QA: tsc + tests + build grønne; /, /froebank, /kalender røgtestet i
browser (demo-tilstand, ingen konsolfejl, låste designs urørte).
