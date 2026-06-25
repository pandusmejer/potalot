# Frøbank folder-stack — handoff til Codex

Mål med dette dokument: alt en frisk agent skal vide for at bygge videre på
**frøbankens mappe-stak** (`/froebank`) uden at gentage fejl eller bryde låste
beslutninger. Læs det HELE før du rører koden.

---

## 0. Hurtig kontekst

PotAlot, Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, Supabase (demo
mode), dansk UI. Frøbanken viser brugerens frø som en **stak af arkivmapper**:
en åben "intro-mappe" (Salat) øverst, derefter sammenfoldede (collapsed) mapper
man kan folde ud (expand) én ad gangen, og til sidst tomme mapper der fader ud.

Metaforen er FYSISKE MANILA-MAPPER der glider ned bag hinanden — ikke en liste
af kort. Det er den mentale model alt skal tjene.

---

## 1. Filer

| Fil | Rolle |
|-----|-------|
| `src/components/froebank/froebank-browser.tsx` | `'use client'` wrapper: filter/søge-state + layout. Rendrer `SeedBankFolderPanel` + (pulled up) `InventoryArchiveStack`. |
| `src/components/froebank/inventory-archive-stack.tsx` | **STAKKEN. Her bor 95% af arbejdet.** HeroFolder + StackCascade + StackFolder + TailFolder + `buildStackFolderPath` + alle konstanter. |
| `src/components/froebank/inventory-card.tsx` | Det delte frøkort (`InventoryCard`). Bruges af BÅDE hero, stak og andre sider. |
| `src/components/froebank/seed-bank-folder-panel.tsx` | Den grønne "Din Frøbank"-kontrolmappe (søg/filter/CTA). **LÅST — rør ikke.** |
| `src/components/froebank/filter-bottom-sheet.tsx` | Filter-bottom-sheet. |
| `src/lib/plant-color.ts` | `plantColor(name, variety)` → farveblokke pr. art. |
| `src/lib/demo.ts` | `DEMO_USER_ID`; demo-inventory leveres som `inventory`-prop. |

Demodata: 8 frø → `inventory[0]` = Salat (hero), resten (7) = Tomat, Agurk,
Chili, Peberfrugt (California Wonder), Peberfrugt (Corno di Toro Rosso), Squash,
Stangbønne.

---

## 2. Komponent-model (oppefra og ned)

```
FroebankBrowser
 ├─ SeedBankFolderPanel            (grøn kontrolmappe — LÅST)
 └─ <div marginTop:-145 zIndex:10> (trækker hele arkivet op under panelet)
     └─ InventoryArchiveStack
         ├─ HeroFolder             (Salat — åben intro-mappe, ALTID fuld)
         └─ <div marginTop:-9 zIndex:2>   (hero→cascade overlap ~9px)
             └─ StackCascade
                 ├─ StackFolder ×7  (collapsed default, tap → expand)
                 └─ tail-wrapper
                     └─ TailFolder ×4  (tomme, fader ud)
```

- **Tom inventory** (`inventory.length === 0`): faldback til en gammel
  `ArchiveContainer`/`FolderLayer`/`buildFolderPath` (12 tomme slots). Den kode
  er KUN til tom-tilstand; demo har altid data. Lad den ligge.

---

## 3. Den ikke-indlysende clip-path-teknik (læs dette først)

Hver mappe-shell er en `<div>` med `clip-path: path('…')` (px-koordinater).
To konsekvenser styrer ALT i denne fil:

1. **clip-path klipper `box-shadow`.** Derfor:
   - YDRE dropskygge → `filter: drop-shadow(...)` på en **wrapper** (uden clip).
   - INDRE highlight/kant → `box-shadow: inset …` på den **clippede** div.
   - Mønsteret går igen i HeroFolder, StackFolder og TailFolder.
2. **clip-path animerer kun mellem paths med IDENTISK kommando-struktur.**
   `buildStackFolderPath` udsender derfor ALTID samme rækkefølge af M/L/Q/C/Z —
   kun tal-værdierne skifter (højde, skulderbredde/-center, bund-radius). Collapsed→
   expanded morpher blødt fordi strukturen er ens. **Lav ikke en gren der dropper
   eller tilføjer kommandoer** — så snapper animationen.

