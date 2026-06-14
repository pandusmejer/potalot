# POTALOT VISUAL SYSTEM V1

> Status: V1 (14. juni 2026). Foundational. Læs FØR ethvert redesign.
> Kun design-DNA: spacing, typografi, farver, cards, billedhierarki,
> sektionstyper, CTA'er. **Ikke** features. **Ikke** indhold. **Ikke** logik.
>
> Den ene sætning: **"To registre, én familie."**

## Diagnosen (audit 14. juni 2026)

En kode-audit af de fem sektioner viste, at appen i dag er **to design-
systemer syet sammen**:

- **"Produkt-kort"-familien** (Frøbank, Planter, Kalender-månedskort):
  `radius 32px`, skygge `0 20px 44px rgba(26,34,22,0.18)`, aspect `4/5`,
  foto-som-baggrund, Manrope, papirpanel med `blur(2px)`. Sammenhængende.
- **"Redaktionel"-familien** (Havebog, Guides, Kalender-opgavekort): flad/
  ingen skygge, Cormorant, foto-ovenpå eller intet foto, magasin-tone.

**Det gode:** de to familier flugter med sektionernes ROLLER (jf.
`sektion-roller.md`): Havebog + Guides er redaktionelle; Frøbank + Planter +
Kalender er værktøjer. **To stemmer er meningen — ikke en fejl.**

**Problemet:** de DELTE primitiver divergerer. Samme handling ser forskellig
ud fem steder: fire knap-farver, fire knap-radier, fem spacing-skalaer, fem
section-header-mønstre, hardcodede farver i Guides (`green-700`). Det er DET,
der får appen til at føles som fem websites.

**Løsningen:** lås de delte primitiver, så de er identiske overalt — og
definér de to registre præcist, så de er **søskende, ikke fremmede**.

---

## De to registre

| | **Redaktionelt register** | **Værktøjs-register** |
|---|---|---|
| Sektioner | Havebog, Guides | Frøbank, Planter, Kalender |
| Rolle | minder, læring, magasin | samling, pleje, timing |
| Display-font | **Cormorant** (serif) | **Gabarito**/Manrope (sans) |
| Stemning | rolig, fortællende, luftig | konkret, kompetent, tæt |
| Foto | foto-ovenpå / full-bleed bleed | foto-som-kort-baggrund |
| Rytme | luftig (lg) | tæt (md) |

**Alt herunder (§1–§7) er DELT mellem begge registre** med mindre andet står.
Registret bestemmer kun: display-font, fotobrug, rytme-trin. Resten er ÉN
familie.

## §1 Spacing & rytme

Audit fandt: `space-y-6 / 7 / 10 / 12 / 20 / 28` i flæng. Lås til én skala
(4px-grid, Tailwind-trin):

```
Sektions-rytme (mellem hovedsektioner på en side):
  tæt    space-y-8   (32px)   — lister, tætte værktøjsflader
  md     space-y-12  (48px)   — VÆRKTØJS-register default
  lg     space-y-20  (80px)   — REDAKTIONELT register default
  xl     space-y-28  (112px)  — kun Havebog-kapitelskift
Intern blok-rytme: 4 / 8 / 12 / 16 / 24 (gap + padding)
```

- **Container:** indhold `max-w-[680px]` (læsbar enkeltspalte, = Planters
  `max-w-3xl`-ånd) på værktøjssider; redaktionelt må bryde bredere/full-bleed.
- **Side-padding:** `px-4` (16px) mobil-standard. Full-bleed hero: `-mx-4`.
- Ingen sektion vælger sin egen rytme ad hoc; vælg ét trin fra skalaen.

## §2 Typografi

To display-fonts (én pr. register), én workhorse, ÉN delt eyebrow.

