# Spisekammer & Forvandlinger — hierarki (produktregel)

**Beslutning (Anna, 12/7):** Efter at Forvandlinger er blevet bredere, er
Spisekammer IKKE længere en selvstændig hovedidé/Havebog-sektion. Ellers har
vi to sektioner der svarer på næsten samme spørgsmål.

## Hierarkiet

```
Forvandlinger = det brede system
  Spis · Gem · Tør · Bryg · Duft · Plej · Pynt · Så igen

Spisekammer = en vinkel/filter INDE i Forvandlinger
  Spis + Gem + Tør + Bryg     (den spiselige/opbevarende del)
```

Spisekammer beholdes som **begreb**, men flyttes ned i hierarkiet. Det er ikke
en motor; det er en samling inden for Forvandlinger.

## Hvor tingene bor

**Havebog** — præcis ÉT modul: **"Det kan haven blive til"**
- En kurateret PREVIEW af Forvandlinger (ikke en separat motor).
- 4-6 tiles valgt ud fra brugerens afgrøder/høst/frøbank/sæson.
- Må blande spiselige og ikke-spiselige forvandlinger, fx: Tomatsauce på glas ·
  Gem tomatfrø · Tør basilikum · Lav lavendelposer · Jordbærsorbet.
- Hver tile → `/havebog/forvandlinger/[id]`. CTA: **"Se alle forvandlinger"**.
- Må gerne have mosaik/Spisekammer-energi visuelt — men det er en preview.
- Komponent: `src/components/havebog/spisekammer.tsx` (rum-id `spisekammer`).

**Forvandlinger-siden** (`/havebog/forvandlinger`) — hele systemet
- Kategorier: Alle · Spis · Gem · Tør · Bryg · Duft · Plej · Pynt · Så igen.
- Evt. samling **"Spisekammer"** = filter (Spis + Gem + Tør + Bryg).

**Sæsonarkiv/Profil (senere)** — "Sæsonens spisekammer" som historik
- Først når vi har mængder + gemte links + gemte forvandlinger + brugerens egne
  resultater. Ikke nu (ellers pyntetal).

## Forbud
- IKKE tre parallelle Havebog-moduler (Spisekammer + Forvandlinger + "Det kan
  haven blive til"). Én samlet model.
- IKKE dobbelt motor.
- IKKE pyntetal ("18 jordbær") hvis det kun er høstlogs — vis kun navne når
  mængden ikke er ægte (`antalErHoester`).
- IKKE opskriftsapp-følelse.

## Status i koden (12/7)
Arkitekturen matcher allerede: der er INGEN separat Forvandlinger-rum — kun
"Det kan haven blive til"-modulet, hvis tiles linker til `/havebog/
forvandlinger/[id]`. Rettet nu: CTA "Flere idéer" → "Se alle forvandlinger".
Se også [[vidensmodel]] (Docs/product/vidensmodel.md).
