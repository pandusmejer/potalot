# Potalot — Ikonsystem ("Potalot Soft Glyphs")

> Retning låst af Anna (2026-06-15). Se den rå liste over alle nuværende ikoner i [ikoner.md](ikoner.md).

## Filosofien: to registre, én familie

Vi kopierer **ikke** én eksisterende stil 1:1. Verden har nok apps, hvor alle
ikoner prøver at være "søde" på samme måde. Potalot har to ikon-registre i
samme familie:

| Register | Hvad | Strategi |
| --- | --- | --- |
| **A. Funktionelle UI-ikoner** | Navigation, CRUD, søgning, login, beskeder, status | **Behold Lucide.** Gør dem til Potalot via farve, stroke, størrelse, kontekst — ikke gentegning. |
| **B. Potalot Soft Glyphs** | Planter, frø, skadedyr, vejr, høst, jord, redskaber, guides, havehandlinger | **Custom sæt** (~30–40 ikoner). Fyldte, bløde, botaniske, let naive — men stramme nok til en premium app. |

**Det vigtigste valg:** Gentegn IKKE alle 129 Lucide-ikoner. Det er et sumpområde.
I stedet: behold Lucide som UI-system, lav 30–40 custom glyphs til haveuniverset,
ryd op i dubletter, og brug farve + størrelse til at få de to til at føles som
samme familie.

Hverken tynde outline-ikoner (for tekniske, "fødevarelabel") eller flade sorte
silhuetter (for generiske, stock-agtige). Tænk: *"botanisk pictogram tegnet af en
voksen designer, ikke af en børnehave med adgang til Figma."*

---

## Register A — Funktionelle UI-ikoner (Lucide)

Behold Lucide til: `Check`, `Plus`, `X`, `Trash2`, `Pencil`, `Search`, `Filter`,
`ArrowRight`, `Bell`, `Lock`, `User`, chevrons, loaders osv. Kedeligt virker —
brugeren skal ikke nyfortolke en skraldespand.

**Tæmning (gør Lucide til Potalot uden gentegning):**
- **Farve:** standard = mørk botanisk grøn (se palette). Aldrig ren sort, aldrig neon.
- **Stroke:** ensartet vægt på tværs (typisk `strokeWidth` 1.75–2).
- **Størrelse:** fast skala (fx 16 / 18 / 20 / 24), ikke vilkårlige tal pr. sted.
- **Kontekst:** rolige flader, god luft, semantisk farve kun når den hjælper.

> Mål: ét centralt sted at sætte default farve/stroke/størrelse, så alle Lucide-
> ikoner arver Potalot-udtrykket (wrapper-komponent eller delte ikon-tokens).

---

## Register B — Potalot Soft Glyphs (custom)

**Definition:** Et blødt, fyldt ikonunivers med botaniske former, lav detaljegrad,
afrundede silhuetter og dæmpede havefarver. Ikonerne skal føles som små
redaktionelle markører i en moderne skandinavisk haveapp — ikke generiske
systemikoner.

### Designlinje
- **Fyldte frem for outline** — solide flader giver varme og app-karakter; bedre genkendelse på mobil.
- **Organiske, men ikke nuttede** — runde former, bløde hjørner, let asymmetri. En gulerod må se håndtegnet ud, men ikke som et babyprodukt.
- **Simple nok til 20–24 px** — aflæselige i lille størrelse. Ingen botanisk præcision med 17 blade.
- **Én optisk vægt** — tomat, bille, vanddråbe og rive skal føles lige tunge.
- **Få interne detaljer** — 1–3 pr. ikon (frøprikker, bladnerver, snitlinje, stængel, huller i jord).
- **Ingen hårde hjørner** — også redskaber får afrundede ender. Praktisk, ikke byggemarked-2013.

### Formprincipper
- Tegn på **24 × 24 px grid**, men **optisk**, ikke matematisk.
- Hovedform fylder ca. **18–20 px** i højden/bredden.
- **2 px optisk stroke** når streg indgår.
- **3–4 px radius** på hårde former.
- Undgå tynde detaljer **under 1.5 px**.
- **Delt formsprog:** samme bladform, samme frøprik, samme kurvefamilie på stængler/ranker/redskaber.

### Glyph-sættet (~33)
Frø · Spire · Plante · Blad · Blomst · Tomat · Gulerod · Ært · Bønne · Løg ·
Hvidløg · Jord · Kompost · Vand · Sol · Regn · Frost · Vind · Drivhus · Højbed ·
Krukke · Rive · Skovl · Saks · Snegl · Bille · Pindsvin · Fugl · Høstkurv ·
Spisekammer · Frøbørs · Havebog · Dyrkningsguide

---

## Palette

