# Havebog — nederste kort: interaktions- & wiring-backlog

**Status:** ARKIVERET / afventer. Tages FØRST når alle 8 nederste Havebog-kort
er færdig-DESIGNET og låst. Dette er "gør kortene levende"-arbejdet — data,
klik, motorer — adskilt fra det visuelle design med vilje.

Se også: [havebog-status-audit.md](./havebog-status-audit.md) (ærlig status pr.
rum) og memory `proev_naeste_aar_laast` / `havebog_sprint`.

---

## Princip
De nederste kort er i dag **visuelle prototyper** på demo-data og **gated
`false` for indloggede** (ærligheds-reglen) — en rigtig bruger møder dem først,
når deres kilde/motor findes. Design låses nu; wiring nedenfor er næste fase.

---

## Pr. kort — hvad mangler at blive levende

### 1 · Prøv næste år (inspirer-mig.tsx) — LÅST · MOTOR BYGGET + WIRED
**Rettelse 12/7:** motoren FINDES og er wired (var fejlagtigt "prototype").
- Motor: **byggProevNaesteAar** (`src/lib/havebog-proev-naeste-aar.ts`), testet
  (`scripts/test-proev-naeste-aar.ts`, 7/7). Prioritet: forlæng>hul>frøavl>
  robusthed>køkken>fallback. Wired i `getHavebogData` → `inspirerForslag` →
  kortet (indlogget bruger `data.inspirerForslag`, gated på non-null).
- **UDESTÅENDE (demo-only endnu):** de små foto-forslag (Basilikum/Peberfrugt)
  produceres IKKE af motoren → vises kun i demo; motorens output mangler et
  `forslag[]`-felt (+ mål-id hvis de skal linke til frøkort/guide). Og
  **"Vis et nyt forslag"**-rotation er stadig en død knap (ikke wired).
- **"Flere forslag"** → `/froebank` (virker).

### 2 · Måske du også vil prøve (maaske-du-ogsaa.tsx) — LÅST · MOTOR-BACKED
**Rettelse 12/7:** motor-backed (var fejlagtigt "prototype").
- Bruger `inspirerForslag.sekundaer` fra **samme byggProevNaesteAar**-motor
  ("Hul"-reglen producerer et sekundært forslag). Wired + gated på sekundaer
  non-null for indloggede. NB: fotoet er et fast havebog-asset, ikke fra motoren.
- **"Se hvordan"** → `/havebog/forvandlinger` (virker).

### 3 · På denne dag (paa-denne-dag.tsx) — overlay + destination LÅST
**Produktregel:** "På denne dag" er ALTID et tilbageblik MED kilde — aldrig et
generisk stemningskort. Kræver: sourceType, sourceId, date, title, text, image,
href. Uden href/kilde skjules modulet for rigtige brugere (kuratoren gater på
`onThisDay[0].href`); demo bruger mock-href.

**Læsbarhed (LÅST):** fast overlay-system ovenpå fotoet (mørk bund- + venstre-
gradient + let global scrim) — tekst læsbar uanset brugerens foto, ingen pixel-
analyse. `overlayStrength="strong"` findes til for lyse fotos.

**Destination pr. sourceType:**
- A. plante-log → `/mine-planter/[plantId]` (plantens timeline) — **WIRET NU**
  (deriveren sætter href fra `plant_id`).
- B. Havebog-minde → `/havebog/minder/[id]` eller `/havebog/arkiv?minde=[id]`
  — **rute findes ikke endnu**.
- C. arkiveret plante/sæson → `/havebog/arkiv/[id]` — **rute findes ikke endnu**.
- D. ingen ægte destination → CTA "Se minde" fører til nærmeste eksisterende
  log-/arkivvisning; ingen død CTA.

CTA "Se minde" + hele kortet klikbart (ægte `<Link>`, aria-label) = LÅST.
Mangler: minde-/arkiv-ruter (B/C) + evt. `?log=[logId]` på plante-href.

### 4 · Næste projekt (projekter.tsx) — 3 visual states LÅST
Systemisk: kortet afhænger ALDRIG af et perfekt brugerfoto. Tre states
(teksten bærer altid): **photo** (kun ved EGNET/kurateret foto), **soft-
illustration** (DEFAULT — kategori-line-ikon), **color-field** (fallback).
- **Konservativ foto-regel (deriver-TODO):** brugerupload med ukendt kvalitet
  må IKKE bruges som stort baggrundsfoto i Havebog → vis soft-illustration;
  foto kun på projektets egen detaljeside. Deriveren sætter kun `foto` når
  det er vurderet egnet (aspect/crop/ikke-screenshot/ikke-for-lille).
- **Kilde → copy + CTA:** ideaBoard/calendarTask/transformation/voiceNote/
  manualProject bestemmer kontekst-linjen; CTA normaliseret (opgave/optagelse/
  projekt). Deriveren skal sætte `kilde` + `kategori` + `kontekst`.
- **"Åbn projekt"** → `/kalender` (midlertidigt). → ægte projekt/idé-system
  (idéboard/kalender/gemt forvandling/diktafon→projekt/manuelt).
- Gating: vis KUN ved ægte, bruger-initieret projekt-intention; ellers skjul.

### 5 · Mange læser om nu (populaert-lige-nu.tsx)
- Emne-kort → `/guides` (virker). → HÅRDT gated: kræver ægte **community-data**
  (ingen opfundne tal/trending). Lever kun som prototype indtil da.

### 6 · Din status som dyrker (dyrkerstatus.tsx)
- **"Se hele din profil"** → `/profil` (virker). → Bygger på ægte deriver
  (`byggDyrkerstatus`); verificér gating for indloggede.

### 7 · Dine kompetencer (dyrkerkompetencer.tsx)
- **"Se alle kompetencer"** → `/profil` (virker). → Ægte deriver
  (`byggKompetencer`); Profil-siden skal have det fulde overblik at linke til.

### 8 · Første gange (bedrifter.tsx)
- **"Se alle milepæle"** → `/profil` (virker). → Mangler **deriver** for
  beviselige førster (første høst/drivhus/dahlia/såning) fra logs. Demo indtil da.

---

## Tværgående
- **Profil-siden** skal kunne rumme det fulde overblik som kort 6/7/8 linker til.
- **Forslags-motoren (kort 1+2) ER bygget + wired** (byggProevNaesteAar). Rest:
  giv motorens output et `forslag[]`-felt (de små foto-forslag i kort 1) + wire
  "Vis et nyt forslag"-rotationen. Klikbare enkelt-forslag kræver et mål-id.
- **Manglende motorer (prototyper):** kort 4 (projekt-intention fra idéboard/
  kalender/forvandling/diktafon), kort 5 (sæson-kuratering), kort 8 (milepæls-
  deriver: beviselige "førster" fra logs).
- **Preview-rute — FØR merge til main:** flyt `/havebog-preview` til
  `/admin/qa/havebog-preview` ELLER gate bag admin/auth. Ikke offentlig i prod.
  (Beholdt offentlig nu, mens vi designer.)
- **Drivhus soft glyph (kort 8):** BESLUTNING = A (malet PNG i soft glyph-
  familien). IKKE mono-SVG, IKKE skift hele sættet. Nuværende `drivhus.png` er
  accepteret midlertidig; endelig version skal være SIMPLERE: enkel drivhus-
  silhuet (1 tagform, 2 sidefelter, evt. 1 central åbning), 1-2 små spirer, få/
  ingen ruder, ingen dør-knop/potter, blød akvarel i støvet oliven/creme,
  transparent, læsbar ved 28-40px. Drop ind som `drivhus.png` → auto-opdateres.