Kortet (`InventoryCard`) ligger i et SEPARAT clippet lag (uden filter), så dets
`backdrop-filter`-blur i info-panelet virker.

---

## 4. `buildStackFolderPath(W, H, shoulderWidth, shoulderCenterFrac, roundedBottom)`

Tegner mappe-silhuetten i px (0,0 = øverste venstre hjørne af shell-div'en):

- **Top**: lav top-kant ved `y = STACK_SHOULDER_DROP (14)` med en hævet, afrundet
  **tab** (skulder) centreret ved `shoulderCenterFrac × W`, bred `shoulderWidth`,
  der rejser sig til `y=0` via bløde S-kurver (`STACK_SHOULDER_RISE = 16`).
- **Top-hjørner**: altid `STACK_CORNER = 28`.
- **Bund**: `roundedBottom=false` → flad/ÅBEN bund (BR=0). `true` → 28px afrundet.
- Skulderens fald/stigning + geometri er **fast/identisk** for alle mapper.
  Variation må KUN ske via `shoulderWidth`, `shoulderCenter`, `W` og papirfarve.

HeroFolder har sin EGEN path (`buildHeroFolderPath`) — den oprindelige creme-
overgangsmappes koordinater, skaleret. Den må ikke ændres (se §6).

---

## 5. Geometri & konstanter (aktuelle, låste værdier)

Alle i `inventory-archive-stack.tsx`.

### HeroFolder (Salat) — LÅST
```
HERO_FOLDER_WIDTH = 404      (SVG-bredde; synlig form ≈ 368 ≈ grøn hovedmappe, ~1mm smallere)
HERO_CARD_INSET_L = 33, HERO_CARD_INSET_R = 35
HERO_CARD_TOP = 24           (kort-top under skulder)
HERO_BOTTOM_PAPER = 36       (synlig creme under kortet → ~27px + Tomats 9px overlap)
HERO_BOTTOM_RADIUS = 30      (afrundet bund — hero er en AFSLUTTET mappe)
HERO_FOLDER_TONE = '#EFE7D8'
Salat-kort overstyrer InventoryCard: cardRadius 24, info-panel 22/24, egne skygger.
```

### Cascade-mapper (Tomat…Stangbønne)
```
STACK_WIDTH_INSET = 22       → ALLE mapper: width = containerWidth − 22 (næsten ens)
STACK_CARD_INSET_X = 12      (synlig folder-side v/h)
STACK_CARD_TOP_COLLAPSED = 24,  STACK_CARD_TOP_EXPANDED = 28   (kort-top under skulder)
STACK_BOTTOM_PAPER = 34      (synlig creme under kortet i EXPANDED)
STACK_COLLAPSED_H = 150      (collapsed shell-højde)
STACK_COLLAPSED_OVERLAP = 18 (collapsed: næste mappe dækker forriges åbne bund)
STACK_EXPANDED_OVERLAP = 10  (expanded: næste mappe kun 10px ind → åbent kort får luft)
STACK_CORNER = 28, STACK_SHOULDER_DROP = 14, STACK_SHOULDER_RISE = 16
STACK_ANIM = '260ms cubic-bezier(0.22, 1, 0.36, 1)'
```

`FOLDER_SHELLS` (cyklet med `i % 7`; alle samme bredde, kun skulder/farve/xOffset varierer):
```
Tomat       tone #EEE8DA  shoulderWidth 108  center 0.50  xOffset  0
Agurk       tone #E4E7D9  shoulderWidth  84  center 0.38  xOffset -1
Chili       tone #F0E9DD  shoulderWidth 116  center 0.50  xOffset  1
Peberfrugt  tone #E8EBDD  shoulderWidth  92  center 0.61  xOffset  0
Corno       tone #F1EBDE  shoulderWidth 104  center 0.41  xOffset -2
Squash      tone #E3E5D5  shoulderWidth  86  center 0.58  xOffset  1
Stangbønne  tone #ECE6D8  shoulderWidth 112  center 0.50  xOffset  0
```
Skulder-rytme = center/left/center/right/left/right/center (left = 38–41 %, right
= 58–61 %; skulderen bliver i øvre midterzone). xOffset er KUN ±0–2px — bredde-
variation er bevidst FORKASTET (gav "ustabil stak").

### Skygger (eksakte — Annas spec)
```
STACK_DROP_SHADOW          (collapsed, wrapper-filter): drop 0 10 20 .11 · 0 3 8 .05
STACK_DROP_SHADOW_STRONG   (hver 3. mappe, i%3===2 = Chili/Squash): 0 12 22 .12 · 0 3 8 .06
STACK_DROP_SHADOW_EXPANDED (åbent kort): 0 16 30 .15 · 0 5 10 .08
STACK_SHELL_INSET          (collapsed clippede div): inset 0 1 0 #fff .34, inset 0 0 0 1px rgba(112,104,84,.06)
STACK_SHELL_INSET_EXPANDED : inset 0 1 0 #fff .36
STACK_EXPANDED_CARD_SHADOW : 0 10 22 rgba(55,48,34,.12), 0 3 8 .06, inset 0 1 0 #fff .10
STACK_COLLAPSED_CARD_SHADOW: 0 2 6 rgba(55,48,34,.10)   (dæmpet → folder-kant > kort-kant)
```
`inset 0 0 0 1px rgba(112,104,84,.06)` = den "taktile hairline-kant" der holder
mapperne fra at flyde ud i baggrunden. Det er IKKE en hård outline — hold den
ultra-subtil.

### Tail-mapper (4 tomme, `TAIL_FOLDERS`)
```
TAIL_VISIBLE_H = 72,  TAIL_STACK_HEIGHT = 224,  STACK_BOTTOM_PADDING = 96
tail-1 widthInset 22 tone #EEE8DA sw 108 center 0.50 opacity 0.72 shadowFactor 1.00 marginTop   0  rounded false
tail-2 widthInset 28 tone #E4E7D9 sw  84 center 0.38 opacity 0.52 shadowFactor 0.82 marginTop -24  rounded false
tail-3 widthInset 20 tone #F0E9DD sw  86 center 0.58 opacity 0.34 shadowFactor 0.64 marginTop -22  rounded false
tail-4 widthInset 26 tone #E8EBDD sw 112 center 0.50 opacity 0.18 shadowFactor 0.46 marginTop -26  rounded true (+8px margin-bottom)
```
`tailShadow(factor)` skalerer kun alpha på de to drop-shadow-lag. Fade = opacity
+ shadowFactor. INGEN blur/filter-blur (bevidst).

`StackCascade` måler container-bredden med `useContainerWidth` (ref +
ResizeObserver) fordi clip-path skal bruge px. Folder-toppe akkumuleres
(`cumTop`); `tailTop = realBottom − STACK_COLLAPSED_OVERLAP`; container-højde =
`tailTop + TAIL_STACK_HEIGHT + STACK_BOTTOM_PADDING`.

---

## 6. Interaktionsmodel (LÅST)

- `const [expandedFolderId, setExpandedFolderId] = useState<string|null>(null)`
- Default `null` → ALLE cascade-mapper er **collapsed**. Kun mappen hvis id ===
  expandedFolderId rendres expanded. **Kun ÉT kort expanded ad gangen.**
- Toggle: tap på en mappe → hvis allerede åben, luk (null); ellers åbn den.
- **Tap må IKKE navigere.** Kortet er et Next `<Link>`. Vi fanger i **capture-
  fasen** på shell-div'en (`onClickCapture` → `e.preventDefault()` +
  `e.stopPropagation()` + toggle), FØR Linkets egen onClick. Bruger man bubble-
  fase navigerer routeren først → bug. (Det er allerede sket og rettet — gentag
  det ikke.)
