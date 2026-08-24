# Audit: `sowing_depth_mm = 0` (24/8 2026)

Baggrund: `sowing_depth_mm INTEGER NOT NULL DEFAULT 0` (migration 00016) +
mapperens `row.sowing_depth_mm ?? 0` gjorde tre tilstande til én værdi:
"aldrig angivet", "Potalot ved det ikke" og "skal overfladesås". Frøbanken
påstod derfor **"Sådybde: 0 mm (overflade)"** på poser, hvor ingen havde
sagt det. Bryder reglen *ukendt er bedre end opdigtet præcision*.

## Census (live DB, 24/8 2026)

| | antal |
|---|---|
| `inventory_items` i alt | 43 |
| `sowing_depth_mm = 0` | 28 |
| `sowing_depth_mm > 0` | 15 |
| `sowing_depth_mm IS NULL` | 0 (kolonnen var NOT NULL) |
| brugere | 3 |

## Kan et 0 være ægte brugerdata?

Fire skriveveje kan sætte feltet. Tre af dem kan i princippet skrive et
*eksplicit* 0:

1. **Guide-autofill** — kan IKKE. Ingen af bibliotekets 176 guides har
   `sowingDepthMm: 0` (16 har en positiv værdi, 160 har feltet udeladt).
2. **Manuel indtastning** — kan (feltet er `min={0}` med placeholder
   "0 = overflade", editerbart siden 8a553f1, 4/5 2026).
3. **Foto-scanning (AI)** — kan. `seed-packet-extract.ts` er eksplicit
   instrueret i at bruge `0`, ikke `null`, ved overfladesåning.
4. **Excel/link-import** — kan, men kun ved entydigt "0 mm". Intervaller
   ("2-5 mm") efterlades allerede tomme.

Vej 3 er den eneste, der har efterladt spor: den kræver et uploadet foto.

## Fordeling af de 28 nuller

| | antal | vurdering |
|---|---|---|
| uden foto (`primary_image_url IS NULL`) | 25 | **implicit default** |
| med foto (AI-scanning kan have kørt) | 3 | **kan ikke afgøres af data** |

### De 25 uden foto — hvorfor de er sikre

- To rene **batch-inserts** (Excel-import) skrev 7 og 6 rækker på samme
  mikrosekund (2026-08-20 19:35:30 og 20:00:03). Alle fik 0. Ingen taster
  "0 mm" tretten gange i samme millisekund.
- Resten er enkeltoprettelser 2-5 sekunder fra hinanden (2026-07-16
  07:43:57 → 07:44:25) — link/scan-tempo, ikke overvejelse af sådybde.
- Arterne modsiger et bevidst 0: Ært (artsguiden siger 30 mm), Squash,
  Lupin, Artiskok, Rabarber, Tomat ×7. Ingen overfladesår ærter.

Konklusion: 0 er her DB-defaulten, ikke et svar. Migreres til `null`.

### De 3 med foto — holdes urørt indtil Anna har set dem

Alle tre er AI-scannede (noterne er tydeligt poselæst tekst):

| pose | oprettet | vurdering |
|---|---|---|
| Stangbønne 'Cobra' | 8/5 | Bønner sås 25-50 mm dybt (artsguiden `boenne` siger 50). Samme bruger har en anden Cobra-pose med 25 mm. **Sandsynligvis default** — men `stangboenne` har ingen egen guide, så det kan ikke bevises af data. |
| Brøndkarse | 14/5 | Brøndkarse sås reelt på/lige under overfladen. **0 kan være ægte.** |
| Akshindebæger 'Pink Pokers' (statice) | 31/5 | Lyspirer, sås meget lavt. **0 kan være ægte.** |

Handling: ingen. De står som `0` og vises derfor "Sås på overfladen".
Posefotos ligger stadig på posterne, så værdien kan verificeres mod
posen. Skal de nulstilles, er det en separat, bevidst beslutning.

## Tilbagerulning

Migrationen sætter kun `0 → null`. Rulles tilbage med:

```sql
UPDATE inventory_items SET sowing_depth_mm = 0 WHERE id IN (
  '7dda29cd-45b6-4269-a84f-27f65539b877','4d70a390-fe1d-41af-917a-5c4aac2326a5',
  '790765ef-48eb-41ba-a85f-00f100dcceb6','47000fe0-7057-4cbc-96b7-379aa5492d1b',
  'ea3dc776-0b7d-4179-b10c-c26f69fdf87d','ebbbc8c7-2f6e-4b3a-9ec0-9b485a7695b1',
  '8e23252f-8e7b-4c5e-a3b4-6bb6422a4151','b106ab91-4983-4271-a77c-12ad38ec03d9',
  '51bd0535-a07b-49b3-8192-8ab45ca22693','4a9667f7-74f5-4795-9935-51290f9d46f9',
  'd79c0561-5a46-4b33-95a3-c01fd4b828db','a54acc45-8b47-4d5f-8059-e3e1040fe889',
  '2551135a-a370-448d-93f9-cbb7cce77605','2b2419de-f412-45e6-9f15-7130b54ce98c',
  'b225f7ee-d891-4936-a77c-4dade4442e18','d9c2e9d4-6a69-479d-b96b-ebaa0856e70e',
  '04839887-529e-46a0-abda-0668d39b3d5b','828f7fd4-c02c-4c13-abae-346ad2a72a43',
  'a1737690-e5cf-4fa1-8cf3-7f994d3a7012','3ff527f5-51df-4bbd-aa05-a58e2718dbed',
  '99b9eb25-df99-42b8-b262-303ce836ada7','075c8538-3340-491e-ace2-0b73d8278cf4',
  'aa742aca-71e6-4c18-b4a1-71939e217fc3','d09a9cdd-9f7f-46f9-8a2f-a10836edd70f',
  '92635b57-c19b-4b28-a431-ef85a8446fa6'
);
```

## Ny semantik (LÅST)

- `null` = ukendt / ikke angivet → feltet vises ikke
- `0` = eksplicit overfladesåning → **"Sås på overfladen"** (ikke "0 mm")
- `> 0` = "Sådybde: 5 mm"

Kun `sowing_depth_mm` ændres. Ingen andre dyrkningsfelter gøres nullable.