Én primær ikonfarve + få semantiske farver. **De fleste ikoner er monokrome eller
duotone** — farve skal hjælpe brugeren, ikke opføre sig som en børnefødselsdag.

| Rolle | Hex | Brug |
| --- | --- | --- |
| Standard / neutral | `#2F4F3A` (alt. `#31543D`) | Mørk botanisk grøn — UI-standard. Ikke neon, ikke "øko-supermarked". |
| Sekundær grøn | `#7FA56B` | Blade, spirer, vækst, succes. |
| Jord / sand | `#C9A46B` / `#D8BA82` | Jord, frø, tørke, kompost, redskaber. |
| Tomat / rød | `#D85E58` | Frugt, advarsel-light, varme, chili. |
| Gul | `#E7B85A` | Sol, modenhed, høst, blomster. |
| Blå | `#4E79A7` | Vand, regn, kølighed. |
| Lilla | `#8E789D` | Særlige sorter, nat, frost, "sjældent". |

Ingen regnbue overalt. Undgå neon, høj mætning og børnefarver.

---

## Oprydning først — dublet-status

Før nyt designes, ryddes dubletter. **MEN** flere "dubletter" er reelt bevidste
vokabularier eller alias'er, ikke løs gentagelse. Reality-tjekket nedenfor.

### Kanoniske valg (behold)
| Ikon | Betydning |
| --- | --- |
| `Check` | handling |
| `CheckCircle2` | afsluttet / status |
| `Pencil` | redigér |
| `NotebookText` | havebog / noter |
| `Image` | ét billede |
| `Images` | galleri |
| `MessageSquare` | besked / forum |
| `Flower2` | blomst |
| `ShieldCheck` | tryghed / verificeret |
| `BookOpen` | guide |

### Ryddet nu (trygge swaps)
- `NotebookPen` → `NotebookText` (guide-notes-card)
- `Flower` → `Flower2` (maaneds-hero)
- `MessageCircle` + `MessagesSquare` → `MessageSquare` (grupper)

### Bevidst beholdt (IKKE dubletter)
- **`Image as ImageIcon`** — alias for Lucide `Image` (pga. navnekollision med `next/image`). Samme ikon; aliaset er nødvendigt hvor `next/image` også importeres.
- **`CheckSquare`** — multi-select ("Vælg flere") i Frøbank. Checkbox-semantik, distinkt fra `Check`/`CheckCircle2`.
- **`CheckCheck`** — "markér alle som læst" i notifikationer. Distinkt betydning.
- **Badge-/rolle-glyffer** (`PencilLine`, `PenLine`, `Library`, `Skull`, `Shield`, `Crown` m.fl.) — curated, typede registre (`badges-shared.ts`, garden-roles, trust-badges). Egen deliberat pas, ikke UI-oprydning.
- **`Notebook`** (Havebog-fanen) + **`BookMarked`** (post-type "guide") — kandidater til custom **Potalot Soft Glyphs** (Havebog, Dyrkningsguide), så de skiftes som del af glyph-arbejdet, ikke som Lucide-swap.

---

## Eksekveringsplan

0. **Oprydning** — trygge dublet-swaps (gjort) + dokumentér resten. ← *her*
1. **Lucide-tæmning** — centralt ikon-default (farve/stroke/størrelse), så alle Lucide-ikoner arver Potalot-udtrykket.
2. **Glyph-pilot** — design 5–6 repræsentative Soft Glyphs (fx Frø, Spire, Blad, Tomat, Vand, Sol) som SVG-komponenter; lås det delte formsprog (blad/frø/stængel/dråbe). Annas godkendelse FØR skalering.
3. **Skalér glyph-sættet** — færdiggør de ~33.
4. **Indsæt glyphs** i botaniske kontekster på tværs af appen (Frøbank, Planter, Kalender, Guides, Havebog).

---

## Appendix — designbrief (til designer/Claude)

```md
Potalot icon system: Soft Glyphs

Create a complete icon style for a premium Scandinavian gardening app.

Style:
- filled glyph icons
- rounded organic silhouettes
- calm botanical personality
- simple enough for 20–24 px mobile UI
- tactile, friendly, but not childish
- slightly imperfect natural shapes
- no sharp technical geometry
- no thin outline-only icons
- no generic stock pictograms
- no overly cute cartoon expression

Construction:
- 24 × 24 px grid
- optical size: 18–20 px
- rounded terminals
- consistent visual weight
- 1–3 internal details maximum
- large readable silhouette first
- details second
- same leaf, seed, stem and droplet language across icons

Color:
- primary dark botanical green
- muted plant green
- soft soil ochre
- tomato red
- warm harvest yellow
- water blue
- muted berry purple
- use monocolor or duotone by default
- avoid neon, high saturation and childish palettes

Mood:
- modern garden journal
- premium seed archive
- calm mobile UI
- botanical, practical, warm
```
