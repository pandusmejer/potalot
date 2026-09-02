# Prikling vs. ompotning — model-backlog

**Status:** åben model-opgave. Oprettet 2/9 2026 efter tekst-auditten.
**Ikke** en korrekturopgave. Ingen `task_type`-kontraktændring må ske i en
korrektur-batch.

## Hvorfor noten findes

Korrekturen ændrer 2/9 labelen på opgavetypen `repot` fra **"Omplant"** til
**"Prikl om"**.

Det er en korrektur af typens **faktiske nuværende betydning** — ikke en
påstand om, at prikling og ompotning er den samme havehandling. De er det
ikke:

- **prikle om** = flytte småplanter fra tæt såning ud i mere plads, typisk
  når første rigtige bladpar viser sig.
- **potte om** = flytte en etableret plante til en større potte, fordi
  rødderne fylder den nuværende.

Skriv derfor ikke om seks måneder, at `repot = "Prikl om"` beviser, at
Potalot har slået de to begreber sammen med vilje. Det gør den ikke. Den
beskriver, hvad der faktisk ligger i data i dag.

## Hvad data viste (2/9 2026, live DB)

Alle syv kalenderregler, der bruger `repot`, `prick_out` eller
`pricking_out`, handler om **prikling**:

| task_type | guide | titel |
|---|---|---|
| `repot` | Tomat | Prikl tomatplanter om |
| `repot` | Chili | Prikl chiliplanter om |
| `repot` | Peberfrugt | Prikl peberfrugtplanter om |
| `prick_out` | Tomat · Gourmansun | Prik tomatplanter |
| `prick_out` | Tomat · Gardenberry | Prik små planterne |
| `prick_out` | Tomat · Zuckerstraube | Prikling |
| `pricking_out` | Tomat · Ananas | Prikl tomatplanter |

Der findes **nul** ægte ompotnings-regler i hele guide-korpusset.

Runtime behandler allerede `repot` som prikling: `dagens-fokus.ts:274`
slår `rulePrioritet(guide, ['repot'])` op på stadiet `spirer` og skriver
"Giv X mere plads" — det er prikling, ikke ompotning. Og
`plant-stages.ts` mapper `repot: 'spirer'`.

Derfor blev den oprindelige idé — at sende `prick_out` til `custom` —
forkastet: den ville splitte syv identiske regler over to typer og give
fire af dem labelen "Opgave" på stadiet `enhver`.

## Opgaven, når den skal løses

1. Canonical type for **prikling**.
2. Canonical type for **ompotning**.
3. Migration/normalisering af de syv eksisterende regler til den rigtige
   af de to.
4. Opdatering af aliases (`prick_out`, `pricking_out`), labels
   (`TASK_TYPE_META`) og stage-logik (`TASK_STAGE`, `dagens-fokus.ts`).
5. **Tests før migration.** `scripts/test-opgavetype-kontrakt.ts` vogter
   allerede, at `CANONISKE_OPGAVETYPER`, `TaskType` og CHECK-constrainten
   i `00018_calendar_tasks.sql` ikke driver fra hinanden — de tre skal
   opdateres samlet.

## Grænse mod log-siden

`plant-log-meta.ts` har `repotting: 'Pottet om'`. Det er en **log-type**
(noget brugeren selv registrerer), ikke en task-type. En bruger, der
logger "Pottet om", kan udmærket mene ægte ompotning. De to modeller skal
ikke tvangssammenkobles her.

## Referencer

- Tekst-audit 2/9 2026 (klasse D, fund om ompotnings-terminologi)
- `Docs/product/kalenderregel-semantik-audit.md` — task_type-kontrakten,
  lukket 2/9
- `src/lib/kalender/opgavetype.ts` — ALIAS-tabellen og dens belægs-regel
