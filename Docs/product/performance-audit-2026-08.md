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
