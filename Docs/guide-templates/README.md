# Guide-fabrik

Struktureret pipeline til at masseproducere guides: **kode styrer struktur,
AI skriver indhold, validering før import.** Ikke Typora, ikke én masterprompt,
ikke fri tekst direkte i databasen.

## Filer

```
Docs/guide-templates/
├── species.template.md      artsguide-skabelon (fagligt fundament)
├── variety.template.md      sortsguide-skabelon (kun forskellene)
├── guide-schema.json        kontrakt for AI-JSON'en
├── editorial-rules.md       tone + art/sort-deling + billed-regler
└── examples/                referenceguides (tomat, tomat-san-marzano)

content/guide-production/
├── species.csv              inputark: arter
├── varieties.csv            inputark: sorter
└── generated/               AI-JSON lander her (→ bliver til markdown)

content/guides/              færdige guides (importeres til DB)
```

Skabeloner + generated/ ligger **uden for** `content/guides/`, så importeren aldrig
tager dem for rigtige guides.

## Flow

```
species.csv / varieties.csv          (kontrollerede fakta pr. art/sort)
        ↓  npm run guides:generate    [AI-lag — bygges næste]
content/guide-production/generated/*.json   (matcher guide-schema.json)
        ↓  npm run guides:build        ✅ FÆRDIG (deterministisk)
content/guides/*.md
        ↓  npm run guides:validate     ✅ FÆRDIG (niveau 1)
        ↓  npm run guides:review       [AI-lag — bygges næste]
        ↓  menneskelig godkendelse     (sikkerheds-fakta, se editorial-rules.md)
        ↓  npm run import:guides
DB
```

## Kommandoer

| Kommando | Hvad | Status |
|----------|------|--------|
| `npm run guides:build` | JSON → repoets markdown | ✅ bygget |
| `npm run guides:validate` | Niveau 1: felter, enums, dubletter, slug, parentSlug, sektioner, summary-længde | ✅ bygget |
| `npm run guides:generate` | CSV → AI → struktureret guide-JSON | ⏳ næste |
| `npm run guides:review` | Redaktionel AI-kontrol → fejl + risikoniveau | ⏳ næste |
| `npm run import:guides` | markdown → DB | ✅ findes |

## Rækkefølge (Annas princip)

1. **Artsguiden først** — den er det faglige fundament for alle sorter.
2. **Sortsguider derefter** — de får artsguidens fakta + sortens fakta og skriver
   KUN om forskellene. Ingen gentagelse, ingen modsigelser.

## De tre kvalitetsniveauer

1. **Automatisk** (`guides:validate`) — maskinen fanger struktur.
2. **Redaktionel AI** (`guides:review`) — markerer gentagelser, generisk sprog,
   art-stof i sortsguide, modstridende tal, tone. Omskriver ikke selv.
3. **Menneske** — verificerer sikkerheds-fakta (kalender, afstand, højde,
   hårdførhed, giftighed, spiselighed, sygdomme, latinsk navn).

## Billeder = separat spor

Guide-tekst og billeder blandes ikke. Se `editorial-rules.md` for de tre
billedtyper (frøkort / plantekort / artsguide-billede) og `BILLEDER.md` i roden
for hvor de placeres.