- Tastatur: `role="button"`, `tabIndex=0`, `aria-expanded`, `aria-controls`,
  `aria-label`; Enter/Space toggler, Escape lukker.
- **Ingen hover-expansion.** Mobile-first; kun tap.
- collapsed = ÅBEN (flad) bund → glider ned bag næste mappe. expanded = AFRUNDET
  (28px) bund → afsluttet mappe. (Styres af `roundedBottom = isExpanded` i clip.)
- expanded mappe: `zIndex 30`, `translateY(-4px)`.

---

## 7. LÅSTE beslutninger — rør ALDRIG uden ny eksplicit retning

1. **HeroFolder / Salat**: form, path (`buildHeroFolderPath`), bund-radius 30,
   dropskygge, bredde (≈ grøn hovedmappe), kort-overstyringer. Salat er ALTID
   fuld/åben intro-mappe — aldrig collapsed.
2. **SeedBankFolderPanel** (grøn mappe), CTA, søgning, filter, bottom-nav.
3. **Skulder-path-formen** + skulder-rytmen (center/left/.../center). Variation
   kun via skulderbredde + center + farve + ±2px xOffset. IKKE bredde-variation.
4. **Hero→Tomat-overgang**: `marginTop: -9` på cascade-wrapper + `HERO_BOTTOM_PAPER
   36` → ~27px synlig creme under Salat-kortet, Tomat overlapper kun ~9px. Tomat
   må ikke mase op mod Salats hvide infopanel.
