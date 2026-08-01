# Potalot — redaktør-tjekliste før aflevering

Praktisk doc til redaktøren der skriver guides i markdown.
**Læs den 5 minutter før du afleverer en guide** — så fanger du de
samme syv mekaniske fejl som ellers gentager sig hver gang.

> Hvis du bruger Typora, autoescape eller indrykker den ofte ting
> for dig. Det er ikke din fejl. Det er værktøjets fejl.
> Tjeklisten her løser det.

---

## De syv mekaniske fejl (sorter efter hyppighed)

### Fejl 1 — `\-` foran bullet-items

Typora skriver `\-` i stedet for `-` når der er en blank linje før listen
(eller når blok-indrykning forvirrer den).

❌ Bliver til plain text:
```
\- Salater
\- Sandwiches
```

✅ Skal være:
```
- Salater
- Sandwiches
```

**Hurtig fix:** Søg og erstat `\-` med `-` i hele filen.

---

### Fejl 2 — `------` mellem blokke

Typora indsætter horisontale linjer som "spacer" mellem blokke. De
hører ikke hjemme i Potalot-guider og bryder den editoriale flow.

❌ Slet alle linjer der **kun** indeholder `------` (eller `---` mellem
to almindelige sektioner — `---` er kun gyldigt som frontmatter-fence).

---

### Fejl 3 — `:::` uden blok-navn

Når du skriver en `:::guide` / `:::related-guides` / `:::next-guide`,
glemmer Typora ofte navnet på åbningsfencen.

❌ Renderer ikke som directive:
```
:::
slug: opbinding-af-tomater
title: ...
:::
```

✅ Skal være:
```
:::guide
slug: opbinding-af-tomater
title: ...
:::
```

**Tjek alle `:::`-linjer** — de skal enten være `:::name` (åbning) eller
bare `:::` (lukning).

---

### Fejl 4 — Ledende mellemrum på felter i `:::`-blokke

```
:::guide

 slug: opbinding-af-peberfrugt           ← ledende mellemrum
 title: Sådan støtter du peberfrugter    ← ledende mellemrum
 description: …                          ← ledende mellemrum

:::
```

❌ Felter med ledende mellemrum parser ikke korrekt.

✅ Felter skal stå **flush venstre**, ingen indrykning:
```
:::guide

slug: opbinding-af-peberfrugt
title: Sådan støtter du peberfrugter
description: …

:::
```

---

### Fejl 5 — ` ``` ` rundt om `:::`-blokke

```markdown
` ```
:::next-guide
title: …
:::
` ```
```

❌ Hele blokken renderes som kode (med synlige `:::next-guide`-tekst)
i stedet for som CTA-kort.

✅ Slet de to ` ``` `-linjer. `:::`-blokke skal aldrig være pakket ind
i kodefences.

---

### Fejl 6 — `# H1` i body

Titlen kommer fra frontmatter (`plantName` + evt. `variety`). Renderer'en
sætter `<h1>` selv.

❌ Dobbelt-overskrift:
```
plantName: Peberfrugt
---

# Peberfrugt (artsguide)         ← slettes

## Om planten
```

✅ Body starter direkte med `##`:
```
plantName: Peberfrugt
---

## Om planten
```

---

### Fejl 7 — Indrykket `:::fact`-indhold

Når du skriver en faktakort-sammenligning, indrykker Typora nogle gange
headings og bullets fordi den tror du laver en nestet liste.

❌ Bullets bliver til sub-items:
```
:::fact{variant="comparison" title="…"}

- ### Grøn peberfrugt           ← `- ` foran heading

  - Kan høstes tidligere        ← indrykning gør bullet til sub-item
  - Sprød og frisk smag

  ### Rød peberfrugt            ← indrykket heading
  …
:::
```

✅ Headings og bullets skal stå **flush venstre, ingen `-` foran heading**:
```
:::fact{variant="comparison" title="…"}

### Grøn peberfrugt

- Kan høstes tidligere
- Sprød og frisk smag

### Rød peberfrugt

- …
:::
```

---

## Andre fejl der dukker op ind imellem

