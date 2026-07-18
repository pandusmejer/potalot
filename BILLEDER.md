# Billeder i PotAlot

Hvor fotos hører hjemme, hvordan du tilføjer dem, og reglerne for hvad der
bruges hvor. Ét sted at slå op.

> Web-udgave (pænere, med klik-indhold): se den delte artifact-guide.

---

## 1. Hurtigst — send fotos til Claude

Du skal **aldrig** trække billeder ind i chatten. Læg dem i indbakken og skriv
én linje om hvad de er — Claude læser dem direkte fra disken.

1. **Læg filerne i indbakken** (i Finder: ⌘⇧G og indsæt stien):
   ```
   /Users/anna/potalot/_foto-indbakke/
   ```
2. **Skriv i chatten hvad hver fil er:**
   ```
   Nye fotos i indbakken:
     tomat.jpg       → plantekort, Tomat, San Marzano
     chili-pose.jpg  → frokort, Chili, Jalapeño
     host-kurv.jpg   → mosaik, høst/kurv
   ```
3. **Claude klarer resten** — komprimerer, navngiver, placerer, registrerer og
   committer. Du skal kun merge på GitHub.

Indbakken committes aldrig (står i `.gitignore`) og ryddes automatisk bagefter.

---

## 2. Mappe-oversigt

| Hvad | Mappe | Sådan lægges det ind |
|------|-------|----------------------|
| **Plantefoto** (plantekort-hero, Mine planter) | `public/images/plantekort/` | `add:photo` (§3) |
| **Frøbankskort** (frøkort) | `public/images/frokort/` | `add:photo` (§3) |
| **Artsfoto** (hele arten) | `public/images/arts/` | `add:photo` (§3) |
| **Mosaik-foto** (Forvandlinger på Havebog) | `public/assets/forvandlinger/crops/<afgrøde>/` eller `…/mood/` | Send til Claude — kræver register-linje (§4) |
| **Havebog-kort** (På denne dag, Næste projekt m.fl.) | `public/images/havebog/` | Læg filen + sig hvilken sektion (§5) |

---

## 3. Tilføj plante-/frø-/artsfoto selv

Kommandoen slugger navnet, komprimerer (≤1800px), lægger filen rigtigt og
opdaterer registret — alt i ét. Kør fra projektroden:

```bash
cd /Users/anna/potalot
npm run add:photo <fil> <plantekort|frokort|arts> "Art" ["Sort"]
```

> Tip: træk filen ind i Terminal, så indsættes stien af sig selv.

**Eksempler:**
```bash
npm run add:photo ~/Desktop/tomat.jpg  plantekort "Tomat" "San Marzano"
npm run add:photo ~/Desktop/chili.png  frokort    "Chili" "Jalapeño"
npm run add:photo ~/Desktop/aert.jpg   arts       "Ært"
```

Filnavnet dannes automatisk fra navnet (`Tomat` + `San Marzano` →
`tomat-san-marzano.jpg`). Foto uden transparens → JPG; frøkort med ægte
transparens → PNG. Bagefter: commit + merge (§6).

---

## 4. Mosaik-fotos (Forvandlinger på Havebog)

Mosaikken har sit eget register-drevne system — en fil alene er ikke nok, den
skal **tagges**, ellers falder tilen til et farvefelt. Derfor: **send disse til
Claude**.

| Type | Mappe | Filnavn |
|------|-------|---------|
| Afgrøde-/sortsfoto | `assets/forvandlinger/crops/<afgrøde>/` | `{afgrøde}-{rolle}-01.jpg` |
| Stemning/kategori | `assets/forvandlinger/mood/` | `{kategori}-stemning-01.jpg` |
| Grafik (papir, farvefelt) | `assets/forvandlinger/graphics/` | — |

**Roller:** `frugt` · `plante` · `blad` · `blad-dug` · `blomst` · `koekken` ·
`haand` · `kurv` · `stemning`.
Eksempler: `tomat-frugt-01.jpg` · `jordbaer-blomst-01.jpg` · `agurk-koekken-01.jpg`.

Registreres i `src/lib/forvandlinger-assets.ts` (afgrøde) eller
`src/lib/forvandling-assets.ts` (mood/kategori) med tagget `'forvandling'`.
Claude gør det — du sender bare fotoet + "afgrøde, rolle".

---

## 5. Havebogens nederste kort

Fotos til kort som *På denne dag*, *Prøv næste år* og *Næste projekt*:

- Læg filen i `public/images/havebog/` med et sigende navn, fx
  `naeste-projekt-insekthotel.jpg`.
- Sig hvilken sektion den hører til → Claude wirer stien ind i koden.
- Stående format passer bedst til "På denne dag" (stort, mørkt).

---

## 6. Få det live (deploy)

Billeder bliver først synlige i appen efter de er merget til `main`:

1. **Gem i git:**
   ```bash
   git add -A
   git commit -m "foto: Tomat San Marzano"
   git push origin feature/havebog
   ```
2. **Merge på GitHub** — åbn pull request'en til `main` og merge den.
3. **Netlify deployer selv** — auto-publish er slået til; vent til
   `main@… Published` på potalot.app.

> `push` ≠ deploy: push lægger på GitHub, **merge til `main`** udløser
> produktions-deployet.

---

## 7. Regler & konventioner

**Komprimering — altid.** `add:photo` gør det selv (≤1800px længste side, JPEG
~q82). Lægger du en fil i hånden: hold den ≤1800px / ~80%. Aldrig 5–6 MB-
originaler — de gør siden langsom.

**Slug-regler (filnavnet):**
- Alt småt · mellemrum → bindestreg
- `æ→ae · ø→oe · å→aa`, accenter fjernes (`é→e`)
- Bygges af **art + sort**: `Dahlia` + `Café au Lait` → `dahlia-cafe-au-lait`

**Appen bruger kun "kendte" filer:**
- **plantekort/frokort/arts:** skal stå i manifestet
  (`src/data/image-manifest.generated.ts`). `add:photo` opdaterer det; ellers
  kør `npm run scan:images`.
- **mosaik:** skal registreres + tagges `'forvandling'`.
- **havebog-kort:** stien wires ind i koden.

**Fælder:**
- Læg **aldrig** fotos i en *worktree* — kun i hovedmappen
  `/Users/anna/potalot` (branch `feature/havebog`). Worktrees deployer ikke.
- Lægger du en fil i hånden uden at køre `scan:images`, viser appen et
  fallback-billede i stedet.

---

## 8. System-/design-mapper

Kuraterede — du rører dem normalt ikke. Vil du skifte et, så sig til Claude.

`glyphs/` ikoner · `makro/` nærbilleder · `heroes-maaneder/` `heroes-sider/`
`heroes-havebog/` hero-fotos · `weather-pools/` vejr · `kalender/` · `teknik/`
guide-teknik · `ui/` · `placeholder/`.

---

*Alle billeder bor i `public/images/` (+ `public/assets/forvandlinger/`) på
branchen `feature/havebog` — ét kildested. Tommelfingerregel: plante- og
frøfotos → kør `add:photo` selv · mosaik- og havebog-fotos → send til Claude
via indbakken.*
