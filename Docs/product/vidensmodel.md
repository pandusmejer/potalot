# Vidensmodellen — hvordan Potalot lærer

> Status: V1.1 (13. juni 2026, Annas dom). Foundational. Læs FØR du bygger
> noget på guide-generering, admin-godkendelse eller bruger↔master-relation.
> V1.1 lukker videnscirklen (viden TILBAGE til brugeren) + tilføjer kildevægtning.

## Kerneprincippet

**Man promoverer ikke dokumenter. Man høster indsigter.**

Den forkerte model: bruger laver guide → admin godkender guide → guide bliver
master. Det ender med 47 næsten-identiske tomatguider og et godkendelses-
workflow der er "administration forklædt som produkt".

Den rigtige model: brugerguider forbliver **private for evigt**. Systemet
**udleder indsigter** (observationer, nye afsnit, forbedringer) fra dem og fra
brugernes faktiske erfaring. Indsigterne — ikke dokumenterne — er kandidater
til masterguiden. Masterguiden er **ét levende, versioneret dokument pr.
art/sort**, der vokser v1 → v2 → v17.

> Sådan fungerer Wikipedia, Stack Overflow og menneskelig læring: man promoverer
> indsigter, ikke hele dokumenter.

## De tre lag

### Lag 1 — Masterguiden (sandheden)
Den officielle Potalot-guide pr. art/sort. Botanik, såning, udplantning,
pasning, høst, problemer, tips. **Bliver hele tiden bedre.** Versioneret
(v1…vN) med changelog. I koden i dag: `guides` med `user_id = NULL`.

### Lag 2 — Din guide (eksemplaret)
Rasmus' Black Cherry. AI må her være langt mere personlig: sået 18. marts,
spirede på 5 dage, sat i sydsiden af drivhuset, første høst 22. juli. Unik.
**Forbliver altid privat** (`user_id` sat). Bliver aldrig master direkte.

### Lag 3 — Sammenligningslaget (magien)
Det er her brugeren får en grund til at vende tilbage:

```
DIN GUIDE              MASTERGUIDE
Spiret på 5 dage       Typisk 7-14 dage

DIN GUIDE              GENNEMSNIT
Første høst 22. juli   3. august
```

Og — som software-opdateringer:

```
Din guide bygger på Masterguide v12
Der findes nu v17 · 5 nye forbedringer siden sidst
[ Se hvad der er nyt ]
   • Nyt afsnit om revnede frugter
   • Nyt afsnit om beskæring
   • 4 nye brugerindsigter
```

Resultatet: brugeren får straks en personlig guide; Potalot lærer af tusindvis
af guider; masterguiden bliver stærkere; brugeren får automatisk glæde af
forbedringerne. Ingen "din guide blev godkendt/afvist" — det går normale
mennesker ikke op i. De går op i: *"Hjælper Potalot mig med at dyrke bedre
tomater i år end sidste år?"*

## Videnscirklen — og viden TILBAGE til brugeren

Det vigtigste afsnit i hele modellen. Uden det sker der noget mærkeligt:
brugeren giver viden, admin får viden, masterguiden bliver bedre — **men
brugeren mærker aldrig værdien.** Cirklen skal lukkes:

```
Bruger logger erfaring
        ↓
AI bygger privat guide
        ↓
Indsigt udledes
        ↓
Admin godkender
        ↓
Masterguide forbedres
        ↓
Forbedringen sendes TILBAGE til alle relevante dyrkere
        ↺
```

"Forbedringen tilbage" er ikke en notifikation om systemet — det er en konkret,
relevant gevinst, leveret i konteksten af brugerens egen sort:

```
Nyt i Black Cherry-guiden

12 dyrkere rapporterer bedre resultater
ved beskæring til to hovedstammer.

[ Se forbedringen ]
```

Reglen: **hver gang master bliver klogere af brugernes bidrag, skal de
relevante dyrkere kunne se og mærke det.** Det er forskellen på et produkt der
føles levende og et arkiv af halvfærdige AI-guider. Sammenligningslaget (lag 3)
er den daglige form; "Nyt i …-guiden" er begivenheds-formen.

## Vidensekstraktion → admin-køen

Admin ser **ikke** hele guider. Admin ser en **Videnskø** — et dashboard, ikke
notifikationer pr. hændelse:

```
VIDENSKØ (23 forslag)
Høj sikkerhed (12) · Mellem (8) · Lav (3)
──────────────────────────────────────────
Black Cherry
"Mange brugere rapporterer spiring efter 5-7 dage"
92% sikkerhed · Kilde: 17 private guider
[ Godkend ]  [ Redigér ]  [ Afvis ]
──────────────────────────────────────────
Korona
"Forlæng sæsonen med Malwina"          88% sikkerhed
[ Godkend ]  [ Redigér ]  [ Afvis ]
```

Hvert forslag = sort + indsigt + AI-confidence + provenance (antal kilder).
Godkend → indsigten flettes ind i masterguiden (ny version). Skalerer: 500
private Black Cherry-guider bliver til ~18 indsigter at gennemse, ikke 500
dokumenter.

## Kildevægtning (fremtidig regel)

Ikke alle observationer er lige meget værd. Et signal vægtes efter styrke:

