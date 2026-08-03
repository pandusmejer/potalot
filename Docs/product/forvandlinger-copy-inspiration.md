# Forvandlinger — mere inspirerende copy uden redesign

Status: SPEC (skrevet 3/8 2026). Ingen kodeændringer endnu.
Omfang: KUN tekst i datafiler + evt. én lille intro-linje. Intet redesign.

---

## 1. Hvad er allerede bygget (status pr. 3/8)

Forvandlinger-systemet er langt mere færdigt, end opgaveoplægget antager.
Layout, mosaik, detail-sider og kategorisystem findes og er låst i drift:

| Oplæggets punkt | Virkelighed i koden |
|---|---|
| Masonry/grid-mosaik med kort | BYGGET — `src/components/havebog/spisekammer.tsx`. To tilstande: `blivetil` (drøm-mosaik for nye brugere, redaktionens valg pr. måned, C8/9-commit `be4ad8e`) og `strong` (personlig, ud fra brugerens høst). |
| Forvandlingskort med beskrivelse | DELVIST. Kortene viser i dag KUN kategori-eyebrow + titel + "X forslag"-chip. Der findes et `description`-felt på `BASIS_MOSAIK`-elementerne, og det er allerede skrevet i drømme-tonen ("Én moden tomat kan blive starten på næste sæson") — men det RENDERES INGEN STEDER. Kommentaren siger "Vises på detail-siden", hvilket ikke passer (detail-siden bruger `body`). |
| Åbnet forvandling med intro | BYGGET — `/havebog/forvandlinger/[id]` viser kategori-chip, titel, "Brug" (afgrøder), **"Hvorfor nu"** (= `body`-feltet, én sætning — det ER intro-pladsen), "Sådan gør du" (trin) og "Næste handling" (ekstern søgning). Ingen ny komponent behøves til P1. |
| Kortenes CTA'er | BYGGET — tiles linker til detail-siden; detail-siden har "Find opskrift/fremgangsmåde" + foreslåede søgninger. ("Tilføj til ønskelisten" fra en forvandling findes IKKE som knap i dag — Kom godt i gang peger blot mod Forvandlinger. Uden for denne opgave.) |
| Indhold | 29 forvandlinger i `FORVANDLINGER` (9 kategorier) + 8 basis- og 3 ekstra-mosaik-elementer. Foto-system med farve-fallback virker. |
| Drikke-kortet fra oplægget | FINDES IKKE. Der er ingen drikke-forvandling i kataloget (nærmest: spiselige blomster nævner isterninger). Annas valgte sætning kræver altså én NY datapost — ren data, intet design. |

**Konklusion:** Opgaven er reelt en ren copy-opgave i ÉN fil
(`src/lib/havebog-forvandlinger.ts`) plus én lille beslutning om at rendere
det eksisterende `description`-felt. Alt andet står allerede.

---

## 2. Forklaring — hvad opgaven egentlig er

