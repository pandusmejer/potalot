# Guide-fabrik

Struktureret pipeline til at masseproducere guides: **ChatGPT skriver indholdet
(JSON), repo-scripts styrer struktur, validering og import.** Ikke Typora, ikke
fri tekst direkte i databasen, ingen fuldautomatisk publicering.

Rollefordeling:
- **ChatGPT** skriver guides i batches → JSON der matcher `guide-schema.json`.
- **Repo-scripts** (Claude Code): skabeloner · JSON→Markdown · validering · status · import.
- **Menneske**: verificerer sikkerheds-fakta før import.

## Filer

```
Docs/guide-templates/
├── species.template.md      artsguide-skabelon (fagligt fundament)
├── variety.template.md      sortsguide-skabelon (kun forskellene)
├── guide-schema.json        kontrakt for ChatGPT-JSON'en
├── editorial-rules.md       tone + art/sort-deling + billed-regler
└── examples/                referenceguides (tomat, tomat-san-marzano)

content/guide-production/
├── species.csv              inputark: arter (planen + kontrollerede fakta)
├── varieties.csv            inputark: sorter
└── generated/               ChatGPT-JSON lander her (→ bliver til markdown)

content/guides/              færdige guides (importeres til DB)
```

Skabeloner + `generated/` ligger **uden for** `content/guides/`, så importeren
aldrig tager dem for rigtige guides.

## Flow

```
species.csv / varieties.csv          (planen + kontrollerede fakta)
        ↓  ChatGPT skriver JSON i batches (se "Sådan briefer du ChatGPT")
content/guide-production/generated/*.json   (matcher guide-schema.json)
        ↓  npm run guides:build        JSON → repoets markdown
content/guides/*.md
        ↓  npm run guides:validate     niveau 1: struktur/felter/dubletter
        ↓  npm run guides:status        overblik: produceret / mangler / billeder
        ↓  menneskelig godkendelse      sikkerheds-fakta (se editorial-rules.md)
        ↓  npm run import:guides
DB
```

## Kommandoer

| Kommando | Hvad |
|----------|------|
| `npm run guides:build` | JSON i `generated/` → repoets markdown i `content/guides/` |
| `npm run guides:validate` | Niveau 1: felter, enums, dubletter, slug↔filnavn, parentSlug, sektioner, summary-længde |
| `npm run guides:status` | Overblik: antal, livscyklus, planlagt-men-mangler, JSON-kø, forældreløse sorter, guides uden billede |
| `npm run guides:mark <slug> <status>` | Sæt livscyklus-status (draft/reviewed/approved/imported) |
| `npm run import:guides` | Markdown → DB |

## Livscyklus (status)

Hver guide har en status, gemt i `content/guide-production/status.json` — **aldrig**
i selve guide-teksten. Build/import rører aldrig indholdet; kun mennesket flytter
status med `guides:mark`.

| Status | Betyder |
|--------|---------|
| `draft` | leveret (ChatGPT-JSON bygget), ikke tjekket. Standard for nye. |
| `reviewed` | `guides:validate` kørt uden fejl |
| `approved` | et menneske har godkendt fakta (se editorial-rules.md) |
| `imported` | importeret til DB |

```bash
npm run guides:mark tomat-san-marzano approved
npm run guides:mark tomat-san-marzano imported
```
`guides:status` viser fordelingen + hvad der endnu ikke er importeret.

## Sådan briefer du ChatGPT

Giv ChatGPT tre ting og bed om **ren JSON, én guide ad gangen** (eller en liste):

1. **Schema:** indholdet af `guide-schema.json` (det er kontrakten — JSON'en skal matche det).
2. **Regler:** indholdet af `editorial-rules.md` (tone + art/sort-deling + fakta-før-poesi).
3. **Eksempel + fakta:** en reference fra `examples/` + rækken fra `species.csv`/`varieties.csv`.

For **sortsguider**: giv også artsguidens JSON/tekst med, så ChatGPT kun skriver
om FORSKELLENE og ikke gentager arten.

> Bed altid om **kun** JSON (ingen forklaring udenom), så den kan gemmes direkte
> i `generated/<slug>.json`.

## Rækkefølge (Annas princip)

1. **Artsguiden først** — fagligt fundament for alle sorter under arten.
2. **Sortsguider derefter** — kun forskellene, oven på arten. Ingen gentagelse,
   ingen modsigelser.

## Kvalitetskontrol

1. **Automatisk** (`guides:validate`) — maskinen fanger struktur.
2. **Menneske** — verificerer sikkerheds-fakta: kalender, planteafstand, højde,
   hårdførhed, giftighed, spiselighed, sygdomme, latinsk navn (se editorial-rules.md).

## Billeder = separat spor

Guide-tekst og billeder blandes ikke. Se `editorial-rules.md` for de tre
billedtyper (frøkort / plantekort / artsguide-billede) og `BILLEDER.md` i roden
for hvor de placeres. `guides:status` viser hvilke guides der mangler billede.
