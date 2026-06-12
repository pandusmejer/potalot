# Potalot — officiel retning for guide-blokke

> ## Guiden er destinationen.
> ## Kortet er intentionen.

Hvis Claude, Codex og redaktørerne forstår dén sætning, ender vi med at
bygge de samme guides — ikke tre forskellige systemer.

---

## Formål

Guides er ikke artikler. Guides er en **digital naturhåndbog**.

Når en guide henviser til andet indhold, skal det ske gennem
**redaktionelle kort** — ikke gennem almindelige hyperlinks eller
formuleringer som:

- "Læs mere…"
- "Se også…"
- "Klik her…"
- blå inline-links i brødteksten

Målet er en oplevelse af **kapitler, der peger videre til hinanden**.

---

## Grundprincip

| | |
|---|---|
| **Destination** | guiden brugeren ender på |
| **Intention** | hvorfor brugeren bliver sendt derhen |

Eksempel:

| Destination | Tomat San Marzano |
|---|---|
| Intention | • Næste skridt<br>• Relateret sort<br>• Relateret teknik<br>• Anbefalet læsning |

**Det er derfor ikke nok at kende slug.** Markdown skal også beskrive
*hvorfor* brugeren bliver sendt videre.

---

## Netværk, ikke navigation

Blokkene er **kanter** i et netværk — ikke navigationsbreadcrumbs.

Brugeren bevæger sig ikke ned gennem et hierarki. Hun vandrer mellem
guider: *Tomat → San Marzano → opbinding-af-tomater → tilbage til
Tomat*. Det er en sund cyklus, ikke en navigationsfejl.

Det betyder:

- **Hver guide kan være en indgang** — SEO og search har samme værdi
  som en forside
- **Der findes ikke "tilbage til oversigten"** — der er ingen oversigt
- **Blokkene peger udad**, ikke opad mod en parent

