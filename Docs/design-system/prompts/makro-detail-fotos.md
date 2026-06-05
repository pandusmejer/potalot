# Potalot — masterprompt for makro- og detailfotos

> **Hvad:** Tonal og kompositorisk specifikation for makro- og detail-
> fotografi i Potalot. Brugt både til AI-genererede billeder
> (Midjourney, DALL·E, Stable Diffusion, Nano Banana m.fl.) og som
> rettesnor for fotografer.
>
> **Hvor billederne lever:** `public/images/makro/<slug>/` og
> `public/images/detail/<slug>/`. Se [`../../BILLEDER.md`](../../BILLEDER.md)
> for mappestruktur.
>
> **Hvor de bruges:** Botanical Bleed + Detail Bleed i guides. Se
> [`../guides.md`](../guides.md) sektion 5 og 6.

---

## Masterprompt (brug direkte til AI-billeder)

```
Create a premium botanical macro photograph for Potalot.

The image must feel like a close encounter with the plant itself.

The viewer should feel: curiosity, closeness, tactility, observation,
quiet fascination.

The image belongs inside a premium Scandinavian gardening product.

It is NOT: stock photography, gardening journalism, lifestyle photography,
Pinterest gardening, commercial agriculture, food photography, product
photography.

The image should feel like:
"botanical field observation through the eyes of a gardener."
```

---

## Formål

Disse billeder bruges til:

- Growing guides
- Educational articles
- Plant details
- Garden journals
- Inspiration sections
- Calendar content

**Målet er at afsløre noget interessant ved planten — ikke blot vise den.**

---

## Output-specifikation

| Felt | Værdi |
|---|---|
| **Format** | 4:5 portrait foretrukket. Landscape tilladt når kompositionen kræver det. |
| **Minimum opløsning** | 1600px på længste side |
| **Foretrukket opløsning** | 2048px+ |
| **Farverum** | sRGB |
| **Filformat** | PNG eller højkvalitets JPEG |

---

## Motivprioritet

Fokuser på **ÉN specifik detalje**. Eksempler:

- Blomster-struktur
- Bladtekstur
- Frugt-udvikling
- Frødannelse
- Stængel-struktur
- Roddannelse
- Slyngtråde
- Bestøvning
- Dråber efter regn
- Ny vækst
- Modnings-proces
- Sygdoms-symptomer
- Insekt-interaktion

**Billedet skal besvare:** *"What would a curious gardener stop and study?"*

---

## Komposition

Motivet skal dominere billedfladen.

**Fylder 50-80 % af billedet.**

Undgå:

- Wide scenes
- Hele bede
- Hele haver

Læseren skal føle sig **fysisk tæt på**.

---

## Kamera-stil

- Macro-objektiv-æstetik
- Ekstrem lav dybdeskarphed tilladt
- Fokus skal falde naturligt
- Baggrund skal opløses blødt

**Undgå:**

- Kunstige blur-effekter
- AI-smearing
- Overdrevne bokeh-former

---

## Plante-imperfektioner

Vis virkeligheden. Tilladt:

- Små skavanker
- Uregelmæssig vækst
- Mindre insektskader
- Asymmetri
- Naturlig variation

**Undgå:**

- Perfekte katalog-eksemplarer
- Pletfri supermarkedsfrugt
- CGI-perfektion

**Planter skal føles levende — ikke fremstillet.**

---

## Lys

**Kun naturligt lys.**

Foretrukket:

- Overskyet dagslys
- Blødt morgenlys
- Blødt aftenlys

Tilladt:

- Subtil golden-hour-varme

Undgå:

- Hårdt sollys
- Studio-flash
- Dramatiske spotlights
- Fantasy-stråler
- Cinematiske effekter

**Lyset skal føles fundet — ikke skabt.**

---

## Farve

Naturlig botanisk grading. Let dæmpet. Behersket skandinavisk palette.

Tilladt:

- Olivengrønne
- Støvede grønne
- Jordfarvede røde
- Varme gule
- Dæmpede lyserøde
- Naturlige brune

Undgå:

- Neon-farver
- Tropisk mætning
- Cyan
- Teal
- Magenta-cast

---

## Fugtighed

Brug kun når naturligt.

Eksempler:

- Morgendug
- Let regn
- Kondens på blade
- Frisk vækst

**Fugtighed skal føles tilfældig — aldrig iscenesat. Aldrig sprayflaske-våd.**

---

## Baggrund

Baggrunden skal **forsvinde**.

Brug:

- Botanisk blur
- Blødt løv
- Tonal atmosfære

Undgå:

- Hegn
- Huse
- Drivhuse
- Haveredskaber
- Potter
- Labels
- Mennesker

**Billedet handler om planten. Intet andet.**

---

## Potalot-testen

Inden billedet kanoniseres, valider:

1. Ville en gartner **lære noget** af dette billede?
2. Er billedet fokuseret på en **specifik botanisk detalje**?
3. Føles det **observeret** snarere end iscenesat?
4. Ville det passe ind ved siden af et Potalot-plantekort uden
   stilistisk konflikt?
5. Føles det **roligt, taktilt og premium**?

Hvis et svar er nej:

> **Simplificér. Gå tættere på. Fjern distraktioner. Fokuser på planten.**

---

## Det endelige mål

> *"A quiet botanical discovery captured by someone who spends more
> time looking at plants than photographing them."*

---

## Forskellen fra plantekort-prompten

> **Plantekortet** viser hele planten **som et produkt i appen**.
>
> **Makro/detail-billedet** viser en interessant detalje **inde i
> plantens verden**.

Det er den forskel der gør at de to billedtyper kan leve side om side
i en guide uden at føles som gentagelser.

🌱
