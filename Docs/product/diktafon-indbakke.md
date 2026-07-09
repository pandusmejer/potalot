# Diktafonen = indbakke til haven (spec)

> Status: BESLUTTET af Anna 9. juli 2026. Ubygget. Kræver DB-migration +
> backend → køres som eget sprint i frisk tråd (jf. db_migration_handoff-reglen).
> Det visuelle lag (overskrift, breathing-mikrofon, status-chips, "Se alle"-
> header) er allerede bygget i `tal-til-din-have.tsx` (commit c883cbb).

## Kernebeslutning

Diktafonen må ikke være et løst lydarkiv. Den er **indgangen til loggen**:
brugeren taler frit, appen transskriberer og foreslår, hvad optagelsen kan
blive til, brugeren godkender. En indbakke til haven — ikke en formular.

```
1. Brugeren optager frit
2. Appen transskriberer (Claude)
3. Appen foreslår hvad det kan blive til
4. Brugeren godkender
```

Eksempel:
```
"Tomaterne ser trætte ud efter regnen."
Potalot foreslår:  [Føj til tomat-log] [Opret opgave] [Gem som observation] [Ignorer]

"Første tomat er ved at få farve."
Potalot foreslår:  [Gem som minde] [Føj til plante-log] [Marker som vendepunkt]
```

## Metadata-model (VIGTIGST)

**`recordedAt` er kilden til sandheden.** Behandler brugeren optagelsen 3 dage
senere, må appen IKKE flytte den til behandlingsdatoen. Historien i Havebog
bruger `recordedAt`.

```
recordedAt      = da brugeren optog          (kilde til historien)
processedAt     = da brugeren gjorde den aktiv
attachedToLogAt = da den blev føjet til log
```

Auto-gemt ved optagelse (brugeren udfylder ALDRIG dato/tid/sæson):
- createdAt (fuld timestamp) · lokal dato · lokal tid
- seasonId / sæsonnummer · seasonDay (fx DAG 098) · seasonStart
  (fra den aktive [[havebog_sprint]]-sæsonmodel, `beregnSaeson`)
- source: "voice" · status: "unprocessed" (default)

Når optagelsen føjes til log/minde/opgave/observation følger den oprindelige
metadata med (så appen ved *hvornår i sæsonen* observationen blev lavet).

Visning: kun menneskeligt ("I dag, 17.42" · "9. juli, 08.14"); detaljevisning
må vise "Sæson 1 · DAG 098".

## Status (vises som chip — allerede i UI)

`unprocessed`=Ikke behandlet · `log`=Føjet til log · `opgave`=Opgave oprettet ·
`minde`=Minde gemt · `observation`=Observation gemt.

## Arkiv ("Se alle")

Rute (fx `/havebog/optagelser`). Viser ALLE optagelser:
- dato/tid · transskription · lydafspilning · status
- filter: Alle / Ikke behandlet / Logs / Opgaver / Minder
- pr. optagelse: handlingsknapper (føj til log · gem som minde · opret opgave ·
  gem som observation · knyt til plante/sort/art)

"Se alle"-headeren i `tal-til-din-have.tsx` skal pege hertil, når ruten findes.

## Recording-state (animation, ubygget)

Idle breathing = bygget. Under optagelse: knap lidt større/mørkere, halo mere
aktiv men rolig, evt. waveform under knappen, "Optager…" + timer, mikrofon→stop.
Kræver client-recording-flow (TalOptager).

## Arbejdsdeling
- DB: ny tabel (voice_notes) m. ovenstående metadata + status + links.
- Backend: TalOptager live-flow (audio → upload → Claude-transskription →
  forslag → godkend → opret log/task/minde/observation m. medfølgende metadata).
- Frontend: arkiv-rute + filtre + afspilning + handlingsknapper.
- Havebog bruger `recordedAt` til historien (minder/vendepunkter/på-denne-dag).