```
1 bruger:    "Mine tomater spirede på 3 dage"   → interessant
17 brugere:  "Spiring 5-7 dage"                  → stærkt signal
243 brugere: "Spiring 6-8 dage"                  → meget stærkt signal
```

På sigt skal Potalot vægte indsigter efter:
- **antal observationer** (1 vs. 17 vs. 243)
- **geografi** (klimazone, landsdel)
- **drivhus vs. friland**
- **sort** (præcis match vs. beslægtet)
- **succesrate** (lykkedes dyrkningen?)

Så systemet ikke kun bliver **klogere**, men **mere præcist**. Confidence-tallet
i Videnskøen og styrken i "Nyt i …-guiden" udspringer af denne vægtning.

## Notifikationsmodel

**Aldrig pr. guide. Aldrig pr. hændelse.** "De bedste admin-systemer råber
ikke; de venter tålmodigt."

- **In-app:** en tæller på `/admin` — `VIDENSKØ (13)`. Det er det.
- **E-mail:** kun som **daglig eller ugentlig opsummering**, aldrig pr. hændelse.
  > Godmorgen Rasmus — 13 nye forslag: 4 tomat · 3 jordbær · 2 dahlia · 4 øvrige.

## Hvad brugeren får besked om
Når der auto-genereres en privat AI-guide til brugeren, skal de vide det — så
de ved hvad de kan gennemlæse og evt. notere på. Det er en let in-app besked om
*deres eget* private materiale, ikke et godkendelses-event.

## Guide-typeregel
Der oprettes **aldrig artsguides til sorter**. En sort-upload → en **sorts-guide
der matcher 1:1** med det uploadede (navn + sort). Findes der allerede en master
sorts-guide → genbrug den (og vis sammenligningslaget). Findes kun en artsguide →
det er IKKE et 1:1-match; generér en privat sorts-guide.

> Bug pr. juni 2026: `generateGuideWithAI` sætter altid `guide_level: 'art'`,
> også for sorter. Skal rettes.

## Datakilde-arkitektur — hvor sandheden bor (Annas dom, 13. juni 2026)

I den nuværende fase (få/ingen brugere, kataloget ændrer sig konstant) er et
levende ark mere værd end perfekt databasedisciplin:

```
Google Sheet  = SANDHEDEN (redaktionelt lag — mennesker kuraterer)
      ↓ import-script ("Sync fra Master Database")
Supabase      = produktionskopi / cache
      ↓
App           = visning (læser KUN Supabase)
```

- Ét Google Sheet **"Potalot Master Database"**. Faner: **Arts · Sorter ·
  Kalender · Billeder · Guides · Status**. Én række = én sort.
- Claude må: læse arket, validere, generere SQL/import, generere billedlister,
  generere guides, foreslå næste sorter — men **ikke eje data**. Mennesker
  ejer arket.
- **IKKE** repo-som-sandhed (endnu) og **IKKE** løse Excel-filer (de formerer
  sig). Når Potalot rammer 1.000+ sorter / 50.000 brugere kan sandheden flyttes
  til Supabase.

**Værktøjs-virkelighed (Google Drive-connector, juni 2026):**
- Claude kan **læse** ethvert Sheet fuldt ud → import-retningen (Sheet→app) er
  fuldt dækket.
- Claude kan **oprette** nye Drive-filer (CSV→Sheet, ét faneblad).
- Claude kan **ikke** skrive i celler i et eksisterende fler-fane-Sheet.
  "Claude opdaterer arket" = Claude leverer forslag/tilføjelser (gap-rapport,
  næste sorter, manglende botanik) som mennesket kuraterer ind — ikke direkte
  skrivning i masteren.

Dette er bindeleddet til vidensmodellen: hver række i "Sorter" = en master-guide
(Lag 1), og "Billeder"-fanen = frøkort/billed-roadmap.

## Launch-rækkefølge (nu → senere)

**Nu (lille, launch-relevant):**
1. AI-guides forbliver private. *(allerede tilfældet — ingen ændring nødvendig)*
2. Fix `guide_level` → sort + 1:1-match mod master sorts-guide.
3. Let in-app besked til brugeren: "Vi har lavet et udkast til din guide for X."

**Senere (stort, fler-systems — bygges når der er rigtige brugere):**
4. Vidensekstraktions-pipeline (AI → forslag m. confidence + provenance fra
   private guider + plant-logs).
5. `knowledge_candidates`-datamodel + admin-Videnskø-dashboard.
6. Master-guide-versionering (v1…vN + changelog).
7. Sammenligningslaget (din vs. master; "hvad er nyt siden vX").
8. Videnscirklen lukkes: "Nyt i …-guiden"-tilbageføring til relevante dyrkere.
9. Kildevægtning (antal/geografi/drivhus-friland/sort/succesrate) → fra
   "klogere" til "mere præcis".
10. Digest-mail (kræver e-mail-udbyder, fx Resend).

## Relaterede dokumenter
- `Docs/design-system/registrering.md` — autoudfyld alt; frø→sået→plante
- `Docs/design-system/guides.md` — guide-systemet
- `Docs/product/afledningsmotoren.md` — hvad Potalot kan udlede af data
- Hukommelse: frøbank-input-filosofi, vidensmodel