```
REDAKTIONELT (Havebog, Guides)
  Titel:     Cormorant, 500, clamp(30px,7vw,44px), line-height 1.05
  Hero:      Cormorant, 500–600, clamp(40px,8vw,62px), line-height 0.9
  Italic-undertekst: Cormorant italic (latin, summary, dato-poesi)

VÆRKTØJ (Frøbank, Planter, Kalender)
  Titel:     Gabarito (display) / Manrope 800, clamp(26px,6vw,34px), lh 1.05
  Kort-navn: Manrope 800, 30px (frøkort/plantekort-overskrift)

DELT
  Eyebrow:   Manrope, 11px, 700, letterSpacing 0.22em, UPPERCASE,
             color rgba(36,48,31,0.55)   ← ÉN spec overalt
  Brødtekst: Manrope, 14px, 400–500, color var(--foreground)/muted
  Fakta/små: Manrope, 12–13px, 600
```

> Afstemning: Frøbank-heroens **Cormorant** skal til værktøjs-display
> (Gabarito/Manrope 800) — den hører til værktøjsregistret. (Verificér at
> Gabarito faktisk er wired i layout.tsx; ellers Manrope 800 indtil da.)
> Eyebrows er i dag 11px/0.24em (Havebog) vs 12px/0.22em (Frøbank) → lås til
> 11px/0.22em.

## §3 Farver & tokens

**Regel: ingen hardcodede farver til system-elementer. Brug CSS-tokens.**
(Audit fandt `green-700`, `green-50/900` hardcodet i Guides — skal væk.)

```
Kerne (fra globals.css):
  --primary            #506834  (forårsgrøn — primær handling, badges)
  --primary-foreground #F7F8EF  (creme)
  --foreground         #24301F  (mørk skovgrøn — tekst)
  --secondary          #E6EDD2  (lys gul-grøn — sekundær flade)
  --background          creme/hvid
Materiale-konstanter (delt):
  Papir-panel:   rgba(246,243,235,0.94) + blur(2px)
  Mørk glas:     rgba(36,48,31,0.34–0.72) + blur(2–4px)  (badges på foto)
  Mørk sage CTA: #3B4A2F  → ERSTAT med --primary medmindre på lyst foto
```