Se [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — afsnittet
*"Topologi: netværk, ikke hierarki"* — for det fulde arkitekturpoint.

---

## Sektioner i brødteksten

- `## Hovedsektion` — top-niveau-kapitel ("Om planten", "Forspiring",
  "Pleje gennem sæsonen")
- `### Undersektion` — tilladt inde i en hovedsektion når emnet
  naturligt splittes ("### Sygdomme og udfordringer" inde i "## Pleje
  gennem sæsonen")

Dybere niveauer (`####`) bruges **kun** som markører inde i container-blokke
som `:::related-guides` — ikke som almindelige overskrifter.

---

## Bloktyperne

Hele Potalots guide-system bygger på fire bloktyper. Hver har sit eget
navn — ikke ét generisk "card" med en `variant:`-config. Navnet **er**
intentionen.

| Blok | Til | Bygget |
|---|---|---|
| `:::fact` | Sammenligninger og illustrationer i selve læseteksten | ✅ minimum-version (kun `variant="comparison"`) |
| `:::guide` | Inline teknik-/færdighedskort i brødteksten | ⏳ ikke bygget |
| `:::related-guides` | Container med flere beslægtede sorter eller guides | ⏳ ikke bygget |
| `:::next-guide` | Ét større næste-skridt-kort, typisk til sidst i guiden | ⏳ ikke bygget |

---

## `:::fact` — sammenligning i læseteksten

Sammenligninger skrives ikke som almindelig prose når de naturligt
hører hjemme i to spalter:

```markdown
:::fact{variant="comparison" title="Tomater vokser på to måder"}

### Ranketomat
- Vokser hele sæsonen
- Skal opbindes
- Skal ofte knibes

### Busktomat
- Kompakt vækst
- Velegnet til krukker
- Kræver sjældent opbinding
- Sideskud skal ikke knibes

:::
```

**Hvornår faktakort:** kun når informationen naturligt kan sammenlignes
(rank vs busk, forspir vs direkte, drivhus vs friland, sol vs halvskygge).

**Hvor mange:** maksimalt 2–3 pr. guide.

**Kolonner:** bør være nogenlunde balancerede, men behøver ikke have
præcis samme antal bullets. Skriv det der er sandt om planten — ikke
det der gør kortet symmetrisk.

**Placering:** i den sektion hvor sammenligningen naturligt hører
hjemme — ikke som selvstændig sektion.

---

## `:::guide` — inline teknik-kort

Bruges når brødteksten naturligt henviser til en teknik eller
færdighed der har sin egen guide. Ét emne pr. blok, placeret i den
prose-passage hvor henvisningen falder.

```markdown
:::guide
slug: opbinding-af-tomater
title: Sådan opbinder du tomater
description: Lær hvordan du opbinder tomater og undgår knækkede planter.
:::
```

**Hvornår:** kun når teknikken faktisk gør læseren klogere på *denne*
sektion. Ikke som en samling af alt der måske er beslægtet.

**Hvor mange:** så få som muligt. Hvis du har tre `:::guide`-blokke i
én sektion, skriv det som prose i stedet, eller saml dem i en
`:::related-guides`-container.

---

## `:::related-guides` — container med flere beslægtede

Bruges typisk til sidst i en artsguide, der vil pege på sine
sortsguider. Hvert item får sit eget `#### Navn`-mærke.

```markdown
:::related-guides

#### San Marzano
slug: tomat-san-marzano

Klassisk italiensk pastatomat med fast frugtkød.

#### Sungold
slug: tomat-sungold

Meget sød cherrytomat med høj produktion.

#### Black Cherry
slug: tomat-black-cherry

Mørk og aromatisk cherrytomat.

:::
```

**Hvornår:** når der er 2+ items at vise samlet. Ét item alene hører
hjemme som `:::guide` eller `:::next-guide`.

**Rækkefølge:** redaktionel — den vigtigste først.

---

## `:::next-guide` — det store næste skridt

Ét større editorial kort, typisk allersidst i guiden. Bruges **højst
én gang pr. guide**. Markerer den naturlige næste handling for brugeren
efter at have læst denne guide.

```markdown
:::next-guide

title: Vælg en sort
description: Ikke alle tomater dyrkes ens. Udforsk nogle af de mest populære sorter.

slug: tomat-san-marzano
label: Tomat San Marzano

:::
```

---

## Redaktørregel

> Hvis noget kan forklares i almindelig prose — så skriv det som prose.
>
> Brug kun `:::fact`, `:::guide`, `:::related-guides` og `:::next-guide`
> når de **tilfører forståelse**.
>
> Målet er en håndbog. Ikke en side fyldt med bokse.

---

## Hvad er bygget — og hvad er ikke

| | Status | Hvor |
|---|---|---|
| `:::fact{variant="comparison"}` parsing | Indtil import-script er bygget: håndskrevet i `guides-demo.ts` | `src/data/guides-demo.ts` |
| `<GuideFactCard>`-komponent | ✅ Minimum-version, kun `comparison` | `src/components/guides/guide-fact-card.tsx` |
| `:::guide`, `:::related-guides`, `:::next-guide` komponenter | ⏳ Ikke bygget | — |
| Import-script `:::fact` → JSON | ⏳ Ikke bygget | — |
| Import-script `:::guide` / `:::related-guides` / `:::next-guide` → JSON | ⏳ Ikke bygget | — |
| Slug → guide-ID-opslag ved import | ⏳ Ikke bygget | — |

V1.5-roadmap håndteres separat i `GUIDES_ARCHITECTURE.md`.

---

## Relaterede dokumenter

- [`GUIDES_ARCHITECTURE.md`](./GUIDES_ARCHITECTURE.md) — tre-lags-arkitektur (Technique / Species / Variety)
- [`REDAKTOER_BESTILLING_GUIDES_V1.md`](./REDAKTOER_BESTILLING_GUIDES_V1.md) — konkret bestillingsformular til redaktøren

---

> ## Guiden er destinationen.
> ## Kortet er intentionen.

🌱