5. **collapsed open bund / expanded afrundet bund**-princippet.
6. **InventoryCard's indhold/typografi/billeder/badges** og dets farvegradienter.
7. **z-index-princippet**: senere mapper ovenpå (z = i+1), expanded = 30.

---

## 8. PRØVET OG FORKASTET (gentag ikke)

- **Alle kort i full view som default** → forkert; default SKAL være collapsed.
- **Stor bredde-variation** (`calc(100% − 18…30px)`) → "ustabil stak". Forkastet
  til fordel for ens bredde + ±2px xOffset.
- **Creme-bånd under collapsed-kort** (kort klippet kortere, separat cardClip, H
  bumpet til 160) → blev rullet TILBAGE 2026-06-25. Ramte ikke det Anna ville.
  Hvis du tager fat i fold-overgangen igen: hun vil have mapperne til at "fade og
  glide ned bag hinanden" som ægte manila-mapper (se reference-billede i tråden)
  — IKKE et hårdt afskåret foto ved sammenfolden. Løs det via overgang/skygge/
  rim, ikke ved at gøre kortene markant mindre.
- **Hård outline rundt om mapper** → nej. Kun ultra-subtil inset-hairline.

---

## 9. Åbne punkter / kandidater til næste skridt

1. **Tail-mapperne er meget svage** — de specificerede creme/salvie-toner ligger
   tæt på sidens cremebaggrund, så tail-3/4 (opacity 0.34/0.18) forsvinder næsten
   helt. Hvis "fortsætter videre"-følelsen skal være tydeligere: hæv de to
   laveste opacity-trin (fx 0.42/0.26) ELLER giv tail-tonerne lidt mere kontrast
   mod baggrunden. (Afventer Annas valg.)
2. **Fold-overgangen** collapsed→næste mappe (se §8, 3. bullet). Stadig den mest
   sandsynlige næste finjustering.
3. Den gamle tom-tilstands-kode (`ArchiveContainer`/`FolderLayer`) er teknisk død
   for demo og kunne på sigt forenkles/fjernes — men kun bevidst.

---

## 10. Workflow & hårde regler

- **Verificér altid mobilt: 390px** (preview / QA låst til mobil-bredde). Folder-
  bredderne er px-baserede via målt container; test ved ~390–397px viewport.
- **`npx tsc --noEmit` skal være grøn** før noget regnes færdigt.
- **COMMIT/PUSH KUN når Anna beder om det.** Netlify build-credits er begrænsede
  → push ikke pr. lille ændring. Intet i denne stak er pushet endnu.
- **Anvend ALDRIG Supabase-migrations ad-hoc.** Ikke relevant for stakken, men
  generel regel.
- **Rør ikke** de untrackede billed-PNG'er i `public/images/frokort|plantekort|ui`.
- Dansk i UI og kommunikation. mm→px ≈ 3.78 (Anna specificerer ofte i mm).
- Arbejdsmønster: Anna giver præcise mikro-specs og itererer i små trin med
  screenshots. Hold ændringer afgrænsede; lav ikke utilbedt redesign.

---

## 11. Git-tilstand (pr. handoff)

Branch `claude/romantic-chatelet-9908e2` (worktree). Stakken er ændret men
**ikke committet**. Sidste committede commit rører ikke disse uncommittede
stak-ændringer. Codex bør arbejde videre i samme worktree og kun committe efter
Annas go.
