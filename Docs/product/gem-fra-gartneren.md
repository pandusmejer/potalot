# Gem fra Gartneren — personlig, kontekstbundet viden (spec, Anna 10/8 2026)

**Status: SPEC — kræver DB-migration. Byg i en frisk tråd (jf. migrations-reglen: aldrig ad-hoc mod live DB).**

## Idéen

Gartner-svar indeholder ofte viden, brugeren vil kunne finde igen ("Hvornår er
Green Zebra moden?"). Ikke ved at auto-gemme alle samtaler (så bygger vi endnu
et arkiv, ingen rydder op i) — men med **én diskret handling** på svaret:

> `Gem til senere` → `✓ Gemt`

Lille tekst-handling nederst i svarkortet, samme register som de øvrige
teksthandlinger (Log denne vurdering / Opret som opgave). Ingen stor CTA.

## Hvad gemmes

**Altid spørgsmål + svar sammen** — aldrig kun svaret (ellers finder brugeren
"Når de er klar til høst…" om tre måneder og tænker: *når hvad er klar?*).

Ét objekt:
- Spørgsmål (eller det auto-genererede vurderings-spørgsmål)
- Gartnerens svar (ordret)
- Kontekst: `guide_id` (art eller sort) og/eller `plant_id` — det svaret blev
  stillet fra. Guides-forsiden: ingen automatisk binding, medmindre svaret
  resolver til en faktisk guide (genbrug `resolveGuideLink`).
- Dato

## Hvor det vises

1. **Guides → "Gemt fra Gartneren"**: brugerens personlige liste
   (spørgsmål · kontekst · dato). Det personlige videnslag oven på det
   redaktionelle bibliotek.
2. **På selve guiden**: diskret "Dine gemte noter · 1" — tryk folder de gemte
   spørgsmål/svar ud. Potalot bringer brugerens viden tilbage i den
   sammenhæng, hvor den er nyttig.

## Hård adskillelse (vigtigst efter "hvid fluesmaddike"-fundet)

**Potalots guide = redaktionel, kontrolleret viden. Gemt fra Gartneren =
brugerens personlige noter.** Gemte AI-svar må ALDRIG injiceres mellem
guidens redaktionelle sektioner eller få samme visuelle autoritet som
guide-indholdet. Egen sektion, eget (nedtonet) register.

## Teknik (anbefaling)

Ny tabel `gartner_saved` frem for et flag på `ai_conversations` (klienten
kender ikke conversation-id'et — insert sker server-side efter stream; en
dedikeret tabel lader klienten gemme direkte med det, den allerede har):

```sql
create table gartner_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  question text not null,
  answer text not null,
  guide_id text,          -- valideres mod guide-inventory i server action
  plant_id uuid references plants on delete set null,
  created_at timestamptz not null default now()
);
-- + RLS: user_id = auth.uid() på alt
```

Server action `saveGartnerSvar` validerer `guide_id` mod GUIDE_FACTS før
insert. UI: handlingen ind i `EfterHandlinger`/svarkortet i
`src/components/ai/gartner-svar.tsx` (kræver at kortet kender spørgsmålet og
evt. guideId — begge findes allerede i `GartnerKontekst`/kaldstedet).

## Rækkefølge

Efter den låste videre-rækkefølge (Spørg Gartneren videre → problemfoto →
universel foto) — eller som selvstændig lille bid, hvis Anna prioriterer den
op. Migration + feature i samme friske tråd.
