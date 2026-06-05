# Potalot — design-system

Mappen indeholder docs der definerer **hvordan Potalot ser, lyder
og bevæger sig** — uafhængigt af hvilken specifik feature der
implementeres.

Hvis en doc beskriver et **systemvalg** (en farve, en tone, et
motion-mønster, et komponent-DNA), så hører den til her.
Hvis en doc beskriver et **specifikt feature-område** (guides,
billeder, AI-pipeline), så hører den i `Docs/` root.

---

## Hvad bor her nu

| Doc | Hvad |
|---|---|
| [`notifications.md`](./notifications.md) | Notifikationernes DNA — hierarki, tone, format, timing, syv arketyper |
| [`guides.md`](./guides.md) | Guidernes visuelle + redaktionelle DNA — naturhåndbog-rytmen, Botanical/Detail Bleed, typografi, farver, komponent-katalog, bibliotek-faser, anti-mønstre |
| [`references/`](./references/) | Kanoniske visuelle referencer pr. designområde — moodboards, godkendte mockups, farvepalette-referencer. Mennesker husker billeder bedre end regler. |
| [`prompts/`](./prompts/) | Billed-prompts pr. billedtype — masterprompts til AI-genererede billeder og rettesnor for fotografer. Sikrer at makro-, plantekort-, arts-hero-fotos ikke divergerer i stil over tid. |

---

## Hvad sandsynligvis lander her senere

Skrives når feature-arbejdet kalder på dem — ikke som forhåndskøb.

| Mulig doc | Hvad den ville dække |
|---|---|
| `typografi.md` | Cormorant + Manrope-systemet, skalaer, brug pr. kontekst |
| `farver.md` | Creme-paletten, kontrast-regler, varianter pr. blok-type |
| `motion.md` | Mikroanimationer, transitions, easing-funktioner — den slags der gør at appen ikke føles statisk |
| `ikoner.md` | Kurateret Lucide-udvalg + custom-ikoner i `ui/`. Hvilke ikoner bruges hvor — og hvilke skal vi IKKE bruge |
| `komponenter.md` | Det fælles vokabular: `<GuideFactCard>`, `<GuideTechniqueCard>`, `<GuideNextCard>` osv. — hvilket DNA de deler, hvornår de må afviges fra |
| `voice.md` | Generelle tone-regler på tværs af alt UI-tekst, ikke kun notifikationer |
| `empty-states.md` | Hvad ser brugeren når der intet er — på frøbank, planter, kalender, havebog, ideboards |

---

## Hvor design-relateret indhold ligger uden for design-system

Nogle docs handler om design men hører hjemme et andet sted fordi
de er bundet til en specifik feature:

| Doc | Hvorfor uden for design-system |
|---|---|
| [`../BILLEDER.md`](../BILLEDER.md) | Asset-organisering, ikke designvalg |
| [`../GUIDE_BLOKKE.md`](../GUIDE_BLOKKE.md) | Guides-specifikt DSL |
| [`../POTALOT_ROADMAP.md`](../POTALOT_ROADMAP.md) | Hele produkt-roadmappen — Fase 7 (brand-system) vil sandsynligvis trække design-system-docs ind |

🌱
