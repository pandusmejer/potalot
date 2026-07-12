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

### 1 · Prøv næste år (inspirer-mig.tsx) — LÅST design
- **"Vis et nyt forslag"** = `<button>` uden handler. → Byg **forslags-rotation**
  (skift til næste kuraterede forslag; kræver en forslags-motor der trækker på
  frøbank/planter/sæson/historik).
- **Basilikum / Peberfrugt** (de små forslag) = rene `<div>`, ikke klikbare.
  → Beslut: skal hvert forslag linke til sortens **frøkort/guide** (fx
  `/froebank/[id]` eller guide-detalje)? Kræver at forslaget bærer et mål-id.
- **"Flere forslag"** → `/froebank` (VIRKER allerede).
- Data: `InspirerForslag` er demo. → Ægte **deriver** (hvad skal brugeren prøve
  næste år, ud fra hvad de dyrkede i år).

### 2 · Måske du også vil prøve (maaske-du-ogsaa.tsx) — LÅST design
- **"Se hvordan"** → `/havebog/forvandlinger` (VIRKER allerede).
- Data: bruger `InspirerForslag.sekundaer` (demo). → Ægte deriver (næste skridt
  ud fra afgrøder, fx "du dyrker tomater → gem frø").

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

### 4 · Næste projekt (projekter.tsx)
- **"Åbn projekt"** → `/kalender` (midlertidigt). → Skal pege på et ægte
  **projekt/idé-system** (idéboard/gemt forvandling/diktafon→projekt).
- **Insekthotel-FOTO mangler** (hammer-pladsholder nu) → læg foto i
  `public/images/havebog/naeste-projekt-*.jpg`.
- Gating: vis KUN ved ægte projekt-intention.

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
- **Forslags-motoren** (kort 1+2) er den største fælles blocker.
- Fjern preview-ruten **`/havebog-preview`** før produktion.
- Klikbare enkelt-forslag (kort 1) kræver et mål-id på hvert forslag i data.