Botaniske accenter (lav/ochre/terracotta til instrumenter) defineres ét sted
og genbruges (jf. seed-count-ring: ivory/#C89A35/#B86645 — aldrig rød/neon).

## §4 Card-system

Kort defineres efter **brug**, ikke efter sektion. Tre niveauer:

```
PRODUKT-KORT  (frøkort, plantekort, månedskort — "objektet du ejer")
  radius 32px · aspect 4/5 · skygge 0 20px 44px rgba(26,34,22,0.18)
  foto-som-baggrund · papirpanel-bund (blur 2px) · Manrope-overlay
  → ÉN komponent-DNA. Frø/Planter/Kalender-måned ER allerede ens. Behold.

INDHOLDS-KORT (guide-kort, editorial bleed)
  radius 24px · INGEN slagskygge (kun 1px border rgba(36,48,31,0.10))
  foto-ovenpå + cremekort under (overlap via -mt) · Cormorant-titel
  → lås radius til 24px (i dag 28/22/16 i flæng).

UTILITY  (opgave-rækker, chips, lister)
  radius 12px (= --radius) · flad · venstre-accent-border 2px efter behov
```

Regel: et kort vælger ÉT niveau. Ingen mellemting (ingen `green-700`-badge,
ingen 16px-redaktionelt-kort).

## §5 Billedhierarki

Roller (jf. `resolve-potalot-image.ts`), fra art til indkøb:

```
species-hero  → /images/arts/<art>.jpg        (hele arten, magasin-hero)
variety-hero  → /images/plantekort/<slug>.jpg (sorten = sorts-foto i guides)
plant-card    → /images/plantekort/<slug>.jpg (samme fil, Mine planter)
seed-card     → /images/frokort/<slug>.png    (indkøbskortet / frøkort)
macro         → POTALOT_IMAGE_SETS makro[]     (atmosfærisk lag, kun kuraterет)
```

**Foto-brug efter register:**
- Værktøj: **foto-som-baggrund** i produktkort + scrim + overlay-tekst.
- Redaktionelt: **foto-ovenpå/full-bleed bleed** + tekst ved siden/under.

**Delt scrim-formel** (læsbarhed for hvid tekst — lås intensiteten):
```
top-scrim (overlay-titel på foto):
  linear-gradient(180deg, rgba(18,14,10,0.40) 0%, rgba(18,14,10,0.10) 55%, transparent 100%)
```
(I dag 0.34 Frøbank vs 0.46 Planter vs 0.62 Havebog → lås til ét udtryk,
0.40 som standard; tillad +0.06 på lyse/low-contrast fotos.)

## §6 Sektionstyper

**Én delt `SectionHeader`** (i dag fem ad-hoc-mønstre):
```
<SectionHeader eyebrow="…" title="…" />
  eyebrow = DELT eyebrow-spec (§2)
  title   = registrets display-font (Cormorant vs Gabarito/Manrope)
  rytme   = 8–12px eyebrow→titel, derefter §1-blokrytme
```

**Baggrund:**
- Standard: app-creme/hvid.
- Redaktionelt må vælge atmosfærisk baggrund (Guides' `#EAE6D8` + maskeret
  makrolag) — men som BEVIDST register-markør, ikke pr. side-luner.
- Ingen full-bleed farveblok uden formål.

## §7 CTA'er

**Ét knap-system.** (Audit fandt 4 farver + 4 radier.)

```
PRIMÆR (på lys flade)
  pill 999px · bg --primary (#506834) · tekst --primary-foreground
  padding 12px 22px · Manrope 14px/600 · ingen border
PRIMÆR PÅ FOTO/MØRK HERO
  pill 999px · "mørk glas" eller creme-flade · tekst #24301F/creme
  (Frøbanks lyse knap hører her — KUN på foto, ikke generelt)
SEKUNDÆR / OUTLINE
  pill 999px · transparent · 1px border rgba(36,48,31,0.18) · tekst --foreground
INLINE-LINK
  --primary, underline offset 4px
```

Radius er **altid pill (999px)** for handlinger (i dag 999/11/12px i flæng).
Chips/badges må bruge 999px små. Knap-FARVE kommer altid fra tokens.

## §8 Landmarks (ét ikonisk objekt pr. rum)

Hvert hovedområde skal eje ÉT genkendeligt objekt (Annas dom):

```
Havebog          → Dagtæller       (DAG 098 af din sæson)
Tal til din have → Mikrofon
Frøbank          → Frøkort
Kalender         → Årshjul
Planter          → Fokus-strip
Guides           → Editorial hero
```

Landmarket er sektionens ansigt — det man husker med lukkede øjne. Det skal
være visuelt dominant og konsekvent, ikke ét blandt mange ens kort.

## §9 Afstemnings-backlog (kode → system)

Når systemet skal håndhæves i koden, i prioriteret rækkefølge:
1. **CTA'er:** ét knap-system; fjern de fire farve/radius-varianter +
   hardcodet `#3B4A2F`/`green-700`.
2. **Eyebrow:** én delt `SectionHeader` + eyebrow-spec; ryd de fem ad-hoc.
3. **Spacing:** lås sektions-rytmen til §1-skalaen pr. register.
4. **Indholds-kort:** lås guide-kort-radius til 24px; fjern 16/22/28-mix.
5. **Scrim:** lås til §5-formlen.
6. **Frøbank-hero:** Cormorant → værktøjs-display (Gabarito/Manrope 800).
7. **Farver:** erstat alle hardcodede med tokens.

Dette er en SEPARAT opgave (kode-ændring) — V1 her er kun DNA'et. Intet i
koden ændres uden en eksplicit afstemnings-runde.

## Relaterede dokumenter
- `Docs/design-system/potalot.md` — overordnet filosofi + 3-lags-arkitektur
- `Docs/design-system/sektion-roller.md` — hvad hvert rum ER
- `Docs/design-system/havebog.md` — Havebog-manifest
- `Docs/design-system/guides.md` — guide-systemet
