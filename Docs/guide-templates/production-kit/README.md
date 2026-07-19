# Potalot Guide Production Kit

**Version: guide-contract-v1 · 2026-07-19**
Afledt direkte fra koden på `main` (importer, validator, schema, promoverede
guides). Portabelt: kan gives til enhver ny ChatGPT-session, så batches
produceres korrekt uden adgang til repoet og uden at gætte.

> Regenerér kittet, hver gang importeren/skemaet ændres, og hæv versionen.

---

## Formål

- **ChatGPT** producerer komplette masterguides som JSON — uden repo-adgang.
- **Claude** (i repoet) validerer, bygger preview, promoverer og importerer.
- **Menneske** godkender sikkerheds-fakta før import.

Rollerne må ikke blandes: ChatGPT gætter aldrig skemaet, Claude ændrer aldrig
godkendt tekst uden besked.

## Indhold

| Fil | Hvad |
|-----|------|
| `guide.schema.json` | **Autoritativt** JSON Schema (det importeren accepterer). |
| `field-reference.md` | Alle felter: type, obl./valgfri, enums, arv, null vs. udeladt. |
| `editorial-rules.md` | Redaktionelle regler: art/sort-deling, tone, længde, kilder, `:::`-blokke, dansk klima. |
| `examples/species-guide.example.json` | Promoveret **artsguide** (salat) — round-trip 1:1 mod live. |
| `examples/variety-guide.example.json` | Promoveret **sortsguide** (tomat-sungold) — round-trip 1:1. |
| `slug-inventory.json` | Alle eksisterende slugs (live/generated/built) + status → undgå dubletter. |
| `batch-manifest.schema.json` | Format for batch-leverancens manifest. |
| `validate-command.txt` | De præcise valideringskommandoer Claude kører. |
| `known-good-batch/` | Batch der har bestået parser + preview + QA (tomat-sungold + gardeners-delight). |
| `FOLDER-MAP.md` | Alle mapper: funktion + hvad der placeres hvor (guides + billeder). |

## Workflow (fuld kæde)

```
ChatGPT skriver JSON (matcher guide.schema.json)
        │  levér som ZIP + batch-manifest
        ▼
_guide-indbakke/            (drop JSON;  fotos i _foto-indbakke/)
        │  npm run guides:intake -- --dry-run     ← validér, se plan, skriv intet
        │  npm run guides:intake                  ← kør hele kæden:
        ▼
generated → build → PROMOTE (regression-guard) → preview → validate → import → master-sync
        ▼
content/guides/ (live) + IMPORTED_GUIDES (læse-lag) + public.guides (koblings-lag, auto-kobling)
```

- **Regression-guard:** promote BLOKERER, hvis en kandidat taber indhold
  (sektioner, `:::`-blokke, kilder, ikon-fakta) vs. en godkendt live guide.
  Nye slugs promoveres frit; opdatering af godkendt guide kræver `--update`.
- **Master-sync:** skriver master-rækker (`user_id NULL`) til DB, så en
  brugerplante auto-kobles til Potalot-guiden i stedet for et AI-udkast.
- **Billeder = separat spor** (se FOLDER-MAP.md) — blandes ikke med tekst.

## Sådan producerer ChatGPT en batch

1. Læs `guide.schema.json` + `field-reference.md` + `editorial-rules.md`.
2. Tjek `slug-inventory.json` — brug KUN nye slugs (undgå dubletter). Vil du
   opdatere en eksisterende, marker den `status: "update"` i manifestet.
3. Skriv **art før sort.** For hver sort: giv artens JSON med som kontekst, så du
   kun skriver forskellene (ingen gentagelse af arten).
4. Brug `examples/` som den kanoniske form (sektioner, `:::fact`, `:::next-guide`).
5. Research rigtige kilder → `sourceLinks`. Forkort aldrig; ingen placeholders.
6. Lever **én ZIP**: `<slug>.json`-filer + `batch-manifest.json`
   (matcher `batch-manifest.schema.json`) + en kildeoversigt.

## Sådan modtager Claude en batch

1. Udpak til `_guide-indbakke/`; `npm run guides:intake -- --dry-run`.
2. Rapportér KUN konkrete fejl (schema, blokke, links, hierarki, rendering).
3. Efter menneskelig godkendelse: `npm run guides:intake` (promote→import→sync).
4. Ændrer ALDRIG godkendt tekst uden besked.

## Vigtigt

- `botaniskeKendetegn` og `pluralName` findes i nogle håndskrevne arts-guides,
  men er **ikke** i skemaet — brug dem ikke i batch-JSON (afvises).
- Alle 6 promoverede batch-guides (salat, hvidloeg, salat-little-gem,
  tomat-sungold, tomat-gardeners-delight, tomat-san-marzano) matcher dette skema.