Kortene og siderne fungerer. Problemet er tonen i `body`-felterne: en del
beskriver ingrediensen eller processen ("Klip basilikum før planten går i
blomst", "Modne tomater smager bedst lige plukket") i stedet for resultatet
og drømmen ("Drømmer du om hjemmelavet sorbet på egne bær?").

Tre tekstflader bærer hele oplevelsen:

1. **`title`** — det eneste tekstlag på kortet i mosaikken. Skal være
   konkret resultat ("Tomatsauce på glas", ikke "Tomater").
2. **`body`** — vises som "Hvorfor nu" øverst på den åbnede forvandling.
   Dét er drømme-introen. Skal omskrives til resultat-først.
3. **`description`** (kun BASIS_MOSAIK/EKSTRA) — allerede i den rigtige
   tone, men død kode i dag. Enten renderes den (én linje), eller også
   flyttes dens bedste formuleringer ind i `body` og feltet forbliver
   reserve.

## 3. Grundprincip

> Et forvandlingskort beskriver **resultatet**, ikke ingrediensen.

- ❌ "Brug frugt og krydderurter til at dekorere forskellige typer drikke."
- ✅ "Forskøn vand, drinks og cocktails med frugt, blomster og krydderurter fra haven."

Tone: konkret · inspirerende · jordnær · rolig. En erfaren havemakker giver
en idé. FORBUDT: reklamesprog, superlativer, "fantastisk", "ultimativ",
"magisk". Copy siger altid "kan blive", aldrig "er blevet" (eksisterende
produktregel i `blivetil`-tilstanden).

Typisk længde: én sætning. Gerne spørgsmålsform når det åbner en drøm
("Drømmer du om …?").

## 4. Hvad der IKKE må ske

- Ingen nye komponenter, korttyper, layouts, sektioner eller større billeder.
- Ingen ændring af mosaik-logik, tile-størrelser, farver, typografi, spacing,
  navigation eller asset-fallback.
- Ingen ændring af `steps` ud over toneharmonisering (P2) — trinene er
  proces og SKAL forblive proces.
- Ingen migrations, ingen nye CTA'er/knapper.

## 5. Opgaver

### P0 — omskriv `body` på eksisterende forvandlinger (resultat frem for ingrediens)

Fil: `src/lib/havebog-forvandlinger.ts`, array `FORVANDLINGER`.
Gennemgå alle 29 poster. Omskriv dem, hvor `body` beskriver ingrediens,
tilstand eller proces, til én resultat-/drømme-sætning. Godkendte eksempler
(Annas retning):

| Forvandling | Ny `body` (retning) |
|---|---|
| jordbaersorbet | Drømmer du om hjemmelavet jordbærsorbet på egne bær? |
| lavendelposer | Fyld skabe og skuffer med duften af tørret lavendel fra haven. |
| spiselige-blomster | Pynt salater, desserter og drinks med blomster, du selv har dyrket. |
| tomatsauce | Fyld spisekammeret med hjemmelavet tomatsauce af sommerens høst. |

Poster der allerede rammer tonen (fx `guleroedskage`, `jordbaersorbet` er
tæt på) justeres let eller lades stå. Bevar sæson-krogen hvor den findes
("lige nu", "i sommervarmen") — den må bare ikke stå ALENE uden resultatet.

### P0b — NY forvandling: drikke (ren data, intet design)

Tilføj én post til `FORVANDLINGER` (kategori `pynt` eller `bryg` — anbefalet
`pynt`, den handler om at forskønne, ikke at brygge):

- id: `pynt-til-drikke` · title: fx "Pynt til drikke" / "Fra haven til glasset"
- body (Annas valgte sætning, LÅST): **"Forskøn vand, drinks og cocktails med
  frugt, blomster og krydderurter fra haven."**
- crops: fx `mynte`, `jordbaer`, `agurk`, `morgenfrue` (findes alle i
  crop-nøglerne) · 3 enkle steps (pluk/skyl → frys evt. i isterninger →
  læg i glasset) · season: `summer`.

Intet foto kræves — asset-systemet falder pænt tilbage til kategorifarve.
Skal den med i en måneds mosaik, tilføjes den i `EKSTRA_MOSAIK_ELEMENTER`
+ `REDAKTIONENS_VALG` for sommermånederne (valgfrit, Annas kald).

### P1 — gør `description`-feltet levende (én af to veje, Annas valg)

`BASIS_MOSAIK`/`EKSTRA_MOSAIK_ELEMENTER` har allerede drømme-beskrivelser,
der aldrig vises. Vælg:

- **Vej A (mindst):** Flyt de bedste formuleringer ind i de tilsvarende
  `FORVANDLINGER.body` (så detail-siden viser dem) og lad kortet forblive
  titel-alene. Nul UI-ændring.
- **Vej B (lille):** Render `el.description` som én diskret linje UNDER
  titlen — KUN på lead-tilen (`stor === true`), hvor der er plads. Samme
  typografi-register som eksisterende chip-tekst. Ingen andre tiles røres.

Anbefaling: Vej A nu; Vej B kun hvis Anna ønsker mere tekst på selve kortet.

### P2 — konsistens-gennemgang

Én gennemlæsning af alle `body` + `description` + oversigtssidens manchet
("Inspiration til det, haven kan blive til.") for samme tone. Tjek også de
tre `EKSTRA_MOSAIK_ELEMENTER` og `BASIS_MOSAIK`-beskrivelserne mod
forbudslisten (ingen superlativer). `steps` røres kun ved åbenlyse tonebrud.

## 6. Verifikation

1. **Kort:** I mosaikken (både `blivetil` og `strong`) skal titlen alene
   fortælle, hvad man kan skabe. Ingen titel må være en råvare uden resultat.
2. **Åbnet forvandling:** "Hvorfor nu"-blokken skal få læseren til at se
   resultatet for sig — ikke beskrive processen (den bor i "Sådan gør du").
3. **Konsistens:** Læs alle 30 `body`-felter i træk — samme rolige,
   konkrete stemme hele vejen. Ingen ord fra forbudslisten.
4. `npx tsc --noEmit` + `npm test` grønne. Ingen diff uden for
   `src/lib/havebog-forvandlinger.ts` (+ evt. én linje i `spisekammer.tsx`
   ved Vej B).
5. Visuel spot-check @390px: mosaikken på `/` og 2-3 detail-sider — layout
   pixel-identisk (kun tekst ændret).

---

## 7. Klar-til-brug prompt (kør i frisk tråd)

```
Opgave: Forvandlinger — mere inspirerende copy UDEN redesign.

Læs først Docs/product/forvandlinger-copy-inspiration.md (hele specen) og
src/lib/havebog-forvandlinger.ts.

Udfør P0 + P0b + P1 (Vej A) + P2 fra specen:
1. Omskriv body-felterne i FORVANDLINGER så de beskriver RESULTATET/drømmen,
   ikke ingrediensen eller processen. Én sætning. Brug de fire godkendte
   eksempler i specen som tone-anker. Rolig, konkret, jordnær — ALDRIG
   reklamesprog, superlativer, "fantastisk", "ultimativ", "magisk".
2. Tilføj én ny forvandling 'pynt-til-drikke' (kategori pynt) med den låste
   body-sætning: "Forskøn vand, drinks og cocktails med frugt, blomster og
   krydderurter fra haven."
3. Flyt de bedste BASIS_MOSAIK-description-formuleringer ind i de
   tilsvarende FORVANDLINGER.body (Vej A). Ingen UI-ændringer.
4. Konsistens-læs alle body/description-felter i én omgang.

HÅRDE REGLER: ingen nye komponenter/korttyper/layouts/CTA'er, ingen ændring
af mosaik-logik, tiles, farver, typografi eller steps-struktur. Kun tekst i
src/lib/havebog-forvandlinger.ts. Ingen migrations.

Verifikation: tsc + npm test grønne; diff kun i den ene fil; spot-check
mosaikken på / og 2-3 forvandlings-detailsider @390px (layout uændret).
Commit direkte på main (jf. CLAUDE.md-arbejdsgangen), push ikke.
```