### Slug-typer

Slug i `:::next-guide` skal matche **det reelle sortsnavn** og navnet
fra `ARTER_BACKLOG.md`. Hyppige typos:

| Forkert | Rigtigt |
|---|---|
| `peberfrugt-californian-wonder` | `peberfrugt-california-wonder` *(uden 'n')* |
| `tomat-marketmore` | `agurk-marketmore` *(rigtigt art)* |

### Ufuldstændige description'er

Dropper du af tid undervejs, så efterlad ikke `description: Lær hvordan
du....` — bedre at slette hele `:::guide`-blokken end at sende en
ufuldstændig.

### `label` på `:::guide` (hører kun til `:::next-guide`)

`:::guide`-blokke har **kun** felterne `slug`, `title`, `description`.
Hvis du ser et `label`-felt i en `:::guide`, så slet det.

### Engelsk i bullet-tekst på dansk side

```
seeds-1.jpg      ← engelsk
froe-1.jpg       ← dansk
```

Samme princip for body-tekst i guider — hold det dansk.

---

## Pre-aflevering tjekliste (5 min)

Åbn filen som ren tekst (Typora: View → Source Code Mode, Cmd+/).
Gå igennem:

- [ ] Søg efter `\-` → erstat med `-`
- [ ] Søg efter `------` → slet linjerne
- [ ] Søg efter `:::` på egen linje → tjek at åbningsfencer har navn (`:::guide`, ikke bare `:::`)
- [ ] Søg efter ` title:` (med ledende mellemrum) → flush venstre
- [ ] Søg efter ` slug:` (med ledende mellemrum) → flush venstre
- [ ] Søg efter ` description:` (med ledende mellemrum) → flush venstre
- [ ] Søg efter ` ``` ` → slet hvis det omslutter `:::`-blokke
- [ ] Søg efter `# ` i body (efter frontmatter `---`) → slet ekstra H1
- [ ] Tjek `:::fact`-blokke: ingen `-` foran `###`-headings, ingen indrykning på bullets
- [ ] Tjek `:::next-guide`-slugs mod `ARTER_BACKLOG.md`

Hvis alle 10 punkter er rene, er filen mekanisk importklar.

---

## Editorial-principper du IKKE må glemme

Tre regler der ikke er mekaniske, men som er vigtigere end de syv ovenfor:

### 1. Hver guide skal stå på egne ben

> Beskriv planten ud fra dens egne behov, ikke i forhold til en anden plante.

Ingen *"mindre krævende end chili"*, *"større end dild"*, *"mere
følsom end tomat"*. Detaljer i [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md)
under "Editorial-følge".

### 2. Sortsguiden gentager ikke artsguiden

Hvis du finder dig selv ved at skrive *"forspir i marts-april"* eller
*"vand jævnt"* i en sortsguide, så hører det hjemme i artsguiden.
Sortsguiden skal kun handle om det sortsspecifikke.

### 3. Faktakortet skal være sortsspecifikt på sortsniveau

På en sortsguide skal `:::fact` handle om **denne specifikke sort**,
ikke om arten generelt. Hvis titlen lyder *"Rød vs grøn peberfrugt"*
hører den i artsguiden. Hvis titlen lyder *"Hvornår er California Wonder
bedst?"* hører den i sortsguiden.

---

## Når noget er færdigt

1. Kør tjeklisten (5 min)
2. Send filen til Anna eller commit den i `/Users/mejervind/Documents/`
3. Anna eller import-scriptet håndterer resten

---

## Krydsreferencer

- [`GUIDE_BLOKKE.md`](./GUIDE_BLOKKE.md) — DSL'en for `:::fact` / `:::guide` / `:::related-guides` / `:::next-guide`
- [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — niveau-strukturen + stand-on-own-legs-reglen
- [`ARTER_BACKLOG.md`](./ARTER_BACKLOG.md) — slugs at matche `:::next-guide` mod
- [`REDAKTOER_BESTILLING_GUIDES_V1.md`](./REDAKTOER_BESTILLING_GUIDES_V1.md) — den originale bestillingsformular

🌱
